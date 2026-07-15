import api from '../existing/api/axios'

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
}

export interface ShowResponse {
  id: number
  movieTitle: string
  theatreName: string
  city: string
  sectionName: string
  seatType: string
  showDate: string
  showTime: string
  basePrice: number
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED'
  totalSeats: number
  bookedSeats: number
  availability: 'AVAILABLE' | 'FAST FILLING' | 'SOLD OUT'
}

export interface SeatStatus {
  seatCode: string
  status: 'AVAILABLE' | 'IN_CHECKOUT' | 'BOOKED'
}

export interface ShowSeatsResponse {
  showId: number
  movieTitle: string
  showDate: string
  showTime: string
  sectionName: string
  seatType: string
  basePrice: number
  seats: SeatStatus[]
}

export interface BookingResponse {
  id: number
  bookingRef: string
  movieTitle: string
  theatreName: string
  showDate: string
  showTime: string
  seatCodes: string[]
  totalPrice: number
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  createdAt: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Movies
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchMovies(): Promise<Movie[]> {
  const { data } = await api.get<Movie[]>('/movies')
  return data
}

export async function fetchMovieById(id: number): Promise<Movie> {
  const { data } = await api.get<Movie>(`/movies/${id}`)
  return data
}

// ─────────────────────────────────────────────────────────────────────────────
// Shows
// ─────────────────────────────────────────────────────────────────────────────

export async function searchShows(params: { city?: string; date?: string; movieId?: number }): Promise<ShowResponse[]> {
  const queryParams = new URLSearchParams()
  if (params.city) queryParams.append('city', params.city)
  if (params.date) queryParams.append('date', params.date)
  if (params.movieId) queryParams.append('movieId', params.movieId.toString())

  const { data } = await api.get<ShowResponse[]>(`/shows?${queryParams.toString()}`)
  return data
}

export async function fetchShowSeats(showId: number): Promise<ShowSeatsResponse> {
  const { data } = await api.get<ShowSeatsResponse>(`/shows/${showId}/seats`)
  return data
}

// ─────────────────────────────────────────────────────────────────────────────
// Bookings
// ─────────────────────────────────────────────────────────────────────────────

export async function initiateBooking(showId: number, seatCodes: string[]): Promise<BookingResponse> {
  const { data } = await api.post<BookingResponse>('/bookings/initiate', {
    showId,
    seatCodes,
  })
  return data
}

export async function confirmBooking(bookingRef: string): Promise<BookingResponse> {
  const { data } = await api.post<BookingResponse>(`/bookings/confirm/${bookingRef}`)
  return data
}

export async function fetchMyBookings(): Promise<BookingResponse[]> {
  const { data } = await api.get<BookingResponse[]>('/bookings/my')
  return data
}

// ─────────────────────────────────────────────────────────────────────────────
// Payments
// ─────────────────────────────────────────────────────────────────────────────

export interface PaymentOrderResponse {
  key: string
  orderId: string
  amount: number
  currency: string
  bookingRef: string
}

export interface PaymentVerifyRequest {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}

export async function createPaymentOrder(bookingRef: string): Promise<PaymentOrderResponse> {
  const { data } = await api.post<PaymentOrderResponse>('/payments/create-order', null, {
    params: { bookingRef }
  })
  return data
}

export async function verifyPayment(req: PaymentVerifyRequest): Promise<BookingResponse> {
  const { data } = await api.post<BookingResponse>('/payments/verify', req)
  return data
}
