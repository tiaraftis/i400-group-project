import { useState, useEffect } from 'react'
import { supabase } from './supabase'

function App() {
  const [session, setSession] = useState<any>(null)
  const [userRole, setUserRole] = useState<'skater' | 'coach' | 'admin'>('skater')
  const [classes, setClasses] = useState<any[]>([])
  
  // Auth Form State
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Dashboard Nav State
  const [activeTab, setActiveTab] = useState('navigations')
  
  // Admin Form State
  const [isEditing, setIsEditing] = useState(false)
  const [editingClassId, setEditingClassId] = useState<string | null>(null)
  
  const [newClassName, setNewClassName] = useState('')
  const [newClassLevel, setNewClassLevel] = useState('Basic 1')
  const [newClassDesc, setNewClassDesc] = useState('')
  const [newClassCoach, setNewClassCoach] = useState('')
  const [newClassTime, setNewClassTime] = useState('')
  const [newClassZone, setNewClassZone] = useState('A')
  const [newClassCapacity, setNewClassCapacity] = useState('15')

  useEffect(() => {
    const fetchRole = async (userId: string) => {
      try {
        const { data, error } = await supabase.from('users').select('role').eq('id', userId).maybeSingle()
        if (error) console.error("Error fetching role:", error);
        if (data && data.role) {
          setUserRole(data.role)
        } else {
          setUserRole('skater')
        }
      } catch (e) {
        console.error("Role fetch exception:", e)
      }
    }

    const fetchClasses = async () => {
      const { data, error } = await supabase.from('skating_classes').select('*').order('created_at', { ascending: true })
      if (!error && data) setClasses(data)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user?.id) fetchRole(session.user.id)
      if (session) fetchClasses()
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user?.id) {
        fetchRole(session.user.id)
        fetchClasses()
      } else {
        setUserRole('skater')
        setClasses([])
      }
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
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error("Error signing out:", e)
    } finally {
      setSession(null)
      setUserRole('skater')
      setClasses([])
      setActiveTab('ratings')
    }
  }

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newClassTime) return alert("Please specify a valid class time.")

    // Convert local HTML input string to an exact standardized JS Date Time point
    const requestedDateObj = new Date(newClassTime)
    const requestedEpoch = requestedDateObj.getTime()
    const dbFormattedISO = requestedDateObj.toISOString() // This converts it to UTC appropriately for Supabase
    
    // Duplicate check: Same Zone AND Same Time (comparing explicit milliseconds)
    // Make sure we bypass the conflict check if the conflicting class is the one we are currently editing!
    const conflict = classes.find(c => 
      c.rink_location === newClassZone && 
      new Date(c.starts_at).getTime() === requestedEpoch &&
      c.id !== editingClassId
    )

    if (conflict) {
      return alert(`Slot taken! "${conflict.title}" with ${conflict.coach_name} is already scheduled in Zone ${newClassZone} at that precise time.`)
    }

    const payload = {
      title: newClassName,
      level: newClassLevel,
      description: newClassDesc,
      coach_name: newClassCoach,
      rink_location: newClassZone,
      starts_at: dbFormattedISO,
      capacity: parseInt(newClassCapacity) || 15
    }

    if (editingClassId) {
      // UPDATE EXISTING
      const { data, error } = await supabase.from('skating_classes').update(payload).eq('id', editingClassId).select()
      
      if (error) {
        alert("Error updating class: " + error.message)
      } else if (data) {
        setClasses(classes.map(c => c.id === editingClassId ? data[0] : c))
        alert('Class successfully updated!')
        cancelForm()
      }
    } else {
      // INSERT NEW
      const payloadWithCreator = { ...payload, created_by: session.user.id }
      const { data, error } = await supabase.from('skating_classes').insert([payloadWithCreator]).select()

      if (error) {
        alert("Error adding class: " + error.message)
      } else if (data) {
        setClasses([...classes, ...data])
        alert('Success! The new class has been added to the schedule.')
        cancelForm()
      }
    }
  }

  const cancelForm = () => {
    setEditingClassId(null)
    setNewClassName('')
    setNewClassLevel('Basic 1')
    setNewClassDesc('')
    setNewClassCoach('')
    setNewClassTime('')
    setNewClassZone('A')
    setNewClassCapacity('15')
  }

  const handleSelectClassForEdit = (cls: any) => {
    setEditingClassId(cls.id)
    setNewClassName(cls.title)
    setNewClassLevel(cls.level)
    setNewClassDesc(cls.description)
    setNewClassCoach(cls.coach_name)
    setNewClassZone(cls.rink_location)
    setNewClassCapacity(cls.capacity.toString())
    
    // Convert UTC from DB exactly down to Local Browser Time for HTML input [datetime-local] mapping
    const dbDate = new Date(cls.starts_at)
    const tzOffsetMs = dbDate.getTimezoneOffset() * 60000
    const localISOTime = new Date(dbDate.getTime() - tzOffsetMs).toISOString().slice(0, 16)
    setNewClassTime(localISOTime)
  }

  const handleDeleteClass = async (id: string) => {
    if (!confirm("Are you absolutely sure you want to permanently delete this scheduled class?")) return;
    
    const { error } = await supabase.from('skating_classes').delete().eq('id', id)
    if (error) {
      alert("Failed to delete class: " + error.message)
    } else {
      setClasses(classes.filter(c => c.id !== id))
      if (editingClassId === id) cancelForm()
    }
  }

  // Helper formatting for timestamps
  const formatScheduleTime = (isoString: string) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return isoString // fallback to literal text
    return date.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })
  }

  // Dashboard Context Data
  const tabData: Record<string, { title: string, desc: string, icon: React.ReactNode }> = {
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
                  <h1>
                    Welcome, {displayName}! 
                    <span className={`role-badge ${userRole}`}>{userRole}</span>
                  </h1>
                  <p>Select an option from the sidebar to view your progress.</p>
              </div>

              {activeTab === 'navigations' ? (
                <div className="content-card rink-container">
                    <div className="rink-header">
                        <h2 style={{ marginBottom: 0 }}>{currentTabInfo.title}</h2>
                        {userRole === 'admin' && (
                            <button 
                                className="edit-rink-btn glow-effect" 
                                onClick={() => {
                                    setIsEditing(!isEditing);
                                    if (isEditing) cancelForm();
                                }}
                            >
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                                    {isEditing ? (
                                        <path d="M18 6L6 18M6 6l12 12"></path>
                                    ) : (
                                        <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></>
                                    )}
                                </svg>
                                {isEditing ? 'Exit Edit Mode' : 'Edit Classes'}
                            </button>
                        )}
                    </div>
                    <p className="rink-desc" style={{textAlign: 'left', marginBottom: '30px'}}>{currentTabInfo.desc} Check the schedule below to match classes to their rink zones!</p>
                    
                    <div className="rink-shape">
                        <div className="center-line"></div>
                        <div className="center-circle"></div>

                        {/* 4 Quadrants with Dots */}
                        <div className="quadrant top-left">
                            <div className="rink-dot">A</div>
                        </div>
                        <div className="quadrant top-right">
                            <div className="rink-dot">B</div>
                        </div>
                        <div className="quadrant bottom-left">
                            <div className="rink-dot">C</div>
                        </div>
                        <div className="quadrant bottom-right">
                            <div className="rink-dot">D</div>
                        </div>
                    </div>

                    <div className="class-schedule-list">
                        {classes.length === 0 ? (
                            <p style={{color: '#94a3b8', fontStyle: 'italic', textAlign: 'center'}}>No classes scheduled yet.</p>
                        ) : (
                            classes.map(cls => (
                                <div className={`class-item ${editingClassId === cls.id ? 'editing-active' : ''}`} key={cls.id}>
                                    <div className="class-letter">{cls.rink_location.replace('Zone ', '')}</div>
                                    <div className="class-info">
                                        <strong>{cls.title}</strong>
                                        <span>{cls.level} - {cls.coach_name}</span>
                                    </div>
                                    <div className="class-time">{formatScheduleTime(cls.starts_at)}</div>
                                    
                                    {/* Action Buttons for Admins Tracking Status */}
                                    {isEditing && (
                                        <div className="class-actions" style={{display: 'flex', gap: '8px', marginLeft: '15px'}}>
                                            <button type="button" onClick={() => handleSelectClassForEdit(cls)} style={{padding: '6px 12px', background: 'transparent', border: '1px solid rgba(56, 189, 248, 0.4)', color: '#38bdf8', borderRadius: '6px', cursor: 'pointer'}}>Edit</button>
                                            <button type="button" onClick={() => handleDeleteClass(cls.id)} style={{padding: '6px 12px', background: 'transparent', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#f43f5e', borderRadius: '6px', cursor: 'pointer'}}>Delete</button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                    
                    {/* Admin Management Terminal */}
                    {userRole === 'admin' && (
                        <div className="admin-panel" style={{border: editingClassId ? '1px solid rgba(56, 189, 248, 0.5)' : ''}}>
                            <h3>
                                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                {editingClassId ? 'Update Existing Class' : 'Admin Class Management'}
                            </h3>
                            <p style={{marginBottom: '20px', color: '#cbd5e1', fontSize: '14px'}}>
                                {editingClassId ? 'Modify details below and push changes to immediately update database.' : 'Add a new class directly to the skating rink zones.'}
                            </p>
                            
                            <form className="admin-form" onSubmit={handleSaveClass}>
                                <div className="input-group">
                                    <label>Class Name</label>
                                    <input type="text" value={newClassName} onChange={e => setNewClassName(e.target.value)} placeholder="E.g., Elite Spins" required />
                                </div>
                                <div className="input-group">
                                    <label>Class Level</label>
                                    <select value={newClassLevel} onChange={e => setNewClassLevel(e.target.value)} required>
                                        <option value="Basic 1">Basic 1</option>
                                        <option value="Basic 2">Basic 2</option>
                                        <option value="Basic 3">Basic 3</option>
                                        <option value="Basic 4">Basic 4</option>
                                        <option value="Freestyle 1">Freestyle 1</option>
                                        <option value="Freestyle 2">Freestyle 2</option>
                                        <option value="Freestyle 3">Freestyle 3</option>
                                        <option value="Advanced">Advanced</option>
                                        <option value="All Levels">All Levels</option>
                                    </select>
                                </div>
                                <div className="input-group" style={{gridColumn: 'span 2'}}>
                                    <label>Description</label>
                                    <input type="text" value={newClassDesc} onChange={e => setNewClassDesc(e.target.value)} placeholder="Short description of the class..." required />
                                </div>
                                <div className="input-group">
                                    <label>Assigned Coach</label>
                                    <input type="text" value={newClassCoach} onChange={e => setNewClassCoach(e.target.value)} placeholder="E.g., Coach Sarah" required />
                                </div>
                                <div className="input-group">
                                    <label>Capacity</label>
                                    <input type="number" min="1" max="50" value={newClassCapacity} onChange={e => setNewClassCapacity(e.target.value)} required />
                                </div>
                                <div className="input-group">
                                    <label>Schedule Time</label>
                                    <input type="datetime-local" value={newClassTime} onChange={e => setNewClassTime(e.target.value)} required />
                                </div>
                                <div className="input-group">
                                    <label>Rink Zone</label>
                                    <select value={newClassZone} onChange={e => setNewClassZone(e.target.value)} required>
                                        <option value="A">Zone A</option>
                                        <option value="B">Zone B</option>
                                        <option value="C">Zone C</option>
                                        <option value="D">Zone D</option>
                                    </select>
                                </div>
                                <button type="submit" className="add-class-btn" style={{background: editingClassId ? '#38bdf8' : ''}}>
                                    {editingClassId ? 'Push Update' : 'Save New Class'}
                                </button>
                                {editingClassId && (
                                    <button type="button" onClick={cancelForm} className="add-class-btn" style={{background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', marginTop: '5px'}}>
                                        Cancel Editing
                                    </button>
                                )}
                            </form>
                        </div>
                    )}
                </div>
              ) : (
                <div key={activeTab} className="content-card">
                    <div className="tab-icon">
                        {currentTabInfo.icon}
                    </div>
                    <h2>{currentTabInfo.title}</h2>
                    <p>{currentTabInfo.desc}</p>
                </div>
              )}
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
