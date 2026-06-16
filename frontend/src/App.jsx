import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import * as Icons from 'lucide-react'
import { translateTeam } from './utils/teamsTranslator'

const { CalendarDays, CircleAlert, Clock3, Eye, EyeOff, LoaderCircle, Play, RefreshCw, Trophy } = Icons
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

function formatWorkerRunTime(dateTime) {
  return new Date(dateTime).toLocaleString('he-IL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getErrorMessage(err, fallbackMessage) {
  return err.response?.data?.message ?? err.message ?? fallbackMessage
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

function MatchCard({ match, onToggleWatched }) {
  const { matchId, homeTeam, awayTeam, utcDate, status, highlightUrl, watched } = match
  const watchedLabel = watched ? 'נצפה' : 'לא נצפה'

  return (
    <article
      className="rounded-xl border border-slate-200 bg-white shadow-md transition-all hover:shadow-lg"
    >
      {watched ? (
        <div className="flex flex-col gap-2 p-4">
          <div className="flex flex-wrap items-center gap-2 text-base font-bold text-slate-800 sm:text-lg">
            <span>{translateTeam(homeTeam)}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
              נגד
            </span>
            <span>{translateTeam(awayTeam)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusBadgeClasses(status)}`}
              >
                {translateStatus(status)}
              </span>
              <span className="inline-flex shrink-0 items-center rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                {watchedLabel}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onToggleWatched(matchId, watched)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700"
              aria-label="סמן כלא נצפה"
              title="סמן כלא נצפה"
            >
              <EyeOff className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-slate-900">{translateTeam(homeTeam)}</h2>
                <span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-800">
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

            <div className="flex items-center gap-2 self-start">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusBadgeClasses(status)}`}
              >
                {translateStatus(status)}
              </span>
              <button
                type="button"
                onClick={() => onToggleWatched(matchId, watched)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700"
                aria-label="סמן כנצפה"
                title="סמן כנצפה"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          </div>

          {status === 'FINISHED' && highlightUrl && (
            <div className="mt-6">
              <a
                href={highlightUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
              >
                <HighlightIcon className="h-4 w-4" />
                צפה בתקציר
              </a>
            </div>
          )}
        </div>
      )}
    </article>
  )
}

function App() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('unfinished')
  const [workerRunning, setWorkerRunning] = useState(false)
  const [lastRun, setLastRun] = useState(null)
  const [workerError, setWorkerError] = useState(null)

  useEffect(() => {
    const loadInitialData = async () => {
      const [matchesResult, lastRunResult] = await Promise.allSettled([
        axios.get('/api/matches'),
        axios.get('/api/worker/last-run'),
      ])

      if (matchesResult.status === 'fulfilled') {
        const nextMatches = matchesResult.value.data
        setMatches(nextMatches)
        setActiveTab(nextMatches.some((match) => match.status === 'FINISHED') ? 'finished' : 'unfinished')
      } else {
        setError(getErrorMessage(matchesResult.reason, 'אירעה שגיאה בטעינת המשחקים'))
      }

      if (lastRunResult.status === 'fulfilled') {
        setLastRun(lastRunResult.value.data)
      } else {
        setWorkerError(getErrorMessage(lastRunResult.reason, 'לא ניתן לטעון את זמן העדכון האחרון'))
      }

      setLoading(false)
    }

    loadInitialData()
  }, [])

  useEffect(() => {
    if (!workerError) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => setWorkerError(null), 5000)

    return () => window.clearTimeout(timeoutId)
  }, [workerError])

  const finishedMatches = useMemo(
    () => matches.filter((match) => match.status === 'FINISHED'),
    [matches],
  )
  const unfinishedMatches = useMemo(
    () => matches.filter((match) => match.status !== 'FINISHED'),
    [matches],
  )
  const visibleMatches = activeTab === 'finished' ? finishedMatches : unfinishedMatches

  const fetchMatches = async () => {
    const { data } = await axios.get('/api/matches')
    setMatches(data)
  }

  const toggleWatched = async (matchId, currentWatched) => {
    const newValue = !currentWatched

    setMatches((prev) =>
      prev.map((match) =>
        match.matchId === matchId ? { ...match, watched: newValue } : match,
      ),
    )

    try {
      const { data } = await axios.patch(`/api/matches/${matchId}/watched`, { watched: newValue })
      setMatches((prev) => prev.map((match) => (match.matchId === matchId ? { ...match, ...data } : match)))
    } catch (err) {
      setMatches((prev) =>
        prev.map((match) =>
          match.matchId === matchId ? { ...match, watched: currentWatched } : match,
        ),
      )
      console.error('Failed to update watched state', err)
    }
  }

  const handleRunWorker = async () => {
    setWorkerRunning(true)
    setWorkerError(null)

    try {
      const { data } = await axios.post('/api/worker/run')
      setLastRun(data)
      await fetchMatches()
    } catch (err) {
      setWorkerError(getErrorMessage(err, 'לא ניתן לעדכן את הנתונים כרגע'))
    } finally {
      setWorkerRunning(false)
    }
  }

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
      <div className="space-y-6">
        <div className="sticky top-[5.5rem] z-10 -mx-4 border-b border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex w-full max-w-4xl items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('finished')}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                activeTab === 'finished'
                  ? 'bg-blue-100 text-blue-800 shadow-sm'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              הסתיימו
              <span className={`mr-2 text-xs ${activeTab === 'finished' ? 'text-blue-600' : 'text-slate-500'}`}>({finishedMatches.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unfinished')}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                activeTab === 'unfinished'
                  ? 'bg-blue-100 text-blue-800 shadow-sm'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              לא הסתיימו
              <span className={`mr-2 text-xs ${activeTab === 'unfinished' ? 'text-blue-600' : 'text-slate-500'}`}>({unfinishedMatches.length})</span>
            </button>
          </div>
        </div>

        {visibleMatches.length > 0 ? (
          <div className="grid gap-6">
            {visibleMatches.map((match, index) => (
              <MatchCard
                key={match.matchId ?? index}
                match={match}
                onToggleWatched={toggleWatched}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-8 text-center text-slate-500 shadow-sm">
            אין משחקים בלשונית זו כרגע.
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <header className="relative sticky top-0 z-20 bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg">
        {/* Centered logo + title */}
        <div className="flex items-center justify-center gap-4 px-4 py-5">
          <div className="h-12 w-12 overflow-hidden rounded-full bg-white/15">
            <img src="/logo.png" alt="מונדיאל 2026" className="h-full w-full object-cover" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">מונדיאל 2026</h1>
            <p className="text-sm text-blue-100">
              עקוב אחרי המשחקים ועבור ישירות לתקצירים.
            </p>
          </div>
        </div>

        {/* Left-edge controls — absolutely positioned */}
        <div className="absolute bottom-0 left-8 top-0 flex flex-col items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={handleRunWorker}
            disabled={workerRunning}
            className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <RefreshCw className={`h-4 w-4 ${workerRunning ? 'animate-spin' : ''}`} />
            עדכן נתונים
          </button>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-blue-100">
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />
              {lastRun?.ran_at
                ? `עודכן: ${formatWorkerRunTime(lastRun.ran_at)}`
                : 'מעולם לא עודכן'}
            </span>
            {lastRun?.ran_at && lastRun.triggered_by === 'manual' && (
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold text-white">
                ידני
              </span>
            )}
            {lastRun?.ran_at && lastRun.triggered_by === 'scheduled' && (
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold text-white">
                אוטומטי
              </span>
            )}
          </div>
          {workerError && (
            <p className="rounded-md bg-red-500/20 px-2.5 py-1 text-xs text-red-100">
              {workerError}
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">{content}</main>
    </div>
  )
}

export default App
