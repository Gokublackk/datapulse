import pandas as pd


def aggregate_dataframe(

    df: pd.DataFrame,

    group_column: str,

    value_column: str,

    operation: str

):

    if group_column not in df.columns:

        raise ValueError(
            f"Column '{group_column}' not found"
        )


    if value_column not in df.columns:

        raise ValueError(
            f"Column '{value_column}' not found"
        )


    if operation == "sum":

        result = (
            df.groupby(group_column)[value_column]
            .sum()
        )


    elif operation == "avg":

        result = (
            df.groupby(group_column)[value_column]
            .mean()
        )


    elif operation == "count":

        result = (
            df.groupby(group_column)[value_column]
            .count()
        )


    elif operation == "min":

        result = (
            df.groupby(group_column)[value_column]
            .min()
        )


    elif operation == "max":

        result = (
            df.groupby(group_column)[value_column]
            .max()
        )


    else:

        raise ValueError(
            "Unsupported operation"
        )


    result = result.reset_index()


    return result.to_dict(
        orient="records"
    )