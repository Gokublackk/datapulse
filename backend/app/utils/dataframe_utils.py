import pandas as pd



def read_dataframe(file_path):

    if file_path.endswith(".csv"):

        df = pd.read_csv(
            file_path
        )


    elif file_path.endswith(
        ".xlsx"
    ):

        df = pd.read_excel(
            file_path
        )


    elif file_path.endswith(
        ".xls"
    ):

        df = pd.read_excel(
            file_path
        )


    else:

        raise Exception(
            "Unsupported file"
        )


    return df





def analyze_dataframe(df):


    numeric_columns = (
        df.select_dtypes(
            include="number"
        )
        .columns
        .tolist()
    )


    categorical_columns = (
        df.select_dtypes(
            include="object"
        )
        .columns
        .tolist()
    )


    return {


        "rows":
            df.shape[0],


        "columns":
            df.shape[1],


        "numeric_columns":
            numeric_columns,


        "categorical_columns":
            categorical_columns

    }