import os

from dotenv import load_dotenv
from google import genai


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

# Locate .env in backend directory or current working directory
ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
if os.path.exists(ENV_PATH):
    load_dotenv(ENV_PATH)
else:
    load_dotenv()


# =========================================================
# GEMINI API CLIENT HELPER
# =========================================================

def get_client():
    if os.path.exists(ENV_PATH):
        load_dotenv(ENV_PATH, override=True)
    else:
        load_dotenv(override=True)
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        raise ValueError("GEMINI_API_KEY not found in .env file. Please configure your API key.")
    return genai.Client(api_key=key)


# Global cache for the working Gemini model to avoid re-discovery latency
CACHED_WORKING_CLIENT = None
CACHED_WORKING_MODEL = None


def get_available_models():
    """Returns list of prioritized Gemini models or fetches from API if possible."""
    default_models = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-3.7-flash",
        "gemini-3.6-flash"
    ]
    try:
        client = get_client()
        if hasattr(client, "models") and hasattr(client.models, "list"):
            models_iter = client.models.list()
            fetched = []
            for m in models_iter:
                name = getattr(m, "name", str(m))
                if "gemini" in name.lower():
                    fetched.append(name.replace("models/", ""))
            if fetched:
                return fetched
    except Exception:
        pass
    return default_models


# =========================================================
# GENERATE HR ANSWER
# =========================================================

def generate_answer(
    question,
    context
):

    if not question or not question.strip():

        raise ValueError(
            "Question cannot be empty."
        )


    if not context or not context.strip():

        return (
            "Sorry, I could not find this information "
            "in the HR policy."
        )


    # =====================================================
    # PROMPT
    # =====================================================

    prompt = f"""
You are an intelligent, helpful HR Policy Assistant.

Your job is to answer employee and admin questions accurately using the HR policy context provided below.

GUIDELINES:
1. Ground your answers strictly in the provided HR policy context. Do not invent or assume non-existent company rules.
2. If the user asks a question about a topic covered in the policy (e.g., leaves, working hours, work from home) but frames it differently (e.g., asking for "leaves per week" when the policy specifies leaves "per calendar year"), intelligently explain the exact policy details (e.g., clarify that leaves are allocated per calendar year: 12 casual leaves, 10 sick leaves, 15 earned leaves, and eligible employees can work from home up to 2 days per week).
3. If the topic is completely missing from the HR policy (e.g., car lease, pet policy), respond with:
"Sorry, I could not find this information in the HR policy."
4. Keep the answer clear, professional, concise, and helpful.
5. If the policy contains specific numbers, dates, rules or conditions, state them accurately.
6. Do not mention technical terms like RAG, FAISS, vectors, embeddings, or Gemini.

HR POLICY CONTEXT:
------------------
{context}
------------------

EMPLOYEE QUESTION:
------------------
{question}
------------------

ANSWER:
"""

    global CACHED_WORKING_CLIENT, CACHED_WORKING_MODEL

    # FAST PATH: If already cached, call directly!
    if CACHED_WORKING_CLIENT and CACHED_WORKING_MODEL:
        try:
            res = CACHED_WORKING_CLIENT.models.generate_content(
                model=CACHED_WORKING_MODEL,
                contents=prompt
            )
            ans = getattr(res, "text", None)
            if ans and ans.strip():
                return ans.strip()
        except Exception as e:
            print(f"Cached model {CACHED_WORKING_MODEL} failed: {e}")
            CACHED_WORKING_MODEL = None

    if not CACHED_WORKING_CLIENT:
        try:
            CACHED_WORKING_CLIENT = get_client()
        except Exception as e:
            raise RuntimeError(f"Failed to initialize Gemini client: {e}")

    # Prioritized modern Gemini models
    models_to_try = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-1.5-pro",
        "gemini-2.5-pro"
    ]

    last_error = None
    for model_name in models_to_try:
        try:
            response = CACHED_WORKING_CLIENT.models.generate_content(
                model=model_name,
                contents=prompt
            )
            ans = getattr(response, "text", None)
            if ans and ans.strip():
                CACHED_WORKING_MODEL = model_name
                print(f"Working Gemini model locked: {model_name}")
                return ans.strip()
        except Exception as e:
            last_error = f"{model_name}: {str(e)}"
            print(f"Gemini API error with {model_name}: {e}")
            continue

    raise RuntimeError(
        f"Gemini API request failed: {str(last_error)}"
    )