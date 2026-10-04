import { useState } from 'react'
import { api } from '../app/api.js'

// Shared flag box. Every real dungeon room submits through here.
export default function FlagSubmit({ roomId }) {
  const [flag, setFlag] = useState('')
  const [result, setResult] = useState(null)
  const [hint, setHint] = useState('')
  const submit = async () => {
    try {
      const res = await api.post('/flags/submit', { roomId, flag })
      setResult(res.correct ? 'correct' : 'wrong')
      setHint(res.hint || '')
    } catch {
      setResult('error')
      setHint('')
    }
  }
  return (
    <div className="bk-flag">
      <input placeholder="BK{...}" value={flag} onChange={(e) => setFlag(e.target.value)} />
      <button onClick={submit}>Submit flag</button>
      {result === 'correct' && <span className="bk-flag-ok">Room cleared!</span>}
      {result === 'wrong' && <span className="bk-flag-no">{hint || 'Not quite.'}</span>}
      {result === 'error' && <span className="bk-flag-no">Something went wrong.</span>}
    </div>
  )
}
