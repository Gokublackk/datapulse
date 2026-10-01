import pandas as pd



def generate_column_info(df):

    result = {}


    for column in df.columns:


        result[column] = {

            "dtype":
                str(df[column].dtype),


            "unique_values":
                int(
                    df[column].nunique()
                ),


            "missing":
                int(
                    df[column].isna().sum()
                )

        }


    return result



def generate_statistics(df):

    numeric_df = (
        df.select_dtypes(
            include="number"
        )
    )


    return (

        numeric_df
        .describe()
        .to_dict()

    )



def generate_missing_values(df):

    return (

        df.isnull()
        .sum()
        .to_dict()

    )



def generate_correlations(df):

    numeric_df = (

        df.select_dtypes(
            include="number"
        )

    )


    return (

        numeric_df
        .corr()
        .to_dict()

    )



def generate_sample_rows(df):

    return (

        df.head(5)
        .to_dict(
            orient="records"
        )

    )