# app/services/chart_service.py

from typing import List, Dict, Any
import sys

import pandas as pd

# Older Windows terminals often default to cp1252. This service historically
# logs emoji diagnostics, so ensure those diagnostics cannot abort chart jobs.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from sqlalchemy.orm import Session

from app.models.chart import Chart
from app.models.dataset import Dataset

from app.repositories.chart_repository import (
    create_chart,
    get_dataset_charts,
    get_chart
)

from app.services.analytics_service import (
    load_dataset,
    recommend_charts
)


# ============================================================
# 1. GENERATE CHART RECOMMENDATIONS
# ============================================================

def generate_chart_recommendations(
    df: pd.DataFrame
) -> List[Dict[str, Any]]:
    """
    Generate chart recommendations using
    the analytics engine.
    """

    print(
        "🔥 GENERATE_CHART_RECOMMENDATIONS STARTED"
    )

    # --------------------------------------------------------
    # Validate dataframe
    # --------------------------------------------------------

    if df is None:

        print(
            "⚠️ DataFrame is None."
        )

        return []

    if df.empty:

        print(
            "⚠️ DataFrame is empty."
        )

        return []

    # --------------------------------------------------------
    # Debug information
    # --------------------------------------------------------

    print(
        "DF TYPE:",
        type(df)
    )

    print(
        "DF SHAPE:",
        df.shape
    )

    print(
        "DF COLUMNS:",
        df.columns.tolist()
    )

    # --------------------------------------------------------
    # Call analytics engine
    # --------------------------------------------------------

    recommendations = recommend_charts(
        df
    )

    # --------------------------------------------------------
    # Debug recommendations
    # --------------------------------------------------------

    print(
        "🔥 RECOMMENDATIONS COUNT:",
        len(recommendations)
    )

    for recommendation in recommendations:

        print(
            "🔥 Recommendation:",
            recommendation
        )

    return recommendations


# ============================================================
# 2. SAVE CHART RECOMMENDATIONS
# ============================================================

def save_chart_recommendations(
    db: Session,
    dataset_id: int,
    dashboard_id: int,
    df: pd.DataFrame
) -> List[Chart]:
    """
    Generate chart recommendations and save them
    into the database.

    Existing charts for this dataset are deleted
    and replaced with the latest recommendations.
    """

    print(
        "🔥 SAVE_CHART_RECOMMENDATIONS STARTED 🔥"
    )

    # ========================================================
    # VALIDATE INPUT
    # ========================================================

    if not dataset_id:

        raise ValueError(
            "dataset_id is required."
        )

    if not dashboard_id:

        raise ValueError(
            "dashboard_id is required."
        )

    if df is None or df.empty:

        print(
            "⚠️ Dataset is empty."
        )

        return []

    # ========================================================
    # GENERATE RECOMMENDATIONS
    # ========================================================

    recommendations = (
        generate_chart_recommendations(
            df
        )
    )

    print(
        "🔥 TOTAL RECOMMENDATIONS:",
        len(recommendations)
    )

    # ========================================================
    # GET EXISTING CHARTS
    # ========================================================

    existing_charts = get_dataset_charts(
        db,
        dataset_id
    )

    print(
        "🔥 EXISTING CHARTS:",
        len(existing_charts)
    )

    # ========================================================
    # DELETE OLD CHARTS
    # ========================================================

    for old_chart in existing_charts:

        print(
            "🗑️ Removing old chart:",
            old_chart.id,
            old_chart.title
        )

        db.delete(
            old_chart
        )

    # Make sure deletes happen before inserts.

    db.flush()

    # ========================================================
    # CREATE NEW CHARTS
    # ========================================================

    created_charts: List[Chart] = []

    for recommendation in recommendations:

        print(
            "================================"
        )

        print(
            "🔥 PROCESSING RECOMMENDATION"
        )

        print(
            recommendation
        )

        # ----------------------------------------------------
        # Read values
        # ----------------------------------------------------

        chart_type = recommendation.get(
            "chart_type"
        )

        x_axis = recommendation.get(
            "x_axis"
        )

        y_axis = recommendation.get(
            "y_axis"
        )

        reason = recommendation.get(
            "reason",
            "Recommended visualization"
        )

        score = recommendation.get(
            "score",
            0
        )

        configuration = recommendation.get(
            "configuration",
            {}
        )

        # ----------------------------------------------------
        # Validate chart type
        # ----------------------------------------------------

        if not chart_type:

            print(
                "⚠️ Skipping recommendation."
            )

            print(
                "⚠️ chart_type is missing."
            )

            continue

        # ----------------------------------------------------
        # Build title
        # ----------------------------------------------------

        title = recommendation.get(
            "title"
        )

        if not title:

            if x_axis:

                title = (
                    f"{chart_type}: {x_axis}"
                )

            else:

                title = chart_type

        # ====================================================
        # CREATE CHART MODEL
        # ====================================================

        chart = Chart(

            dashboard_id=dashboard_id,

            dataset_id=dataset_id,

            title=title,

            chart_type=chart_type,

            x_axis=x_axis,

            y_axis=y_axis,

            reason=reason,

            score=score,

            configuration=configuration

        )

        # ----------------------------------------------------
        # Debug
        # ----------------------------------------------------

        print(
            "🔥 CHART OBJECT CREATED"
        )

        print(
            "Chart Type:",
            chart.chart_type
        )

        print(
            "Title:",
            chart.title
        )

        print(
            "X Axis:",
            chart.x_axis
        )

        print(
            "Y Axis:",
            chart.y_axis
        )

        print(
            "Reason:",
            chart.reason
        )

        print(
            "Score:",
            chart.score
        )

        print(
            "Configuration:",
            chart.configuration
        )

        print(
            "Dataset ID:",
            chart.dataset_id
        )

        print(
            "Dashboard ID:",
            chart.dashboard_id
        )

        # ====================================================
        # SAVE CHART
        # ====================================================

        try:

            created_chart = create_chart(
                db,
                chart
            )

        except Exception as exc:

            print(
                "❌ Failed to create chart:"
            )

            print(
                exc
            )

            db.rollback()

            raise

        # ----------------------------------------------------
        # Add to result
        # ----------------------------------------------------

        created_charts.append(
            created_chart
        )

        print(
            "🔥 CHART SAVED"
        )

        print(
            "Chart ID:",
            created_chart.id
        )

    # ========================================================
    # COMMIT
    # ========================================================

    try:

        db.commit()

    except Exception as exc:

        print(
            "❌ Chart commit failed:"
        )

        print(
            exc
        )

        db.rollback()

        raise

    # ========================================================
    # FINAL RESULT
    # ========================================================

    print(
        "================================"
    )

    print(
        "🔥 CHART GENERATION COMPLETED"
    )

    print(
        "🔥 SAVED CHARTS:",
        len(created_charts)
    )

    print(
        "================================"
    )

    return created_charts


