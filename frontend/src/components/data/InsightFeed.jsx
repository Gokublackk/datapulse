import { CircleCheckBig, Info, Lightbulb, OctagonAlert, TriangleAlert } from 'lucide-react'
import { EmptyState } from '../ui/EmptyState'
import { INSIGHT_TONE } from '../../lib/insights'

const TONE_META = {
  [INSIGHT_TONE.GOOD]: { icon: CircleCheckBig, color: 'var(--dp-success)', label: 'Healthy' },
  [INSIGHT_TONE.INFO]: { icon: Info, color: 'var(--dp-brand)', label: 'Observation' },
  [INSIGHT_TONE.WARN]: { icon: TriangleAlert, color: 'var(--dp-warn)', label: 'Watch' },
  [INSIGHT_TONE.RISK]: { icon: OctagonAlert, color: 'var(--dp-danger)', label: 'Risk' },
}

/** Plain-language findings derived from the local profile. */
export default function InsightFeed({ insights = [], columns = 2 }) {
  if (!insights.length) {
    return (
      <div className="dp-card">
        <EmptyState
          icon={Lightbulb}
          title="No findings yet"
          description="Insights appear once the dataset has been profiled."
        />
      </div>
    )
  }

  return (
    <ul className={`grid gap-3 ${columns === 2 ? 'lg:grid-cols-2' : ''}`}>
      {insights.map((insight) => {
        const meta = TONE_META[insight.tone] ?? TONE_META[INSIGHT_TONE.INFO]
        const Icon = meta.icon
        return (
          <li
            key={insight.id}
            className="dp-card animate-rise flex gap-3 p-4"
            style={{ borderLeft: `3px solid ${meta.color}` }}
          >
            <span
              className="grid size-8 shrink-0 place-items-center rounded-lg"
              style={{ color: meta.color, background: `color-mix(in oklab, ${meta.color} 14%, transparent)` }}
              aria-hidden="true"
            >
              <Icon size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-bold text-ink">{insight.title}</h3>
                {insight.metric ? (
                  <span className="dp-num shrink-0 text-sm font-bold" style={{ color: meta.color }}>
                    {insight.metric}
                  </span>
                ) : null}
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{insight.body}</p>
              <span className="sr-only">Severity: {meta.label}</span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
