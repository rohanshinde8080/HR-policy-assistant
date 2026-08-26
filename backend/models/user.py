from sqlalchemy import Column, Integer, String

from database import Base


# =========================================================
# USER MODEL
# =========================================================

class User(Base):

    __tablename__ = "users"


    # =====================================================
    # PRIMARY KEY
    # =====================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )


    # =====================================================
    # USER NAME
    # =====================================================

    name = Column(
        String(100),
        nullable=False
    )


    # =====================================================
    # EMAIL
    # =====================================================

    email = Column(
        String(150),
        unique=True,
        nullable=False,
        index=True
    )


    # =====================================================
    # PASSWORD
    # =====================================================

    password = Column(
        String(255),
        nullable=False
    )


    # =====================================================
    # ROLE
    # =====================================================

    role = Column(
        String(20),
        nullable=False,
        default="employee"
    )