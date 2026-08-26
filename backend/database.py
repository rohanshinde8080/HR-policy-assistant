import os
try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# =========================================================
# DATABASE CONFIGURATION
# =========================================================

ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), ".env"))
if load_dotenv is not None:
    if os.path.exists(ENV_PATH):
        load_dotenv(ENV_PATH)
    else:
        load_dotenv()

DEFAULT_DB_URL = "mysql+pymysql://root:2124@localhost/hr_policy_db"
DATABASE_URL: str = os.getenv("DATABASE_URL") or DEFAULT_DB_URL

# Normalize URL for SQLAlchemy 2.0 compatibility
if DATABASE_URL.startswith("mysql://"):
    DATABASE_URL = DATABASE_URL.replace("mysql://", "mysql+pymysql://", 1)
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)


# =========================================================
# DATABASE ENGINE
# =========================================================

engine_kwargs = {
    "pool_pre_ping": True,
}

if not DATABASE_URL.startswith("sqlite"):
    engine_kwargs["pool_recycle"] = 1800
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

    # TiDB Cloud & Cloud MySQL require TLS/SSL encryption
    if "tidbcloud.com" in DATABASE_URL or "aivencloud.com" in DATABASE_URL or "ssl" in DATABASE_URL.lower():
        engine_kwargs["connect_args"] = {"ssl": {}}

engine = create_engine(
    DATABASE_URL,
    **engine_kwargs
)


# =========================================================
# SESSION
# =========================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# =========================================================
# BASE MODEL
# =========================================================

Base = declarative_base()