import { useState, useEffect } from 'react'
import { supabase } from './supabase'

function App() {
  const [session, setSession] = useState<any>(null)
  
  // Auth Form State
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Dashboard Nav State
  const [activeTab, setActiveTab] = useState('ratings')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      if (isLogin) {
        // Log In implementation
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      } else {
        // Sign Up implementation
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match. Please try again.')
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            }
          }
        })
        
        if (error) throw error
        alert(`Account created successfully! Welcome to the Bloomington Figure Skating Club, ${name}.`)
      }
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  // Dashboard Context Data
  const tabData: Record<string, { title: string, desc: string, icon: JSX.Element }> = {
    ratings: {
      title: "Student Ratings",
      desc: "You have no new ratings at this time. Complete a test session with a coach to see your score!",
      icon: (
        <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
        </svg>
      )
    },
    feedback: {
      title: "Coach Feedback",
      desc: "Keep up the good work on your edges! Your coach will leave written feedback here after your next evaluation.",
      icon: (
        <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
      )
    },
    navigations: {
      title: "Rink Navigations",
      desc: "View upcoming schedules, sign up for private ice time, and navigate the Bloomington rink map.",
      icon: (
        <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
        </svg>
      )
    }
  }

  // Determine user display name
  const displayName = session?.user?.user_metadata?.full_name 
                      || session?.user?.email?.split('@')[0] 
                      || 'Skater'

  // If Session active => Show Dashboard
  if (session) {
    const currentTabInfo = tabData[activeTab]
    return (
      <div className="dashboard-layout">
          <aside className="sidebar">
              <div className="sidebar-header">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/>
                      <path d="M7 14L8.5 9.5L12 8L15.5 9.5L17 14"/>
                      <path d="M9 17.5L12 15L15 17.5"/>
                  </svg>
                  <h3>BFSC Portal</h3>
              </div>
              
              <nav className="nav-menu">
                  {Object.keys(tabData).map((tab) => (
                    <div 
                      key={tab}
                      className={`nav-item ${activeTab === tab ? 'active' : ''}`} 
                      onClick={() => setActiveTab(tab)}
                    >
                        {tabData[tab].icon}
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </div>
                  ))}
              </nav>

              <button onClick={handleLogout} className="logout-btn">
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Log Out
              </button>
          </aside>

          <main className="main-content">
              <div className="welcome-header">
                  <h1>Welcome, {displayName}!</h1>
                  <p>Select an option from the sidebar to view your progress.</p>
              </div>

              <div key={activeTab} className="content-card">
                  <div className="tab-icon">
                      {currentTabInfo.icon}
                  </div>
                  <h2>{currentTabInfo.title}</h2>
                  <p>{currentTabInfo.desc}</p>
              </div>
          </main>
      </div>
    )
  }

  // Pre-Authentication: Show Login/Signup Box
  return (
    <main className="auth-container">
        {/* LOGIN FORM */}
        <div className={`form-box ${isLogin ? 'active' : 'hidden'}`}>
            <div className="form-header">
                <svg className="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#38bdf8" strokeWidth="2"/>
                    <path d="M7 14L8.5 9.5L12 8L15.5 9.5L17 14" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 17.5L12 15L15 17.5" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h2>Welcome Back</h2>
                <p>Enter your details to access your account</p>
            </div>
            
            <form onSubmit={handleAuth} className="auth-form">
                <div className="input-group">
                    <label>Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="skater@example.com" required />
                </div>
                <div className="input-group">
                    <label>Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                </div>
                {errorMsg && isLogin && <div className="error-message">{errorMsg}</div>}
                <button type="submit" disabled={loading} className="submit-btn glow-effect">
                  {loading ? 'Logging In...' : 'Log In'}
                </button>
            </form>
            
            <p className="toggle-text">
                Don't have an account? <span className="link" onClick={() => { setIsLogin(false); setErrorMsg(''); }}>Sign up here</span>
            </p>
        </div>

        {/* SIGNUP FORM */}
        <div className={`form-box signup-box ${!isLogin ? 'active' : 'hidden'}`}>
            <div className="form-header">
                <svg className="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#6ee7b7" strokeWidth="2"/>
                    <path d="M7 14L8.5 9.5L12 8L15.5 9.5L17 14" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 17.5L12 15L15 17.5" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h2>Join Our School</h2>
                <p>Start your skating journey today</p>
            </div>
            
            <form onSubmit={handleAuth} className="auth-form">
                <div className="input-group">
                    <label>Full Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" required={!isLogin} />
                </div>
                <div className="input-group">
                    <label>Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="skater@example.com" required={!isLogin} />
                </div>
                <div className="input-group">
                    <label>Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required={!isLogin} />
                </div>
                <div className="input-group">
                    <label>Confirm Password</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required={!isLogin} />
                </div>
                {errorMsg && !isLogin && <div className="error-message">{errorMsg}</div>}
                
                <button type="submit" disabled={loading} className="submit-btn outline glow-effect">
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
            </form>
            
            <p className="toggle-text">
                Already have an account? <span className="link" onClick={() => { setIsLogin(true); setErrorMsg(''); }}>Log in here</span>
            </p>
        </div>
    </main>
  )
}

export default App
