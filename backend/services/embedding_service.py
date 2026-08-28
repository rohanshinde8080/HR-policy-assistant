import gc
import numpy as np

_model = None


def get_model():
    """Lazy load the embedding model only when needed to save RAM on startup."""
    global _model
    if _model is None:
        import torch
        torch.set_num_threads(2)
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


# =========================================================
# GENERATE EMBEDDINGS
# =========================================================

def generate_embeddings(chunks):

    if not chunks:
        raise ValueError(
            "No text provided for embedding generation."
        )

    import torch
    model = get_model()

    with torch.inference_mode():
        embeddings = model.encode(
            chunks,
            batch_size=8,
            convert_to_numpy=True,
            show_progress_bar=False
        )

    # FAISS expects float32
    embeddings = np.asarray(
        embeddings,
        dtype=np.float32
    )

    gc.collect()

    return embeddings