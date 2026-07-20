'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Link, Profile } from '@/lib/types'
import { useApp } from '@/lib/useApp'
import { useAuth } from '@/lib/useAuth'
import { TopBar } from '@/components/TopBar'
import { TrailsDrawer } from '@/components/TrailsDrawer'
import { Home } from '@/components/Home'
import { Panes } from '@/components/Panes'
import { Footer } from '@/components/Footer'
import { SignInModal } from '@/components/SignIn'
import { SaveTrailModal } from '@/components/SaveTrailModal'
import { FinishTrail } from '@/components/FinishTrail'
import { EditTrailModal } from '@/components/EditTrailModal'
import { Toast, useToast } from '@/components/ui'
import styles from './App.module.css'

/**
 * The whole app. The URL is derived from state:
 *   /                       → the prompt home (always)
 *   /trail/{id}             → walking a trail this browser created
 *   /user/{handle}/trail/{rkey} → a shared trail (imported into a session)
 * `route` is the initial URL the page component was rendered for.
 */
export type Route =
  | { kind: 'home' }
  | { kind: 'trail'; id: string }
  | { kind: 'shared'; handleOrDid: string; recordKey: string }

export function App({ route }: { route?: Route }) {
  const auth = useAuth()
  const app = useApp()
  const shared = route?.kind === 'shared' ? route : undefined
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [saveTrailId, setSaveTrailId] = useState<string | null>(null)
  const [editTrailId, setEditTrailId] = useState<string | null>(null)
  const [savePending, setSavePending] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [finishOpen, setFinishOpen] = useState(false)
  // action to run once the sign-in popup resolves — called with the profile on
  // success, or null if the user closed the modal without signing in
  const afterSignIn = useRef<((profile: Profile | null) => void) | null>(null)
  const { message, show } = useToast()
  const { trail } = app

  // Land on the calm prompt home: reuse a fresh, unwalked trail if we're on one,
  // otherwise plant a new one so an in-progress walk isn't disturbed.
  const ensureHome = useCallback(() => {
    const t = app.trail
    // show the calm prompt immediately; if the current trail is already walked
    // (or shared/saved), plant a fresh one so its walk isn't disturbed — the
    // prompt view is identical either way, so there's no visible flash.
    app.goHome()
    if (!t || t.path.length || t.collection || t.origin) app.newTrail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.trail?.id, app.goHome, app.newTrail])

  // Share link: load the collection into a session (shown at its shared URL).
  const [imported, setImported] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const importing = useRef(false)
  useEffect(() => {
    if (!shared || !app.state.hydrated || importing.current) return
    importing.current = true
    app.importShared(shared.handleOrDid, shared.recordKey).then(
      () => setImported(true),
      (e) => setImportError(e instanceof Error ? e.message : 'Could not load trail')
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shared?.handleOrDid, shared?.recordKey, app.state.hydrated])

  // The path currently reflected in the address bar (kept in sync with state).
  const currentUrl = useRef<string>(typeof window !== 'undefined' ? window.location.pathname : '/')
  // The share URL a shared trail was opened at — its landing keeps this URL
  // until the user walks (which forks an ordinary /trail/{id}).
  const sharedPath = useRef<string | null>(
    route?.kind === 'shared' ? `/user/${encodeURIComponent(route.handleOrDid)}/trail/${route.recordKey}` : null
  )

  // Reconcile app state to the initial non-shared route once hydrated: a
  // /trail/{id} URL opens that trail (falling back home if we don't have it);
  // / always shows the prompt home. URL syncing waits for this to finish so it
  // never mirrors a stale (pre-reconcile) trail into the address bar.
  const reconciled = useRef(false)
  const [routeReady, setRouteReady] = useState(false)
  useEffect(() => {
    if (!app.state.hydrated || reconciled.current) return
    reconciled.current = true
    if (route?.kind === 'trail') {
      if (!app.openTrail(route.id)) {
        window.history.replaceState(null, '', '/')
        currentUrl.current = '/'
        ensureHome()
      }
    } else if (!route || route.kind === 'home') {
      // / is always the prompt home, never a restored walk
      ensureHome()
    }
    // shared routes reconcile via the import effect
    setRouteReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.state.hydrated])

  // Keep the URL in step with what's on screen. Walking a trail lives at
  // /trail/{id}; a shared trail's landing keeps its share URL; the calm home
  // sits at /.
  useEffect(() => {
    if (!app.state.hydrated || !routeReady) return
    const t = app.trail
    let url = '/'
    if (t?.origin && !t.path.length && sharedPath.current) {
      // shared trail, not yet forked → stay on its share URL
      url = sharedPath.current
    } else if (t && app.state.phase === 'walk') {
      url = `/trail/${t.id}`
    }
    if (url !== currentUrl.current) {
      window.history.pushState(null, '', url)
      currentUrl.current = url
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.state.hydrated, routeReady, app.trail?.id, app.state.phase, app.trail?.path.length])

  // Back/forward: re-derive state from the path.
  useEffect(() => {
    const onPop = () => {
      const path = window.location.pathname
      currentUrl.current = path
      const m = path.match(/^\/trail\/([^/]+)$/)
      if (m) {
        if (!app.openTrail(m[1])) app.goHome()
      } else if (path === '/') {
        app.goHome()
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.openTrail, app.goHome])

  /** Run `action` now if signed in, otherwise after the sign-in popup succeeds. */
  const withAuth = (action: (profile: Profile) => void) => {
    if (auth.profile) {
      action(auth.profile)
    } else {
      afterSignIn.current = (p) => { if (p) action(p) }
      setAuthOpen(true)
    }
  }

  const handleSignIn = async (apiKey: string) => {
    const profile = await auth.signIn(apiKey)
    if (!profile) return // error shown in the modal
    setAuthOpen(false)
    const next = afterSignIn.current
    afterSignIn.current = null
    next?.(profile)
  }

  // save-trail flow: sign in (if needed) → name/describe popup → publish
  const requestSaveTrail = (id: string) => withAuth(() => { setSaveError(null); setSaveTrailId(id) })

  const handleSaveTrail = async (info: { title: string; description: string }) => {
    if (!saveTrailId || !auth.profile) return
    setSavePending(true)
    setSaveError(null)
    try {
      await app.saveAsCollection(saveTrailId, auth.profile, info)
      setSaveTrailId(null)
      show(`“${info.title}” saved to Semble ✦ — it's now read-only and shareable`)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save collection')
    } finally {
      setSavePending(false)
    }
  }

  // finish flow: publish the current trail (signing in first if needed), storing
  // the optional pairing reflection; returns the shareable URL for Bluesky/copy.
  const handleFinishPublish = async (info: {
    title: string
    description: string
    highlight: Parameters<typeof app.setHighlight>[1]
  }): Promise<string | null> => {
    if (!trail) return null
    const id = trail.id
    if (trail.collection) return trail.collection.url // already published
    setSavePending(true)
    setSaveError(null)
    app.setHighlight(id, info.highlight)
    try {
      const profile = auth.profile ?? (await new Promise<Profile | null>((resolve) => {
        afterSignIn.current = (p) => resolve(p)
        setAuthOpen(true)
      }))
      if (!profile) return null // user closed the sign-in modal
      // carry the pairing reflection into the published description
      const description = info.highlight
        ? `${info.description}${info.description.trim() ? '\n\n' : ''}✦ Pairing — ${info.highlight.note}`
        : info.description
      const ref = await app.saveAsCollection(id, profile, {
        title: info.title,
        description,
      })
      show(`“${info.title}” published to Semble ✦`)
      return ref.url
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not publish trail')
      return null
    } finally {
      setSavePending(false)
    }
  }

  const handleOpen = (link: Link) => {
    if (trail?.collection) {
      show('This trail is saved to Semble and read-only — start a new trail to keep wandering')
      return
    }
    app.open(link)
  }

  const handleShare = (id: string) => {
    const t = app.state.trails.find((x) => x.id === id)
    if (!t?.collection) return
    navigator.clipboard
      .writeText(`${location.origin}${t.collection.url}`)
      .then(() => show('Share link copied — anyone can walk this trail ⇗'))
      .catch(() => show('Could not copy the share link'))
  }

  const handleEditSave = (info: { title: string; description: string }) => {
    if (!editTrailId) return
    app.rename(editTrailId, info.title)
    app.setDescription(editTrailId, info.description)
    setEditTrailId(null)
  }

  const handleDelete = (id: string) => {
    const t = app.state.trails.find((x) => x.id === id)
    if (!t) return
    const note = t.collection ? ' Its Semble collection stays published.' : ''
    if (!window.confirm(`Delete “${t.title}”?${note}`)) return
    app.deleteTrail(id)
    show('Trail deleted')
  }

  // "Home" and "new trail" both return to the calm prompt page.
  const handleHome = () => ensureHome()

  const viewingShared = Boolean(shared) && !imported

  return (
    <div className={styles.app}>
      <TopBar
        drawerOpen={drawerOpen}
        profile={auth.profile}
        onToggleDrawer={() => setDrawerOpen((o) => !o)}
        onHome={handleHome}
        onNewTrail={handleHome}
        onSignIn={() => setAuthOpen(true)}
        onSignOut={auth.signOut}
      />
      <div className={styles.body}>
        <TrailsDrawer
          open={drawerOpen}
          trails={app.state.trails}
          currentId={app.state.currentId}
          onSelect={(id) => {
            app.select(id)
            if (window.innerWidth <= 720) setDrawerOpen(false)
          }}
          onNew={() => {
            app.newTrail()
            if (window.innerWidth <= 720) setDrawerOpen(false)
          }}
          onEdit={setEditTrailId}
          onSaveCollection={requestSaveTrail}
          onShare={handleShare}
          onDelete={handleDelete}
        />
        <div
          className={`${styles.scrim} ${drawerOpen ? styles.scrimShow : ''}`}
          onClick={() => setDrawerOpen(false)}
        />
        <div className={styles.panesWrap}>
          {viewingShared ? (
            <div className={styles.loading}>{importError ?? 'Finding the trail…'}</div>
          ) : trail && app.state.phase === 'home' ? (
            <Home
              origin={trail.origin}
              onSeedQuery={app.seedWithQuery}
              onSeedRandom={app.seedRandom}
              onWalkFrom={(link) => {
                app.open(link)
                app.enterWalk()
              }}
            />
          ) : trail ? (
            <>
              <Panes
                trail={trail}
                activeStep={app.state.activeStep}
                onOpen={handleOpen}
                onFocus={app.focus}
              />
              {trail.started && trail.path.length > 0 && !trail.collection && (
                <button className={styles.finishBtn} onClick={() => setFinishOpen(true)}>
                  ✓ Finish trail
                </button>
              )}
              <Footer
                trail={trail}
                activeStep={app.state.activeStep}
                onNavigate={app.focus}
                onRemoveStep={app.removeStep}
              />
            </>
          ) : (
            <div className={styles.loading}>Gathering seeds…</div>
          )}
        </div>
      </div>
      <SignInModal
        open={authOpen}
        pending={auth.pending}
        error={auth.error}
        onClose={() => {
          setAuthOpen(false)
          const next = afterSignIn.current
          afterSignIn.current = null
          next?.(null) // resolve any pending publish/save as cancelled
        }}
        onSignIn={handleSignIn}
      />
      <SaveTrailModal
        key={`save-${saveTrailId ?? 'none'}`}
        trail={saveTrailId ? (app.state.trails.find((t) => t.id === saveTrailId) ?? null) : null}
        pending={savePending}
        error={saveError}
        onClose={() => setSaveTrailId(null)}
        onSave={handleSaveTrail}
      />
      <EditTrailModal
        key={`edit-${editTrailId ?? 'none'}`}
        trail={editTrailId ? (app.state.trails.find((t) => t.id === editTrailId) ?? null) : null}
        onClose={() => setEditTrailId(null)}
        onSave={handleEditSave}
      />
      {finishOpen && trail && (
        <FinishTrail
          trail={trail}
          profile={auth.profile}
          pending={savePending}
          error={saveError}
          onPublish={handleFinishPublish}
          onClose={() => { setFinishOpen(false); setSaveError(null) }}
        />
      )}
      <Toast message={message} />
    </div>
  )
}
