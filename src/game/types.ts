export type Head = 'phillips' | 'flat' | 'hex' | 'torx'
export type ColorId = 'red' | 'blue' | 'yellow' | 'green' | 'purple' | 'orange'

export interface ScrewDef {
  id: string
  x: number
  y: number
  color: ColorId
  head: Head
  /** Extra taps needed before the screw turns. */
  rust?: number
}

export type PlateShape = 'rect' | 'disc'

export interface PlateDef {
  id: string
  /** Rounded rectangle by default; a disc uses `w` as its diameter. */
  shape?: PlateShape
  /** Higher layer sits closer to the player and covers lower layers. */
  layer: number
  x: number
  y: number
  w: number
  h: number
  /** Radians. */
  angle: number
  tint: string
  screws: ScrewDef[]
}

export interface LevelDef {
  id: string
  /** Translation key suffix: `obj.<name>`. */
  name: string
  plates: PlateDef[]
  /** Order in which color boxes arrive. Each entry is one 3-slot box. */
  boxQueue: ColorId[]
  /** Bit-switch budget. */
  switches: number
  /** First bit in hand. */
  startBit: Head
}

export interface PlatePose {
  x: number
  y: number
  angle: number
}

export type ScrewStatus = 'board' | 'box' | 'tray'

export interface ScrewState {
  def: ScrewDef
  plateId: string
  status: ScrewStatus
  rustLeft: number
  /** Box uid or tray index once removed from the board. */
  boxUid?: number
  slot?: number
}

export interface PlateState {
  def: PlateDef
  /** Screws still holding this plate. */
  pins: string[]
}

export interface BoxState {
  uid: number
  color: ColorId
  filled: string[]
  leaving: boolean
}

export type GameStatus = 'playing' | 'won' | 'lost-tray' | 'stuck'

export interface GameOptions {
  extraSwitches?: number
  extraTraySlots?: number
  /** Taps taken off every rusty screw. */
  rustRelief?: number
}

export interface GameState {
  level: LevelDef
  screws: Record<string, ScrewState>
  plates: Record<string, PlateState>
  boxes: BoxState[]
  queue: ColorId[]
  nextBoxUid: number
  tray: (string | null)[]
  bit: Head
  switchesLeft: number
  status: GameStatus
}

export type TapResult =
  | { kind: 'covered'; by: string }
  | { kind: 'wrong-bit' }
  | { kind: 'rust'; left: number }
  | { kind: 'no-room' }
  | { kind: 'removed'; to: 'box' | 'tray' }
  | { kind: 'ignored' }

export const BOX_SIZE = 3
export const ACTIVE_BOXES = 2
export const TRAY_SIZE = 5
export const SCREW_RADIUS = 0.3
