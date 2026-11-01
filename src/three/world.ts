import { VIEWBOX } from '../config/route'

/** chart units per world unit. The chart (1600×900) becomes a 40×22.5 sea. */
export const K = 40
export const SEA_W = VIEWBOX.w / K
export const SEA_H = VIEWBOX.h / K

/** chart (x, y) → world (x, z). y grows "south" in both. */
export const toWorld = (x: number, y: number): [number, number] => [(x - VIEWBOX.w / 2) / K, (y - VIEWBOX.h / 2) / K]

/** Mediterranean palette – whitewash, Aegean blues, navy. Mirrors src/styles/tokens.css. */
export const COLORS = {
  navy: '#0B2545',
  blue: '#1F5FAF',
  aegean: '#2A7DE1',
  sky: '#EAF2FA',
  white: '#FFFFFF',
  offwhite: '#F6F3EC',
  mist: '#CFE2F6',
  seaDeep: '#0A3C77',
  seaShallow: '#4E9EE0',
  lamp: '#FFC857',
  terracotta: '#C8643B',
  terracottaPale: '#F3D8CB',
  /* vegetation */
  cypress: '#2F6E4F',
  cypressEdge: '#1D4834',
  olive: '#8DB07A',
  oliveEdge: '#55784A',
  portRed: '#E0483C',
  stbdGreen: '#2BB673',
} as const

import type { HarbourDef, IslandDef } from '../config/route'

/** The low headland each harbour sits on (shared by the 3D land and the sea's depth field). */
export function harbourLand(h: HarbourDef, i: number): IslandDef {
  return { id: h.id, label: h.label, cx: h.x - 90, cy: h.y + 95, rx: 150, ry: 62, seed: 40 + i * 7, rotate: -4, coord: h.coord }
}
