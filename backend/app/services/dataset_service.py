# ============================================================
# app/services/dataset_service.py
# ============================================================

import uuid
import json
import math
from datetime import datetime
from pathlib import Path

import pandas as pd

from fastapi import (
    UploadFile,
    HTTPException,
    status
)

from sqlalchemy.orm import Session

from app.models.dataset import Dataset
from app.models.dashboard import Dashboard

from app.core.logger import logger

from app.repositories.dataset_repository import (
    create_dataset
)

from app.repositories.dashboard_repository import (
    get_user_dashboards,
    get_user_dashboard_by_id,
    create_dashboard
)

from app.services.dashboard_service import (
    verify_dashboard_owner
)

from app.services.profile_service import (
    generate_dataset_profile
)

from app.services.chart_service import (
    generate_dataset_charts
)

from app.utils.file_validator import (
    validate_file
)
from app.utils.data_cleaning import prepare_dataframe
from app.firebase.storage import upload_to_firebase_storage
from app.services.analytics_service import load_dataset
from app.utils.file_utils import resolve_dataset_path


# ============================================================
# UPLOAD DIRECTORY
# ============================================================

UPLOAD_FOLDER = (Path(__file__).resolve().parents[2] / "uploads").resolve()

UPLOAD_FOLDER.mkdir(
    parents=True,
    exist_ok=True
)



# ============================================================
# PROCESS DATASET UPLOAD
# ============================================================

