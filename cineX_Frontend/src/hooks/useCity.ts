import { useState, useEffect, useCallback } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Comprehensive Indian city list — grouped by region for maintainability
// ─────────────────────────────────────────────────────────────────────────────
export const CITIES = [
  // Metro cities
  'Delhi NCR', 'Mumbai', 'Bengaluru', 'Kolkata', 'Hyderabad', 'Chennai', 'Pune',
  // North India
  'Jaipur', 'Lucknow', 'Chandigarh', 'Amritsar', 'Dehradun', 'Noida', 'Gurgaon',
  'Agra', 'Varanasi', 'Kanpur', 'Patna', 'Ranchi',
  // West India
  'Ahmedabad', 'Surat', 'Vadodara', 'Nagpur', 'Indore', 'Bhopal', 'Goa',
  // South India
  'Kochi', 'Thiruvananthapuram', 'Coimbatore', 'Visakhapatnam', 'Vijayawada',
  'Madurai', 'Mysuru', 'Mangaluru',
  // East India
  'Bhubaneswar', 'Guwahati', 'Siliguri',
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
}

type LocationStatus = 'idle' | 'detecting' | 'detected' | 'denied' | 'error'

interface UseCityReturn {
  selectedCity: string
  setSelectedCity: (city: string) => void
  locationStatus: LocationStatus
  detectedCity: string | null
  requestGpsDetection: () => void
}

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

export function useCity(defaultCity: string = CITIES[0]): UseCityReturn {
  const [selectedCity, setSelectedCity] = useState(defaultCity)
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle')
  const [detectedCity, setDetectedCity] = useState<string | null>(null)

  const requestGpsDetection = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      return
    }

    setLocationStatus('detecting')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const rawCity = await reverseGeocode(latitude, longitude)

        if (rawCity) {
          const matched = matchToKnownCity(rawCity)
          if (matched) {
            setDetectedCity(matched)
            setSelectedCity(matched)
            setLocationStatus('detected')
          } else {
            // GPS worked but city isn't in our list — still show what we found
            setDetectedCity(rawCity)
            setLocationStatus('detected')
          }
        } else {
          setLocationStatus('error')
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus('denied')
        } else {
          setLocationStatus('error')
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  }, [])

  // Auto-detect on mount (asks browser permission once)
  useEffect(() => {
    requestGpsDetection()
  }, [requestGpsDetection])

  return {
    selectedCity,
    setSelectedCity,
    locationStatus,
    detectedCity,
    requestGpsDetection,
  }
}
