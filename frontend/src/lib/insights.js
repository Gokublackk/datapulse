/**
 * Turns a dataset profile into plain-language findings for the Overview tab.
 * Every insight is derived from numbers already computed in profile.js, so the
 * narrative and the charts can never disagree.
 */

import { formatNumber, formatPercent, humanizeField, truncate } from './format'

const TONE = { GOOD: 'good', INFO: 'info', WARN: 'warn', RISK: 'risk' }

export function buildInsights(profile, correlations, rows = []) {
  if (!profile?.columnCount) return []
  const insights = []

  // ---- Completeness -------------------------------------------------------
  if (profile.completeness >= 99.5) {
    insights.push({
      id: 'completeness-good',
      tone: TONE.GOOD,
      title: 'Every field is populated',
      body: `All ${formatNumber(profile.columnCount)} fields are complete across ${formatNumber(profile.rowCount)} records, so aggregates need no caveats.`,
      metric: formatPercent(profile.completeness),
    })
  } else {
    const worst = profile.columnsWithMissing[0]
    insights.push({
      id: 'completeness-gap',
      tone: profile.completeness < 90 ? TONE.RISK : TONE.WARN,
      title: `${formatPercent(100 - profile.completeness)} of cells are empty`,
      body: worst
        ? `${humanizeField(worst.name)} is the largest gap with ${formatNumber(worst.missing)} missing values (${formatPercent(worst.missingPct)}). Averages on that field are computed from the remaining rows.`
        : 'Some cells are empty, so treat averages as partial.',
      metric: formatPercent(profile.completeness),
    })
  }

  // ---- Duplicates ---------------------------------------------------------
  if (profile.duplicateRows > 0) {
    insights.push({
      id: 'duplicates',
      tone: TONE.WARN,
      title: `${formatNumber(profile.duplicateRows)} duplicate rows detected`,
      body: `${formatPercent((profile.duplicateRows / Math.max(profile.sampledRows, 1)) * 100)} of the rows repeat an earlier row exactly. Totals will double-count unless they are removed.`,
      metric: formatNumber(profile.duplicateRows),
    })
  }

  // ---- Strongest relationship --------------------------------------------
  const strongest = correlations?.pairs?.[0]
  if (strongest && Math.abs(strongest.value) >= 0.5) {
    const direction = strongest.value > 0 ? 'rise together' : 'move in opposite directions'
    const strength = Math.abs(strongest.value) >= 0.8 ? 'very strong' : 'strong'
    insights.push({
      id: 'correlation',
      tone: TONE.INFO,
      title: `${humanizeField(strongest.x)} and ${humanizeField(strongest.y)} ${direction}`,
      body: `A ${strength} ${strongest.value > 0 ? 'positive' : 'negative'} correlation of ${strongest.value.toFixed(2)}. Worth checking whether one drives the other before using it in a model.`,
      metric: strongest.value.toFixed(2),
    })
  }

  // ---- Concentration in a single category --------------------------------
  const concentrated = profile.categorical
    .filter((column) => column.top[0]?.share >= 55 && column.unique > 1)
    .sort((a, b) => b.top[0].share - a.top[0].share)[0]
  if (concentrated) {
    const leader = concentrated.top[0]
    insights.push({
      id: `concentration-${concentrated.name}`,
      tone: TONE.INFO,
      title: `"${truncate(leader.value, 28)}" dominates ${humanizeField(concentrated.name)}`,
      body: `${formatPercent(leader.share)} of records fall into a single value out of ${formatNumber(concentrated.unique)}. Segment charts by this field with care — the rest of the categories are thin.`,
      metric: formatPercent(leader.share),
    })
  }

  // ---- Outliers -----------------------------------------------------------
  const outlierColumn = profile.numeric
    .filter((column) => column.outliers > 0 && column.present > 20)
    .sort((a, b) => b.outliers / b.present - a.outliers / a.present)[0]
  if (outlierColumn) {
    const share = (outlierColumn.outliers / outlierColumn.present) * 100
    insights.push({
      id: `outliers-${outlierColumn.name}`,
      tone: share > 8 ? TONE.WARN : TONE.INFO,
      title: `${formatNumber(outlierColumn.outliers)} outliers in ${humanizeField(outlierColumn.name)}`,
      body: `Values outside the 1.5×IQR fence (below ${formatNumber(outlierColumn.stats.lowerFence)} or above ${formatNumber(outlierColumn.stats.upperFence)}). The average of ${formatNumber(outlierColumn.stats.mean)} sits ${outlierColumn.stats.mean > outlierColumn.stats.median ? 'above' : 'below'} the median of ${formatNumber(outlierColumn.stats.median)}.`,
      metric: formatPercent(share),
    })
  }
  // ---- Skew ---------------------------------------------------------------
  const skewed = profile.numeric
    .filter((column) => column.stats && Math.abs(column.stats.skew) >= 1.5)
    .sort((a, b) => Math.abs(b.stats.skew) - Math.abs(a.stats.skew))[0]
  if (skewed) {
    const right = skewed.stats.skew > 0
    insights.push({
      id: `skew-${skewed.name}`,
      tone: TONE.INFO,
      title: `${humanizeField(skewed.name)} is ${right ? 'right' : 'left'}-skewed`,
      body: `A long ${right ? 'upper' : 'lower'} tail (skew ${skewed.stats.skew.toFixed(1)}) means the median of ${formatNumber(skewed.stats.median)} describes a typical record better than the mean of ${formatNumber(skewed.stats.mean)}.`,
      metric: skewed.stats.skew.toFixed(1),
    })
  }

  // ---- Time coverage ------------------------------------------------------
  const dateColumn = profile.dates.find((column) => column.firstDate && column.lastDate)
  if (dateColumn) {
    const days = Math.max(
      1,
      Math.round((dateColumn.lastDate - dateColumn.firstDate) / 86_400_000),
    )
    insights.push({
      id: `timespan-${dateColumn.name}`,
      tone: TONE.INFO,
      title: `${formatNumber(days)} days of history in ${humanizeField(dateColumn.name)}`,
      body: `Records run from ${dateColumn.firstDate.toLocaleDateString()} to ${dateColumn.lastDate.toLocaleDateString()}, so trend and seasonality views are available.`,
      metric: `${formatNumber(days)}d`,
    })
  }

  // ---- Fields that carry no signal ---------------------------------------
  const deadColumns = profile.columns.filter((column) => column.isConstant)
  if (deadColumns.length) {
    insights.push({
      id: 'constant-columns',
      tone: TONE.WARN,
      title: `${deadColumns.length} field${deadColumns.length > 1 ? 's carry' : ' carries'} a single value`,
      body: `${deadColumns.slice(0, 4).map((column) => humanizeField(column.name)).join(', ')}${deadColumns.length > 4 ? ` and ${deadColumns.length - 4} more` : ''} never vary, so they cannot explain anything and are excluded from the builder.`,
      metric: String(deadColumns.length),
    })
  }

  // ---- Identifier-like fields --------------------------------------------
  const identifiers = profile.columns.filter((column) => column.isIdentifier)
  if (identifiers.length) {
    insights.push({
      id: 'identifier-columns',
      tone: TONE.INFO,
      title: `${identifiers.length} field${identifiers.length > 1 ? 's look' : ' looks'} like an identifier`,
      body: `${identifiers.slice(0, 3).map((column) => humanizeField(column.name)).join(', ')} ${identifiers.length > 1 ? 'are' : 'is'} unique for every row. Useful for joins, misleading as a chart measure.`,
      metric: String(identifiers.length),
    })
  }
  // ---- Headline measure ---------------------------------------------------
  const headline = profile.measures
    .filter((column) => column.stats)
    .sort((a, b) => Math.abs(b.stats.sum) - Math.abs(a.stats.sum))[0]
  if (headline && rows.length) {
    insights.push({
      id: `headline-${headline.name}`,
      tone: TONE.GOOD,
      title: `${humanizeField(headline.name)} totals ${formatNumber(headline.stats.sum)}`,
      body: `Ranging from ${formatNumber(headline.stats.min)} to ${formatNumber(headline.stats.max)} with an average of ${formatNumber(headline.stats.mean)} per record. This is the strongest candidate for your primary KPI.`,
      metric: formatNumber(headline.stats.sum),
    })
  }

  return insights
}

