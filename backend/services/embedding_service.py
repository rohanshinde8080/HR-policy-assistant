from sentence_transformers import SentenceTransformer
import numpy as np


# =========================================================
# EMBEDDING MODEL
# =========================================================

model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)


# =========================================================
# GENERATE EMBEDDINGS
# =========================================================

def generate_embeddings(chunks):

    if not chunks:

        raise ValueError(
            "No text provided for embedding generation."
        )


    # Generate embeddings
    embeddings = model.encode(
        chunks,
        convert_to_numpy=True,
        show_progress_bar=False
    )


    # FAISS expects float32
    embeddings = np.asarray(
        embeddings,
        dtype=np.float32
    )


    return embeddings