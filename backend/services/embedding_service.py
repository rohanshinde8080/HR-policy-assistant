import numpy as np
from services.gemini_service import get_client

# =========================================================
# EMBEDDING MODELS TO TRY
# =========================================================

EMBEDDING_MODELS = [
    "text-embedding-004",
    "embedding-001"
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

    # Process in batches
    batch_size = 16
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]
        last_error = None
        batch_success = False

        for model_name in EMBEDDING_MODELS:
            try:
                # Handle single text vs list of texts
                contents = batch if len(batch) > 1 else batch[0]
                response = client.models.embed_content(
                    model=model_name,
                    contents=contents
                )

                if hasattr(response, "embeddings") and response.embeddings:
                    for emb in response.embeddings:
                        all_embeddings.append(emb.values)
                    batch_success = True
                    break
                elif hasattr(response, "embedding") and response.embedding:
                    all_embeddings.append(response.embedding.values)
                    batch_success = True
                    break
            except Exception as e:
                last_error = f"{model_name}: {str(e)}"
                print(f"Gemini Embedding API error ({model_name}): {e}")
                continue

        if not batch_success:
            raise RuntimeError(
                f"Failed to generate embeddings via Gemini API: {last_error}"
            )

    return np.asarray(all_embeddings, dtype=np.float32)