/** Suggested chart configurations, ranked, derived purely from column types. */
export function suggestCharts(profile, limit = 6) {
  if (!profile?.columnCount) return []
  const suggestions = []
  const measures = profile.measures
  const categories = profile.categorical.filter((column) => column.unique >= 2 && column.unique <= 40)
  const dates = profile.dates

  for (const date of dates.slice(0, 2)) {
    for (const measure of measures.slice(0, 2)) {
      suggestions.push({
        id: `trend-${date.name}-${measure.name}`,
        chartType: 'area',
        dimension: date.name,
        measure: measure.name,
        aggregation: 'sum',
        score: 96,
        title: `${humanizeField(measure.name)} over time`,
        reason: `${humanizeField(date.name)} spans ${formatNumber(date.present)} dated records, so a trend line shows direction and seasonality.`,
      })
    }
  }

  for (const category of categories.slice(0, 3)) {
    for (const measure of measures.slice(0, 2)) {
      suggestions.push({
        id: `rank-${category.name}-${measure.name}`,
        chartType: 'bar',
        dimension: category.name,
        measure: measure.name,
        aggregation: 'sum',
        score: 90 - category.unique / 10,
        title: `${humanizeField(measure.name)} by ${humanizeField(category.name)}`,
        reason: `Compares ${formatNumber(category.unique)} categories on a numeric measure — the fastest way to see who leads.`,
      })
    }
  }
  const smallCategory = categories.find((column) => column.unique >= 2 && column.unique <= 7)
  if (smallCategory) {
    suggestions.push({
      id: `share-${smallCategory.name}`,
      chartType: 'donut',
      dimension: smallCategory.name,
      measure: measures[0]?.name ?? smallCategory.name,
      aggregation: measures[0] ? 'sum' : 'count',
      score: 84,
      title: `Share of ${humanizeField(smallCategory.name)}`,
      reason: `Only ${smallCategory.unique} categories, so a part-to-whole view is readable rather than cluttered.`,
    })
  }

  if (measures.length >= 2) {
    suggestions.push({
      id: `scatter-${measures[0].name}-${measures[1].name}`,
      chartType: 'scatter',
      dimension: measures[0].name,
      measure: measures[1].name,
      aggregation: 'sum',
      score: 82,
      title: `${humanizeField(measures[1].name)} vs ${humanizeField(measures[0].name)}`,
      reason: 'Two numeric measures — a scatter plot exposes the relationship and any clusters or outliers.',
    })
  }

  for (const measure of measures.slice(0, 2)) {
    suggestions.push({
      id: `dist-${measure.name}`,
      chartType: 'histogram',
      dimension: measure.name,
      measure: measure.name,
      aggregation: 'count',
      score: 78,
      title: `Distribution of ${humanizeField(measure.name)}`,
      reason: `Shows whether ${humanizeField(measure.name)} clusters around its median of ${measure.stats ? formatNumber(measure.stats.median) : 'the centre'} or spreads out.`,
    })
  }

  const deduped = []
  const seen = new Set()
  for (const suggestion of suggestions.sort((a, b) => b.score - a.score)) {
    const key = `${suggestion.chartType}:${suggestion.dimension}:${suggestion.measure}`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push({ ...suggestion, score: Math.round(suggestion.score) })
    if (deduped.length >= limit) break
  }
  return deduped
}

export { TONE as INSIGHT_TONE }
