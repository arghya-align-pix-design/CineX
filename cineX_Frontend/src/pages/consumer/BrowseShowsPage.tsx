import { useEffect, useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../existing/context/AuthContext'
import { fetchMovies, type Movie } from '../../services/consumerApi'
import { useCity, CITIES } from '../../hooks/useCity'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MapPin, Loader2, LocateFixed } from 'lucide-react'
const GENRES: Movie['genre'][] = ['ACTION', 'COMEDY', 'HORROR', 'DRAMA', 'THRILLER', 'ROMANCE', 'SCIFI', 'ANIMATION']
const LANGUAGES: Movie['language'][] = ['HINDI', 'ENGLISH', 'TELUGU', 'TAMIL', 'KANNADA', 'MALAYALAM', 'BENGALI']

export default function BrowseShowsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // City detection (GPS + manual)
  const { selectedCity, setSelectedCity, locationStatus, detectedCity, requestGpsDetection } = useCity()

  // Filter States
  const [search, setSearch] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null)
  const [showCityDropdown, setShowCityDropdown] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const data = await fetchMovies()
        setMovies(data)
      } catch (err) {
        console.error(err)
        setError('Failed to fetch movies. Please check your backend connection.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Filtered movies
  const filteredMovies = useMemo(() => {
    return movies.filter((m) => {
      const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase()) || 
                            m.description.toLowerCase().includes(search.toLowerCase())
      const matchesGenre = selectedGenre ? m.genre === selectedGenre : true
      const matchesLanguage = selectedLanguage ? m.language === selectedLanguage : true
      return matchesSearch && matchesGenre && matchesLanguage && m.isActive
    })
  }, [movies, search, selectedGenre, selectedLanguage])

  // Featured Movie (first active movie)
  const featuredMovie = useMemo(() => {
    return movies.find((m) => m.isActive)
  }, [movies])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-[#f5f0e8] font-sans">
      {/* Navbar */}
      <nav className="border-b border-[#222224] bg-[#111113]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/consumer/browse" className="text-xl font-bold tracking-tight text-[#f5f0e8] flex items-center">
              <span className="text-[#E8B84B] mr-2">▶</span>CineX
            </Link>
            
            {/* City Selector with GPS */}
            <div className="relative">
              <button 
                onClick={() => setShowCityDropdown(!showCityDropdown)}
                className="text-xs bg-[#1C1C1F] border border-[#2a2a2a] hover:border-[#E8B84B] text-zinc-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {locationStatus === 'detecting' ? (
                  <Loader2 className="w-3 h-3 animate-spin text-[#E8B84B]" />
                ) : locationStatus === 'detected' ? (
                  <LocateFixed className="w-3 h-3 text-emerald-400" />
                ) : (
                  <MapPin className="w-3 h-3" />
                )}
                {selectedCity}
                <svg className={`w-3 h-3 transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showCityDropdown && (
                <div className="absolute left-0 mt-2 w-56 bg-[#111113] border border-[#222224] rounded-lg shadow-xl z-50 py-1 max-h-80 overflow-y-auto">
                  {/* GPS Detection Button */}
                  <button
                    onClick={() => {
                      requestGpsDetection()
                      setShowCityDropdown(false)
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-indigo-400 hover:bg-indigo-500/10 transition-colors flex items-center gap-2 border-b border-[#222224] font-semibold cursor-pointer"
                  >
                    <LocateFixed className="w-3.5 h-3.5" />
                    {locationStatus === 'detecting' ? 'Detecting...' : 'Detect My Location'}
                    {locationStatus === 'detected' && detectedCity && (
                      <span className="ml-auto text-[10px] text-emerald-400">✓</span>
                    )}
                  </button>
                  {CITIES.map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        setSelectedCity(city)
                        setShowCityDropdown(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-xs transition-colors hover:bg-[#E8B84B]/10 hover:text-[#E8B84B] cursor-pointer ${selectedCity === city ? 'text-[#E8B84B] bg-[#E8B84B]/5' : 'text-zinc-400'}`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/bookings" className="text-xs text-zinc-400 hover:text-[#E8B84B] transition-colors font-medium">
              My Bookings
            </Link>
            <div className="h-4 w-px bg-[#222224]" />
            <span className="text-xs text-zinc-500 hidden sm:inline-block">
              {user?.email}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout} 
              className="text-xs text-zinc-400 hover:text-[#E8B84B] hover:bg-transparent cursor-pointer"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-4 rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <Button size="xs" variant="outline" onClick={() => window.location.reload()} className="h-7 text-xs border-red-500/30 hover:bg-red-500/10">Retry</Button>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <svg className="animate-spin w-8 h-8 text-[#E8B84B]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p className="text-xs text-zinc-500">Loading cinema collection...</p>
          </div>
        ) : (
          <>
            {/* Hero Featured Movie */}
            {featuredMovie && (
              <div className="relative rounded-2xl overflow-hidden border border-[#222224] bg-[#111113] h-[340px] md:h-[420px] flex items-center">
                {/* Poster Background */}
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-30 blur-sm scale-105" 
                  style={{ backgroundImage: `url(${featuredMovie.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1000'})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D0F] via-[#0D0D0F]/80 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0F] to-transparent" />

                <div className="relative z-10 p-6 md:p-12 max-w-2xl space-y-4 flex flex-col items-start">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#E8B84B] bg-[#E8B84B]/10 border border-[#E8B84B]/20 rounded-md px-2.5 py-1">
                    Featured Movie
                  </span>
                  <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#f5f0e8] drop-shadow-md">
                    {featuredMovie.title}
                  </h1>
                  <p className="text-xs md:text-sm text-zinc-400 line-clamp-3 leading-relaxed">
                    {featuredMovie.description || 'No description provided.'}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300 pt-2">
                    <span className="bg-[#1C1C1F] border border-[#2a2a2a] px-2 py-0.5 rounded font-medium">{featuredMovie.genre}</span>
                    <span className="bg-[#1C1C1F] border border-[#2a2a2a] px-2 py-0.5 rounded font-medium">{featuredMovie.language}</span>
                    <span className="text-zinc-500">•</span>
                    <span>⏱ {featuredMovie.durationMins} mins</span>
                    {featuredMovie.is3D && (
                      <>
                        <span className="text-zinc-500">•</span>
                        <span className="text-[#E8B84B] font-semibold">3D AVAILABLE</span>
                      </>
                    )}
                  </div>

                  <Button 
                    onClick={() => navigate(`/movies/${featuredMovie.id}`)}
                    className="bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-[#0D0D0F] font-bold h-10 px-6 rounded-lg transition-all mt-4 shadow-lg shadow-[#E8B84B]/10 cursor-pointer"
                  >
                    Get Tickets
                  </Button>
                </div>
              </div>
            )}

            {/* Filter Section */}
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-[#f5f0e8] flex items-center gap-2">
                  <span className="w-1.5 h-5 rounded-full bg-[#E8B84B]" />
                  Now Showing in {selectedCity}
                </h2>

                <div className="w-full md:w-80">
                  <Input 
                    type="search" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search movies by title..." 
                    className="bg-[#111113] border-[#222224] text-[#f5f0e8] placeholder:text-zinc-600 focus-visible:border-[#E8B84B] focus-visible:ring-[#E8B84B]/10 h-10 rounded-lg px-4"
                  />
                </div>
              </div>

              {/* Genre Pills */}
              <div className="space-y-3">
                <div className="text-xs text-zinc-500 font-semibold tracking-wider uppercase">Filter by Genre</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedGenre(null)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${!selectedGenre ? 'bg-[#E8B84B] border-[#E8B84B] text-[#0D0D0F]' : 'bg-[#111113] border-[#222224] text-zinc-400 hover:text-[#f5f0e8]'}`}
                  >
                    All Genres
                  </button>
                  {GENRES.map((g) => (
                    <button
                      key={g}
                      onClick={() => setSelectedGenre(selectedGenre === g ? null : g)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${selectedGenre === g ? 'bg-[#E8B84B] border-[#E8B84B] text-[#0D0D0F]' : 'bg-[#111113] border-[#222224] text-zinc-400 hover:text-[#f5f0e8]'}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Pills */}
              <div className="space-y-3">
                <div className="text-xs text-zinc-500 font-semibold tracking-wider uppercase">Filter by Language</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedLanguage(null)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${!selectedLanguage ? 'bg-[#E8B84B] border-[#E8B84B] text-[#0D0D0F]' : 'bg-[#111113] border-[#222224] text-zinc-400 hover:text-[#f5f0e8]'}`}
                  >
                    All Languages
                  </button>
                  {LANGUAGES.map((l) => (
                    <button
                      key={l}
                      onClick={() => setSelectedLanguage(selectedLanguage === l ? null : l)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${selectedLanguage === l ? 'bg-[#E8B84B] border-[#E8B84B] text-[#0D0D0F]' : 'bg-[#111113] border-[#222224] text-zinc-400 hover:text-[#f5f0e8]'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Movie Catalog Grid */}
            {filteredMovies.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-[#222224] rounded-2xl bg-[#111113]/40">
                <div className="text-[#E8B84B] text-3xl mb-3">🎬</div>
                <h3 className="text-sm font-semibold text-[#f5f0e8] mb-1">No movies match your criteria</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">Try clearing your filters or searching for something else.</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setSearch('')
                    setSelectedGenre(null)
                    setSelectedLanguage(null)
                  }}
                  className="mt-4 border-[#2a2a2a] text-zinc-300 hover:bg-[#1C1C1F] hover:text-[#E8B84B]"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredMovies.map((m) => (
                  <Card 
                    key={m.id}
                    className="bg-[#111113] border-[#222224] overflow-hidden group hover:border-[#E8B84B]/40 transition-all duration-300 flex flex-col shadow-lg"
                  >
                    {/* Poster container */}
                    <div className="relative aspect-[2/3] overflow-hidden bg-[#0D0D0F]">
                      <img 
                        src={m.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1000'} 
                        alt={m.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      
                      <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                        <span className="text-[9px] font-bold bg-[#0D0D0F]/90 backdrop-blur border border-[#222224] text-zinc-300 px-2 py-0.5 rounded">
                          {m.language}
                        </span>
                        {m.is3D && (
                          <span className="text-[9px] font-bold bg-[#E8B84B]/95 text-[#0D0D0F] px-2 py-0.5 rounded shadow-sm">
                            3D
                          </span>
                        )}
                      </div>
                    </div>

                    <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                          {m.genre}
                        </div>
                        <h3 className="font-bold text-sm text-[#f5f0e8] line-clamp-1 group-hover:text-[#E8B84B] transition-colors">
                          {m.title}
                        </h3>
                        <p className="text-[10px] text-zinc-400">⏱ {m.durationMins} mins</p>
                      </div>

                      <Button 
                        onClick={() => navigate(`/movies/${m.id}`)}
                        className="w-full bg-[#1C1C1F] hover:bg-[#E8B84B] hover:text-[#0D0D0F] border border-[#2a2a2a] hover:border-transparent text-zinc-300 font-semibold h-8 text-xs rounded-lg transition-all cursor-pointer"
                      >
                        Book Tickets
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
