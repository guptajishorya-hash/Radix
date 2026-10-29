import React, { useState, useRef } from 'react'

const CATEGORY_CODES = [
  { code: 'DSA',   label: 'Data Structures & Algorithms', color: '#df7a1a', bg: '#fff7ed', border: '#fed7aa' },
  { code: 'COD',   label: 'Coding & Programming',         color: '#ea580c', bg: '#fff7ed', border: '#fdba74' },
  { code: 'OOD',   label: 'Object-Oriented Design',       color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { code: 'SYSD',  label: 'System Design',                color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { code: 'AI',    label: 'AI & Machine Learning',        color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
  { code: 'CLOUD', label: 'Cloud & Infrastructure',       color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
  { code: 'SQL',   label: 'SQL & Databases',              color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  { code: 'SWE',   label: 'Software Engineering',         color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe' },
  { code: 'OS',    label: 'Operating Systems',            color: '#475569', bg: '#f8fafc', border: '#cbd5e1' },
  { code: 'NETW',  label: 'Networking & Protocols',       color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  { code: 'APTI',  label: 'Aptitude & Problem Solving',   color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  { code: 'COMM',  label: 'Communication & Teamwork',     color: '#be185d', bg: '#fdf2f8', border: '#fbcfe8' },
  { code: 'OTHER', label: 'Other Technical Competency',   color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' },
]

const COMPANIES = [
  { name: 'Google LLC',                        tier: 'SWE & Data Scientist' },
  { name: 'Microsoft Corporation',             tier: 'SWE & Data Analyst' },
  { name: 'Oracle Financial Services Software', tier: 'Associate SWE & App Support' },
]

function Icon({ name, size = 18, style = {}, filled = false }) {
  return (
    <span
      className="material-symbols-rounded"
      style={{
        fontSize: size,
        fontVariationSettings: filled
          ? "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24"
          : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
        ...style,
      }}
    >
      {name}
    </span>
  )
}

const inputStyle = {
  width: '100%',
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: 10,
  padding: '11px 14px',
  color: '#1e2530',
  fontSize: '0.9rem',
  fontFamily: 'var(--font-body)',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
}

const labelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  marginBottom: 7,
  fontSize: '0.78rem',
  fontWeight: 600,
  color: '#475569',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
}

export default function ProfileBuilder({ profile, onChange, onSave, activeUser = 'Shorya Gupta' }) {
  const [newSkillName, setNewSkillName] = useState('')
  const [newSkillCat,  setNewSkillCat]  = useState('DSA')
  const [newSkillLvl,  setNewSkillLvl]  = useState(8)
  const [skillError,   setSkillError]   = useState('')
  const [skillSuccess, setSkillSuccess] = useState('')
  const [saved, setSaved]               = useState(false)
  const skillInputRef                   = useRef(null)

  const set = (key, val) => onChange({ ...profile, [key]: val })

  const addSkill = (customName, customCat, customLvl) => {
    const nameToAdd = (typeof customName === 'string' ? customName : newSkillName).trim()
    const catToAdd  = customCat || newSkillCat || 'COD'
    const lvlToAdd  = Math.max(1, Math.min(10, Number(customLvl !== undefined ? customLvl : newSkillLvl) || 8))

    if (!nameToAdd) {
      setSkillError('Please enter a skill name (or click a quick suggestion below).')
      if (skillInputRef.current) skillInputRef.current.focus()
      return
    }

    const currentSkills = Array.isArray(profile.skills) ? [...profile.skills] : []
    const existingIdx = currentSkills.findIndex(s => s.skill_name.toLowerCase() === nameToAdd.toLowerCase())

    if (existingIdx >= 0) {
      currentSkills[existingIdx] = {
        ...currentSkills[existingIdx],
        category_code: catToAdd,
        level: lvlToAdd,
      }
      setSkillSuccess(`Updated "${nameToAdd}" to Level ${lvlToAdd} [${catToAdd}]!`)
    } else {
      // Put at the beginning of the list so it is instantly visible at the top
      currentSkills.unshift({
        skill_name: nameToAdd,
        category_code: catToAdd,
        level: lvlToAdd,
      })
      setSkillSuccess(`Added "${nameToAdd}" (Level ${lvlToAdd}) to candidate profile!`)
    }

    onChange({ ...profile, skills: currentSkills })
    setNewSkillName('')
    setSkillError('')
    setTimeout(() => setSkillSuccess(''), 4500)
  }

  const removeSkill = (i) => {
    const current = Array.isArray(profile.skills) ? profile.skills : []
    onChange({ ...profile, skills: current.filter((_, idx) => idx !== i) })
  }

  const updateSkillLevel = (i, lvl) => {
    const current = Array.isArray(profile.skills) ? [...profile.skills] : []
    if (current[i]) {
      current[i] = { ...current[i], level: Math.max(1, Math.min(10, Number(lvl) || 1)) }
      onChange({ ...profile, skills: current })
    }
  }

  const handleSave = () => {
    if (!profile.name || !profile.name.trim()) {
      alert('Please enter candidate name.')
      return
    }
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onSave()
    }, 400)
  }

  const getCatMeta = (code) => {
    return CATEGORY_CODES.find(c => c.code === code) || CATEGORY_CODES[0]
  }

  const safeProfile = profile || {}
  const safeSkills  = Array.isArray(safeProfile.skills) ? safeProfile.skills : []

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 'var(--radius)',
      border: '1px solid #e5e7eb',
      padding: 36,
      boxShadow: 'var(--shadow)',
      animation: 'slideUp 0.4s ease',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44,
              borderRadius: 12,
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="badge" size={24} style={{ color: '#df7a1a' }} filled />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: '#1e2530',
                }}>
                  Step 3 — Candidate Profile (Role 3)
                </h2>
                <span style={{
                  padding: '3px 12px',
                  borderRadius: 20,
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  background: '#fff7ed',
                  color: '#df7a1a',
                  border: '1px solid #fed7aa',
                  letterSpacing: '0.03em',
                }}>
                  12 RADIX Categories
                </span>
              </div>
            </div>
          </div>

          {/* Active Evaluator Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: '0.78rem',
            color: '#475569',
          }}>
            <Icon name="account_circle" size={18} style={{ color: '#df7a1a' }} />
            <span>Evaluator: <strong>{activeUser}</strong></span>
          </div>
        </div>

        <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6 }}>
          Calibrate <strong>{profile.name || 'candidate'}</strong>'s profile across the 12 RADIX skill categories. Target benchmark: <strong>{profile.company}</strong>.
        </p>
      </div>

      {/* ── Basic Info Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 18,
        marginBottom: 24,
      }}>
        <div>
          <label style={labelStyle}>
            <Icon name="person" size={16} style={{ color: '#df7a1a' }} />
            Candidate Full Name *
          </label>
          <input
            style={inputStyle}
            value={safeProfile.name || ''}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. Ananya Rao"
          />
        </div>

        <div>
          <label style={labelStyle}>
            <Icon name="mail" size={16} style={{ color: '#df7a1a' }} />
            Email Address
          </label>
          <input
            style={inputStyle}
            type="email"
            value={safeProfile.email || ''}
            onChange={e => set('email', e.target.value)}
            placeholder="ananya@example.com"
          />
        </div>

        <div>
          <label style={labelStyle}>
            <Icon name="corporate_fare" size={16} style={{ color: '#df7a1a' }} />
            Target Benchmark Company
          </label>
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={safeProfile.company || 'Google LLC'}
            onChange={e => set('company', e.target.value)}
          >
            {COMPANIES.map(c => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.tier})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Education & Preferred Roles (Brief Page 10 Contract) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 18,
        marginBottom: 24,
      }}>
        <div>
          <label style={labelStyle}>
            <Icon name="school" size={16} style={{ color: '#df7a1a' }} />
            Education & Degree
          </label>
          <input
            style={inputStyle}
            value={safeProfile.education || ''}
            onChange={e => set('education', e.target.value)}
            placeholder="e.g. B.Tech Computer Science & Engineering"
          />
        </div>

        <div>
          <label style={labelStyle}>
            <Icon name="work_outline" size={16} style={{ color: '#df7a1a' }} />
            Preferred Roles / Certifications
          </label>
          <input
            style={inputStyle}
            value={Array.isArray(safeProfile.preferred_roles) ? safeProfile.preferred_roles.join(', ') : (safeProfile.preferred_roles || '')}
            onChange={e => set('preferred_roles', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            placeholder="e.g. Software Engineer, Systems Architect, AWS Certified"
          />
        </div>
      </div>

      {/* ── Skills Section (12 RADIX Categories) ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>
            <Icon name="psychology" size={16} style={{ color: '#df7a1a' }} />
            Candidate Skill Inventory ({safeSkills.length})
          </label>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Proficiency Levels rated on a 1 – 10 scale
          </span>
        </div>

        {safeSkills.length === 0 ? (
          <div style={{
            background: '#fafaf9',
            borderRadius: 'var(--radius-sm)',
            padding: 32,
            textAlign: 'center',
            border: '1px dashed #cbd5e1',
          }}>
            <Icon name="post_add" size={36} style={{ color: '#94a3b8', marginBottom: 8 }} />
            <p style={{ color: '#475569', fontWeight: 600, fontSize: '0.92rem' }}>
              No skills added yet
            </p>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: 4 }}>
              Add skills below manually or load a candidate resume in Step 2.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            maxHeight: 380,
            overflowY: 'auto',
            paddingRight: 4,
          }}>
            {safeSkills.map((s, i) => {
              const meta = getCatMeta(s.category_code)
              return (
                <div
                  key={i}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: '12px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Category Pill */}
                  <span style={{
                    background: meta.bg,
                    border: `1px solid ${meta.border}`,
                    color: meta.color,
                    padding: '4px 10px',
                    borderRadius: 20,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    minWidth: 64,
                    textAlign: 'center',
                  }}>
                    {s.category_code || 'COD'}
                  </span>

                  {/* Skill Name */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#1e2530' }}>
                      {s.skill_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {meta.label}
                    </div>
                  </div>

                  {/* Slider Control */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={s.level}
                      onChange={e => updateSkillLevel(i, e.target.value)}
                      style={{
                        width: 110,
                        accentColor: '#df7a1a',
                        cursor: 'pointer',
                      }}
                    />
                    <span style={{
                      background: '#fff7ed',
                      color: '#df7a1a',
                      border: '1px solid #fed7aa',
                      borderRadius: 8,
                      padding: '2px 8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      minWidth: 46,
                      textAlign: 'center',
                    }}>
                      Lvl {s.level}
                    </span>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeSkill(i)}
                    title="Remove skill"
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fee2e2',
                      borderRadius: 8,
                      color: '#ef4444',
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Icon name="delete" size={16} style={{ color: '#ef4444' }} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Add Skill Inline Form ── */}
      <div style={{
        background: '#fcfbf9',
        border: '1px solid #fed7aa',
        borderRadius: 'var(--radius-sm)',
        padding: '18px 20px',
        marginBottom: 28,
      }}>
        <div style={{
          fontSize: '0.82rem',
          fontWeight: 700,
          color: '#1e2530',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <Icon name="add_circle" size={18} style={{ color: '#df7a1a' }} filled />
          Add Skill to Profile (12 RADIX Categories)
        </div>

        {/* Feedback Alerts */}
        {skillError && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
            borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem', marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Icon name="error" size={16} />
            {skillError}
          </div>
        )}

        {skillSuccess && (
          <div style={{
            background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669',
            borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem', marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Icon name="check_circle" size={16} />
            {skillSuccess}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1.8fr 90px auto',
          gap: 12,
          alignItems: 'end',
        }}>
          <div>
            <label style={{ ...labelStyle, fontSize: '0.72rem' }}>Skill Name</label>
            <input
              ref={skillInputRef}
              style={{
                ...inputStyle,
                borderColor: skillError ? '#ef4444' : '#cbd5e1',
              }}
              value={newSkillName}
              onChange={e => {
                setNewSkillName(e.target.value)
                if (skillError) setSkillError('')
              }}
              placeholder="e.g. Dynamic Programming, Docker, SQL"
              onKeyDown={e => e.key === 'Enter' && addSkill()}
            />
          </div>

          <div>
            <label style={{ ...labelStyle, fontSize: '0.72rem' }}>RADIX Category</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={newSkillCat}
              onChange={e => setNewSkillCat(e.target.value)}
            >
              {CATEGORY_CODES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ ...labelStyle, fontSize: '0.72rem' }}>Proficiency</label>
            <input
              style={{ ...inputStyle, textAlign: 'center', fontWeight: 600 }}
              type="number"
              min={1}
              max={10}
              value={newSkillLvl}
              onChange={e => setNewSkillLvl(e.target.value)}
            />
          </div>

          <button
            onClick={() => addSkill()}
            type="button"
            style={{
              padding: '11px 22px',
              background: 'linear-gradient(135deg, #f5a623 0%, #df7a1a 100%)',
              border: 'none',
              borderRadius: 10,
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 3px 10px rgba(223,122,26,0.25)',
              whiteSpace: 'nowrap',
            }}
          >
            <Icon name="add" size={18} />
            Add Skill
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
            Quick 1-Click Add:
          </span>
          {[
            { name: 'Docker Containers', cat: 'CLOUD', lvl: 8 },
            { name: 'Kubernetes Orchestration', cat: 'CLOUD', lvl: 8 },
            { name: 'PostgreSQL Relational DB', cat: 'SQL', lvl: 8 },
            { name: 'Distributed System Architecture', cat: 'SYSD', lvl: 8 },
            { name: 'Redis In-Memory Caching', cat: 'SYSD', lvl: 8 },
            { name: 'Dynamic Programming & Graphs', cat: 'DSA', lvl: 9 },
            { name: 'PyTorch Deep Learning', cat: 'AI', lvl: 8 },
            { name: 'CI/CD Pipelines & Testing', cat: 'SWE', lvl: 8 },
          ].map((pill, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => addSkill(pill.name, pill.cat, pill.lvl)}
              style={{
                background: '#ffffff', border: '1px solid #fed7aa', borderRadius: 14,
                padding: '3px 9px', fontSize: '0.72rem', color: '#b45309', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s ease',
              }}
              title={`Add ${pill.name} (${pill.cat}) Level ${pill.lvl}`}
            >
              +{pill.name} <span style={{ color: '#df7a1a', fontSize: '0.66rem' }}>[{pill.cat}]</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Save Action ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 }}>
        <div style={{ color: '#64748b', fontSize: '0.84rem' }}>
          <strong>{safeSkills.length}</strong> skills calibrated for <strong>{safeProfile.company || 'Google LLC'}</strong> benchmark
        </div>

        <button
          onClick={handleSave}
          style={{
            padding: '12px 34px',
            background: saved
              ? 'linear-gradient(135deg, #059669, #10b981)'
              : 'linear-gradient(135deg, #f5a623 0%, #df7a1a 100%)',
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.95rem',
            fontFamily: 'var(--font-heading)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(223,122,26,0.3)',
            transition: 'all 0.25s ease',
          }}
        >
          <Icon name={saved ? "check_circle" : "check"} size={20} filled />
          {saved ? 'Saved! Advancing to Talent Check...' : 'Save Profile & Continue'}
        </button>
      </div>
    </div>
  )
}
