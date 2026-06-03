// ── Types ──
export type SeatType = 'SILVER' | 'GOLD' | 'EXECUTIVE' | 'BALCONY' | 'PLATINUM' | 'RECLINER'

export type Seat = {
  id:      number
  code:    string   // e.g. "A3" — what the backend stores
  type:    SeatType
  removed: boolean
}

export type RowItem = {
  kind:  'row'
  id:    number
  seats: Seat[]
}

export type SectionItem = {
  kind:            'section'
  id:              number
  backendId:       number | null   // null until first POST; set from response
  name:            string
  seatType:        SeatType
  priceMultiplier: number          // e.g. 1.5  — matches backend field
  color:           string
}

export type LayoutItem = SectionItem | RowItem

// ── Module-level ID counters ──
let _sid = 0, _rid = 0, _secid = 0
export const nsi  = () => _sid++
export const nri  = () => _rid++
export const nsec = () => _secid++

// ── Seat visual config ──
export const SEAT_CONFIG: Record<SeatType, {
  bg: string; border: string; darkBg: string; darkBorder: string; height: number; color: string
}> = {
  SILVER:    { bg: '#C9C7C4', border: '#96948E', darkBg: '#3A3836', darkBorder: '#6A6860', height: 26, color: '#C9C7C4' },
  GOLD:      { bg: '#C4A140', border: '#926C10', darkBg: '#3A2C08', darkBorder: '#C4A140', height: 26, color: '#C4A140' },
  EXECUTIVE: { bg: '#ADADAA', border: '#767472', darkBg: '#2E2E2C', darkBorder: '#686666', height: 26, color: '#ADADAA' },
  BALCONY:   { bg: '#A8C4D4', border: '#5A8CA8', darkBg: '#0E2A38', darkBorder: '#5A8CA8', height: 26, color: '#A8C4D4' },
  PLATINUM:  { bg: '#C8C0D8', border: '#8870B0', darkBg: '#1E1428', darkBorder: '#8870B0', height: 26, color: '#C8C0D8' },
  RECLINER:  { bg: '#89A468', border: '#4C6C34', darkBg: '#1C2E12', darkBorder: '#89A468', height: 44, color: '#89A468' },
}

export const SEAT_TYPES: SeatType[] = ['SILVER', 'GOLD', 'EXECUTIVE', 'BALCONY', 'PLATINUM', 'RECLINER']

const DEFAULT_MULTIPLIER: Record<SeatType, number> = {
  SILVER:    1.0,
  GOLD:      1.5,
  EXECUTIVE: 1.3,
  BALCONY:   1.2,
  PLATINUM:  1.8,
  RECLINER:  2.0,
}

// ── Row label: A–Z then AA, AB… ──
export const ROW_LABEL = (i: number): string =>
  i < 26
    ? String.fromCharCode(65 + i)
    : String.fromCharCode(64 + Math.floor(i / 26)) + String.fromCharCode(65 + (i % 26))

// ── Factories ──
export const mkSeat = (type: SeatType, code: string): Seat => ({
  id: nsi(), code, type, removed: false,
})

export const mkRow = (seats: Seat[]): RowItem => ({ kind: 'row', id: nri(), seats })

export const mkSection = (type: SeatType): SectionItem => ({
  kind:            'section',
  id:              nsec(),
  backendId:       null,
  name:            `${type.charAt(0) + type.slice(1).toLowerCase()} Section`,
  seatType:        type,
  priceMultiplier: DEFAULT_MULTIPLIER[type],
  color:           SEAT_CONFIG[type].color,
})

// Build a fresh row with correct seat codes given the global row index
export const mkRowWithCodes = (
  type:            SeatType,
  cols:            number,
  globalRowIndex:  number,
): RowItem => {
  const label = ROW_LABEL(globalRowIndex)
  return mkRow(
    Array.from({ length: cols }, (_, ci) => mkSeat(type, `${label}${ci + 1}`))
  )
}

// ── Default seed layout ──
export function createSeedLayout(): { layout: LayoutItem[]; aisles: Set<number> } {
  const silverSec   = mkSection('SILVER')
  const goldSec     = mkSection('GOLD')
  const reclinerSec = mkSection('RECLINER')

  const silverRows  = Array.from({ length: 3 }, (_, ri) => mkRowWithCodes('SILVER',   12, ri))
  const goldRows    = Array.from({ length: 2 }, (_, ri) => mkRowWithCodes('GOLD',     12, ri + 3))
  const reclRows    = [mkRowWithCodes('RECLINER', 8, 5)]

  return {
    layout: [silverSec, ...silverRows, goldSec, ...goldRows, reclinerSec, ...reclRows],
    aisles: new Set([5]),
  }
}

// ── Dark mode hook (reactive) ──
// Use this in a component with useState/useEffect instead of calling isDarkMode() inline
export function isDarkMode(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}
