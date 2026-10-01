from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from app.core.database import get_db

from app.schemas.dashboard import DashboardCreate

from app.services.dashboard_service import (
    create_new_dashboard,
    list_dashboards
)

from app.dependencies.user_dependency import (
    get_database_user
)

from app.models.user import User


router = APIRouter(
    prefix="/dashboards",
    tags=["Dashboards"]
)


@router.get("/default")
def get_or_create_default_dashboard(
    user: User = Depends(get_database_user),
    db: Session = Depends(get_db)
):
    """Return a personal workspace, creating one on a user's first visit."""
    dashboards = list_dashboards(db, user.id)
    if dashboards:
        return dashboards[0]
    return create_new_dashboard(
        db,
        user.id,
        DashboardCreate(
            title="My Data Workspace",
            description="Default DataPulse analytics workspace"
        )
    )


@router.post("/")
def create_dashboard(

    data: DashboardCreate,

    user: User = Depends(
        get_database_user
    ),

    db: Session = Depends(
        get_db
    )

):

    return create_new_dashboard(

        db,

        user.id,

        data

    )


@router.get("/")
def get_my_dashboards(

    user: User = Depends(
        get_database_user
    ),

    db: Session = Depends(
        get_db
    )

):

    return list_dashboards(

        db,

        user.id

    )
