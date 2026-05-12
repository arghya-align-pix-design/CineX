// ── Types ──
export type SeatType = 'SILVER' | 'GOLD' | 'EXECUTIVE' | 'RECLINER'

export type Seat = {
  id: number
  type: SeatType
  removed: boolean
}

export type RowItem = {
  kind: 'row'
  id: number
  seats: Seat[]
}

export type SectionItem = {
  kind: 'section'
  id: number
  name: string
  seatType: SeatType
  price: number
  color: string
}

export type LayoutItem = SectionItem | RowItem

// ── Module-level ID counters (never reused) ──
let _sid = 0, _rid = 0, _secid = 0
export const nsi = () => _sid++
export const nri = () => _rid++
export const nsec = () => _secid++

// ── Seat visual config ──
export const SEAT_CONFIG: Record<SeatType, {
  bg: string; border: string; darkBg: string; darkBorder: string; height: number; color: string
}> = {
  SILVER:    { bg: '#C9C7C4', border: '#96948E', darkBg: '#3A3836', darkBorder: '#6A6860', height: 26, color: '#C9C7C4' },
  GOLD:      { bg: '#C4A140', border: '#926C10', darkBg: '#3A2C08', darkBorder: '#C4A140', height: 26, color: '#C4A140' },
  EXECUTIVE: { bg: '#ADADAA', border: '#767472', darkBg: '#2E2E2C', darkBorder: '#686666', height: 26, color: '#ADADAA' },
  RECLINER:  { bg: '#89A468', border: '#4C6C34', darkBg: '#1C2E12', darkBorder: '#89A468', height: 44, color: '#89A468' },
}

export const SEAT_TYPES: SeatType[] = ['SILVER', 'GOLD', 'EXECUTIVE', 'RECLINER']

// ── Helpers ──
export const ROW_LABEL = (i: number): string =>
  i < 26
    ? String.fromCharCode(65 + i)
    : String.fromCharCode(64 + Math.floor(i / 26)) + String.fromCharCode(65 + (i % 26))

export const mkSeat = (type: SeatType): Seat => ({ id: nsi(), type, removed: false })

export const mkRow = (seats: Seat[]): RowItem => ({ kind: 'row', id: nri(), seats })

export const mkSection = (type: SeatType): SectionItem => ({
  kind: 'section',
  id: nsec(),
  name: `${type.charAt(0) + type.slice(1).toLowerCase()} Section`,
  seatType: type,
  price: type === 'SILVER' ? 150 : type === 'GOLD' ? 280 : type === 'EXECUTIVE' ? 350 : 480,
  color: SEAT_CONFIG[type].color,
})

// ── Default seed layout ──
export function createSeedLayout(): { layout: LayoutItem[]; aisles: Set<number> } {
  const silverSec = mkSection('SILVER')
  const goldSec = mkSection('GOLD')
  const reclinerSec = mkSection('RECLINER')

  const silverRows = Array.from({ length: 3 }, () =>
    mkRow(Array.from({ length: 12 }, () => mkSeat('SILVER')))
  )
  const goldRows = Array.from({ length: 2 }, () =>
    mkRow(Array.from({ length: 12 }, () => mkSeat('GOLD')))
  )
  const reclinerRows = [mkRow(Array.from({ length: 8 }, () => mkSeat('RECLINER')))]

  return {
    layout: [silverSec, ...silverRows, goldSec, ...goldRows, reclinerSec, ...reclinerRows],
    aisles: new Set([5]),
  }
}

// ── Detect dark mode via media query ──
export function isDarkMode(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}
