# ============================================================
# app/services/chart_data_service.py
# ============================================================

from typing import Optional, Any

import pandas as pd

from sqlalchemy.orm import Session

from app.services.analytics_service import (
    load_dataset
)

from app.services.chart_service import (
    get_chart_by_id
)


# ============================================================
# LOAD DATASET DATAFRAME
# ============================================================

def load_dataset_dataframe(
    db: Session,
    dataset_id: int
) -> pd.DataFrame:

    # ========================================================
    # IMPORT DATASET MODEL HERE
    # ========================================================

    from app.models.dataset import Dataset

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

        df = load_dataset(
            dataset.file_path
        )

    except Exception as e:

        raise ValueError(
            f"Failed to load dataset: {str(e)}"
        )

    # ========================================================
    # NORMALIZE COLUMN NAMES
    # ========================================================

    df.columns = (
        df.columns
        .astype(str)
        .str.strip()
    )

    return df


# ============================================================
# VALIDATE AXES
# ============================================================

def validate_axes(
    df: pd.DataFrame,
    x_axis: str,
    y_axis: Optional[str] = None
):

    # ========================================================
    # X AXIS
    # ========================================================

    if not x_axis:

        raise ValueError(
            "Chart does not have an X axis"
        )

    if x_axis not in df.columns:

        raise ValueError(
            f"Column '{x_axis}' not found in dataset. "
            f"Available columns: {df.columns.tolist()}"
        )

    # ========================================================
    # Y AXIS
    # ========================================================

    if y_axis:

        if y_axis not in df.columns:

            raise ValueError(
                f"Column '{y_axis}' not found in dataset. "
                f"Available columns: {df.columns.tolist()}"
            )


# ============================================================
# PREPARE BAR CHART DATA
# ============================================================

def prepare_bar_chart_data(
    df: pd.DataFrame,
    x_axis: str,
    y_axis: Optional[str]
):

    validate_axes(
        df,
        x_axis,
        y_axis
    )

    if not y_axis:

        raise ValueError(
            "Bar chart requires a Y axis"
        )

    # ========================================================
    # SELECT REQUIRED COLUMNS
    # ========================================================

    working_df = df[
        [
            x_axis,
            y_axis
        ]
    ].copy()

    # ========================================================
    # REMOVE INVALID VALUES
    # ========================================================

    working_df = working_df.dropna(
        subset=[
            x_axis,
            y_axis
        ]
    )

    # ========================================================
    # CONVERT Y AXIS TO NUMERIC
    # ========================================================

    working_df[y_axis] = pd.to_numeric(
        working_df[y_axis],
        errors="coerce"
    )

    working_df = working_df.dropna(
        subset=[
            y_axis
        ]
    )

    # ========================================================
    # GROUP BY X AXIS
    # ========================================================

    grouped = (

        working_df

        .groupby(
            x_axis,
            dropna=False
        )[y_axis]

        .sum()

        .reset_index()

    )

    # ========================================================
    # CONVERT TO JSON-SAFE RECORDS
    # ========================================================

    grouped = grouped.where(
        pd.notnull(grouped),
        None
    )

    return grouped.to_dict(
        orient="records"
    )


# ============================================================
# PREPARE LINE CHART DATA
# ============================================================

def prepare_line_chart_data(
    df: pd.DataFrame,
    x_axis: str,
    y_axis: Optional[str]
):

    validate_axes(
        df,
        x_axis,
        y_axis
    )

    if not y_axis:

        raise ValueError(
            "Line chart requires a Y axis"
        )

    # ========================================================
    # SELECT REQUIRED COLUMNS
    # ========================================================

    working_df = df[
        [
            x_axis,
            y_axis
        ]
    ].copy()

    # ========================================================
    # CONVERT Y TO NUMERIC
    # ========================================================

    working_df[y_axis] = pd.to_numeric(
        working_df[y_axis],
        errors="coerce"
    )

    # ========================================================
    # REMOVE INVALID VALUES
    # ========================================================

    working_df = working_df.dropna(
        subset=[
            x_axis,
            y_axis
        ]
    )

    # ========================================================
    # TRY DATE CONVERSION
    # ========================================================

    converted_dates = pd.to_datetime(
        working_df[x_axis],
        errors="coerce"
    )

    if converted_dates.notna().all():

        working_df[x_axis] = converted_dates

        # ----------------------------------------------------
        # SORT BY DATE
        # ----------------------------------------------------

        working_df = working_df.sort_values(
            by=x_axis
        )

        # ----------------------------------------------------
        # Convert Timestamp to string
        # for JSON serialization
        # ----------------------------------------------------

        working_df[x_axis] = (
            working_df[x_axis]
            .dt.strftime("%Y-%m-%d")
        )

    else:

        # ====================================================
        # TRY NUMERIC X AXIS
        # ====================================================

        numeric_x = pd.to_numeric(
            working_df[x_axis],
            errors="coerce"
        )

        if numeric_x.notna().all():

            working_df[x_axis] = numeric_x

            working_df = working_df.sort_values(
                by=x_axis
            )

        else:

            # =================================================
            # FALLBACK TO STRING
            # =================================================

            working_df[x_axis] = (
                working_df[x_axis]
                .astype(str)
            )

    # ========================================================
    # GROUP DUPLICATE X VALUES
    # ========================================================

    grouped = (

        working_df

        .groupby(
            x_axis,
            dropna=False
        )[y_axis]

        .sum()

        .reset_index()

    )

    # ========================================================
    # JSON-SAFE VALUES
    # ========================================================

    grouped = grouped.where(
        pd.notnull(grouped),
        None
    )

    return grouped.to_dict(
        orient="records"
    )


