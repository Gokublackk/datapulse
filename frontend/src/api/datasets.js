import apiClient from '../lib/apiClient'

function normaliseSummary(record) {
  return {
    id: record.id,
    workspaceId: record.dashboard_id,
    filename: record.filename ?? 'Untitled dataset',
    rows: Number(record.rows ?? 0),
    columns: Number(record.columns ?? 0),
    fileType: record.file_type ?? '',
    uploadedAt: record.uploaded_at ?? null,
    firebaseStorageUrl: record.firebase_storage_url ?? null,
  }
}

/** Every dataset the signed-in user owns, newest first. */
export async function listMyDatasets({ signal } = {}) {
  const response = await apiClient.get('/datasets/my', { signal })
  return (response.data?.data ?? []).map(normaliseSummary)
}

export async function listWorkspaceDatasets(workspaceId, { signal } = {}) {
  const response = await apiClient.get(`/datasets/dashboard/${workspaceId}`, { signal })
  return (response.data?.data ?? []).map(normaliseSummary)
}

/** Full row data for a dataset — the studio profiles this locally. */
export async function getDatasetData(datasetId, { signal } = {}) {
  const response = await apiClient.get(`/datasets/${datasetId}/data`, { signal })
  const payload = response.data ?? {}
  return {
    datasetId: payload.dataset_id ?? Number(datasetId),
    columns: Array.isArray(payload.columns) ? payload.columns : [],
    rows: Array.isArray(payload.data) ? payload.data : [],
    totalRows: Number(payload.total_rows ?? payload.data?.length ?? 0),
    totalColumns: Number(payload.total_columns ?? payload.columns?.length ?? 0),
  }
}

/** The preparation report written when the file was ingested. */
export async function getDatasetQuality(datasetId, { signal } = {}) {
  const response = await apiClient.get(`/datasets/${datasetId}/quality`, { signal })
  const report = response.data?.data ?? {}
  return {
    originalRows: Number(report.original_rows ?? 0),
    cleanedRows: Number(report.cleaned_rows ?? 0),
    columns: Number(report.columns ?? 0),
    emptyRowsRemoved: Number(report.empty_rows_removed ?? 0),
    duplicateRowsRemoved: Number(report.duplicate_rows_removed ?? 0),
    missingValuesRemaining: Number(report.missing_values_remaining ?? 0),
    numericColumnsDetected: report.numeric_columns_detected ?? [],
    qualityScore: Number(report.quality_score ?? 0),
  }
}

/**
 * Preprocesses a dataset (drop duplicates, fill nulls, convert types, filter outliers, normalize).
 */
export async function preprocessDataset(datasetId, {
  action,
  columns = [],
  strategy = null,
  fill_value = null,
  target_type = null,
  rename_mapping = null,
  factor = 1.5,
  signal,
} = {}) {
  const response = await apiClient.post(
    `/datasets/${datasetId}/preprocess`,
    {
      action,
      columns,
      strategy,
      fill_value,
      target_type,
      rename_mapping,
      factor,
    },
    { signal },
  )
  return response.data
}

/** Uploads a file and reports byte progress via `onProgress(percent)`. */
export async function uploadDataset({ workspaceId, file, onProgress, signal }) {
  const formData = new FormData()
  formData.append('dashboard_id', String(workspaceId))
  formData.append('file', file)

  const response = await apiClient.post('/datasets/upload', formData, {
    signal,
    timeout: 180_000,
    onUploadProgress: (event) => {
      if (!onProgress || !event.total) return
      onProgress(Math.min(100, Math.round((event.loaded * 100) / event.total)))
    },
  })

  const payload = response.data?.data ?? {}
  return {
    datasetId: payload.dataset_id,
    filename: payload.filename,
    rows: Number(payload.rows ?? 0),
    columns: Number(payload.columns ?? 0),
    cleaningReport: payload.cleaning_report ?? null,
    firebaseStorageUrl: payload.firebase_storage_url ?? null,
  }
}

/**
 * Creates and uploads a curated sample dataset for instant exploration.
 */
export async function uploadSampleDataset(workspaceId, type = 'sales') {
  let filename
  let csvContent

  if (type === 'health') {
    filename = 'vitality_health_metrics.csv'
    csvContent = `patient_id,age,gender,bmi,heart_rate,blood_pressure_sys,cholesterol,activity_level,risk_score
P-101,45,Female,24.2,72,120,195,Moderate,Low
P-102,62,Male,29.8,85,142,230,Sedentary,High
P-103,34,Male,22.1,68,115,178,Active,Low
P-104,58,Female,31.4,78,138,245,Sedentary,High
P-105,29,Female,21.5,65,110,165,Very Active,Low
P-106,51,Male,27.3,74,128,210,Moderate,Medium
P-107,43,Female,25.9,70,122,190,Moderate,Low
P-108,67,Male,30.5,82,150,260,Sedentary,Critical
P-109,38,Female,23.8,69,118,182,Active,Low
P-110,55,Male,28.4,76,132,225,Moderate,Medium`
  } else {
    filename = 'global_ecommerce_performance.csv'
    csvContent = `order_id,date,region,category,product,units_sold,unit_price,revenue,satisfaction_rating
ORD-901,2026-01-15,North America,Electronics,Pulse Wireless Earbuds,140,79.99,11198.60,4.8
ORD-902,2026-01-18,Europe,Audio,Noise-Cancelling Studio,85,199.50,16957.50,4.9
ORD-903,2026-01-22,Asia Pacific,Wearables,Apex Smart Band,210,49.00,10290.00,4.6
ORD-904,2026-02-02,North America,Computing,UltraBook Pro 15,45,1249.00,56205.00,4.7
ORD-905,2026-02-10,Latin America,Electronics,Pulse Soundbar 360,65,149.00,9685.00,4.4
ORD-906,2026-02-14,Europe,Wearables,Apex Fitness Watch,120,89.00,10680.00,4.8
ORD-907,2026-02-20,Asia Pacific,Audio,Hi-Fi Gaming Headset,160,65.00,10400.00,4.5
ORD-908,2026-03-01,North America,Accessories,MagSafe Fast Stand,310,29.90,9269.00,4.9
ORD-909,2026-03-05,Europe,Computing,Ergonomic Keypad V2,180,59.00,10620.00,4.7
ORD-910,2026-03-12,Asia Pacific,Electronics,Pulse 4K Webcam,95,119.00,11305.00,4.6`
  }

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const file = new File([blob], filename, { type: 'text/csv' })
  return uploadDataset({ workspaceId, file })
}

