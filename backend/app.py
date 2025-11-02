# backend/app.py
import os
import uvicorn
from fastapi import FastAPI, File, UploadFile
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from apis.auth_api import SignUpAPI, LoginAPI
from models import init_models  # from models/db_model.py
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Literal
import google.generativeai as genai

from fastapi import HTTPException, Body

from fastapi.responses import StreamingResponse
from elevenlabs import ElevenLabs
from typing import Optional



from PyPDF2 import PdfReader

# Import ONLY the functions (no router) from gpt_api
from apis.gpt_api import (
    set_session_factory,
    ingest_and_store_endpoint,
    list_courses,
    get_course,
    generate_course_summary,
    get_course_summary, 
)

from apis.flashcards_api import (
    set_session_factory_for_flashcards,
    create_or_replace_flashcards,
    get_flashcards,
)

from apis.quiz_api import (
    set_session_factory_for_quiz,
    create_or_replace_quiz,  
    list_quizzes_for_course,
    get_quiz_by_id,
    submit_quiz_answers
)

from apis.user_api import (
    get_user_by_id,
    get_user_by_query,
    set_session_factory_for_user,
)

# --- DB connection lives ONLY here ---
load_dotenv()  # reads .env at project root
DATABASE_URL = os.getenv("DATABASE_URL", "")


