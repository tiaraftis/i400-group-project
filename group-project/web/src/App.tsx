import { useState, useEffect } from 'react'
import { supabase } from './supabase'

function App() {
  const [session, setSession] = useState<any>(null)
  const [userRole, setUserRole] = useState<'skater' | 'coach' | 'admin' | 'instructor'>('skater')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [classes, setClasses] = useState<any[]>([])
  const [registrations, setRegistrations] = useState<any[]>([])
  
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
  const [newClassEndTime, setNewClassEndTime] = useState('')
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

    const fetchRegistrations = async () => {
      const { data, error } = await supabase.from('class_registrations').select('*')
      if (!error && data) setRegistrations(data)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user?.id) fetchRole(session.user.id)
      if (session) {
        fetchClasses()
        fetchRegistrations()
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user?.id) {
        fetchRole(session.user.id)
        fetchClasses()
        fetchRegistrations()
      } else {
        setUserRole('skater')
        setClasses([])
        setRegistrations([])
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

        if (password.length < 5) {
          throw new Error('Password must be at least 5 characters long.')
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            }
          }
        })
        
        if (error) throw error

        if (data?.user) {
          // Explicitly insert into public.users to handle cases where the db trigger is missing/failing
          const { error: insertError } = await supabase.from('users').insert({ id: data.user.id })
          if (insertError && !insertError.message.includes("duplicate key")) {
            console.error("Manual insert to users table failed:", insertError)
          }
        }
        
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
    
    if (!newClassTime || !newClassEndTime) return alert("Please specify both a start and end time.")

    const requestedStartObj = new Date(newClassTime)
    const requestedEndObj = new Date(newClassEndTime)
    
    if (requestedEndObj <= requestedStartObj) {
      return alert("End time must be after the start time.")
    }

    const requestedStartEpoch = requestedStartObj.getTime()
    const requestedEndEpoch = requestedEndObj.getTime()
    const dbFormattedStartISO = requestedStartObj.toISOString()
    const dbFormattedEndISO = requestedEndObj.toISOString()

    const zoneConflict = classes.find(c => {
      if (c.rink_location !== newClassZone || c.class_id === editingClassId) return false;
      const existStart = new Date(c.starts_at).getTime()
      const existEnd = new Date(c.ends_at).getTime()
      return (requestedStartEpoch < existEnd && requestedEndEpoch > existStart)
    })

    if (zoneConflict) {
      return alert(`Zone Conflict! "${zoneConflict.title}" is already scheduled in Zone ${newClassZone} during this time block.`)
    }

    const coachConflict = classes.find(c => {
      if (c.coach_name !== newClassCoach || c.class_id === editingClassId) return false;
      const existStart = new Date(c.starts_at).getTime()
      const existEnd = new Date(c.ends_at).getTime()
      return (requestedStartEpoch < existEnd && requestedEndEpoch > existStart)
    })

    if (coachConflict) {
      return alert(`Instructor Double-Booked! ${newClassCoach} is already scheduled to teach "${coachConflict.title}" during this time block.`)
    }

    const payload = {
      title: newClassName,
      level: newClassLevel,
      description: newClassDesc,
      coach_name: newClassCoach,
      rink_location: newClassZone,
      starts_at: dbFormattedStartISO,
      ends_at: dbFormattedEndISO,
      capacity: parseInt(newClassCapacity) || 15
    }

    if (editingClassId) {
      // UPDATE EXISTING
      const { data, error } = await supabase.from('skating_classes').update(payload).eq('class_id', editingClassId).select()
      
      if (error) {
        alert("Error updating class: " + error.message)
      } else if (data) {
        setClasses(classes.map(c => c.class_id === editingClassId ? data[0] : c))
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
    setNewClassEndTime('')
    setNewClassZone('A')
    setNewClassCapacity('15')
  }

  const handleSelectClassForEdit = (cls: any) => {
    setEditingClassId(cls.class_id)
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
    
    if (cls.ends_at) {
        const endDbDate = new Date(cls.ends_at)
        const endLocalISOTime = new Date(endDbDate.getTime() - tzOffsetMs).toISOString().slice(0, 16)
        setNewClassEndTime(endLocalISOTime)
    } else {
        setNewClassEndTime('')
    }
  }

  const handleDeleteClass = async (id: string) => {
    if (!confirm("Are you absolutely sure you want to permanently delete this scheduled class?")) return;
    
    const { error } = await supabase.from('skating_classes').delete().eq('class_id', id)
    if (error) {
      alert("Failed to delete class: " + error.message)
    } else {
      setClasses(classes.filter(c => c.class_id !== id))
      if (editingClassId === id) cancelForm()
    }
  }

  const handleUnenrollFromClass = async (cls: any) => {
    if (!confirm(`Are you absolutely sure you want to unenroll from ${cls.title}?`)) return;

    const { error } = await supabase
      .from('class_registrations')
      .delete()
      .eq('skater_id', session.user.id)
      .eq('class_id', cls.class_id);

    if (error) {
      alert("Failed to unenroll: " + error.message);
    } else {
      setRegistrations(registrations.filter(r => !(r.skater_id === session.user.id && r.class_id === cls.class_id)));
    }
  }

  const handleSignUpForClass = async (cls: any) => {
    // Prevent signing up for two classes at identical date+time
    const myRegistrations = registrations.filter(r => r.skater_id === session?.user?.id);
    const myClasses = classes.filter(c => myRegistrations.some(r => r.class_id === c.class_id));
    
    const reqStart = new Date(cls.starts_at).getTime();
    const reqEnd = new Date(cls.ends_at).getTime();
    
    const conflict = myClasses.find(myCls => {
      const existStart = new Date(myCls.starts_at).getTime();
      const existEnd = new Date(myCls.ends_at).getTime();
      return (reqStart < existEnd && reqEnd > existStart);
    });

    if (conflict) {
      return alert(`Time conflict! You are already taking "${conflict.title}" at this exact time.`);
    }

    // Class Capacity Check
    const currentRegCount = registrations.filter(r => r.class_id === cls.class_id).length;
    if (currentRegCount >= cls.capacity) {
      return alert("Sorry! This class has reached its capacity limit.");
    }

    // Proceed to sign up
    const { data, error } = await supabase.from('class_registrations').insert([{
      skater_id: session.user.id,
      class_id: cls.class_id
    }]).select();

    if (error) {
      alert("Uh oh! Failed to sign up: " + error.message);
    } else if (data) {
      setRegistrations([...registrations, ...data]);
      alert(`Success! You're now registered for ${cls.title}!`);
    }
  }

  // Helper formatting for timestamps
  const formatScheduleTimeBlock = (startIso: string, endIso: string) => {
    if (!startIso) return ''
    const date = new Date(startIso)
    if (isNaN(date.getTime())) return startIso
    
    const startStr = date.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })
    if (!endIso) return startStr
    
    const end = new Date(endIso)
    const endStr = end.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' })
    return `${startStr} - ${endStr}`
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
      desc: (userRole === 'coach' || userRole === 'instructor') ? 'View your upcoming classes.' : userRole === 'admin' ? "Scroll down to add a new class, or click 'Edit Classes' and choose a class to modify its details." : "View upcoming schedules, sign up for private ice time, and navigate the Bloomington rink map.",
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
          <aside className={`sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
              <div className="sidebar-header">
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/>
                          <path d="M6.5 10C6.5 10 10.5 12 12 12C13.5 12 17.5 10 17.5 10"/>
                          <path d="M6.5 14C6.5 14 10.5 16 12 16C13.5 16 17.5 14 17.5 14"/>
                      </svg>
                      <h3>Skating Portal</h3>
                  </div>
                  <button 
                    className="sidebar-close-btn" 
                    onClick={() => setIsSidebarOpen(false)}
                    title="Close Sidebar"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
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
              {!isSidebarOpen && (
                  <button 
                    className="sidebar-toggle-btn" 
                    onClick={() => setIsSidebarOpen(true)}
                    title="Open Sidebar"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="3" y1="12" x2="21" y2="12"></line>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                  </button>
              )}

              <div className="welcome-header">
                  <h1>
                    Welcome, {displayName}! 
                    <span className={`role-badge ${userRole}`}>{userRole}</span>
                  </h1>
                  {userRole === 'skater' && <p>Select an option from the sidebar to view your progress.</p>}
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
                        {classes.filter(cls => (userRole !== 'coach' && userRole !== 'instructor') || cls.coach_name === displayName).length === 0 ? (
                            <p style={{color: '#94a3b8', fontStyle: 'italic', textAlign: 'center'}}>No classes scheduled yet.</p>
                        ) : (
                            classes.filter(cls => (userRole !== 'coach' && userRole !== 'instructor') || cls.coach_name === displayName).map(cls => (
                                <div className={`class-item ${editingClassId === cls.class_id ? 'editing-active' : ''}`} key={cls.class_id}>
                                    <div className="class-letter">{cls.rink_location.replace('Zone ', '')}</div>
                                    <div className="class-info" style={{ flex: 1 }}>
                                        <strong>{cls.title}</strong>
                                        <span>{cls.level} - {cls.coach_name}</span>
                                        <span style={{ display: 'block', fontSize: '13px', color: '#6ee7b7', marginTop: '4px' }}>
                                            {registrations.filter(r => r.class_id === cls.class_id).length} / {cls.capacity} Enrolled
                                        </span>
                                    </div>
                                    <div className="class-time">{formatScheduleTimeBlock(cls.starts_at, cls.ends_at)}</div>
                                    
                                    {/* Action Buttons for Skaters */}
                                    {userRole === 'skater' && (
                                        <div className="class-actions" style={{ display: 'flex', marginLeft: '15px' }}>
                                            {registrations.some(r => r.class_id === cls.class_id && r.skater_id === session?.user?.id) ? (
                                                <button type="button" onClick={() => handleUnenrollFromClass(cls)} className="glow-effect" title="Click to unenroll" style={{ padding: '6px 12px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#f43f5e', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Unenroll</button>
                                            ) : registrations.filter(r => r.class_id === cls.class_id).length >= cls.capacity ? (
                                                <button disabled style={{ padding: '6px 12px', background: 'rgba(244, 63, 94, 0.2)', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#f43f5e', borderRadius: '6px', cursor: 'default', fontWeight: 600 }}>Full</button>
                                            ) : (
                                                <button type="button" onClick={() => handleSignUpForClass(cls)} className="glow-effect" style={{ padding: '6px 12px', background: '#38bdf8', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Sign Up!</button>
                                            )}
                                        </div>
                                    )}

                                    {/* Action Buttons for Admins Tracking Status */}
                                    {isEditing && (
                                        <div className="class-actions" style={{display: 'flex', gap: '8px', marginLeft: '15px'}}>
                                            <button type="button" onClick={() => handleSelectClassForEdit(cls)} style={{padding: '6px 12px', background: 'transparent', border: '1px solid rgba(56, 189, 248, 0.4)', color: '#38bdf8', borderRadius: '6px', cursor: 'pointer'}}>Edit</button>
                                            <button type="button" onClick={() => handleDeleteClass(cls.class_id)} style={{padding: '6px 12px', background: 'transparent', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#f43f5e', borderRadius: '6px', cursor: 'pointer'}}>Delete</button>
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
                                <div className="input-group full-width-input">
                                    <label>Description</label>
                                    <input type="text" value={newClassDesc} onChange={e => setNewClassDesc(e.target.value)} placeholder="Short description of the class..." required />
                                </div>
                                <div className="input-group">
                                    <label>Assigned Coach</label>
                                    <input type="text" value={newClassCoach} onChange={e => setNewClassCoach(e.target.value)} placeholder="Type the first and last name only of the coach ex. 'John Apple'" required />
                                </div>
                                <div className="input-group">
                                    <label>Capacity</label>
                                    <input type="number" min="1" max="50" value={newClassCapacity} onChange={e => setNewClassCapacity(e.target.value)} required />
                                </div>
                                <div className="input-group">
                                    <label>Schedule Start</label>
                                    <input type="datetime-local" value={newClassTime} onChange={e => setNewClassTime(e.target.value)} required />
                                </div>
                                <div className="input-group">
                                    <label>Schedule End</label>
                                    <input type="datetime-local" value={newClassEndTime} onChange={e => setNewClassEndTime(e.target.value)} required />
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
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required={!isLogin} minLength={5} />
                </div>
                <div className="input-group">
                    <label>Confirm Password</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required={!isLogin} minLength={5} />
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
