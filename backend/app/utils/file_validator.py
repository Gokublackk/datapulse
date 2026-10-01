from pathlib import Path
from fastapi import UploadFile
from app.core.exceptions import DataPulseException


ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


def validate_file(file: UploadFile) -> str:
    if not file.filename:
        raise DataPulseException("Filename is missing", 400)

    extension = Path(file.filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise DataPulseException(
            "Only CSV and Excel files (.csv, .xlsx, .xls) are allowed",
            400
        )

    # Check file size
    file.file.seek(0, 2)          # go to end
    file_size = file.file.tell()
    file.file.seek(0)             # reset to beginning (VERY important)

    if file_size == 0:
        raise DataPulseException("Uploaded file is empty", 400)

    if file_size > MAX_FILE_SIZE:
        raise DataPulseException(
            f"File size exceeds the maximum limit of {MAX_FILE_SIZE // (1024*1024)} MB",
            400
        )

    return extension