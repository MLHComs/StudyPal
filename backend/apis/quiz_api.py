import os, json, re
from typing import Callable, Optional, List, Dict, Any

from dotenv import load_dotenv
from fastapi import Body
from sqlalchemy import select, update
from sqlalchemy.orm import Session
from openai import OpenAI

from models import Course, Quiz, QuizQuestion
from datetime import datetime, timezone


load_dotenv()

_SESSION_FACTORY: Optional[Callable[[], Session]] = None
def set_session_factory_for_quiz(factory: Callable[[], Session]) -> None:
    global _SESSION_FACTORY
    _SESSION_FACTORY = factory

def _fail(msg: str):
    return {"status": "FAIL", "statusCode": 200, "message": msg, "data": ""}

def _success(data_str: str, message: str = ""):
    return {"status": "SUCCESS", "statusCode": 200, "message": message, "data": data_str}

_api_key = os.getenv("OPENAI_API_KEY")
_client = OpenAI(api_key=_api_key) if _api_key else None

_FORBIDDEN = {  # reject low-quality distractors
    "correct", "none of these", "not applicable", "i'm not sure",
    "all of the above", "none of the above", "both a and b"
}

def _bad_options(opts: List[str]) -> bool:
    if len(opts) != 4: 
        return True
    for o in opts:
        s = o.strip().lower()
        if not s or any(bad in s for bad in _FORBIDDEN):
            return True
        if len(s) > 120:  # keep choices short
            return True
    return False

def _call_model_json(system: str, user: str) -> str:
    if not _client:
        raise RuntimeError("OPENAI_API_KEY missing")

    # Prefer Responses API; fallback to Chat Completions
    try:
        if hasattr(_client, "responses"):
            resp = _client.responses.create(
                model="gpt-4o-mini",
                input=[{"role":"system","content":system},
                       {"role":"user","content":user}],
                response_format={"type":"json_object"},
                temperature=0.4,
            )
            return getattr(resp, "output_text", "") or ""
        raise AttributeError
    except (TypeError, AttributeError):
        chat = _client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role":"system","content":system},
                      {"role":"user","content":user}],
            response_format={"type":"json_object"},
            temperature=0.4,
        )
        return (chat.choices[0].message.content or "").strip()

def _parse_json(raw: str) -> dict:
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", raw, flags=re.S)
        if not m:
            raise
        return json.loads(m.group(0))

