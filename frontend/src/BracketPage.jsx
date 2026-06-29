import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { ChevronDown, LoaderCircle, Search } from 'lucide-react'
import TEAMS_HE from './utils/teamsTranslator'

// ─── Constants ───────────────────────────────────────────────────────────────

const ROUND_LABELS = {
  1: 'סבב 1',
  2: 'שמינית גמר',
  3: 'רבע גמר',
  4: 'חצי גמר',
  5: 'גמר',
}

// Unique sorted Hebrew team names for round-1 free pick
const TEAM_OPTIONS = [...new Set(Object.values(TEAMS_HE))].sort((a, b) =>
  a.localeCompare(b, 'he'),
)

const SLOT_H = 48  // px per team slot
const MATCH_H = SLOT_H * 2
const GAP = 12  // extra vertical space between matches (round 1)
const TOTAL_H = 16 * (MATCH_H + GAP)  // justify-around distributes this evenly, preserving tree alignment

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pk(round, matchIndex, slot) {
  return `${round}-${matchIndex}-${slot}`
}

/**
 * After changing/clearing a pick at (round, matchIndex), recursively clear any
 * downstream pick whose stored team equals oldTeam.
 */
function cascadeClear(picks, round, matchIndex, oldTeam) {
  if (!oldTeam) return picks

  let nextRound, nextMatch, nextSlot
  if (round < 5) {
    nextRound = round + 1
    nextMatch = Math.floor(matchIndex / 2)
    nextSlot = matchIndex % 2
  } else if (round === 5) {
    // Final → Champion
    nextRound = 6
    nextMatch = 0
    nextSlot = 0
  } else {
    return picks
  }

  const key = pk(nextRound, nextMatch, nextSlot)
  if (picks[key] === oldTeam) {
    const updated = { ...picks }
    delete updated[key]
    return cascadeClear(updated, nextRound, nextMatch, oldTeam)
  }
  return picks
}

// ─── TeamSelect (custom searchable dropdown) ─────────────────────────────────

