import { useState } from 'react'
import axios from 'axios'

const API_BASE = 'https://diagnoit.onrender.com/api'

function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [adminCategories, setAdminCategories] = useState([])
  const [adminCauses, setAdminCauses] = useState([])
  const [adminLoading, setAdminLoading] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [newCategory, setNewCategory] = useState({ name: '', slug: '' })
  const [newCause, setNewCause] = useState({ name: '', description: '', base_prior: '' })

  // ---- Articles / Steps admin state ----
  const [selectedCauseId, setSelectedCauseId] = useState(null)
  const [adminArticles, setAdminArticles] = useState([])
  const [adminArticlesLoading, setAdminArticlesLoading] = useState(false)
  const [newArticle, setNewArticle] = useState({ title: '', symptoms_summary: '', status: 'draft' })
  const [expandedArticleId, setExpandedArticleId] = useState(null)
  const [newStep, setNewStep] = useState({ instruction: '', media_url: '', requires_confirmation: true })
  const [editingArticleId, setEditingArticleId] = useState(null)
  const [editArticleForm, setEditArticleForm] = useState({ title: '', symptoms_summary: '' })

  const [authMode, setAuthMode] = useState('login') // 'login' or 'register'
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [authError, setAuthError] = useState(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [view, setView] = useState('diagnose') // 'diagnose' | 'history' | 'admin'
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

  const loadAdminCategories = async () => {
    setView('admin')
    setAdminLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/admin/categories`, { headers: authHeaders })
      setAdminCategories(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setAdminLoading(false)
    }
  }

  const loadAdminCauses = async (categoryId) => {
    setSelectedCategoryId(categoryId)
    setSelectedCauseId(null)
    setAdminArticles([])
    try {
      const res = await axios.get(`${API_BASE}/admin/causes?category_id=${categoryId}`, { headers: authHeaders })
      setAdminCauses(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const createCategory = async () => {
    if (!newCategory.name.trim() || !newCategory.slug.trim()) return
    try {
      await axios.post(`${API_BASE}/admin/categories`, newCategory, { headers: authHeaders })
      setNewCategory({ name: '', slug: '' })
      loadAdminCategories()
    } catch (err) {
      console.error(err.response?.data)
    }
  }

  const deleteCategory = async (id) => {
    if (!confirm('Delete this category and everything under it?')) return
    try {
      await axios.delete(`${API_BASE}/admin/categories/${id}`, { headers: authHeaders })
      loadAdminCategories()
      if (selectedCategoryId === id) setSelectedCategoryId(null)
    } catch (err) {
      console.error(err)
    }
  }

  const createCause = async () => {
    if (!newCause.name.trim() || !newCause.base_prior) return
    try {
      await axios.post(
        `${API_BASE}/admin/causes`,
        { ...newCause, category_id: selectedCategoryId, base_prior: parseFloat(newCause.base_prior) },
        { headers: authHeaders }
      )
      setNewCause({ name: '', description: '', base_prior: '' })
      loadAdminCauses(selectedCategoryId)
    } catch (err) {
      console.error(err.response?.data)
    }
  }

  const deleteCause = async (id) => {
    if (!confirm('Delete this cause?')) return
    try {
      await axios.delete(`${API_BASE}/admin/causes/${id}`, { headers: authHeaders })
      loadAdminCauses(selectedCategoryId)
    } catch (err) {
      console.error(err)
    }
  }

  // ---- Articles ----
  const loadAdminArticles = async (causeId) => {
    setSelectedCauseId(causeId)
    setExpandedArticleId(null)
    setAdminArticlesLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/admin/articles?cause_id=${causeId}`, { headers: authHeaders })
      setAdminArticles(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setAdminArticlesLoading(false)
    }
  }

  const createArticle = async () => {
    if (!newArticle.title.trim()) return
    try {
      await axios.post(
        `${API_BASE}/admin/articles`,
        { ...newArticle, cause_id: selectedCauseId },
        { headers: authHeaders }
      )
      setNewArticle({ title: '', symptoms_summary: '', status: 'draft' })
      loadAdminArticles(selectedCauseId)
    } catch (err) {
      console.error(err.response?.data)
    }
  }

  const startEditArticle = (article) => {
    setEditingArticleId(article.id)
    setEditArticleForm({ title: article.title, symptoms_summary: article.symptoms_summary || '' })
  }

  const saveEditArticle = async (id) => {
    try {
      await axios.patch(`${API_BASE}/admin/articles/${id}`, editArticleForm, { headers: authHeaders })
      setEditingArticleId(null)
      loadAdminArticles(selectedCauseId)
    } catch (err) {
      console.error(err.response?.data)
    }
  }

  const toggleArticleStatus = async (article) => {
    try {
      await axios.patch(
        `${API_BASE}/admin/articles/${article.id}`,
        { status: article.status === 'draft' ? 'published' : 'draft' },
        { headers: authHeaders }
      )
      loadAdminArticles(selectedCauseId)
    } catch (err) {
      console.error(err)
    }
  }

  const deleteArticle = async (id) => {
    if (!confirm('Delete this article and all its steps?')) return
    try {
      await axios.delete(`${API_BASE}/admin/articles/${id}`, { headers: authHeaders })
      if (expandedArticleId === id) setExpandedArticleId(null)
      loadAdminArticles(selectedCauseId)
    } catch (err) {
      console.error(err)
    }
  }

  // ---- Steps ----
  const createStep = async (articleId) => {
    if (!newStep.instruction.trim()) return
    try {
      await axios.post(
        `${API_BASE}/admin/steps`,
        { ...newStep, article_id: articleId },
        { headers: authHeaders }
      )
      setNewStep({ instruction: '', media_url: '', requires_confirmation: true })
      loadAdminArticles(selectedCauseId)
    } catch (err) {
      console.error(err.response?.data)
    }
  }

  const deleteStep = async (id) => {
    if (!confirm('Delete this step?')) return
    try {
      await axios.delete(`${API_BASE}/admin/steps/${id}`, { headers: authHeaders })
      loadAdminArticles(selectedCauseId)
    } catch (err) {
      console.error(err)
    }
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
            {view !== 'diagnose' && (
              <button onClick={() => setView('diagnose')} className="text-sm text-blue-600 hover:text-blue-800">
                New diagnosis
              </button>
            )}
            {view === 'diagnose' && (
              <button onClick={loadHistory} className="text-sm text-blue-600 hover:text-blue-800">
                History
              </button>
            )}
            {user.role === 'admin' && view !== 'admin' && (
              <button onClick={loadAdminCategories} className="text-sm text-purple-600 hover:text-purple-800">
                Admin
              </button>
            )}
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

        {view === 'admin' && (
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Knowledge Base Admin</h2>

            {adminLoading && <p className="text-slate-400 text-sm">Loading...</p>}

            {/* ---- Categories ---- */}
            <div className="space-y-2 mb-4">
              {adminCategories.map((cat) => (
                <div
                  key={cat.id}
                  className={`border rounded-lg p-3 cursor-pointer transition ${
                    selectedCategoryId === cat.id ? 'border-purple-400 bg-purple-50' : 'border-slate-200 hover:border-purple-300'
                  }`}
                  onClick={() => loadAdminCauses(cat.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-slate-800">{cat.name}</span>
                      <span className="text-xs text-slate-400 ml-2">
                        {cat.causes_count} causes · {cat.questions_count} questions
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id) }}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border border-dashed border-slate-300 rounded-lg p-3 mb-6">
              <p className="text-sm font-medium text-slate-600 mb-2">Add category</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Name"
                  className="flex-1 border border-slate-300 rounded p-2 text-sm"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="slug"
                  className="flex-1 border border-slate-300 rounded p-2 text-sm"
                  value={newCategory.slug}
                  onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                />
                <button onClick={createCategory} className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 rounded">
                  Add
                </button>
              </div>
            </div>

            {/* ---- Causes ---- */}
            {selectedCategoryId && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">
                  Causes for {adminCategories.find((c) => c.id === selectedCategoryId)?.name}
                </h3>

                <div className="space-y-2 mb-4">
                  {adminCauses.map((cause) => (
                    <div
                      key={cause.id}
                      className={`border rounded-lg p-3 cursor-pointer transition ${
                        selectedCauseId === cause.id ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'
                      }`}
                      onClick={() => loadAdminArticles(cause.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-slate-800 text-sm">{cause.name}</span>
                          <span className="text-xs text-slate-400 ml-2">
                            prior: {(cause.base_prior * 100).toFixed(0)}%
                          </span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteCause(cause.id) }}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border border-dashed border-slate-300 rounded-lg p-3">
                  <p className="text-sm font-medium text-slate-600 mb-2">Add cause</p>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Name"
                      className="border border-slate-300 rounded p-2 text-sm"
                      value={newCause.name}
                      onChange={(e) => setNewCause({ ...newCause, name: e.target.value })}
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      placeholder="Base prior (0-1)"
                      className="border border-slate-300 rounded p-2 text-sm"
                      value={newCause.base_prior}
                      onChange={(e) => setNewCause({ ...newCause, base_prior: e.target.value })}
                    />
                  </div>
                  <textarea
                    placeholder="Description"
                    className="w-full border border-slate-300 rounded p-2 text-sm mb-2"
                    rows={2}
                    value={newCause.description}
                    onChange={(e) => setNewCause({ ...newCause, description: e.target.value })}
                  />
                  <button onClick={createCause} className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-1.5 rounded">
                    Add cause
                  </button>
                </div>
              </div>
            )}

            {/* ---- Articles + Steps ---- */}
            {selectedCauseId && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">
                  Articles for {adminCauses.find((c) => c.id === selectedCauseId)?.name}
                </h3>

                {adminArticlesLoading && <p className="text-slate-400 text-sm mb-2">Loading articles...</p>}

                <div className="space-y-3 mb-4">
                  {adminArticles.map((article) => (
                    <div key={article.id} className="border border-slate-200 rounded-lg overflow-hidden">
                      <div
                        className="p-3 cursor-pointer hover:bg-slate-50"
                        onClick={() => setExpandedArticleId(expandedArticleId === article.id ? null : article.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">
                              {expandedArticleId === article.id ? '▾' : '▸'}
                            </span>
                            {editingArticleId === article.id ? (
                              <input
                                type="text"
                                className="border border-slate-300 rounded p-1 text-sm"
                                value={editArticleForm.title}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => setEditArticleForm({ ...editArticleForm, title: e.target.value })}
                              />
                            ) : (
                              <span className="font-medium text-slate-800 text-sm">{article.title}</span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              article.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {article.status}
                            </span>
                            <span className="text-xs text-slate-400">
                              {article.steps_count ?? article.steps?.length ?? 0} steps
                            </span>
                          </div>
                          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                            {editingArticleId === article.id ? (
                              <button onClick={() => saveEditArticle(article.id)} className="text-xs text-green-600 hover:text-green-800">
                                Save
                              </button>
                            ) : (
                              <button onClick={() => startEditArticle(article)} className="text-xs text-blue-600 hover:text-blue-800">
                                Edit
                              </button>
                            )}
                            <button onClick={() => toggleArticleStatus(article)} className="text-xs text-indigo-600 hover:text-indigo-800">
                              {article.status === 'draft' ? 'Publish' : 'Unpublish'}
                            </button>
                            <button onClick={() => deleteArticle(article.id)} className="text-xs text-red-500 hover:text-red-700">
                              Delete
                            </button>
                          </div>
                        </div>
                        {editingArticleId === article.id && (
                          <textarea
                            placeholder="Symptoms summary"
                            className="w-full border border-slate-300 rounded p-2 text-sm mt-2"
                            rows={2}
                            value={editArticleForm.symptoms_summary}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setEditArticleForm({ ...editArticleForm, symptoms_summary: e.target.value })}
                          />
                        )}
                      </div>

                      {expandedArticleId === article.id && (
                        <div className="border-t border-slate-200 bg-slate-50 p-3">
                          <ol className="space-y-2 mb-3">
                            {(article.steps || [])
                              .slice()
                              .sort((a, b) => a.step_order - b.step_order)
                              .map((step) => (
                                <li key={step.id} className="flex items-start justify-between gap-2 bg-white border border-slate-200 rounded p-2">
                                  <div className="flex gap-2 text-sm">
                                    <span className="font-semibold text-slate-500">{step.step_order}.</span>
                                    <div>
                                      <p className="text-slate-700">{step.instruction}</p>
                                      {step.media_url && (
                                        <p className="text-xs text-blue-500 break-all">{step.media_url}</p>
                                      )}
                                      {!step.requires_confirmation && (
                                        <p className="text-xs text-slate-400">No confirmation required</p>
                                      )}
                                    </div>
                                  </div>
                                  <button onClick={() => deleteStep(step.id)} className="text-xs text-red-500 hover:text-red-700 shrink-0">
                                    Delete
                                  </button>
                                </li>
                              ))}
                            {(!article.steps || article.steps.length === 0) && (
                              <p className="text-xs text-slate-400">No steps yet.</p>
                            )}
                          </ol>

                          <div className="border border-dashed border-slate-300 rounded-lg p-3 bg-white">
                            <p className="text-sm font-medium text-slate-600 mb-2">Add step</p>
                            <textarea
                              placeholder="Instruction"
                              className="w-full border border-slate-300 rounded p-2 text-sm mb-2"
                              rows={2}
                              value={newStep.instruction}
                              onChange={(e) => setNewStep({ ...newStep, instruction: e.target.value })}
                            />
                            <input
                              type="text"
                              placeholder="Media URL (optional)"
                              className="w-full border border-slate-300 rounded p-2 text-sm mb-2"
                              value={newStep.media_url}
                              onChange={(e) => setNewStep({ ...newStep, media_url: e.target.value })}
                            />
                            <label className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                              <input
                                type="checkbox"
                                checked={newStep.requires_confirmation}
                                onChange={(e) => setNewStep({ ...newStep, requires_confirmation: e.target.checked })}
                              />
                              Requires user confirmation
                            </label>
                            <button
                              onClick={() => createStep(article.id)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-1.5 rounded"
                            >
                              Add step
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {!adminArticlesLoading && adminArticles.length === 0 && (
                    <p className="text-xs text-slate-400">No articles yet.</p>
                  )}
                </div>

                <div className="border border-dashed border-slate-300 rounded-lg p-3">
                  <p className="text-sm font-medium text-slate-600 mb-2">Add article</p>
                  <input
                    type="text"
                    placeholder="Title"
                    className="w-full border border-slate-300 rounded p-2 text-sm mb-2"
                    value={newArticle.title}
                    onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                  />
                  <textarea
                    placeholder="Symptoms summary"
                    className="w-full border border-slate-300 rounded p-2 text-sm mb-2"
                    rows={2}
                    value={newArticle.symptoms_summary}
                    onChange={(e) => setNewArticle({ ...newArticle, symptoms_summary: e.target.value })}
                  />
                  <div className="flex items-center gap-2">
                    <select
                      className="border border-slate-300 rounded p-2 text-sm"
                      value={newArticle.status}
                      onChange={(e) => setNewArticle({ ...newArticle, status: e.target.value })}
                    >
                      <option value="draft">draft</option>
                      <option value="published">published</option>
                    </select>
                    <button onClick={createArticle} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-1.5 rounded">
                      Add article
                    </button>
                  </div>
                </div>
              </div>
            )}
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