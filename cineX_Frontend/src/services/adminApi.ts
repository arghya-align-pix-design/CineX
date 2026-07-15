import api from '../existing/api/axios'

export { loginAdmin } from '../existing/api/axios'

export interface VendorResponse {
  id: number
  email: string
  approved: boolean
  firstLogin: boolean
}

export interface BannedVendor {
  id: number
  email: string
  reason: string
  bannedAt: string
  bannedBy: string
}

export interface PlatformStats {
  totalVendors: number
  activeVendors: number
  suspendedVendors: number
  bannedVendors: number
  totalMovies: number
  activeMovies: number
}

export interface MovieImage {
  id: number
  imageUrl: string
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
  director?: string
  actors?: string
  totalViewers?: number
  totalRevenue?: number
  images: MovieImage[]
}

export interface MovieRequest {
  title: string
  description: string
  genre: string
  language: string
  durationMins: number
  posterUrl: string
  is3D: boolean
  releaseDate: string
  endDate: string
  producer: string
  director: string
  actors: string
  imageUrls: string[]
}

// Vendors
export async function fetchVendors(): Promise<VendorResponse[]> {
  const { data } = await api.get<VendorResponse[]>('/admin/vendors')
  return data
}

export async function inviteVendor(email: string): Promise<string> {
  const { data } = await api.post<string>('/admin/vendors/invite', { email })
  return data
}

export async function suspendVendor(id: number): Promise<string> {
  const { data } = await api.put<string>(`/admin/vendors/${id}/suspend`)
  return data
}

export async function reactivateVendor(id: number): Promise<string> {
  const { data } = await api.put<string>(`/admin/vendors/${id}/reactivate`)
  return data
}

export async function banVendor(id: number, reason: string): Promise<string> {
  const { data } = await api.post<string>(`/admin/vendors/${id}/ban`, { reason })
  return data
}

export async function deleteVendor(id: number): Promise<string> {
  const { data } = await api.delete<string>(`/admin/vendors/${id}`)
  return data
}

export async function fetchBannedVendors(): Promise<BannedVendor[]> {
  const { data } = await api.get<BannedVendor[]>('/admin/vendors/banned')
  return data
}

// Stats
export async function fetchPlatformStats(): Promise<PlatformStats> {
  const { data } = await api.get<PlatformStats>('/admin/stats')
  return data
}

// Movies
export async function fetchAllMoviesAdmin(): Promise<Movie[]> {
  const { data } = await api.get<Movie[]>('/admin/movies')
  return data
}

export async function createMovie(movie: MovieRequest): Promise<Movie> {
  const { data } = await api.post<Movie>('/admin/movies', movie)
  return data
}

export async function updateMovie(id: number, movie: MovieRequest): Promise<Movie> {
  const { data } = await api.put<Movie>(`/admin/movies/${id}`, movie)
  return data
}

export async function toggleMovieActive(id: number): Promise<Movie> {
  const { data } = await api.put<Movie>(`/admin/movies/${id}/toggle-active`)
  return data
}
