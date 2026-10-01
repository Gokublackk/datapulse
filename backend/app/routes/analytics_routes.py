from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.core.database import get_db

from app.schemas.analytics import (
    AnalyticsRequest
)

from app.models.dataset import Dataset

from app.services.analytics_service import (
    load_dataset,
    analyze_dataframe,
    recommend_charts
)


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


# ============================================================
# RUN DATASET ANALYSIS
# ============================================================

@router.post("/run")
def run_analysis(

    request: AnalyticsRequest,

    db: Session = Depends(
        get_db
    )

):

    # ========================================================
    # 1. FIND DATASET
    # ========================================================

    dataset = (

        db.query(Dataset)

        .filter(
            Dataset.id == request.dataset_id
        )

        .first()

    )


    if not dataset:

        raise HTTPException(

            status_code=404,

            detail="Dataset not found"

        )


    # ========================================================
    # 2. LOAD DATASET
    # ========================================================

    try:

        df = load_dataset(

            dataset.file_path

        )

    except Exception as e:

        raise HTTPException(

            status_code=400,

            detail=(
                f"Unable to load dataset: {str(e)}"
            )

        )


    # ========================================================
    # 3. ANALYZE DATASET
    # ========================================================

    try:

        analysis = analyze_dataframe(

            df

        )

    except Exception as e:

        raise HTTPException(

            status_code=500,

            detail=(
                f"Dataset analysis failed: {str(e)}"
            )

        )


    # ========================================================
    # 4. GENERATE CHART RECOMMENDATIONS
    # ========================================================

    try:

        recommendations = recommend_charts(

            df

        )

    except Exception as e:

        raise HTTPException(

            status_code=500,

            detail=(
                f"Chart recommendation failed: {str(e)}"
            )

        )


    # ========================================================
    # 5. RETURN ANALYTICS RESULT
    # ========================================================

    return {

        "success": True,

        "dataset_id":
            dataset.id,

        "data": {

            "analysis":
                analysis,

            "recommendations":
                recommendations

        }

    }