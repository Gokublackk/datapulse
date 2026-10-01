# ============================================================
# app/repositories/chart_repository.py
# ============================================================

from sqlalchemy.orm import Session

from app.models.chart import Chart


# ============================================================
# CREATE CHART
# ============================================================

def create_chart(
    db: Session,
    chart: Chart
) -> Chart:

    print(
        "🔥🔥🔥 CREATE_CHART FUNCTION CALLED 🔥🔥🔥"
    )

    print(
        "================================"
    )

    print(
        "BEFORE ADD"
    )

    print(
        "Title:",
        chart.title
    )

    print(
        "Type:",
        chart.chart_type
    )

    print(
        "Dataset ID:",
        chart.dataset_id
    )

    print(
        "Dashboard ID:",
        chart.dashboard_id
    )

    # --------------------------------------------------------
    # Add chart to session
    # --------------------------------------------------------

    db.add(
        chart
    )

    print(
        "AFTER ADD - BEFORE COMMIT"
    )

    # --------------------------------------------------------
    # Commit
    # --------------------------------------------------------

    db.commit()

    print(
        "AFTER COMMIT"
    )

    # --------------------------------------------------------
    # Refresh
    # --------------------------------------------------------

    db.refresh(
        chart
    )

    print(
        "AFTER REFRESH"
    )

    print(
        "Chart ID:",
        chart.id
    )

    print(
        "Title:",
        chart.title
    )

    print(
        "================================"
    )

    return chart


# ============================================================
# GET ALL CHARTS FOR DATASET
# ============================================================

def get_dataset_charts(
    db: Session,
    dataset_id: int
):

    return (

        db.query(
            Chart
        )

        .filter(
            Chart.dataset_id == dataset_id
        )

        .order_by(
            Chart.score.desc()
        )

        .all()

    )


# ============================================================
# GET SINGLE CHART
# ============================================================

def get_chart(
    db: Session,
    chart_id: int
):

    return (

        db.query(
            Chart
        )

        .filter(
            Chart.id == chart_id
        )

        .first()

    )


# ============================================================
# DELETE ALL CHARTS FOR DATASET
# ============================================================

def delete_dataset_charts(
    db: Session,
    dataset_id: int
):

    (

        db.query(
            Chart
        )

        .filter(
            Chart.dataset_id == dataset_id
        )

        .delete(
            synchronize_session=False
        )

    )

    db.commit()