'use client'

import { useEffect, useRef, useState } from 'react'
import type { Link, Profile } from '@/lib/types'
import { useApp } from '@/lib/useApp'
import { useAuth } from '@/lib/useAuth'
import { TopBar } from '@/components/TopBar'
import { TrailsDrawer } from '@/components/TrailsDrawer'
import { Panes } from '@/components/Panes'
import { Footer } from '@/components/Footer'
import { SignInModal } from '@/components/SignIn'
import { SaveTrailModal } from '@/components/SaveTrailModal'
import { EditTrailModal } from '@/components/EditTrailModal'
import { Toast, useToast } from '@/components/ui'
import styles from './App.module.css'

/** The whole app; `shared` (from /user/[handle]/trail/[rkey]) opens that trail, then goes home. */
export function App({ shared }: { shared?: { handleOrDid: string; recordKey: string } }) {
  const auth = useAuth()
  const app = useApp()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [saveTrailId, setSaveTrailId] = useState<string | null>(null)
  const [editTrailId, setEditTrailId] = useState<string | null>(null)
  const [savePending, setSavePending] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  // action to run once the user finishes signing in (e.g. the save they attempted)
  const afterSignIn = useRef<((profile: Profile) => void) | null>(null)
  const { message, show } = useToast()
  const { trail } = app

  // Share link: load the collection into a session (its path is the first
  // pane), then swap the URL back to home *in place* — no navigation, so the
  // app never remounts and the page loads exactly once.
  const [imported, setImported] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const importing = useRef(false)
  useEffect(() => {
    if (!shared || !app.state.hydrated || importing.current) return
    importing.current = true
    app.importShared(shared.handleOrDid, shared.recordKey).then(
      () => {
        window.history.replaceState(null, '', '/')
        setImported(true)
      },
      (e) => setImportError(e instanceof Error ? e.message : 'Could not load trail')
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shared?.handleOrDid, shared?.recordKey, app.state.hydrated])

  /** Run `action` now if signed in, otherwise after the sign-in popup succeeds. */
  const withAuth = (action: (profile: Profile) => void) => {
    if (auth.profile) {
      action(auth.profile)
    } else {
      afterSignIn.current = action
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

  const handleReset = () => {
    if (!trail) return
    app.reset()
    show(trail.started ? 'Steps cleared — back to your seeds' : 'Trail cleared')
  }

  const viewingShared = Boolean(shared) && !imported

  return (
    <div className={styles.app}>
      <TopBar
        drawerOpen={drawerOpen}
        profile={auth.profile}
        onToggleDrawer={() => setDrawerOpen((o) => !o)}
        onReset={handleReset}
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
          ) : trail ? (
            <>
              <Panes
                trail={trail}
                activeStep={app.state.activeStep}
                onOpen={handleOpen}
                onCycleSeed={app.cycleSeed}
                onRemoveSeed={app.removeSeed}
                onAddSeed={app.addSeed}
                onRefreshSeeds={app.refreshSeeds}
                onQuerySeed={app.addQuerySeed}
                onStart={app.start}
                onFocus={app.focus}
              />
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
          afterSignIn.current = null
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
      <Toast message={message} />
    </div>
  )
}
