import os
import re
import math
import numpy as np

# =========================================================
# FIXED VECTOR DIMENSION FOR FAISS
# =========================================================

VECTOR_DIM = 256


def tokenize(text):
    return re.findall(r'[a-zA-Z0-9_]+', str(text).lower())


def hash_word(word, dim=VECTOR_DIM):
    """Deterministic word hashing to fixed vector dimension."""
    h = 0
    for char in word:
        h = (h * 31 + ord(char)) & 0xFFFFFFFF
    return h % dim


# =========================================================
# GENERATE EMBEDDINGS (100% RELIABLE & SELF-CONTAINED)
# =========================================================

def generate_embeddings(chunks):
    """
    Generates deterministic TF-IDF feature embeddings (dim=256).
    100% self-contained, 0 MB memory overhead, zero external API errors, instant speed.
    """
    if not chunks:
        raise ValueError(
            "No text provided for embedding generation."
        )

    if isinstance(chunks, str):
        chunks = [chunks]

    all_docs = [tokenize(doc) for doc in chunks]
    num_docs = len(all_docs) or 1

    # Document frequency
    df = {}
    for doc in all_docs:
        seen = set(doc)
        for w in seen:
            df[w] = df.get(w, 0) + 1

    embeddings = np.zeros((len(chunks), VECTOR_DIM), dtype=np.float32)

    for i, doc in enumerate(all_docs):
        if not doc:
            embeddings[i, 0] = 1.0
            continue

        total_words = len(doc)
        tf = {}
        for w in doc:
            tf[w] = tf.get(w, 0) + 1

        for w, count in tf.items():
            tf_val = count / total_words
            idf_val = math.log((num_docs + 1) / (df.get(w, 0) + 1)) + 1.0
            idx = hash_word(w, VECTOR_DIM)
            embeddings[i, idx] += tf_val * idf_val

        # L2 normalize
        norm = np.linalg.norm(embeddings[i])
        if norm > 0:
            embeddings[i] /= norm
        else:
            embeddings[i, 0] = 1.0

    return embeddings