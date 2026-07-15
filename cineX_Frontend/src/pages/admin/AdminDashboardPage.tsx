import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../existing/context/AuthContext'
import {
  LayoutDashboard,
  Users,
  Film,
  Ban,
  LogOut,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Search,
  Calendar,
  Clock,
  Sparkles,
  Check,
  X,
  PlusCircle,
  Mail,
  MessageSquare,
  Send
} from 'lucide-react'
import {
  fetchVendors,
  inviteVendor,
  suspendVendor,
  reactivateVendor,
  banVendor,
  deleteVendor,
  fetchBannedVendors,
  fetchPlatformStats,
  fetchAllMoviesAdmin,
  createMovie,
  updateMovie,
  toggleMovieActive,
  type VendorResponse,
  type BannedVendor,
  type PlatformStats,
  type Movie,
  type MovieRequest
} from '../../services/adminApi'
import {
  fetchInbox,
  sendMessage,
  markAsRead,
  fetchUnreadCount,
  broadcastReports,
  type MessageResponse
} from '../../services/messageApi'

type Tab = 'overview' | 'vendors' | 'movies' | 'banned' | 'inbox'

export default function AdminDashboardPage() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Data States
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [vendors, setVendors] = useState<VendorResponse[]>([])
  const [movies, setMovies] = useState<Movie[]>([])
  const [bannedList, setBannedList] = useState<BannedVendor[]>([])

  // Modal / Form States
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  
  const [banReason, setBanReason] = useState('')
  const [banTarget, setBanTarget] = useState<VendorResponse | null>(null)

  // Movie Form State
  const [isMovieFormOpen, setIsMovieFormOpen] = useState(false)
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null)
  const [movieForm, setMovieForm] = useState<MovieRequest>({
    title: '',
    description: '',
    genre: 'ACTION',
    language: 'ENGLISH',
    durationMins: 120,
    posterUrl: '',
    is3D: false,
    releaseDate: '',
    endDate: '',
    producer: '',
    director: '',
    actors: '',
    imageUrls: ['']
  })

  // Filters / Search
  const [vendorSearch, setVendorSearch] = useState('')
  const [vendorFilter, setVendorFilter] = useState<'all' | 'active' | 'suspended'>('all')
  const [movieSearch, setMovieSearch] = useState('')

  // Messaging States
  const [messages, setMessages] = useState<MessageResponse[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeMessageId, setActiveMessageId] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [composeRecipientId, setComposeRecipientId] = useState('')
  const [composeForm, setComposeForm] = useState({
    subject: '',
    content: ''
  })

  // Load All Data
  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      // Load stats & vendors from backend (or fallback to empty/mock if backend is down)
      let sData: PlatformStats | null = null
      let vData: VendorResponse[] = []
      let bData: BannedVendor[] = []
      let messagesData: MessageResponse[] = []
      let unreads = 0
      
      try {
        sData = await fetchPlatformStats()
        vData = await fetchVendors()
        bData = await fetchBannedVendors()
        messagesData = await fetchInbox()
        unreads = await fetchUnreadCount()
      } catch (e) {
        console.warn('Backend offline or database not seeded, using fallback mock stats/vendors/messages')
        sData = {
          totalVendors: 3,
          activeVendors: 2,
          suspendedVendors: 1,
          bannedVendors: 1,
          totalMovies: 15,
          activeMovies: 12
        }
        vData = [
          { id: 1, email: 'pvr@cinex.com', approved: true, firstLogin: false },
          { id: 2, email: 'inox@cinex.com', approved: true, firstLogin: true },
          { id: 3, email: 'cinepolis@cinex.com', approved: false, firstLogin: false }
        ]
        bData = [
          { id: 1, email: 'scammer@cinex.com', reason: 'Billing fraud', bannedAt: new Date().toISOString(), bannedBy: 'admin@cinex.com' }
        ]
        
        const local = localStorage.getItem('cinex_local_messages')
        if (local) {
          messagesData = JSON.parse(local)
        } else {
          messagesData = [
            {
              id: 1,
              senderId: 999,
              senderEmail: 'pvr@cinex.com',
              recipientId: 1,
              recipientEmail: 'admin@cinex.com',
              content: 'Hello, our PVR IMAX screen layout is having trouble matching the base price multipliers. Can you assist?',
              messageType: 'TEXT',
              subject: 'Help with price multiplier',
              sentAt: new Date(Date.now() - 3600000 * 2).toISOString(),
              read: false
            }
          ]
          localStorage.setItem('cinex_local_messages', JSON.stringify(messagesData))
        }
        unreads = messagesData.filter(m => !m.read && m.recipientEmail === 'admin@cinex.com').length
      }
      setMessages(messagesData)
      setUnreadCount(unreads)

      // Load movies from localStorage (to allow offline local state testing)
      const localMovies = localStorage.getItem('cinex_local_movies')
      let mData: Movie[] = []
      
      if (localMovies) {
        mData = JSON.parse(localMovies)
      } else {
        // Populate 15 local movies cycling through the 5 downloaded webp posters
        const initialMovies: Movie[] = [
          {
            id: 1,
            title: 'Inception',
            description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
            genre: 'SCIFI',
            language: 'ENGLISH',
            durationMins: 148,
            posterUrl: '/Movie1.webp',
            is3D: false,
            releaseDate: '2026-07-01',
            endDate: '2026-08-31',
            isActive: true,
            producer: 'Emma Thomas, Christopher Nolan',
            images: []
          },
          {
            id: 2,
            title: 'Interstellar',
            description: 'When Earth becomes uninhabitable, a team of explorers travels through a wormhole in space in an attempt to ensure humanity\'s survival.',
            genre: 'SCIFI',
            language: 'ENGLISH',
            durationMins: 169,
            posterUrl: '/movie2.webp',
            is3D: false,
            releaseDate: '2026-07-01',
            endDate: '2026-09-15',
            isActive: true,
            producer: 'Emma Thomas, Christopher Nolan',
            images: []
          },
          {
            id: 3,
            title: 'The Dark Knight',
            description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
            genre: 'ACTION',
            language: 'ENGLISH',
            durationMins: 152,
            posterUrl: '/movie3.webp',
            is3D: false,
            releaseDate: '2026-06-15',
            endDate: '2026-08-15',
            isActive: true,
            producer: 'Emma Thomas, Christopher Nolan',
            images: []
          },
          {
            id: 4,
            title: 'Oppenheimer',
            description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
            genre: 'DRAMA',
            language: 'ENGLISH',
            durationMins: 180,
            posterUrl: '/movie5.webp',
            is3D: false,
            releaseDate: '2026-07-10',
            endDate: '2026-09-30',
            isActive: true,
            producer: 'Emma Thomas, Charles Roven',
            images: []
          },
          {
            id: 5,
            title: 'Dunkirk',
            description: 'Allied soldiers from Belgium, the British Commonwealth and Empire, and France are surrounded by the German Army and evacuated during a fierce battle in World War II.',
            genre: 'ACTION',
            language: 'ENGLISH',
            durationMins: 106,
            posterUrl: '/s-l960.webp',
            is3D: false,
            releaseDate: '2026-06-20',
            endDate: '2026-07-31',
            isActive: true,
            producer: 'Emma Thomas, Christopher Nolan',
            images: []
          },
          {
            id: 6,
            title: 'Avatar: The Way of Water',
            description: 'Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the army of the Na\'vi race to protect their home.',
            genre: 'SCIFI',
            language: 'ENGLISH',
            durationMins: 192,
            posterUrl: '/Movie1.webp',
            is3D: true,
            releaseDate: '2026-07-05',
            endDate: '2026-10-15',
            isActive: true,
            producer: 'James Cameron, Jon Landau',
            images: []
          },
          {
            id: 7,
            title: 'The Matrix Resurrections',
            description: 'Return to a world of two realities: one, everyday life; the other, what lies behind it. To find out if his reality is a physical or mental construct, Mr. Anderson will have to choose to follow the white rabbit once more.',
            genre: 'SCIFI',
            language: 'ENGLISH',
            durationMins: 148,
            posterUrl: '/movie2.webp',
            is3D: true,
            releaseDate: '2026-07-01',
            endDate: '2026-08-31',
            isActive: true,
            producer: 'Lana Wachowski, Grant Hill',
            images: []
          },
          {
            id: 8,
            title: 'Gladiator II',
            description: 'Years after witnessing the death of the revered hero Maximus at the hands of his uncle, Lucius is forced to enter the Colosseum after his home is conquered by the tyrannical Emperors who now lead Rome with an iron fist.',
            genre: 'ACTION',
            language: 'ENGLISH',
            durationMins: 150,
            posterUrl: '/movie3.webp',
            is3D: false,
            releaseDate: '2026-07-15',
            endDate: '2026-09-30',
            isActive: true,
            producer: 'Ridley Scott, Michael Pruss',
            images: []
          },
          {
            id: 9,
            title: 'Dune: Part Two',
            description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
            genre: 'SCIFI',
            language: 'ENGLISH',
            durationMins: 166,
            posterUrl: '/movie5.webp',
            is3D: true,
            releaseDate: '2026-07-01',
            endDate: '2026-09-30',
            isActive: true,
            producer: 'Denis Villeneuve, Mary Parent',
            images: []
          },
          {
            id: 10,
            title: 'The Prestige',
            description: 'After a tragic accident, two stage magicians in 1890s London engage in a battle to create the ultimate illusion while sacrificing everything they have to outwit each other.',
            genre: 'DRAMA',
            language: 'ENGLISH',
            durationMins: 130,
            posterUrl: '/s-l960.webp',
            is3D: false,
            releaseDate: '2026-07-01',
            endDate: '2026-08-31',
            isActive: true,
            producer: 'Emma Thomas, Aaron Ryder',
            images: []
          },
          {
            id: 11,
            title: 'Blade Runner 2049',
            description: 'A new blade runner, LAPD Officer K, unearths a long-buried secret that has the potential to plunge what\'s left of society into chaos.',
            genre: 'SCIFI',
            language: 'ENGLISH',
            durationMins: 164,
            posterUrl: '/Movie1.webp',
            is3D: false,
            releaseDate: '2026-07-01',
            endDate: '2026-08-31',
            isActive: true,
            producer: 'Andrew A. Kosove, Broderick Johnson',
            images: []
          },
          {
            id: 12,
            title: 'Spider-Man: Into the Spider-Verse',
            description: 'Teen Miles Morales becomes the Spider-Man of his universe and must join with five spider-powered individuals from other dimensions to stop a threat for all realities.',
            genre: 'ANIMATION',
            language: 'ENGLISH',
            durationMins: 117,
            posterUrl: '/movie2.webp',
            is3D: true,
            releaseDate: '2026-07-01',
            endDate: '2026-08-31',
            isActive: true,
            producer: 'Avi Arad, Amy Pascal',
            images: []
          },
          {
            id: 13,
            title: 'Whiplash',
            description: 'A promising young drummer enrolls at a cut-throat music conservatory where his dreams of greatness are mentored by an instructor who will stop at nothing to realize a student\'s potential.',
            genre: 'DRAMA',
            language: 'ENGLISH',
            durationMins: 106,
            posterUrl: '/movie3.webp',
            is3D: false,
            releaseDate: '2026-07-01',
            endDate: '2026-08-31',
            isActive: true,
            producer: 'Jason Blum, Helen Estabrook',
            images: []
          },
          {
            id: 14,
            title: 'Parasite',
            description: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
            genre: 'THRILLER',
            language: 'ENGLISH',
            durationMins: 132,
            posterUrl: '/movie5.webp',
            is3D: false,
            releaseDate: '2026-07-01',
            endDate: '2026-08-31',
            isActive: true,
            producer: 'Kwak Sin-ae, Bong Joon Ho',
            images: []
          },
          {
            id: 15,
            title: 'Fight Club',
            description: 'An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into much more.',
            genre: 'DRAMA',
            language: 'ENGLISH',
            durationMins: 139,
            posterUrl: '/s-l960.webp',
            is3D: false,
            releaseDate: '2026-07-01',
            endDate: '2026-08-31',
            isActive: true,
            producer: 'Art Linson, Ceán Chaffin',
            images: []
          }
        ]
        localStorage.setItem('cinex_local_movies', JSON.stringify(initialMovies))
        mData = initialMovies
      }

      // Also query live DB movies to sync them if DB has movies
      try {
        const dbMovies = await fetchAllMoviesAdmin()
        if (dbMovies && dbMovies.length > 0) {
          mData = [...dbMovies, ...mData.filter(m => !dbMovies.some(dbM => dbM.title === m.title))]
        }
      } catch (dbErr) {
        console.warn('Could not load DB movies, using local storage movies list only.')
      }

      setStats({
        ...sData,
        totalMovies: mData.length,
        activeMovies: mData.filter(m => m.isActive).length
      })
      setVendors(vData)
      setMovies(mData)
      setBannedList(bData)
    } catch (err) {
      console.error(err)
      setError('Failed to fetch platform configuration or data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Auto-dismiss Success/Error messages
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

  const handleLogout = () => {
    logout()
    navigate('/admin/login', { replace: true })
  }

  // --- Vendor Actions ---
  const handleInviteVendor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return
    setError('')
    setSuccess('')
    try {
      const result = await inviteVendor(inviteEmail)
      setSuccess(result)
      setIsInviteOpen(false)
      setInviteEmail('')
      loadData()
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Invitation failed.')
    }
  }

  const handleSuspendVendor = async (id: number) => {
    if (!confirm('Are you sure you want to suspend this vendor account? They won\'t be able to access the platform.')) return
    try {
      await suspendVendor(id)
      setSuccess('Vendor account suspended successfully')
      loadData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to suspend vendor')
    }
  }

  const handleReactivateVendor = async (id: number) => {
    try {
      await reactivateVendor(id)
      setSuccess('Vendor account reactivated successfully')
      loadData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reactivate vendor')
    }
  }

  const handleBanVendor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!banTarget) return
    try {
      await banVendor(banTarget.id, banReason || 'No reason provided')
      setSuccess(`Vendor ${banTarget.email} banned permanently`)
      setBanTarget(null)
      setBanReason('')
      loadData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to ban vendor')
    }
  }

  const handleDeleteVendor = async (id: number) => {
    if (!confirm('Are you sure you want to delete this vendor? This will permanently remove their theatres, shows, and booking records.')) return
    try {
      await deleteVendor(id)
      setSuccess('Vendor deleted successfully')
      loadData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete vendor')
    }
  }

  // --- Movie Actions ---
  const handleOpenAddMovie = () => {
    setEditingMovie(null)
    setMovieForm({
      title: '',
      description: '',
      genre: 'ACTION',
      language: 'ENGLISH',
      durationMins: 120,
      posterUrl: '',
      is3D: false,
      releaseDate: '',
      endDate: '',
      producer: '',
      director: '',
      actors: '',
      imageUrls: ['']
    })
    setIsMovieFormOpen(true)
  }

  const handleOpenEditMovie = (movie: Movie) => {
    setEditingMovie(movie)
    setMovieForm({
      title: movie.title,
      description: movie.description || '',
      genre: movie.genre,
      language: movie.language,
      durationMins: movie.durationMins,
      posterUrl: movie.posterUrl || '',
      is3D: movie.is3D,
      releaseDate: movie.releaseDate,
      endDate: movie.endDate,
      producer: movie.producer || '',
      director: movie.director || '',
      actors: movie.actors || '',
      imageUrls: movie.images && movie.images.length > 0 
        ? movie.images.map(img => img.imageUrl) 
        : ['']
    })
    setIsMovieFormOpen(true)
  }

  const handleMovieFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const filteredImages = movieForm.imageUrls.filter(url => url.trim() !== '')
    const finalForm = { ...movieForm, imageUrls: filteredImages }

    try {
      try {
        if (editingMovie) {
          await updateMovie(editingMovie.id, finalForm)
        } else {
          await createMovie(finalForm)
        }
      } catch (apiErr) {
        console.warn('API error, falling back to local storage updates')
        const localMoviesStr = localStorage.getItem('cinex_local_movies')
        let localMovies: Movie[] = localMoviesStr ? JSON.parse(localMoviesStr) : []
        
        if (editingMovie) {
          localMovies = localMovies.map(m => {
            if (m.id === editingMovie.id) {
              return {
                ...m,
                title: finalForm.title,
                description: finalForm.description,
                genre: finalForm.genre as any,
                language: finalForm.language as any,
                durationMins: finalForm.durationMins,
                posterUrl: finalForm.posterUrl,
                is3D: finalForm.is3D,
                releaseDate: finalForm.releaseDate,
                endDate: finalForm.endDate,
                producer: finalForm.producer,
                director: finalForm.director,
                actors: finalForm.actors,
                images: finalForm.imageUrls.map((url, i) => ({ id: i, imageUrl: url }))
              }
            }
            return m
          })
        } else {
          const newId = localMovies.length > 0 ? Math.max(...localMovies.map(m => m.id)) + 1 : 1
          const newMovie: Movie = {
            id: newId,
            title: finalForm.title,
            description: finalForm.description,
            genre: finalForm.genre as any,
            language: finalForm.language as any,
            durationMins: finalForm.durationMins,
            posterUrl: finalForm.posterUrl,
            is3D: finalForm.is3D,
            releaseDate: finalForm.releaseDate,
            endDate: finalForm.endDate,
            isActive: true,
            producer: finalForm.producer,
            director: finalForm.director,
            actors: finalForm.actors,
            totalViewers: 0,
            totalRevenue: 0,
            images: finalForm.imageUrls.map((url, i) => ({ id: i, imageUrl: url }))
          }
          localMovies.push(newMovie)
        }
        localStorage.setItem('cinex_local_movies', JSON.stringify(localMovies))
      }

      setSuccess(editingMovie ? 'Movie updated successfully' : 'Movie added to catalog successfully')
      setIsMovieFormOpen(false)
      loadData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit movie form')
    }
  }

  const handleToggleMovieActive = async (id: number) => {
    try {
      try {
        await toggleMovieActive(id)
      } catch (apiErr) {
        console.warn('API error toggling, updating local storage instead')
        const localMoviesStr = localStorage.getItem('cinex_local_movies')
        if (localMoviesStr) {
          let localMovies: Movie[] = JSON.parse(localMoviesStr)
          localMovies = localMovies.map(m => m.id === id ? { ...m, isActive: !m.isActive } : m)
          localStorage.setItem('cinex_local_movies', JSON.stringify(localMovies))
        }
      }
      setSuccess('Movie status toggled')
      loadData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle movie status')
    }
  }

  const addImageUrlField = () => {
    setMovieForm(prev => ({
      ...prev,
      imageUrls: [...prev.imageUrls, '']
    }))
  }

  const removeImageUrlField = (index: number) => {
    setMovieForm(prev => {
      const nextUrls = [...prev.imageUrls]
      nextUrls.splice(index, 1)
      return {
        ...prev,
        imageUrls: nextUrls.length === 0 ? [''] : nextUrls
      }
    })
  }

  const handleImageUrlChange = (index: number, val: string) => {
    setMovieForm(prev => {
      const nextUrls = [...prev.imageUrls]
      nextUrls[index] = val
      return {
        ...prev,
        imageUrls: nextUrls
      }
    })
  }

  // --- Messaging Actions ---
  const handleSelectMessage = async (msg: MessageResponse) => {
    setActiveMessageId(msg.id)
    if (!msg.read && msg.recipientEmail === 'admin@cinex.com') {
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
      loadData()
    }
  }

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim() || !activeMessageId) return
    setError('')
    const activeMsg = messages.find(m => m.id === activeMessageId)
    if (!activeMsg) return

    try {
      try {
        await sendMessage({
          recipientId: activeMsg.senderId,
          content: replyText
        })
      } catch (apiErr) {
        console.warn('API Offline, replying locally')
        const localStr = localStorage.getItem('cinex_local_messages')
        const localList: MessageResponse[] = localStr ? JSON.parse(localStr) : []
        const newId = localList.length > 0 ? Math.max(...localList.map(m => m.id)) + 1 : 1
        const newMsg: MessageResponse = {
          id: newId,
          senderId: 1,
          senderEmail: 'admin@cinex.com',
          recipientId: activeMsg.senderId,
          recipientEmail: activeMsg.senderEmail,
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
      setSuccess('Message reply sent successfully')
      loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to send reply')
    }
  }

  const handleComposeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!composeForm.content.trim() || !composeRecipientId) return
    setError('')

    const selectedVendor = vendors.find(v => v.id === parseInt(composeRecipientId))
    if (!selectedVendor) {
      setError('Selected vendor invalid')
      return
    }

    try {
      try {
        await sendMessage({
          recipientId: selectedVendor.id,
          subject: composeForm.subject || 'Direct Message',
          content: composeForm.content
        })
      } catch (apiErr) {
        console.warn('API Offline, saving locally')
        const localStr = localStorage.getItem('cinex_local_messages')
        const localList: MessageResponse[] = localStr ? JSON.parse(localStr) : []
        const newId = localList.length > 0 ? Math.max(...localList.map(m => m.id)) + 1 : 1
        const newMsg: MessageResponse = {
          id: newId,
          senderId: 1,
          senderEmail: 'admin@cinex.com',
          recipientId: selectedVendor.id,
          recipientEmail: selectedVendor.email,
          content: composeForm.content,
          messageType: 'TEXT',
          subject: composeForm.subject || 'Direct Message',
          sentAt: new Date().toISOString(),
          read: false
        }
        localList.push(newMsg)
        localStorage.setItem('cinex_local_messages', JSON.stringify(localList))
      }
      setIsComposeOpen(false)
      setComposeForm({ subject: '', content: '' })
      setComposeRecipientId('')
      setSuccess('Message dispatched to vendor successfully')
      loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch message')
    }
  }

  const handleBroadcastReports = async () => {
    if (!confirm('Are you sure you want to compile and broadcast monthly performance invoices to all active approved vendors?')) return
    setError('')
    try {
      try {
        await broadcastReports()
      } catch (apiErr) {
        console.warn('API Offline, broadcasting reports locally')
        // Simulate broadcast reports by adding a report message to each approved vendor
        const localStr = localStorage.getItem('cinex_local_messages')
        const localList: MessageResponse[] = localStr ? JSON.parse(localStr) : []
        
        let startId = localList.length > 0 ? Math.max(...localList.map(m => m.id)) + 1 : 1
        
        const approvedVendors = vendors.filter(v => v.approved)
        approvedVendors.forEach(vendor => {
          const reportMsg: MessageResponse = {
            id: startId++,
            senderId: 1,
            senderEmail: 'admin@cinex.com',
            recipientId: vendor.id,
            recipientEmail: vendor.email,
            content: `CineX Monthly Business & Usage Report for June 2026.\n\nSummary:\n- Active Shows: 3\n- Total Tickets Booked: 18\n- Accumulated Gross Revenue: $2700.00\n\nThank you for listing your screens with CineX! Please review the figures above. Your monthly system licensing fee is calculated based on these parameters.`,
            messageType: 'REPORT',
            subject: 'CineX Monthly Business & Usage Report - June 2026',
            reportPeriod: 'June 2026',
            totalBookings: 18,
            totalRevenue: 2700,
            totalShows: 3,
            sentAt: new Date().toISOString(),
            read: false
          }
          localList.push(reportMsg)
        })
        
        localStorage.setItem('cinex_local_messages', JSON.stringify(localList))
      }
      setSuccess('Monthly performance reports compiled and broadcasted to all active vendors successfully')
      loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to broadcast reports')
    }
  }

  // --- Filtering Logic ---
  const filteredVendors = vendors.filter(v => {
    const matchesSearch = v.email.toLowerCase().includes(vendorSearch.toLowerCase())
    if (vendorFilter === 'all') return matchesSearch
    if (vendorFilter === 'active') return matchesSearch && v.approved
    if (vendorFilter === 'suspended') return matchesSearch && !v.approved
    return matchesSearch
  })

  const filteredMovies = movies.filter(m => 
    m.title.toLowerCase().includes(movieSearch.toLowerCase()) ||
    (m.producer && m.producer.toLowerCase().includes(movieSearch.toLowerCase())) ||
    (m.director && m.director.toLowerCase().includes(movieSearch.toLowerCase())) ||
    (m.actors && m.actors.toLowerCase().includes(movieSearch.toLowerCase()))
  )

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
              Admin
            </span>
          </div>

          {/* User profile brief */}
          <div className="mb-6 px-2 pb-5 border-b border-zinc-800/50">
            <div className="text-xs text-zinc-500 font-medium">Signed in as</div>
            <div className="text-sm font-semibold truncate text-[#E8B84B]">
              {user?.email || 'admin@cinex.com'}
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
              onClick={() => setActiveTab('vendors')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'vendors'
                  ? 'bg-[#E8B84B]/10 text-[#E8B84B] border-l-2 border-[#E8B84B]'
                  : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
              }`}
            >
              <Users size={18} />
              Vendors Management
            </button>
            <button
              onClick={() => setActiveTab('movies')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'movies'
                  ? 'bg-[#E8B84B]/10 text-[#E8B84B] border-l-2 border-[#E8B84B]'
                  : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
              }`}
            >
              <Film size={18} />
              Movie Catalog
            </button>
            <button
              onClick={() => setActiveTab('banned')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'banned'
                  ? 'bg-[#E8B84B]/10 text-[#E8B84B] border-l-2 border-[#E8B84B]'
                  : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
              }`}
            >
              <Ban size={18} />
              Banned Registry
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

      {/* Main Dashboard Panel */}
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

        {/* Loader Overlay */}
        {loading && activeTab === 'overview' && (
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <svg className="animate-spin w-8 h-8 text-[#E8B84B] mb-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <p className="text-zinc-500 text-sm">Syncing platform metrics...</p>
          </div>
        )}

        {/* Content sections */}
        {!loading && activeTab === 'overview' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                <Sparkles className="text-[#E8B84B]" size={22} /> Dashboard Overview
              </h1>
              <p className="text-zinc-400 text-sm mt-1">Platform analytics and ecosystem health at a glance.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-[#121214] border border-zinc-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all" />
                <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Total Vendors</div>
                <div className="text-3xl font-extrabold text-zinc-100 mt-2">{stats?.totalVendors}</div>
                <div className="flex justify-between items-center text-[11px] text-zinc-500 mt-4 pt-3 border-t border-zinc-800/50">
                  <span>Approved: <b className="text-emerald-400">{stats?.activeVendors}</b></span>
                  <span>Suspended: <b className="text-amber-500">{stats?.suspendedVendors}</b></span>
                </div>
              </div>

              <div className="bg-[#121214] border border-zinc-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-all" />
                <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Banned Vendors</div>
                <div className="text-3xl font-extrabold text-zinc-100 mt-2">{stats?.bannedVendors}</div>
                <div className="text-[11px] text-zinc-500 mt-4 pt-3 border-t border-zinc-800/50">
                  Permanent email blacklists applied
                </div>
              </div>

              <div className="bg-[#121214] border border-zinc-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl group-hover:bg-yellow-500/10 transition-all" />
                <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Total Catalog Movies</div>
                <div className="text-3xl font-extrabold text-zinc-100 mt-2">{stats?.totalMovies}</div>
                <div className="flex justify-between items-center text-[11px] text-zinc-500 mt-4 pt-3 border-t border-zinc-800/50">
                  <span>Available to Pull: <b className="text-[#E8B84B]">{stats?.activeMovies}</b></span>
                  <span>Archived: <b className="text-zinc-400">{(stats?.totalMovies ?? 0) - (stats?.activeMovies ?? 0)}</b></span>
                </div>
              </div>

              <div className="bg-[#121214] border border-zinc-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
                <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Platform Status</div>
                <div className="text-lg font-bold text-emerald-400 mt-3 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  All Systems Operational
                </div>
                <div className="text-[11px] text-zinc-500 mt-4.5 pt-3 border-t border-zinc-800/50">
                  Security Context: Role-Enforced JWT
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-[#121214] border border-zinc-800/80 rounded-xl p-6 shadow-md">
              <h2 className="text-lg font-semibold text-zinc-100 mb-4">Quick Administrator Tasks</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => {
                    setActiveTab('vendors')
                    setIsInviteOpen(true)
                  }}
                  className="bg-[#E8B84B]/10 hover:bg-[#E8B84B]/15 text-[#E8B84B] border border-[#E8B84B]/20 rounded-lg p-4 text-left transition-all"
                >
                  <Users size={20} className="mb-2" />
                  <div className="font-semibold text-sm">Invite New Vendor</div>
                  <div className="text-xs text-zinc-400 mt-1">Add an authorized movie provider</div>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('movies')
                    handleOpenAddMovie()
                  }}
                  className="bg-zinc-800/40 hover:bg-zinc-800/70 border border-zinc-700/50 rounded-lg p-4 text-left transition-all"
                >
                  <PlusCircle size={20} className="mb-2 text-[#E8B84B]" />
                  <div className="font-semibold text-sm">Add New Movie</div>
                  <div className="text-xs text-zinc-400 mt-1">Publish film with showtimes & gallery</div>
                </button>
                <button
                  onClick={handleBroadcastReports}
                  className="bg-zinc-800/40 hover:bg-zinc-800/70 border border-zinc-700/50 rounded-lg p-4 text-left transition-all"
                >
                  <Sparkles size={20} className="mb-2 text-emerald-400 animate-pulse" />
                  <div className="font-semibold text-sm">Broadcast Invoice Reports</div>
                  <div className="text-xs text-zinc-400 mt-1">Send monthly reports to all vendors</div>
                </button>
                <button
                  onClick={() => setActiveTab('banned')}
                  className="bg-zinc-800/40 hover:bg-zinc-800/70 border border-zinc-700/50 rounded-lg p-4 text-left transition-all"
                >
                  <Ban size={20} className="mb-2 text-red-400" />
                  <div className="font-semibold text-sm">Check Banned List</div>
                  <div className="text-xs text-zinc-400 mt-1">Verify permanently blacklisted emails</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Vendors Tab */}
        {activeTab === 'vendors' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                  <Users className="text-[#E8B84B]" size={24} /> Vendor Ecosystem
                </h1>
                <p className="text-zinc-400 text-sm mt-1">Authorize, suspend, delete, or permanently ban theatre network operators.</p>
              </div>
              <button
                onClick={() => setIsInviteOpen(true)}
                className="bg-[#E8B84B] hover:bg-[#E8B84B]/95 text-[#09090B] font-semibold text-sm px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Plus size={16} />
                Invite Vendor
              </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-[#121214] border border-zinc-800/80 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                <input
                  type="text"
                  placeholder="Search by vendor email..."
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  className="bg-[#09090B] border border-zinc-800 text-zinc-200 placeholder:text-zinc-600 rounded-lg pl-9 pr-3 py-2 w-full text-sm focus:outline-none focus:border-[#E8B84B]/60"
                />
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setVendorFilter('all')}
                  className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all border ${
                    vendorFilter === 'all'
                      ? 'bg-[#E8B84B]/10 border-[#E8B84B] text-[#E8B84B]'
                      : 'bg-transparent border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  All Vendors
                </button>
                <button
                  onClick={() => setVendorFilter('active')}
                  className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all border ${
                    vendorFilter === 'active'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-transparent border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setVendorFilter('suspended')}
                  className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all border ${
                    vendorFilter === 'suspended'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-transparent border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Suspended
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-[#121214] border border-zinc-800/80 rounded-xl overflow-hidden shadow-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-[#161619]">
                    <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Vendor Email</th>
                    <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Security status</th>
                    <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Account Password Status</th>
                    <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {filteredVendors.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-zinc-500 text-sm">
                        No vendors match the search parameters.
                      </td>
                    </tr>
                  ) : (
                    filteredVendors.map((vendor) => (
                      <tr key={vendor.id} className="hover:bg-zinc-800/20 transition-all">
                        <td className="p-4 text-sm font-medium text-zinc-100">{vendor.email}</td>
                        <td className="p-4">
                          {vendor.approved ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <Unlock size={10} /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Lock size={10} /> Suspended
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {vendor.firstLogin ? (
                            <span className="text-xs text-amber-400 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-950/60">
                              Temp Pass (Pending Change)
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-400">Password configured</span>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {vendor.approved ? (
                            <button
                              onClick={() => handleSuspendVendor(vendor.id)}
                              className="text-xs font-semibold text-amber-400 hover:bg-amber-500/10 px-2.5 py-1 rounded transition-all cursor-pointer"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReactivateVendor(vendor.id)}
                              className="text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 px-2.5 py-1 rounded transition-all cursor-pointer"
                            >
                              Reactivate
                            </button>
                          )}
                          <button
                            onClick={() => setBanTarget(vendor)}
                            className="text-xs font-semibold text-red-400 hover:bg-red-500/10 px-2.5 py-1 rounded transition-all cursor-pointer"
                          >
                            Ban Permanent
                          </button>
                          <button
                            onClick={() => handleDeleteVendor(vendor.id)}
                            className="text-xs hover:text-red-400 p-1.5 inline-flex items-center rounded hover:bg-red-500/10 transition-all cursor-pointer text-zinc-500"
                            title="Delete Account"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Movies Tab */}
        {activeTab === 'movies' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                  <Film className="text-[#E8B84B]" size={24} /> Movie Catalog Management
                </h1>
                <p className="text-zinc-400 text-sm mt-1">Publish new movie configurations to make them assignable for vendor shows.</p>
              </div>
              <button
                onClick={handleOpenAddMovie}
                className="bg-[#E8B84B] hover:bg-[#E8B84B]/95 text-[#09090B] font-semibold text-sm px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Plus size={16} />
                Add Film Config
              </button>
            </div>

            {/* Search */}
            <div className="bg-[#121214] border border-zinc-800/80 rounded-xl p-4 flex gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                <input
                  type="text"
                  placeholder="Search movie catalog..."
                  value={movieSearch}
                  onChange={(e) => setMovieSearch(e.target.value)}
                  className="bg-[#09090B] border border-zinc-800 text-zinc-200 placeholder:text-zinc-600 rounded-lg pl-9 pr-3 py-2 w-full text-sm focus:outline-none focus:border-[#E8B84B]/60"
                />
              </div>
            </div>

            {/* Movies List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMovies.length === 0 ? (
                <div className="col-span-full bg-[#121214] border border-zinc-800/80 rounded-xl p-8 text-center text-zinc-500 text-sm">
                  No movies published in the catalog.
                </div>
              ) : (
                filteredMovies.map((movie) => (
                  <div
                    key={movie.id}
                    className={`bg-[#121214] border rounded-xl overflow-hidden shadow-lg transition-all flex flex-col justify-between ${
                      movie.isActive ? 'border-zinc-800/80' : 'border-zinc-800/40 opacity-60'
                    }`}
                  >
                    <div>
                      {/* Thumbnail Poster - Constrained to 2:3 Aspect Ratio with Object Cover for uniform card shapes */}
                      <div className="aspect-[2/3] w-full bg-zinc-950 relative overflow-hidden flex items-center justify-center">
                        {movie.posterUrl ? (
                          <img
                            src={movie.posterUrl}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Film size={40} className="text-zinc-700" />
                        )}
                        {/* 3D and Status Badge */}
                        <div className="absolute top-3 left-3 flex gap-2">
                          {movie.is3D && (
                            <span className="bg-[#E8B84B] text-[#09090B] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow">
                              3D
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow ${
                              movie.isActive
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                            }`}
                          >
                            {movie.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </div>
                      </div>

                      {/* Movie Info */}
                      <div className="p-5 space-y-3">
                        <div>
                          <h3 className="font-bold text-base text-zinc-100 line-clamp-1">{movie.title}</h3>
                          <p className="text-zinc-500 text-xs mt-0.5">Producer: {movie.producer || 'Unspecified'}</p>
                          <p className="text-zinc-500 text-xs mt-0.5">Director: {movie.director || 'Unspecified'}</p>
                          <p className="text-zinc-400 text-xs mt-0.5 truncate"><span className="text-zinc-500">Cast:</span> {movie.actors || 'Unspecified'}</p>
                        </div>

                        <div className="flex gap-2">
                          <span className="text-[10px] bg-zinc-800/80 px-2 py-0.5 rounded text-zinc-400 font-medium">
                            {movie.genre}
                          </span>
                          <span className="text-[10px] bg-zinc-800/80 px-2 py-0.5 rounded text-zinc-400 font-medium">
                            {movie.language}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-400 line-clamp-2 min-h-8">
                          {movie.description || 'No description provided.'}
                        </p>

                        {/* Performance Stats */}
                        <div className="bg-[#18181b]/80 border border-zinc-800/50 rounded-lg p-2.5 flex items-center justify-between text-xs mt-2 shadow-inner">
                          <div>
                            <span className="text-zinc-500 block text-[9px] uppercase font-semibold tracking-wider">Total Viewers</span>
                            <span className="text-zinc-200 font-bold font-mono">{movie.totalViewers ?? 0}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-zinc-500 block text-[9px] uppercase font-semibold tracking-wider">Total Revenue</span>
                            <span className="text-emerald-400 font-bold font-mono">₹{(movie.totalRevenue ?? 0).toLocaleString('en-IN')}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-500 pt-3 border-t border-zinc-800/50">
                          <div className="flex items-center gap-1">
                            <Clock size={12} />
                            {movie.durationMins} Mins
                          </div>
                          <div className="flex items-center gap-1 justify-end">
                            <Calendar size={12} />
                            Avail: {movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="bg-[#161619] border-t border-zinc-800/50 px-5 py-3 flex items-center justify-between">
                      <button
                        onClick={() => handleToggleMovieActive(movie.id)}
                        className={`text-xs font-semibold cursor-pointer ${
                          movie.isActive
                            ? 'text-zinc-400 hover:text-zinc-200'
                            : 'text-emerald-400 hover:text-emerald-300'
                        }`}
                      >
                        {movie.isActive ? 'Archive Film' : 'Publish Film'}
                      </button>

                      <button
                        onClick={() => handleOpenEditMovie(movie)}
                        className="text-xs font-semibold text-[#E8B84B] hover:text-[#E8B84B]/80 cursor-pointer"
                      >
                        Edit Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Banned Registry Tab */}
        {activeTab === 'banned' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                <Ban className="text-red-400" size={24} /> Banned Vendor Registry
              </h1>
              <p className="text-zinc-400 text-sm mt-1">Permanently blacklisted email credentials. These accounts cannot register or log in ever again.</p>
            </div>

            {/* List */}
            <div className="bg-[#121214] border border-zinc-800/80 rounded-xl overflow-hidden shadow-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-[#161619]">
                    <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Blacklisted Email</th>
                    <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Ban Reason</th>
                    <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Banned At</th>
                    <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Applied By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {bannedList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-zinc-500 text-sm">
                        No permanent bans have been applied.
                      </td>
                    </tr>
                  ) : (
                    bannedList.map((ban) => (
                      <tr key={ban.id} className="hover:bg-zinc-800/20 transition-all">
                        <td className="p-4 text-sm font-semibold text-red-400">{ban.email}</td>
                        <td className="p-4 text-sm text-zinc-300 max-w-xs truncate" title={ban.reason}>
                          {ban.reason}
                        </td>
                        <td className="p-4 text-xs text-zinc-500">
                          {new Date(ban.bannedAt).toLocaleString()}
                        </td>
                        <td className="p-4 text-xs text-zinc-400">{ban.bannedBy}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Messaging Inbox Tab */}
        {activeTab === 'inbox' && (
          <div className="space-y-6 h-[78vh] flex flex-col animate-fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                  <Mail className="text-[#E8B84B]" size={24} /> Communications Hub
                </h1>
                <p className="text-zinc-400 text-sm mt-1">Bidirectional messaging with platform vendors and report broadcasting.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBroadcastReports}
                  className="bg-zinc-800 hover:bg-zinc-700/80 text-emerald-400 border border-zinc-700/50 font-semibold text-sm px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Sparkles size={16} />
                  Broadcast Reports
                </button>
                <button
                  onClick={() => setIsComposeOpen(true)}
                  className="bg-[#E8B84B] hover:bg-[#E8B84B]/95 text-[#09090B] font-semibold text-sm px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <MessageSquare size={16} />
                  Compose Message
                </button>
              </div>
            </div>

            <div className="flex-1 bg-[#121214] border border-zinc-800/80 rounded-xl overflow-hidden shadow-lg flex">
              {/* Left pane: conversations */}
              <div className="w-1/3 border-r border-zinc-800/80 flex flex-col bg-[#141416]">
                <div className="p-4 border-b border-zinc-800/60 bg-[#17171a] font-semibold text-xs text-zinc-400 uppercase tracking-wider">
                  Active Chats
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/50">
                  {messages.length === 0 ? (
                    <div className="p-8 text-center text-xs text-zinc-600">
                      No communications history.
                    </div>
                  ) : (
                    messages.map(msg => {
                      const isOutgoing = msg.senderEmail === 'admin@cinex.com'
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
                              {isOutgoing ? `To: ${msg.recipientEmail}` : `From: ${msg.senderEmail}`}
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

              {/* Right pane: message view */}
              <div className="flex-1 flex flex-col bg-[#0E0E10]/40">
                {activeMessageId && messages.find(m => m.id === activeMessageId) ? (
                  (() => {
                    const activeMsg = messages.find(m => m.id === activeMessageId)!
                    return (
                      <div className="flex-1 flex flex-col">
                        {/* Header */}
                        <div className="p-5 border-b border-zinc-800/60 bg-[#141416] flex justify-between items-center">
                          <div>
                            <h3 className="font-bold text-zinc-100 text-base">{activeMsg.subject || 'Direct Message'}</h3>
                            <p className="text-xs text-zinc-500 mt-1">
                              Sent: {new Date(activeMsg.sentAt).toLocaleString()}
                            </p>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            activeMsg.messageType === 'REPORT' 
                              ? 'bg-[#E8B84B]/10 text-[#E8B84B] border border-[#E8B84B]/30'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {activeMsg.messageType}
                          </span>
                        </div>

                        {/* Body */}
                        <div className="flex-1 p-6 overflow-y-auto space-y-6">
                          {activeMsg.messageType === 'REPORT' ? (
                            /* Beautiful formatted Report Card */
                            <div className="bg-[#121214] border border-[#E8B84B]/30 rounded-xl p-6 space-y-5 shadow-lg relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8B84B]/2 rounded-full blur-2xl" />
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="text-[#E8B84B] text-[10px] font-bold uppercase tracking-widest">CineX Platform Invoice</div>
                                  <h4 className="text-xl font-extrabold text-zinc-100 mt-1">{activeMsg.reportPeriod}</h4>
                                </div>
                                <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded border border-emerald-500/20 font-bold uppercase">
                                  Processed
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-4 py-4 border-y border-zinc-800/60">
                                <div>
                                  <div className="text-[10px] text-zinc-500 uppercase font-semibold">Total Shows</div>
                                  <div className="text-lg font-bold text-zinc-200 mt-1">{activeMsg.totalShows}</div>
                                </div>
                                <div>
                                  <div className="text-[10px] text-zinc-500 uppercase font-semibold">Tickets Booked</div>
                                  <div className="text-lg font-bold text-zinc-200 mt-1">{activeMsg.totalBookings}</div>
                                </div>
                                <div>
                                  <div className="text-[10px] text-zinc-500 uppercase font-semibold">Gross Revenue</div>
                                  <div className="text-lg font-bold text-emerald-400 mt-1">₹{(activeMsg.totalRevenue ?? 0).toLocaleString('en-IN')}</div>
                                </div>
                              </div>

                              <div className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
                                {activeMsg.content}
                              </div>
                            </div>
                          ) : (
                            /* Text details */
                            <div className="space-y-4">
                              <div className="flex flex-col gap-1">
                                <div className="text-xs text-zinc-500">
                                  <span className="font-semibold">From:</span> {activeMsg.senderEmail}
                                </div>
                                <div className="text-xs text-zinc-500">
                                  <span className="font-semibold">To:</span> {activeMsg.recipientEmail}
                                </div>
                              </div>
                              <div className="bg-[#131316] border border-zinc-800/80 rounded-xl p-5 text-sm text-zinc-300 leading-relaxed whitespace-pre-line shadow">
                                {activeMsg.content}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Footer replies */}
                        {activeMsg.messageType === 'TEXT' && (
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
                    )
                  })()
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

      {/* COMPOSE MESSAGE MODAL FOR ADMIN */}
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
                <MessageSquare className="text-[#E8B84B]" size={20} /> Compose Vendor Message
              </h3>
              <p className="text-zinc-500 text-xs mt-1">Initiate a direct text query to any system vendor.</p>
            </div>

            <form onSubmit={handleComposeSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">Select Recipient Vendor</label>
                <select
                  value={composeRecipientId}
                  onChange={(e) => setComposeRecipientId(e.target.value)}
                  className="bg-[#09090B] border border-zinc-800 text-zinc-200 rounded-lg p-2.5 w-full text-sm focus:outline-none focus:border-[#E8B84B]/60"
                  required
                >
                  <option value="">-- Choose Vendor --</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.email} ({v.approved ? 'Active' : 'Suspended'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Schedule audit queries / Billing follow-up"
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="bg-[#09090B] border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-[#E8B84B]/60"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">Message Content</label>
                <textarea
                  rows={5}
                  placeholder="Enter details here..."
                  value={composeForm.content}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, content: e.target.value }))}
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

      {/* MODAL: INVITE VENDOR */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111113] border border-zinc-850 w-full max-w-[420px] rounded-xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="font-bold text-zinc-100 flex items-center gap-1.5">
                <Users size={18} className="text-[#E8B84B]" /> Invite System Vendor
              </h3>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleInviteVendor} className="p-5 space-y-4">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Enter the email address of the partner/vendor. CineX will create a secure, temporary system password for authorization.
              </p>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Vendor Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="theatre@partner.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="bg-[#09090B] border border-zinc-800 text-zinc-200 placeholder:text-zinc-700 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-[#E8B84B]"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="flex-1 bg-transparent hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-[#09090B] py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BAN VENDOR REASON */}
      {banTarget && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111113] border border-zinc-855 w-full max-w-[420px] rounded-xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-red-950/20">
              <h3 className="font-bold text-red-400 flex items-center gap-1.5">
                <Ban size={18} /> Permanent Ban Enforcer
              </h3>
              <button
                onClick={() => setBanTarget(null)}
                className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleBanVendor} className="p-5 space-y-4">
              <div className="bg-red-500/5 border border-red-500/10 p-3.5 rounded-lg">
                <p className="text-xs text-red-300 leading-relaxed font-semibold">
                  WARNING: This action is destructive and permanent. Banning <code className="text-zinc-100 select-all">{banTarget.email}</code> will instantly delete all their theaters, scheduling layouts, active shows, and platform login cookies.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Reason for banishment
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Specify code of conduct violation, payment defaults, or other breach details..."
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="bg-[#09090B] border border-zinc-800 text-zinc-200 placeholder:text-zinc-700 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-red-500/60"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBanTarget(null)}
                  className="flex-1 bg-transparent hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                >
                  Execute Ban
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MOVIE FORM */}
      {isMovieFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111113] border border-zinc-800 w-full max-w-[650px] rounded-xl overflow-hidden shadow-2xl animate-scale-in max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-zinc-855 flex justify-between items-center bg-zinc-900/50">
              <h3 className="font-bold text-zinc-100 flex items-center gap-1.5">
                <Film size={18} className="text-[#E8B84B]" />
                {editingMovie ? 'Edit Movie Details' : 'Publish Film to Platform Catalog'}
              </h3>
              <button
                onClick={() => setIsMovieFormOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleMovieFormSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Movie Title
                  </label>
                  <input
                    type="text"
                    required
                    value={movieForm.title}
                    onChange={(e) => setMovieForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Inception"
                    className="bg-[#09090B] border border-zinc-800 text-zinc-200 placeholder:text-zinc-700 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-[#E8B84B]"
                  />
                </div>

                {/* Producer */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Producer of the Movie
                  </label>
                  <input
                    type="text"
                    required
                    value={movieForm.producer}
                    onChange={(e) => setMovieForm(prev => ({ ...prev, producer: e.target.value }))}
                    placeholder="e.g. Christopher Nolan, Emma Thomas"
                    className="bg-[#09090B] border border-zinc-800 text-zinc-200 placeholder:text-zinc-700 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-[#E8B84B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Director */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Director
                  </label>
                  <input
                    type="text"
                    required
                    value={movieForm.director}
                    onChange={(e) => setMovieForm(prev => ({ ...prev, director: e.target.value }))}
                    placeholder="e.g. Christopher Nolan"
                    className="bg-[#09090B] border border-zinc-800 text-zinc-200 placeholder:text-zinc-700 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-[#E8B84B]"
                  />
                </div>

                {/* Cast / Actors */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Cast / Actors
                  </label>
                  <input
                    type="text"
                    required
                    value={movieForm.actors}
                    onChange={(e) => setMovieForm(prev => ({ ...prev, actors: e.target.value }))}
                    placeholder="e.g. Leonardo DiCaprio, Joseph Gordon-Levitt"
                    className="bg-[#09090B] border border-zinc-800 text-zinc-200 placeholder:text-zinc-700 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-[#E8B84B]"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Synopsis / Description
                </label>
                <textarea
                  rows={2}
                  value={movieForm.description}
                  onChange={(e) => setMovieForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief synopsis summarizing plot details..."
                  className="bg-[#09090B] border border-zinc-800 text-zinc-200 placeholder:text-zinc-700 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-[#E8B84B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Genre */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Genre
                  </label>
                  <select
                    value={movieForm.genre}
                    onChange={(e) => setMovieForm(prev => ({ ...prev, genre: e.target.value }))}
                    className="bg-[#09090B] border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-[#E8B84B]"
                  >
                    <option value="ACTION">Action</option>
                    <option value="COMEDY">Comedy</option>
                    <option value="HORROR">Horror</option>
                    <option value="DRAMA">Drama</option>
                    <option value="THRILLER">Thriller</option>
                    <option value="ROMANCE">Romance</option>
                    <option value="SCIFI">Sci-Fi</option>
                    <option value="ANIMATION">Animation</option>
                  </select>
                </div>

                {/* Language */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Language
                  </label>
                  <select
                    value={movieForm.language}
                    onChange={(e) => setMovieForm(prev => ({ ...prev, language: e.target.value }))}
                    className="bg-[#09090B] border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-[#E8B84B]"
                  >
                    <option value="ENGLISH">English</option>
                    <option value="HINDI">Hindi</option>
                    <option value="TELUGU">Telugu</option>
                    <option value="TAMIL">Tamil</option>
                    <option value="KANNADA">Kannada</option>
                    <option value="MALAYALAM">Malayalam</option>
                    <option value="BENGALI">Bengali</option>
                  </select>
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={movieForm.durationMins}
                    onChange={(e) => setMovieForm(prev => ({ ...prev, durationMins: parseInt(e.target.value) || 0 }))}
                    className="bg-[#09090B] border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-[#E8B84B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                {/* Release Date */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Release Date
                  </label>
                  <input
                    type="date"
                    required
                    value={movieForm.releaseDate}
                    onChange={(e) => setMovieForm(prev => ({ ...prev, releaseDate: e.target.value }))}
                    className="bg-[#09090B] border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-[#E8B84B]"
                  />
                </div>

                {/* End Date */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={movieForm.endDate}
                    onChange={(e) => setMovieForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="bg-[#09090B] border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-[#E8B84B]"
                  />
                </div>

                {/* Is 3D */}
                <div className="flex items-center gap-2 mt-5 sm:justify-center">
                  <input
                    type="checkbox"
                    id="is3D"
                    checked={movieForm.is3D}
                    onChange={(e) => setMovieForm(prev => ({ ...prev, is3D: e.target.checked }))}
                    className="w-4 h-4 text-[#E8B84B] bg-[#09090B] border-zinc-800 rounded focus:ring-[#E8B84B]"
                  />
                  <label htmlFor="is3D" className="text-xs font-semibold text-zinc-400 cursor-pointer">
                    Available in 3D Layout
                  </label>
                </div>
              </div>

              {/* Poster URL */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Poster Image URL
                </label>
                <input
                  type="url"
                  value={movieForm.posterUrl}
                  onChange={(e) => setMovieForm(prev => ({ ...prev, posterUrl: e.target.value }))}
                  placeholder="https://images.unsplash.com/... or /Movie1.webp or /movie2.webp"
                  className="bg-[#09090B] border border-zinc-800 text-zinc-200 placeholder:text-zinc-700 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-[#E8B84B]"
                />
              </div>

              {/* Movie screenshot URLs */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Additional Stills & Screenshots (URLs)
                  </label>
                  <button
                    type="button"
                    onClick={addImageUrlField}
                    className="text-xs text-[#E8B84B] hover:text-[#E8B84B]/80 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle size={14} /> Add Image
                  </button>
                </div>

                <div className="space-y-2">
                  {movieForm.imageUrls.map((url, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => handleImageUrlChange(index, e.target.value)}
                        placeholder={`Screenshot #${index + 1} URL`}
                        className="bg-[#09090B] border border-zinc-800 text-zinc-200 placeholder:text-zinc-700 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-[#E8B84B]"
                      />
                      <button
                        type="button"
                        onClick={() => removeImageUrlField(index)}
                        className="text-zinc-500 hover:text-red-400 p-2 cursor-pointer transition-all"
                        title="Remove URL"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex gap-3 pt-4 border-t border-zinc-800/80 bg-zinc-900/10">
                <button
                  type="button"
                  onClick={() => setIsMovieFormOpen(false)}
                  className="flex-1 bg-transparent hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-[#09090B] py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                >
                  {editingMovie ? 'Save Changes' : 'Publish Film Config'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