function TeamSelect({ value, options, available, placeholder, onChange }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 })
  const btnRef = useRef(null)
  const dropRef = useRef(null)
  const inputRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handle = (e) => {
      if (
        btnRef.current?.contains(e.target) ||
        dropRef.current?.contains(e.target)
      ) return
      setOpen(false)
      setSearch('')
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handle = (e) => {
      if (e.key === 'Escape') { setOpen(false); setSearch('') }
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open])

  const handleToggle = () => {
    if (!available) return
    if (!open) {
      const r = btnRef.current.getBoundingClientRect()
      // Prefer opening below; if too close to bottom, open above
      const spaceBelow = window.innerHeight - r.bottom
      const dropH = 240
      const top = spaceBelow >= dropH ? r.bottom + 4 : r.top - dropH - 4
      setDropPos({ top, left: r.left, width: Math.max(r.width, 210) })
    }
    setOpen((o) => !o)
    setSearch('')
  }

  const handleSelect = (team) => {
    onChange(team)
    setOpen(false)
    setSearch('')
  }

  const showSearch = options.length > 2
  const filtered = showSearch && search
    ? options.filter((t) => t.includes(search))
    : options

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={!available}
        onClick={handleToggle}
        className={`flex w-full items-center justify-between gap-1 px-2.5 text-xs transition-colors ${
          !available
            ? 'cursor-default text-slate-300'
            : value
            ? 'cursor-pointer font-medium text-slate-800 hover:text-blue-700'
            : 'cursor-pointer text-slate-400 hover:text-blue-600'
        }`}
        style={{ height: SLOT_H }}
      >
        <span className="truncate">{value || placeholder}</span>
        {available && (
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {open &&
        createPortal(
          <div
            ref={dropRef}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
            style={{
              position: 'fixed',
              top: dropPos.top,
              left: dropPos.left,
              width: dropPos.width,
              zIndex: 9999,
            }}
            dir="rtl"
          >
            {showSearch && (
              <div className="border-b border-slate-100 p-2">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100">
                  <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <input
                    ref={inputRef}
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="חיפוש קבוצה..."
                    className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>
            )}
            <div className="max-h-52 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-400">לא נמצאה קבוצה</p>
              ) : (
                filtered.map((team) => (
                  <button
                    key={team}
                    type="button"
                    onClick={() => handleSelect(team)}
                    className={`w-full px-3 py-2 text-right text-xs transition-colors hover:bg-blue-50 hover:text-blue-700 ${
                      team === value
                        ? 'bg-blue-50 font-semibold text-blue-700'
                        : 'text-slate-700'
                    }`}
                  >
                    {team}
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

// ─── TeamSlot ─────────────────────────────────────────────────────────────────

function TeamSlot({ round, matchIndex, slot, picks, onPick }) {
  const key = pk(round, matchIndex, slot)
  const current = picks[key] ?? ''

  let options, available
  if (round === 1) {
    options = TEAM_OPTIONS
    available = true
  } else {
    const feedIdx = matchIndex * 2 + slot
    const t0 = picks[pk(round - 1, feedIdx, 0)]
    const t1 = picks[pk(round - 1, feedIdx, 1)]
    available = !!(t0 && t1)
    options = [t0, t1].filter(Boolean)
  }

  return (
    <div
      className={`border-b-2 last:border-0 transition-colors ${
        !available ? 'border-slate-200 bg-slate-50' : 'border-blue-100 bg-white'
      }`}
      style={{ height: SLOT_H }}
    >
      <TeamSelect
        value={current}
        options={options}
        available={available}
        placeholder={available ? '— בחר קבוצה —' : '· · ·'}
        onChange={(team) => onPick(round, matchIndex, slot, team)}
      />
    </div>
  )
}

// ─── MatchNode ─────────────────────────────────────────────────────────────────

function MatchNode({ round, matchIndex, picks, onPick }) {
  return (
    <div
      className="overflow-hidden rounded-lg border border-white/20 bg-white shadow-md"
      style={{ width: 170 }}
    >
      <TeamSlot round={round} matchIndex={matchIndex} slot={0} picks={picks} onPick={onPick} />
      <TeamSlot round={round} matchIndex={matchIndex} slot={1} picks={picks} onPick={onPick} />
    </div>
  )
}

// ─── RoundColumn ─────────────────────────────────────────────────────────────

function RoundColumn({ round, picks, onPick }) {
  const numMatches = Math.pow(2, 5 - round)  // 16, 8, 4, 2, 1

  return (
    <div className="flex shrink-0 flex-col" style={{ width: 170 }}>
      <div className="mb-3 text-center text-[11px] font-bold uppercase tracking-wider text-blue-200">
        {ROUND_LABELS[round]}
      </div>
      {/* justify-around distributes equal space between/around matches → perfect tree alignment */}
      <div className="flex flex-col justify-around" style={{ height: TOTAL_H }}>
        {Array.from({ length: numMatches }, (_, i) => (
          <MatchNode key={i} round={round} matchIndex={i} picks={picks} onPick={onPick} />
        ))}
      </div>
    </div>
  )
}

// ─── ChampionColumn ──────────────────────────────────────────────────────────

function ChampionColumn({ picks, onPick }) {
  const t0 = picks[pk(5, 0, 0)]
  const t1 = picks[pk(5, 0, 1)]
  const available = !!(t0 && t1)
  const options = [t0, t1].filter(Boolean)
  const current = picks[pk(6, 0, 0)] ?? ''

  return (
    <div
      className="flex shrink-0 flex-col items-center justify-center"
      style={{ width: 170, height: TOTAL_H + 32 }}
    >
      <div className="mb-2 text-4xl">🏆</div>
      <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber-300">
        אלוף
      </div>
      <div
        className={`overflow-hidden rounded-lg border-2 shadow-md transition-colors ${
          available ? 'border-amber-400' : 'border-white/20'
        }`}
        style={{ width: 170 }}
      >
        <div
          className={available ? 'bg-amber-50' : 'bg-white/10'}
          style={{ height: SLOT_H }}
        >
          <TeamSelect
            value={current}
            options={options}
            available={available}
            placeholder={available ? '— בחר אלוף —' : '· · ·'}
            onChange={(team) => onPick(6, 0, 0, team)}
          />
        </div>
      </div>
    </div>
  )
}

// ─── BracketPage ─────────────────────────────────────────────────────────────

export default function BracketPage() {
  const [picks, setPicks] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    axios
      .get('/api/bracket')
      .then(({ data }) => {
        const map = {}
        data.forEach(({ round, match_index, slot, team }) => {
          map[pk(round, match_index, slot)] = team
        })
        setPicks(map)
      })
      .catch(() => setError('שגיאה בטעינת הבראקט'))
      .finally(() => setLoading(false))
  }, [])

  const handlePick = useCallback(
    async (round, matchIndex, slot, team) => {
      const key = pk(round, matchIndex, slot)
      const oldTeam = picks[key]
      if (oldTeam === team) return

      // Apply the change + cascade-clear downstream picks that relied on oldTeam
      let newPicks = { ...picks }
      if (team) {
        newPicks[key] = team
      } else {
        delete newPicks[key]
      }
      if (oldTeam) {
        newPicks = cascadeClear(newPicks, round, matchIndex, oldTeam)
      }

      // Collect keys that were cascade-cleared (were set, now gone)
      const deletedKeys = Object.keys(picks).filter(
        (k) => k !== key && picks[k] && !newPicks[k],
      )

      setPicks(newPicks)
      setSaving(true)

      try {
        if (team) {
          await axios.post('/api/bracket/pick', { round, matchIndex, slot, team })
        } else {
          await axios.delete('/api/bracket/pick', { data: { round, matchIndex, slot } })
        }
        if (deletedKeys.length > 0) {
          await Promise.all(
            deletedKeys.map((k) => {
              const [r, m, s] = k.split('-').map(Number)
              return axios.delete('/api/bracket/pick', { data: { round: r, matchIndex: m, slot: s } })
            }),
          )
        }
      } catch (err) {
        console.error('Failed to save bracket pick:', err)
        setPicks(picks)  // revert on error
      } finally {
        setSaving(false)
      }
    },
    [picks],
  )

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center gap-2 text-slate-400">
        <LoaderCircle className="h-5 w-5 animate-spin" />
        <span>טוען בראקט...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-center text-sm text-red-600">{error}</div>
    )
  }

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <h2 className="text-xl font-bold text-slate-800">בראקט מונדיאל 2026</h2>
        {saving && (
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <LoaderCircle className="h-3 w-3 animate-spin" />
            שומר...
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl bg-gradient-to-br from-blue-700 to-blue-900 p-5 shadow-lg">
        {/* LTR so Round 1 is on the left, Final/Champion on the right */}
        <div className="flex gap-4" style={{ direction: 'ltr', width: 'max-content' }}>
          {[1, 2, 3, 4, 5].map((round) => (
            <RoundColumn key={round} round={round} picks={picks} onPick={handlePick} />
          ))}
        </div>
      </div>

      <p className="mt-3 text-right text-xs text-slate-500">
        בסבב הראשון בחר את כל הקבוצות. בכל סבב עוקב תוכל לבחור רק מבין שתי הקבוצות שנלחמו על אותו מקום.
      </p>
    </div>
  )
}
