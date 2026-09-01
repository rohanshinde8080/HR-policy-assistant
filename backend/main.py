from fastapi import FastAPI, HTTPException, UploadFile, File, Response, Request
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

from database import engine, SessionLocal, Base
from models.user import User
from models.chat import ChatHistory

import bcrypt
import os
import shutil
import datetime

from services.pdf_service import extract_text_from_pdf
from services.text_chunker import split_text
from services.embedding_service import generate_embeddings

from services.faiss_service import (
    create_faiss_index,
    search_faiss,
    save_faiss_index,
    load_faiss_index
)

from services.chunk_storage import (
    save_chunks,
    load_chunks
)

from services.gemini_service import generate_answer


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="HR Policy Assistant API",
    description="AI-powered HR Policy Assistant",
    version="1.0.0"
)


@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)


# =========================================================
# CORS CONFIGURATION
# =========================================================

allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
custom_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

base_origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://127.0.0.1:5501",
    "http://localhost:5501",
    "http://127.0.0.1:5502",
    "http://localhost:5502",
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "null"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=base_origins + custom_origins,
    allow_origin_regex=r"^https?://.*$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# DATABASE
# =========================================================

try:
    Base.metadata.create_all(bind=engine)
    print("Database tables created / verified successfully ✅")
except Exception as e:
    print("Database table creation error on startup:", e)


def init_default_admin():
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.role == "admin").first()
        if not admin:
            hashed = bcrypt.hashpw("admin123".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            default_admin = User(
                name="HR Admin",
                email="admin@company.com",
                password=hashed,
                role="admin"
            )
            db.add(default_admin)
            db.commit()
            print("Default admin created: admin@company.com / admin123")
    except Exception as e:
        print("Admin init error:", e)
    finally:
        db.close()

try:
    init_default_admin()
except Exception as e:
    print("Could not run default admin init:", e)

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
HERO_IMAGE_PATH = os.path.abspath(
    os.path.join(BACKEND_DIR, "..", "frontend", "images", "admin_hero_banner.jpg")
)

def ensure_frontend_images():
    try:
        dest_dir = os.path.abspath(os.path.join(BACKEND_DIR, "..", "frontend", "images"))
        os.makedirs(dest_dir, exist_ok=True)
    except Exception as e:
        print("Ensure images directory error:", e)

ensure_frontend_images()


@app.get("/admin-banner-image")
def get_admin_banner():
    if os.path.exists(HERO_IMAGE_PATH):
        return FileResponse(HERO_IMAGE_PATH, media_type="image/jpeg")
    raise HTTPException(status_code=404, detail="Image not found")


# =========================================================
# REQUEST MODELS
# =========================================================

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AskRequest(BaseModel):
    question: str
    user_id: int


class AdminCreateRequest(BaseModel):
    requester_email: EmailStr
    name: str
    email: EmailStr
    password: str


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():

    return {
        "message": "HR Policy Assistant API is running 🚀"
    }


# =========================================================
# DATABASE TEST
# =========================================================

@app.get("/db-test")
def database_test():

    try:

        with engine.connect():

            return {
                "status": "success",
                "message": "MySQL connected successfully ✅"
            }

    except Exception as e:

        return {
            "status": "error",
            "message": str(e)
        }


# =========================================================
# REGISTER EMPLOYEE
# =========================================================

@app.post("/register")
def register_user(
    user_data: RegisterRequest
):

    db = SessionLocal()

    try:

        # -----------------------------------------------------
        # VALIDATION
        # -----------------------------------------------------

        name = user_data.name.strip()
        email = str(user_data.email).strip().lower()
        password = user_data.password

        if not name:

            raise HTTPException(
                status_code=400,
                detail="Name is required"
            )

        if len(password) < 6:

            raise HTTPException(
                status_code=400,
                detail="Password must be at least 6 characters"
            )


        # -----------------------------------------------------
        # CHECK EXISTING USER
        # -----------------------------------------------------

        existing_user = db.query(User).filter(
            User.email == email
        ).first()


        if existing_user:

            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )


        # -----------------------------------------------------
        # HASH PASSWORD
        # -----------------------------------------------------

        hashed_password = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")


        # -----------------------------------------------------
        # CREATE EMPLOYEE
        # -----------------------------------------------------

        new_user = User(
            name=name,
            email=email,
            password=hashed_password,
            role="employee"
        )


        db.add(new_user)

        db.commit()

        db.refresh(new_user)


        return {

            "message": "User registered successfully ✅",

            "user_id": new_user.id,

            "name": new_user.name,

            "email": new_user.email,

            "role": new_user.role

        }


    finally:

        db.close()


