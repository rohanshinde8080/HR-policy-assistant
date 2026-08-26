from sqlalchemy import (
    Column,
    Integer,
    Text,
    ForeignKey,
    DateTime
)

from sqlalchemy.sql import func

from database import Base


# =========================================================
# CHAT HISTORY MODEL
# =========================================================

class ChatHistory(Base):

    __tablename__ = "chat_history"


    # =====================================================
    # PRIMARY KEY
    # =====================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )


    # =====================================================
    # USER ID
    # =====================================================

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )


    # =====================================================
    # EMPLOYEE QUESTION
    # =====================================================

    question = Column(
        Text,
        nullable=False
    )


    # =====================================================
    # AI ANSWER
    # =====================================================

    answer = Column(
        Text,
        nullable=False
    )


    # =====================================================
    # CREATED DATE & TIME
    # =====================================================

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )