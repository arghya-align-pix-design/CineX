import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../existing/context/AuthContext'
import { fetchMovieById, searchShows, type Movie, type ShowResponse } from '../../services/consumerApi'
import { useCity, CITIES } from '../../hooks/useCity'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Loader2, LocateFixed } from 'lucide-react'

export default function MovieDetailPage() {
  const { movieId } = useParams<{ movieId: string }>()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [movie, setMovie] = useState<Movie | null>(null)
  const [shows, setShows] = useState<ShowResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const { selectedCity, setSelectedCity, locationStatus, detectedCity, requestGpsDetection } = useCity()
  const [showCityDropdown, setShowCityDropdown] = useState(false)

  // Generate 7 days starting today
  const dates = useMemo(() => {
    const arr = []
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
      const dayNum = d.getDate()
      const month = d.toLocaleDateString('en-US', { month: 'short' })
      // Format YYYY-MM-DD
      const year = d.getFullYear()
      const formattedDate = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
      
      arr.push({ label: `${dayName}, ${dayNum} ${month}`, value: formattedDate })
    }
    return arr
  }, [])

  const [selectedDate, setSelectedDate] = useState(dates[0].value)

  useEffect(() => {
    if (!movieId) return
    async function loadMovieAndShows() {
      try {
        setLoading(true)
        const movieData = await fetchMovieById(Number(movieId))
        setMovie(movieData)
        
        // Fetch shows for this movie on the selected date
        const showsData = await searchShows({ movieId: Number(movieId), date: selectedDate })
        setShows(showsData)
      } catch (err) {
        console.error(err)
        setError('Failed to load movie details or showtimes.')
      } finally {
        setLoading(false)
      }
    }
    loadMovieAndShows()
  }, [movieId, selectedDate])

  // Filter shows running in the selected city
  const cityFilteredShows = useMemo(() => {
    return shows.filter(s => s.city.toLowerCase() === selectedCity.toLowerCase())
  }, [shows, selectedCity])

  // Group shows by Theatre name
  const groupedShows = useMemo(() => {
    const groups: { [theatreName: string]: ShowResponse[] } = {}
    cityFilteredShows.forEach(show => {
      if (!groups[show.theatreName]) {
        groups[show.theatreName] = []
      }
      groups[show.theatreName].push(show)
    })
    return groups
  }, [cityFilteredShows])

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

      {loading && !movie ? (
        <div className="flex flex-col items-center justify-center py-40 space-y-4">
          <svg className="animate-spin w-8 h-8 text-[#E8B84B]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <p className="text-xs text-zinc-500">Retrieving showtimes...</p>
        </div>
      ) : (
        movie && (
          <div>
            {/* Backdrop / Banner */}
            <div className="relative h-[280px] md:h-[380px] overflow-hidden border-b border-[#222224]">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-25 blur-[2px] scale-105" 
                style={{ backgroundImage: `url(${movie.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1000'})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0F] via-[#0D0D0F]/80 to-transparent" />
              
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col md:flex-row items-end gap-6 pb-6 relative z-10">
                {/* Poster container */}
                <div className="w-28 md:w-44 shrink-0 aspect-[2/3] rounded-xl overflow-hidden border border-[#222224] shadow-2xl bg-[#111113] hidden sm:block">
                  <img src={movie.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1000'} alt={movie.title} className="w-full h-full object-cover" />
                </div>
                
                <div className="space-y-3 pb-2">
                  <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-[#f5f0e8]">
                    {movie.title}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-2.5 text-xs text-zinc-300">
                    <span className="bg-[#1C1C1F] border border-[#2a2a2a] px-2 py-0.5 rounded font-medium">{movie.genre}</span>
                    <span className="bg-[#1C1C1F] border border-[#2a2a2a] px-2 py-0.5 rounded font-medium">{movie.language}</span>
                    <span className="text-zinc-500">•</span>
                    <span>⏱ {movie.durationMins} mins</span>
                    {movie.is3D && (
                      <>
                        <span className="text-zinc-500">•</span>
                        <span className="text-[#E8B84B] font-semibold">3D AVAILABLE</span>
                      </>
                    )}
                  </div>
                  
                  <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed mt-2 line-clamp-2 sm:line-clamp-none">
                    {movie.description || 'No description available for this film.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Date Selection Bar */}
            <div className="bg-[#111113] border-b border-[#222224] sticky top-16 z-40">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 overflow-x-auto flex gap-3 scrollbar-none">
                {dates.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setSelectedDate(d.value)}
                    className={`shrink-0 px-4 py-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${selectedDate === d.value ? 'bg-[#E8B84B] border-[#E8B84B] text-[#0D0D0F]' : 'bg-[#0D0D0F] border-[#222224] text-zinc-400 hover:text-[#f5f0e8]'}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Showtimes List */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              {error && <div className="text-xs text-red-400 bg-red-500/5 border border-red-500/10 rounded-lg p-4 mb-6">{error}</div>}

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <svg className="animate-spin w-6 h-6 text-[#E8B84B]" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  <p className="text-xs text-zinc-500">Updating show schedules...</p>
                </div>
              ) : Object.keys(groupedShows).length === 0 ? (
                <div className="text-center py-24 border border-dashed border-[#222224] rounded-2xl bg-[#111113]/30">
                  <div className="text-zinc-500 text-3xl mb-3">📭</div>
                  <h3 className="text-sm font-semibold text-zinc-300">No shows available</h3>
                  <p className="text-xs text-zinc-500 max-w-xs mx-auto mt-1">There are no showtimes scheduled for this movie in {selectedCity} on {dates.find(d => d.value === selectedDate)?.label}.</p>
                  <Link to="/consumer/browse">
                    <Button size="sm" variant="outline" className="mt-4 border-[#2a2a2a] text-zinc-300 hover:text-[#E8B84B]">
                      ← Back to Movies
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.keys(groupedShows).map((theatreName) => (
                    <Card key={theatreName} className="bg-[#111113] border-[#222224] text-[#f5f0e8] overflow-hidden">
                      <CardContent className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1">
                          <h3 className="font-bold text-base text-[#f5f0e8] hover:text-[#E8B84B] transition-colors">
                            {theatreName}
                          </h3>
                          <p className="text-xs text-zinc-500">📍 {selectedCity}</p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          {groupedShows[theatreName].map((show) => {
                            const isSoldOut = show.availability === 'SOLD OUT'
                            const isFilling = show.availability === 'FAST FILLING'
                            
                            return (
                              <button
                                key={show.id}
                                disabled={isSoldOut}
                                onClick={() => navigate(`/shows/${show.id}`)}
                                className={`px-4 py-2.5 rounded-lg border text-xs font-semibold transition-all flex flex-col items-center gap-0.5 min-w-[100px] cursor-pointer ${
                                  isSoldOut 
                                    ? 'bg-[#1C1C1F]/40 border-[#222224] text-zinc-600 cursor-not-allowed'
                                    : 'bg-[#0D0D0F] border-[#2a2a2a] text-[#f5f0e8] hover:border-[#E8B84B] hover:shadow-lg'
                                }`}
                              >
                                <span>{show.showTime.substring(0, 5)}</span>
                                <span className={`text-[8px] font-bold uppercase ${
                                  isSoldOut 
                                    ? 'text-zinc-600' 
                                    : isFilling 
                                      ? 'text-amber-500' 
                                      : 'text-[#4ade80]'
                                }`}>
                                  {show.availability}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      )}
    </div>
  )
}