# =========================================================
# LOGIN
# =========================================================

@app.post("/login")
def login_user(
    user_data: LoginRequest
):

    db = SessionLocal()

    try:

        email = str(
            user_data.email
        ).strip().lower()


        # -----------------------------------------------------
        # FIND USER
        # -----------------------------------------------------

        user = db.query(User).filter(
            User.email == email
        ).first()


        if not user:

            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )


        # -----------------------------------------------------
        # CHECK PASSWORD
        # -----------------------------------------------------

        password_match = bcrypt.checkpw(
            user_data.password.encode("utf-8"),
            user.password.encode("utf-8")
        )


        if not password_match:

            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )


        # -----------------------------------------------------
        # LOGIN RESPONSE
        # -----------------------------------------------------

        return {

            "message": "Login successful ✅",

            "user_id": user.id,

            "name": user.name,

            "email": user.email,

            "role": user.role

        }


    finally:

        db.close()


# =========================================================
# CREATE ADMIN
# =========================================================

@app.post("/create-admin")
def create_admin(
    admin_data: AdminCreateRequest
):

    db = SessionLocal()

    try:

        # -----------------------------------------------------
        # AUTHENTICATION & AUTHORIZATION CHECK
        # -----------------------------------------------------
        requester_email = str(admin_data.requester_email).strip().lower()
        requester = db.query(User).filter(User.email == requester_email).first()

        if not requester or str(requester.role).strip().lower() != "admin":
            raise HTTPException(
                status_code=403,
                detail="Unauthorized: Only an existing logged-in Admin can create a new Admin account."
            )

        name = admin_data.name.strip()
        email = str(
            admin_data.email
        ).strip().lower()
        password = admin_data.password


        # -----------------------------------------------------
        # VALIDATION
        # -----------------------------------------------------

        if not name:

            raise HTTPException(
                status_code=400,
                detail="Name is required"
            )


        if len(password) < 6:

            raise HTTPException(
                status_code=400,
                detail="Password must be at least 6 characters"
            )


        # -----------------------------------------------------
        # CHECK EMAIL
        # -----------------------------------------------------

        existing_user = db.query(User).filter(
            User.email == email
        ).first()


        if existing_user:

            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )


        # -----------------------------------------------------
        # HASH PASSWORD
        # -----------------------------------------------------

        hashed_password = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")


        # -----------------------------------------------------
        # CREATE ADMIN
        # -----------------------------------------------------

        new_admin = User(

            name=name,

            email=email,

            password=hashed_password,

            role="admin"

        )


        db.add(new_admin)

        db.commit()

        db.refresh(new_admin)


        return {

            "message":
                "Admin created successfully ✅",

            "user_id":
                new_admin.id,

            "name":
                new_admin.name,

            "email":
                new_admin.email,

            "role":
                new_admin.role

        }


    finally:

        db.close()


# =========================================================
# UPLOAD HR POLICY PDF
# =========================================================

UPLOAD_FOLDER = os.path.abspath(os.path.join(BACKEND_DIR, "uploads"))

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)


@app.post("/upload-policy")
async def upload_policy(
    email: str,
    file: UploadFile = File(...)
):

    # =====================================================
    # CHECK ADMIN
    # =====================================================

    db = SessionLocal()

    try:

        admin_email = email.strip().lower()


        user = db.query(User).filter(
            User.email == admin_email
        ).first()


        if not user:

            raise HTTPException(
                status_code=401,
                detail="User not found"
            )


        if str(user.role).lower() != "admin":

            raise HTTPException(
                status_code=403,
                detail="Only admin can upload HR policy"
            )

    finally:

        db.close()


    # =====================================================
    # CHECK FILE
    # =====================================================

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="No file selected"
        )


    if not file.filename.lower().endswith(".pdf"):

        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )


    # =====================================================
    # SAVE PDF
    # =====================================================

    safe_filename = os.path.basename(
        file.filename
    )

    file_path = os.path.join(
        UPLOAD_FOLDER,
        safe_filename
    )


    try:

        with open(
            file_path,
            "wb"
        ) as buffer:

            shutil.copyfileobj(
                file.file,
                buffer
            )


        # =================================================
        # EXTRACT TEXT
        # =================================================

        text = extract_text_from_pdf(
            file_path
        )


        if not text or not text.strip():

            raise HTTPException(
                status_code=400,
                detail="No text found in PDF"
            )


        # =================================================
        # CREATE CHUNKS
        # =================================================

        chunks = split_text(
            text
        )


        if not chunks:

            raise HTTPException(
                status_code=400,
                detail="Unable to create text chunks"
            )


        # =================================================
        # GENERATE EMBEDDINGS
        # =================================================

        embeddings = generate_embeddings(
            chunks
        )


        if embeddings is None or len(embeddings) == 0:

            raise HTTPException(
                status_code=500,
                detail="Unable to generate embeddings"
            )


        # =================================================
        # CREATE FAISS INDEX
        # =================================================

        index = create_faiss_index(
            embeddings
        )


        # =================================================
        # SAVE FAISS INDEX
        # =================================================

        save_faiss_index(
            index
        )


        # =================================================
        # SAVE CHUNKS
        # =================================================

        save_chunks(
            chunks
        )


        return {

            "message":
                "HR Policy uploaded and processed successfully ✅",

            "filename":
                safe_filename,

            "total_chunks":
                len(chunks),

            "status":
                "FAISS knowledge base updated"

        }


    except HTTPException:

        raise


    except Exception as e:

        print(
            "PDF processing error:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail=f"PDF processing failed: {str(e)}"
        )


    finally:

        await file.close()


