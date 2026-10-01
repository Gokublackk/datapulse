# ============================================================
# app/routes/dataset_routes.py
# ============================================================

import math
import json
from pathlib import Path

import pandas as pd

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Form,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.core.database import get_db

from app.services.dataset_service import (
    process_dataset_upload,
    get_dataset_preview
)

from app.services.analytics_service import (
    load_dataset
)
from app.utils.data_cleaning import prepare_dataframe

from app.dependencies.user_dependency import (
    get_database_user
)

from app.models.user import User
from app.models.dataset import Dataset
from app.models.dashboard import Dashboard

from app.schemas.api_response import (
    ApiResponse
)
from app.schemas.preprocessing import PreprocessRequest
from app.services.preprocessing_service import apply_preprocessing


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/datasets",
    tags=["Datasets"]
)


# ============================================================
# 1. UPLOAD DATASET
# ============================================================

@router.post(
    "/upload",
    response_model=ApiResponse
)
def upload_dataset(

    dashboard_id: int | None = Form(None),

    file: UploadFile = File(...),

    user: User = Depends(
        get_database_user
    ),

    db: Session = Depends(
        get_db
    )

):

    try:

        # IMPORTANT:
        # process_dataset_upload() now returns
        # the Dataset object directly.

        dataset = process_dataset_upload(

            db=db,

            dashboard_id=dashboard_id,

            user_id=user.id,

            file=file

        )

    except HTTPException:

        raise

    except Exception as exc:

        raise HTTPException(

            status_code=500,

            detail=(
                "Dataset upload failed: "
                f"{str(exc)}"
            )

        )


    # ========================================================
    # RETURN CREATED DATASET
    # ========================================================

    return ApiResponse(

        success=True,

        message=(
            "Dataset uploaded successfully"
        ),

        data={

            "dataset_id":
                dataset.id,

            "filename":
                dataset.original_filename,

            "rows":
                dataset.rows,

            "columns":
                dataset.columns,

            "uploaded_at":
                dataset.uploaded_at.isoformat() if dataset.uploaded_at else None,

            "firebase_storage_url":
                getattr(dataset, "firebase_storage_url", None),

            "cleaning_report": getattr(dataset, "cleaning_report", None)

        }

    )


# ============================================================
# 2. GET ALL DATASETS FOR A DASHBOARD
# ============================================================

@router.get(
    "/dashboard/{dashboard_id}"
)
def get_dashboard_datasets(

    dashboard_id: int,

    db: Session = Depends(
        get_db
    )

):

    datasets = (

        db.query(Dataset)

        .filter(
            Dataset.dashboard_id == dashboard_id
        )

        .order_by(
            Dataset.id.desc()
        )

        .all()

    )

    return {

        "success": True,

        "dashboard_id":
            dashboard_id,

        "data": [

            {

                "id":
                    dataset.id,

                "dashboard_id":
                    dataset.dashboard_id,

                "filename":
                    dataset.original_filename,

                "rows":
                    dataset.rows,

                "columns":
                    dataset.columns,

                "file_type":
                    dataset.file_type,

                "uploaded_at":
                    dataset.uploaded_at.isoformat() if dataset.uploaded_at else None,

                "firebase_storage_url":
                    getattr(dataset, "firebase_storage_url", None)

            }

            for dataset in datasets

        ]

    }


# ============================================================
# 3. GET DATASET PREVIEW
# ============================================================

@router.get(
    "/{dataset_id}/preview"
)
def preview_dataset(

    dataset_id: int,

    db: Session = Depends(
        get_db
    )

):

    try:

        return get_dataset_preview(

            db=db,

            dataset_id=dataset_id

        )

    except ValueError as exc:

        raise HTTPException(

            status_code=404,

            detail=str(exc)

        )

    except HTTPException:

        raise

    except Exception as exc:

        raise HTTPException(

            status_code=500,

            detail=(
                "Failed to generate preview: "
                f"{str(exc)}"
            )

        )


# ============================================================
# 4. GET COMPLETE DATASET DATA
# ============================================================
#
# MAIN DATA ENDPOINT USED BY THE FRONTEND
#
# GET:
#
# /datasets/{dataset_id}/data
#
# ============================================================

@router.get(
    "/{dataset_id}/data"
)
def get_dataset_data(

    dataset_id: int,

    db: Session = Depends(
        get_db
    )

):

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

        raise HTTPException(

            status_code=404,

            detail="Dataset not found"

        )


    # ========================================================
    # LOAD DATASET
    # ========================================================

    try:

        df = load_dataset(
            dataset.file_path
        )

    except Exception as exc:

        raise HTTPException(

            status_code=500,

            detail=(
                "Failed to load dataset: "
                f"{str(exc)}"
            )

        )


    # ========================================================
    # CLEAN COLUMN NAMES
    # ========================================================

    df.columns = (

        df.columns

        .astype(str)

        .str.strip()

    )


    # ========================================================
    # CONVERT DATAFRAME TO RECORDS
    # ========================================================

    records = df.to_dict(
        orient="records"
    )


    # ========================================================
    # CLEAN RECORDS
    # ========================================================

    clean_records = []

    for row in records:

        clean_row = {}

        for key, value in row.items():

            clean_row[key] = clean_value(
                value
            )

        clean_records.append(
            clean_row
        )


    # ========================================================
    # RESPONSE
    # ========================================================

    return {

        "success": True,

        "dataset_id":
            dataset_id,

        "total_rows":
            len(clean_records),

        "total_columns":
            len(df.columns),

        "columns":
            list(df.columns),

        "data":
            clean_records

    }


