import logging
import json
from pathlib import Path
from typing import Any
import pandas as pd
import numpy as np

logger = logging.getLogger("datapulse")


def apply_preprocessing(
    df: pd.DataFrame,
    action: str,
    columns: list[str] | None = None,
    strategy: str | None = None,
    fill_value: Any | None = None,
    target_type: str | None = None,
    rename_mapping: dict[str, str] | None = None,
    factor: float = 1.5
) -> tuple[pd.DataFrame, dict[str, Any]]:
    """
    Applies an interactive transformation to a DataFrame and returns
    (transformed_df, change_summary).
    """
    df = df.copy()
    initial_rows, initial_cols = len(df), len(df.columns)
    summary = {
        "action": action,
        "initial_rows": initial_rows,
        "initial_columns": initial_cols,
        "details": ""
    }

    cols = columns or []

    if action == "drop_duplicates":
        subset = [c for c in cols if c in df.columns] or None
        before = len(df)
        df = df.drop_duplicates(subset=subset).reset_index(drop=True)
        removed = before - len(df)
        summary["details"] = f"Removed {removed} duplicate rows."

    elif action == "drop_na":
        subset = [c for c in cols if c in df.columns] or None
        before = len(df)
        df = df.dropna(subset=subset).reset_index(drop=True)
        removed = before - len(df)
        summary["details"] = f"Removed {removed} rows with missing values."

    elif action == "fill_na":
        target_cols = [c for c in cols if c in df.columns] or list(df.columns)
        filled_count = 0
        for col in target_cols:
            missing_count = int(df[col].isna().sum())
            if missing_count == 0:
                continue
            
            is_num = pd.api.types.is_numeric_dtype(df[col])
            
            if strategy == "mean" and is_num:
                fill_val = df[col].mean()
                df[col] = df[col].fillna(fill_val)
                filled_count += missing_count
            elif strategy == "median" and is_num:
                fill_val = df[col].median()
                df[col] = df[col].fillna(fill_val)
                filled_count += missing_count
            elif strategy == "mode":
                mode_vals = df[col].mode()
                fill_val = mode_vals.iloc[0] if not mode_vals.empty else "Unknown"
                df[col] = df[col].fillna(fill_val)
                filled_count += missing_count
            elif strategy == "zero" and is_num:
                df[col] = df[col].fillna(0)
                filled_count += missing_count
            elif strategy == "forward_fill":
                df[col] = df[col].ffill().bfill()
                filled_count += missing_count
            elif fill_value is not None:
                df[col] = df[col].fillna(fill_value)
                filled_count += missing_count
            else:
                # Default smart fill
                if is_num:
                    df[col] = df[col].fillna(df[col].median() if not pd.isna(df[col].median()) else 0)
                else:
                    df[col] = df[col].fillna("Missing")
                filled_count += missing_count
                
        summary["details"] = f"Filled missing values in {len(target_cols)} column(s). Total cells imputed: {filled_count}."

    elif action == "drop_columns":
        valid_cols = [c for c in cols if c in df.columns]
        if valid_cols:
            df = df.drop(columns=valid_cols)
            summary["details"] = f"Dropped column(s): {', '.join(valid_cols)}."
        else:
            summary["details"] = "No matching columns found to drop."

    elif action == "rename_columns":
        if rename_mapping:
            cleaned_mapping = {k: v.strip() for k, v in rename_mapping.items() if k in df.columns and v.strip()}
            df = df.rename(columns=cleaned_mapping)
            summary["details"] = f"Renamed {len(cleaned_mapping)} column(s)."

    elif action == "convert_type":
        target_cols = [c for c in cols if c in df.columns]
        converted = []
        for col in target_cols:
            try:
                if target_type == "numeric":
                    df[col] = pd.to_numeric(df[col].astype(str).str.replace(",", "", regex=False), errors="coerce")
                    converted.append(col)
                elif target_type == "datetime":
                    df[col] = pd.to_datetime(df[col], errors="coerce")
                    converted.append(col)
                elif target_type == "string":
                    df[col] = df[col].astype(str)
                    converted.append(col)
                elif target_type == "category":
                    df[col] = df[col].astype("category")
                    converted.append(col)
            except Exception as e:
                logger.warning(f"Could not convert column {col} to {target_type}: {e}")
        summary["details"] = f"Converted {len(converted)} column(s) to {target_type}."

    elif action == "filter_outliers":
        target_cols = [c for c in cols if c in df.columns and pd.api.types.is_numeric_dtype(df[col])]
        before = len(df)
        for col in target_cols:
            q1 = df[col].quantile(0.25)
            q3 = df[col].quantile(0.75)
            iqr = q3 - q1
            lower = q1 - factor * iqr
            upper = q3 + factor * iqr
            df = df[(df[col] >= lower) & (df[col] <= upper)]
        df = df.reset_index(drop=True)
        removed = before - len(df)
        summary["details"] = f"Removed {removed} outlier row(s) using IQR rule across {len(target_cols)} column(s)."

    elif action == "normalize":
        target_cols = [c for c in cols if c in df.columns and pd.api.types.is_numeric_dtype(df[col])]
        for col in target_cols:
            min_val = df[col].min()
            max_val = df[col].max()
            if max_val > min_val:
                if strategy == "standard":
                    mean_val = df[col].mean()
                    std_val = df[col].std()
                    if std_val > 0:
                        df[col] = ((df[col] - mean_val) / std_val).round(4)
                else:
                    # Default MinMax [0, 1]
                    df[col] = ((df[col] - min_val) / (max_val - min_val)).round(4)
        summary["details"] = f"Normalized {len(target_cols)} numeric column(s)."

    summary["final_rows"] = len(df)
    summary["final_columns"] = len(df.columns)
    return df, summary
