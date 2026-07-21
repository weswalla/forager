'use client'

import { useCallback, useEffect, useReducer, useState } from 'react'
import type { CollectionRef, Curator, Link, Profile, Related, Trail, TrailCollection } from './types'
import { SEED_MAX, SEED_MIN } from './types'
import { PANE_ROOT, dedupeByUrl, newId, paneOfStep, searchSeedLink, today } from './helpers'
import { api } from './api'

/* ============================ state ============================ */

export interface AppState {
  trails: Trail[]
  currentId: string
  activeStep: number // pane child index in focus; transient, not persisted
  hydrated: boolean
  // 'home' shows the calm landing (choose a seeding path); 'walk' shows the panes.
  // Transient, not persisted — a stored, already-walked trail reopens in 'walk'.
  phase: 'home' | 'walk'
}

type Action =
  | { type: 'HYDRATE'; trails: Trail[]; currentId: string }
  | { type: 'NEW_TRAIL'; seeds: Link[] } // seeds pre-fetched, started=false
  | { type: 'IMPORT_SHARED'; collection: TrailCollection } // open a shared trail as the current session
  | { type: 'SET_COLLECTION'; id: string; ref: CollectionRef } // trail saved to Semble
  | { type: 'SELECT'; id: string }
  | { type: 'RENAME'; id: string; title: string }
  | { type: 'SET_DESC'; id: string; description: string }
  | { type: 'CYCLE_SEED'; index: number; link: Link } // before start only
  | { type: 'SET_SEEDS'; seeds: Link[] } // refresh the whole seed list at once
  | { type: 'REMOVE_SEED'; index: number } // keep ≥ 1
  | { type: 'ADD_SEED'; link: Link } // keep ≤ 3
  | { type: 'DELETE_TRAIL'; id: string }
  | { type: 'START' } // lock seeds, focus results pane
  | { type: 'OPEN'; link: Link } // append step, focus new pane
  | { type: 'REMOVE_STEP'; index: number } // splice + re-clamp activeStep
  | { type: 'FOCUS'; pane: number } // navigate only
  | { type: 'RESET' } // clear path, keep seeds
  | { type: 'GO_HOME' } // show the landing for the current trail
  | { type: 'ENTER_WALK' } // leave the landing, show the panes

const initialState: AppState = {
  trails: [],
  currentId: '',
  activeStep: PANE_ROOT,
  hydrated: false,
  phase: 'home',
}

function makeTrail(seeds: Link[]): Trail {
  const date = today()
  return {
    id: newId('t'),
    title: `Trail · ${date}`,
    description: date,
    seeds,
    started: false,
    path: [],
    createdAt: date,
  }
}

function updateTrail(state: AppState, id: string, patch: (t: Trail) => Trail): AppState {
  return { ...state, trails: state.trails.map((t) => (t.id === id ? patch(t) : t)) }
}

function updateCurrent(state: AppState, patch: (t: Trail) => Trail): AppState {
  return updateTrail(state, state.currentId, patch)
}

function focusForTrail(t: Trail): number {
  // child 0 is the root pane (results, or the shared trail); steps follow from 1
  if (t.started && t.path.length) return paneOfStep(t.path.length - 1)
  return PANE_ROOT
}

/**
 * Which phase a trail reopens in. A trail the user has already stepped into
 * (walked a path, or saved to Semble) skips the landing; anything else — fresh
 * seeds, or a just-opened shared trail — starts on the calm home screen.
 */
function phaseForTrail(t: Trail): 'home' | 'walk' {
  return t.path.length || t.collection ? 'walk' : 'home'
}

