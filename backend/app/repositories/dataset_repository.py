from sqlalchemy.orm import Session

from app.models.dataset import Dataset


def create_dataset(
    db: Session,
    dataset: Dataset
):

    db.add(dataset)

    db.commit()

    db.refresh(dataset)

    return dataset


def get_dataset(
    db: Session,
    dataset_id: int
):

    return (

        db.query(Dataset)

        .filter(
            Dataset.id == dataset_id
        )

        .first()

    )


def get_dashboard_datasets(
    db: Session,
    dashboard_id: int
):

    return (

        db.query(Dataset)

        .filter(
            Dataset.dashboard_id == dashboard_id
        )

        .all()

    )


def delete_dataset(
    db: Session,
    dataset: Dataset
):

    db.delete(dataset)

    db.commit()