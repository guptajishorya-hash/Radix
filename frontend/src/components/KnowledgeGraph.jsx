import React, { useState, useEffect, useRef } from 'react'

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

// 12 RADIX Skill nodes with architectural dependencies
const SKILL_NODES = [
  { id: 'DSA',   label: 'Data Structures & Alg', group: 'core',       x: 220, y: 160, desc: 'Trees, Graphs, DP, Complexity & Big-O' },
  { id: 'COD',   label: 'Coding & Languages',    group: 'core',       x: 380, y: 140, desc: 'Python, C++, Java, Clean Code & Syntax' },
  { id: 'OOD',   label: 'Object-Oriented Design', group: 'design',    x: 540, y: 150, desc: 'SOLID, Design Patterns, Modularity' },
  { id: 'APTI',  label: 'Analytical Aptitude',   group: 'foundational',x: 100, y: 220, desc: 'Quantitative Reasoning, Logic, Troubleshooting' },
  { id: 'COMM',  label: 'Communication & Collab',group: 'foundational',x: 740, y: 220, desc: 'Technical Documentation, Cross-team alignment' },
  { id: 'SWE',   label: 'Software Engineering',  group: 'engineering',x: 460, y: 260, desc: 'CI/CD, Git, Unit Testing, Agile, Code Reviews' },
  { id: 'SQL',   label: 'Database & SQL',        group: 'data',       x: 300, y: 280, desc: 'RDBMS, ACID, Indexing, Query Optimization' },
  { id: 'AI',    label: 'Artificial Intelligence',group: 'data',      x: 180, y: 380, desc: 'Machine Learning, PyTorch, Neural Nets, NLP' },
  { id: 'OS',    label: 'Operating Systems',     group: 'systems',    x: 290, y: 440, desc: 'Linux, Concurrency, Virtual Memory, POSIX' },
  { id: 'NETW',  label: 'Networking & Protocols',group: 'systems',    x: 440, y: 440, desc: 'TCP/IP, HTTP/3, WebSockets, DNS, Firewalls' },
  { id: 'SYSD',  label: 'System Design',         group: 'design',     x: 580, y: 340, desc: 'Scalability, Load Balancing, Microservices' },
  { id: 'CLOUD', label: 'Cloud & Infrastructure',group: 'engineering',x: 700, y: 360, desc: 'AWS, Azure, Docker, Kubernetes, Serverless' },
]

// Directed edges showing skill dependencies & synergy cascades
const SKILL_EDGES = [
  { from: 'APTI',  to: 'DSA',   strength: 'critical', desc: 'Logic underpins efficient algorithmic problem solving' },
  { from: 'DSA',   to: 'COD',   strength: 'critical', desc: 'Data structures translate to implementation' },
  { from: 'COD',   to: 'OOD',   strength: 'high',     desc: 'Language mastery enables modular object design' },
  { from: 'OOD',   to: 'SWE',   strength: 'high',     desc: 'Design patterns structure sustainable codebases' },
  { from: 'COMM',  to: 'SWE',   strength: 'moderate', desc: 'Team review and documentation processes' },
  { from: 'OOD',   to: 'SYSD',  strength: 'critical', desc: 'Object architecture scales to distributed system design' },
  { from: 'SQL',   to: 'SYSD',  strength: 'high',     desc: 'Data persistence and replication strategies' },
  { from: 'SQL',   to: 'AI',    strength: 'moderate', desc: 'Data wrangling & feature engineering pipelines' },
  { from: 'DSA',   to: 'AI',    strength: 'high',     desc: 'Mathematical optimization & graph representations' },
  { from: 'OS',    to: 'NETW',  strength: 'high',     desc: 'Socket I/O, event loops & kernel networking' },
  { from: 'OS',    to: 'SYSD',  strength: 'high',     desc: 'Concurrency, locks & memory bottlenecks' },
  { from: 'NETW',  to: 'SYSD',  strength: 'critical', desc: 'RPC, REST, latency & distributed consensus' },
  { from: 'SYSD',  to: 'CLOUD', strength: 'critical', desc: 'System blueprints execute on cloud infrastructure' },
  { from: 'SWE',   to: 'CLOUD', strength: 'high',     desc: 'Automated CI/CD pipelines & container deployment' },
]

