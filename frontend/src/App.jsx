import { useState } from 'react'
import axios from 'axios'

const API_BASE = 'http://127.0.0.1:8000/api'

function App() {
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState(null)
  const [error, setError] = useState(null)

  const startDiagnosis = async () => {
    if (!description.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post(`${API_BASE}/diagnostic-sessions`, {
        category_id: 1,
        initial_description: description,
      })
      setSession(res.data)
    } catch (err) {
      setError('Something went wrong starting the diagnosis.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">
          IT Diagnostic Assistant
        </h1>
        <p className="text-slate-500 mb-6">What's wrong?</p>

        <textarea
          className="w-full border border-slate-300 rounded-lg p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={4}
          placeholder="My PC turns on but there's no display. The fans are spinning."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button
          onClick={startDiagnosis}
          disabled={loading}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-lg transition"
        >
          {loading ? 'Diagnosing...' : 'Start Diagnosis'}
        </button>

        {error && <p className="text-red-600 mt-4">{error}</p>}

        {session && (
          <div className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-3">
              Diagnostic Session #{session.session.id}
            </h2>

            <div className="space-y-2 mb-6">
              {session.ranked_causes.map((cause) => (
                <div key={cause.cause_id} className="flex items-center gap-3">
                  <span className="w-40 text-sm text-slate-600">{cause.name}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full"
                      style={{ width: `${cause.probability * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-slate-500 w-12 text-right">
                    {Math.round(cause.probability * 100)}%
                  </span>
                </div>
              ))}
            </div>

            {session.next_question && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="font-medium text-slate-800">
                  {session.next_question.prompt}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App