# app/core/error_handler.py

from fastapi import Request
from fastapi.responses import JSONResponse
from app.core.exceptions import DataPulseException
from app.core.logger import logger


async def datapulse_exception_handler(
    request: Request,
    exc: DataPulseException
):
    logger.error(f"{request.url} | {exc.message}")

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.message,
            "data": None
        }
    )