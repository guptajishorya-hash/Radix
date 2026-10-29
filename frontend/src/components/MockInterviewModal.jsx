import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '')
const API = axios.create({ baseURL: API_BASE_URL })

function Icon({ name, size = 18, style = {} }) {
  return (
    <span
      className="material-symbols-rounded"
      style={{
        fontSize: size,
        lineHeight: 1,
        verticalAlign: 'middle',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {name}
    </span>
  )
}

export default function MockInterviewModal({
  isOpen,
  onClose,
  company = 'Google LLC',
  candidateName = 'Candidate',
  role = 'Software Engineer',
  skillGaps = [],
  highlightGap = null,
}) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [answer, setAnswer] = useState('')
  const [grading, setGrading] = useState(false)
  const [gradeResult, setGradeResult] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [history, setHistory] = useState([]) // completed Q&A pairs
  const [usedIndices, setUsedIndices] = useState({})
  const [sessionFinished, setSessionFinished] = useState(false)

  const recognitionRef = useRef(null)
  const chatBottomRef = useRef(null)

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setVoiceSupported(true)
      const rec = new SpeechRecognition()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = 'en-US'

      rec.onresult = (event) => {
        let transcript = ''
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' '
        }
        setAnswer(transcript)
      }

      rec.onerror = (e) => {
        console.warn('Speech recognition error:', e.error)
        setIsListening(false)
      }

      rec.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = rec
    }
  }, [])

  // Start interview session when modal opens
  useEffect(() => {
    if (isOpen) {
      startInterview()
    } else {
      cleanup()
    }
  }, [isOpen, company])

  const cleanup = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setSession(null)
    setGradeResult(null)
    setAnswer('')
    setHistory([])
    setUsedIndices({})
    setSessionFinished(false)
    setIsListening(false)
    setIsSpeaking(false)
  }

  const startInterview = async () => {
    setLoading(true)
    setError('')
    setGradeResult(null)
    setAnswer('')
    setHistory([])
    setSessionFinished(false)

    // Build gap list: prioritize highlightGap if passed
    let gapsToUse = skillGaps && skillGaps.length > 0 ? [...skillGaps] : []
    if (highlightGap) {
      gapsToUse = [highlightGap, ...gapsToUse.filter(g => g.category_code !== highlightGap.category_code)]
    }
    if (gapsToUse.length === 0) {
      gapsToUse = [
        { category_code: 'OOD', category_label: 'Object-Oriented Design', required_level: 8, candidate_level: 5, gap: true },
        { category_code: 'SYSD', category_label: 'System Design', required_level: 9, candidate_level: 6, gap: true },
        { category_code: 'DSA', category_label: 'Data Structures & Algorithms', required_level: 9, candidate_level: 7, gap: true },
      ]
    }

    try {
      const res = await API.post('/mock-interview/start', {
        company,
        candidate_name: candidateName,
        role,
        skill_gaps: gapsToUse,
      })
      setSession(res.data)
      const cat = res.data.question.category_code
      const idx = res.data.question.index
      setUsedIndices({ [cat]: [idx] })

      // Auto-speak greeting and first question if speech synthesis is available
      speakText(`${res.data.persona.greeting} First question: ${res.data.question.text}`)
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Failed to start interview')
    } finally {
      setLoading(false)
    }
  }

  const toggleMic = () => {
    if (!recognitionRef.current) return
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (e) {
        console.warn('Mic start failed:', e)
      }
    }
  }

  const speakText = (text) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !session) return
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
    stopSpeaking()

    setGrading(true)
    setError('')

    try {
      const res = await API.post('/mock-interview/grade', {
        session_id: session.session_id,
        question: session.question.text,
        category_code: session.question.category_code,
        company: session.company,
        candidate_answer: answer,
        history,
      })

      setGradeResult(res.data)
      const completedQA = {
        question: session.question,
        answer,
        grade: res.data,
      }
      setHistory(prev => [...prev, completedQA])

      // Speak feedback
      speakText(`Score: ${res.data.score} out of 5. ${res.data.feedback}`)

      // Scroll to bottom
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Failed to grade answer')
    } finally {
      setGrading(false)
    }
  }

  const handleNextQuestion = async () => {
    if (!session) return
    stopSpeaking()
    setGradeResult(null)
    setAnswer('')

    const nextQNum = session.question_number + 1
    if (nextQNum > 3) {
      setSessionFinished(true)
      return
    }

    setLoading(true)
    try {
      const res = await API.post('/mock-interview/next-question', {
        session_id: session.session_id,
        company: session.company,
        skill_gaps: session.session_gaps || [],
        used_categories: Object.keys(usedIndices),
        used_indices: usedIndices,
        question_number: nextQNum,
      })

      const newQ = res.data.question
      const cat = newQ.category_code
      const idx = newQ.index
      setUsedIndices(prev => ({
        ...prev,
        [cat]: [...(prev[cat] || []), idx],
      }))

      setSession(prev => ({
        ...prev,
        question_number: nextQNum,
        question: newQ,
      }))

      speakText(newQ.text)
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Failed to load next question')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  // Calculate final score average if finished
  const avgScore = history.length > 0
    ? (history.reduce((sum, h) => sum + (h.grade?.score || 3), 0) / history.length).toFixed(1)
    : 0

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#ffffff', borderRadius: 20,
        width: '100%', maxWidth: 860, maxHeight: '92vh',
        boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', border: '1px solid #e2e8f0',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff', padding: '20px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'linear-gradient(135deg, #f5a623 0%, #df7a1a 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(223, 122, 26, 0.4)',
            }}>
              <Icon name="record_voice_over" size={26} style={{ color: '#ffffff' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
                  Live Mock Interview Simulator
                </h3>
                <span style={{
                  background: 'rgba(245, 166, 35, 0.2)', border: '1px solid #df7a1a',
                  color: '#fbbf24', fontSize: '0.68rem', fontWeight: 700,
                  padding: '2px 8px', borderRadius: 12, textTransform: 'uppercase',
                }}>
                  Interactive Role 6
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                Simulating strict technical screening at <strong style={{ color: '#f8fafc' }}>{company}</strong> for {candidateName}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444',
                  color: '#f87171', padding: '6px 12px', borderRadius: 8,
                  fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}
              >
                <Icon name="volume_off" size={14} /> Stop Voice
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.08)', border: 'none',
                color: '#cbd5e1', width: 36, height: 36, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.15s ease',
              }}
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
          {loading && !session && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Icon name="progress_activity" size={40} style={{ color: '#df7a1a', animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: 14, fontWeight: 600, color: '#334155' }}>
                Connecting to {company} Engineering Persona…
              </p>
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Targeting identified skill gaps from Role 4 & Role 5
              </p>
            </div>
          )}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 14, color: '#dc2626', fontSize: '0.88rem', marginBottom: 18 }}>
              ⚠️ {error}
            </div>
          )}

          {session && !sessionFinished && (
            <div>
              {/* Persona Profile Card */}
              <div style={{
                background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0',
                padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', gap: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 22,
                    background: '#e0f2fe', color: '#0369a1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '1rem',
                  }}>
                    {session.persona.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                      {session.persona.name}
                      <span style={{ fontSize: '0.72rem', color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: 10, marginLeft: 8, fontWeight: 600 }}>
                        ● Active Interviewer
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {session.persona.title}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700,
                    background: '#fef3c7', color: '#92400e',
                    padding: '4px 10px', borderRadius: 8, display: 'inline-block',
                  }}>
                    Targeting Gap: {session.question.category_code}
                  </span>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 3 }}>
                    Question {session.question_number} of 3
                  </div>
                </div>
              </div>

              {/* Greeting Bubble */}
              <div style={{
                background: '#f1f5f9', borderRadius: '16px 16px 16px 4px',
                padding: '14px 18px', marginBottom: 16, border: '1px solid #e2e8f0',
                fontSize: '0.88rem', color: '#334155', fontStyle: 'italic',
              }}>
                "{session.persona.greeting}"
              </div>

              {/* Active Question Card */}
              <div style={{
                background: '#ffffff', borderRadius: 16,
                border: '2px solid #fed7aa', padding: '20px 24px',
                marginBottom: 20, boxShadow: '0 4px 12px rgba(223, 122, 26, 0.08)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase',
                    letterSpacing: '0.05em', color: '#df7a1a',
                  }}>
                    Architectural Screening Question #{session.question_number}
                  </span>
                  <button
                    onClick={() => speakText(session.question.text)}
                    style={{
                      background: 'none', border: 'none', color: '#df7a1a',
                      cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    <Icon name="volume_up" size={16} /> Listen Aloud
                  </button>
                </div>

                <p style={{
                  fontSize: '1.05rem', fontWeight: 600, color: '#0f172a',
                  lineHeight: 1.5, margin: '8px 0 12px',
                }}>
                  {session.question.text}
                </p>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', background: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5', padding: '3px 10px', borderRadius: 12, fontWeight: 600 }}>
                    Topic: {session.question.topic}
                  </span>
                  <span style={{ fontSize: '0.72rem', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', padding: '3px 10px', borderRadius: 12 }}>
                    Category: {session.question.category_label} [{session.question.category_code}]
                  </span>
                </div>
              </div>

              {/* Previous Completed Q&As */}
              {history.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>
                    Completed Responses ({history.length}):
                  </div>
                  {history.map((h, i) => (
                    <div key={i} style={{
                      background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0',
                      padding: 14, marginBottom: 10, fontSize: '0.84rem',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <strong style={{ color: '#0f172a' }}>Q{i + 1}: {h.question.topic}</strong>
                        <span style={{
                          fontWeight: 700, fontSize: '0.8rem',
                          color: h.grade.score >= 4 ? '#059669' : h.grade.score >= 3 ? '#d97706' : '#dc2626',
                          background: h.grade.score >= 4 ? '#ecfdf5' : h.grade.score >= 3 ? '#fef3c7' : '#fef2f2',
                          padding: '2px 8px', borderRadius: 6,
                        }}>
                          {h.grade.score_label} ({h.grade.score}/5)
                        </span>
                      </div>
                      <p style={{ color: '#475569', margin: '4px 0', fontSize: '0.8rem' }}>
                        "{h.answer.slice(0, 120)}…"
                      </p>
                      <div style={{ fontSize: '0.78rem', color: '#0369a1', background: '#f0f9ff', padding: '6px 10px', borderRadius: 6, marginTop: 6 }}>
                        💬 <em>{h.grade.feedback}</em>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Candidate Response Form (only shown if not yet graded for current Q) */}
              {!gradeResult ? (
                <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon name="edit_note" size={18} style={{ color: '#df7a1a' }} />
                      Your Architectural Answer:
                    </label>

                    {voiceSupported && (
                      <button
                        onClick={toggleMic}
                        type="button"
                        style={{
                          background: isListening ? '#ef4444' : '#f8fafc',
                          border: isListening ? 'none' : '1px solid #cbd5e1',
                          color: isListening ? '#ffffff' : '#475569',
                          padding: '6px 14px', borderRadius: 20,
                          fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          animation: isListening ? 'pulse 1.5s infinite' : 'none',
                        }}
                      >
                        <Icon name={isListening ? "mic" : "mic_none"} size={16} />
                        {isListening ? 'Listening (Speak Now)…' : 'Voice Input (Mic)'}
                      </button>
                    )}
                  </div>

                  <textarea
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    rows={5}
                    placeholder="Type your design solution, architectural trade-offs, time/space complexity, or click 'Voice Input' to speak your answer aloud..."
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      borderRadius: 10, border: '1px solid #cbd5e1',
                      padding: 14, fontSize: '0.92rem', fontFamily: 'inherit',
                      lineHeight: 1.5, resize: 'vertical', outline: 'none',
                    }}
                  />

                  {/* Quick-insert technical terms */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Quick Insert:</span>
                    {['O(log N)', 'SOLID Principles', 'Horizontal Scaling', 'Event-Driven', 'CAP Theorem', 'ACID Compliance'].map((term, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setAnswer(prev => prev + (prev.length ? ' ' : '') + term)}
                        style={{
                          background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6,
                          padding: '2px 8px', fontSize: '0.7rem', color: '#475569', cursor: 'pointer',
                        }}
                      >
                        +{term}
                      </button>
                    ))}
                  </div>

                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {answer.split(/\s+/).filter(Boolean).length} words
                    </span>

                    <button
                      onClick={handleSubmitAnswer}
                      disabled={!answer.trim() || grading}
                      style={{
                        background: (!answer.trim() || grading) ? '#cbd5e1' : 'linear-gradient(135deg, #f5a623 0%, #df7a1a 100%)',
                        color: '#ffffff', border: 'none', borderRadius: 10,
                        padding: '12px 28px', fontSize: '0.92rem', fontWeight: 700,
                        cursor: (!answer.trim() || grading) ? 'not-allowed' : 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        boxShadow: answer.trim() ? '0 4px 12px rgba(223, 122, 26, 0.3)' : 'none',
                      }}
                    >
                      <Icon name={grading ? "progress_activity" : "grade"} size={18} />
                      {grading ? 'Grading on 5-Point Scale…' : 'Submit for Live Grading →'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Live Grade Result Card */
                <div style={{
                  background: '#ffffff', borderRadius: 16,
                  border: '2px solid #a7f3d0', padding: 24,
                  boxShadow: '0 8px 24px rgba(5, 150, 105, 0.1)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#059669', letterSpacing: '0.04em' }}>
                        Live Evaluation Result
                      </span>
                      <h4 style={{ margin: '4px 0 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                        {gradeResult.score_label} ({gradeResult.score} / 5.0)
                      </h4>
                    </div>

                    <div style={{
                      display: 'flex', gap: 4, padding: '8px 14px', borderRadius: 12,
                      background: '#ecfdf5', border: '1px solid #a7f3d0',
                    }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Icon
                          key={star}
                          name={star <= gradeResult.score ? "star" : "star_outline"}
                          size={20}
                          style={{ color: star <= gradeResult.score ? '#f59e0b' : '#cbd5e1' }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Rubric */}
                  <div style={{ background: '#f8fafc', borderRadius: 10, padding: 12, fontSize: '0.82rem', color: '#475569', marginBottom: 14 }}>
                    <strong>Rubric:</strong> {gradeResult.rubric}
                  </div>

                  {/* Manager Feedback */}
                  <div style={{
                    background: '#f0fdf4', border: '1px solid #bbf7d0',
                    borderRadius: 12, padding: 14, marginBottom: 12,
                  }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#166534', marginBottom: 4 }}>
                      👨‍💼 Feedback from {session.persona.name}:
                    </div>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#15803d', lineHeight: 1.5 }}>
                      "{gradeResult.feedback}"
                    </p>
                  </div>

                  {/* Improvement Tip */}
                  <div style={{
                    background: '#fffbeb', border: '1px solid #fef3c7',
                    borderRadius: 12, padding: 14, marginBottom: 18,
                  }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#92400e', marginBottom: 4 }}>
                      💡 Actionable Improvement Tip:
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#78350f', lineHeight: 1.5 }}>
                      {gradeResult.improvement_tip}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button
                      onClick={handleNextQuestion}
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#ffffff', border: 'none', borderRadius: 10,
                        padding: '12px 24px', fontSize: '0.92rem', fontWeight: 700,
                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
                        boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
                      }}
                    >
                      {session.question_number < 3 ? 'Proceed to Next Gap Question →' : 'Complete Screening & View Report →'}
                    </button>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>
          )}

          {/* Session Finished Summary Screen */}
          {sessionFinished && (
            <div style={{ textAlign: 'center', padding: '30px 20px' }}>
              <div style={{
                width: 72, height: 72, borderRadius: 36,
                background: avgScore >= 4 ? '#ecfdf5' : '#fef3c7',
                color: avgScore >= 4 ? '#059669' : '#d97706',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16, border: `2px solid ${avgScore >= 4 ? '#a7f3d0' : '#fde68a'}`,
              }}>
                <Icon name={avgScore >= 4 ? "workspace_premium" : "trending_up"} size={40} />
              </div>

              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                Technical Screening Complete!
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.92rem', maxWidth: 480, margin: '0 auto 24px' }}>
                You completed the adaptive architectural screening with {session?.persona?.name} at {company}.
              </p>

              {/* Overall Score Card */}
              <div style={{
                maxWidth: 420, margin: '0 auto 28px',
                background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0',
                padding: 24, boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
              }}>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                  Overall Interview Readiness
                </div>
                <div style={{ fontSize: '2.8rem', fontWeight: 900, color: avgScore >= 4 ? '#059669' : '#d97706', margin: '6px 0' }}>
                  {avgScore} <span style={{ fontSize: '1.2rem', color: '#94a3b8', fontWeight: 500 }}>/ 5.0</span>
                </div>
                <div style={{
                  display: 'inline-block',
                  background: avgScore >= 4 ? '#ecfdf5' : '#fef3c7',
                  color: avgScore >= 4 ? '#059669' : '#d97706',
                  fontSize: '0.85rem', fontWeight: 700,
                  padding: '4px 14px', borderRadius: 20,
                }}>
                  {avgScore >= 4.5 ? '🏆 Strong Hire Recommendation'
                    : avgScore >= 3.8 ? '✅ Leaning Hire — Clear Fundamentals'
                    : avgScore >= 3.0 ? '⚠️ Mixed Signal — Further Depth Required'
                    : '🔴 No Hire — Address Skill Gaps First'}
                </div>
              </div>

              {/* Breakdown of completed Q&As */}
              <div style={{ maxWidth: 640, margin: '0 auto 24px', textAlign: 'left' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: 10 }}>
                  Question Performance Breakdown:
                </div>
                {history.map((h, i) => (
                  <div key={i} style={{
                    background: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0',
                    padding: '12px 16px', marginBottom: 8, display: 'flex',
                    alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0f172a' }}>
                        Q{i + 1}: {h.question.topic} [{h.question.category_code}]
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                        {h.grade.feedback.slice(0, 80)}…
                      </div>
                    </div>
                    <div style={{
                      fontWeight: 800, fontSize: '0.95rem',
                      color: h.grade.score >= 4 ? '#059669' : h.grade.score >= 3 ? '#d97706' : '#dc2626',
                    }}>
                      {h.grade.score} / 5
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
                <button
                  onClick={startInterview}
                  style={{
                    background: '#ffffff', border: '1px solid #cbd5e1',
                    borderRadius: 10, padding: '12px 24px', fontSize: '0.92rem',
                    fontWeight: 600, color: '#334155', cursor: 'pointer',
                  }}
                >
                  Restart Screening
                </button>
                <button
                  onClick={onClose}
                  style={{
                    background: 'linear-gradient(135deg, #f5a623 0%, #df7a1a 100%)',
                    color: '#ffffff', border: 'none', borderRadius: 10,
                    padding: '12px 28px', fontSize: '0.92rem', fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
