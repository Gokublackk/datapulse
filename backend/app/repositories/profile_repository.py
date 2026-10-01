from sqlalchemy.orm import Session

from app.models.dataset_profile import DatasetProfile



def create_profile(

    db: Session,

    profile: DatasetProfile

):

    db.add(profile)

    db.commit()

    db.refresh(profile)

    return profile



def get_profile_by_dataset_id(

    db: Session,

    dataset_id: int

):

    return (

        db.query(DatasetProfile)

        .filter(

            DatasetProfile.dataset_id == dataset_id

        )

        .first()

    )