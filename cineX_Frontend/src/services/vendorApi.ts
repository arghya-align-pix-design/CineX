import api from '../existing/api/axios'

export interface VendorStats {
  totalTheatres: number
  totalShows: number
  upcomingShows: number
  totalBookings: number
  totalRevenue: number
}

export interface Theatre {
  id: number
  name: string
  addressLine: string
  pincode: string
  city: string
  district: string
  state: string
  openTime: string
  closeTime: string
  hasRecliner: boolean
  active: boolean
  sections?: Section[]
  screens?: Screen[]
}

export interface LayoutSeat {
  col: number
  code: string
  status: 'ACTIVE' | 'REMOVED'
}

export interface LayoutRow {
  rowLabel: string
  rowOrder: number
  zone: string
  seats: LayoutSeat[]
}

export interface Zone {
  name: string
  type: string
  priceMultiplier: number
  color: string
}

export interface AisleConfig {
  afterRows: number[]
  afterCols: number[]
}

export interface LayoutMeta {
  maxCols: number
  rowGap: number
  colGap: number
  totalActiveSeats: number
}

export interface ScreenLayout {
  rows: LayoutRow[]
  zones: Zone[]
  aisles: AisleConfig
  meta: LayoutMeta
}

export interface Screen {
  id: number
  name: string
  soundSystem?: string
  projection?: string
  totalSeats: number
  maxCapacity: number
  active: boolean
  screenLayout?: ScreenLayout
}

export interface ScreenRequest {
  name: string
  soundSystem?: string
  projection?: string
  maxCapacity: number
}


export interface SeatGridConfig {
  rows: number
  columns: number
  seatCodes: string[]
  damagedSeats: string[]
  unavailableSeats: string[]
  aisles: number[]
}

export interface Section {
  id: number
  name: string
  seatType: 'EXECUTIVE' | 'SILVER' | 'GOLD' | 'BALCONY' | 'PLATINUM' | 'RECLINER'
  rows: number
  cols: number
  priceMultiplier: number
  isActive: boolean
  seatGrid: SeatGridConfig
}

export interface SectionRequest {
  name: string
  seatType: string
  rows: number
  cols: number
  priceMultiplier: number
}

export interface Movie {
  id: number
  title: string
  description: string
  genre: 'ACTION' | 'COMEDY' | 'HORROR' | 'DRAMA' | 'THRILLER' | 'ROMANCE' | 'SCIFI' | 'ANIMATION'
  language: 'HINDI' | 'ENGLISH' | 'TELUGU' | 'TAMIL' | 'KANNADA' | 'MALAYALAM' | 'BENGALI'
  durationMins: number
  posterUrl: string
  is3D: boolean
  releaseDate: string
  endDate: string
  isActive: boolean
  producer: string
}

export interface Show {
  id: number
  movie: Movie
  theatre: Theatre
  section?: Section
  screen?: Screen
  showDate: string
  showTime: string
  basePrice: number
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED'
  totalSeats: number
  bookedSeats: number
  active: boolean
}

export interface ShowRequest {
  movieId: number
  theatreId: number
  sectionId?: number
  screenId?: number
  showDate: string
  showTime: string
  basePrice: number
}


// Stats
export async function fetchVendorStats(): Promise<VendorStats> {
  const { data } = await api.get<VendorStats>('/vendor/dashboard/stats')
  return data
}

// Shows
export async function fetchVendorShows(): Promise<Show[]> {
  const { data } = await api.get<Show[]>('/vendor/dashboard/shows')
  return data
}

export async function createShow(show: ShowRequest): Promise<Show> {
  const { data } = await api.post<Show>('/shows', show)
  return data
}

// Movies
export async function fetchAvailableMovies(): Promise<Movie[]> {
  const { data } = await api.get<Movie[]>('/vendor/dashboard/movies')
  return data
}

// Theatres
export async function fetchMyTheatres(): Promise<Theatre[]> {
  const { data } = await api.get<Theatre[]>('/theatres/my')
  return data
}

export interface TheatreRequest {
  name: string
  addressLine: string
  pincode: string
  city: string
  district: string
  state: string
  openTime: string
  closeTime: string
  hasRecliner: boolean
}

export async function createTheatre(theatre: TheatreRequest): Promise<Theatre> {
  const { data } = await api.post<Theatre>('/theatres', theatre)
  return data
}

// Sections
export async function addSection(theatreId: number, section: SectionRequest): Promise<Section> {
  const { data } = await api.post<Section>(`/theatres/${theatreId}/sections`, section)
  return data
}

export async function getSections(theatreId: number): Promise<Section[]> {
  const { data } = await api.get<Section[]>(`/theatres/${theatreId}/sections`)
  return data
}

export async function updateSection(theatreId: number, sectionId: number, section: SectionRequest): Promise<Section> {
  const { data } = await api.put<Section>(`/theatres/${theatreId}/sections/${sectionId}`, section)
  return data
}

export async function deleteSection(theatreId: number, sectionId: number): Promise<string> {
  const { data } = await api.delete<string>(`/theatres/${theatreId}/sections/${sectionId}`)
  return data
}

// Screens
export async function createScreen(theatreId: number, screen: ScreenRequest): Promise<Screen> {
  const { data } = await api.post<Screen>(`/theatres/${theatreId}/screens`, screen)
  return data
}

export async function getScreens(theatreId: number): Promise<Screen[]> {
  const { data } = await api.get<Screen[]>(`/theatres/${theatreId}/screens`)
  return data
}

export async function getScreen(screenId: number): Promise<Screen> {
  const { data } = await api.get<Screen>(`/screens/${screenId}`)
  return data
}

export async function saveScreenLayout(screenId: number, layout: ScreenLayout): Promise<Screen> {
  const { data } = await api.put<Screen>(`/screens/${screenId}/layout`, { layout })
  return data
}

export async function updateScreen(screenId: number, screen: ScreenRequest): Promise<Screen> {
  const { data } = await api.put<Screen>(`/screens/${screenId}`, screen)
  return data
}

export async function deleteScreen(screenId: number): Promise<string> {
  const { data } = await api.delete<string>(`/screens/${screenId}`)
  return data
}