engine = create_engine(DATABASE_URL, future=True, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

# create tables once
init_models(engine)

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# --- FastAPI + URL mappings ---
app = FastAPI(title="APIs")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth routes (class-callables)
app.add_api_route("/auth/signup", SignUpAPI(SessionLocal), methods=["POST"])
app.add_api_route("/auth/login",  LoginAPI(SessionLocal),  methods=["POST"])

# Provide DB session to content ingestion/fetch functions
set_session_factory(SessionLocal)
set_session_factory_for_flashcards(SessionLocal)
set_session_factory_for_quiz(SessionLocal)
set_session_factory_for_user(SessionLocal)

app.add_api_route("/users/{user_id}", get_user_by_id, methods=["GET"])
app.add_api_route("/user", get_user_by_query, methods=["GET"])

# Content ingestion + read routes (function-callables)
app.add_api_route("/addcourse", ingest_and_store_endpoint, methods=["POST"])
app.add_api_route("/courses",      list_courses,              methods=["GET"])
app.add_api_route("/courses/{course_id}", get_course,         methods=["GET"])
app.add_api_route("/courses/{course_id}/summary", generate_course_summary, methods=["POST"])
app.add_api_route("/courses/{course_id}/summary", get_course_summary,      methods=["GET"])

app.add_api_route("/courses/{course_id}/flashcards", create_or_replace_flashcards, methods=["POST"])
app.add_api_route("/courses/{course_id}/flashcards", get_flashcards,              methods=["GET"])

app.add_api_route("/courses/{course_id}/quiz", create_or_replace_quiz, methods=["POST"])
app.add_api_route("/courses/{course_id}/quizzes", list_quizzes_for_course, methods=["GET"])
app.add_api_route("/quizzes/{quiz_id}", get_quiz_by_id, methods=["GET"])
app.add_api_route("/quizzes/{quiz_id}/answers",submit_quiz_answers,methods=["POST"])


# ---------- Data Models ---------- #
class ChatTurn(BaseModel):
    role: Literal["user", "model"]
    parts: List[str]

class ChatRequest(BaseModel):
    message: str
    history: List[ChatTurn] = []  # optional chat history

class ChatResponse(BaseModel):
    answer: str

# Global variable to store extracted text
pdf_text_cache = ""

# ---------- Upload PDF Endpoint ---------- #
@app.post("/upload_pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Uploads a PDF and extracts its text content.
    """
    global pdf_text_cache
    pdf_text_cache = ""

    contents = await file.read()
    pdf_stream = io.BytesIO(contents)

    reader = PdfReader(pdf_stream)
    extracted_text = ""

    for page in reader.pages:
        text = page.extract_text()
        if text:
            extracted_text += text + "\n"

    pdf_text_cache = extracted_text.strip()

    if not pdf_text_cache:
        return {"message": "No readable text found in PDF."}

    return {"message": "PDF uploaded and text extracted successfully.", "text_preview": pdf_text_cache[:500]}

# ---------- Chat Endpoint ---------- #
@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    """
    Receives a question and optional chat history.
    Uses PDF text (if available) as context.
    """

    # Convert ChatTurn objects to plain dictionaries
    history_dicts = [{"role": turn.role, "parts": turn.parts} for turn in req.history]

    model = genai.GenerativeModel("models/gemini-2.5-flash")

    # Prepare context if PDF uploaded
    context = ""
    if pdf_text_cache:
        context = f"The following content is from an uploaded PDF:\n\n{pdf_text_cache[:6000]}\n\n"
    
    # Start chat with history
    chat_session = model.start_chat(history=history_dicts)

    try:
        response = chat_session.send_message(context + req.message)
        return ChatResponse(answer=response.text or "")
    except Exception as e:
        print("Error during Gemini API call:", e)
        return ChatResponse(answer="⚠️ Error processing request.")










class TranslateRequest(BaseModel):
    text: str = Field(min_length=1, description="Full text to translate")
    target_language: str = Field(min_length=2, description="e.g., English, Spanish, Marathi, Chinese (Simplified)")

class TranslateResponse(BaseModel):
    language: str
    translated_text: str

@app.post("/translate", response_model=TranslateResponse)
def translate_text(req: TranslateRequest):
    """
    Translate arbitrary text to the requested language using Gemini.
    Returns only the translated text (no extra explanations).
    """
    try:
        model = genai.GenerativeModel("models/gemini-2.5-flash")
        prompt = (
            f"Translate the following text to {req.target_language}. "
            "Return ONLY the translation. Preserve line breaks and bulleting.\n\n"
            f"{req.text}"
        )
        resp = model.generate_content(prompt)
        out = (resp.text or "").strip()
        if not out:
            raise ValueError("Empty translation returned")
        return TranslateResponse(language=req.target_language, translated_text=out)
    except Exception as e:
        # Log server-side and hide internals from client
        print("Gemini translation error:", e)
        raise HTTPException(status_code=500, detail="Translation failed.")
    

class TTSRequest(BaseModel):
    text: str
    voice_id: Optional[str] = "TZXnHeB62zELHhRDHuu1"
    model_id: Optional[str] = "eleven_multilingual_v2"
    output_format: Optional[str] = "mp3_44100_128"


ELEVEN_KEY = os.getenv("ELEVENLABS_API_KEY")
if not ELEVEN_KEY:
    print("⚠️ ELEVENLABS_API_KEY is not set in .env")
eleven_client = ElevenLabs(api_key=ELEVEN_KEY)

@app.post("/tts")
def tts(req: TTSRequest):
    """
    Convert text to speech with ElevenLabs and stream MP3 back to the client.
    Do NOT play server-side. Just return audio bytes.
    """
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text is required.")

    if not ELEVEN_KEY:
        raise HTTPException(status_code=500, detail="ElevenLabs API key missing on server.")

    # ElevenLabs text size limits are generous but we’ll be safe:
    text = req.text.strip()
    if len(text) > 5000:
        text = text[:5000]

    try:
        # eleven_client.text_to_speech.convert returns an iterator of bytes chunks
        audio_iter = eleven_client.text_to_speech.convert(
            text=text,
            voice_id=req.voice_id or "TZXnHeB62zELHhRDHuu1",
            model_id=req.model_id or "eleven_multilingual_v2",
            output_format=req.output_format or "mp3_44100_128",
        )

        # Wrap generator in StreamingResponse so the browser can play as it arrives
        return StreamingResponse(
            audio_iter,
            media_type="audio/mpeg",  # mp3
            headers={
                # Allow the browser to stream/play
                "Cache-Control": "no-store",
            },
        )
    except Exception as e:
        print("TTS error:", e)
        raise HTTPException(status_code=500, detail="TTS generation failed.")



if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)

