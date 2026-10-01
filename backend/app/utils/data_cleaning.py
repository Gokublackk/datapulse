"""Deterministic, non-destructive data preparation for uploaded datasets."""

import re
from typing import Any

import pandas as pd


MISSING_MARKERS = {"", "n/a", "na", "null", "none", "-", "?", "unknown"}


def _unique_columns(columns: list[str]) -> list[str]:
    seen: dict[str, int] = {}
    result: list[str] = []
    for index, column in enumerate(columns, start=1):
        base = re.sub(r"\s+", "_", str(column).strip()).strip("_") or f"column_{index}"
        base = re.sub(r"[^0-9a-zA-Z_]", "_", base)
        seen[base] = seen.get(base, 0) + 1
        result.append(base if seen[base] == 1 else f"{base}_{seen[base]}")
    return result


def prepare_dataframe(df: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, Any]]:
    """Clean common spreadsheet issues and return a transparent change report.

    We only standardise values when the conversion is strongly supported by the
    data, so identifiers and business labels are not silently damaged.
    """
    original_rows, original_columns = df.shape
    working = df.copy()
    working.columns = _unique_columns(list(working.columns))

    # Normalise empty spreadsheet cells and whitespace-only text fields.
    for column in working.select_dtypes(include=["object", "string"]).columns:
        cleaned = working[column].astype("string").str.strip()
        working[column] = cleaned.mask(cleaned.str.lower().isin(MISSING_MARKERS), pd.NA)

    empty_rows = int(working.isna().all(axis=1).sum())
    working = working.dropna(how="all")
    duplicate_rows = int(working.duplicated().sum())
    working = working.drop_duplicates().reset_index(drop=True)

    converted_columns: list[str] = []
    for column in working.columns:
        series = working[column]
        if pd.api.types.is_numeric_dtype(series) or pd.api.types.is_datetime64_any_dtype(series):
            continue
        present = series.notna().sum()
        if not present:
            continue
        numeric = pd.to_numeric(series.astype(str).str.replace(",", "", regex=False), errors="coerce")
        if numeric.notna().sum() / present >= 0.9:
            working[column] = numeric
            converted_columns.append(column)

    missing_after = int(working.isna().sum().sum())
    report = {
        "original_rows": int(original_rows),
        "cleaned_rows": int(len(working)),
        "columns": int(original_columns),
        "empty_rows_removed": empty_rows,
        "duplicate_rows_removed": duplicate_rows,
        "missing_values_remaining": missing_after,
        "numeric_columns_detected": converted_columns,
        "quality_score": max(0, round(100 - ((empty_rows + duplicate_rows) / max(original_rows, 1)) * 100 - (missing_after / max(len(working) * max(original_columns, 1), 1)) * 35)),
    }
    return working, report
