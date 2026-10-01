# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine
from app.core.exceptions import (
    DataPulseException
)

from app.core.error_handlers import (
    datapulse_exception_handler
)
# Import Models
from app.models import (
    User,
    Dashboard,
    Dataset
)
from app.routes.analytics_routes import router as analytics_router

# Import Routers
from app.routes.auth_routes import router as auth_router
from app.routes.user_routes import router as user_router
from app.routes.dashboard_routes import router as dashboard_router
from app.routes.dataset_routes import router as dataset_router
from app.routes.chart_routes import router as chart_router

app = FastAPI(

    title="DataPulse API",

    swagger_ui_parameters={
        "persistAuthorization": True
    }

)
app.add_exception_handler(

    DataPulseException,

    datapulse_exception_handler

)

# Create Tables (Temporary)
Base.metadata.create_all(bind=engine)


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:3000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# Routers
app.include_router(auth_router)

app.include_router(user_router)

app.include_router(dashboard_router)

app.include_router(dataset_router)
app.include_router(
    analytics_router
)
app.include_router(
    chart_router
)


@app.get("/")
def home():

    return {
        "status": "running",
        "project": "DataPulse",
        "version": "1.0.0"
    }


@app.get("/health")
def health():

    return {
        "status": "healthy"
    }