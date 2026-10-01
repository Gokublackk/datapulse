from sqlalchemy.orm import Session

from app.models.dashboard import Dashboard



def create_dashboard(

    db: Session,

    dashboard: Dashboard

):

    db.add(dashboard)

    db.commit()

    db.refresh(dashboard)

    return dashboard



def get_dashboard(

    db: Session,

    dashboard_id: int

):

    return (

        db.query(Dashboard)

        .filter(

            Dashboard.id == dashboard_id

        )

        .first()

    )



def get_user_dashboards(

    db: Session,

    user_id: int

):

    return (

        db.query(Dashboard)

        .filter(

            Dashboard.user_id == user_id

        )

        .all()

    )



def get_user_dashboard_by_id(

    db: Session,

    dashboard_id: int,

    user_id: int

):

    return (

        db.query(Dashboard)

        .filter(

            Dashboard.id == dashboard_id,

            Dashboard.user_id == user_id

        )

        .first()

    )



def update_dashboard(

    db: Session,

    dashboard: Dashboard

):

    db.commit()

    db.refresh(dashboard)

    return dashboard



def delete_dashboard(

    db: Session,

    dashboard: Dashboard

):

    db.delete(dashboard)

    db.commit()