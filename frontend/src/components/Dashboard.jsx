import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import ProfileBuilder from './ProfileBuilder.jsx'
import MockInterviewModal from './MockInterviewModal.jsx'
import KnowledgeGraph from './KnowledgeGraph.jsx'

// ── API Configuration (Supports local dev & Vercel deployment) ──────────────
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '')
const API = axios.create({ baseURL: API_BASE_URL })

// ── 5 PIPELINE STEPS ─────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Upload JD',    role: 'Role 1', desc: 'JD Analytics',       icon: 'description' },
  { id: 2, label: 'Parse Resume', role: 'Role 2', desc: 'Resume Intelligence', icon: 'person_search' },
  { id: 3, label: 'Edit Profile', role: 'Role 3', desc: 'Profile Builder',     icon: 'edit_note' },
  { id: 4, label: 'Talent Check', role: 'Role 4', desc: 'Company Benchmark',   icon: 'leaderboard' },
  { id: 5, label: 'Skill Match',  role: 'Role 5', desc: 'Gap Analysis',        icon: 'hub' },
]

// ── Official Sample JDs (Brief Page 11) ──────────────────────────────────────
const OFFICIAL_JDS = [
  {
    id: 'google_swe',
    company: 'Google LLC',
    role: 'Software Engineer (SWE)',
    location: 'Bengaluru, India (Hybrid)',
    text: `Job Title: Software Engineer (SWE)\nCompany: Google LLC\nLocation: Bengaluru, India (Hybrid)\n\nAbout the Role:\nGoogle's software engineers develop next-generation technologies that change how billions of users connect, explore, and interact with information.\n\nKey Responsibilities:\n- Design, develop, test, deploy, maintain, and enhance large-scale distributed software applications.\n- Implement complex Data Structures & Algorithms (DSA) and dynamic programming.\n- Apply robust Object-Oriented Design (OOD) across microservices architecture.\n- Optimize System Design (SYSD), high availability, caching, and concurrency.\n- Manage Linux Operating Systems (OS) internals, memory management, and process execution.\n- Utilize Cloud infrastructure (GCP), Networking (TCP/IP, RPC, HTTP), and SQL relational databases.\n- Practice rigorous Software Engineering (SWE): code reviews, unit testing, and CI/CD pipelines.`
  },
  {
    id: 'google_ds',
    company: 'Google LLC',
    role: 'Data Scientist',
    location: 'Bengaluru, India',
    text: `Job Title: Data Scientist\nCompany: Google LLC\nLocation: Bengaluru, India\n\nAbout the Role:\nAt Google, data scientists work on consumer behavior modelling, automated data pipelines, and state-of-the-art machine learning algorithms.\n\nKey Responsibilities:\n- Build, train, and deploy advanced Artificial Intelligence (AI) and Machine Learning models using PyTorch.\n- Write optimized SQL queries and ETL pipelines across petabyte-scale data warehouses.\n- Apply statistical analysis, quantitative aptitude (APTI), and mathematical reasoning.\n- Utilize Python (Coding) and Cloud computing (GCP) for distributed training.\n- Deliver executive data presentations with strong cross-functional communication (COMM).`
  },
  {
    id: 'ms_swe',
    company: 'Microsoft Corporation',
    role: 'Software Engineer',
    location: 'Hyderabad, India',
    text: `Job Title: Software Engineer\nCompany: Microsoft Corporation\nLocation: Hyderabad, India\n\nAbout the Role:\nMicrosoft Azure engineering teams are building resilient cloud infrastructure and developer-facing services.\n\nKey Responsibilities:\n- Architect, build, and deploy high-availability enterprise services using modern Cloud platforms (Azure).\n- Champion rigorous Software Engineering (SWE) practices: CI/CD automation, testing, and agile sprints.\n- Implement Object-Oriented Design (OOD) patterns, clean interfaces, and scalable REST/gRPC APIs.\n- Apply Data Structures and Algorithms (DSA) and Coding in C#, Java, or Python.\n- Optimize SQL database transactions and distributed storage systems.`
  },
  {
    id: 'ms_da',
    company: 'Microsoft Corporation',
    role: 'Data Analyst',
    location: 'Hyderabad, India',
    text: `Job Title: Data Analyst\nCompany: Microsoft Corporation\nLocation: Hyderabad, India\n\nAbout the Role:\nAs a Data Analyst at Microsoft, you will translate complex telemetry and business metrics into actionable strategic decisions.\n\nKey Responsibilities:\n- Write advanced SQL queries, joins, and aggregations across cloud database stores.\n- Develop interactive Power BI dashboards, metrics reporting, and automated pipelines.\n- Apply quantitative aptitude (APTI), exploratory data analysis, and statistical tests.\n- Use Python (Coding) for data manipulation, pandas scripting, and anomaly detection.\n- Deliver clear verbal and written communication (COMM) to leadership teams.`
  },
  {
    id: 'oracle_ase',
    company: 'Oracle Financial Services Software',
    role: 'Associate Software Engineer',
    location: 'Bengaluru / Mumbai, India',
    text: `Job Title: Associate Software Engineer\nCompany: Oracle Financial Services Software\nLocation: Bengaluru / Mumbai, India\n\nAbout the Role:\nOracle Financial Services Software (OFSS) is a world leader in banking software solutions.\n\nKey Responsibilities:\n- Develop robust backend banking logic and transactional database workflows in Java and SQL.\n- Implement Object-Oriented Design (OOD) standards ensuring modularity and financial compliance.\n- Write complex database stored procedures, triggers, and query tuning in Oracle SQL and PL/SQL.\n- Apply Software Engineering (SWE) lifecycle practices, version control (Git), and unit tests.\n- Demonstrate analytical aptitude (APTI) for banking calculation rules and business logic.`
  },
  {
    id: 'oracle_asa',
    company: 'Oracle Financial Services Software',
    role: 'Application Support Analyst',
    location: 'Bengaluru / Chennai, India',
    text: `Job Title: Application Support Analyst\nCompany: Oracle Financial Services Software\nLocation: Bengaluru / Chennai, India\n\nAbout the Role:\nOracle Financial Services Software is seeking an Application Support Analyst to maintain, troubleshoot, and support mission-critical enterprise banking platforms.\n\nKey Responsibilities:\n- Investigate and resolve production incidents using SQL diagnostic queries and log file inspection.\n- Operate across Linux and Unix Operating Systems (OS), utilizing bash shell scripts, permissions, and cron jobs.\n- Diagnose Network connectivity (NETW), API handshakes, firewall configurations, and latency.\n- Provide prompt client-facing communication (COMM) and incident reporting.\n- Apply analytical aptitude (APTI) and root-cause troubleshooting under production SLAs.`
  },
]

