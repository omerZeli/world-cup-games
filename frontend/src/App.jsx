import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

function formatMatchTime(utcDate) {
  return new Date(utcDate).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function MatchCard({ match }) {
  const { homeTeam, awayTeam, utcDate, status, highlightUrl } = match

  return (
    <li className="match-card">
      <span className="teams">
        {homeTeam} <span className="vs">vs</span> {awayTeam}
      </span>
      <span className="match-time">{formatMatchTime(utcDate)}</span>
      {status === 'FINISHED' && highlightUrl && (
        <a
          href={highlightUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="highlights-link"
        >
          ▶ Watch Highlights
        </a>
      )}
    </li>
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

  if (loading) return <p className="status-msg">Loading matches…</p>
  if (error) return <p className="status-msg error">Error: {error}</p>
  if (matches.length === 0) return <p className="status-msg">No matches found.</p>

  return (
    <main>
      <h1>⚽ World Cup 2026</h1>
      <ul className="match-list">
        {matches.map((match) => (
          <MatchCard key={match.matchId} match={match} />
        ))}
      </ul>
    </main>
  )
}

export default App
