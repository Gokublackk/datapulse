from sqlalchemy.orm import Session

from app.models.dashboard import Dashboard

from app.schemas.dashboard import DashboardCreate

from app.repositories.dashboard_repository import (

    create_dashboard,

    get_dashboard,

    get_user_dashboards,

    get_user_dashboard_by_id

)
from app.core.exceptions import DataPulseException



def create_new_dashboard(

    db: Session,

    user_id: int,

    data: DashboardCreate

):

    dashboard = Dashboard(

        user_id=user_id,

        title=data.title,

        description=data.description

    )


    return create_dashboard(

        db,

        dashboard

    )



def list_dashboards(

    db: Session,

    user_id: int

):

    return get_user_dashboards(

        db,

        user_id

    )



def get_dashboard_by_id(

    db: Session,

    dashboard_id: int

):

    return get_dashboard(

        db,

        dashboard_id

    )


def verify_dashboard_owner(
    db: Session,
    dashboard_id: int,
    user_id: int
):
    dashboard = get_user_dashboard_by_id(
        db,
        dashboard_id,
        user_id
    )

    if not dashboard:
        raise DataPulseException(
            "Dashboard not found or you don't have permission to access it",
            404
        )

    return dashboard