@router.get("/{dataset_id}/quality")
def get_dataset_quality(dataset_id: int, db: Session = Depends(get_db)):
    """Return the preparation report used by the data-quality UI."""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    report_path = Path(f"{dataset.file_path}.quality.json")
    if report_path.exists():
        with open(report_path, encoding="utf-8") as report_file:
            report = json.load(report_file)
    else:
        # Backward-compatible report for datasets uploaded before preparation.
        df = load_dataset(dataset.file_path)
        _, report = prepare_dataframe(df)
    report["dataset_id"] = dataset_id
    return {"success": True, "data": report}


# ============================================================
# INTERACTIVE DATASET PREPROCESSING
# ============================================================

@router.post("/{dataset_id}/preprocess")
def preprocess_dataset(
    dataset_id: int,
    request: PreprocessRequest,
    user: User = Depends(get_database_user),
    db: Session = Depends(get_db)
):
    """
    Applies interactive preprocessing transformations to a dataset (drop duplicates,
    drop nulls, impute missing values, filter outliers, convert types, normalize, etc.)
    and recalculates the quality score.
    """
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    try:
        df = load_dataset(dataset.file_path)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to load dataset: {exc}")

    try:
        transformed_df, change_summary = apply_preprocessing(
            df=df,
            action=request.action,
            columns=request.columns,
            strategy=request.strategy,
            fill_value=request.fill_value,
            target_type=request.target_type,
            rename_mapping=request.rename_mapping,
            factor=request.factor
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Preprocessing failed: {exc}")

    # Persist transformed dataframe
    if dataset.file_type == ".csv" or str(dataset.file_path).endswith(".csv"):
        transformed_df.to_csv(dataset.file_path, index=False)
    else:
        transformed_df.to_excel(dataset.file_path, index=False)

    dataset.rows = len(transformed_df)
    dataset.columns = len(transformed_df.columns)
    db.commit()
    db.refresh(dataset)

    # Recalculate quality report and persist it
    _, updated_report = prepare_dataframe(transformed_df)
    report_path = Path(f"{dataset.file_path}.quality.json")
    with open(report_path, "w", encoding="utf-8") as rf:
        json.dump(updated_report, rf)

    return {
        "success": True,
        "message": change_summary.get("details", "Dataset preprocessed successfully"),
        "data": {
            "dataset_id": dataset.id,
            "rows": dataset.rows,
            "columns": dataset.columns,
            "change_summary": change_summary,
            "quality_report": updated_report
        }
    }


# ============================================================
# 5. GET ALL DATASETS BELONGING TO CURRENT USER
# ============================================================

@router.get(
    "/my"
)
def get_my_datasets(

    user: User = Depends(
        get_database_user
    ),

    db: Session = Depends(
        get_db
    )

):

    datasets = (

        db.query(Dataset)

        .join(
            Dashboard,
            Dataset.dashboard_id == Dashboard.id
        )

        .filter(
            Dashboard.user_id == user.id
        )

        .order_by(
            Dataset.id.desc()
        )

        .all()

    )

    return {

        "success": True,

        "message":
            "Datasets retrieved successfully",

        "data": [

            {

                "id":
                    dataset.id,

                "dashboard_id":
                    dataset.dashboard_id,

                "filename":
                    dataset.original_filename,

                "rows":
                    dataset.rows,

                "columns":
                    dataset.columns,

                "file_type":
                    dataset.file_type,

                "uploaded_at":
                    dataset.uploaded_at.isoformat() if dataset.uploaded_at else None,

                "firebase_storage_url":
                    getattr(dataset, "firebase_storage_url", None)

            }

            for dataset in datasets

        ]

    }


# ============================================================
# JSON-SAFE VALUE CLEANER
# ============================================================

def clean_value(value):

    # ========================================================
    # NONE
    # ========================================================

    if value is None:

        return None


    # ========================================================
    # PANDAS TIMESTAMP
    # ========================================================

    if isinstance(
        value,
        pd.Timestamp
    ):

        return value.isoformat()


    # ========================================================
    # PYTHON FLOAT
    # ========================================================

    if isinstance(
        value,
        float
    ):

        if math.isnan(
            value
        ):

            return None

        if math.isinf(
            value
        ):

            return None

        return value


    # ========================================================
    # NUMPY SCALAR
    # ========================================================

    if hasattr(
        value,
        "item"
    ):

        try:

            value = value.item()

        except (
            ValueError,
            TypeError
        ):

            pass


    # ========================================================
    # FLOAT AFTER NUMPY CONVERSION
    # ========================================================

    if isinstance(
        value,
        float
    ):

        if math.isnan(
            value
        ):

            return None

        if math.isinf(
            value
        ):

            return None


    # ========================================================
    # GENERIC PANDAS NA / NAT
    # ========================================================

    try:

        if pd.isna(
            value
        ):

            return None

    except (
        TypeError,
        ValueError
    ):

        pass


    # ========================================================
    # RETURN VALUE
    # ========================================================

    return value
