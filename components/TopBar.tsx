'use client'

import type { Profile } from '@/lib/types'
import { Bear } from './Bear'
import { IconButton } from './ui'
import styles from './TopBar.module.css'

export function TopBar({
  drawerOpen,
  profile,
  onToggleDrawer,
  onReset,
  onSignIn,
  onSignOut,
}: {
  drawerOpen: boolean
  profile: Profile | null
  onToggleDrawer: () => void
  onReset: () => void
  onSignIn: () => void
  onSignOut: () => void
}) {
  return (
    <header className={styles.topbar}>
      <IconButton title="Trails" active={drawerOpen} onClick={onToggleDrawer}>
        ☰
      </IconButton>
      <div className={styles.brand}>
        <span className={styles.mark}>
          <Bear kind="glyph" palette="reverse" size={20} />
        </span>
        <div>
          Forager
          <small className={styles.small}>trail browser</small>
        </div>
      </div>
      <div className={styles.spacer} />
      {profile ? (
        <>
          <div className={styles.who}>
            <Bear kind="head" palette="sage" size={26} />
            <div className={styles.whoText}>
              {profile.displayName}
              <small className={styles.small}>@{profile.handle}</small>
            </div>
          </div>
          <IconButton title="Sign out" onClick={onSignOut}>
            ⎋
          </IconButton>
        </>
      ) : (
        <button className={styles.signIn} onClick={onSignIn}>
          Sign in
        </button>
      )}
      <IconButton title="Restart trail" onClick={onReset}>
        ⟲
      </IconButton>
    </header>
  )
}