// Role trajectory impacts
const COMPANY_IMPACT_MODELS = {
  'Google LLC': {
    targetRole: 'Senior Distributed SWE',
    weights: { DSA: 0.22, COD: 0.18, SYSD: 0.20, CLOUD: 0.12, OS: 0.10, OOD: 0.08, SWE: 0.05, NETW: 0.05 },
    minBar: 8.5,
  },
  'Microsoft Corporation': {
    targetRole: 'Azure Cloud & Platform SWE',
    weights: { CLOUD: 0.22, SWE: 0.18, COD: 0.16, SYSD: 0.15, OOD: 0.11, SQL: 0.08, COMM: 0.05, DSA: 0.05 },
    minBar: 8.0,
  },
  'Oracle Financial Services Software': {
    targetRole: 'Core Banking Architect',
    weights: { SQL: 0.25, SWE: 0.18, OOD: 0.16, SYSD: 0.14, OS: 0.10, APTI: 0.07, COD: 0.05, NETW: 0.05 },
    minBar: 7.8,
  },
}

export default function KnowledgeGraph({
  candidateSkills = [],
  companyBars = [],
  targetCompany = 'Google LLC',
  onLaunchMockScreen = null,
}) {
  const [selectedNode, setSelectedNode] = useState('CLOUD')
  const [simulatedLevel, setSimulatedLevel] = useState(null)
  const [hoveredNode, setHoveredNode] = useState(null)
  const [filterGroup, setFilterGroup] = useState('ALL')
  const [pulseAnim, setPulseAnim] = useState(0)

  // Continuous subtle pulse animation for SVG particles
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseAnim(p => (p + 1) % 100)
    }, 40)
    return () => clearInterval(interval)
  }, [])

  // Lookup helper for candidate level per skill
  const getCandidateLevel = (catCode) => {
    const s = candidateSkills.find(item => item.category_code === catCode)
    return s ? s.level : 5
  }

  // Lookup helper for required level per skill
  const getRequiredLevel = (catCode) => {
    const b = companyBars.find(item => item.category_code === catCode)
    return b ? b.required_level : 8
  }

  const selectedSkillData = SKILL_NODES.find(n => n.id === selectedNode) || SKILL_NODES[0]
  const currentLevel = getCandidateLevel(selectedNode)
  const requiredLevel = getRequiredLevel(selectedNode)
  const effectiveSimLevel = simulatedLevel !== null ? simulatedLevel : currentLevel

  // Calculate connected edges
  const connectedEdges = SKILL_EDGES.filter(
    e => e.from === selectedNode || e.to === selectedNode
  )
  const upstreamSkills = SKILL_EDGES.filter(e => e.to === selectedNode).map(e => e.from)
  const downstreamSkills = SKILL_EDGES.filter(e => e.from === selectedNode).map(e => e.to)

  // Compute live readiness projections across companies
  const computeProjectedScore = (compName) => {
    const model = COMPANY_IMPACT_MODELS[compName]
    if (!model) return 75

    let totalWeight = 0
    let weightedSum = 0

    Object.entries(model.weights).forEach(([cat, w]) => {
      totalWeight += w
      const lvl = cat === selectedNode ? effectiveSimLevel : getCandidateLevel(cat)
      weightedSum += (lvl / 10) * 100 * w
    })

    return Math.min(100, Math.round(weightedSum / (totalWeight || 1)))
  }

  const computeBaselineScore = (compName) => {
    const model = COMPANY_IMPACT_MODELS[compName]
    if (!model) return 70

    let totalWeight = 0
    let weightedSum = 0

    Object.entries(model.weights).forEach(([cat, w]) => {
      totalWeight += w
      const lvl = getCandidateLevel(cat)
      weightedSum += (lvl / 10) * 100 * w
    })

    return Math.min(100, Math.round(weightedSum / (totalWeight || 1)))
  }

  return (
    <div style={{
      background: '#ffffff', borderRadius: 20, border: '1px solid #e2e8f0',
      padding: '28px 32px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.06)',
      marginTop: 28,
    }}>
      {/* Title & Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              background: '#fef3c7', border: '1px solid #fde68a', color: '#b45309',
              padding: '3px 10px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              Neural Trajectory Visualizer
            </span>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Interactive 12-Node Dependency Topology
            </span>
          </div>
          <h3 style={{
            fontFamily: 'var(--font-heading)', fontSize: '1.45rem', fontWeight: 800,
            color: '#1e2530', margin: '6px 0 0', letterSpacing: '-0.02em',
          }}>
            12-Skillset Knowledge Graph & Career Cascade
          </h3>
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: 6, background: '#f8fafc', padding: 4, borderRadius: 10, border: '1px solid #e2e8f0' }}>
          {[
            { id: 'ALL', label: 'All 12 Nodes' },
            { id: 'systems', label: 'Systems & Cloud' },
            { id: 'core', label: 'Core & Algorithms' },
            { id: 'data', label: 'Data & AI' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterGroup(f.id)}
              style={{
                background: filterGroup === f.id ? '#ffffff' : 'transparent',
                border: filterGroup === f.id ? '1px solid #cbd5e1' : 'none',
                borderRadius: 7, padding: '5px 12px', fontSize: '0.75rem',
                fontWeight: filterGroup === f.id ? 700 : 500,
                color: filterGroup === f.id ? '#0f172a' : '#64748b',
                cursor: 'pointer', transition: 'all 0.15s ease',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0 0 22px', maxWidth: 760, lineHeight: 1.5 }}>
        Skills do not exist in isolation. Click any node below to trace its technical dependencies, see which downstream capabilities it unlocks, and interactively simulate how leveling up will cascade into higher readiness scores across top tech employers.
      </p>

      {/* Main Grid: Interactive SVG Graph + Detail Trajectory Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* Left: Interactive SVG Graph Canvas */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: 16, padding: '16px', position: 'relative', overflow: 'hidden',
          border: '1px solid #334155', minHeight: 490, display: 'flex', flexDirection: 'column',
        }}>
          {/* Legend Overlay */}
          <div style={{
            position: 'absolute', top: 14, left: 16, zIndex: 10,
            display: 'flex', gap: 14, fontSize: '0.72rem', color: '#94a3b8',
            background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)',
            padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: '#10b981' }} />
              Meets Bar (≥7)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: '#f59e0b' }} />
              Moderate (5-6)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: '#ef4444' }} />
              Skill Gap (&lt;5)
            </span>
          </div>

          <svg
            viewBox="0 0 840 520"
            style={{ width: '100%', height: '100%', flex: 1, cursor: 'default' }}
          >
            <defs>
              <linearGradient id="edgeGradActive" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
              <linearGradient id="edgeGradNormal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
              <filter id="glowEffect" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Render Edges */}
            {SKILL_EDGES.map((edge, i) => {
              const source = SKILL_NODES.find(n => n.id === edge.from)
              const target = SKILL_NODES.find(n => n.id === edge.to)
              if (!source || !target) return null

              const isConnected = edge.from === selectedNode || edge.to === selectedNode
              const strokeColor = isConnected ? '#f59e0b' : '#334155'
              const strokeWidth = isConnected ? 2.8 : 1.2
              const opacity = isConnected ? 1 : 0.35

              return (
                <g key={`edge-${i}`}>
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeOpacity={opacity}
                    strokeDasharray={isConnected ? '6 4' : 'none'}
                    strokeDashoffset={isConnected ? -pulseAnim : 0}
                  />
                  {/* Energy Particle on Active Edges */}
                  {isConnected && (
                    <circle
                      cx={source.x + (target.x - source.x) * ((pulseAnim % 100) / 100)}
                      cy={source.y + (target.y - source.y) * ((pulseAnim % 100) / 100)}
                      r={3}
                      fill="#fbbf24"
                    />
                  )}
                </g>
              )
            })}

            {/* Render Nodes */}
            {SKILL_NODES.map((node) => {
              const cLevel = getCandidateLevel(node.id)
              const rLevel = getRequiredLevel(node.id)
              const isSelected = selectedNode === node.id
              const isHovered = hoveredNode === node.id

              // Status colors
              let nodeColor = '#10b981' // green
              if (cLevel < 5) nodeColor = '#ef4444' // red
              else if (cLevel < 7) nodeColor = '#f59e0b' // yellow

              const matchesFilter = filterGroup === 'ALL' || node.group === filterGroup || (filterGroup === 'systems' && (node.group === 'systems' || node.group === 'engineering'))

              const radius = isSelected ? 24 : 19
              const opacity = matchesFilter ? 1 : 0.25

              return (
                <g
                  key={node.id}
                  onClick={() => { setSelectedNode(node.id); setSimulatedLevel(null) }}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ cursor: 'pointer', opacity, transition: 'all 0.2s ease' }}
                >
                  {/* Selected Glow Ring */}
                  {isSelected && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={radius + 8}
                      fill="none"
                      stroke="#df7a1a"
                      strokeWidth={2.5}
                      strokeDasharray="4 3"
                      filter="url(#glowEffect)"
                    />
                  )}

                  {/* Node Circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius}
                    fill="#1e293b"
                    stroke={nodeColor}
                    strokeWidth={isSelected ? 3.5 : 2}
                  />

                  {/* Level text inside node */}
                  <text
                    x={node.x}
                    y={node.y - 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#ffffff"
                    fontSize={isSelected ? "11" : "10"}
                    fontWeight="800"
                    fontFamily="Inter, sans-serif"
                  >
                    {node.id}
                  </text>

                  {/* Sub-label badge with candidate level */}
                  <rect
                    x={node.x - 14}
                    y={node.y + 11}
                    width={28}
                    height={13}
                    rx={4}
                    fill={nodeColor}
                  />
                  <text
                    x={node.x}
                    y={node.y + 18}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#ffffff"
                    fontSize="8"
                    fontWeight="900"
                  >
                    {cLevel}/10
                  </text>

                  {/* Label underneath */}
                  <text
                    x={node.x}
                    y={node.y + 36}
                    textAnchor="middle"
                    fill={isSelected ? "#fbbf24" : "#cbd5e1"}
                    fontSize="10"
                    fontWeight={isSelected ? "700" : "500"}
                  >
                    {node.label.length > 18 ? node.label.slice(0, 16) + '…' : node.label}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* Quick Footer inside Graph */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: '0.72rem', color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 8, marginTop: 'auto',
          }}>
            <span>💡 Click any node to open its career dependency cascade</span>
            <span style={{ color: '#df7a1a', fontWeight: 600 }}>Active Target: {targetCompany}</span>
          </div>
        </div>

        {/* Right: Predictive Trajectory & Impact Panel */}
        <div style={{
          background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0',
          padding: '24px', display: 'flex', flexDirection: 'column', gap: 18,
        }}>
          {/* Selected Node Header Card */}
          <div style={{
            background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0',
            padding: '16px 18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase',
                background: '#fff7ed', color: '#df7a1a', border: '1px solid #fed7aa',
                padding: '2px 8px', borderRadius: 6,
              }}>
                Category: {selectedSkillData.id}
              </span>
              <span style={{
                fontSize: '0.75rem', fontWeight: 700,
                color: effectiveSimLevel >= requiredLevel ? '#059669' : '#dc2626',
              }}>
                {effectiveSimLevel >= requiredLevel ? '● Meets Company Bar' : `● ${requiredLevel - effectiveSimLevel} Level Gap`}
              </span>
            </div>

            <h4 style={{ margin: '8px 0 4px', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              {selectedSkillData.label}
            </h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>
              {selectedSkillData.desc}
            </p>
          </div>

          {/* Interactive Trajectory Simulation Slider */}
          <div style={{
            background: '#ffffff', borderRadius: 14, border: '1px solid #fed7aa',
            padding: '16px 18px', boxShadow: '0 4px 12px rgba(223, 122, 26, 0.05)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="tune" size={16} style={{ color: '#df7a1a' }} />
                Simulate Candidate Upskilling:
              </label>
              <span style={{
                fontSize: '0.88rem', fontWeight: 900, color: '#df7a1a',
                background: '#fff7ed', padding: '2px 10px', borderRadius: 8,
              }}>
                Level {effectiveSimLevel} / 10
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="10"
              value={effectiveSimLevel}
              onChange={(e) => setSimulatedLevel(parseInt(e.target.value))}
              style={{
                width: '100%', accentColor: '#df7a1a', cursor: 'pointer',
                margin: '8px 0',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8' }}>
              <span>Current: Lvl {currentLevel}</span>
              <span>Target Bar: Lvl {requiredLevel}</span>
              <span>Mastery: Lvl 10</span>
            </div>
          </div>

          {/* Predictive Company Readiness Cascade */}
          <div style={{
            background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0',
            padding: '16px 18px',
          }}>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', color: '#0f172a', letterSpacing: '0.04em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="trending_up" size={16} style={{ color: '#059669' }} />
              Predicted Career Unlock Cascade:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(COMPANY_IMPACT_MODELS).map(([compName, model]) => {
                const baseline = computeBaselineScore(compName)
                const projected = computeProjectedScore(compName)
                const delta = projected - baseline
                const isTarget = targetCompany === compName

                return (
                  <div
                    key={compName}
                    style={{
                      padding: '10px 12px', borderRadius: 10,
                      background: isTarget ? '#f0fdf4' : '#f8fafc',
                      border: isTarget ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div>
                        <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>{compName}</strong>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Role: {model.targetRole}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 900, color: projected >= 80 ? '#059669' : '#d97706' }}>
                          {projected}%
                        </span>
                        {delta !== 0 && (
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: delta > 0 ? '#059669' : '#dc2626', marginLeft: 6 }}>
                            {delta > 0 ? `+${delta}%` : `${delta}%`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Mini progress track */}
                    <div style={{ width: '100%', height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        width: `${projected}%`, height: '100%',
                        background: projected >= 80 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #f59e0b, #d97706)',
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Upstream & Downstream Dependencies */}
          <div style={{
            background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0',
            padding: '14px 18px', fontSize: '0.8rem',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  Supported By (Upstream):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                  {upstreamSkills.length > 0 ? upstreamSkills.map(s => (
                    <span key={s} style={{ background: '#f1f5f9', color: '#334155', padding: '2px 6px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600 }}>
                      {s}
                    </span>
                  )) : <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Root Foundation</span>}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  Unlocks (Downstream):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                  {downstreamSkills.length > 0 ? downstreamSkills.map(s => (
                    <span key={s} style={{ background: '#fff7ed', color: '#c2410c', padding: '2px 6px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600 }}>
                      {s}
                    </span>
                  )) : <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Leaf Node</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Action Button: Directly Launch Mock Screen for this node */}
          {onLaunchMockScreen && (
            <button
              onClick={() => onLaunchMockScreen({
                category_code: selectedSkillData.id,
                category_label: selectedSkillData.label,
                required_level: requiredLevel,
                candidate_level: currentLevel,
                gap: currentLevel < requiredLevel,
              })}
              style={{
                background: 'linear-gradient(135deg, #f5a623 0%, #df7a1a 100%)',
                color: '#ffffff', border: 'none', borderRadius: 10,
                padding: '12px 18px', fontSize: '0.88rem', fontWeight: 800,
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
                justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 12px rgba(223, 122, 26, 0.3)',
              }}
            >
              <Icon name="record_voice_over" size={18} />
              Simulate Screen on {selectedSkillData.id} ({selectedSkillData.label.split(' ')[0]}) →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
