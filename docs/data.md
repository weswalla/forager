# Data & State

## Types (`lib/types.ts`)

```ts
export type Rel = 'mutual' | 'similar' | 'connected'

export interface Link {
  url: string          // identity
  title: string
  description: string
  domain: string
  image?: string       // else gradient+emoji placeholder
}

export interface Related extends Link {
  rel: Rel
  note?: string        // connection note (for 'connected')
}

export interface Trail {
  id: string
  title: string        // default "Trail · <date>"
  description: string   // default <date>
  seeds: Link[]        // 1–3, locked once started
  started: boolean
  path: Link[]         // ordered links after the seeds
  createdAt: string
}
```

## API (`lib/api.ts`)

The UI depends on this small interface. Two implementations: `mock` (fixtures, used
now) and `semble` (real endpoints, **interface-only for now**). Pick via env.

```ts
export interface Api {
  getLink(url: string): Promise<Link>              // metadata
  getRelated(url: string): Promise<Related[]>      // mutual + similar + connected, interwoven
  getSeedResults(urls: string[]): Promise<Related[]> // aggregate across seeds, deduped
  saveCollection(trail: Trail): Promise<{ id: string; url?: string }>
}

export const api: Api = process.env.NEXT_PUBLIC_USE_MOCK ? mockApi : sembleApi
```

### Semble mapping

| Method | Semble endpoint(s) | Notes |
|--------|--------------------|-------|
| `getLink` | `get_url_metadata` | title / description / image. |
| `getRelated` | `get_card_network_context` | one call → split into mutual/similar/connected; tag + interweave. (Or 3 calls: `get_url_collections`, `find_similar_urls`, `get_url_connections`.) |
| `getSeedResults` | fan-out `getRelated` per seed | merge, dedupe by url (first `rel` wins), interweave. |
| `saveCollection` | `create_collection` + `save_card` per link | name/description from the trail. |

`get_url_connections` edges are typed (SUPPORTS / OPPOSES / RELATED / …); the mapper
takes the other endpoint as the related link and carries the note.

All Semble specifics (base URL, auth, response shapes) stay inside `lib/api.ts`.

## State (`lib/useApp.ts`)

One reducer holds everything; `trails` + `currentId` are persisted to `localStorage`.
`activeStep` is transient pane-focus (not persisted). `useApp()` returns state +
bound actions; a `usePaneData(url)` helper fetches per-pane relationships.

```ts
interface AppState { trails: Trail[]; currentId: string; activeStep: number }

type Action =
  | { type: 'NEW_TRAIL' }                        // 3 random seeds, started=false
  | { type: 'SELECT'; id: string }
  | { type: 'RENAME'; id: string; title: string }
  | { type: 'SET_DESC'; id: string; description: string }
  | { type: 'CYCLE_SEED'; index: number }        // before start only
  | { type: 'REMOVE_SEED'; index: number }       // keep ≥ 1
  | { type: 'ADD_SEED' }                          // keep ≤ 3
  | { type: 'START' }                             // lock seeds, focus results pane
  | { type: 'OPEN'; link: Link }                  // append step, focus new pane
  | { type: 'REMOVE_STEP'; index: number }        // splice + re-clamp activeStep
  | { type: 'FOCUS'; pane: number }               // navigate only
  | { type: 'RESET' }                             // clear path, keep seeds

export function useApp() {
  const [state, dispatch] = useReducer(reducer, undefined, load)  // load from localStorage
  useEffect(() => save(state), [state.trails, state.currentId])   // persist
  const trail = state.trails.find(t => t.id === state.currentId)!
  return { state, trail, /* actions */ open: (l) => dispatch({type:'OPEN', link:l}), /* … */ }
}
```

Helpers (`lib/helpers.ts`, pure): `paneOfStep(i)=>i+2`, `interweave(m,s,c)`,
`dedupeByUrl(links)`, `randomSeeds(n)`, `newId()`.

Data fetch (`usePaneData`): `useEffect` + a module-level `Map` cache keyed by url /
seed-set. No external query library. Errors → pane-level empty/retry state.

```ts
const cache = new Map<string, Related[]>()
function usePaneData(url: string) {
  const [data, setData] = useState(() => cache.get(url) ?? null)
  useEffect(() => {
    if (cache.has(url)) return
    api.getRelated(url).then(r => { cache.set(url, r); setData(r) })
  }, [url])
  return data
}
```