# ---------------- POST /courses/{course_id}/quiz ----------------
def create_or_replace_quiz(course_id: int, params: dict = Body(default={})):
    if _SESSION_FACTORY is None:
        return _fail("Server misconfigured: no DB session factory is set.")

    # 1) load course
    with _SESSION_FACTORY() as db:
        row = db.execute(
            select(Course.course_name, Course.course_content).where(Course.course_id == course_id)
        ).one_or_none()
    if not row:
        return _fail(f"Course id={course_id} not found")

    cname, content = row
    content = (content or "").strip()
    if not content:
        return _fail("Course has no content")

    # 2) ask model (with strict FITB rules)
    base_system = (
        "You are a careful quiz generator for students.\n"
        "Return ONLY one JSON object with shape:\n"
        '{\"questions\":[{\"type\":\"mcq|fitb\",\"question\":\"...\",\"options\":[\"...\",\"...\",\"...\",\"...\"],\"correct_index\":0}]}\n'
        "Rules:\n"
        "- Exactly 10 questions total (mix mcq and fitb; fitb has a single '____' in the question text).\n"
        "- For FITB: choose a concrete term/phrase FROM THE CONTENT as the correct option; "
        "make 3 plausible domain-specific distractors. Do NOT use meta options like 'Correct', "
        "'None of these', 'Not applicable', 'I'm not sure', 'All of the above'.\n"
        "- Each question MUST have 4 short distinct options; exactly one correct.\n"
        "- correct_index is an integer 0..3. No commentary/backticks; JSON only."
    )
    user = f"Create a quiz from this course content (trimmed):\n\n{content[:6000]}"

    try:
        raw = _call_model_json(base_system, user)
        data = _parse_json(raw)
    except Exception as e:
        return _fail(f"Quiz generation failed during model call: {type(e).__name__}")

    def _normalize(data_obj: dict) -> List[dict]:
        qs = data_obj.get("questions")
        if not isinstance(qs, list) or len(qs) != 10:
            raise ValueError("Expected exactly 10 questions")
        out = []
        for i, q in enumerate(qs, start=1):
            if not isinstance(q, dict): raise ValueError(f"Q{i} not object")
            qtype = str(q.get("type","")).lower().strip()
            if qtype not in {"mcq","fitb"}: raise ValueError(f"Q{i} invalid type")
            qtext = str(q.get("question","")).strip()
            if not qtext: raise ValueError(f"Q{i} empty question")
            opts = q.get("options")
            if not isinstance(opts,list) or _bad_options([str(o) for o in opts]):
                raise ValueError(f"Q{i} options invalid")
            ci = q.get("correct_index")
            try: ci = int(ci)
            except: raise ValueError(f"Q{i} correct_index invalid")
            if ci not in (0,1,2,3): raise ValueError(f"Q{i} correct_index out of range")
            out.append({
                "question_index": i,
                "question_type": qtype,
                "question_text": qtext,
                "options_json": json.dumps([str(o).strip() for o in opts], ensure_ascii=False),
                "correct_index": ci,
            })
        return out

    try:
        normalized = _normalize(data)
    except Exception:
        # One retry with an explicit correction message
        retry_user = user + (
            "\n\nYour previous options contained generic/invalid choices. "
            "Regenerate following the rules strictly; options must be concrete domain terms."
        )
        try:
            raw2 = _call_model_json(base_system, retry_user)
            data2 = _parse_json(raw2)
            normalized = _normalize(data2)
        except Exception as e:
            return _fail(f"Quiz generation failed after retry: {type(e).__name__}")

    # 3) persist as a NEW quiz (no replacement)
    with _SESSION_FACTORY() as db:
        # quiz = Quiz(course_id=course_id)   # always new
         # Title: use client-provided title or generate a nice default
        user_title = (params or {}).get("quiz_title")
        if isinstance(user_title, str):
            user_title = user_title.strip()
        if not user_title:
            # e.g., "Requirements Eng. – Quiz (2025-11-01 14:05)"
            short_cname = (cname or "").strip()[:32]
            # ts = datetime.now(timezone.utc).astimezone().strftime("%Y-%m-%d %H:%M")
            user_title = f"{short_cname} - Quiz" if short_cname else f"Quiz"
 
        quiz = Quiz(course_id=course_id, quiz_title=user_title, is_submitted=False)  # created_at auto
        db.add(quiz)
        db.flush()  # get quiz_id

        for q in normalized:
            db.add(QuizQuestion(
                quiz_id=quiz.quiz_id,
                question_index=q["question_index"],
                question_type=q["question_type"],
                question_text=q["question_text"],
                options_json=q["options_json"],
                correct_index=q["correct_index"],
            ))
        db.commit()
        quiz_id = quiz.quiz_id

    # payload = {"quiz_id": quiz_id, "course_id": course_id, "questions_saved": 10}
    # return _success(json.dumps(payload), f"New quiz created for course_id={course_id}.")
    payload = {
        "quiz_id": quiz_id,
        "course_id": course_id,
        "quiz_title": user_title,
        # created_at is DB default; fetch it to return
    }
    # fetch created_at to return
    with _SESSION_FACTORY() as db:
        row = db.execute(select(Quiz.created_at).where(Quiz.quiz_id == quiz_id)).one()
        payload["created_at"] = row[0].isoformat() if row and row[0] else None
        payload["questions_saved"] = 10
    return _success(json.dumps(payload), f"New quiz created for course_id={course_id}.")



# GET /courses/{course_id}/quizzes  -> list quiz ids
def list_quizzes_for_course(course_id: int):
    if _SESSION_FACTORY is None:
        return _fail("Server misconfigured: no DB session factory is set.")
    with _SESSION_FACTORY() as db:
            rows = db.execute(
            select(Quiz.quiz_id, Quiz.quiz_title, Quiz.created_at, Quiz.correct_count)
            .where(Quiz.course_id == course_id, Quiz.is_submitted == True)
            .order_by(Quiz.created_at.desc())
        ).all()
    items = [
        {
            "quiz_id": r[0],
            "quiz_title": r[1],
            "created_at": (r[2].isoformat() if r[2] else None),
            "correct_count": r[3],
        }
        for r in rows
    ]
    return _success(
        json.dumps({"course_id": course_id, "quizzes": items}),
        f"Found {len(items)} quizzes for course_id={course_id}."
    )

