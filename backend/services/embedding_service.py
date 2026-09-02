import numpy as np
from services.gemini_service import get_client

# =========================================================
# EMBEDDING MODELS TO TRY
# =========================================================

EMBEDDING_MODELS = [
    "text-embedding-004",
    "gemini-embedding-exp-03-07",
    "models/text-embedding-004"
]


# =========================================================
# GENERATE EMBEDDINGS VIA GEMINI API
# =========================================================

def generate_embeddings(chunks):

    if not chunks:
        raise ValueError(
            "No text provided for embedding generation."
        )

    if isinstance(chunks, str):
        chunks = [chunks]

    client = get_client()
    all_embeddings = []

    for text in chunks:
        text_content = str(text).strip()
        if not text_content:
            text_content = "HR policy information"

        success = False
        last_error = None

        for model_name in EMBEDDING_MODELS:
            try:
                response = client.models.embed_content(
                    model=model_name,
                    contents=text_content
                )

                if hasattr(response, "embedding") and response.embedding and hasattr(response.embedding, "values"):
                    all_embeddings.append(response.embedding.values)
                    success = True
                    break
                elif hasattr(response, "embeddings") and response.embeddings:
                    all_embeddings.append(response.embeddings[0].values)
                    success = True
                    break
            except Exception as e:
                last_error = f"{model_name}: {str(e)}"
                continue

        if not success:
            raise RuntimeError(
                f"Failed to generate embeddings via Gemini API: {last_error}"
            )

    return np.asarray(all_embeddings, dtype=np.float32)