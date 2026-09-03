import { useState } from 'react'
import axios from 'axios'

const API_BASE = 'http://127.0.0.1:8000/api'

function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)

  const [authMode, setAuthMode] = useState('login') // 'login' or 'register'
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [authError, setAuthError] = useState(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [view, setView] = useState('diagnose') // 'diagnose' or 'history'
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState(null)
  const [error, setError] = useState(null)
  const [answering, setAnswering] = useState(false)
  const [detectedCategory, setDetectedCategory] = useState(null)

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

  const handleAuthSubmit = async () => {
    setAuthLoading(true)
    setAuthError(null)
    try {
      const endpoint = authMode === 'login' ? 'login' : 'register'
      const payload = authMode === 'login'
        ? { email: authForm.email, password: authForm.password }
        : authForm

      const res = await axios.post(`${API_BASE}/${endpoint}`, payload, {
        headers: { Accept: 'application/json' },
      })

      setUser(res.data.user)
      setToken(res.data.token)
    } catch (err) {
      const message = err.response?.data?.message
        || Object.values(err.response?.data?.errors || {})[0]?.[0]
        || 'Something went wrong.'
      setAuthError(message)
    } finally {
      setAuthLoading(false)
    }
  }

  const logout = async () => {
    try {
      await axios.post(`${API_BASE}/logout`, {}, { headers: authHeaders })
    } catch (err) {
      // ignore — logging out client-side regardless
    }
    setUser(null)
    setToken(null)
    setSession(null)
  }

  const loadHistory = async () => {
    setView('history')
    setHistoryLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/diagnostic-sessions`, { headers: authHeaders })
      setHistory(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setHistoryLoading(false)
    }
  }

  const reopenSession = async (sessionId) => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/diagnostic-sessions/${sessionId}`, { headers: authHeaders })
      setSession(res.data)
      setView('diagnose')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const startDiagnosis = async () => {
    if (!description.trim()) return
    setLoading(true)
    setError(null)
    try {
      const classifyRes = await axios.post(
        `${API_BASE}/classify`,
        { description },
        { headers: authHeaders }
      )
      setDetectedCategory(classifyRes.data)

      const res = await axios.post(
        `${API_BASE}/diagnostic-sessions`,
        { category_id: classifyRes.data.category_id, initial_description: description },
        { headers: authHeaders }
      )
      setSession(res.data)
    } catch (err) {
      setError('Something went wrong starting the diagnosis.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = async (answerValue) => {
    if (!session?.next_question) return
    setAnswering(true)
    setError(null)
    try {
      const res = await axios.post(
        `${API_BASE}/diagnostic-sessions/${session.session.id}/answer`,
        { question_id: session.next_question.id, answer: answerValue },
        { headers: authHeaders }
      )
      setSession(res.data)
    } catch (err) {
      setError('Something went wrong submitting your answer.')
      console.error(err)
    } finally {
      setAnswering(false)
    }
  }

  const submitFeedback = async (resolved) => {
    try {
      const res = await axios.post(
        `${API_BASE}/diagnostic-sessions/${session.session.id}/feedback`,
        { resolved },
        { headers: authHeaders }
      )
      setSession(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const reset = () => {
    setSession(null)
    setDescription('')
    setError(null)
    setDetectedCategory(null)
    setView('diagnose')
  }

  // ---- Not logged in: show auth form ----
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">
            IT Diagnostic Assistant
          </h1>
          <p className="text-slate-500 mb-6">
            {authMode === 'login' ? 'Log in to continue' : 'Create an account'}
          </p>

          {authMode === 'register' && (
            <input
              type="text"
              placeholder="Name"
              className="w-full border border-slate-300 rounded-lg p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={authForm.name}
              onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
            />
          )}

          <input
            type="email"
            placeholder="Email"
            className="w-full border border-slate-300 rounded-lg p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={authForm.email}
            onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border border-slate-300 rounded-lg p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={authForm.password}
            onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
          />

          {authMode === 'register' && (
            <input
              type="password"
              placeholder="Confirm password"
              className="w-full border border-slate-300 rounded-lg p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={authForm.password_confirmation}
              onChange={(e) => setAuthForm({ ...authForm, password_confirmation: e.target.value })}
            />
          )}

          {authError && <p className="text-red-600 text-sm mb-3">{authError}</p>}

          <button
            onClick={handleAuthSubmit}
            disabled={authLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-lg transition"
          >
            {authLoading ? 'Please wait...' : authMode === 'login' ? 'Log In' : 'Register'}
          </button>

          <button
            onClick={() => {
              setAuthMode(authMode === 'login' ? 'register' : 'login')
              setAuthError(null)
            }}
            className="w-full text-sm text-slate-500 hover:text-slate-700 mt-4"
          >
            {authMode === 'login'
              ? "Don't have an account? Register"
              : 'Already have an account? Log in'}
          </button>
        </div>
      </div>
    )
  }

  // ---- Logged in ----
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-slate-800">IT Diagnostic Assistant</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => (view === 'history' ? setView('diagnose') : loadHistory())}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {view === 'history' ? 'New diagnosis' : 'History'}
            </button>
            <button onClick={logout} className="text-sm text-slate-400 hover:text-slate-600">
              Log out
            </button>
          </div>
        </div>
        <p className="text-slate-500 mb-6">Hi {user.name} — what's wrong?</p>

        {view === 'history' && (
          <div className="space-y-3">
            {historyLoading && <p className="text-slate-400 text-sm">Loading...</p>}

            {!historyLoading && history.length === 0 && (
              <p className="text-slate-400 text-sm">No past diagnoses yet.</p>
            )}

            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => reopenSession(item.id)}
                className="w-full text-left border border-slate-200 rounded-lg p-4 hover:border-blue-400 transition"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-blue-600">{item.category}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    item.status === 'resolved' ? 'bg-green-100 text-green-700' :
                    item.status === 'active' ? 'bg-yellow-100 text-yellow-700' :
                    item.status === 'escalated' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-sm text-slate-700 italic">"{item.initial_description}"</p>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        )}

        {view === 'diagnose' && (
          <>
            {!session && (
              <>
                <textarea
                  className="w-full border border-slate-300 rounded-lg p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                  placeholder="Describe what's happening..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />

                <button
                  onClick={startDiagnosis}
                  disabled={loading}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-lg transition"
                >
                  {loading ? 'Analyzing your problem...' : 'Start Diagnosis'}
                </button>
              </>
            )}

            {error && <p className="text-red-600 mt-4">{error}</p>}

            {session && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-slate-800">
                    Diagnostic Session #{session.session.id}
                  </h2>
                  <button onClick={reset} className="text-sm text-slate-400 hover:text-slate-600">
                    Start over
                  </button>
                </div>

                {detectedCategory && (
                  <p className="text-xs text-blue-600 mb-3">
                    Detected category: {detectedCategory.category_name}
                    {detectedCategory.fallback && ' (fallback — AI unavailable)'}
                  </p>
                )}

                <p className="text-sm text-slate-500 mb-4 italic">
                  "{session.session.initial_description}"
                </p>

                <div className="space-y-2 mb-6">
                  {session.ranked_causes.map((cause) => (
                    <div key={cause.cause_id} className="flex items-center gap-3">
                      <span className="w-40 text-sm text-slate-600">{cause.name}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full transition-all duration-500"
                          style={{ width: `${cause.probability * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-500 w-12 text-right">
                        {Math.round(cause.probability * 100)}%
                      </span>
                    </div>
                  ))}
                </div>

                {session.next_question ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="font-medium text-slate-800 mb-3">{session.next_question.prompt}</p>
                    {session.next_question.explanation_text && (
                      <p className="text-xs text-slate-500 mb-3">{session.next_question.explanation_text}</p>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={() => submitAnswer('yes')}
                        disabled={answering}
                        className="flex-1 bg-white border border-slate-300 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50 font-medium py-2 rounded-lg transition"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => submitAnswer('no')}
                        disabled={answering}
                        className="flex-1 bg-white border border-slate-300 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50 font-medium py-2 rounded-lg transition"
                      >
                        No
                      </button>
                    </div>
                  </div>
                ) : (
                  session.recommended_article && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-semibold text-green-800 mb-3">
                        {session.recommended_article.title}
                      </h3>
                      <ol className="space-y-2 mb-4">
                        {session.recommended_article.steps.map((step) => (
                          <li key={step.id} className="text-sm text-slate-700 flex gap-2">
                            <span className="font-semibold text-green-700">{step.order}.</span>
                            {step.instruction}
                          </li>
                        ))}
                      </ol>

                      {session.session.status === 'active' ? (
                        <div className="border-t border-green-200 pt-3">
                          <p className="text-sm font-medium text-slate-700 mb-2">Did this resolve it?</p>
                          <div className="flex gap-3">
                            <button
                              onClick={() => submitFeedback(true)}
                              className="flex-1 bg-white border border-green-300 hover:bg-green-100 text-green-700 font-medium py-2 rounded-lg transition"
                            >
                              Yes, fixed!
                            </button>
                            <button
                              onClick={() => submitFeedback(false)}
                              className="flex-1 bg-white border border-red-300 hover:bg-red-100 text-red-700 font-medium py-2 rounded-lg transition"
                            >
                              No, still broken
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 border-t border-green-200 pt-3">
                          {session.session.status === 'resolved'
                            ? '✅ Marked as resolved. Thanks for the feedback!'
                            : '⚠️ Marked as escalated — this may need further help.'}
                        </p>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default App