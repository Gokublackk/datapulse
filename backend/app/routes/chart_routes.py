# app/routes/chart_routes.py

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.core.database import get_db

from app.models.dataset import Dataset

from app.services.analytics_service import (
    load_dataset
)

from app.services.chart_service import (
    save_chart_recommendations,
    list_dataset_charts,
    get_chart_by_id
)
from app.services.chart_data_service import(
    generate_chart_data
)
from app.repositories.chart_repository import (
    get_chart
)

from app.schemas.api_response import (
    ApiResponse
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/charts",
    tags=["Charts"]
)


# ============================================================
# HELPER — CONVERT CHART TO RESPONSE
# ============================================================

def chart_to_dict(chart):

    return {

        "id": chart.id,

        "dataset_id": chart.dataset_id,

        "dashboard_id": chart.dashboard_id,

        "title": chart.title,

        "chart_type": chart.chart_type,

        "x_axis": chart.x_axis,

        "y_axis": chart.y_axis,

        "reason": chart.reason,

        "score": chart.score,

        "configuration": chart.configuration

    }


# ============================================================
# 1. GENERATE CHARTS FOR DATASET
# ============================================================

@router.post(
    "/generate/{dataset_id}"
)
def generate_charts_for_dataset(

    dataset_id: int,

    db: Session = Depends(
        get_db
    )

):

    # --------------------------------------------------------
    # FIND DATASET
    # --------------------------------------------------------

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


    # --------------------------------------------------------
    # LOAD DATASET
    # --------------------------------------------------------

    try:

        df = load_dataset(
            dataset.file_path
        )

    except Exception as e:

        raise HTTPException(

            status_code=500,

            detail=(
                f"Failed to load dataset: {str(e)}"
            )

        )


    # --------------------------------------------------------
    # GENERATE + SAVE CHARTS
    # --------------------------------------------------------

    try:

        charts = save_chart_recommendations(

            db=db,

            dataset_id=dataset.id,

            dashboard_id=dataset.dashboard_id,

            df=df

        )

    except Exception as e:

        db.rollback()

        raise HTTPException(

            status_code=500,

            detail=(
                f"Failed to generate charts: {str(e)}"
            )

        )


    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return ApiResponse(

        success=True,

        message="Charts generated successfully",

        data=[

            chart_to_dict(chart)

            for chart in charts

        ]

    )


# ============================================================
# 2. GET ALL CHARTS FOR DATASET
# ============================================================

@router.get(
    "/dataset/{dataset_id}"
)
def get_dataset_charts_endpoint(

    dataset_id: int,

    db: Session = Depends(
        get_db
    )

):

    # --------------------------------------------------------
    # VERIFY DATASET EXISTS
    # --------------------------------------------------------

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


    # --------------------------------------------------------
    # GET CHARTS
    # --------------------------------------------------------

    charts = list_dataset_charts(

        db=db,

        dataset_id=dataset_id

    )


    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return ApiResponse(

        success=True,

        message="Charts retrieved successfully",

        data=[

            chart_to_dict(chart)

            for chart in charts

        ]

    )


# ============================================================
# 3. GET SINGLE CHART
# ============================================================

@router.get(
    "/{chart_id}"
)
def get_single_chart(

    chart_id: int,

    db: Session = Depends(
        get_db
    )

):

    # --------------------------------------------------------
    # FIND CHART
    # --------------------------------------------------------

    chart = get_chart_by_id(

        db=db,

        chart_id=chart_id

    )


    if not chart:

        raise HTTPException(

            status_code=404,

            detail="Chart not found"

        )


    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return ApiResponse(

        success=True,

        message="Chart retrieved successfully",

        data=chart_to_dict(chart)

    )
@router.get("/{chart_id}/data")
def get_chart_data(

    chart_id: int,

    db: Session = Depends(
        get_db
    )

):

    chart = get_chart(
        db,
        chart_id
    )


    if not chart:

        return {
            "success": False,
            "message": "Chart not found",
            "data": None
        }


    data = generate_chart_data(

        db=db,

        dataset_id=chart.dataset_id,

        chart_type=chart.chart_type,

        x_axis=chart.x_axis,

        y_axis=chart.y_axis

    )


    return {

        "success": True,

        "message": "Chart data retrieved successfully",

        "data": data

    }