# app/services/analytics_service.py

import pandas as pd
from app.utils.file_utils import resolve_dataset_path


# ============================================================
# 1. LOAD DATASET
# ============================================================

def load_dataset(
    file_path: str
) -> pd.DataFrame:
    """
    Load CSV/XLSX dataset and perform
    basic data-type detection.
    """

    if not file_path:
        raise ValueError(
            "Dataset file path is empty."
        )

    file_path = resolve_dataset_path(file_path)


    # --------------------------------------------------------
    # CSV
    # --------------------------------------------------------

    if file_path.lower().endswith(".csv"):

        try:

            df = pd.read_csv(
                file_path
            )

        except UnicodeDecodeError:

            df = pd.read_csv(
                file_path,
                encoding="latin-1"
            )

    # --------------------------------------------------------
    # XLSX
    # --------------------------------------------------------

    elif file_path.lower().endswith(".xlsx"):

        df = pd.read_excel(
            file_path
        )

    # --------------------------------------------------------
    # Unsupported
    # --------------------------------------------------------

    else:

        raise ValueError(
            "Unsupported dataset format. "
            "Only CSV and XLSX files are supported."
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
    # REMOVE COMPLETELY EMPTY ROWS
    # ========================================================

    df = df.dropna(
        how="all"
    )

    if df.empty:

        raise ValueError(
            "Dataset contains no usable rows."
        )

    # ========================================================
    # DETECT NUMERIC COLUMNS
    # ========================================================

    for column in df.columns:

        series = df[column]

        # Already numeric
        if pd.api.types.is_numeric_dtype(
            series
        ):

            continue

        converted = pd.to_numeric(
            series,
            errors="coerce"
        )

        total_count = int(
            series.notna().sum()
        )

        numeric_count = int(
            converted.notna().sum()
        )

        # Convert only if at least 80%
        # of non-null values are numeric
        if (
            total_count > 0
            and
            numeric_count / total_count >= 0.80
        ):

            df[column] = converted

    # ========================================================
    # DETECT DATETIME COLUMNS
    # ========================================================

    for column in df.columns:

        series = df[column]

        # Numeric columns should not
        # be converted to datetime
        if pd.api.types.is_numeric_dtype(
            series
        ):

            continue

        # Already datetime
        if pd.api.types.is_datetime64_any_dtype(
            series
        ):

            continue

        try:

            # ``mixed`` avoids noisy per-value parsing warnings while still
            # allowing real-world CSVs that contain more than one date format.
            converted = pd.to_datetime(
                series,
                errors="coerce",
                format="mixed"
            )

            total_count = int(
                series.notna().sum()
            )

            valid_count = int(
                converted.notna().sum()
            )

            if (
                total_count > 0
                and
                valid_count / total_count >= 0.80
            ):

                df[column] = converted

        except (
            ValueError,
            TypeError
        ):

            pass

    return df


# ============================================================
# 2. ANALYZE DATAFRAME
# ============================================================

def analyze_dataframe(
    df: pd.DataFrame
):
    """
    Return metadata about every column.
    """

    if df is None:

        raise ValueError(
            "DataFrame cannot be None."
        )

    analysis = []

    total_rows = len(df)

    for column in df.columns:

        series = df[column]

        # ----------------------------------------------------
        # Basic information
        # ----------------------------------------------------

        dtype = str(
            series.dtype
        )

        unique_count = int(
            series.nunique(
                dropna=True
            )
        )

        null_count = int(
            series.isna().sum()
        )

        # ----------------------------------------------------
        # Data type classification
        # ----------------------------------------------------

        if pd.api.types.is_numeric_dtype(
            series
        ):

            data_type = "numeric"

        elif pd.api.types.is_datetime64_any_dtype(
            series
        ):

            data_type = "datetime"

        else:

            data_type = "categorical"

        # ----------------------------------------------------
        # Null percentage
        # ----------------------------------------------------

        if total_rows > 0:

            null_percentage = round(
                (
                    null_count
                    / total_rows
                    * 100
                ),
                2
            )

        else:

            null_percentage = 0.0

        # ----------------------------------------------------
        # Result
        # ----------------------------------------------------

        analysis.append({

            "column":
                column,

            "dtype":
                dtype,

            "data_type":
                data_type,

            "unique_count":
                unique_count,

            "null_count":
                null_count,

            "null_percentage":
                null_percentage

        })

    return analysis


# ============================================================
# 3. CALCULATE CHART SCORE
# ============================================================

def calculate_chart_score(
    chart_type: str,
    df: pd.DataFrame,
    x_axis: str | None,
    y_axis: str | None
) -> int:
    """
    Calculate a quality score from 0-100
    for a chart recommendation.
    """

    score = 50

    # ========================================================
    # BAR / TOP-N BAR
    # ========================================================

    if chart_type in [
        "Bar Chart",
        "Top-N Bar Chart"
    ]:

        if x_axis in df.columns:

            unique_count = int(
                df[x_axis].nunique(
                    dropna=True
                )
            )

            # Ideal category count
            if 2 <= unique_count <= 10:

                score += 30

            elif 11 <= unique_count <= 20:

                score += 20

            elif 21 <= unique_count <= 50:

                score += 10

            else:

                score -= 20

        # Numeric Y-axis is preferred
        if y_axis in df.columns:

            if pd.api.types.is_numeric_dtype(
                df[y_axis]
            ):

                score += 15

    # ========================================================
    # SCATTER PLOT
    # ========================================================

    elif chart_type == "Scatter Plot":

        if (
            x_axis in df.columns
            and
            y_axis in df.columns
        ):

            if (
                pd.api.types.is_numeric_dtype(
                    df[x_axis]
                )
                and
                pd.api.types.is_numeric_dtype(
                    df[y_axis]
                )
            ):

                score += 30

                # --------------------------------------------
                # Correlation
                # --------------------------------------------

                try:

                    correlation = (
                        df[
                            [x_axis, y_axis]
                        ]
                        .corr()
                        .iloc[0, 1]
                    )

                    if pd.notna(
                        correlation
                    ):

                        correlation_strength = abs(
                            correlation
                        )

                        if correlation_strength >= 0.7:

                            score += 15

                        elif correlation_strength >= 0.4:

                            score += 8

                except Exception:

                    pass

    # ========================================================
    # LINE CHART
    # ========================================================

    elif chart_type == "Line Chart":

        if (
            x_axis in df.columns
            and
            y_axis in df.columns
        ):

            # Date/time X-axis is ideal
            if pd.api.types.is_datetime64_any_dtype(
                df[x_axis]
            ):

                score += 30

            # Numeric Y-axis is required
            if pd.api.types.is_numeric_dtype(
                df[y_axis]
            ):

                score += 15

            # More than one row is useful
            if len(df) >= 10:

                score += 5

    # ========================================================
    # HISTOGRAM
    # ========================================================

    elif chart_type == "Histogram":

        if x_axis in df.columns:

            if pd.api.types.is_numeric_dtype(
                df[x_axis]
            ):

                score += 20

                unique_count = int(
                    df[x_axis].nunique(
                        dropna=True
                    )
                )

                # Histogram is useful when
                # numeric values have variation
                if unique_count > 10:

                    score += 15

                elif unique_count <= 1:

                    score -= 20

    # ========================================================
    # DATASET SIZE
    # ========================================================

    row_count = len(df)

    if row_count >= 30:

        score += 5

    elif row_count < 10:

        score -= 10

    # ========================================================
    # KEEP SCORE BETWEEN 0 AND 100
    # ========================================================

    score = max(
        0,
        min(
            score,
            100
        )
    )

    return int(score)


# ============================================================
# 4. RECOMMEND CHARTS
# ============================================================

def recommend_charts(
    df: pd.DataFrame
):
    """
    Automatically recommend the best charts
    for a dataset.

    Maximum recommendations = 5.
    Recommendations are sorted by score.
    """

    if df is None or df.empty:

        return []

    recommendations = []

    numeric_columns = []

    categorical_columns = []

    datetime_columns = []

    # ========================================================
    # CLASSIFY COLUMNS
    # ========================================================

    for column in df.columns:

        series = df[column]

        if pd.api.types.is_numeric_dtype(
            series
        ):

            numeric_columns.append(
                column
            )

        elif pd.api.types.is_datetime64_any_dtype(
            series
        ):

            datetime_columns.append(
                column
            )

        else:

            categorical_columns.append(
                column
            )

    # ========================================================
    # 1. BAR CHART
    # ========================================================

    if numeric_columns:

        # Use the first numeric column
        # as the default measure.
        numeric_column = (
            numeric_columns[0]
        )

        for category in categorical_columns:

            unique_count = int(
                df[category].nunique(
                    dropna=True
                )
            )

            # Normal bar charts should not
            # have too many categories.
            if (
                2 <= unique_count <= 20
            ):

                score = calculate_chart_score(
                    "Bar Chart",
                    df,
                    category,
                    numeric_column
                )

                recommendations.append({

                    "chart_type":
                        "Bar Chart",

                    "x_axis":
                        category,

                    "y_axis":
                        numeric_column,

                    "reason":
                        (
                            f"Compare "
                            f"{numeric_column} "
                            f"across "
                            f"{category}. "
                            f"The column has "
                            f"{unique_count} "
                            f"categories."
                        ),

                    "configuration": {

                        "aggregation":
                            "sum"

                    },

                    "score":
                        score

                })

    # ========================================================
    # 1B. DONUT / PIE CHART
    # ========================================================

    if numeric_columns:

        numeric_column = numeric_columns[0]

        for category in categorical_columns:

            unique_count = int(df[category].nunique(dropna=True))

            if 2 <= unique_count <= 8:

                recommendations.append({

                    "chart_type": "Pie Chart",

                    "x_axis": category,

                    "y_axis": numeric_column,

                    "reason": (
                        f"See the share of {numeric_column} "
                        f"across {category}."
                    ),

                    "configuration": {"aggregation": "sum", "limit": 8},

                    "score": 72

                })

                break

    # ========================================================
    # 2. TOP-N BAR CHART
    # ========================================================

    if numeric_columns:

        numeric_column = (
            numeric_columns[0]
        )

        for category in categorical_columns:

            unique_count = int(
                df[category].nunique(
                    dropna=True
                )
            )

            # Top-N becomes useful when
            # there are many categories.
            if (
                unique_count > 20
            ):

                score = calculate_chart_score(
                    "Top-N Bar Chart",
                    df,
                    category,
                    numeric_column
                )

                recommendations.append({

                    "chart_type":
                        "Top-N Bar Chart",

                    "x_axis":
                        category,

                    "y_axis":
                        numeric_column,

                    "reason":
                        (
                            f"{category} "
                            f"contains "
                            f"{unique_count} "
                            f"categories. "
                            f"Showing the top "
                            f"categories keeps "
                            f"the visualization "
                            f"readable."
                        ),

                    "configuration": {

                        "aggregation":
                            "sum",

                        "limit":
                            10,

                        "sort":
                            "descending"

                    },

                    "score":
                        score

                })

    # ========================================================
    # 3. SCATTER PLOT
    # ========================================================

    if len(numeric_columns) >= 2:

        # Create several combinations,
        # not just the first two columns.
        for i in range(
            len(numeric_columns)
        ):

            for j in range(
                i + 1,
                len(numeric_columns)
            ):

                x_column = (
                    numeric_columns[i]
                )

                y_column = (
                    numeric_columns[j]
                )

                score = calculate_chart_score(
                    "Scatter Plot",
                    df,
                    x_column,
                    y_column
                )

                recommendations.append({

                    "chart_type":
                        "Scatter Plot",

                    "x_axis":
                        x_column,

                    "y_axis":
                        y_column,

                    "reason":
                        (
                            f"Explore the "
                            f"relationship "
                            f"between "
                            f"{x_column} "
                            f"and "
                            f"{y_column}."
                        ),

                    "configuration": {},

                    "score":
                        score

                })

    # ========================================================
    # 4. LINE CHART
    # ========================================================

    if (
        datetime_columns
        and
        numeric_columns
    ):

        date_column = (
            datetime_columns[0]
        )

        # Create a line recommendation
        # for each numeric measure.
        for numeric_column in numeric_columns:

            score = calculate_chart_score(
                "Line Chart",
                df,
                date_column,
                numeric_column
            )

            recommendations.append({

                "chart_type":
                    "Line Chart",

                "x_axis":
                    date_column,

                "y_axis":
                    numeric_column,

                "reason":
                    (
                        f"Analyze the trend "
                        f"of {numeric_column} "
                        f"over "
                        f"{date_column}."
                    ),

                "configuration": {},

                "score":
                    score

            })

            recommendations.append({

                "chart_type": "Area Chart",

                "x_axis": date_column,

                "y_axis": numeric_column,

                "reason": (
                    f"See the cumulative visual rhythm of {numeric_column} "
                    f"over {date_column}."
                ),

                "configuration": {"aggregation": "sum"},

                "score": max(0, score - 3)

            })

    # ========================================================
    # 5. HISTOGRAM
    # ========================================================

    for numeric_column in numeric_columns:

        score = calculate_chart_score(
            "Histogram",
            df,
            numeric_column,
            None
        )

        recommendations.append({

            "chart_type":
                "Histogram",

            "x_axis":
                numeric_column,

            "y_axis":
                None,

            "reason":
                (
                    f"Show the distribution "
                    f"of {numeric_column}."
                ),

            "configuration": {

                "bins":
                    10

            },

            "score":
                score

        })

    # ========================================================
    # 6. RADAR CHART FOR COMPACT CATEGORY COMPARISONS
    # ========================================================

    if numeric_columns:

        for category in categorical_columns:

            unique_count = int(df[category].nunique(dropna=True))

            if 3 <= unique_count <= 8:

                recommendations.append({

                    "chart_type": "Radar Chart",

                    "x_axis": category,

                    "y_axis": numeric_columns[0],

                    "reason": (
                        f"Compare the profile of {numeric_columns[0]} "
                        f"across the compact {category} categories."
                    ),

                    "configuration": {"aggregation": "sum"},

                    "score": 70

                })

                break

    # ========================================================
    # REMOVE DUPLICATE CHARTS
    # ========================================================

    unique_recommendations = []

    seen_keys = set()

    for recommendation in recommendations:

        key = (

            recommendation.get(
                "chart_type"
            ),

            recommendation.get(
                "x_axis"
            ),

            recommendation.get(
                "y_axis"
            )

        )

        if key in seen_keys:

            continue

        seen_keys.add(
            key
        )

        unique_recommendations.append(
            recommendation
        )

    recommendations = (
        unique_recommendations
    )

    # ========================================================
    # SORT BY SCORE
    # ========================================================

    recommendations.sort(key=lambda item: item.get("score", 0), reverse=True)

    # A dashboard needs different perspectives, not five versions of the
    # same scatter plot. Select the highest scoring recommendation per type
    # first, then fill any remaining slots by quality.
    diverse_recommendations = []
    seen_types = set()

    for recommendation in recommendations:

        chart_type = recommendation.get("chart_type")

        if chart_type in seen_types:
            continue

        diverse_recommendations.append(recommendation)
        seen_types.add(chart_type)

        if len(diverse_recommendations) >= 5:
            break

    # ========================================================
    # MAXIMUM 5 CHARTS
    # ========================================================

    return diverse_recommendations


# ============================================================
# 5. ANALYZE DATASET
# ============================================================

def analyze_dataset(
    file_path: str,
    group_column: str = None,
    value_column: str = None,
    operation: str = None
):
    """
    Perform an analytical operation on a dataset.

    Compatible with:

        POST /analytics/run
    """

    # --------------------------------------------------------
    # Load dataset
    # --------------------------------------------------------

    df = load_dataset(
        file_path
    )

    # --------------------------------------------------------
    # No group column
    # --------------------------------------------------------

    if not group_column:

        return analyze_dataframe(
            df
        )

    # --------------------------------------------------------
    # Validate group column
    # --------------------------------------------------------

    if group_column not in df.columns:

        raise ValueError(
            f"Group column '{group_column}' "
            f"does not exist."
        )

    # --------------------------------------------------------
    # Validate value column
    # --------------------------------------------------------

    if value_column:

        if value_column not in df.columns:

            raise ValueError(
                f"Value column '{value_column}' "
                f"does not exist."
            )

        if not pd.api.types.is_numeric_dtype(
            df[value_column]
        ):

            raise ValueError(
                f"Value column '{value_column}' "
                f"must be numeric."
            )

    # --------------------------------------------------------
    # Default operation
    # --------------------------------------------------------

    if not operation:

        operation = "sum"

    operation = (
        operation
        .lower()
        .strip()
    )

    # --------------------------------------------------------
    # Supported operations
    # --------------------------------------------------------

    supported_operations = {

        "sum":
            "sum",

        "mean":
            "mean",

        "average":
            "mean",

        "avg":
            "mean",

        "min":
            "min",

        "max":
            "max",

        "count":
            "count"

    }

    if operation not in supported_operations:

        raise ValueError(
            f"Unsupported operation "
            f"'{operation}'. "
            f"Supported operations: "
            f"{', '.join(supported_operations.keys())}"
        )

    pandas_operation = (
        supported_operations[
            operation
        ]
    )

    # --------------------------------------------------------
    # COUNT
    # --------------------------------------------------------

    if pandas_operation == "count":

        result = (

            df.groupby(
                group_column,
                dropna=False
            )
            .size()
            .reset_index(
                name="count"
            )

        )

    # --------------------------------------------------------
    # SUM / MEAN / MIN / MAX
    # --------------------------------------------------------

    else:

        if not value_column:

            raise ValueError(
                "value_column is required "
                f"for {operation} operation."
            )

        result = (

            df.groupby(
                group_column,
                dropna=False
            )[value_column]
            .agg(
                pandas_operation
            )
            .reset_index()

        )

        result = result.rename(

            columns={

                value_column:
                    "value"

            }

        )

    # ========================================================
    # JSON-SAFE RESULT
    # ========================================================

    result = result.replace(

        [
            float("inf"),
            float("-inf")
        ],

        None

    )

    result = (

        result
        .astype(object)
        .where(
            pd.notna(result),
            None
        )

    )

    # ========================================================
    # RETURN RECORDS
    # ========================================================

    return result.to_dict(
        orient="records"
    )


# ============================================================
# 6. GENERATE DATASET PROFILE
# ============================================================

def generate_analysis(
    df: pd.DataFrame
):
    """
    Return both column analysis
    and recommended charts.
    """

    return {

        "analysis":
            analyze_dataframe(
                df
            ),

        "recommended_charts":
            recommend_charts(
                df
            )

    }
