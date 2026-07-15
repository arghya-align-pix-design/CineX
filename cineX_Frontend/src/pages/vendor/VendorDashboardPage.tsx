import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../existing/context/AuthContext'
import {
  LayoutDashboard,
  Building2,
  Calendar,
  Mail,
  Plus,
  Trash2,
  Grid,
  Send,
  Check,
  X,
  MessageSquare,
  LogOut,
  Clock,
  Sparkles,
  AlertTriangle
} from 'lucide-react'
import {
  fetchVendorStats,
  fetchVendorShows,
  createShow,
  fetchAvailableMovies,
  fetchMyTheatres,
  createTheatre,
  createScreen,
  deleteScreen,
  type VendorStats,
  type Theatre,
  type Screen,
  type ScreenRequest,
  type Movie,
  type Show
} from '../../services/vendorApi'
import {
  fetchInbox,
  sendMessage,
  markAsRead,
  fetchUnreadCount,
  type MessageResponse
} from '../../services/messageApi'
import TheatreLayoutBuilder from '../../components/TheatreLayoutBuilder'

type Tab = 'overview' | 'theatres' | 'scheduler' | 'inbox'

export default function VendorDashboardPage() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Data States
  const [stats, setStats] = useState<VendorStats | null>(null)
  const [theatres, setTheatres] = useState<Theatre[]>([])
  const [shows, setShows] = useState<Show[]>([])
  const [movies, setMovies] = useState<Movie[]>([])
  const [messages, setMessages] = useState<MessageResponse[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Interactive UI Modal / Form States
  const [isTheatreModalOpen, setIsTheatreModalOpen] = useState(false)
  const [theatreForm, setTheatreForm] = useState({
    name: '',
    addressLine: '',
    pincode: '',
    city: '',
    district: '',
    state: '',
    openTime: '09:00',
    closeTime: '23:00',
    hasRecliner: false
  })

  const [expandedTheatreId, setExpandedTheatreId] = useState<number | null>(null)
  const [isScreenModalOpen, setIsScreenModalOpen] = useState(false)
  const [screenTheatreId, setScreenTheatreId] = useState<number | null>(null)
  const [screenForm, setScreenForm] = useState<ScreenRequest>({
    name: '',
    soundSystem: 'Dolby Atmos',
    projection: '4K Projection',
    maxCapacity: 200
  })
  const [activeDesignScreen, setActiveDesignScreen] = useState<Screen | null>(null)

  // Show Scheduler states
  const [schedulerForm, setSchedulerForm] = useState({
    theatreId: '',
    screenId: '',
    movieId: '',
    showDate: '',
    showTime: '18:00',
    basePrice: 150
  })

  // Messaging States
  const [activeMessageId, setActiveMessageId] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [composeForm, setComposeForm] = useState({
    content: ''
  })


  // Initial Data Load
  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      let statsData: VendorStats | null = null
      let theatresData: Theatre[] = []
      let showsData: Show[] = []
      let moviesData: Movie[] = []
      let messagesData: MessageResponse[] = []
      let unreads = 0

      // Stats
      try {
        statsData = await fetchVendorStats()
      } catch (err) {
        console.warn('Backend offline, loading fallback stats')
        const localTheatres = JSON.parse(localStorage.getItem('cinex_local_theatres') || '[]')
        const localShows = JSON.parse(localStorage.getItem('cinex_local_shows') || '[]')
        const localBookingsCount = localShows.reduce((acc: number, s: any) => acc + (s.bookedSeats || 0), 0)
        statsData = {
          totalTheatres: localTheatres.length,
          totalShows: localShows.length,
          upcomingShows: localShows.filter((s: any) => s.status === 'UPCOMING').length,
          totalBookings: localBookingsCount,
          totalRevenue: localShows.reduce((acc: number, s: any) => acc + ((s.bookedSeats || 0) * s.basePrice), 0)
        }
      }

      // Theatres
      try {
        theatresData = await fetchMyTheatres()
      } catch (err) {
        const local = localStorage.getItem('cinex_local_theatres')
        if (local) {
          theatresData = JSON.parse(local)
        } else {
          theatresData = [
            {
              id: 101,
              name: 'PVR IMAX Forum Mall',
              addressLine: 'Adugodi, Hosur Road',
              pincode: '560029',
              city: 'Bengaluru',
              district: 'Bengaluru',
              state: 'Karnataka',
              openTime: '09:00',
              closeTime: '23:30',
              hasRecliner: true,
              active: true,
              screens: [
                {
                  id: 1,
                  name: 'IMAX Audi 1',
                  soundSystem: 'Dolby Atmos',
                  projection: 'IMAX Laser',
                  totalSeats: 120,
                  maxCapacity: 200,
                  active: true
                }
              ]
            }
          ]
          localStorage.setItem('cinex_local_theatres', JSON.stringify(theatresData))
        }
      }

      // Shows
      try {
        showsData = await fetchVendorShows()
      } catch (err) {
        const local = localStorage.getItem('cinex_local_shows')
        if (local) {
          showsData = JSON.parse(local)
        } else {
          // Empty initial shows
          showsData = []
          localStorage.setItem('cinex_local_shows', JSON.stringify(showsData))
        }
      }

      // Available Movies
      try {
        moviesData = await fetchAvailableMovies()
      } catch (err) {
        const local = localStorage.getItem('cinex_local_movies')
        if (local) {
          moviesData = JSON.parse(local).filter((m: any) => m.isActive)
        }
      }

      // Inbox
      try {
        messagesData = await fetchInbox()
        unreads = await fetchUnreadCount()
      } catch (err) {
        const local = localStorage.getItem('cinex_local_messages')
        if (local) {
          messagesData = JSON.parse(local)
        } else {
          messagesData = [
            {
              id: 1,
              senderId: 1,
              senderEmail: 'admin@cinex.com',
              recipientId: 999,
              recipientEmail: user?.email || 'vendor@cinex.com',
              content: 'Welcome to the CineX platform! As a movie vendor, you can now register your theatres, configure custom screen grids, and schedule shows. Let us know if you need assistance.',
              messageType: 'TEXT',
              subject: 'Welcome to CineX',
              sentAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
              read: true
            },
            {
              id: 2,
              senderId: 1,
              senderEmail: 'admin@cinex.com',
              recipientId: 999,
              recipientEmail: user?.email || 'vendor@cinex.com',
              content: 'CineX Monthly Business & Usage Report for June 2026.\n\nSummary:\n- Active Shows: 1\n- Total Tickets Booked: 12\n- Accumulated Gross Revenue: $1800.00\n\nThank you for listing your screens with CineX! Please review the figures above. Your monthly system licensing fee is calculated based on these parameters.',
              messageType: 'REPORT',
              subject: 'CineX Monthly Business & Usage Report - June 2026',
              reportPeriod: 'June 2026',
              totalBookings: 12,
              totalRevenue: 1800,
              totalShows: 1,
              sentAt: new Date(Date.now() - 3600000 * 5).toISOString(),
              read: false
            }
          ]
          localStorage.setItem('cinex_local_messages', JSON.stringify(messagesData))
        }
        unreads = messagesData.filter(m => !m.read && m.recipientEmail === (user?.email || 'vendor@cinex.com')).length
      }

      setStats(statsData)
      setTheatres(theatresData)
      setShows(showsData)
      setMovies(moviesData)
      setMessages(messagesData)
      setUnreadCount(unreads)
    } catch (err) {
      console.error(err)
      setError('Could not load vendor configuration.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Auto-dismiss notices
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(''), 4000)
      return () => clearTimeout(t)
    }
  }, [success])

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(''), 5000)
      return () => clearTimeout(t)
    }
  }, [error])


  // Actions
  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  // Theatre Create
  const handleTheatreSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      try {
        await createTheatre(theatreForm)
      } catch (apiErr) {
        console.warn('API Offline, saving theatre in local storage')
        const localStr = localStorage.getItem('cinex_local_theatres')
        const localList: Theatre[] = localStr ? JSON.parse(localStr) : []
        const newId = localList.length > 0 ? Math.max(...localList.map(t => t.id)) + 1 : 101
        const newTheatre: Theatre = {
          ...theatreForm,
          id: newId,
          active: true,
          sections: []
        }
        localList.push(newTheatre)
        localStorage.setItem('cinex_local_theatres', JSON.stringify(localList))
      }
      setSuccess('Theatre registered successfully')
      setIsTheatreModalOpen(false)
      setTheatreForm({
        name: '',
        addressLine: '',
        pincode: '',
        city: '',
        district: '',
        state: '',
        openTime: '09:00',
        closeTime: '23:00',
        hasRecliner: false
      })
      loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to register theatre')
    }
  }

  // Screen Add
  const handleScreenSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!screenTheatreId) return
    setError('')
    try {
      if (screenForm.maxCapacity < 100 || screenForm.maxCapacity > 1000) {
        throw new Error('Screen capacity must be between 100 and 1000 seats')
      }
      try {
        await createScreen(screenTheatreId, screenForm)
      } catch (apiErr) {
        console.warn('API Offline, saving screen in local storage')
        const localStr = localStorage.getItem('cinex_local_theatres')
        if (localStr) {
          let localList: Theatre[] = JSON.parse(localStr)
          localList = localList.map(t => {
            if (t.id === screenTheatreId) {
              const currentScreens = t.screens || []
              const newScrId = currentScreens.length > 0 ? Math.max(...currentScreens.map(s => s.id)) + 1 : 1
              const newScr = {
                id: newScrId,
                name: screenForm.name,
                soundSystem: screenForm.soundSystem,
                projection: screenForm.projection,
                totalSeats: 0,
                maxCapacity: screenForm.maxCapacity,
                active: true
              }
              return { ...t, screens: [...currentScreens, newScr] }
            }
            return t
          })
          localStorage.setItem('cinex_local_theatres', JSON.stringify(localList))
        }
      }
      setSuccess('Auditorium screen added successfully')
      setIsScreenModalOpen(false)
      setScreenForm({
        name: '',
        soundSystem: 'Dolby Atmos',
        projection: '4K Projection',
        maxCapacity: 200
      })
      loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to add auditorium screen')
    }
  }

  // Screen Delete
  const handleScreenDelete = async (screenId: number) => {
    if (!confirm('Are you sure you want to deactivate/delete this screen?')) return
    setError('')
    try {
      try {
        await deleteScreen(screenId)
      } catch (apiErr) {
        console.warn('API Offline, deactivating locally')
        const localStr = localStorage.getItem('cinex_local_theatres')
        if (localStr) {
          let localList: Theatre[] = JSON.parse(localStr)
          localList = localList.map(t => {
            const nextScreens = (t.screens || []).map(s => {
              if (s.id === screenId) {
                return { ...s, active: false }
              }
              return s
            })
            return { ...t, screens: nextScreens }
          })
          localStorage.setItem('cinex_local_theatres', JSON.stringify(localList))
        }
      }
      setSuccess('Screen deactivated')
      loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to delete screen')
    }
  }

  // Schedule Show
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSchedule) return
    const { theatreId, screenId, movieId, showDate, showTime, basePrice } = schedulerForm
    if (!theatreId || !screenId || !movieId || !showDate || !showTime) {
      setError('Please fill out all fields')
      return
    }

    try {
      const showRequest = {
        movieId: parseInt(movieId),
        theatreId: parseInt(theatreId),
        screenId: parseInt(screenId),
        showDate,
        showTime: `${showTime}:00`,
        basePrice: parseFloat(basePrice as any)
      }

      try {
        await createShow(showRequest)
      } catch (apiErr) {
        console.warn('API offline, saving show in localStorage')
        const selectedTheatre = theatres.find(t => t.id === parseInt(theatreId))
        const selectedScreen = selectedTheatre?.screens?.find(s => s.id === parseInt(screenId))
        const selectedMovie = movies.find(m => m.id === parseInt(movieId))

        if (!selectedTheatre || !selectedScreen || !selectedMovie) {
          throw new Error('Verification failed: could not locate selected models locally')
        }

        const localStr = localStorage.getItem('cinex_local_shows')
        const localList: Show[] = localStr ? JSON.parse(localStr) : []
        const newShowId = localList.length > 0 ? Math.max(...localList.map(s => s.id)) + 1 : 1

        const newShow: Show = {
          id: newShowId,
          movie: selectedMovie,
          theatre: selectedTheatre,
          screen: selectedScreen,
          showDate,
          showTime: `${showTime}:00`,
          basePrice: parseFloat(basePrice as any),
          status: 'UPCOMING',
          totalSeats: selectedScreen.totalSeats || 120,
          bookedSeats: 0,
          active: true
        }
        localList.push(newShow)
        localStorage.setItem('cinex_local_shows', JSON.stringify(localList))
      }

      setSuccess('Show scheduled successfully')
      setSchedulerForm(prev => ({
        ...prev,
        showDate: '',
        showTime: '18:00'
      }))
      loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to schedule show')
    }
  }

  // Messaging Actions
  const handleSelectMessage = async (msg: MessageResponse) => {
    setActiveMessageId(msg.id)
    if (!msg.read && msg.recipientEmail === (user?.email || 'vendor@cinex.com')) {
      try {
        await markAsRead(msg.id)
      } catch (err) {
        console.warn('Offline, marking read locally')
        const localStr = localStorage.getItem('cinex_local_messages')
        if (localStr) {
          let localList: MessageResponse[] = JSON.parse(localStr)
          localList = localList.map(m => m.id === msg.id ? { ...m, read: true } : m)
          localStorage.setItem('cinex_local_messages', JSON.stringify(localList))
        }
      }
      // Reload stats
      loadData()
    }
  }

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim()) return
    setError('')
    try {
      try {
        await sendMessage({
          content: replyText
        })
      } catch (apiErr) {
        console.warn('API Offline, replying locally')
        const localStr = localStorage.getItem('cinex_local_messages')
        const localList: MessageResponse[] = localStr ? JSON.parse(localStr) : []
        const newId = localList.length > 0 ? Math.max(...localList.map(m => m.id)) + 1 : 1
        const newMsg: MessageResponse = {
          id: newId,
          senderId: 999,
          senderEmail: user?.email || 'vendor@cinex.com',
          recipientId: 1,
          recipientEmail: 'admin@cinex.com',
          content: replyText,
          messageType: 'TEXT',
          subject: 'Reply',
          sentAt: new Date().toISOString(),
          read: false
        }
        localList.push(newMsg)
        localStorage.setItem('cinex_local_messages', JSON.stringify(localList))
      }
      setReplyText('')
      setSuccess('Message sent')
      loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to send message')
    }
  }

  const handleComposeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!composeForm.content.trim()) return
    setError('')
    try {
      try {
        await sendMessage({
          content: composeForm.content
        })
      } catch (apiErr) {
        console.warn('API Offline, saving locally')
        const localStr = localStorage.getItem('cinex_local_messages')
        const localList: MessageResponse[] = localStr ? JSON.parse(localStr) : []
        const newId = localList.length > 0 ? Math.max(...localList.map(m => m.id)) + 1 : 1
        const newMsg: MessageResponse = {
          id: newId,
          senderId: 999,
          senderEmail: user?.email || 'vendor@cinex.com',
          recipientId: 1,
          recipientEmail: 'admin@cinex.com',
          content: composeForm.content,
          messageType: 'TEXT',
          subject: 'Direct Message',
          sentAt: new Date().toISOString(),
          read: false
        }
        localList.push(newMsg)
        localStorage.setItem('cinex_local_messages', JSON.stringify(localList))
      }
      setIsComposeOpen(false)
      setComposeForm({ content: '' })
      setSuccess('Message sent')
      loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to compose message')
    }
  }

  // Active message details
  const activeMessage = messages.find(m => m.id === activeMessageId)

  // Filter screens of expanding theatre
  const currentScreens = theatres.find(t => t.id === expandedTheatreId)?.screens?.filter(s => s.active) || []

  // Dynamic show details mapping options
  const selectedTheatreForSchedule = theatres.find(t => t.id === parseInt(schedulerForm.theatreId))
  const availableScreensForSchedule = selectedTheatreForSchedule?.screens?.filter(s => s.active) || []

  const hasTheatres = theatres.length > 0
  const hasAtLeastOneScreen = theatres.some(t => t.screens && t.screens.length > 0)
  const canSchedule = hasTheatres && hasAtLeastOneScreen


  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 font-sans flex">
      {/* Background Ambient Glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#E8B84B]/3 blur-[140px] pointer-events-none z-0" />

      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#111113]/90 border-r border-zinc-800/80 p-5 flex flex-col justify-between relative z-10">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8 px-2">
            <span className="text-[#E8B84B] font-bold text-2xl flex items-center">
              <span className="text-[#E8B84B] mr-2">▶</span>CineX
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 bg-zinc-800 border border-zinc-700/50 px-2 py-0.5 rounded">
              Vendor
            </span>
          </div>

          {/* User profile brief */}
          <div className="mb-6 px-2 pb-5 border-b border-zinc-800/50">
            <div className="text-xs text-zinc-500 font-medium">Signed in as</div>
            <div className="text-sm font-semibold truncate text-[#E8B84B]">
              {user?.email || 'vendor@cinex.com'}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-[#E8B84B]/10 text-[#E8B84B] border-l-2 border-[#E8B84B]'
                  : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
              }`}
            >
              <LayoutDashboard size={18} />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('theatres')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'theatres'
                  ? 'bg-[#E8B84B]/10 text-[#E8B84B] border-l-2 border-[#E8B84B]'
                  : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
              }`}
            >
              <Building2 size={18} />
              My Theatres
            </button>
            <button
              onClick={() => setActiveTab('scheduler')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'scheduler'
                  ? 'bg-[#E8B84B]/10 text-[#E8B84B] border-l-2 border-[#E8B84B]'
                  : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
              }`}
            >
              <Calendar size={18} />
              Show Scheduler
            </button>
            <button
              onClick={() => setActiveTab('inbox')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'inbox'
                  ? 'bg-[#E8B84B]/10 text-[#E8B84B] border-l-2 border-[#E8B84B]'
                  : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Mail size={18} />
                Inbox & Reports
              </div>
              {unreadCount > 0 && (
                <span className="bg-[#E8B84B] text-[#09090B] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 p-8 relative z-10 overflow-y-auto max-h-screen">
        {/* Banner Alert System */}
        {success && (
          <div className="fixed top-5 right-5 z-50 bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 backdrop-blur-md animate-fade-in">
            <Check size={18} />
            <span className="text-sm font-medium">{success}</span>
          </div>
        )}
        {error && (
          <div className="fixed top-5 right-5 z-50 bg-red-950/80 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 backdrop-blur-md animate-fade-in">
            <X size={18} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <svg className="animate-spin w-8 h-8 text-[#E8B84B] mb-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <p className="text-zinc-500 text-sm">Syncing vendor account...</p>
          </div>
        )}

        {/* Tab 1: Overview */}
        {!loading && activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                <Sparkles className="text-[#E8B84B]" size={22} /> Operations Control Panel
              </h1>
              <p className="text-zinc-400 text-sm mt-1">Real-time theatre telemetry and box office revenue metrics.</p>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-[#121214] border border-zinc-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all" />
                <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Active Theatres</div>
                <div className="text-3xl font-extrabold text-zinc-100 mt-2">{stats?.totalTheatres}</div>
                <div className="text-[11px] text-zinc-500 mt-4 pt-3 border-t border-zinc-800/50">
                  Total listing locations configured
                </div>
              </div>

              <div className="bg-[#121214] border border-zinc-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all" />
                <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Scheduled Shows</div>
                <div className="text-3xl font-extrabold text-zinc-100 mt-2">{stats?.totalShows}</div>
                <div className="flex justify-between items-center text-[11px] text-zinc-500 mt-4 pt-3 border-t border-zinc-800/50">
                  <span>Upcoming: <b className="text-[#E8B84B]">{stats?.upcomingShows}</b></span>
                </div>
              </div>

              <div className="bg-[#121214] border border-zinc-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl group-hover:bg-yellow-500/10 transition-all" />
                <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Confirmed Tickets</div>
                <div className="text-3xl font-extrabold text-zinc-100 mt-2">{stats?.totalBookings}</div>
                <div className="text-[11px] text-zinc-500 mt-4 pt-3 border-t border-zinc-800/50">
                  Seats booked by retail customers
                </div>
              </div>

              <div className="bg-[#121214] border border-zinc-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
                <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Total Revenue</div>
                <div className="text-3xl font-extrabold text-emerald-400 mt-2">
                  ₹{(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-zinc-500 mt-4 pt-3 border-t border-zinc-800/50 flex justify-between">
                  <span>Licensing model: SaaS Usage</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-[#121214] border border-zinc-800/80 rounded-xl p-6 shadow-md">
              <h2 className="text-lg font-semibold text-zinc-100 mb-4">Quick Operations Shortcuts</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => {
                    setActiveTab('theatres')
                    setIsTheatreModalOpen(true)
                  }}
                  className="bg-[#E8B84B]/10 hover:bg-[#E8B84B]/15 text-[#E8B84B] border border-[#E8B84B]/20 rounded-lg p-4 text-left transition-all"
                >
                  <Building2 size={20} className="mb-2" />
                  <div className="font-semibold text-sm">Register Theatre</div>
                  <div className="text-xs text-zinc-400 mt-1">Configure layout, address, and name</div>
                </button>
                <button
                  onClick={() => setActiveTab('scheduler')}
                  className="bg-zinc-800/40 hover:bg-zinc-800/70 border border-zinc-700/50 rounded-lg p-4 text-left transition-all"
                >
                  <Calendar size={20} className="mb-2 text-[#E8B84B]" />
                  <div className="font-semibold text-sm">Schedule New Show</div>
                  <div className="text-xs text-zinc-400 mt-1">Map film catalog to screen sections</div>
                </button>
                <button
                  onClick={() => setActiveTab('inbox')}
                  className="bg-zinc-800/40 hover:bg-zinc-800/70 border border-zinc-700/50 rounded-lg p-4 text-left transition-all relative"
                >
                  {unreadCount > 0 && (
                    <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-[#E8B84B] animate-ping" />
                  )}
                  <Mail size={20} className="mb-2 text-zinc-300" />
                  <div className="font-semibold text-sm">View Messaging Inbox</div>
                  <div className="text-xs text-zinc-400 mt-1">Verify bills, report metrics, and chat</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Theatres & Screen Layouts */}
        {!loading && activeTab === 'theatres' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                  <Building2 className="text-[#E8B84B]" size={24} /> Screen Locations
                </h1>
                <p className="text-zinc-400 text-sm mt-1">Register locations and construct layout seat configurations.</p>
              </div>
              <button
                onClick={() => setIsTheatreModalOpen(true)}
                className="bg-[#E8B84B] hover:bg-[#E8B84B]/95 text-[#09090B] font-semibold text-sm px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Plus size={16} />
                Register Location
              </button>
            </div>

            {/* Theatre list cards */}
            <div className="grid grid-cols-1 gap-6">
              {theatres.length === 0 ? (
                <div className="bg-[#121214] border border-zinc-800/80 rounded-xl p-12 text-center text-zinc-500 text-sm">
                  No screen locations registered yet. Click "Register Location" above to start.
                </div>
              ) : (
                theatres.map(theatre => (
                  <div key={theatre.id} className="bg-[#121214] border border-zinc-800/80 rounded-xl shadow-md overflow-hidden">
                    <div className="p-6 border-b border-zinc-800/50 flex justify-between items-start flex-wrap gap-4 bg-[#151517]">
                      <div>
                        <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                          {theatre.name}
                          {theatre.hasRecliner && (
                            <span className="text-[10px] bg-[#E8B84B]/15 text-[#E8B84B] border border-[#E8B84B]/20 font-semibold px-2 py-0.5 rounded">
                              Recliner Available
                            </span>
                          )}
                        </h2>
                        <p className="text-zinc-400 text-xs mt-1">
                          {theatre.addressLine}, {theatre.city}, {theatre.district}, {theatre.state} - {theatre.pincode}
                        </p>
                        <p className="text-zinc-500 text-[11px] mt-1 flex items-center gap-1">
                          <Clock size={12} /> Hours: {theatre.openTime} - {theatre.closeTime}
                        </p>
                      </div>

                      <button
                        onClick={() => setExpandedTheatreId(expandedTheatreId === theatre.id ? null : theatre.id)}
                        className="bg-zinc-800 hover:bg-zinc-700/80 text-zinc-300 text-xs font-semibold px-4 py-2 rounded-lg border border-zinc-700/50 transition-all"
                      >
                        {expandedTheatreId === theatre.id ? 'Collapse Screens' : 'Manage Screens'}
                      </button>
                    </div>

                    {/* Expandable Screen Layouts list */}
                    {expandedTheatreId === theatre.id && (
                      <div className="p-6 bg-[#0E0E10] border-t border-zinc-800/30 space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-semibold text-[#E8B84B] uppercase tracking-wider">Auditoriums & Screen Layouts</h3>
                          <button
                            onClick={() => {
                              setScreenTheatreId(theatre.id)
                              setIsScreenModalOpen(true)
                            }}
                            className="bg-zinc-800 hover:bg-zinc-700 text-[#E8B84B] border border-zinc-700/50 text-xs font-semibold px-3 py-1.5 rounded flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Plus size={14} /> Add Screen
                          </button>
                        </div>

                        {/* List screens */}
                        {currentScreens.length === 0 ? (
                          <div className="text-center text-xs text-zinc-500 py-6">
                            No active screens registered in this location. Add one to build a custom seating design.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {currentScreens.map(screen => {
                              const activeSeatsCount = screen.screenLayout?.meta?.totalActiveSeats ?? screen.totalSeats ?? 0
                              const isLayoutDesigned = activeSeatsCount > 0
                              return (
                                <div key={screen.id} className="bg-[#131316] border border-zinc-800/80 rounded-lg p-5 space-y-4 flex flex-col justify-between">
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h4 className="font-bold text-sm text-zinc-100">{screen.name}</h4>
                                        <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                                          Sound: {screen.soundSystem || 'Standard'} | Projection: {screen.projection || 'Standard'}
                                        </p>
                                        <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">
                                          Max Seating Limit: <span className="text-[#E8B84B] font-bold">{screen.maxCapacity}</span> seats
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => handleScreenDelete(screen.id)}
                                        className="text-zinc-500 hover:text-red-400 p-1.5 rounded hover:bg-red-500/10 transition-all cursor-pointer"
                                        title="Delete Screen"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                        isLayoutDesigned
                                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/20'
                                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
                                      }`}>
                                        {isLayoutDesigned ? `Designed Layout (${activeSeatsCount} seats)` : 'Layout Config: Undesigned'}
                                      </span>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => setActiveDesignScreen(screen)}
                                    className="w-full bg-[#E8B84B]/10 hover:bg-[#E8B84B]/15 text-[#E8B84B] border border-[#E8B84B]/20 rounded-lg py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02]"
                                  >
                                    🎨 Design Your Theatre
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Show Scheduler */}
        {!loading && activeTab === 'scheduler' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                <Calendar className="text-[#E8B84B]" size={24} /> Show Scheduler
              </h1>
              <p className="text-zinc-400 text-sm mt-1">Map catalog movies to screens and configure time parameters.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form panel / Locked Alert */}
              {canSchedule ? (
                <div className="bg-[#121214] border border-zinc-800/80 rounded-xl p-6 shadow-md space-y-5 h-fit">
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                    Schedule Event
                  </h3>
                  <form onSubmit={handleScheduleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
                        Select Location
                      </label>
                      <select
                        value={schedulerForm.theatreId}
                        onChange={(e) => {
                          const tId = e.target.value
                          setSchedulerForm(prev => ({ ...prev, theatreId: tId, screenId: '' }))
                        }}
                        className="bg-[#09090B] border border-zinc-800 text-zinc-200 rounded-lg p-2.5 w-full text-sm focus:outline-none focus:border-[#E8B84B]/60"
                        required
                      >
                        <option value="">-- Choose Theatre --</option>
                        {theatres.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
                        Select Screen / Auditorium
                      </label>
                      <select
                        value={schedulerForm.screenId}
                        onChange={(e) => setSchedulerForm(prev => ({ ...prev, screenId: e.target.value }))}
                        className="bg-[#09090B] border border-zinc-800 text-zinc-200 rounded-lg p-2.5 w-full text-sm focus:outline-none focus:border-[#E8B84B]/60"
                        disabled={!schedulerForm.theatreId}
                        required
                      >
                        <option value="">-- Choose Screen --</option>
                        {availableScreensForSchedule.map(s => (
                          <option key={s.id} value={s.id}>{s.name} (Max Capacity: {s.maxCapacity} seats)</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
                        Select Movie Catalog Film
                      </label>
                      <select
                        value={schedulerForm.movieId}
                        onChange={(e) => setSchedulerForm(prev => ({ ...prev, movieId: e.target.value }))}
                        className="bg-[#09090B] border border-zinc-800 text-zinc-200 rounded-lg p-2.5 w-full text-sm focus:outline-none focus:border-[#E8B84B]/60"
                        required
                      >
                        <option value="">-- Choose Movie --</option>
                        {movies.map(m => (
                          <option key={m.id} value={m.id}>{m.title} ({m.language})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
                          Show Date
                        </label>
                        <input
                          type="date"
                          value={schedulerForm.showDate}
                          onChange={(e) => setSchedulerForm(prev => ({ ...prev, showDate: e.target.value }))}
                          className="bg-[#09090B] border border-zinc-800 text-zinc-200 rounded-lg p-2.5 w-full text-sm focus:outline-none focus:border-[#E8B84B]/60 text-center"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={schedulerForm.showTime}
                          onChange={(e) => setSchedulerForm(prev => ({ ...prev, showTime: e.target.value }))}
                          className="bg-[#09090B] border border-zinc-800 text-zinc-200 rounded-lg p-2.5 w-full text-sm focus:outline-none focus:border-[#E8B84B]/60 text-center"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
                        Base Ticket Price (INR)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">₹</span>
                        <input
                          type="number"
                          min="50"
                          max="2000"
                          value={schedulerForm.basePrice}
                          onChange={(e) => setSchedulerForm(prev => ({ ...prev, basePrice: parseInt(e.target.value) || 150 }))}
                          className="bg-[#09090B] border border-zinc-800 text-zinc-200 rounded-lg pl-8 pr-3 py-2.5 w-full text-sm focus:outline-none focus:border-[#E8B84B]/60 font-semibold"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-[#09090B] font-bold py-2.5 rounded-lg transition-all mt-2 cursor-pointer"
                    >
                      Schedule Show
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-[#121214] border border-dashed border-zinc-850 rounded-xl p-6 shadow-md flex flex-col items-center justify-center text-center space-y-4 h-fit">
                  <div className="w-12 h-12 rounded-full bg-[#E8B84B]/10 flex items-center justify-center text-[#E8B84B]">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-100">Scheduling Locked</h3>
                    <p className="text-zinc-500 text-xs mt-1.5 leading-relaxed max-w-[240px]">
                      You must register a theatre location and add at least one screen before you can schedule movies.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('theatres')}
                    className="inline-flex items-center gap-2 bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-[#09090B] font-bold text-xs px-4 py-2 rounded-lg transition-all cursor-pointer"
                  >
                    Go to My Theatres
                  </button>
                </div>
              )}

              {/* Show list Table */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-lg font-bold text-zinc-100">Scheduled Catalog Events</h3>

                <div className="bg-[#121214] border border-zinc-800/80 rounded-xl shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800 bg-[#161619]">
                          <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Movie Details</th>
                          <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Location / Screen</th>
                          <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Date & Time</th>
                          <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Tickets Sold</th>
                          <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50 text-sm">
                        {shows.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-zinc-500">
                              No shows scheduled yet. Populate using the form.
                            </td>
                          </tr>
                        ) : (
                          shows.map(show => (
                            <tr key={show.id} className="hover:bg-zinc-800/20 transition-all">
                              <td className="p-4">
                                <div className="font-semibold text-zinc-100">{show.movie.title}</div>
                                <div className="text-[10px] text-zinc-500 mt-0.5">{show.movie.language} | {show.movie.genre}</div>
                              </td>
                              <td className="p-4">
                                <div className="text-zinc-200">{show.theatre.name}</div>
                                <div className="text-[10px] text-zinc-500 mt-0.5">
                                  {show.screen ? show.screen.name : show.section ? show.section.name : 'Main Audi'}
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="text-zinc-200">{show.showDate}</div>
                                <div className="text-[11px] text-zinc-500 mt-0.5">{show.showTime}</div>
                              </td>
                              <td className="p-4">
                                <div className="font-semibold text-zinc-200">
                                  {show.bookedSeats} / {show.totalSeats}
                                </div>
                                <div className="text-[10px] text-zinc-500 mt-0.5">Price: ₹{show.basePrice}</div>
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                  show.status === 'UPCOMING'
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    : show.status === 'LIVE'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse'
                                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                }`}>
                                  {show.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Messaging Inbox & Reports */}
        {!loading && activeTab === 'inbox' && (
          <div className="space-y-6 animate-fade-in h-[78vh] flex flex-col">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                  <Mail className="text-[#E8B84B]" size={24} /> Communications Workspace
                </h1>
                <p className="text-zinc-400 text-sm mt-1">Review system invoices, billing audits, and message administrators.</p>
              </div>
              <button
                onClick={() => setIsComposeOpen(true)}
                className="bg-[#E8B84B] hover:bg-[#E8B84B]/95 text-[#09090B] font-semibold text-sm px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                <MessageSquare size={16} />
                Send Message
              </button>
            </div>

            <div className="flex-1 bg-[#121214] border border-zinc-800/80 rounded-xl overflow-hidden shadow-lg flex">
              {/* Left pane: Message list */}
              <div className="w-1/3 border-r border-zinc-800/80 flex flex-col bg-[#141416]">
                <div className="p-4 border-b border-zinc-800/60 bg-[#17171a] font-semibold text-xs text-zinc-400 uppercase tracking-wider">
                  Conversations
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/50">
                  {messages.length === 0 ? (
                    <div className="p-8 text-center text-xs text-zinc-600">
                      No communications log found.
                    </div>
                  ) : (
                    messages.map(msg => {
                      const isOutgoing = msg.senderEmail === (user?.email || 'vendor@cinex.com')
                      const isUnread = !msg.read && !isOutgoing
                      return (
                        <button
                          key={msg.id}
                          onClick={() => handleSelectMessage(msg)}
                          className={`w-full text-left p-4 transition-all hover:bg-zinc-800/20 flex flex-col gap-1.5 ${
                            activeMessageId === msg.id ? 'bg-zinc-800/30' : ''
                          } ${isUnread ? 'border-l-2 border-[#E8B84B]' : ''}`}
                        >
                          <div className="flex justify-between items-start w-full">
                            <span className={`text-xs font-semibold truncate ${
                              isOutgoing ? 'text-zinc-400' : 'text-[#E8B84B]'
                            }`}>
                              {isOutgoing ? 'To: Administrator' : 'From: Administrator'}
                            </span>
                            <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                              {new Date(msg.sentAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>

                          <div className="flex justify-between items-center w-full">
                            <span className={`text-sm truncate w-[90%] ${
                              isUnread ? 'font-bold text-zinc-100' : 'text-zinc-300'
                            }`}>
                              {msg.subject || 'Direct Message'}
                            </span>
                            {msg.messageType === 'REPORT' && (
                              <span className="text-[9px] font-bold bg-[#E8B84B]/10 text-[#E8B84B] px-1.5 py-0.5 rounded border border-[#E8B84B]/20">
                                Report
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-zinc-500 truncate w-full">
                            {msg.content}
                          </p>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Right pane: Message details */}
              <div className="flex-1 flex flex-col bg-[#0E0E10]/40">
                {activeMessage ? (
                  <div className="flex-1 flex flex-col">
                    {/* Header */}
                    <div className="p-5 border-b border-zinc-800/60 bg-[#141416] flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-zinc-100 text-base">{activeMessage.subject || 'Direct Message'}</h3>
                        <p className="text-xs text-zinc-500 mt-1">
                          Sent: {new Date(activeMessage.sentAt).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        activeMessage.messageType === 'REPORT' 
                          ? 'bg-[#E8B84B]/10 text-[#E8B84B] border border-[#E8B84B]/30'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {activeMessage.messageType}
                      </span>
                    </div>

                    {/* Body */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-6">
                      {activeMessage.messageType === 'REPORT' ? (
                        /* Beautiful formatted Report Card */
                        <div className="bg-[#121214] border border-[#E8B84B]/30 rounded-xl p-6 space-y-5 shadow-lg relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8B84B]/2 rounded-full blur-2xl" />
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-[#E8B84B] text-[10px] font-bold uppercase tracking-widest">CineX Platform Invoice</div>
                              <h4 className="text-xl font-extrabold text-zinc-100 mt-1">{activeMessage.reportPeriod}</h4>
                            </div>
                            <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded border border-emerald-500/20 font-bold uppercase">
                              Processed
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-4 py-4 border-y border-zinc-800/60">
                            <div>
                              <div className="text-[10px] text-zinc-500 uppercase font-semibold">Total Shows</div>
                              <div className="text-lg font-bold text-zinc-200 mt-1">{activeMessage.totalShows}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-zinc-500 uppercase font-semibold">Tickets Booked</div>
                              <div className="text-lg font-bold text-zinc-200 mt-1">{activeMessage.totalBookings}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-zinc-500 uppercase font-semibold">Gross Revenue</div>
                              <div className="text-lg font-bold text-emerald-400 mt-1">₹{(activeMessage.totalRevenue ?? 0).toLocaleString('en-IN')}</div>
                            </div>
                          </div>

                          <div className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
                            {activeMessage.content}
                          </div>
                        </div>
                      ) : (
                        /* Text details */
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-zinc-400">From:</span>
                            <span className="text-xs font-bold text-[#E8B84B]">{activeMessage.senderEmail}</span>
                          </div>
                          <div className="bg-[#131316] border border-zinc-800/80 rounded-xl p-5 text-sm text-zinc-300 leading-relaxed whitespace-pre-line shadow">
                            {activeMessage.content}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer replies */}
                    {activeMessage.messageType === 'TEXT' && (
                      <form onSubmit={handleSendReply} className="p-4 border-t border-zinc-800/60 bg-[#141416] flex gap-3">
                        <input
                          type="text"
                          placeholder="Type your message reply..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="flex-1 bg-[#09090B] border border-zinc-800 text-zinc-200 placeholder:text-zinc-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#E8B84B]/60"
                        />
                        <button
                          type="submit"
                          className="bg-[#E8B84B] hover:bg-[#E8B84B]/95 text-[#09090B] px-4 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                        >
                          <Send size={16} />
                        </button>
                      </form>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 text-sm">
                    <MessageSquare size={36} className="mb-2 text-zinc-800" />
                    Select a conversation to start reading details.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Theatre Modal Form */}
      {isTheatreModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#000]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-zinc-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setIsTheatreModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300"
            >
              <X size={18} />
            </button>
            <div>
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-1.5">
                <Building2 className="text-[#E8B84B]" size={20} /> Register New Location
              </h3>
              <p className="text-zinc-500 text-xs mt-1">Configure structural details for CineX authorization.</p>
            </div>

            <form onSubmit={handleTheatreSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">Theatre Name</label>
                <input
                  type="text"
                  placeholder="e.g. Inox Prestige Screen 3"
                  value={theatreForm.name}
                  onChange={(e) => setTheatreForm(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-[#09090B] border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-[#E8B84B]/60"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">Address Line</label>
                <input
                  type="text"
                  placeholder="Street details..."
                  value={theatreForm.addressLine}
                  onChange={(e) => setTheatreForm(prev => ({ ...prev, addressLine: e.target.value }))}
                  className="bg-[#09090B] border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-[#E8B84B]/60"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">Pincode</label>
                  <input
                    type="text"
                    placeholder="e.g. 560029"
                    value={theatreForm.pincode}
                    onChange={(e) => setTheatreForm(prev => ({ ...prev, pincode: e.target.value }))}
                    className="bg-[#09090B] border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-[#E8B84B]/60"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru"
                    value={theatreForm.city}
                    onChange={(e) => setTheatreForm(prev => ({ ...prev, city: e.target.value }))}
                    className="bg-[#09090B] border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-[#E8B84B]/60"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">District</label>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru"
                    value={theatreForm.district}
                    onChange={(e) => setTheatreForm(prev => ({ ...prev, district: e.target.value }))}
                    className="bg-[#09090B] border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-[#E8B84B]/60"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">State</label>
                  <input
                    type="text"
                    placeholder="e.g. Karnataka"
                    value={theatreForm.state}
                    onChange={(e) => setTheatreForm(prev => ({ ...prev, state: e.target.value }))}
                    className="bg-[#09090B] border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-[#E8B84B]/60"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">Open Time</label>
                  <input
                    type="time"
                    value={theatreForm.openTime}
                    onChange={(e) => setTheatreForm(prev => ({ ...prev, openTime: e.target.value }))}
                    className="bg-[#09090B] border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-[#E8B84B]/60 text-center"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">Close Time</label>
                  <input
                    type="time"
                    value={theatreForm.closeTime}
                    onChange={(e) => setTheatreForm(prev => ({ ...prev, closeTime: e.target.value }))}
                    className="bg-[#09090B] border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-[#E8B84B]/60 text-center"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="hasRecliner"
                  checked={theatreForm.hasRecliner}
                  onChange={(e) => setTheatreForm(prev => ({ ...prev, hasRecliner: e.target.checked }))}
                  className="rounded border-zinc-800 bg-[#09090B] text-[#E8B84B] focus:ring-0"
                />
                <label htmlFor="hasRecliner" className="text-xs font-semibold text-zinc-300 select-none cursor-pointer">
                  Equipped with Recliner seats
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-[#09090B] font-bold py-2.5 rounded-lg transition-all mt-2 cursor-pointer text-sm"
              >
                Register Location
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Auditorium Screen Modal */}
      {isScreenModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#000]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-zinc-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setIsScreenModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300"
            >
              <X size={18} />
            </button>
            <div>
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-1.5">
                <Grid className="text-[#E8B84B]" size={20} /> Register Auditorium Screen
              </h3>
              <p className="text-zinc-500 text-xs mt-1">Configure screen options and physical seating size limits.</p>
            </div>

            <form onSubmit={handleScreenSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">Screen / Audi Name</label>
                <input
                  type="text"
                  placeholder="e.g. Screen 1 (IMAX) / Audi A Premium"
                  value={screenForm.name}
                  onChange={(e) => setScreenForm(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-[#09090B] border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-[#E8B84B]/60"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">Sound System</label>
                  <select
                    value={screenForm.soundSystem}
                    onChange={(e) => setScreenForm(prev => ({ ...prev, soundSystem: e.target.value }))}
                    className="bg-[#09090B] border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-[#E8B84B]/60"
                    required
                  >
                    <option value="Dolby Atmos">Dolby Atmos</option>
                    <option value="DTS:X">DTS:X</option>
                    <option value="7.1 Surround">7.1 Surround</option>
                    <option value="5.1 Surround">5.1 Surround</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">Projection Type</label>
                  <select
                    value={screenForm.projection}
                    onChange={(e) => setScreenForm(prev => ({ ...prev, projection: e.target.value }))}
                    className="bg-[#09090B] border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-[#E8B84B]/60"
                    required
                  >
                    <option value="4K Projection">4K Projection</option>
                    <option value="IMAX Laser">IMAX Laser</option>
                    <option value="RealD 3D">RealD 3D</option>
                    <option value="Standard Digital">Standard Digital</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">Max Seating Capacity (Limit: 100 - 1000)</label>
                <input
                  type="number"
                  min="100"
                  max="1000"
                  value={screenForm.maxCapacity}
                  onChange={(e) => setScreenForm(prev => ({ ...prev, maxCapacity: parseInt(e.target.value) || 200 }))}
                  className="bg-[#09090B] border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-[#E8B84B]/60"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-[#09090B] font-bold py-2.5 rounded-lg transition-all mt-2 cursor-pointer text-sm"
              >
                Register Screen
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Compose Message Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 bg-[#000]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-zinc-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setIsComposeOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300"
            >
              <X size={18} />
            </button>
            <div>
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-1.5">
                <MessageSquare className="text-[#E8B84B]" size={20} /> Message Administrator
              </h3>
              <p className="text-zinc-500 text-xs mt-1">Your query will be routed directly to the CineX platform administrator.</p>
            </div>

            <form onSubmit={handleComposeSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">Recipient</label>
                <input
                  type="text"
                  value="CineX Platform Administrator (admin@cinex.com)"
                  className="bg-[#09090B] border border-zinc-800 text-zinc-500 rounded-lg px-3 py-2 w-full text-sm focus:outline-none cursor-not-allowed"
                  disabled
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">Message Content</label>
                <textarea
                  rows={5}
                  placeholder="Describe your issue, billing queries, or request assistance..."
                  value={composeForm.content}
                  onChange={(e) => setComposeForm({ content: e.target.value })}
                  className="bg-[#09090B] border border-zinc-800 text-zinc-200 rounded-lg p-3 w-full text-sm focus:outline-none focus:border-[#E8B84B]/60 placeholder:text-zinc-600 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-[#09090B] font-bold py-2.5 rounded-lg transition-all mt-2 cursor-pointer text-sm"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Seating Layout Designer Full-screen Portal Overlay */}
      {activeDesignScreen && (
        <TheatreLayoutBuilder
          screenId={activeDesignScreen.id}
          screenName={activeDesignScreen.name}
          maxCapacity={activeDesignScreen.maxCapacity}
          soundSystem={activeDesignScreen.soundSystem}
          projection={activeDesignScreen.projection}
          onClose={() => setActiveDesignScreen(null)}
          onSaveSuccess={() => {
            setActiveDesignScreen(null)
            loadData()
            setSuccess('Screen layout seating configuration saved successfully!')
          }}
        />
      )}
    </div>
  )
}