function reducer(state: AppState, action: Action): AppState {
  const current = state.trails.find((t) => t.id === state.currentId)

  switch (action.type) {
    case 'HYDRATE': {
      const t = action.trails.find((x) => x.id === action.currentId)
      return {
        ...state,
        trails: action.trails,
        currentId: action.currentId,
        activeStep: t ? focusForTrail(t) : PANE_ROOT,
        phase: t ? phaseForTrail(t) : 'home',
        hydrated: true,
      }
    }

    case 'NEW_TRAIL': {
      const t = makeTrail(action.seeds)
      return {
        ...state,
        trails: [...state.trails, t],
        currentId: t.id,
        activeStep: PANE_ROOT,
        phase: 'home',
        hydrated: true,
      }
    }

    case 'IMPORT_SHARED': {
      const { collection } = action
      // already opened from this collection → just select it
      const existing = state.trails.find((t) => t.origin?.uri === collection.uri)
      if (existing)
        return {
          ...state,
          currentId: existing.id,
          activeStep: focusForTrail(existing),
          phase: phaseForTrail(existing),
        }
      const t: Trail = {
        ...makeTrail(dedupeByUrl(collection.links)),
        title: collection.title,
        description: collection.description,
        started: true, // the shared trail is already walked; clicking a card begins your own path
        origin: {
          uri: collection.uri,
          title: collection.title,
          description: collection.description,
          author: collection.author,
          links: collection.links,
        },
      }
      return {
        ...state,
        trails: [...state.trails, t],
        currentId: t.id,
        activeStep: PANE_ROOT,
        phase: 'home',
        hydrated: true,
      }
    }

    case 'SET_COLLECTION':
      return updateTrail(state, action.id, (t) => ({ ...t, collection: action.ref }))

    case 'SELECT': {
      const t = state.trails.find((x) => x.id === action.id)
      if (!t) return state
      return { ...state, currentId: t.id, activeStep: focusForTrail(t), phase: phaseForTrail(t) }
    }

    case 'RENAME':
      return updateTrail(state, action.id, (t) =>
        t.collection ? t : { ...t, title: action.title.trim() || `Trail · ${t.createdAt}` }
      )

    case 'SET_DESC':
      return updateTrail(state, action.id, (t) =>
        t.collection ? t : { ...t, description: action.description.trim() }
      )

    case 'CYCLE_SEED': {
      if (!current || current.started) return state
      return updateCurrent(state, (t) => ({
        ...t,
        seeds: t.seeds.map((s, i) => (i === action.index ? action.link : s)),
      }))
    }

    case 'SET_SEEDS': {
      if (!current || current.started || !action.seeds.length) return state
      return updateCurrent(state, (t) => ({ ...t, seeds: dedupeByUrl(action.seeds) }))
    }

    case 'REMOVE_SEED': {
      if (!current || current.started || current.seeds.length <= SEED_MIN) return state
      return updateCurrent(state, (t) => ({
        ...t,
        seeds: t.seeds.filter((_, i) => i !== action.index),
      }))
    }

    case 'ADD_SEED': {
      if (!current || current.started || current.seeds.length >= SEED_MAX) return state
      return updateCurrent(state, (t) => ({ ...t, seeds: [...t.seeds, action.link] }))
    }

    case 'DELETE_TRAIL': {
      const trails = state.trails.filter((t) => t.id !== action.id)
      if (action.id !== state.currentId) return { ...state, trails }
      const next = trails[trails.length - 1]
      return {
        ...state,
        trails,
        currentId: next?.id ?? '',
        activeStep: next ? focusForTrail(next) : PANE_ROOT,
        phase: next ? phaseForTrail(next) : 'home',
      }
    }

    case 'START': {
      if (!current || current.started || current.seeds.length < SEED_MIN) return state
      return {
        ...updateCurrent(state, (t) => ({ ...t, started: true })),
        activeStep: PANE_ROOT,
      }
    }

    case 'OPEN': {
      if (!current?.started || current.collection) return state // saved trails are read-only
      const next = updateCurrent(state, (t) => ({ ...t, path: [...t.path, action.link] }))
      return { ...next, activeStep: paneOfStep(current.path.length) }
    }

    case 'REMOVE_STEP': {
      if (!current || current.collection) return state
      const removedPane = paneOfStep(action.index)
      const path = current.path.filter((_, i) => i !== action.index)
      let activeStep = state.activeStep
      if (activeStep >= paneOfStep(path.length)) {
        activeStep = Math.max(PANE_ROOT, paneOfStep(path.length - 1))
      } else if (activeStep > removedPane) {
        activeStep--
      }
      return { ...updateCurrent(state, (t) => ({ ...t, path })), activeStep }
    }

    case 'FOCUS':
      return { ...state, activeStep: action.pane }

    case 'RESET': {
      if (!current || current.collection) return state
      return {
        ...updateCurrent(state, (t) => ({ ...t, path: [] })),
        activeStep: PANE_ROOT,
      }
    }

    case 'GO_HOME':
      return { ...state, phase: 'home' }

    case 'ENTER_WALK': {
      if (!current) return state
      return { ...state, phase: 'walk', activeStep: focusForTrail(current) }
    }
  }
}

