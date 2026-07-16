import Link from 'next/link'
import styles from './resume.module.css'

export const metadata = { title: 'Resume — Wookie Monkeys' }

export default function ResumePage() {
  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>← Back</Link>

      <div className={styles.resume}>

        <header className={styles.header}>
          <div className={styles.headerLine}>
            <h1 className={styles.name}>MATT WALTER</h1>
            <p className={styles.title}>Senior Software Engineer</p>
          </div>
          <p className={styles.contact}>
            Brooklyn, New York
          </p>
        </header>

        <hr className={styles.rule} />

        <section className={styles.section}>
          <p className={styles.tags}>
            Senior software engineer with experience building Kubernetes-native platforms,
            backend services, CI/CD systems, and full-stack products for mission-critical
            environments.
          </p>
        </section>

        <hr className={styles.rule} />

        <section className={styles.section}>
          <h2 className={styles.heading}>EXPERIENCE</h2>

          <div className={styles.entry}>
            <div className={styles.entryHeader}>
              <span className={styles.org}>Greymatter.io</span>
              <span className={styles.period}>2019 – Present</span>
            </div>
            <p className={styles.role}>Software Engineer</p>
            <ul className={styles.list}>
              <li>Supported customers in classified environments as a DevOps engineer, operating Kubernetes clusters and Greymatter's zero trust service mesh platform for mission-critical workloads.</li>
              <li>Managed deployments, upgrades, and production troubleshooting for Greymatter installations, helping teams maintain secure service connectivity across complex Kubernetes environments.</li>
              <li>Built service discovery systems and Envoy filter capabilities powering secure, policy-aware communication across Kubernetes-based platform environments.</li>
              <li>Designed and implemented full-stack product features across UI workflows, backend APIs, and observability systems for managing complex service mesh infrastructure.</li>
              <li>Fully migrated the main web app from an internal deprecated UI component library to shadcn/ui, modernizing core interface patterns and improving frontend maintainability.</li>
            </ul>
          </div>

          <div className={styles.entry}>
            <div className={styles.entryHeader}>
              <span className={styles.org}>College of Charleston</span>
              <span className={styles.period}>Jan 2020 – May 2020</span>
            </div>
            <p className={styles.role}>Cyber Security Research Assistant</p>
            <ul className={styles.list}>
              <li>Researched the detection and prevention techniques of IoT botnet DDOS attacks, and developing a framework for classifying such attacks.</li>
              <li>Won the regional National Collegiate Cyber Defense Competition as team co-captain and Linux captain, becoming the first South Carolina school to reach nationals.</li>
            </ul>
          </div>

          <div className={styles.entry}>
            <div className={styles.entryHeader}>
              <span className={styles.org}>Greymatter.io</span>
              <span className={styles.period}>Jun 2018 – Aug 2018</span>
            </div>
            <p className={styles.role}>Software Engineer Intern</p>
            <ul className={styles.list}>
              <li>Worked on machine learning product applications, contributing to customer-facing features and internal product tooling.</li>
              <li>Migrated and expanded CI/CD pipelines to streamline releases, reduce manual developer effort, and improve delivery reliability.</li>
            </ul>
          </div>

          <div className={styles.entry}>
            <div className={styles.entryHeader}>
              <span className={styles.org}>Allied Marine Services</span>
              <span className={styles.period}>Jun 2017 – Aug 2018</span>
            </div>
            <p className={styles.role}>Data Science Intern</p>
            <ul className={styles.list}>
              <li>Supported data center and database IT operations, helping maintain internal systems used by business teams.</li>
              <li>Wrote Python scripts to scrape, clean, and organize operational data for business reporting and decision-making workflows.</li>
            </ul>
          </div>
        </section>

        <hr className={styles.rule} />

        <section className={styles.section}>
          <h2 className={styles.heading}>SKILLS</h2>
          <p className={styles.tags}>
            Golang &nbsp;·&nbsp; Python &nbsp;·&nbsp; TypeScript &nbsp;·&nbsp; Kubernetes &nbsp;·&nbsp;
            Docker &nbsp;·&nbsp; Linux &nbsp;·&nbsp; REST APIs &nbsp;·&nbsp; CI/CD &nbsp;·&nbsp;
            GitOps &nbsp;·&nbsp; SQL &nbsp;·&nbsp; Web Scraping &nbsp;·&nbsp; Service Discovery &nbsp;·&nbsp;
            Envoy &nbsp;·&nbsp; Prometheus &nbsp;·&nbsp; Grafana &nbsp;·&nbsp; Service Mesh
          </p>
        </section>

        <hr className={styles.rule} />

        <section className={styles.section}>
          <h2 className={styles.heading}>EDUCATION</h2>
          <div className={styles.entry}>
            <div className={styles.entryHeader}>
              <span className={styles.org}>College of Charleston</span>
              <span className={styles.period}>2018 – 2021</span>
            </div>
            <p className={styles.role}>BS, Computer Science</p>
          </div>
          <div className={styles.entry}>
            <div className={styles.entryHeader}>
              <span className={styles.org}>Gonzaga College High School</span>
              <span className={styles.period}>2018 – 2021</span>
            </div>
          </div>
        </section>

      </div>
    </main>
  )
}