// ── Official Sample Candidates (Brief Page 11) ──────────────────────────────
const OFFICIAL_CANDIDATES = [
  {
    id: 'ananya_rao',
    name: 'Ananya Rao',
    profile: 'Systems-leaning generalist',
    fit: 'Strong fit for SWE-heavy roles, weaker for data roles',
    company: 'Google LLC',
    email: 'ananya.rao@example.com',
    education: 'B.Tech in Computer Science & Engineering',
    preferred_roles: ['Software Engineer', 'Distributed Systems Engineer'],
    skills: [
      { skill_name: 'Coding (C++, Python, Go)', category_code: 'COD', level: 9 },
      { skill_name: 'Data Structures & Algorithms', category_code: 'DSA', level: 8 },
      { skill_name: 'System Design & Scalability', category_code: 'SYSD', level: 8 },
      { skill_name: 'Operating Systems & Linux Kernel', category_code: 'OS', level: 8 },
      { skill_name: 'Software Engineering & CI/CD', category_code: 'SWE', level: 8 },
      { skill_name: 'Object-Oriented Design', category_code: 'OOD', level: 8 },
      { skill_name: 'Cloud & Kubernetes', category_code: 'CLOUD', level: 7 },
      { skill_name: 'Networking & TCP/IP', category_code: 'NETW', level: 7 },
      { skill_name: 'Aptitude & Problem Solving', category_code: 'APTI', level: 8 },
      { skill_name: 'Communication', category_code: 'COMM', level: 7 },
      { skill_name: 'SQL Databases', category_code: 'SQL', level: 5 },
      { skill_name: 'AI & Data Science', category_code: 'AI', level: 4 },
    ]
  },
  {
    id: 'karthik_subramaniam',
    name: 'Karthik Subramaniam',
    profile: 'Data-leaning analyst',
    fit: 'Strong fit for Data Scientist / Data Analyst roles, weaker for pure SWE',
    company: 'Microsoft Corporation',
    email: 'karthik.subramaniam@example.com',
    education: 'M.Sc in Data Science & Business Analytics',
    preferred_roles: ['Data Scientist', 'Senior Data Analyst'],
    skills: [
      { skill_name: 'Advanced SQL & Data Warehousing', category_code: 'SQL', level: 9 },
      { skill_name: 'AI & Machine Learning (PyTorch, NLP)', category_code: 'AI', level: 8 },
      { skill_name: 'Quantitative Aptitude & Statistics', category_code: 'APTI', level: 8 },
      { skill_name: 'Executive Communication & Storytelling', category_code: 'COMM', level: 8 },
      { skill_name: 'Python for Data Science', category_code: 'COD', level: 7 },
      { skill_name: 'Cloud & BigQuery', category_code: 'CLOUD', level: 6 },
      { skill_name: 'Software Engineering Basics', category_code: 'SWE', level: 6 },
      { skill_name: 'Data Structures & Sorting', category_code: 'DSA', level: 6 },
      { skill_name: 'Object-Oriented Design', category_code: 'OOD', level: 5 },
      { skill_name: 'Operating Systems & Bash', category_code: 'OS', level: 5 },
      { skill_name: 'System Design', category_code: 'SYSD', level: 4 },
      { skill_name: 'Networking & APIs', category_code: 'NETW', level: 4 },
    ]
  },
  {
    id: 'priya_menon',
    name: 'Priya Menon',
    profile: 'Entry-level, support-oriented',
    fit: 'Best fit for Oracle FSS roles, weaker fit for Google / Microsoft',
    company: 'Oracle Financial Services Software',
    email: 'priya.menon@example.com',
    education: 'B.Sc in Information Technology',
    preferred_roles: ['Application Support Analyst', 'Associate Software Engineer'],
    skills: [
      { skill_name: 'Client Communication & Support', category_code: 'COMM', level: 8 },
      { skill_name: 'SQL Queries & Table Debugging', category_code: 'SQL', level: 7 },
      { skill_name: 'Diagnostic Aptitude & Troubleshooting', category_code: 'APTI', level: 7 },
      { skill_name: 'Linux/Unix Terminal & Shell', category_code: 'OS', level: 6 },
      { skill_name: 'Software Engineering & Git', category_code: 'SWE', level: 6 },
      { skill_name: 'Java & Script Coding', category_code: 'COD', level: 6 },
      { skill_name: 'Object-Oriented Design', category_code: 'OOD', level: 6 },
      { skill_name: 'Networking & Port Diagnostics', category_code: 'NETW', level: 6 },
      { skill_name: 'Cloud Basics', category_code: 'CLOUD', level: 5 },
      { skill_name: 'Data Structures (Arrays/Lists)', category_code: 'DSA', level: 4 },
      { skill_name: 'System Design', category_code: 'SYSD', level: 3 },
      { skill_name: 'AI & Machine Learning', category_code: 'AI', level: 2 },
    ]
  },
  {
    id: 'rohan_verma',
    name: 'Rohan Verma',
    profile: 'Strong all-rounder',
    fit: 'Competitive fit across nearly every role in the pack',
    company: 'Google LLC',
    email: 'rohan.verma@example.com',
    education: 'B.Tech in Computer Science',
    preferred_roles: ['Senior Full-Stack Engineer', 'Machine Learning Engineer'],
    skills: [
      { skill_name: 'Full-Stack Coding (Python, Java, TS)', category_code: 'COD', level: 9 },
      { skill_name: 'Data Structures & Algorithms (Competitive)', category_code: 'DSA', level: 9 },
      { skill_name: 'Software Engineering Excellence & CI/CD', category_code: 'SWE', level: 9 },
      { skill_name: 'Distributed System Design', category_code: 'SYSD', level: 8 },
      { skill_name: 'Cloud & Kubernetes (AWS/GCP)', category_code: 'CLOUD', level: 8 },
      { skill_name: 'Object-Oriented Architecture', category_code: 'OOD', level: 8 },
      { skill_name: 'PostgreSQL & Database Design', category_code: 'SQL', level: 8 },
      { skill_name: 'Analytical Aptitude', category_code: 'APTI', level: 8 },
      { skill_name: 'Communication & Team Leadership', category_code: 'COMM', level: 8 },
      { skill_name: 'Linux OS & Concurrency', category_code: 'OS', level: 8 },
      { skill_name: 'Applied AI & Transformers', category_code: 'AI', level: 7 },
      { skill_name: 'Networking & gRPC', category_code: 'NETW', level: 7 },
    ]
  },
]