# ============================================================
# 3. GENERATE DATASET CHARTS
# ============================================================

def generate_dataset_charts(
    db: Session,
    dataset_id: int
) -> List[Chart]:
    """
    Load a dataset from the database,
    generate AI chart recommendations,
    delete previous charts,
    and save the new charts.
    """

    print(
        "🔥 GENERATE_DATASET_CHARTS STARTED"
    )

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
            "Dataset not found."
        )

    # ========================================================
    # VALIDATE DASHBOARD
    # ========================================================

    if not dataset.dashboard_id:

        raise ValueError(
            "Dataset is not associated with a dashboard."
        )

    # ========================================================
    # VALIDATE FILE PATH
    # ========================================================

    if not dataset.file_path:

        raise ValueError(
            "Dataset file path is missing."
        )

    print(
        "🔥 Dataset ID:",
        dataset.id
    )

    print(
        "🔥 Dashboard ID:",
        dataset.dashboard_id
    )

    print(
        "🔥 Dataset file:",
        dataset.file_path
    )

    # ========================================================
    # LOAD DATASET
    # ========================================================

    try:

        df = load_dataset(
            dataset.file_path
        )

    except Exception as exc:

        print(
            "❌ Failed to load dataset:"
        )

        print(
            exc
        )

        raise ValueError(
            f"Failed to load dataset: {str(exc)}"
        )

    # ========================================================
    # GENERATE + SAVE CHARTS
    # ========================================================

    return save_chart_recommendations(

        db=db,

        dataset_id=dataset.id,

        dashboard_id=dataset.dashboard_id,

        df=df

    )


# ============================================================
# 4. LIST DATASET CHARTS
# ============================================================

def list_dataset_charts(
    db: Session,
    dataset_id: int
) -> List[Chart]:
    """
    Return all charts belonging to a dataset.
    """

    return get_dataset_charts(
        db,
        dataset_id
    )


# ============================================================
# 5. GET SINGLE CHART
# ============================================================

def get_chart_by_id(
    db: Session,
    chart_id: int
):
    """
    Return one chart by ID.
    """

    return get_chart(
        db,
        chart_id
    )