def process_dataset_upload(
    db: Session,
    dashboard_id: int | None,
    user_id: int,
    file: UploadFile
):
    """
    Upload and process a dataset.

    Flow:

    1. Verify or ensure dashboard ownership
    2. Validate file
    3. Save uploaded file
    4. Read CSV/XLSX
    5. Validate dataset
    6. Clean column names
    7. Create Dataset record
    8. Generate dataset profile
    9. Automatically generate charts
    10. Return created Dataset

    Important:
    Chart-generation failure does NOT delete the dataset
    or uploaded file.
    """

    file_path = None

    # This becomes True after the Dataset record has
    # successfully been created.
    dataset_created = False

    try:

        # ====================================================
        # 1. VERIFY OR CREATE DASHBOARD WORKSPACE
        # ====================================================

        dashboard = None
        if dashboard_id and dashboard_id > 0:
            dashboard = get_user_dashboard_by_id(db, dashboard_id, user_id)

        if not dashboard:
            existing_dashboards = get_user_dashboards(db, user_id)
            if existing_dashboards:
                dashboard = existing_dashboards[0]
            else:
                dashboard = Dashboard(
                    user_id=user_id,
                    title="My Data Workspace",
                    description="Default workspace created for your datasets"
                )
                dashboard = create_dashboard(db, dashboard)

        dashboard_id = dashboard.id

        logger.info(
            "Dataset upload started | "
            f"User: {user_id} | "
            f"Dashboard: {dashboard_id} | "
            f"File: {file.filename}"
        )


        # ====================================================
        # 2. VALIDATE FILE
        # ====================================================

        extension = validate_file(
            file
        )

        logger.info(
            f"Validated file extension: {extension}"
        )


        # ====================================================
        # 3. GENERATE UNIQUE FILE NAME
        # ====================================================

        unique_name = (
            f"{uuid.uuid4()}{extension}"
        )

        file_path = (
            UPLOAD_FOLDER /
            unique_name
        )

        logger.info(
            f"Generated storage path: {file_path}"
        )


        # ====================================================
        # 4. SAVE UPLOADED FILE
        # ====================================================

        contents = file.file.read()

        if not contents:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty"
            )

        with open(
            file_path,
            "wb"
        ) as f:

            f.write(
                contents
            )

        try:

            file.file.close()

        except Exception:

            pass

        logger.info(
            f"Uploaded file saved: {file_path}"
        )


        # ====================================================
        # 5. READ DATASET
        # ====================================================

        try:

            if extension == ".csv":

                try:

                    df = pd.read_csv(
                        file_path
                    )

                except UnicodeDecodeError:

                    logger.warning(
                        "UTF-8 decoding failed. "
                        "Retrying CSV using latin-1."
                    )

                    df = pd.read_csv(
                        file_path,
                        encoding="latin-1"
                    )

            elif extension == ".xlsx":

                df = pd.read_excel(
                    file_path
                )

            else:

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Unsupported file type. "
                        "Only CSV and XLSX files are supported."
                    )
                )

        except HTTPException:

            raise

        except Exception as exc:

            logger.exception(
                "Failed to parse uploaded dataset"
            )

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Failed to parse dataset: "
                    f"{str(exc)}"
                )
            )


        # ====================================================
        # 6. VALIDATE DATASET CONTENT
        # ====================================================

        if df.empty:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file contains no rows."
            )

        if len(df.columns) == 0:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file contains no columns."
            )


        # ====================================================
        # 7. PREPARE DATASET
        # ====================================================

        df, cleaning_report = prepare_dataframe(df)

        if df.empty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The dataset has no usable rows after cleaning."
            )

        # Persist the prepared copy. Every existing endpoint now works with the
        # same cleaned data that the user sees in the dashboard.
        if extension == ".csv":
            df.to_csv(file_path, index=False)
        else:
            df.to_excel(file_path, index=False)

        with open(f"{file_path}.quality.json", "w", encoding="utf-8") as report_file:
            json.dump(cleaning_report, report_file)

        logger.info(
            "Dataset loaded successfully | "
            f"Rows: {len(df)} | "
            f"Columns: {len(df.columns)}"
        )

        logger.info(
            f"Dataset columns: {df.columns.tolist()}"
        )
        logger.info(f"Dataset preparation report: {cleaning_report}")


        # ====================================================
        # 8. CREATE DATASET RECORD
        # ====================================================

        dataset = Dataset(

            dashboard_id=dashboard_id,

            original_filename=file.filename,

            stored_filename=unique_name,

            file_path=str(
                file_path
            ),

            file_type=extension,

            rows=len(df),

            columns=len(df.columns)

        )


        dataset = create_dataset(
            db,
            dataset
        )

        # Transient response metadata; no schema migration is required.
        dataset.cleaning_report = cleaning_report

        dataset_created = True

        # Upload file to Firebase Cloud Storage
        try:
            fb_url = upload_to_firebase_storage(
                local_file_path=file_path,
                destination_path=f"datasets/{user_id}/{unique_name}",
                content_type="text/csv" if extension == ".csv" else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
            if fb_url:
                dataset.firebase_storage_url = fb_url
                db.commit()
                db.refresh(dataset)
        except Exception as fb_exc:
            logger.warning(f"Firebase Storage upload skipped/failed: {fb_exc}")

        logger.info(
            "Dataset record created | "
            f"Dataset ID: {dataset.id}"
        )


        # ====================================================
        # 9. GENERATE DATASET PROFILE
        # ====================================================

        try:

            generate_dataset_profile(
                db,
                dataset.id,
                df
            )

            logger.info(
                "Dataset profile generated | "
                f"Dataset ID: {dataset.id}"
            )

        except Exception as exc:

            logger.exception(
                "Dataset profile generation failed"
            )

            # IMPORTANT:
            # Dataset has already been created.
            # Do not delete the uploaded file.

            raise HTTPException(
                status_code=(
                    status.HTTP_500_INTERNAL_SERVER_ERROR
                ),
                detail=(
                    "Dataset uploaded, but "
                    "profile generation failed: "
                    f"{str(exc)}"
                )
            )


        # ====================================================
        # 10. AUTOMATIC CHART GENERATION
        # ====================================================

        try:

            print(
                "========================================"
            )

            print(
                "🔥 AUTOMATIC CHART GENERATION"
            )

            print(
                "Dataset ID:",
                dataset.id
            )

            print(
                "Dashboard ID:",
                dataset.dashboard_id
            )

            print(
                "========================================"
            )


            generated_charts = (
                generate_dataset_charts(

                    db=db,

                    dataset_id=dataset.id

                )
            )


            print(
                "🔥 AUTOMATIC CHART GENERATION COMPLETED"
            )

            print(
                "Generated charts:",
                len(generated_charts)
            )

            logger.info(
                "Automatic chart generation completed | "
                f"Dataset ID: {dataset.id} | "
                f"Charts: {len(generated_charts)}"
            )


        except Exception as exc:

            logger.exception(
                "Automatic chart generation failed"
            )


            print(
                "❌ Chart generation failed:"
            )

            print(
                str(exc)
            )


            # IMPORTANT:
            #
            # The dataset remains uploaded.
            # The physical file remains on disk.
            #
            # We do NOT delete the dataset just because
            # chart generation failed.

            logger.warning(
                "Dataset preserved despite chart-generation failure | "
                f"Dataset ID: {dataset.id}"
            )


        # ====================================================
        # 11. FINAL SUCCESS
        # ====================================================

        logger.info(
            "Dataset upload completed successfully | "
            f"Dataset ID: {dataset.id}"
        )


        # ====================================================
        # 12. RETURN CREATED DATASET
        # ====================================================

        return dataset


    # ========================================================
    # HTTP EXCEPTION
    # ========================================================

    except HTTPException:

        # ----------------------------------------------------
        # IMPORTANT:
        #
        # Before Dataset creation, remove the physical file
        # when processing fails.
        #
        # After Dataset creation, preserve it.
        # ----------------------------------------------------

        if (
            not dataset_created
            and
            file_path is not None
            and
            file_path.exists()
        ):

            try:

                file_path.unlink(
                    missing_ok=True
                )

                logger.info(
                    "Removed uploaded file after failed upload | "
                    f"Path: {file_path}"
                )

            except Exception:

                logger.exception(
                    "Failed to remove uploaded file"
                )


        try:

            db.rollback()

        except Exception:

            pass


        raise


    # ========================================================
    # UNEXPECTED ERROR
    # ========================================================

    except Exception as exc:

        logger.exception(
            "Unexpected error during dataset upload"
        )


        # ----------------------------------------------------
        # Only remove physical file if the Dataset record
        # has NOT been created yet.
        # ----------------------------------------------------

        if (
            not dataset_created
            and
            file_path is not None
            and
            file_path.exists()
        ):

            try:

                file_path.unlink(
                    missing_ok=True
                )

            except Exception:

                logger.exception(
                    "Failed to remove uploaded file"
                )


        try:

            db.rollback()

        except Exception:

            pass


        raise HTTPException(

            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),

            detail=(
                "Dataset upload failed: "
                f"{str(exc)}"
            )

        )


