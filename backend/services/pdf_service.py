try:
    import pymupdf as fitz
except ImportError:
    import fitz
import os


# =========================================================
# EXTRACT TEXT FROM PDF
# =========================================================

def extract_text_from_pdf(file_path):

    # -----------------------------------------------------
    # CHECK FILE
    # -----------------------------------------------------

    if not file_path:

        raise ValueError(
            "PDF file path is required."
        )


    if not os.path.exists(file_path):

        raise FileNotFoundError(
            f"PDF file not found: {file_path}"
        )


    if not file_path.lower().endswith(".pdf"):

        raise ValueError(
            "Only PDF files are supported."
        )


    # -----------------------------------------------------
    # OPEN PDF
    # -----------------------------------------------------

    document = None

    try:

        document = fitz.open(
            file_path
        )


        # -------------------------------------------------
        # EXTRACT TEXT
        # -------------------------------------------------

        text_parts = []


        for page in document:

            page_text = page.get_text(
                "text"
            )


            if page_text:

                text_parts.append(
                    page_text
                )


        # -------------------------------------------------
        # COMBINE TEXT
        # -------------------------------------------------

        text = "\n".join(
            text_parts
        ).strip()


        # -------------------------------------------------
        # CHECK EXTRACTED TEXT
        # -------------------------------------------------

        if not text:

            raise ValueError(
                "No readable text found in the PDF."
            )


        return text


    except Exception as e:

        print(
            "PDF extraction error:",
            e
        )

        raise


    finally:

        if document is not None:

            document.close()