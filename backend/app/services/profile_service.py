import pandas as pd

from sqlalchemy.orm import Session

from app.models.dataset_profile import DatasetProfile

from app.repositories.profile_repository import (
    create_profile
)



def generate_dataset_profile(

    db: Session,

    dataset_id: int,

    df: pd.DataFrame

):


    total_rows = len(df)

    total_columns = len(df.columns)



    missing_values = int(

        df.isnull()

        .sum()

        .sum()

    )



    duplicate_rows = int(

        df.duplicated()

        .sum()

    )



    profile = DatasetProfile(

        dataset_id=dataset_id,

        total_rows=len(df),

        total_columns=len(df.columns),

        missing_values=int(
            df.isnull()
            .sum()
            .sum()
        ),
        duplicate_rows=int(
            df.duplicated()
            .sum()
        )
        

    )


    return create_profile(

        db,

        profile

    )