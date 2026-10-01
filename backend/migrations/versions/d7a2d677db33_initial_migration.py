"""initial migration

Revision ID: d7a2d677db33
Revises:
Create Date: 2026-08-04
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d7a2d677db33"
down_revision: Union[str, Sequence[str], None] = None
branch_labels = None
depends_on = None



def upgrade() -> None:
    """
    Create initial DataPulse database schema.
    """


    # =========================
    # USERS TABLE
    # =========================

    op.create_table(
        "users",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            index=True
        ),

        sa.Column(
            "firebase_uid",
            sa.String(length=255),
            nullable=False,
            unique=True
        ),

        sa.Column(
            "email",
            sa.String(length=255),
            nullable=False,
            unique=True
        ),

        sa.Column(
            "full_name",
            sa.String(length=255),
            nullable=False
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False
        )
    )



    # =========================
    # DASHBOARDS TABLE
    # =========================

    op.create_table(
        "dashboards",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            index=True
        ),

        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id"),
            nullable=False
        ),

        sa.Column(
            "title",
            sa.String(length=255),
            nullable=False
        ),

        sa.Column(
            "description",
            sa.Text(),
            nullable=False
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False
        )
    )



    # =========================
    # DATASETS TABLE
    # =========================

    op.create_table(
        "datasets",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            index=True
        ),

        sa.Column(
            "dashboard_id",
            sa.Integer(),
            sa.ForeignKey("dashboards.id"),
            nullable=False
        ),

        sa.Column(
            "original_filename",
            sa.String(length=255),
            nullable=False
        ),

        sa.Column(
            "file_type",
            sa.String(length=100),
            nullable=False
        ),

        sa.Column(
            "file_path",
            sa.String(length=500),
            nullable=False
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False
        )
    )



    # =========================
    # DATASET COLUMNS TABLE
    # =========================

    op.create_table(
        "dataset_columns",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            index=True
        ),

        sa.Column(
            "dataset_id",
            sa.Integer(),
            sa.ForeignKey("datasets.id"),
            nullable=False
        ),

        sa.Column(
            "column_name",
            sa.String(length=150),
            nullable=False
        ),

        sa.Column(
            "data_type",
            sa.String(length=50),
            nullable=False
        ),

        sa.Column(
            "is_numeric",
            sa.Boolean(),
            nullable=False
        ),

        sa.Column(
            "is_categorical",
            sa.Boolean(),
            nullable=False
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False
        )
    )



    # =========================
    # DATASET PROFILE TABLE
    # =========================

    op.create_table(
        "dataset_profiles",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            index=True
        ),

        sa.Column(
            "dataset_id",
            sa.Integer(),
            sa.ForeignKey("datasets.id"),
            nullable=False
        ),

        sa.Column(
            "column_info",
            sa.JSON(),
            nullable=False
        ),

        sa.Column(
            "summary_statistics",
            sa.JSON(),
            nullable=False
        ),

        sa.Column(
            "missing_values",
            sa.JSON(),
            nullable=False
        ),

        sa.Column(
            "correlations",
            sa.JSON(),
            nullable=False
        ),

        sa.Column(
            "sample_rows",
            sa.JSON(),
            nullable=False
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False
        )
    )



    # =========================
    # CHARTS TABLE
    # =========================

    op.create_table(
        "charts",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            index=True
        ),

        sa.Column(
            "dashboard_id",
            sa.Integer(),
            sa.ForeignKey("dashboards.id"),
            nullable=False
        ),

        sa.Column(
            "dataset_id",
            sa.Integer(),
            sa.ForeignKey("datasets.id"),
            nullable=False
        ),

        sa.Column(
            "title",
            sa.String(length=150),
            nullable=False
        ),

        sa.Column(
            "chart_type",
            sa.String(length=50),
            nullable=False
        ),

        sa.Column(
            "x_axis",
            sa.String(length=100),
            nullable=False
        ),

        sa.Column(
            "y_axis",
            sa.String(length=100),
            nullable=False
        ),

        sa.Column(
            "configuration",
            sa.JSON(),
            nullable=True
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False
        )
    )



def downgrade() -> None:

    op.drop_table("charts")
    op.drop_table("dataset_profiles")
    op.drop_table("dataset_columns")
    op.drop_table("datasets")
    op.drop_table("dashboards")
    op.drop_table("users")