# =========================================================
# GET CURRENT ACTIVE POLICY & LIST
# =========================================================

@app.get("/current-policy")
def get_current_policy(request: Request = None):
    if not os.path.exists(UPLOAD_FOLDER):
        return {
            "has_policy": False,
            "message": "No policy uploaded yet."
        }

    pdf_files = [f for f in os.listdir(UPLOAD_FOLDER) if f.lower().endswith(".pdf")]
    if not pdf_files:
        return {
            "has_policy": False,
            "message": "No HR Policy PDF uploaded yet."
        }

    latest_file = None
    latest_time = 0
    file_list = []

    base_url = str(request.base_url).rstrip("/") if request else "http://127.0.0.1:8000"

    for f in pdf_files:
        fp = os.path.join(UPLOAD_FOLDER, f)
        mtime = os.path.getmtime(fp)
        size = os.path.getsize(fp)
        dt = datetime.datetime.fromtimestamp(mtime).strftime("%Y-%m-%d %H:%M:%S")

        if size < 1024:
            size_str = f"{size} B"
        elif size < 1024 * 1024:
            size_str = f"{size / 1024:.1f} KB"
        else:
            size_str = f"{size / (1024 * 1024):.2f} MB"

        file_info = {
            "filename": f,
            "size": size_str,
            "modified_at": dt,
            "view_url": f"{base_url}/view-policy/{f}"
        }
        file_list.append(file_info)

        if mtime > latest_time:
            latest_time = mtime
            latest_file = file_info

    chunks_count = 0
    try:
        chunks = load_chunks()
        if chunks:
            chunks_count = len(chunks)
    except Exception:
        pass

    return {
        "has_policy": True,
        "latest_policy": latest_file,
        "all_policies": file_list,
        "total_chunks": chunks_count,
        "status": "Active & Indexed"
    }


# =========================================================
# VIEW / DOWNLOAD POLICY PDF
# =========================================================

@app.get("/view-policy/{filename}")
def view_policy_pdf(filename: str):
    safe_name = os.path.basename(filename)
    file_path = os.path.join(UPLOAD_FOLDER, safe_name)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail="Policy document not found."
        )

    return FileResponse(
        file_path,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{safe_name}"'}
    )


# =========================================================
# PDF TEXT EXTRACTION TEST
# =========================================================

@app.get("/extract-policy")
def extract_policy():

    file_path = os.path.join(
        UPLOAD_FOLDER,
        "HR_Policy.pdf"
    )


    if not os.path.exists(file_path):

        raise HTTPException(
            status_code=404,
            detail="HR_Policy.pdf not found"
        )


    text = extract_text_from_pdf(
        file_path
    )


    return {

        "message":
            "PDF text extracted successfully ✅",

        "text":
            text

    }


# =========================================================
# TEXT CHUNKING TEST
# =========================================================

@app.get("/chunk-policy")
def chunk_policy():

    file_path = os.path.join(
        UPLOAD_FOLDER,
        "HR_Policy.pdf"
    )


    if not os.path.exists(file_path):

        raise HTTPException(
            status_code=404,
            detail="HR_Policy.pdf not found"
        )


    text = extract_text_from_pdf(
        file_path
    )


    chunks = split_text(
        text
    )


    return {

        "message":
            "PDF chunking successful ✅",

        "total_chunks":
            len(chunks),

        "chunks":
            chunks

    }


# =========================================================
# EMBEDDING TEST
# =========================================================

