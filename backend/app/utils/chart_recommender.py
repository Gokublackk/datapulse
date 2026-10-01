import pandas as pd


def recommend_charts(df: pd.DataFrame):

    recommendations = []

    # Get numeric columns
    numeric_columns = list(
        df.select_dtypes(
            include="number"
        ).columns
    )

    # Get categorical columns
    categorical_columns = list(
        df.select_dtypes(
            include=["object", "category"]
        ).columns
    )

    # --------------------------------
    # BAR CHART
    # --------------------------------

    if (
        len(numeric_columns) > 0
        and len(categorical_columns) > 0
    ):

        x_column = categorical_columns[0]

        y_column = numeric_columns[0]

        recommendations.append({

            "chart": "Bar Chart",

            "x_axis": x_column,

            "y_axis": y_column,

            "reason":
                f"Compare {y_column} "
                f"across {x_column}"

        })


    # --------------------------------
    # SCATTER PLOT
    # --------------------------------

    if len(numeric_columns) >= 2:

        recommendations.append({

            "chart": "Scatter Plot",

            "x_axis": numeric_columns[0],

            "y_axis": numeric_columns[1],

            "reason":
                f"Analyze relationship between "
                f"{numeric_columns[0]} and "
                f"{numeric_columns[1]}"

        })


    # --------------------------------
    # HISTOGRAM
    # --------------------------------

    if len(numeric_columns) >= 1:

        recommendations.append({

            "chart": "Histogram",

            "x_axis": numeric_columns[0],

            "y_axis": None,

            "reason":
                f"Show distribution of "
                f"{numeric_columns[0]}"

        })


    return recommendations