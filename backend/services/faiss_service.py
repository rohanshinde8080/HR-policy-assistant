import os

import faiss
import numpy as np


# =========================================================
# DEFAULT FAISS FILE
# =========================================================

FAISS_INDEX_FILE = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "faiss_db", "hr_policy.index")
)


# =========================================================
# CREATE FAISS INDEX
# =========================================================

def create_faiss_index(embeddings):

    if embeddings is None:
        raise ValueError(
            "Embeddings are required."
        )


    embeddings = np.asarray(
        embeddings,
        dtype=np.float32
    )


    if embeddings.size == 0:
        raise ValueError(
            "Embeddings are empty."
        )


    if embeddings.ndim != 2:
        raise ValueError(
            "Embeddings must be a 2D array."
        )


    dimension = embeddings.shape[1]


    if dimension <= 0:
        raise ValueError(
            "Invalid embedding dimension."
        )


    # Create FAISS index
    index = faiss.IndexFlatL2(
        dimension
    )


    # Add vectors
    index.add(
        embeddings
    )


    return index


# =========================================================
# SEARCH FAISS
# =========================================================

def search_faiss(
    index,
    query_embedding,
    chunks,
    top_k=3
):

    if index is None:
        raise ValueError(
            "FAISS index is not available."
        )


    if not chunks:
        return []


    # Make sure top_k is valid
    top_k = max(
        1,
        min(
            int(top_k),
            len(chunks)
        )
    )


    # Convert query to float32
    query_embedding = np.asarray(
        query_embedding,
        dtype=np.float32
    )


    # FAISS expects shape:
    # (number_of_queries, embedding_dimension)

    if query_embedding.ndim == 1:

        query_embedding = np.expand_dims(
            query_embedding,
            axis=0
        )


    # Search
    distances, indices = index.search(
        query_embedding,
        top_k
    )


    results = []


    for i in indices[0]:

        if i == -1:
            continue


        if i >= len(chunks):
            continue


        results.append(
            chunks[i]
        )


    return results


# =========================================================
# SAVE FAISS INDEX
# =========================================================

def save_faiss_index(
    index,
    file_path=FAISS_INDEX_FILE
):

    if index is None:
        raise ValueError(
            "Cannot save an empty FAISS index."
        )


    # Create directory
    folder = os.path.dirname(
        file_path
    )


    if folder:

        os.makedirs(
            folder,
            exist_ok=True
        )


    # Save index
    faiss.write_index(
        index,
        file_path
    )


# =========================================================
# LOAD FAISS INDEX
# =========================================================

def load_faiss_index(
    file_path=FAISS_INDEX_FILE
):

    if not os.path.exists(
        file_path
    ):

        raise FileNotFoundError(
            f"FAISS index not found: {file_path}"
        )


    return faiss.read_index(
        file_path
    )