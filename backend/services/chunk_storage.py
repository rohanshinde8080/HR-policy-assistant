import json
import os


# =========================================================
# DEFAULT STORAGE PATH
# =========================================================

CHUNKS_FILE = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "faiss_db", "chunks.json")
)


# =========================================================
# SAVE CHUNKS
# =========================================================

def save_chunks(
    chunks,
    file_path=CHUNKS_FILE
):

    # Create folder if it doesn't exist
    folder = os.path.dirname(file_path)

    if folder:
        os.makedirs(
            folder,
            exist_ok=True
        )


    # Validate chunks
    if not chunks:

        raise ValueError(
            "No chunks available to save."
        )


    # Save chunks
    with open(
        file_path,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            chunks,
            file,
            ensure_ascii=False,
            indent=2
        )


# =========================================================
# LOAD CHUNKS
# =========================================================

def load_chunks(
    file_path=CHUNKS_FILE
):

    if not os.path.exists(file_path):

        raise FileNotFoundError(
            f"Chunks file not found: {file_path}"
        )


    with open(
        file_path,
        "r",
        encoding="utf-8"
    ) as file:

        chunks = json.load(file)


    if not chunks:

        raise ValueError(
            "Chunks file is empty."
        )


    return chunks