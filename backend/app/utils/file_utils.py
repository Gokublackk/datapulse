import os

from fastapi import UploadFile


from app.core.constants import (
    ALLOWED_FILE_TYPES
)



def validate_extension(
    file: UploadFile
):

    extension = os.path.splitext(
        file.filename
    )[1].lower()


    if extension not in ALLOWED_FILE_TYPES:

        raise ValueError(
            "Unsupported file format"
        )


    return extension


def resolve_dataset_path(file_path: str | os.PathLike) -> str:
    """
    Robustly resolves a dataset file path whether the backend was started from
    the repository root, the backend directory, or if an absolute/relative path was stored.
    """
    from pathlib import Path
    p = Path(file_path)
    if p.is_file():
        return str(p.resolve())

    # Check relative to backend root
    backend_root = Path(__file__).resolve().parents[2]
    cand1 = backend_root / file_path
    if cand1.is_file():
        return str(cand1.resolve())

    cand2 = backend_root / "uploads" / p.name
    if cand2.is_file():
        return str(cand2.resolve())

    cand3 = backend_root.parent / "uploads" / p.name
    if cand3.is_file():
        return str(cand3.resolve())

    return str(p)