@app.get("/embedding-test")
def embedding_test():

    file_path = os.path.join(
        UPLOAD_FOLDER,
        "HR_Policy.pdf"
    )


    if not os.path.exists(file_path):

        raise HTTPException(
            status_code=404,
            detail="HR_Policy.pdf not found"
        )


    text = extract_text_from_pdf(
        file_path
    )


    chunks = split_text(
        text
    )


    embeddings = generate_embeddings(
        chunks
    )


    return {

        "message":
            "Embeddings generated successfully ✅",

        "total_chunks":
            len(chunks),

        "embedding_dimensions":
            len(embeddings[0])

    }


# =========================================================
# FAISS TEST
# =========================================================

@app.get("/faiss-test")
def faiss_test():

    file_path = os.path.join(
        UPLOAD_FOLDER,
        "HR_Policy.pdf"
    )


    if not os.path.exists(file_path):

        raise HTTPException(
            status_code=404,
            detail="HR_Policy.pdf not found"
        )


    # Extract text

    text = extract_text_from_pdf(
        file_path
    )


    # Create chunks

    chunks = split_text(
        text
    )


    # Generate embeddings

    embeddings = generate_embeddings(
        chunks
    )


    # Create index

    index = create_faiss_index(
        embeddings
    )


    # Test question

    question = (
        "How many casual leaves do employees get?"
    )


    # Question embedding

    query_embedding = generate_embeddings(
        [question]
    )[0]


    # Search
    if hasattr(index, "d") and index.d != len(query_embedding):
        embeddings = generate_embeddings(chunks)
        index = create_faiss_index(embeddings)
        save_faiss_index(index)
        save_chunks(chunks)

    results = search_faiss(
        index,
        query_embedding,
        chunks,
        top_k=3
    )


    return {

        "question":
            question,

        "results":
            results

    }


# =========================================================
# BUILD & SAVE FAISS
# =========================================================

@app.get("/build-faiss")
def build_faiss():

    file_path = os.path.join(
        UPLOAD_FOLDER,
        "HR_Policy.pdf"
    )


    if not os.path.exists(file_path):

        raise HTTPException(
            status_code=404,
            detail="HR_Policy.pdf not found"
        )


    # PDF text

    text = extract_text_from_pdf(
        file_path
    )


    # Chunks

    chunks = split_text(
        text
    )


    # Embeddings

    embeddings = generate_embeddings(
        chunks
    )


    # Create FAISS

    index = create_faiss_index(
        embeddings
    )


    # Save FAISS

    save_faiss_index(
        index
    )


    # Save chunks

    save_chunks(
        chunks
    )


    return {

        "message":
            "FAISS index created and saved successfully ✅",

        "total_chunks":
            len(chunks)

    }


# =========================================================
# SAVED FAISS SEARCH
# =========================================================

@app.get("/saved-search")
def saved_search():

    question = (
        "How many casual leaves do employees get?"
    )


    try:

        # Load FAISS

        index = load_faiss_index()


        # Load chunks

        chunks = load_chunks()


        # Question embedding

        query_embedding = generate_embeddings(
            [question]
        )[0]


        # Search
        if hasattr(index, "d") and index.d != len(query_embedding):
            embeddings = generate_embeddings(chunks)
            index = create_faiss_index(embeddings)
            save_faiss_index(index)
            save_chunks(chunks)

        results = search_faiss(
            index,
            query_embedding,
            chunks,
            top_k=3
        )


        return {

            "question":
                question,

            "results":
                results

        }


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Saved FAISS search failed: {str(e)}"
        )


# =========================================================
# GEMINI TEST
# =========================================================

@app.get("/gemini-test")
def gemini_test():

    question = (
        "What is the standard working time?"
    )


    context = """
    Standard working hours are 9:30 AM to 6:30 PM,
    Monday through Friday.
    """


    try:

        answer = generate_answer(
            question,
            context
        )


        return {

            "question":
                question,

            "answer":
                answer

        }


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Gemini test failed: {str(e)}"
        )


# =========================================================
# LIST AVAILABLE GEMINI MODELS
# =========================================================