// ── Material Icon Helper ─────────────────────────────────────────────────────
function Icon({ name, size = 20, style = {}, filled = false }) {
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

// ── Interactive Contact Modal ────────────────────────────────────────────────
function ContactModal({ isOpen, onClose }) {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
    setTimeout(() => {
      setSent(false)
      onClose()
      setForm({ name: '', email: '', message: '' })
    }, 2000)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20,
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        maxWidth: 480,
        width: '100%',
        padding: 32,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748b',
          }}
        >
          ✕
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: '#fff7ed', border: '1px solid #fed7aa',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="mail" size={20} style={{ color: '#df7a1a' }} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 800, color: '#1e2530' }}>
            Get In Touch
          </h3>
        </div>

        <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: 20 }}>
          Connect with the RADIX Talent Match engineering & solutions team.
        </p>

        {sent ? (
          <div style={{ padding: 28, background: '#ecfdf5', borderRadius: 12, textAlign: 'center', border: '1px solid #a7f3d0' }}>
            <Icon name="check_circle" size={44} style={{ color: '#059669', marginBottom: 8 }} filled />
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#065f46' }}>
              Message Received!
            </div>
            <p style={{ color: '#047857', fontSize: '0.84rem', marginTop: 4 }}>
              Our talent team will follow up at your email shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                Your Name *
              </label>
              <input
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Alex Morgan"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                Work Email *
              </label>
              <input
                required
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="alex@company.com"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                Inquiry / Message
              </label>
              <textarea
                rows={3}
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder="Share your requirements or recruitment objectives..."
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>

            <button
              type="submit"
              style={{
                marginTop: 6,
                padding: '12px 24px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #f5a623 0%, #df7a1a 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              Send Message
              <Icon name="send" size={18} />
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Navigation Bar ───────────────────────────────────────────────────────────
function Navbar({ activeUser, setActiveUser, candidateName, onReset, onOpenContact }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [isEditingUser, setIsEditingUser]     = useState(false)
  const [userNameInput, setUserNameInput]     = useState(activeUser)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowProfileMenu(false)
        setIsEditingUser(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSaveEvaluator = () => {
    if (userNameInput.trim()) {
      setActiveUser(userNameInput.trim())
      setIsEditingUser(false)
    }
  }

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #f1f5f9',
      padding: '0 48px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
    }}>
      <div style={{
        maxWidth: 1240,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 72,
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="#" style={{ textDecoration: 'none' }}>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '1.65rem',
              color: '#df7a1a',
              letterSpacing: '-0.03em',
            }}>
              JSS <span style={{ fontWeight: 800, color: '#df7a1a' }}>Global</span>
            </span>
          </a>
          <span style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            color: '#854d0e',
            background: '#fce3a9',
            padding: '2px 8px',
            borderRadius: 6,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>
            Radix Match
          </span>
        </div>

        {/* Center Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {[
            { label: 'Home', href: '#' },
            { label: 'AI Match Engine', href: '#match-engine' },
            { label: 'Tech Focus', href: '#tech-areas' },
            { label: 'Benchmarks', href: '#benchmarks' },
            { label: 'Blogs', href: '#blogs' },
          ].map((item, idx) => (
            <a
              key={idx}
              href={item.href}
              style={{
                textDecoration: 'none',
                color: idx === 0 ? '#df7a1a' : '#475569',
                fontWeight: idx === 0 ? 700 : 500,
                fontSize: '0.92rem',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={e => e.target.style.color = '#df7a1a'}
              onMouseLeave={e => e.target.style.color = idx === 0 ? '#df7a1a' : '#475569'}
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Right Side: Contact Us + Profile Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }} ref={menuRef}>
          <button
            onClick={onOpenContact}
            style={{
              background: '#fce3a9',
              color: '#854d0e',
              border: 'none',
              padding: '9px 22px',
              borderRadius: 20,
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
            }}
          >
            Contact Us
          </button>

          {/* Profile Trigger */}
          <button
            onClick={() => {
              setShowProfileMenu(prev => !prev)
              setUserNameInput(activeUser)
              setIsEditingUser(false)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: '#ffffff',
              border: '1.5px solid #fed7aa',
              padding: '6px 14px 6px 8px',
              borderRadius: 30,
              cursor: 'pointer',
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #f5a623 0%, #df7a1a 100%)',
              color: '#ffffff', fontWeight: 700, fontSize: '0.85rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {activeUser.charAt(0).toUpperCase()}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e2530' }}>
                {activeUser.split(' ')[0]}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 600 }}>
                ● Active Evaluator
              </div>
            </div>
            <Icon name={showProfileMenu ? "expand_less" : "expand_more"} size={18} style={{ color: '#94a3b8' }} />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div style={{
              position: 'absolute',
              top: 68,
              right: 48,
              width: 330,
              background: '#ffffff',
              borderRadius: 16,
              boxShadow: '0 14px 40px rgba(0,0,0,0.15)',
              border: '1px solid #e2e8f0',
              padding: 22,
              zIndex: 200,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f5a623 0%, #df7a1a 100%)',
                  color: '#ffffff', fontWeight: 700, fontSize: '1.1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {activeUser.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.96rem', color: '#1e2530' }}>
                    {activeUser}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Lead Technical Evaluator & Recruiter
                  </div>
                </div>
              </div>

              <div style={{
                background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10,
                padding: '10px 12px', fontSize: '0.78rem', color: '#854d0e', marginBottom: 16, lineHeight: 1.55,
              }}>
                <div><strong>Current Candidate:</strong> {candidateName || 'Alex Morgan'}</div>
                <div><strong>Pipeline Engine:</strong> RADIX 5-Role Automated System</div>
                <div><strong>Backend Services:</strong> 5 APIs Active & Connected</div>
              </div>

              {isEditingUser ? (
                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Enter New Evaluator Name:
                  </label>
                  <input
                    value={userNameInput}
                    onChange={e => setUserNameInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveEvaluator()}
                    placeholder="e.g. Shorya Gupta, Sarah Chen"
                    autoFocus
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #94a3b8', fontSize: '0.85rem', outline: 'none', marginBottom: 8 }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={handleSaveEvaluator}
                      style={{ flex: 1, background: '#059669', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Save Name
                    </button>
                    <button
                      onClick={() => setIsEditingUser(false)}
                      style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingUser(true)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: '#ffffff', border: '1.5px solid #df7a1a', borderRadius: 8, padding: '9px 12px',
                    fontSize: '0.82rem', color: '#df7a1a', cursor: 'pointer', fontWeight: 700, marginBottom: 8,
                  }}
                >
                  <Icon name="edit" size={16} style={{ color: '#df7a1a' }} />
                  Change Evaluator Name
                </button>
              )}

              <button
                onClick={() => { onReset(); setShowProfileMenu(false) }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 8, padding: '9px 12px',
                  fontSize: '0.82rem', color: '#dc2626', cursor: 'pointer', fontWeight: 600,
                }}
              >
                <Icon name="restart_alt" size={16} style={{ color: '#dc2626' }} />
                Reset Pipeline Session
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

// ── Hero Section ─────────────────────────────────────────────────────────────
function Hero({ onExploreClick, onLoadDemoData }) {
  return (
    <section style={{ background: '#ffffff', padding: '64px 48px 48px', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 48, alignItems: 'center',
      }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.4rem, 4.2vw, 3.4rem)', fontWeight: 800, color: '#1e2530', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 4 }}>
            Hire Top Tier Talent.
          </h1>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.4rem, 4.2vw, 3.4rem)', fontWeight: 800, color: '#df7a1a', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 28 }}>
            Build High Performance Teams.
          </h2>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e2530', marginBottom: 12, letterSpacing: '-0.01em' }}>
            Great Talent. Global Opportunities.
          </h3>

          <p style={{ fontSize: '1.05rem', color: '#64748b', lineHeight: 1.7, maxWidth: 540, marginBottom: 36 }}>
            We help organizations discover candidate Talent DNA across 12 skill categories, benchmark against top-tier tech standards (Google, Microsoft, Oracle FSS), and accelerate precision matching with AI.
          </p>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={onExploreClick}
              style={{
                background: 'linear-gradient(135deg, #f5a623 0%, #df7a1a 100%)',
                color: '#ffffff', border: 'none', padding: '14px 34px', borderRadius: 10,
                fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-heading)', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}
            >
              Explore 5-Role Pipeline
              <Icon name="arrow_downward" size={18} />
            </button>

            <button
              onClick={onLoadDemoData}
              style={{
                background: '#fce3a9', color: '#854d0e', border: 'none', padding: '14px 28px',
                borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}
            >
              <Icon name="bolt" size={20} filled style={{ color: '#854d0e' }} />
              ⚡ Quick Demo Run
            </button>
          </div>
        </div>

        {/* Right Side: Pod with Talent Metrics */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: 440, height: 380, borderRadius: '62% 38% 70% 30% / 45% 58% 42% 55%',
            background: 'linear-gradient(135deg, #fce3a9 0%, #f6c445 100%)', padding: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ background: '#ffffff', borderRadius: 20, padding: 24, boxShadow: '0 12px 30px rgba(0,0,0,0.08)', width: '94%', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#df7a1a', background: '#fff7ed', padding: '3px 10px', borderRadius: 12, border: '1px solid #fed7aa' }}>
                  12 RADIX CATEGORIES
                </span>
                <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                  ● Benchmarked
                </span>
              </div>

              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e2530', marginBottom: 4 }}>
                Software Engineer (SWE)
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 18 }}>
                Benchmarked against Google LLC & Microsoft Bars
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                {[
                  { skill: 'DSA / Algorithmic Problem Solving', pct: 92, color: '#df7a1a' },
                  { skill: 'System Design & Scalability', pct: 88, color: '#7c3aed' },
                  { skill: 'Cloud & Infrastructure (AWS/GCP)', pct: 82, color: '#0284c7' },
                ].map((item, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, marginBottom: 4 }}>
                      <span style={{ color: '#334155' }}>{item.skill}</span>
                      <span style={{ color: item.color }}>{item.pct}%</span>
                    </div>
                    <div style={{ height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ width: `${item.pct}%`, height: '100%', background: item.color, borderRadius: 999 }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #f1f5f9', fontSize: '0.78rem' }}>
                <span style={{ color: '#64748b' }}>Readiness Score:</span>
                <span style={{ fontWeight: 800, color: '#059669', fontSize: '1.05rem' }}>89 / 100</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── 4 Feature Cards ──────────────────────────────────────────────────────────
function FeatureCards({ onExploreClick }) {
  const cards = [
    { icon: 'stars', color: '#e11d48', bg: '#ffe4e6', title: 'Brand positioning for attracting top talent', desc: 'Automated candidate profiling across 12 skillsets that attract high-caliber engineers.' },
    { icon: 'attach_money', color: '#059669', bg: '#ecfdf5', title: 'Transparency in pricing & readiness', desc: 'Objective 0-100 technical readiness indices benchmarked against verified company skill bars.' },
    { icon: 'view_in_ar', color: '#0284c7', bg: '#f0f9ff', title: 'World class infrastructure', desc: 'Powered by an asynchronous FastAPI backend and live Supabase cloud database integration.' },
    { icon: 'savings', color: '#7c3aed', bg: '#f5f3ff', title: 'Save up to 60% on evaluation time', desc: 'Transform hours of manual resume screening into a 30-second AI-driven multi-role pipeline.' },
  ]

  return (
    <section style={{ background: '#fbfbfb', padding: '56px 48px', borderTop: '1px solid #f1f5f9' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 40, alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: '1.25rem', lineHeight: 1.6, color: '#1e2530', fontWeight: 600, marginBottom: 24 }}>
            tech workforce with TGL — an unparalleled opportunity for companies to secure some of the finest talent globally.
          </p>
          <button
            onClick={onExploreClick}
            style={{
              background: 'linear-gradient(135deg, #f5a623 0%, #df7a1a 100%)', color: '#ffffff',
              border: 'none', padding: '12px 32px', borderRadius: 8, fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
            }}
          >
            Explore
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {cards.map((c, i) => (
            <div key={i} style={{ background: '#ffffff', borderRadius: 14, padding: '24px 20px', border: '1px solid #f1f5f9' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Icon name={c.icon} size={22} style={{ color: c.color }} filled />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#1e2530', marginBottom: 8 }}>{c.title}</div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Tech Areas Section ───────────────────────────────────────────────────────
function TechAreas() {
  const areas = [
    { title: 'Full Stack & Software Engineering', sub: 'COD, SWE, OOD, React, Python' },
    { title: 'Data Structures & Algorithms (DSA)', sub: 'Dynamic Programming, Trees, Graphs' },
    { title: 'Distributed Systems & Architecture', sub: 'SYSD, Microservices, High Availability' },
    { title: 'Cloud & Infrastructure', sub: 'CLOUD, AWS, Azure, GCP, Docker, Kubernetes' },
    { title: 'SQL & Database Engineering', sub: 'SQL, PostgreSQL, MySQL, Data Warehousing' },
    { title: 'AI & Machine Learning', sub: 'AI, PyTorch, Transformers, Predictive Models' },
  ]

  return (
    <section id="tech-areas" style={{ background: '#ffffff', padding: '64px 48px', borderTop: '1px solid #f1f5f9' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 48, alignItems: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: 380, height: 280, borderRadius: 20,
            background: 'linear-gradient(135deg, #1e2530 0%, #0f172a 100%)',
            color: '#ffffff', padding: 30, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f6c445', background: 'rgba(246,196,69,0.15)', padding: '3px 10px', borderRadius: 12 }}>
                12-SKILLSET TAXONOMY
              </span>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: 12 }}>
                Official RADIX Framework
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['DSA', 'COD', 'OOD', 'APTI', 'COMM', 'AI', 'CLOUD', 'SQL', 'SWE', 'SYSD', 'NETW', 'OS'].map((code, idx) => (
                <span key={idx} style={{ fontSize: '0.74rem', background: 'rgba(255,255,255,0.12)', padding: '4px 9px', borderRadius: 6, fontWeight: 700, color: '#fed7aa' }}>
                  {code}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: '#1e2530', marginBottom: 24 }}>
            Tech Areas We Focus On
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 24px' }}>
            {areas.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#df7a1a', marginTop: 6, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#1e2530' }}>{a.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>{a.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Step Navigation ──────────────────────────────────────────────────────────
function StepNav({ current, completed, onSelectStep }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, padding: '0 10px', marginBottom: 36 }}>
      {STEPS.map((s, i) => {
        const done = completed.includes(s.id)
        const active = current === s.id
        return (
          <React.Fragment key={s.id}>
            <div
              onClick={() => onSelectStep && onSelectStep(s.id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                cursor: 'pointer', userSelect: 'none',
              }}
              title={`Click to switch to Step ${s.id}: ${s.label}`}
            >
              <div style={{
                width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? '#059669' : active ? 'linear-gradient(135deg, #f5a623 0%, #df7a1a 100%)' : '#f1f5f9',
                color: done || active ? '#ffffff' : '#94a3b8',
                boxShadow: active ? '0 4px 14px rgba(223,122,26,0.35)' : done ? '0 4px 14px rgba(5,150,105,0.25)' : 'none',
                transition: 'all 0.2s ease',
              }}>
                {done ? <Icon name="check" size={22} style={{ color: '#fff' }} /> : <Icon name={s.icon} size={22} filled={active} />}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: active ? 700 : 600, color: done ? '#059669' : active ? '#df7a1a' : '#475569' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 2 }}>
                  {s.role}: {s.desc}
                </div>
              </div>
            </div>

            {i < STEPS.length - 1 && (
              <div style={{ flex: '0 0 40px', display: 'flex', alignItems: 'center', paddingTop: 24 }}>
                <div style={{ height: 2, width: '100%', borderRadius: 1, background: done ? '#059669' : '#e2e8f0' }} />
              </div>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ── Score Ring Gauge ─────────────────────────────────────────────────────────
function ScoreRing({ score, size = 130 }) {
  const color = score >= 80 ? '#059669' : score >= 60 ? '#df7a1a' : '#dc2626'
  const circumference = 2 * Math.PI * 52
  const offset = circumference - (score / 100) * circumference

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <circle
          cx="60" cy="60" r="52" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color, letterSpacing: '-0.03em' }}>
          {score}
        </span>
        <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, marginTop: -2 }}>
          out of 100
        </span>
      </div>
    </div>
  )
}

// ── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, max = 100, color = '#df7a1a', height = 8 }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div style={{ background: '#f1f5f9', borderRadius: 999, height, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${color}, ${color}cc)`, borderRadius: 999, transition: 'width 0.6s ease' }} />
    </div>
  )
}

// ── Talent Result Component ──────────────────────────────────────────────────
function TalentResult({ data, onNext, onStartMockInterview }) {
  const [viewMode, setViewMode] = useState('both')
  const hasGaps = data.skillset_gap?.some(g => g.gap)

  return (
    <div id="talent-evaluation-results" style={{ marginTop: 32, animation: 'slideUp 0.4s ease' }}>
      <div style={{ height: 1, background: '#f1f5f9', marginBottom: 26 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 28, flexWrap: 'wrap' }}>
        <ScoreRing score={data.readiness_score} />
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800, color: '#1e2530' }}>
            {data.readiness_label}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.92rem', marginTop: 4 }}>
            Candidate <strong>{data.candidate_name}</strong> calibrated against <strong>{data.company}</strong> expected competency standards
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 20,
              fontSize: '0.74rem', fontWeight: 700,
              background: data.data_source === 'supabase' ? '#ecfdf5' : '#fff7ed',
              color: data.data_source === 'supabase' ? '#059669' : '#df7a1a',
              border: `1px solid ${data.data_source === 'supabase' ? '#a7f3d0' : '#fed7aa'}`,
            }}>
              <Icon name={data.data_source === 'supabase' ? 'database' : 'layers'} size={14} />
              {data.data_source === 'supabase' ? 'Option 1: Live Supabase Table staging_company_skill_levels' : 'Option 2: talent_check_company_skillsets.json (12 Categories)'}
            </span>
          </div>
        </div>
      </div>

      {/* 🚀 HIGHLIGHTED HERO FEATURE: Live Mock Interview Callout Banner */}
      {hasGaps && (
        <div style={{
          background: 'linear-gradient(135deg, #090d16 0%, #1e293b 100%)',
          borderRadius: 18, padding: '22px 26px', marginBottom: 26,
          border: '2px solid #f59e0b',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 20, flexWrap: 'wrap',
          boxShadow: '0 12px 35px -5px rgba(245, 158, 11, 0.35)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Subtle glowing ambient badge in corner */}
          <div style={{
            position: 'absolute', top: -10, right: -10, width: 80, height: 80,
            background: 'radial-gradient(circle, rgba(245,158,11,0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, maxWidth: 640 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: 'linear-gradient(135deg, #f5a623 0%, #df7a1a 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(223, 122, 26, 0.5)',
              flexShrink: 0,
            }}>
              <Icon name="record_voice_over" size={30} style={{ color: '#ffffff' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                  Live Mock Interview Simulator
                </span>
                <span style={{
                  background: 'linear-gradient(135deg, #ea580c 0%, #d97706 100%)',
                  color: '#ffffff', fontSize: '0.68rem', fontWeight: 800,
                  padding: '3px 10px', borderRadius: 12, textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}>
                  🎙️ Interactive Role 6 Agent
                </span>
                <span style={{
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                  color: '#e2e8f0', fontSize: '0.68rem', fontWeight: 600,
                  padding: '2px 8px', borderRadius: 10,
                }}>
                  {data.company} Technical Bar
                </span>
              </div>
              <p style={{ color: '#cbd5e1', fontSize: '0.86rem', margin: '6px 0 0', lineHeight: 1.5 }}>
                Candidate scored below expected competency in identified skills. Launch an adaptive technical screening simulation with an AI Engineering Manager using <strong>Voice Mic</strong> or <strong>Text</strong> with live 5-point grading!
              </p>
            </div>
          </div>

          <button
            onClick={() => onStartMockInterview && onStartMockInterview(null)}
            style={{
              background: 'linear-gradient(135deg, #f5a623 0%, #df7a1a 100%)',
              color: '#ffffff', border: 'none', borderRadius: 12,
              padding: '14px 26px', fontSize: '0.96rem', fontWeight: 800,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10,
              boxShadow: '0 6px 20px rgba(223, 122, 26, 0.45)', whiteSpace: 'nowrap',
              transition: 'transform 0.15s ease',
            }}
          >
            <Icon name="mic" size={20} />
            Start Live Mock Screen →
          </button>
        </div>
      )}

      {/* View Switcher: Grid vs Knowledge Graph vs Dual View */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20, flexWrap: 'wrap', gap: 14,
        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '12px 18px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 800, color: '#1e2530', margin: 0 }}>
              Competency Benchmark & Architecture Topology
            </h3>
            <span style={{
              fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 6,
              background: viewMode === 'both' ? '#ecfdf5' : '#fff7ed',
              color: viewMode === 'both' ? '#059669' : '#df7a1a',
              border: `1px solid ${viewMode === 'both' ? '#a7f3d0' : '#fed7aa'}`,
            }}>
              {viewMode === 'both' ? '⚡ Side-by-Side Active' : viewMode === 'grid' ? '📋 Grid Cards Active' : '🕸️ Graph Active'}
            </span>
          </div>
          <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
            Switch view layout to compare 12-skill cards against the interactive neural knowledge graph
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, background: '#e2e8f0', padding: 4, borderRadius: 10 }}>
          <button
            type="button"
            onClick={() => setViewMode('both')}
            style={{
              background: viewMode === 'both' ? 'linear-gradient(135deg, #f5a623 0%, #df7a1a 100%)' : '#ffffff',
              border: 'none',
              borderRadius: 8, padding: '7px 16px', fontSize: '0.8rem',
              fontWeight: 700,
              color: viewMode === 'both' ? '#ffffff' : '#475569',
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
              boxShadow: viewMode === 'both' ? '0 3px 10px rgba(223,122,26,0.35)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Icon name="splitscreen" size={16} />
            Unified Dual View
          </button>

          <button
            type="button"
            onClick={() => setViewMode('grid')}
            style={{
              background: viewMode === 'grid' ? 'linear-gradient(135deg, #f5a623 0%, #df7a1a 100%)' : '#ffffff',
              border: 'none',
              borderRadius: 8, padding: '7px 16px', fontSize: '0.8rem',
              fontWeight: 700,
              color: viewMode === 'grid' ? '#ffffff' : '#475569',
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
              boxShadow: viewMode === 'grid' ? '0 3px 10px rgba(223,122,26,0.35)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Icon name="grid_view" size={16} />
            Grid Only
          </button>

          <button
            type="button"
            onClick={() => setViewMode('graph')}
            style={{
              background: viewMode === 'graph' ? 'linear-gradient(135deg, #f5a623 0%, #df7a1a 100%)' : '#ffffff',
              border: 'none',
              borderRadius: 8, padding: '7px 16px', fontSize: '0.8rem',
              fontWeight: 700,
              color: viewMode === 'graph' ? '#ffffff' : '#475569',
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
              boxShadow: viewMode === 'graph' ? '0 3px 10px rgba(223,122,26,0.35)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Icon name="hub" size={16} />
            Knowledge Graph Only
          </button>
        </div>
      </div>

      {/* ═══ VIEW MODE 1: UNIFIED DUAL VIEW (TRUE SIDE-BY-SIDE) ═══ */}
      {viewMode === 'both' && (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'start' }}>
          {/* Left: Compact 12-Skill Scorecard Panel */}
          <div style={{
            background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0',
            padding: '16px 18px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
            display: 'flex', flexDirection: 'column', maxHeight: 570,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#1e2530', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="fact_check" size={18} style={{ color: '#df7a1a' }} />
                12-Skillset Scorecard
              </span>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Target: {data.company.split(' ')[0]}
              </span>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.skillset_gap?.map((g, i) => {
                const gapColor = !g.gap ? '#059669' : '#df7a1a'
                return (
                  <div key={i} style={{ background: '#fcfbf9', borderRadius: 10, padding: '10px 12px', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#1e2530' }}>{g.category_code}</span>
                        <span style={{ fontSize: '0.74rem', color: '#64748b' }}>{g.category_label.length > 18 ? g.category_label.slice(0, 16) + '…' : g.category_label}</span>
                      </div>
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 800, color: gapColor,
                        padding: '1px 7px', borderRadius: 8,
                        background: !g.gap ? '#ecfdf5' : '#fff7ed',
                      }}>
                        {g.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginBottom: 4 }}>
                      <span>Candidate: <strong>{g.candidate_level}/10</strong></span>
                      <span>Bar: <strong>{g.required_level}/10</strong></span>
                    </div>
                    <ProgressBar value={g.candidate_level} max={10} color={gapColor} height={5} />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right: Interactive Knowledge Graph */}
          <div style={{ minWidth: 0 }}>
            <KnowledgeGraph
              candidateSkills={data.skillset_gap?.map(g => ({ category_code: g.category_code, level: g.candidate_level })) || []}
              companyBars={data.skillset_gap || []}
              targetCompany={data.company}
              onLaunchMockScreen={onStartMockInterview}
            />
          </div>
        </div>
      )}

      {/* ═══ VIEW MODE 2: GRID ONLY (FULL EXPANDED 2-COLUMN CARDS) ═══ */}
      {viewMode === 'grid' && (
        <div>
          <div style={{
            background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10,
            padding: '10px 16px', marginBottom: 16, fontSize: '0.82rem', color: '#9a3412',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Icon name="grid_view" size={18} style={{ color: '#ea580c' }} />
            <span><strong>Grid View:</strong> Showing expanded 12-skillset benchmark cards. Click <strong>"Unified Dual View"</strong> or <strong>"Knowledge Graph Only"</strong> above to see the neural dependency network.</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 12 }}>
            {data.skillset_gap?.map((g, i) => {
              const gapColor = !g.gap ? '#059669' : '#df7a1a'
              return (
                <div key={i} style={{ background: '#fcfbf9', borderRadius: 12, padding: '14px 18px', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e2530' }}>
                        {g.category_label}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                        {g.category_code}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {g.gap && onStartMockInterview && (
                        <button
                          onClick={() => onStartMockInterview(g)}
                          title={`Simulate interview for ${g.category_label}`}
                          style={{
                            background: '#fff7ed', border: '1px solid #fed7aa', color: '#df7a1a',
                            fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
                          }}
                        >
                          <Icon name="mic" size={12} />
                          Simulate Screen
                        </button>
                      )}
                      <span style={{
                        fontSize: '0.74rem', fontWeight: 700, color: gapColor,
                        padding: '2px 10px', borderRadius: 12,
                        background: !g.gap ? '#ecfdf5' : '#fff7ed',
                      }}>
                        {g.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#64748b', marginBottom: 6 }}>
                    <span>Candidate: <strong>{g.candidate_level}/10</strong></span>
                    <span>Expected Bar: <strong>{g.required_level}/10</strong></span>
                  </div>
                  <ProgressBar value={g.candidate_level} max={10} color={gapColor} height={6} />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══ VIEW MODE 3: KNOWLEDGE GRAPH ONLY ═══ */}
      {viewMode === 'graph' && (
        <div>
          <div style={{
            background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10,
            padding: '10px 16px', marginBottom: 16, fontSize: '0.82rem', color: '#065f46',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Icon name="hub" size={18} style={{ color: '#059669' }} />
            <span><strong>Knowledge Graph Only:</strong> Showing interactive 12-node dependency topology and predictive upskilling trajectory simulation.</span>
          </div>

          <KnowledgeGraph
            candidateSkills={data.skillset_gap?.map(g => ({ category_code: g.category_code, level: g.candidate_level })) || []}
            companyBars={data.skillset_gap || []}
            targetCompany={data.company}
            onLaunchMockScreen={onStartMockInterview}
          />
        </div>
      )}

      <div style={{ marginTop: 24, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <button
          onClick={onNext}
          style={{
            padding: '12px 30px',
            background: 'linear-gradient(135deg, #f5a623 0%, #df7a1a 100%)',
            color: '#ffffff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem',
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
          }}
        >
          Continue to Final Skill Matching (Role 5)
          <Icon name="arrow_forward" size={18} />
        </button>

        {hasGaps && onStartMockInterview && (
          <button
            onClick={() => onStartMockInterview(null)}
            style={{
              padding: '12px 24px',
              background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: 10,
              fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
          >
            <Icon name="record_voice_over" size={18} style={{ color: '#fbbf24' }} />
            Launch Live Mock Screen
          </button>
        )}
      </div>
    </div>
  )
}

// ── Match Result Component ───────────────────────────────────────────────────
function MatchResult({ data, candidateName, company, onStartMockInterview }) {
  const [copied, setCopied] = useState(false)

  const handleExport = () => {
    const report = {
      candidate: candidateName,
      company_benchmark: company,
      overall_match_score: `${data.match_score}%`,
      evaluation_label: data.match_label,
      matched_skills_count: `${data.matched_count} / ${data.total_jd_skills}`,
      matched_skills: data.matched_skills,
      missing_skills: data.missing_skills || data.unmatched_skills,
      category_breakdown: data.category_breakdown,
      generated_at: new Date().toISOString(),
      platform: 'RADIX Talent Match (JSS Global Edition)',
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Talent_Evaluation_${candidateName || 'Candidate'}.json`
    a.click()
    URL.revokeObjectURL(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div style={{ marginTop: 32, animation: 'slideUp 0.4s ease' }}>
      <div style={{ height: 1, background: '#f1f5f9', marginBottom: 26 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 28 }}>
        <ScoreRing score={data.match_score} />
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: '#1e2530' }}>
            {data.match_label}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.92rem', marginTop: 4 }}>
            Matched <strong>{data.matched_count}</strong> of <strong>{data.total_jd_skills}</strong> Job Description requirements
          </div>
          <div style={{ marginTop: 12 }}>
            <button
              onClick={handleExport}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#f8fafc', border: '1px solid #cbd5e1', padding: '6px 16px',
                borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, color: '#334155', cursor: 'pointer',
              }}
            >
              <Icon name={copied ? "check" : "download"} size={16} />
              {copied ? 'Downloaded Evaluation JSON' : 'Export Full Match Report'}
            </button>
          </div>
        </div>
      </div>

      {data.category_breakdown?.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700, color: '#1e2530', marginBottom: 14 }}>
            Skill Category Coverage
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 12 }}>
            {data.category_breakdown.map((c, i) => {
              const color = c.match_pct >= 80 ? '#059669' : c.match_pct >= 50 ? '#df7a1a' : '#dc2626'
              return (
                <div key={i} style={{ background: '#fcfbf9', borderRadius: 12, padding: '14px 16px', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 700, color: '#1e2530' }}>{c.category_code}</span>
                    <span style={{ color, fontWeight: 700 }}>{c.match_pct}%</span>
                  </div>
                  <ProgressBar value={c.matched} max={c.total_required} color={color} height={6} />
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 6 }}>
                    {c.matched} of {c.total_required} matched
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Missing Skills & Gaps */}
      {(data.missing_skills || data.unmatched_skills)?.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700, color: '#d97706', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="warning" size={20} style={{ color: '#d97706' }} filled />
              Identified Skillset Gaps ({data.unmatched_count})
            </h3>

            {onStartMockInterview && (
              <button
                onClick={() => onStartMockInterview(null)}
                style={{
                  background: 'linear-gradient(135deg, #f5a623 0%, #df7a1a 100%)',
                  color: '#ffffff', border: 'none', borderRadius: 8,
                  padding: '7px 16px', fontSize: '0.8rem', fontWeight: 700,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 3px 10px rgba(223, 122, 26, 0.3)',
                }}
              >
                <Icon name="record_voice_over" size={16} />
                Practice Gaps in Live Mock Screen →
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(data.missing_skills || data.unmatched_skills).map((u, i) => (
              <div key={i} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#92400e' }}>{u.jd_skill}</div>
                  <div style={{ color: '#b45309', fontSize: '0.82rem', marginTop: 2 }}>{u.recommendation}</div>
                </div>
                {onStartMockInterview && (
                  <button
                    onClick={() => onStartMockInterview({ category_code: u.category_code || 'DSA', category_label: u.jd_skill, required_level: 8, candidate_level: 4, gap: true })}
                    style={{
                      background: '#ffffff', border: '1px solid #fde68a', color: '#92400e',
                      fontSize: '0.74rem', fontWeight: 700, padding: '5px 12px', borderRadius: 6,
                      cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    <Icon name="mic" size={14} />
                    Simulate Screen
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: '24px', background: 'linear-gradient(135deg, #fff7ed 0%, #ecfdf5 100%)', borderRadius: 14, border: '1px solid #fed7aa', textAlign: 'center' }}>
        <Icon name="verified" size={40} style={{ color: '#059669' }} filled />
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem', color: '#1e2530', marginTop: 8 }}>
          5-Role Evaluation Complete!
        </div>
        <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: 4 }}>
          Successfully executed JD Analytics, Resume Parser, Profile Builder, Supabase Talent Check (Option 1 & 2), and Fuzzy Skill Matching.
        </p>
      </div>
    </div>
  )
}

// ── Testimonials Section ─────────────────────────────────────────────────────
function TestimonialSection() {
  return (
    <section id="benchmarks" style={{ background: '#fcfbf9', padding: '64px 48px', borderTop: '1px solid #f1f5f9' }}>
      <div style={{ maxWidth: 840, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
          USA • SILICON VALLEY BENCHMARKS
        </div>
        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#7c3aed', marginBottom: 16 }}>
          Worked With Silicon Valley Leaders For The Launch Of High-Scale Engineering Pipelines.
        </div>
        <p style={{ fontSize: '1.15rem', color: '#1e2530', fontStyle: 'italic', lineHeight: 1.7, marginBottom: 20 }}>
          "...the ability to calibrate talent DNA against strict engineering thresholds with automated gap analysis is among the best we have seen."
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ width: i === 0 ? 20 : 8, height: 8, borderRadius: 4, background: i === 0 ? '#df7a1a' : '#cbd5e1' }} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Blogs / Insights Section ─────────────────────────────────────────────────
function BlogsSection() {
  return (
    <section id="blogs" style={{ background: '#ffffff', padding: '64px 48px', borderTop: '1px solid #f1f5f9' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, #e8be6e 0%, #ddaa5c 100%)', borderRadius: 20, padding: '48px 40px',
          display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 40, alignItems: 'center', color: '#ffffff',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: '#ffffff', borderRadius: 14, padding: 20, color: '#1e2530' }}>
              <div style={{ height: 110, background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', borderRadius: 10, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f8fafc', fontWeight: 600 }}>
                Innovation Teams
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', marginBottom: 6 }}>
                Building teams for Innovation Engineering
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
                In the fast-paced and dynamic landscape of business, engineering innovation has become the cornerstone of growth.
              </div>
            </div>

            <div style={{ background: '#ffffff', borderRadius: 14, padding: 20, color: '#1e2530' }}>
              <div style={{ height: 110, background: 'linear-gradient(135deg, #78350f 0%, #92400e 100%)', borderRadius: 10, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fef3c7', fontWeight: 600 }}>
                Talent DNA & Profiling
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', marginBottom: 6 }}>
                Bringing consistency in hiring through Talent DNA
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
                In the intricate tapestry of technical recruitment, nothing plays a more pivotal role than objective skill benchmarking.
              </div>
            </div>
          </div>

          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.4rem', fontWeight: 800, marginBottom: 24, color: '#ffffff' }}>
              Blogs
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: 16 }}>
                <a href="#blogs" style={{ textDecoration: 'none', color: '#ffffff', fontWeight: 700, fontSize: '1.05rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Building high performance teams with Hire-Train-Deploy Programs
                  <Icon name="arrow_forward" size={20} />
                </a>
              </div>
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: 16 }}>
                <a href="#blogs" style={{ textDecoration: 'none', color: '#ffffff', fontWeight: 700, fontSize: '1.05rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  The Strategic Advantage of Building teams with High-Aptitude Junior Engineers
                  <Icon name="arrow_forward" size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Corporate Footer ─────────────────────────────────────────────────────────
function CorporateFooter({ onOpenContact }) {
  return (
    <footer id="contact" style={{ background: '#1e293b', color: '#ffffff', padding: '64px 48px 40px' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 48, marginBottom: 48 }}>
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: 16, padding: 32,
            border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800, color: '#df7a1a', marginBottom: 8 }}>
                JSS Global
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6 }}>
                AI-driven talent intelligence, technical benchmarking, and automated candidate evaluation platform. Connecting top engineering talent with high-growth tech enterprises.
              </p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 16, marginTop: 24 }}>
              <div style={{ fontSize: '0.75rem', color: '#df7a1a', fontWeight: 700, textTransform: 'uppercase' }}>
                RADIX TALENT MATCH ENGINE
              </div>
              <div style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 600, marginTop: 4 }}>
                12 Skill Categories • Supabase Table Integration • Fuzzy Algorithm
              </div>
            </div>
          </div>

          <div>
            <div style={{ marginBottom: 26 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f6c445', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Global Innovation Headquarters
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '1.2rem', fontWeight: 800, margin: '4px 0 4px' }}>
                <Icon name="apartment" size={20} style={{ color: '#df7a1a' }} />
                Seattle Tech Corridor, WA
              </div>
              <div style={{ color: '#cbd5e1', fontSize: '0.88rem' }}>
                1420 5th Avenue, Suite 3200, Seattle, WA 98101, United States
              </div>
            </div>

            <div style={{ marginBottom: 26 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f6c445', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Engineering & Talent Lab
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '1.2rem', fontWeight: 800, margin: '4px 0 4px' }}>
                <Icon name="location_on" size={20} style={{ color: '#df7a1a' }} />
                Bengaluru Innovation Campus
              </div>
              <div style={{ color: '#cbd5e1', fontSize: '0.88rem' }}>
                Plot 18, EcoSpace Tech Park, Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103, India
              </div>
            </div>

            <div style={{ marginBottom: 26 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f6c445', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                European Enterprise Office
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '1.2rem', fontWeight: 800, margin: '4px 0 4px' }}>
                <Icon name="public" size={20} style={{ color: '#df7a1a' }} />
                London Canary Wharf
              </div>
              <div style={{ color: '#cbd5e1', fontSize: '0.88rem' }}>
                25 Bank Street, Level 14, Canary Wharf, London E14 5JP, United Kingdom
              </div>
            </div>

            <div style={{ display: 'flex', gap: 24, fontSize: '0.88rem', color: '#f8fafc', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="mail" size={18} style={{ color: '#df7a1a' }} />
                <a href="mailto:connect@radixtalent.io" style={{ color: '#f8fafc', textDecoration: 'none' }}>
                  connect@radixtalent.io
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="call" size={18} style={{ color: '#df7a1a' }} />
                +1 (206) 555-0198
              </div>
              <button
                onClick={onOpenContact}
                style={{ background: '#df7a1a', color: '#ffffff', border: 'none', borderRadius: 16, padding: '6px 14px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Open Message Form
              </button>
            </div>
          </div>
        </div>

        <div style={{ paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', color: '#94a3b8', fontSize: '0.78rem' }}>
          © {new Date().getFullYear()} RADIX Talent Match Platform. High-Performance Engineering Recruitment. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── MAIN DASHBOARD APPLICATION ────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const [activeUser, setActiveUser] = useState('Shorya Gupta (Lead Evaluator)')
  const [step, setStep]             = useState(1)
  const [completed, setCompleted]   = useState([])
  const [isContactOpen, setIsContactOpen] = useState(false)

  // Role 1 – JD
  const [selectedJdId, setSelectedJdId] = useState('google_swe')
  const [jdFile, setJdFile]             = useState(null)
  const [jdResult, setJdResult]         = useState(null)
  const [jdLoading, setJdLoading]       = useState(false)
  const [jdError, setJdError]           = useState('')

  // Role 2 – Resume
  const [selectedCandidateId, setSelectedCandidateId] = useState('ananya_rao')
  const [resumeFile, setResumeFile]                   = useState(null)
  const [resumeResult, setResumeResult]               = useState(null)
  const [resumeLoading, setResumeLoading]             = useState(false)
  const [resumeError, setResumeError]                 = useState('')

  // Role 3 – Candidate Profile
  const [profile, setProfile] = useState(OFFICIAL_CANDIDATES[0])

  // Role 4 – Talent Check
  const [talentResult, setTalentResult]   = useState(null)
  const [talentLoading, setTalentLoading] = useState(false)
  const [talentError, setTalentError]     = useState('')

  // Role 5 – Skill Match
  const [matchResult, setMatchResult]     = useState(null)
  const [matchLoading, setMatchLoading]   = useState(false)
  const [matchError, setMatchError]       = useState('')

  // Role 6 – Live Mock Interview Simulator
  const [isMockModalOpen, setIsMockModalOpen] = useState(false)
  const [mockModalGap, setMockModalGap]       = useState(null)

  const handleOpenMockScreen = (gap = null) => {
    setMockModalGap(gap)
    setIsMockModalOpen(true)
  }

  const engineRef = useRef(null)

  const done = (id) => !completed.includes(id) && setCompleted(prev => [...prev, id])
  const goNext = () => setStep(s => Math.min(5, s + 1))

  const scrollToEngine = () => {
    if (engineRef.current) {
      engineRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleReset = () => {
    setStep(1)
    setCompleted([])
    setJdFile(null)
    setJdResult(null)
    setJdError('')
    setResumeFile(null)
    setResumeResult(null)
    setResumeError('')
    setTalentResult(null)
    setTalentError('')
    setMatchResult(null)
    setMatchError('')
    setIsMockModalOpen(false)
    setMockModalGap(null)
  }

  // ── Role 1: Upload JD ────────────────────────────────────────────────────
  async function uploadJD(fileToUse = jdFile) {
    if (!fileToUse) return
    setJdLoading(true)
    setJdError('')
    try {
      const fd = new FormData()
      fd.append('file', fileToUse)
      const res = await API.post('/jd/extract', fd)
      setJdResult(res.data)
      done(1)
      // ✅ No auto-advance: user clicks "Continue" button manually
    } catch (e) {
      setJdError(e?.response?.data?.detail || e.message)
    } finally {
      setJdLoading(false)
    }
  }

  // Load one of the 6 official JDs
  const handleSelectOfficialJd = (jdItem) => {
    setSelectedJdId(jdItem.id)
    const file = new File([jdItem.text], `${jdItem.id}.txt`, { type: 'text/plain' })
    setJdFile(file)
    uploadJD(file)
  }

  // ── Role 2: Upload Resume ────────────────────────────────────────────────
  async function uploadResume(fileToUse = resumeFile) {
    if (!fileToUse) return
    setResumeLoading(true)
    setResumeError('')
    try {
      const fd = new FormData()
      fd.append('file', fileToUse)
      const res = await API.post('/resume/parse', fd)
      setResumeResult(res.data)
      setProfile(prev => ({
        ...prev,
        name:   res.data.name  || prev.name,
        email:  res.data.email || prev.email,
        skills: res.data.skills?.length ? res.data.skills : prev.skills,
      }))
      done(2)
      // ✅ No auto-advance: user clicks "Continue" button manually
    } catch (e) {
      setResumeError(e?.response?.data?.detail || e.message)
    } finally {
      setResumeLoading(false)
    }
  }

  // Load one of the 4 official Candidates
  const handleSelectOfficialCandidate = (cand) => {
    setSelectedCandidateId(cand.id)
    setProfile(cand)
    const resumeText = `Candidate Name: ${cand.name}\nEmail: ${cand.email}\nProfile: ${cand.profile}\nTarget Company: ${cand.company}\n\nTechnical Skills:\n` +
      cand.skills.map(s => `- ${s.skill_name} (${s.category_code}): Level ${s.level}`).join('\n')
    const file = new File([resumeText], `${cand.id}_resume.txt`, { type: 'text/plain' })
    setResumeFile(file)
    uploadResume(file)
  }

  // ── Quick Demo Run ────────────────────────────────────────────────────────
  const runFullDemo = () => {
    scrollToEngine()
    handleSelectOfficialJd(OFFICIAL_JDS[0])
  }

  // ── Role 4: Talent Check ──────────────────────────────────────────────────
  async function runTalentCheck() {
    setTalentLoading(true)
    setTalentError('')
    try {
      const res = await API.post('/talent-check/evaluate', {
        name:    profile.name,
        company: profile.company,
        skills:  profile.skills,
      })
      setTalentResult(res.data)
      done(4)
      // Stay on Step 4 so evaluator can thoroughly inspect Competency Benchmark, Knowledge Graph, and Mock Interview
      setTimeout(() => {
        const el = document.getElementById('talent-evaluation-results')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 120)
    } catch (e) {
      setTalentError(e?.response?.data?.detail || e.message)
    } finally {
      setTalentLoading(false)
    }
  }

  // ── Role 5: Skill Matching ───────────────────────────────────────────────
  async function runSkillMatch() {
    setMatchLoading(true)
    setMatchError('')
    try {
      const res = await API.post('/match/skills', {
        jd_source_file: jdFile?.name || 'Job_Description.txt',
        candidate_skills: profile.skills,
        jd_skills: jdResult?.skills?.length ? jdResult.skills : [
          { skill_name: 'Data Structures & Algorithms', category_code: 'DSA', level: 9 },
          { skill_name: 'Coding (Python, C++)', category_code: 'COD', level: 9 },
          { skill_name: 'Distributed System Design', category_code: 'SYSD', level: 8 },
          { skill_name: 'Cloud & Infrastructure', category_code: 'CLOUD', level: 8 },
          { skill_name: 'SQL Databases', category_code: 'SQL', level: 7 },
          { skill_name: 'Operating Systems', category_code: 'OS', level: 8 },
        ],
        threshold: 70,
      })
      setMatchResult(res.data)
      done(5)
    } catch (e) {
      setMatchError(e?.response?.data?.detail || e.message)
    } finally {
      setMatchLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff' }}>
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />

      <Navbar
        activeUser={activeUser}
        setActiveUser={setActiveUser}
        candidateName={profile.name}
        onReset={handleReset}
        onOpenContact={() => setIsContactOpen(true)}
      />

      <Hero
        onExploreClick={scrollToEngine}
        onLoadDemoData={runFullDemo}
      />

      <FeatureCards onExploreClick={scrollToEngine} />
      <TechAreas />

      {/* 5-Role Pipeline Tool */}
      <section
        id="match-engine"
        ref={engineRef}
        style={{ background: '#fcfbf9', padding: '64px 48px 80px', borderTop: '1px solid #f1f5f9' }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <span style={{
              fontSize: '0.75rem', fontWeight: 700, color: '#df7a1a', background: '#fff7ed',
              border: '1px solid #fed7aa', padding: '4px 14px', borderRadius: 20,
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              Interactive AI Evaluation Engine
            </span>

            <h2 style={{
              fontFamily: 'var(--font-heading)', fontSize: '2.2rem', fontWeight: 800,              color: '#1e2530', marginTop: 10, marginBottom: 8, letterSpacing: '-0.02em',
            }}>
              5-Role Automated Talent Matching
            </h2>

            <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: 620, margin: '0 auto' }}>
              Built according to the RADIX Hackathon Brief: 12 skill categories, 3 companies, 6 official JDs, 4 test candidates, and Supabase Option 1 & 2 integration.
            </p>

            {/* Reset Pipeline Button — visible once pipeline is started */}
            {(step > 1 || completed.length > 0) && (
              <div style={{ marginTop: 18 }}>
                <button
                  onClick={handleReset}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    background: '#fef2f2', border: '1px solid #fecaca',
                    borderRadius: 8, padding: '8px 18px',
                    fontSize: '0.82rem', color: '#dc2626', cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  <Icon name="restart_alt" size={16} style={{ color: '#dc2626' }} />
                  Reset Pipeline
                </button>
              </div>
            )}
          </div>

          <StepNav current={step} completed={completed} onSelectStep={setStep} />

          {/* ═══ STEP 1: UPLOAD JD ═══ */}
          {step === 1 && (
            <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 36, boxShadow: 'var(--shadow)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 700, color: '#1e2530' }}>
                    Step 1 — Upload Job Description (Role 1)
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: 4 }}>
                    Upload your own JD file, or select one of the 6 official hackathon JDs across Google, Microsoft, and Oracle FSS.
                  </p>
                </div>
                <span style={{ background: '#fff7ed', color: '#df7a1a', border: '1px solid #fed7aa', padding: '4px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>
                  Role 1: JD Analytics
                </span>
              </div>

              {/* 6 Official Hackathon JDs Quick Selector */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                  ⚡ Quick Select Official Hackathon JD (Brief Page 11):
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                  {OFFICIAL_JDS.map(jd => (
                    <button
                      key={jd.id}
                      onClick={() => handleSelectOfficialJd(jd)}
                      style={{
                        textAlign: 'left',
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: selectedJdId === jd.id ? '2px solid #df7a1a' : '1px solid #e2e8f0',
                        background: selectedJdId === jd.id ? '#fff7ed' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#1e2530' }}>{jd.role}</div>
                      <div style={{ fontSize: '0.74rem', color: '#df7a1a', fontWeight: 600 }}>{jd.company}</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 2 }}>📍 {jd.location}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div style={{
                border: '2px dashed #cbd5e1', borderRadius: 14, padding: '30px 20px', textAlign: 'center',
                background: jdFile ? '#ecfdf5' : '#fcfbf9', cursor: 'pointer', userSelect: 'none',
              }}>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  style={{ display: 'none' }}
                  id="jd-file-input"
                  onChange={e => { if (e.target.files[0]) { setJdFile(e.target.files[0]); setJdResult(null) } }}
                />
                <label htmlFor="jd-file-input" style={{ cursor: 'pointer', display: 'block' }}>
                  <Icon name={jdFile ? "check_circle" : "cloud_upload"} size={36} style={{ color: jdFile ? '#059669' : '#df7a1a', marginBottom: 8 }} />
                  <p style={{ fontWeight: 600, color: '#1e2530', fontSize: '0.92rem' }}>
                    {jdFile ? `📄 ${jdFile.name} — ready to extract` : 'Or Drag & Drop Custom JD File (PDF, DOCX, TXT)'}
                  </p>
                  {jdFile && <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>Click "Extract JD Requirements" below to analyse it</p>}
                </label>
              </div>

              {jdError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', color: '#dc2626', fontSize: '0.85rem', marginTop: 14 }}>
                  ⚠️ {jdError}
                </div>
              )}

              {jdResult && (
                <div style={{ marginTop: 22, padding: 18, background: '#fff7ed', borderRadius: 12, border: '1px solid #fed7aa' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#df7a1a', marginBottom: 10 }}>
                    ✅ Extracted {jdResult.skills?.length || 0} skills for {jdResult.company} ({jdResult.role}):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {jdResult.skills?.map((s, i) => (
                      <span key={i} style={{ background: '#ffffff', border: '1px solid #fed7aa', color: '#1e2530', borderRadius: 20, padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600 }}>
                        {s.skill_name} <span style={{ color: '#df7a1a', fontSize: '0.68rem' }}>[{s.category_code}]</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 22, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  onClick={() => uploadJD()}
                  disabled={!jdFile || jdLoading}
                  style={{
                    padding: '12px 28px', borderRadius: 10,
                    background: (!jdFile || jdLoading) ? '#cbd5e1' : 'linear-gradient(135deg, #f5a623 0%, #df7a1a 100%)',
                    color: '#ffffff', border: 'none', fontWeight: 700, fontSize: '0.92rem',
                    cursor: (!jdFile || jdLoading) ? 'not-allowed' : 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                  }}
                >
                  <Icon name={jdLoading ? "progress_activity" : "manage_search"} size={18} />
                  {jdLoading ? 'Extracting Skills…' : jdResult ? 'Re-Extract JD Requirements' : 'Extract JD Requirements →'}
                </button>
                {!jdFile && (
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    ↑ Select an official JD above or drag-and-drop a file first
                  </span>
                )}
                {jdResult && (
                  <button onClick={goNext} style={{ padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', color: '#ffffff', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="arrow_forward" size={18} />
                    Continue to Resume Parsing
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ═══ STEP 2: UPLOAD RESUME ═══ */}
          {step === 2 && (
            <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 36, boxShadow: 'var(--shadow)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 700, color: '#1e2530' }}>
                    Step 2 — Upload Candidate Resume (Role 2)
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: 4 }}>
                    Upload your resume, or select one of the 4 official candidates from the Brief to test different competency archetypes.
                  </p>
                </div>
                <span style={{ background: '#fff7ed', color: '#df7a1a', border: '1px solid #fed7aa', padding: '4px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>
                  Role 2: Resume Parser
                </span>
              </div>

              {/* 4 Official Candidates Selector */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                  ⚡ Quick Select Official Hackathon Candidate (Brief Page 11):
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                  {OFFICIAL_CANDIDATES.map(cand => (
                    <button
                      key={cand.id}
                      onClick={() => handleSelectOfficialCandidate(cand)}
                      style={{
                        textAlign: 'left',
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: selectedCandidateId === cand.id ? '2px solid #059669' : '1px solid #e2e8f0',
                        background: selectedCandidateId === cand.id ? '#ecfdf5' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e2530' }}>{cand.name}</div>
                      <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600 }}>{cand.profile}</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 2 }}>{cand.fit}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div style={{
                border: '2px dashed #cbd5e1', borderRadius: 14, padding: '30px 20px', textAlign: 'center',
                background: resumeFile ? '#ecfdf5' : '#fcfbf9', cursor: 'pointer', userSelect: 'none',
              }}>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  style={{ display: 'none' }}
                  id="resume-file-input"
                  onChange={e => { if (e.target.files[0]) { setResumeFile(e.target.files[0]); setResumeResult(null) } }}
                />
                <label htmlFor="resume-file-input" style={{ cursor: 'pointer', display: 'block' }}>
                  <Icon name={resumeFile ? "check_circle" : "cloud_upload"} size={36} style={{ color: resumeFile ? '#059669' : '#df7a1a', marginBottom: 8 }} />
                  <p style={{ fontWeight: 600, color: '#1e2530', fontSize: '0.92rem' }}>
                    {resumeFile ? `📄 ${resumeFile.name} — ready to parse` : 'Or Drag & Drop Custom Resume File'}
                  </p>
                  {resumeFile && <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>Click "Parse Resume" below to extract competencies</p>}
                </label>
              </div>

              {resumeError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', color: '#dc2626', fontSize: '0.85rem', marginTop: 14 }}>
                  ⚠️ {resumeError}
                </div>
              )}

              {resumeResult && (
                <div style={{ marginTop: 22, padding: 18, background: '#ecfdf5', borderRadius: 12, border: '1px solid #a7f3d0' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#059669', marginBottom: 6 }}>
                    ✅ Parsed Candidate: {resumeResult.name} ({resumeResult.email})
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                    Found {resumeResult.skills?.length || 0} technical signals mapped to 12 categories.
                  </div>
                </div>
              )}

              <div style={{ marginTop: 22, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  onClick={() => uploadResume()}
                  disabled={!resumeFile || resumeLoading}
                  style={{
                    padding: '12px 28px', borderRadius: 10,
                    background: (!resumeFile || resumeLoading) ? '#cbd5e1' : 'linear-gradient(135deg, #f5a623 0%, #df7a1a 100%)',
                    color: '#ffffff', border: 'none', fontWeight: 700, fontSize: '0.92rem',
                    cursor: (!resumeFile || resumeLoading) ? 'not-allowed' : 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                  }}
                >
                  <Icon name={resumeLoading ? "progress_activity" : "person_search"} size={18} />
                  {resumeLoading ? 'Parsing Competencies…' : resumeResult ? 'Re-Parse Resume' : 'Parse Resume →'}
                </button>
                {!resumeFile && (
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    ↑ Select an official candidate above or drag-and-drop a resume file first
                  </span>
                )}
                {resumeResult && (
                  <button onClick={goNext} style={{ padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', color: '#ffffff', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="arrow_forward" size={18} />
                    Continue to Profile Builder
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ═══ STEP 3: EDIT PROFILE ═══ */}
          {step === 3 && (
            <ProfileBuilder
              profile={profile}
              onChange={setProfile}
              onSave={() => { done(3); goNext() }}
              activeUser={activeUser}
            />
          )}

          {/* ═══ STEP 4: TALENT CHECK ═══ */}
          {step === 4 && (
            <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 36, boxShadow: 'var(--shadow)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 700, color: '#1e2530' }}>
                    Step 4 — Company Benchmark Talent Check (Role 4)
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: 4 }}>
                    Evaluates candidate profile across all 12 RADIX skill categories against expected company bars using Supabase Table (Option 1) and JSON snapshot (Option 2).
                  </p>
                </div>
                <span style={{ background: '#fff7ed', color: '#df7a1a', border: '1px solid #fed7aa', padding: '4px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>
                  Option 1 & 2 Supabase
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                <div style={{ background: '#fcfbf9', borderRadius: 12, padding: 18, border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Candidate</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e2530', marginTop: 4 }}>{profile.name}</div>
                </div>
                <div style={{ background: '#fcfbf9', borderRadius: 12, padding: 18, border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Target Company</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#df7a1a', marginTop: 4 }}>{profile.company}</div>
                </div>
                <div style={{ background: '#fcfbf9', borderRadius: 12, padding: 18, border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Skillset Model</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e2530', marginTop: 4 }}>12 Skill Categories</div>
                </div>
              </div>

              {talentError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', color: '#dc2626', fontSize: '0.85rem', marginBottom: 16 }}>
                  ⚠️ {talentError}
                </div>
              )}

              <button
                onClick={runTalentCheck}
                disabled={talentLoading}
                style={{
                  padding: '12px 30px', borderRadius: 10,
                  background: talentLoading ? '#cbd5e1' : 'linear-gradient(135deg, #f5a623 0%, #df7a1a 100%)',
                  color: '#ffffff', border: 'none', fontWeight: 700, fontSize: '0.95rem', cursor: talentLoading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                }}
              >
                <Icon name="leaderboard" size={18} />
                {talentLoading ? 'Evaluating against 12 Skillset Bars…' : `Evaluate vs ${profile.company} Bar`}
              </button>

              {talentResult && (
                <TalentResult
                  data={talentResult}
                  onNext={goNext}
                  onStartMockInterview={handleOpenMockScreen}
                />
              )}
            </div>
          )}

          {/* ═══ STEP 5: SKILL MATCHING ═══ */}
          {step === 5 && (
            <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 36, boxShadow: 'var(--shadow)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 700, color: '#1e2530' }}>
                    Step 5 — Fuzzy Skill Matching & Gap Intelligence (Role 5)
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: 4 }}>
                    Token-set ratio fuzzy algorithm matching candidate skills directly against required JD skills.
                  </p>
                </div>
                <span style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '4px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>
                  Role 5: Fuzzy Match
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div style={{ background: '#fff7ed', borderRadius: 12, padding: '18px 20px', border: '1px solid #fed7aa' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#df7a1a', marginBottom: 10, textTransform: 'uppercase' }}>
                    JD Required Skills ({jdResult?.skills?.length || 8})
                  </div>
                  {(jdResult?.skills || profile.skills).slice(0, 6).map((s, i) => (
                    <div key={i} style={{ fontSize: '0.84rem', color: '#334155', padding: '3px 0' }}>
                      • {s.skill_name} <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>[{s.category_code}]</span>
                    </div>
                  ))}
                </div>

                <div style={{ background: '#ecfdf5', borderRadius: 12, padding: '18px 20px', border: '1px solid #a7f3d0' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#059669', marginBottom: 10, textTransform: 'uppercase' }}>
                    Candidate Profile Skills ({profile.skills.length})
                  </div>
                  {profile.skills.slice(0, 6).map((s, i) => (
                    <div key={i} style={{ fontSize: '0.84rem', color: '#334155', padding: '3px 0' }}>
                      • {s.skill_name} <span style={{ color: '#059669', fontSize: '0.75rem', fontWeight: 600 }}>Lvl {s.level}</span>
                    </div>
                  ))}
                </div>
              </div>

              {matchError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', color: '#dc2626', fontSize: '0.85rem', marginBottom: 16 }}>
                  ⚠️ {matchError}
                </div>
              )}

              <button
                onClick={runSkillMatch}
                disabled={matchLoading}
                style={{
                  padding: '12px 32px', borderRadius: 10,
                  background: matchLoading ? '#cbd5e1' : 'linear-gradient(135deg, #f5a623 0%, #df7a1a 100%)',
                  color: '#ffffff', border: 'none', fontWeight: 700, fontSize: '0.95rem', cursor: matchLoading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                }}
              >
                <Icon name="hub" size={18} />
                {matchLoading ? 'Executing Fuzzy Match Algorithm…' : 'Calculate Skill Match & Gaps'}
              </button>

              {matchResult && (
                <MatchResult
                  data={matchResult}
                  candidateName={profile.name}
                  company={profile.company}
                  onStartMockInterview={handleOpenMockScreen}
                />
              )}
            </div>
          )}

          {/* Navigation controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }}>
            {step > 1 ? (
              <button
                onClick={() => setStep(s => s - 1)}
                style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px 20px', fontSize: '0.88rem', fontWeight: 600, color: '#475569', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Icon name="arrow_back" size={16} />
                Previous Step
              </button>
            ) : <div />}

            {step < 5 && completed.includes(step) && (
              <button
                onClick={goNext}
                style={{ background: '#fce3a9', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: '0.88rem', fontWeight: 700, color: '#854d0e', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                Next Step
                <Icon name="arrow_forward" size={16} />
              </button>
            )}
          </div>
        </div>
      </section>

      <TestimonialSection />
      <BlogsSection />
      <CorporateFooter onOpenContact={() => setIsContactOpen(true)} />

      {/* 🚀 Role 6 — Live Mock Interview Simulator Modal */}
      <MockInterviewModal
        isOpen={isMockModalOpen}
        onClose={() => setIsMockModalOpen(false)}
        company={profile.company}
        candidateName={profile.name}
        role={profile.preferred_roles?.[0] || 'Software Engineer'}
        skillGaps={talentResult?.skillset_gap || []}
        highlightGap={mockModalGap}
      />
    </div>
  )
}
