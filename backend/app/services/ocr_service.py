import io
import logging
import os
from typing import Optional
try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

from PIL import Image

try:
    import pytesseract
except ImportError:
    pytesseract = None

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extracts text from PDF using PyMuPDF (fitz), with Tesseract OCR fallback
    for scanned or image-based pages.
    """
    extracted_text_chunks = []
    has_meaningful_text = False

    if not fitz:
        logger.warning("PyMuPDF (fitz) is not installed; attempting raw read or image fallback.")
        return ""

    try:
        doc = fitz.open(file_path)
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text("text").strip()

            if len(text) > 30:
                has_meaningful_text = True
                extracted_text_chunks.append(text)
            else:
                # Page seems scanned or image-only, attempt OCR if pytesseract is available
                if pytesseract:
                    try:
                        pix = page.get_pixmap(dpi=200)
                        img_bytes = pix.tobytes("png")
                        img = Image.open(io.BytesIO(img_bytes))
                        ocr_text = pytesseract.image_to_string(img)
                        if ocr_text.strip():
                            has_meaningful_text = True
                            extracted_text_chunks.append(ocr_text.strip())
                    except Exception as ocr_err:
                        logger.warning("OCR fallback failed on PDF page %d: %s", page_num, ocr_err)

        doc.close()
    except Exception as pdf_err:
        logger.error("Failed to read PDF file '%s': %s", file_path, pdf_err)
        raise

    full_text = "\n\n".join(extracted_text_chunks).strip()
    return full_text


def extract_text_from_image(file_path: str) -> str:
    """Extracts text from PNG/JPEG image using Tesseract OCR."""
    if not pytesseract:
        logger.warning("pytesseract is not installed; returning empty text for image %s", file_path)
        return ""

    try:
        img = Image.open(file_path)
        # Convert RGBA to RGB if needed
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        ocr_text = pytesseract.image_to_string(img)
        return ocr_text.strip()
    except Exception as img_err:
        logger.warning("Tesseract OCR extraction failed for '%s': %s", file_path, img_err)
        return ""


def extract_text_from_document(file_path: str) -> str:
    """
    Unified extraction entry point:
    Handles PDFs and image formats (.png, .jpg, .jpeg) safely.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Document file not found at path: {file_path}")

    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        text = extract_text_from_pdf(file_path)
    elif ext in (".png", ".jpg", ".jpeg"):
        text = extract_text_from_image(file_path)
    else:
        # Fallback for plain text files if uploaded
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
        except Exception as e:
            logger.error("Failed to read text file %s: %s", file_path, e)
            text = ""

    return text.strip()
