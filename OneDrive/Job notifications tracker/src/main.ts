import './style.css'

type RouteKey = 'dashboard' | 'settings' | 'saved' | 'digest' | 'proof' | 'not-found'

type RouteConfig = {
  path: string
  title: string
  subtext: string
}

const routes: Record<RouteKey, RouteConfig> = {
  dashboard: {
    path: '/dashboard',
    title: 'Dashboard',
    subtext: 'This section will be built in the next step.',
  },
  saved: {
    path: '/saved',
    title: 'Saved',
    subtext: 'This section will be built in the next step.',
  },
  digest: {
    path: '/digest',
    title: 'Digest',
    subtext: 'This section will be built in the next step.',
  },
  settings: {
    path: '/settings',
    title: 'Settings',
    subtext: 'This section will be built in the next step.',
  },
  proof: {
    path: '/proof',
    title: 'Proof',
    subtext: 'This section will be built in the next step.',
  },
  'not-found': {
    path: '/404',
    title: 'Page Not Found',
    subtext: 'The page you are looking for does not exist.',
  },
}

function matchRoute(pathname: string): RouteKey {
  const entry = (Object.entries(routes) as [RouteKey, RouteConfig][])
    .find(([, cfg]) => cfg.path === pathname)

  if (!entry) return 'not-found'
  return entry[0]
}

function routeToPath(route: RouteKey): string {
  return routes[route].path
}

function renderShell(app: HTMLDivElement) {
  app.innerHTML = `
    <div class="page-shell">
      <header>
        <nav class="top-nav" aria-label="Primary">
          <div class="top-nav__brand">Job Notification App</div>
          <div class="top-nav__links" data-nav-links>
            <a href="/dashboard" data-route="dashboard" class="top-nav__link">Dashboard</a>
            <a href="/saved" data-route="saved" class="top-nav__link">Saved</a>
            <a href="/digest" data-route="digest" class="top-nav__link">Digest</a>
            <a href="/settings" data-route="settings" class="top-nav__link">Settings</a>
            <a href="/proof" data-route="proof" class="top-nav__link">Proof</a>
          </div>
          <button class="top-nav__menu-toggle" type="button" aria-label="Toggle navigation" data-nav-toggle>
            <span class="top-nav__menu-toggle-icon"></span>
          </button>
        </nav>
        <div class="top-nav__mobile-panel">
          <div class="top-nav__mobile-links" data-nav-mobile-links>
            <a href="/dashboard" data-route="dashboard" class="top-nav__mobile-link">Dashboard</a>
            <a href="/saved" data-route="saved" class="top-nav__mobile-link">Saved</a>
            <a href="/digest" data-route="digest" class="top-nav__mobile-link">Digest</a>
            <a href="/settings" data-route="settings" class="top-nav__mobile-link">Settings</a>
            <a href="/proof" data-route="proof" class="top-nav__mobile-link">Proof</a>
          </div>
        </div>
      </header>

      <section class="page-shell__header">
        <h1 id="page-title" class="page-shell__title"></h1>
        <p id="page-subtext" class="page-shell__subtext"></p>
      </section>

      <main class="page-shell__body" aria-label="Page content">
        <!-- Placeholder only; no additional content yet -->
      </main>
    </div>
  `
}

function applyRoute(route: RouteKey) {
  const cfg = routes[route]
  const titleEl = document.querySelector<HTMLElement>('#page-title')
  const subtextEl = document.querySelector<HTMLElement>('#page-subtext')

  if (titleEl) titleEl.textContent = cfg.title
  if (subtextEl) subtextEl.textContent = cfg.subtext

  const navLinks = document.querySelectorAll<HTMLElement>('[data-route]')

  navLinks.forEach((link) => {
    const linkRoute = link.getAttribute('data-route') as RouteKey | null
    const isActive = linkRoute === route

    if (link.classList.contains('top-nav__link')) {
      link.classList.toggle('top-nav__link--active', isActive)
    }

    if (link.classList.contains('top-nav__mobile-link')) {
      link.classList.toggle('top-nav__mobile-link--active', isActive)
    }
  })
}

function navigateTo(route: RouteKey) {
  if (route === 'not-found') {
    history.pushState({ route }, '', routes['not-found'].path)
    applyRoute('not-found')
    return
  }

  const current = matchRoute(window.location.pathname)
  if (current === route) {
    applyRoute(route)
    return
  }

  history.pushState({ route }, '', routeToPath(route))
  applyRoute(route)
}

function bindNavigation() {
  const appShell = document.querySelector<HTMLElement>('.top-nav')
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]')
  const linksContainer = document.querySelector<HTMLElement>('[data-nav-links]')
  const mobileLinksContainer = document.querySelector<HTMLElement>('[data-nav-mobile-links]')

  const handleLinkClick = (event: Event) => {
    const target = event.currentTarget as HTMLElement | null
    if (!target) return

    const routeAttr = target.getAttribute('data-route') as RouteKey | null
    if (!routeAttr) return

    event.preventDefault()
    navigateTo(routeAttr)

    if (appShell && appShell.classList.contains('top-nav--open')) {
      appShell.classList.remove('top-nav--open')
    }
  }

  linksContainer?.querySelectorAll<HTMLElement>('[data-route]').forEach((link) => {
    link.addEventListener('click', handleLinkClick)
  })

  mobileLinksContainer?.querySelectorAll<HTMLElement>('[data-route]').forEach((link) => {
    link.addEventListener('click', handleLinkClick)
  })

  if (toggle && appShell) {
    toggle.addEventListener('click', () => {
      appShell.classList.toggle('top-nav--open')
    })
  }

  window.addEventListener('popstate', (event) => {
    const state = event.state as { route?: RouteKey } | null
    if (state && state.route) {
      applyRoute(state.route)
      return
    }
    const route = matchRoute(window.location.pathname)
    applyRoute(route)
  })
}

const app = document.querySelector<HTMLDivElement>('#app')

if (app) {
  renderShell(app)
  bindNavigation()

  const initialRoute = matchRoute(window.location.pathname)
  applyRoute(initialRoute)
}
