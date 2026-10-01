import os
import logging
from pathlib import Path
from firebase_admin import storage
from app.firebase.firebase_admin import initialize_firebase

logger = logging.getLogger("datapulse")


def upload_to_firebase_storage(
    local_file_path: str | Path,
    destination_path: str,
    content_type: str = "text/csv"
) -> str | None:
    """
    Uploads a file to Firebase Cloud Storage and returns the public or signed URL.
    Gracefully catches any network or auth errors so local processing is never blocked.
    """
    try:
        initialize_firebase()
        bucket = storage.bucket()
        blob = bucket.blob(destination_path)
        
        blob.upload_from_filename(
            str(local_file_path),
            content_type=content_type
        )
        
        # Try to make public or generate a download URL
        try:
            blob.make_public()
            url = blob.public_url
        except Exception:
            # If public access prevention is active, use a media URL format
            url = f"https://firebasestorage.googleapis.com/v0/b/{bucket.name}/o/{destination_path.replace('/', '%2F')}?alt=media"
            
        logger.info(f"Firebase Storage: uploaded {local_file_path} -> {url}")
        return url
    except Exception as exc:
        logger.warning(f"Firebase Storage upload skipped/failed ({exc}). Local file is safely preserved.")
        return None