/* ============================ persistence ============================ */

const STORAGE_KEY = 'forager.v1'

function loadStored(): { trails: Trail[]; currentId: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed.trails) || parsed.trails.length === 0) return null
    const currentId = parsed.trails.some((t: Trail) => t.id === parsed.currentId)
      ? parsed.currentId
      : parsed.trails[0].id
    return { trails: parsed.trails, currentId }
  } catch {
    return null
  }
}

/* ============================ hook ============================ */

export function useApp() {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Hydrate on mount (localStorage is client-only; seeds come from the API).
  useEffect(() => {
    const stored = loadStored()
    if (!stored) {
      api.getRandomLinks(SEED_MAX).then((seeds) => dispatch({ type: 'NEW_TRAIL', seeds }))
      return
    }
    // A plain refresh shouldn't drop back onto an (unwalked) shared trail's
    // landing — reopen a regular trail's home instead. The shared trail stays
    // in the drawer to return to.
    const current = stored.trails.find((t) => t.id === stored.currentId)
    if (current?.origin && current.path.length === 0) {
      const regular = [...stored.trails].reverse().find((t) => !t.origin)
      if (regular) {
        dispatch({ type: 'HYDRATE', trails: stored.trails, currentId: regular.id })
      } else {
        // no regular trail to fall back to — plant a fresh one
        dispatch({ type: 'HYDRATE', ...stored })
        api.getRandomLinks(SEED_MAX).then((seeds) => dispatch({ type: 'NEW_TRAIL', seeds }))
      }
      return
    }
    dispatch({ type: 'HYDRATE', ...stored })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist trails + currentId (activeStep is transient).
  useEffect(() => {
    if (!state.hydrated) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ trails: state.trails, currentId: state.currentId }))
  }, [state.hydrated, state.trails, state.currentId])

  const trail = state.trails.find((t) => t.id === state.currentId) ?? null
  const seedUrls = trail?.seeds.map((s) => s.url) ?? []

  const newTrail = useCallback(async () => {
    const seeds = await api.getRandomLinks(SEED_MAX)
    dispatch({ type: 'NEW_TRAIL', seeds })
  }, [])

  /**
   * From the home landing: plant a question and begin walking. The query is the
   * sole seed — no other links — so the results pane reflects just the question.
   * Reuses the fresh landing trail (replacing its seeds with the query); a
   * shared trail is already started/locked, so it diverges into a new trail.
   */
  const seedWithQuery = useCallback(
    (query: string) => {
      if (!query.trim()) return
      const seed = searchSeedLink(query)
      if (trail && !trail.origin && !trail.started) {
        dispatch({ type: 'SET_SEEDS', seeds: [seed] })
      } else {
        dispatch({ type: 'NEW_TRAIL', seeds: [seed] })
      }
      dispatch({ type: 'START' }) // lock the seed, open the results pane
      dispatch({ type: 'ENTER_WALK' })
    },
    [trail?.origin, trail?.started, trail?.id]
  )

  /**
   * From the home landing: draw a single fresh random link and set it as the
   * seed, but STAY on the home page so the user can preview it, cycle for a
   * different one, then choose to start. A new link is drawn on every call, so
   * tapping the button repeatedly always previews a different starting point.
   * Reuses a fresh landing trail, else diverges into a new one.
   */
  const seedRandom = useCallback(
    async () => {
      const [link] = await api.getRandomLinks(1, seedUrls)
      if (!link) return
      if (trail && !trail.origin && !trail.started) {
        dispatch({ type: 'SET_SEEDS', seeds: [link] })
      } else {
        dispatch({ type: 'NEW_TRAIL', seeds: [link] })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trail?.origin, trail?.started, trail?.id, seedUrls.join('|')]
  )

  /** Lock the current seed(s) and begin the walk (from the home preview). */
  const startWalk = useCallback(() => {
    dispatch({ type: 'START' })
    dispatch({ type: 'ENTER_WALK' })
  }, [])

  const goHome = useCallback(() => dispatch({ type: 'GO_HOME' }), [])
  const enterWalk = useCallback(() => dispatch({ type: 'ENTER_WALK' }), [])

  /**
   * Select a trail by id and show its walk. Returns false if no such trail
   * exists (e.g. a /trail/{id} URL for a trail this browser never created).
   */
  const openTrail = useCallback(
    (id: string): boolean => {
      if (!state.trails.some((t) => t.id === id)) return false
      dispatch({ type: 'SELECT', id })
      dispatch({ type: 'ENTER_WALK' })
      return true
    },
    [state.trails]
  )

  const deleteTrail = useCallback(
    (id: string) => {
      dispatch({ type: 'DELETE_TRAIL', id })
      // deleting the only trail leaves nothing to walk — plant a fresh one
      if (state.trails.length <= 1) {
        api.getRandomLinks(SEED_MAX).then((seeds) => dispatch({ type: 'NEW_TRAIL', seeds }))
      }
    },
    [state.trails.length]
  )

  /** Resolve a share link's collection and open it as the current session. */
  const importShared = useCallback(async (handleOrDid: string, recordKey: string) => {
    const collection = await api.getTrailCollection(handleOrDid, recordKey)
    dispatch({ type: 'IMPORT_SHARED', collection })
  }, [])

  /**
   * Save to Semble; the returned ref (kept on the trail) makes it shareable
   * and the trail read-only. `info` overrides title/description from the
   * save dialog.
   */
  const saveAsCollection = useCallback(
    async (id: string, profile: Profile, info?: { title: string; description: string }) => {
      const t = state.trails.find((x) => x.id === id)
      if (!t) throw new Error('Trail not found')
      if (t.collection) throw new Error('This trail is already saved to Semble')
      const trailToSave = info ? { ...t, ...info } : t
      if (info) {
        dispatch({ type: 'RENAME', id, title: info.title })
        dispatch({ type: 'SET_DESC', id, description: info.description })
      }
      const ref = await api.saveCollection(trailToSave, profile)
      dispatch({ type: 'SET_COLLECTION', id, ref })
      return ref
    },
    [state.trails]
  )

  return {
    state,
    trail,
    newTrail,
    seedWithQuery,
    seedRandom,
    startWalk,
    goHome,
    enterWalk,
    openTrail,
    deleteTrail,
    saveAsCollection,
    importShared,
    select: (id: string) => dispatch({ type: 'SELECT', id }),
    rename: (id: string, title: string) => dispatch({ type: 'RENAME', id, title }),
    setDescription: (id: string, description: string) => dispatch({ type: 'SET_DESC', id, description }),
    removeSeed: (index: number) => dispatch({ type: 'REMOVE_SEED', index }),
    start: () => dispatch({ type: 'START' }),
    open: (link: Link) => dispatch({ type: 'OPEN', link }),
    removeStep: (index: number) => dispatch({ type: 'REMOVE_STEP', index }),
    focus: (pane: number) => dispatch({ type: 'FOCUS', pane }),
    reset: () => dispatch({ type: 'RESET' }),
  }
}

