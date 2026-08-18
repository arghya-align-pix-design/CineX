import { useState, useEffect, useCallback, createContext, useContext, type ReactNode, createElement } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Comprehensive Indian city list — grouped by region for maintainability
// ─────────────────────────────────────────────────────────────────────────────
export const CITIES = [
  'Agra',
  'Ahmedabad',
  'Amritsar',
  'Bengaluru',
  'Bhopal',
  'Bhubaneswar',
  'Chandigarh',
  'Chennai',
  'Coimbatore',
  'Dehradun',
  'Delhi NCR',
  'Goa',
  'Gurgaon',
  'Guwahati',
  'Hyderabad',
  'Indore',
  'Jaipur',
  'Jharkhand',
  'Kanpur',
  'Kochi',
  'Kolkata',
  'Lucknow',
  'Madurai',
  'Mangaluru',
  'Mumbai',
  'Mysuru',
  'Nagpur',
  'Noida',
  'Patna',
  'Pune',
  'Ranchi',
  'Siliguri',
  'Surat',
  'Thiruvananthapuram',
  'Vadodara',
  'Varanasi',
  'Vijayawada',
  'Visakhapatnam'
]

// Map of common Nominatim city name variants → our canonical CITIES entries
const CITY_ALIASES: Record<string, string> = {
  'new delhi': 'Delhi NCR',
  'delhi': 'Delhi NCR',
  'south delhi': 'Delhi NCR',
  'north delhi': 'Delhi NCR',
  'central delhi': 'Delhi NCR',
  'east delhi': 'Delhi NCR',
  'west delhi': 'Delhi NCR',
  'bengaluru': 'Bengaluru',
  'bangalore': 'Bengaluru',
  'mumbai': 'Mumbai',
  'kolkata': 'Kolkata',
  'calcutta': 'Kolkata',
  'hyderabad': 'Hyderabad',
  'chennai': 'Chennai',
  'madras': 'Chennai',
  'pune': 'Pune',
  'gurugram': 'Gurgaon',
  'gurgaon': 'Gurgaon',
  'noida': 'Noida',
  'greater noida': 'Noida',
  'ghaziabad': 'Delhi NCR',
  'faridabad': 'Delhi NCR',
  'thiruvananthapuram': 'Thiruvananthapuram',
  'trivandrum': 'Thiruvananthapuram',
  'mysore': 'Mysuru',
  'mysuru': 'Mysuru',
  'mangalore': 'Mangaluru',
  'mangaluru': 'Mangaluru',
  'vishakhapatnam': 'Visakhapatnam',
  'visakhapatnam': 'Visakhapatnam',
  'vizag': 'Visakhapatnam',
  'panaji': 'Goa',
  'vasco da gama': 'Goa',
  'margao': 'Goa',
  'jharkhand': 'Jharkhand',
  'ranchi': 'Ranchi',
}

type LocationStatus = 'idle' | 'detecting' | 'detected' | 'denied' | 'error'



/**
 * Reverse-geocodes lat/lng into a city name using Nominatim (OpenStreetMap).
 * Free, no API key, max 1 req/sec.
 */
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`
    const response = await fetch(url, {
      headers: { 'User-Agent': 'CineX-Cinema-App/1.0' } // Nominatim requires a User-Agent
    })
    if (!response.ok) return null

    const data = await response.json()
    const addr = data.address || {}

    // Nominatim returns city in various fields depending on the location
    const rawCity = addr.city || addr.town || addr.village || addr.county || addr.state_district || ''
    return rawCity || null
  } catch {
    return null
  }
}

/**
 * Matches a raw Nominatim city string to our canonical CITIES list.
 * Uses alias map first, then fuzzy substring match.
 */
function matchToKnownCity(rawCity: string): string | null {
  const lower = rawCity.toLowerCase().trim()

  // Exact alias match
  if (CITY_ALIASES[lower]) return CITY_ALIASES[lower]

  // Direct match in CITIES list (case-insensitive)
  const directMatch = CITIES.find(c => c.toLowerCase() === lower)
  if (directMatch) return directMatch

  // Substring match (e.g., "Pune District" contains "Pune")
  const substringMatch = CITIES.find(c => lower.includes(c.toLowerCase()))
  if (substringMatch) return substringMatch

  return null
}

interface CityContextType {
  selectedCity: string
  setSelectedCity: (city: string) => void
  locationStatus: LocationStatus
  detectedCity: string | null
  requestGpsDetection: (forceOverride?: boolean) => void
}

const CityContext = createContext<CityContextType | null>(null)

export function CityProvider({ children }: { children: ReactNode }) {
  const [selectedCity, setSelectedCityState] = useState<string>(() => {
    return localStorage.getItem('cinex_selected_city') || CITIES[0]
  })
  const [locationStatus, setLocationStatus] = useState<LocationStatus>(() => {
    return (localStorage.getItem('cinex_location_status') as LocationStatus) || 'idle'
  })
  const [detectedCity, setDetectedCity] = useState<string | null>(() => {
    return localStorage.getItem('cinex_detected_city') || null
  })
  const [hasManualSelection, setHasManualSelection] = useState<boolean>(() => {
    return localStorage.getItem('cinex_has_manual_selection') === 'true'
  })

  const setSelectedCity = useCallback((city: string) => {
    setSelectedCityState(city)
    setHasManualSelection(true)
    localStorage.setItem('cinex_selected_city', city)
    localStorage.setItem('cinex_has_manual_selection', 'true')
  }, [])

  const requestGpsDetection = useCallback((forceOverride: boolean = false) => {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      localStorage.setItem('cinex_location_status', 'error')
      return
    }

    setLocationStatus('detecting')
    localStorage.setItem('cinex_location_status', 'detecting')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const rawCity = await reverseGeocode(latitude, longitude)

        if (rawCity) {
          const matched = matchToKnownCity(rawCity)
          if (matched) {
            setDetectedCity(matched)
            localStorage.setItem('cinex_detected_city', matched)
            setLocationStatus('detected')
            localStorage.setItem('cinex_location_status', 'detected')

            if (forceOverride || !hasManualSelection) {
              setSelectedCityState(matched)
              localStorage.setItem('cinex_selected_city', matched)
              if (forceOverride) {
                setHasManualSelection(false)
                localStorage.setItem('cinex_has_manual_selection', 'false')
              }
            }
          } else {
            setDetectedCity(rawCity)
            localStorage.setItem('cinex_detected_city', rawCity)
            setLocationStatus('detected')
            localStorage.setItem('cinex_location_status', 'detected')
          }
        } else {
          setLocationStatus('error')
          localStorage.setItem('cinex_location_status', 'error')
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus('denied')
          localStorage.setItem('cinex_location_status', 'denied')
        } else {
          setLocationStatus('error')
          localStorage.setItem('cinex_location_status', 'error')
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  }, [])

  useEffect(() => {
    requestGpsDetection(false)
  }, [requestGpsDetection])

  return createElement(
    CityContext.Provider,
    {
      value: {
        selectedCity,
        setSelectedCity,
        locationStatus,
        detectedCity,
        requestGpsDetection,
      }
    },
    children
  )
}

export function useCity(): CityContextType {
  const context = useContext(CityContext)
  if (!context) {
    throw new Error('useCity must be used within a CityProvider')
  }
  return context
}
