'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import styles from './admin.module.css'

const ALLOWED_USER = process.env.NEXT_PUBLIC_ALLOWED_GITHUB_USER

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function signIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.href },
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const isOwner = user?.user_metadata?.user_name === ALLOWED_USER

  return (
    <main className={styles.page}>
      {!user && (
        <div className={styles.box}>
          <p className={styles.label}>admin access</p>
          <button className={styles.btn} onClick={signIn}>sign in with github</button>
        </div>
      )}

      {user && isOwner && (
        <div className={styles.box}>
          <p className={styles.label}>signed in as</p>
          <p className={styles.username}>@{user.user_metadata?.user_name}</p>
          <button className={styles.btn} onClick={signOut}>sign out</button>
        </div>
      )}

      {user && !isOwner && (
        <div className={styles.box}>
          <p className={styles.label}>access denied</p>
          <p className={styles.username}>@{user.user_metadata?.user_name}</p>
          <button className={styles.btnGhost} onClick={signOut}>sign out</button>
        </div>
      )}
    </main>
  )
}