@app.get("/list-models")
def list_models_endpoint():
    try:
        from services.gemini_service import get_available_models
        return {
            "status": "success",
            "available_models": get_available_models()
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


# =========================================================
# ASK HR POLICY
# =========================================================

@app.post("/ask")
def ask_hr_policy(
    request: AskRequest
):

    question = request.question.strip()

    user_id = request.user_id


    # =====================================================
    # VALIDATION
    # =====================================================

    if not question:

        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty"
        )


    # =====================================================
    # VERIFY USER
    # =====================================================

    db = SessionLocal()

    try:

        user = db.query(User).filter(
            User.id == user_id
        ).first()


        if not user:

            raise HTTPException(
                status_code=401,
                detail="Invalid user"
            )

    finally:

        db.close()


    # =====================================================
    # LOAD FAISS
    # =====================================================

    try:

        index = load_faiss_index()

        chunks = load_chunks()

    except Exception as e:

        print(
            "FAISS loading error:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail="HR policy knowledge base is not available. Please ask the admin to upload a policy PDF."
        )


    # =====================================================
    # QUESTION EMBEDDING
    # =====================================================

    try:

        query_embedding = generate_embeddings(
            [question]
        )[0]

    except Exception as e:

        print(
            "Embedding error:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to process your question"
        )


    # =====================================================
    # SEARCH POLICY
    # =====================================================

    try:

        if hasattr(index, "d") and index.d != len(query_embedding):
            print(f"Dimension mismatch detected (Index: {index.d}, Query: {len(query_embedding)}). Auto-rebuilding index with Gemini embeddings...")
            embeddings = generate_embeddings(chunks)
            index = create_faiss_index(embeddings)
            save_faiss_index(index)
            save_chunks(chunks)

        results = search_faiss(
            index,
            query_embedding,
            chunks,
            top_k=3
        )

    except Exception as e:

        print(
            "FAISS search error:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to search HR policy knowledge base"
        )


    # =====================================================
    # CHECK RESULTS
    # =====================================================

    if not results:

        raise HTTPException(
            status_code=404,
            detail="No relevant HR policy information found"
        )


    # =====================================================
    # CREATE CONTEXT
    # =====================================================

    context = "\n\n".join(
        results
    )


    # =====================================================
    # GEMINI ANSWER
    # =====================================================

    try:

        answer = generate_answer(
            question,
            context
        )

    except Exception as e:

        print(
            "Gemini error:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail=f"Unable to generate AI answer: {str(e)}"
        )


    # =====================================================
    # SAVE CHAT HISTORY
    # =====================================================

    db = SessionLocal()

    try:

        chat = ChatHistory(

            user_id=user_id,

            question=question,

            answer=answer

        )


        db.add(chat)

        db.commit()

        db.refresh(chat)


        return {
            "question":
                question,

            "answer":
                answer,

            "chat_id":
                chat.id,

            "user_id":
                chat.user_id,

            "sources":
                results[:2]
        }


    finally:

        db.close()


# =========================================================
# CHAT HISTORY
# =========================================================

@app.get("/chat-history")
def get_chat_history(
    user_id: int
):

    db = SessionLocal()

    try:

        # =================================================
        # CHECK USER
        # =================================================

        user = db.query(User).filter(
            User.id == user_id
        ).first()


        if not user:

            raise HTTPException(
                status_code=401,
                detail="Invalid user"
            )


        # =================================================
        # GET USER-SPECIFIC HISTORY
        # =================================================

        chats = db.query(
            ChatHistory
        ).filter(

            ChatHistory.user_id == user_id

        ).order_by(

            ChatHistory.created_at.desc()

        ).all()


        # =================================================
        # RESPONSE
        # =================================================

        return [

            {

                "id":
                    chat.id,

                "question":
                    chat.question,

                "answer":
                    chat.answer,

                "created_at":
                    chat.created_at

            }

            for chat in chats

        ]


    finally:

        db.close()


# =========================================================
# TRENDING / RECENT QUERIES FOR ADMIN ANALYTICS
# =========================================================

@app.get("/trending-queries")
def get_trending_queries():
    db = SessionLocal()
    try:
        chats = db.query(ChatHistory).order_by(ChatHistory.created_at.desc()).limit(20).all()
        default_queries = [
            {"query": "How many casual leaves do I get?", "category": "Leaves"},
            {"query": "What is the work from home policy?", "category": "WFH"},
            {"query": "What are standard working hours?", "category": "Hours"},
            {"query": "What is the resignation notice period?", "category": "Exit"}
        ]
        if not chats:
            return default_queries

        seen = set()
        unique_questions = []
        for c in chats:
            q = c.question.strip()
            if q.lower() not in seen and len(q) > 3:
                seen.add(q.lower())
                unique_questions.append({"query": q, "category": "Policy"})
                if len(unique_questions) >= 5:
                    break
        return unique_questions if unique_questions else default_queries
    except Exception as e:
        print("Error fetching trending queries:", e)
        return []
    finally:
        db.close()