# GET /quizzes/{quiz_id} -> questions of a single quiz
def get_quiz_by_id(quiz_id: int):
    if _SESSION_FACTORY is None:
        return _fail("Server misconfigured: no DB session factory is set.")
    with _SESSION_FACTORY() as db:
        meta = db.execute(
            select(Quiz.quiz_title, Quiz.created_at, Quiz.is_submitted, Quiz.correct_count)
            .where(Quiz.quiz_id == quiz_id)
        ).one_or_none()
        
        rows = db.execute(
            select(
                QuizQuestion.question_index,
                QuizQuestion.question_type,
                QuizQuestion.question_text,
                QuizQuestion.options_json,
                QuizQuestion.correct_index,
                QuizQuestion.student_selected_index,
            ).where(QuizQuestion.quiz_id == quiz_id)
             .order_by(QuizQuestion.question_index.asc())
        ).all()
    if not rows:
        return _fail(f"No questions found for quiz_id={quiz_id}")
    quiz_title = meta[0] if meta else None
    created_at = meta[1].isoformat() if (meta and meta[1]) else None
    is_submitted = bool(meta[2]) if (meta and meta[2] is not None) else False

    questions = []
    for idx, qtype, qtext, opts_json, ci, sel in rows:
        try:
            options = json.loads(opts_json)
        except Exception:
            options = []
        questions.append({
            "question_index": idx,
            "type": qtype,
            "question": qtext,
            "options": options,
            "correct_index": ci,
            "student_selected_index": sel,
        })

    correct_count = meta[3] if meta else None

    return _success(
       json.dumps({
           "quiz_id": quiz_id,
           "quiz_title": quiz_title,
           "created_at": created_at,
           "is_submitted": is_submitted,
           "correct_count": correct_count,
           "questions": questions
       }),
        f"Quiz {quiz_id} fetched. is_submitted={is_submitted}"
    )



def _validate_choice(idx: Any) -> int:
    try:
        v = int(idx)
    except Exception:
        raise ValueError("student_selected_index must be an integer")
    if v not in (0, 1, 2, 3):
        raise ValueError("student_selected_index must be 0..3")
    return v



# ---------------- POST /quizzes/{quiz_id}/answers ----------------
def submit_quiz_answers(
    quiz_id: int,
    answers: List[Dict[str, Any]] = Body(default=[]),
):
    """
    Request body (array):
    [
      {"quiz_id": 3, "question_index": 2, "student_selected_index": 1},
      ...
    ]
    - All items must reference the same quiz (path {quiz_id}).
    - Upserts student's selected index for each question.
    - Overwrites previous selection if already set.
    """
    if _SESSION_FACTORY is None:
        return _fail("Server misconfigured: no DB session factory is set.")

    if not isinstance(answers, list) or len(answers) == 0:
        return _fail("Body must be a non-empty JSON array.")

    # Normalize/validate payload
    cleaned = []
    for i, item in enumerate(answers, start=1):
        if not isinstance(item, dict):
            return _fail(f"Item {i} is not an object.")
        body_qid = int(item.get("quiz_id", quiz_id))
        if body_qid != quiz_id:
            return _fail(f"Item {i} quiz_id={body_qid} does not match path quiz_id={quiz_id}.")
        try:
            q_index = int(item["question_index"])
            sel_idx = _validate_choice(item["student_selected_index"])
        except KeyError as k:
            return _fail(f"Item {i} missing field: {k.args[0]}")
        except ValueError as ve:
            return _fail(f"Item {i} invalid: {ve}")
        cleaned.append((q_index, sel_idx))

    updated = 0
    missing = []      # question_index values not found
    correct = 0       # how many answers are correct (optional stat)

    with _SESSION_FACTORY() as db:
        for q_index, sel_idx in cleaned:
            # Is there such a question for this quiz?
            row = db.execute(
                select(QuizQuestion.question_id, QuizQuestion.correct_index)
                .where(
                    QuizQuestion.quiz_id == quiz_id,
                    QuizQuestion.question_index == q_index
                )
            ).one_or_none()

            if not row:
                missing.append(q_index)
                continue

            qid, correct_idx = row
            # write student's choice (overwrite allowed)
            db.execute(
                update(QuizQuestion)
                .where(QuizQuestion.question_id == qid)
                .values(student_selected_index=sel_idx)
            )
            updated += 1
            if sel_idx == correct_idx:
                correct += 1

        # >>> NEW: mark the quiz as submitted
        quiz_row = db.get(Quiz, quiz_id)
        if not quiz_row:
            return _fail(f"Quiz {quiz_id} not found.")
        quiz_row.is_submitted = True
        quiz_row.correct_count = correct
        # <<<

        db.commit()

    payload = {
        "quiz_id": quiz_id,
        "updated": updated,
        "missing_questions": missing,   
        "correct_count": correct,       
        "is_submitted": True, 
    }
    return _success(json.dumps(payload), f"Recorded answers for quiz_id={quiz_id}.")