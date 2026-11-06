import os
import uuid
import aiofiles
from typing import Set, Tuple
from fastapi import HTTPException, UploadFile, status
from app.core.config import settings

ALLOWED_RESUME_EXTENSIONS: Set[str] = {".pdf", ".png", ".jpg", ".jpeg"}
ALLOWED_DATA_EXTENSIONS: Set[str] = {".csv", ".json", ".pdf"}


def validate_file_extension(filename: str, allowed_extensions: Set[str]) -> str:
    """Validates that the file has an allowed extension and returns the lowercase extension."""
    if not filename or "." not in filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is missing or has no file extension"
        )
    ext = os.path.splitext(filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension '{ext}' is not supported. Allowed: {sorted(list(allowed_extensions))}"
        )
    return ext


async def save_uploaded_file(upload_file: UploadFile, subfolder: str = "resumes") -> Tuple[str, str]:
    """
    Saves an uploaded file asynchronously to a secure directory.
    Returns: (saved_file_path, unique_file_name)
    """
    target_dir = os.path.join(settings.UPLOAD_DIR, subfolder)
    os.makedirs(target_dir, exist_ok=True)

    ext = os.path.splitext(upload_file.filename or "file")[1].lower()
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    destination_path = os.path.join(target_dir, unique_filename)

    # Read and write chunks to enforce max size limits safely & block dangerous binaries
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    total_size = 0
    first_chunk = True

    async with aiofiles.open(destination_path, "wb") as out_file:
        while content := await upload_file.read(1024 * 64):  # 64KB chunks
            if first_chunk:
                first_chunk = False
                # Reject disguised executable binaries (MZ header for PE, ELF header for Linux)
                if content.startswith(b"MZ") or content.startswith(b"\x7fELF"):
                    out_file.close()
                    if os.path.exists(destination_path):
                        os.remove(destination_path)
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Executable binaries are strictly prohibited."
                    )

            total_size += len(content)
            if total_size > max_bytes:
                # Cleanup partially written file
                out_file.close()
                if os.path.exists(destination_path):
                    os.remove(destination_path)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"Uploaded file exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB"
                )
            await out_file.write(content)

    return destination_path, unique_filename


def delete_file_safe(file_path: str) -> None:
    """Silently deletes file if it exists."""
    try:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
    except Exception:
        pass
