import apiClient from '../lib/apiClient'

function normaliseChart(record) {
  return {
    id: record.id,
    datasetId: record.dataset_id,
    workspaceId: record.dashboard_id,
    title: record.title ?? record.chart_type ?? 'Recommended chart',
    chartType: record.chart_type ?? 'bar',
    xAxis: record.x_axis ?? null,
    yAxis: record.y_axis ?? null,
    reason: record.reason ?? '',
    score: record.score ?? null,
    configuration: record.configuration ?? null,
  }
}

/** Charts the backend has already recommended and stored for a dataset. */
export async function listDatasetCharts(datasetId, { signal } = {}) {
  const response = await apiClient.get(`/charts/dataset/${datasetId}`, { signal })
  return (response.data?.data ?? []).map(normaliseChart)
}

/** Re-runs the recommender and replaces the stored chart set. */
export async function generateDatasetCharts(datasetId, { signal } = {}) {
  const response = await apiClient.post(`/charts/generate/${datasetId}`, undefined, { signal })
  return (response.data?.data ?? []).map(normaliseChart)
}

/** Server-side aggregated series for one stored chart. */
export async function getChartSeries(chartId, { signal } = {}) {
  const response = await apiClient.get(`/charts/${chartId}/data`, { signal })
  const payload = response.data?.data ?? {}
  return {
    chartType: payload.chart_type ?? null,
    xAxis: payload.x_axis ?? null,
    yAxis: payload.y_axis ?? null,
    rows: Array.isArray(payload.data) ? payload.data : [],
  }
}

/**
 * Fetches every chart plus its series. Requests run in parallel and a single
 * failing series degrades that card instead of the whole grid.
 */
export async function loadChartBundle(datasetId, { signal } = {}) {
  const charts = await listDatasetCharts(datasetId, { signal })
  const series = await Promise.all(
    charts.map((chart) =>
      getChartSeries(chart.id, { signal })
        .then((result) => [chart.id, result])
        .catch(() => [chart.id, { rows: [], failed: true }]),
    ),
  )
  return { charts, series: Object.fromEntries(series) }
}

/** Server-side profile + recommendation pass. */
export async function runAnalytics(datasetId, { signal } = {}) {
  const response = await apiClient.post('/analytics/run', { dataset_id: Number(datasetId) }, { signal })
  const payload = response.data?.data ?? {}
  return {
    analysis: payload.analysis ?? null,
    recommendations: payload.recommendations ?? [],
  }
}
