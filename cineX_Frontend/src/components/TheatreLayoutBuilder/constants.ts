// ── Types ──
export type SeatType = 'SILVER' | 'GOLD' | 'EXECUTIVE' | 'BALCONY' | 'PLATINUM' | 'RECLINER'

export type Seat = {
  id:      number
  code:    string   // e.g. "A3"
  type:    SeatType
  removed: boolean
}

export type RowItem = {
  kind:     'row'
  id:       number
  rowLabel: string
  zone:     string // references Zone.type
  seats:    Seat[]
}

export type Zone = {
  name:            string
  type:            string
  priceMultiplier: number
  color:           string
}

export type LayoutItem = RowItem

// ── Module-level ID counters ──
let _sid = 0, _rid = 0
export const nsi  = () => _sid++
export const nri  = () => _rid++

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

export const DEFAULT_MULTIPLIER: Record<SeatType, number> = {
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

export const mkRow = (rowLabel: string, zone: string, seats: Seat[]): RowItem => ({
  kind: 'row', id: nri(), rowLabel, zone, seats,
})

// Build a fresh row with correct seat codes given the global row index and label
export const mkRowWithCodes = (
  type:            SeatType,
  cols:            number,
  globalRowIndex:  number,
  label?:          string,
): RowItem => {
  const rowLabel = label || ROW_LABEL(globalRowIndex)
  return mkRow(
    rowLabel,
    type,
    Array.from({ length: cols }, (_, ci) => mkSeat(type, `${rowLabel}${ci + 1}`))
  )
}

// ── Default empty seed layout ──
export function createSeedLayout(): { layout: LayoutItem[]; aisles: Set<number>; zones: Zone[] } {
  const zones: Zone[] = [
    { name: 'Silver', type: 'SILVER', priceMultiplier: 1.0, color: SEAT_CONFIG.SILVER.color },
    { name: 'Gold', type: 'GOLD', priceMultiplier: 1.5, color: SEAT_CONFIG.GOLD.color },
    { name: 'Recliner', type: 'RECLINER', priceMultiplier: 2.0, color: SEAT_CONFIG.RECLINER.color },
  ]
  
  // Start with 6 default rows for user convenience
  const rows = [
    mkRowWithCodes('SILVER', 12, 0),
    mkRowWithCodes('SILVER', 12, 1),
    mkRowWithCodes('SILVER', 12, 2),
    mkRowWithCodes('GOLD', 12, 3),
    mkRowWithCodes('GOLD', 12, 4),
    mkRowWithCodes('RECLINER', 8, 5),
  ]

  return {
    layout: rows,
    aisles: new Set([4, 8]),
    zones,
  }
}

export function isDarkMode(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

