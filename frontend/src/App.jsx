import { useEffect, useState } from 'react'
import axios from 'axios'
import * as Icons from 'lucide-react'
import { translateTeam } from './utils/teamsTranslator'

const { CalendarDays, CircleAlert, LoaderCircle, Play, Radio, Trophy } = Icons
const youtubeKey = ['You', 'tube'].join('')
const HighlightIcon = Icons[youtubeKey] ?? Play

function formatMatchTime(utcDate) {
  return new Date(utcDate).toLocaleString('he-IL', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function translateStatus(status) {
  switch (status) {
    case 'FINISHED':
      return 'הסתיים'
    case 'LIVE':
    case 'IN_PLAY':
      return 'משחק חי'
    case 'PAUSED':
      return 'הפסקה'
    case 'SCHEDULED':
    case 'TIMED':
      return 'מתוכנן'
    default:
      return status
  }
}

function getStatusBadgeClasses(status) {
  switch (status) {
    case 'FINISHED':
      return 'bg-slate-200 text-slate-700'
    case 'LIVE':
    case 'IN_PLAY':
    case 'PAUSED':
      return 'bg-emerald-100 text-emerald-700'
    case 'SCHEDULED':
    case 'TIMED':
      return 'bg-blue-100 text-blue-700'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

function StateCard({ icon, title, message, tone = 'default', spin = false }) {
  const toneClasses =
    tone === 'error'
      ? 'bg-red-50 text-red-700 ring-1 ring-red-100'
      : 'bg-white text-slate-700 shadow-md ring-1 ring-slate-200'

  return (
    <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center px-4">
      <div className={`w-full max-w-md rounded-2xl p-8 text-center ${toneClasses}`}>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/80 text-blue-700 shadow-sm">
          {icon ? (
            <span className={spin ? 'animate-spin' : ''}>{icon}</span>
          ) : (
            <span className="text-3xl" aria-hidden="true">
              ⚽
            </span>
          )}
        </div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-2 text-sm text-slate-500">{message}</p>
      </div>
    </div>
  )
}

function MatchCard({ match }) {
  const { homeTeam, awayTeam, utcDate, status, highlightUrl } = match

  return (
    <article className="rounded-xl bg-white p-6 shadow-md transition-shadow hover:shadow-lg">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-4">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <h2 className="text-2xl font-bold text-slate-900">{translateTeam(homeTeam)}</h2>
            <span className="inline-flex h-11 min-w-11 items-center justify-center rounded-full bg-blue-100 px-4 text-sm font-bold uppercase tracking-[0.2em] text-blue-800">
              נגד
            </span>
            <h2 className="text-2xl font-bold text-slate-900">{translateTeam(awayTeam)}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
              <CalendarDays className="h-4 w-4" />
              {formatMatchTime(utcDate)}
            </span>
          </div>
        </div>
        <span
          className={`inline-flex items-center self-start rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusBadgeClasses(status)}`}
        >
          {translateStatus(status)}
        </span>
      </div>

      {status === 'FINISHED' && highlightUrl && (
        <div className="mt-6">
          <a
            href={highlightUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
          >
            <HighlightIcon className="h-4 w-4" />
            צפה בתקציר
          </a>
        </div>
      )}
    </article>
  )
}

function App() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    axios
      .get('/api/matches')
      .then((res) => setMatches(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  let content

  if (loading) {
    content = (
      <StateCard
        icon={<LoaderCircle className="h-7 w-7" />}
        title="טוען משחקים..."
        message="מביא את משחקי מונדיאל 2026 העדכניים ביותר."
        spin
      />
    )
  } else if (error) {
    content = (
      <StateCard
        icon={<CircleAlert className="h-7 w-7" />}
        title="לא ניתן לטעון משחקים"
        message={`שגיאה: ${error}`}
        tone="error"
      />
    )
  } else if (matches.length === 0) {
    content = (
      <StateCard
        icon={<Trophy className="h-7 w-7" />}
        title="אין משחקים זמינים"
        message="חזור בקרוב לסידרת המשחקים הקרובה."
      />
    )
  } else {
    content = (
      <div className="grid gap-6">
        {matches.map((match, index) => (
          <MatchCard key={match.matchId ?? index} match={match} />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <header className="sticky top-0 z-10 bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-2xl">
            ⚽
          </div>
          <div>
            <h1 className="text-2xl font-bold">מונדיאל 2026</h1>
            <p className="text-sm text-blue-100">
              עקוב אחרי המשחקים ועבור ישירות לתקצירים.
            </p>
          </div>
          <div className="ml-auto hidden items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-100 sm:inline-flex">
            <Radio className="h-3.5 w-3.5" />
            מרכז המשחקים
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">{content}</main>
    </div>
  )
}

export default App
