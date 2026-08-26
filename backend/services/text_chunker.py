# =========================================================
# TEXT CHUNKING SERVICE
# =========================================================


def split_text(
    text,
    chunk_size=500,
    overlap=50
):

    # =====================================================
    # VALIDATION
    # =====================================================

    if not text or not text.strip():

        return []


    if chunk_size <= 0:

        raise ValueError(
            "chunk_size must be greater than 0."
        )


    if overlap < 0:

        raise ValueError(
            "overlap cannot be negative."
        )


    if overlap >= chunk_size:

        raise ValueError(
            "overlap must be smaller than chunk_size."
        )


    # =====================================================
    # CONVERT TEXT TO WORDS
    # =====================================================

    words = text.split()


    if not words:

        return []


    chunks = []

    current_chunk = []

    current_length = 0


    # =====================================================
    # CREATE CHUNKS
    # =====================================================

    for word in words:

        word_length = len(word) + 1


        # -------------------------------------------------
        # CHUNK SIZE REACHED
        # -------------------------------------------------

        if (
            current_chunk
            and
            current_length + word_length > chunk_size
        ):

            chunks.append(
                " ".join(current_chunk)
            )


            # -------------------------------------------------
            # CREATE OVERLAP
            # -------------------------------------------------

            overlap_words = []

            overlap_length = 0


            for previous_word in reversed(
                current_chunk
            ):

                previous_length = (
                    len(previous_word) + 1
                )


                if (
                    overlap_length +
                    previous_length
                    > overlap
                ):

                    break


                overlap_words.insert(
                    0,
                    previous_word
                )


                overlap_length += (
                    previous_length
                )


            # -------------------------------------------------
            # START NEXT CHUNK
            # -------------------------------------------------

            current_chunk = (
                overlap_words
            )

            current_length = (
                overlap_length
            )


        # -------------------------------------------------
        # ADD CURRENT WORD
        # -------------------------------------------------

        current_chunk.append(
            word
        )

        current_length += (
            word_length
        )


    # =====================================================
    # ADD LAST CHUNK
    # =====================================================

    if current_chunk:

        chunks.append(
            " ".join(current_chunk)
        )


    # =====================================================
    # REMOVE EMPTY CHUNKS
    # =====================================================

    chunks = [
        chunk.strip()
        for chunk in chunks
        if chunk.strip()
    ]


    return chunks