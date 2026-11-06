const navigation = [
  { label: 'Home', href: '#home' },
  { label: 'Platform', href: '#platform' },
  { label: 'Markets', href: '../markets.html' },
  { label: 'Brokers', href: '../brokers.html' },
  { label: 'Compliance', href: '../compliance.html' },
  { label: 'About', href: '../about.html' },
];

const capabilities = [
  {
    number: '01',
    title: 'Market information',
    description:
      'Market coverage and data will depend on available sources and completed integrations.',
  },
  {
    number: '02',
    title: 'Broker connections',
    description:
      'Connections are being explored and will be described as integrations become available.',
  },
  {
    number: '03',
    title: 'Risk tools',
    description:
      'VaTViT is being designed to make trading activity and risk information easier to review.',
  },
];

const steps = [
  'Bring market information together',
  'Connect supported accounts',
  'Review portfolio activity',
  'Understand risk and records',
];

function App() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="site-header">
        <nav className="site-nav" aria-label="Primary">
          <a className="brand" href="#home" aria-label="VaTViT home">
            <span className="brand-mark" aria-hidden="true">
              Va T<span>V</span>iT
            </span>
          </a>
          <div className="nav-links">
            {navigation.map((item, index) => (
              <a
                aria-current={index === 0 ? 'page' : undefined}
                href={item.href}
                key={item.label}
              >
                {item.label}
              </a>
            ))}
            <a className="nav-cta" href="../auth.html">
              Early access
            </a>
          </div>
        </nav>
      </header>

      <main id="main-content">
        <section className="announcement" aria-label="Site announcement">
          <p>
            <strong>VaTViT is in development</strong>
            <span> — We are building a more connected workspace for traders.</span>
          </p>
          <a href="../markets.html">Explore markets</a>
        </section>

        <section className="hero" id="home" aria-labelledby="hero-title">
          <div className="hero-content">
            <p className="eyebrow">A trading workspace in development</p>
            <h1 id="hero-title">
              A clearer view
              <br />
              of your trading.
            </h1>
            <p className="hero-copy">
              VaTViT is being built to bring market information, broker
              connections, and risk tools into one workspace.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="../auth.html">
                Request early access
              </a>
              <a className="button button-secondary" href="../markets.html">
                Explore markets
              </a>
            </div>
          </div>
          <aside className="hero-note" aria-label="Product status">
            <span className="status-dot" aria-hidden="true" />
            <p>
              <strong>Building in stages.</strong>
              <br />
              Availability depends on completed integrations.
            </p>
          </aside>
        </section>

        <section className="section" id="platform" aria-labelledby="platform-title">
          <div className="section-heading">
            <p className="eyebrow">What is VaTViT</p>
            <h2 id="platform-title">One workspace. A clearer picture.</h2>
            <p>
              Trading information is often spread across separate tools.
              VaTViT is being built to bring the market view, account
              connections, and risk information closer together.
            </p>
          </div>
          <div className="capability-grid">
            {capabilities.map((capability) => (
              <article className="capability-card" key={capability.number}>
                <span className="card-number">{capability.number}</span>
                <h3>{capability.title}</h3>
                <p>{capability.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section process-section" aria-labelledby="process-title">
          <div className="section-heading">
            <p className="eyebrow">Product direction</p>
            <h2 id="process-title">Designed around the way you trade.</h2>
            <p>
              These are product goals, not a statement that every feature or
              integration is already available.
            </p>
          </div>
          <ol className="process-list">
            {steps.map((step, index) => (
              <li key={step}>
                <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                {step}
              </li>
            ))}
          </ol>
        </section>

        <section className="closing" aria-labelledby="closing-title">
          <p className="eyebrow">Early access</p>
          <h2 id="closing-title">Stay close as we build.</h2>
          <p>
            Request updates as account features and market integrations become
            available.
          </p>
          <a className="button button-primary" href="../auth.html">
            Request access
          </a>
        </section>
      </main>

      <footer className="site-footer">
        <p>VaTViT — A clearer view of your trading.</p>
        <p>Product features and integrations are in development.</p>
      </footer>
    </>
  );
}

export default App;