# ============================================================
# GET DATASET PREVIEW
# ============================================================

def get_dataset_preview(
    db: Session,
    dataset_id: int,
    limit: int = 500
):
    """
    Return a preview of a dataset.
    """

    # ========================================================
    # FIND DATASET
    # ========================================================

    dataset = (

        db.query(Dataset)

        .filter(
            Dataset.id == dataset_id
        )

        .first()

    )


    if not dataset:

        raise ValueError(
            "Dataset not found"
        )


    # ========================================================
    # LOAD DATASET
    # ========================================================

    try:
        df = load_dataset(dataset.file_path)
    except Exception as exc:
        logger.exception("Failed to load dataset preview")
        raise ValueError(f"Failed to load dataset: {str(exc)}")



    # ========================================================
    # VALIDATE LIMIT
    # ========================================================

    try:

        limit = int(
            limit
        )

    except (
        TypeError,
        ValueError
    ):

        limit = 500


    limit = max(
        1,
        min(limit, 500)
    )


    # ========================================================
    # TAKE PREVIEW ROWS
    # ========================================================

    df = df.head(
        limit
    )


    # ========================================================
    # JSON-SAFE VALUES
    # ========================================================

    raw_records = df.to_dict(orient="records")
    clean_records = []
    for row in raw_records:
        clean_row = {}
        for k, v in row.items():
            if v is None:
                clean_row[k] = None
            elif isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
                clean_row[k] = None
            elif isinstance(v, (pd.Timestamp, datetime)):
                clean_row[k] = v.isoformat()
            elif hasattr(v, "item"):
                try:
                    val = v.item()
                    clean_row[k] = None if (isinstance(val, float) and (math.isnan(val) or math.isinf(val))) else val
                except Exception:
                    clean_row[k] = str(v)
            elif pd.isna(v):
                clean_row[k] = None
            else:
                clean_row[k] = v
        clean_records.append(clean_row)

    # ========================================================
    # RETURN
    # ========================================================

    return {
        "dataset_id": dataset.id,
        "filename": dataset.original_filename,
        "rows": dataset.rows,
        "columns": dataset.columns,
        "data": clean_records
    }