/* ============================ per-pane data ============================ */

const cache = new Map<string, Related[]>()

function useRelatedData(key: string, fetcher: () => Promise<Related[]>) {
  const [data, setData] = useState<Related[] | null>(() => cache.get(key) ?? null)
  const [error, setError] = useState<Error | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (cache.has(key)) {
      setData(cache.get(key)!)
      return
    }
    let cancelled = false
    setData(null)
    setError(null)
    fetcher().then(
      (r) => {
        if (cancelled) return
        cache.set(key, r)
        setData(r)
      },
      (e) => {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)))
      }
    )
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt])

  const retry = useCallback(() => {
    cache.delete(key)
    setAttempt((a) => a + 1)
  }, [key])

  return { data, error, retry }
}

/** Relationships for one opened link. */
export function usePaneData(url: string) {
  return useRelatedData(`link:${url}`, () => api.getRelated(url))
}

/** Aggregated relationships across the locked seed set. */
export function useSeedResults(urls: string[]) {
  const key = `seeds:${urls.join('|')}`
  return useRelatedData(key, () => api.getSeedResults(urls))
}

/**
 * The people curating a trail's links — deduped across every url. Loads once
 * per url-set; used on the finish screen ("meet the people curating these").
 */
export function useCurators(urls: string[]) {
  const key = urls.join('|')
  const [curators, setCurators] = useState<Curator[] | null>(null)
  useEffect(() => {
    if (!urls.length) {
      setCurators([])
      return
    }
    let cancelled = false
    setCurators(null)
    api.getCurators(urls).then(
      (c) => { if (!cancelled) setCurators(c) },
      () => { if (!cancelled) setCurators([]) }
    )
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return curators
}
