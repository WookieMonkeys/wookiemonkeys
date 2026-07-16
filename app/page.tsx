import styles from './page.module.css'
import LogoReveal from '@/components/LogoReveal'
import MarqueeBar from '@/components/MarqueeBar'
import WheelMenu from '@/components/WheelMenu'

export default function Home() {
  return (
    <main className={styles.main}>
      <LogoReveal />
      <section className={styles.hero}>
        <WheelMenu />
      </section>
      <MarqueeBar />
    </main>
  )
}
