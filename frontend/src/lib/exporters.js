/** File + clipboard helpers used by the export buttons. */

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const escapeCsv = (value) => {
  if (value === null || value === undefined) return ''
  const text = String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function rowsToCsv(rows, columns) {
  const header = columns.map(escapeCsv).join(',')
  const body = rows.map((row) => columns.map((column) => escapeCsv(row?.[column])).join(','))
  return [header, ...body].join('\r\n')
}

export function downloadCsv(rows, columns, filename = 'datapulse-export.csv') {
  // The BOM keeps Excel from mangling non-ASCII characters.
  const blob = new Blob(['﻿', rowsToCsv(rows, columns)], {
    type: 'text/csv;charset=utf-8',
  })
  triggerDownload(blob, filename)
}

export function downloadJson(data, filename = 'datapulse-export.json') {
  triggerDownload(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), filename)
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

const PAINT_PROPERTIES = [
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-dasharray',
  'font-family',
  'font-size',
  'font-weight',
  'text-anchor',
  'opacity',
]

/**
 * Charts are styled with CSS custom properties, which do not survive SVG
 * serialisation. Copy the resolved paint values onto each node before export.
 */
function inlineComputedPaint(source, clone) {
  const sourceNodes = [source, ...source.querySelectorAll('*')]
  const cloneNodes = [clone, ...clone.querySelectorAll('*')]
  sourceNodes.forEach((node, index) => {
    const target = cloneNodes[index]
    if (!target || !(node instanceof Element)) return
    const computed = window.getComputedStyle(node)
    for (const property of PAINT_PROPERTIES) {
      const value = computed.getPropertyValue(property)
      if (value && value !== 'none' && value !== 'normal') target.setAttribute(property, value)
    }
  })
}

/** Rasterises the first `<svg>` inside `container` and downloads it as a PNG. */
export async function downloadChartPng(container, filename = 'datapulse-chart.png', scale = 2) {
  const svg = container?.querySelector('svg')
  if (!svg) throw new Error('No chart is rendered yet.')

  const { width, height } = svg.getBoundingClientRect()
  if (!width || !height) throw new Error('The chart has no size to export.')

  const clone = svg.cloneNode(true)
  inlineComputedPaint(svg, clone)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))

  const background = window
    .getComputedStyle(document.body)
    .getPropertyValue('--dp-surface')
    .trim() || '#ffffff'

  const markup = new XMLSerializer().serializeToString(clone)
  const image = new Image()
  image.crossOrigin = 'anonymous'
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`

  await new Promise((resolve, reject) => {
    image.onload = resolve
    image.onerror = () => reject(new Error('The chart could not be rendered to an image.'))
    image.src = svgUrl
  })

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const context = canvas.getContext('2d')
  context.fillStyle = background
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('The browser could not encode the PNG.')
  triggerDownload(blob, filename)
}