# ============================================================
# PREPARE SCATTER CHART DATA
# ============================================================

def prepare_scatter_chart_data(
    df: pd.DataFrame,
    x_axis: str,
    y_axis: Optional[str]
):

    validate_axes(
        df,
        x_axis,
        y_axis
    )

    if not y_axis:

        raise ValueError(
            "Scatter plot requires a Y axis"
        )

    # ========================================================
    # SELECT X + Y
    # ========================================================

    working_df = df[
        [
            x_axis,
            y_axis
        ]
    ].copy()

    # ========================================================
    # CONVERT BOTH AXES TO NUMERIC
    # ========================================================

    working_df[x_axis] = pd.to_numeric(
        working_df[x_axis],
        errors="coerce"
    )

    working_df[y_axis] = pd.to_numeric(
        working_df[y_axis],
        errors="coerce"
    )

    # ========================================================
    # REMOVE INVALID ROWS
    # ========================================================

    working_df = working_df.dropna(
        subset=[
            x_axis,
            y_axis
        ]
    )

    # ========================================================
    # RETURN RECORDS
    # ========================================================

    return working_df.to_dict(
        orient="records"
    )


# ============================================================
# GENERATE CHART DATA
# ============================================================

def generate_chart_data(
    db: Session,
    dataset_id: int,
    chart_type: str,
    x_axis: str,
    y_axis: Optional[str]
):

    # ========================================================
    # LOAD DATASET
    # ========================================================

    df = load_dataset_dataframe(
        db,
        dataset_id
    )

    # ========================================================
    # DEBUG
    # ========================================================

    print(
        "========================================"
    )

    print(
        "🔥 CHART DATA GENERATION"
    )

    print(
        "Dataset ID:",
        dataset_id
    )

    print(
        "Chart Type:",
        chart_type
    )

    print(
        "X Axis:",
        x_axis
    )

    print(
        "Y Axis:",
        y_axis
    )

    print(
        "Dataset Shape:",
        df.shape
    )

    print(
        "Dataset Columns:",
        df.columns.tolist()
    )

    print(
        "========================================"
    )

    # ========================================================
    # VALIDATE CHART TYPE
    # ========================================================

    if not chart_type:

        raise ValueError(
            "Chart type is required"
        )

    chart_type_lower = (
        chart_type.lower()
    )

    # ========================================================
    # HISTOGRAM
    # ========================================================

    if "histogram" in chart_type_lower:

        validate_axes(
            df,
            x_axis
        )

        values = (

            df[x_axis]

            .dropna()

            .tolist()

        )

        return {

            "dataset_id":
                dataset_id,

            "chart_type":
                chart_type,

            "x_axis":
                x_axis,

            "y_axis":
                None,

            "data":
                values

        }

    # ========================================================
    # BAR CHART
    # ========================================================

    if "bar" in chart_type_lower or "radar" in chart_type_lower:

        data = prepare_bar_chart_data(
            df,
            x_axis,
            y_axis
        )

        return {

            "dataset_id":
                dataset_id,

            "chart_type":
                chart_type,

            "x_axis":
                x_axis,

            "y_axis":
                y_axis,

            "data":
                data

        }

    # ========================================================
    # PIE CHART
    # ========================================================

    if "pie" in chart_type_lower or "donut" in chart_type_lower:

        data = prepare_bar_chart_data(df, x_axis, y_axis)

        return {
            "dataset_id": dataset_id,
            "chart_type": chart_type,
            "x_axis": x_axis,
            "y_axis": y_axis,
            "data": data
        }

    # ========================================================
    # LINE CHART
    # ========================================================

    if "line" in chart_type_lower or "area" in chart_type_lower:

        data = prepare_line_chart_data(
            df,
            x_axis,
            y_axis
        )

        return {

            "dataset_id":
                dataset_id,

            "chart_type":
                chart_type,

            "x_axis":
                x_axis,

            "y_axis":
                y_axis,

            "data":
                data

        }

    # ========================================================
    # SCATTER PLOT
    # ========================================================

    if "scatter" in chart_type_lower:

        data = prepare_scatter_chart_data(
            df,
            x_axis,
            y_axis
        )

        return {

            "dataset_id":
                dataset_id,

            "chart_type":
                chart_type,

            "x_axis":
                x_axis,

            "y_axis":
                y_axis,

            "data":
                data

        }

    # ========================================================
    # DEFAULT
    # ========================================================

    return {

        "dataset_id":
            dataset_id,

        "chart_type":
            chart_type,

        "x_axis":
            x_axis,

        "y_axis":
            y_axis,

        "data":
            df.to_dict(
                orient="records"
            )

    }


# ============================================================
# GENERATE CHART DATA BY CHART ID
# ============================================================

def generate_chart_data_by_id(
    db: Session,
    chart_id: int
):

    # ========================================================
    # GET CHART
    # ========================================================

    chart = get_chart_by_id(
        db,
        chart_id
    )

    if not chart:

        raise ValueError(
            "Chart not found"
        )

    # ========================================================
    # GET DATASET
    # ========================================================

    dataset = chart.dataset

    if not dataset:

        raise ValueError(
            "Dataset not found"
        )

    # ========================================================
    # GENERATE DATA
    # ========================================================

    result = generate_chart_data(
        db=db,
        dataset_id=dataset.id,
        chart_type=chart.chart_type,
        x_axis=chart.x_axis,
        y_axis=chart.y_axis
    )

    # ========================================================
    # ADD CHART ID
    # ========================================================

    result["chart_id"] = chart.id

    return result
