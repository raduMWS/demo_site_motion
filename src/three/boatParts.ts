import type * as THREE from 'three'

/**
 * Boat anatomy hotspots (boat-local coordinates: bow = +x, up = +y, starboard = +z).
 * Copy is original, short and educational – edit freely.
 */
export interface BoatPart {
  id: string
  name: string
  en: string
  line: string
  detail: string
  /** hit-volume centre and size (boat-local) */
  at: [number, number, number]
  size: [number, number, number]
}

export const BOAT_PARTS: BoatPart[] = [
  { id: 'prova', name: 'Prova', en: 'bow', at: [0.68, 0.18, 0], size: [0.26, 0.3, 0.42], line: 'Partea din față a bărcii', detail: 'Când cineva spune „înainte”, se uită spre prova. Tot aici se lucrează la ancorare și la acostarea cu prova.' },
  { id: 'pupa', name: 'Pupa', en: 'stern', at: [-0.66, 0.18, 0], size: [0.18, 0.3, 0.48], line: 'Partea din spate a bărcii', detail: 'La pupa sunt de obicei cârma și locul skipperului. La multe porturi se acostează cu pupa la cheu.' },
  { id: 'babord', name: 'Babord', en: 'port', at: [0.1, 0.16, -0.27], size: [0.7, 0.24, 0.12], line: 'Partea stângă, privind spre prova', detail: 'Noaptea, babordul se recunoaște după lumina roșie de navigație. Un truc: „babord” și „roșu” au mai puține litere decât „tribord” și „verde”.' },
  { id: 'tribord', name: 'Tribord', en: 'starboard', at: [0.1, 0.16, 0.27], size: [0.7, 0.24, 0.12], line: 'Partea dreaptă, privind spre prova', detail: 'Lumina de navigație de la tribord este verde. Între două ambarcațiuni cu motor care se intersectează, cea care o vede pe cealaltă în tribordul său îi cedează trecerea.' },
  { id: 'catarg', name: 'Catarg', en: 'mast', at: [0.1, 1.45, 0], size: [0.1, 1.3, 0.1], line: 'Stâlpul vertical care ține velele', detail: 'Catargul susține randa și focul. În vârf poartă lumina de top și, adesea, instrumente pentru vânt.' },
  { id: 'randa', name: 'Randa', en: 'mainsail', at: [-0.22, 0.95, 0.12], size: [0.62, 1.05, 0.34], line: 'Vela mare, prinsă de catarg și de ghiu', detail: 'Randa dă cea mai mare parte din forța bărcii. O reglezi trăgând sau eliberând șoota randei, în funcție de vânt.' },
  { id: 'foc', name: 'Foc', en: 'jib', at: [0.44, 0.78, 0.08], size: [0.42, 0.85, 0.28], line: 'Vela din față, între catarg și prova', detail: 'Focul lucrează împreună cu randa: ghidează aerul peste velă și ajută barca să urce în vânt.' },
  { id: 'ghiu', name: 'Ghiu', en: 'boom', at: [-0.26, 0.38, 0], size: [0.72, 0.08, 0.1], line: 'Bara orizontală de la baza randei', detail: 'La o schimbare de bord cu vântul din spate, ghiul trece brusc dintr-o parte în alta. De aici regula: capul jos și anunțul „atenție, ghiul!”.' },
  { id: 'cockpit', name: 'Cockpit', en: 'cockpit', at: [-0.42, 0.25, 0], size: [0.3, 0.1, 0.28], line: 'Zona de comandă și de lucru', detail: 'Din cockpit se conduce barca și se lucrează cu parâmele. Aici stă de obicei echipajul în timpul navigației.' },
]

/** Tiny store: which part is hovered / pinned. React subscribes only to changes, not frames. */
type Listener = () => void
const listeners = new Set<Listener>()
export const boatUI = {
  hover: null as string | null,
  pinned: null as string | null,
  objects: {} as Record<string, THREE.Object3D | null>,
  set(patch: Partial<{ hover: string | null; pinned: string | null }>) {
    let changed = false
    for (const [k, v] of Object.entries(patch) as [keyof typeof patch, string | null][]) {
      if (boatUI[k] !== v) {
        boatUI[k] = v
        changed = true
      }
    }
    if (changed) listeners.forEach((l) => l())
  },
  subscribe(l: Listener) {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  },
  snapshot() {
    return `${boatUI.hover}|${boatUI.pinned}`
  },
}
