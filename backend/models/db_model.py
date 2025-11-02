# backend/models/db_model.py
from __future__ import annotations
from typing import Optional

from sqlalchemy import Integer, String, Text, UniqueConstraint, ForeignKey, DateTime, Boolean 
from sqlalchemy.sql import func
from datetime import datetime 

from sqlalchemy.orm import declarative_base, Mapped, mapped_column

Base = declarative_base()

class User(Base):
    __tablename__ = "User"
    __table_args__ = (UniqueConstraint("user_email", name="uq_user_email"),)

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_email: Mapped[str] = mapped_column(String(255), nullable=False)
    user_password: Mapped[str] = mapped_column(String(255), nullable=False)  # hash in prod
    user_firstname: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    user_lastname: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    user_university: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    user_currentsem: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

class Course(Base):
    __tablename__ = "courses"

    course_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    course_name: Mapped[str] = mapped_column(String(255), nullable=False)
    course_content: Mapped[str] = mapped_column(Text, nullable=False)

    user_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("User.user_id", ondelete="SET NULL"), nullable=True
    )

class Summary(Base):
    __tablename__ = "summary"
    __table_args__ = (UniqueConstraint("course_id", "summary_length", name="uq_course_summary"),)

    summary_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    course_id: Mapped[int] = mapped_column(Integer, ForeignKey("courses.course_id", ondelete="CASCADE"), nullable=False)
    summary_length: Mapped[str] = mapped_column(String(20), nullable=False)  # short|medium|long
    summary_content: Mapped[str] = mapped_column(Text, nullable=False)

class Flashcard(Base):
    __tablename__ = "flashcards"
    __table_args__ = (UniqueConstraint("course_id", "card_index", name="uq_course_card_slot"),)

    flashcard_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    course_id: Mapped[int] = mapped_column(Integer, ForeignKey("courses.course_id", ondelete="CASCADE"), nullable=False)
    card_index: Mapped[int] = mapped_column(Integer, nullable=False)  # 1..10
    front_text: Mapped[str] = mapped_column(Text, nullable=False)
    back_text: Mapped[str] = mapped_column(Text, nullable=False)



class Quiz(Base):
    __tablename__ = "quizzes"

    quiz_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    course_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("courses.course_id", ondelete="CASCADE"), nullable=False
    )

    quiz_title: Mapped[str] = mapped_column(String(255), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    is_submitted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    correct_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=0)


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    __table_args__ = (UniqueConstraint("quiz_id", "question_index", name="uq_quiz_slot"),)

    question_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    quiz_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("quizzes.quiz_id", ondelete="CASCADE"), nullable=False
    )
    question_index: Mapped[int] = mapped_column(Integer, nullable=False)  # 1..10
    question_type: Mapped[str] = mapped_column(String(20), nullable=False)  # mcq | fitb
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    options_json: Mapped[str] = mapped_column(Text, nullable=False)  # JSON array of 4 strings
    correct_index: Mapped[int] = mapped_column(Integer, nullable=False)  # 0..3
    student_selected_index: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)





def init_models(engine) -> None:
    Base.metadata.create_all(engine)
