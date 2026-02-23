import './style.css'

type RouteKey =
  | 'landing'
  | 'dashboard'
  | 'settings'
  | 'saved'
  | 'digest'
  | 'proof'
  | 'not-found'

type RouteConfig = {
  path: string
  title: string
  subtext: string
}

const routes: Record<RouteKey, RouteConfig> = {
  landing: {
    path: '/',
    title: 'Stop Missing The Right Jobs.',
    subtext: 'Precision-matched job discovery delivered daily at 9AM.',
  },
  dashboard: {
    path: '/dashboard',
    title: 'Job Dashboard',
    subtext: 'No jobs yet. In the next step, you will load a realistic dataset.',
  },
  saved: {
    path: '/saved',
    title: 'Saved Jobs',
    subtext: 'No saved jobs yet. This section will hold saved roles in a later step.',
  },
  digest: {
    path: '/digest',
    title: 'Daily Digest',
    subtext: 'Your 9AM job summary will appear here in a future step.',
  },
  settings: {
    path: '/settings',
    title: 'Notification Settings',
    subtext: 'Define how job notifications should behave. These fields are placeholders only.',
  },
  proof: {
    path: '/proof',
    title: 'Proof of Work',
    subtext: 'A calm space for collecting artifacts and evidence of this workflow.',
  },
  'not-found': {
    path: '/404',
    title: 'Page Not Found',
    subtext: 'The page you are looking for does not exist.',
  },
}

function matchRoute(pathname: string): RouteKey {
  if (pathname === '/' || pathname === '') {
    return 'landing'
  }

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
        <div id="page-main-inner" class="page-shell__body-inner"></div>
      </main>
    </div>
  `
}

function applyRoute(route: RouteKey) {
  const cfg = routes[route]
  const titleEl = document.querySelector<HTMLElement>('#page-title')
  const subtextEl = document.querySelector<HTMLElement>('#page-subtext')
  const mainInner = document.querySelector<HTMLDivElement>('#page-main-inner')

  if (titleEl) titleEl.textContent = cfg.title
  if (subtextEl) subtextEl.textContent = cfg.subtext

  if (mainInner) {
    if (route === 'landing') {
      mainInner.innerHTML = `
        <div class="field-group">
          <button class="button button-primary" type="button" id="landing-cta">
            Start Tracking
          </button>
        </div>
      `
      const cta = document.querySelector<HTMLButtonElement>('#landing-cta')
      if (cta) {
        cta.onclick = () => {
          navigateTo('settings')
        }
      }
    } else if (route === 'settings') {
      mainInner.innerHTML = `
        <div class="field-group">
          <label class="field-label" for="settings-role-keywords">Role keywords</label>
          <p class="field-description">
            Placeholder field for roles you want this tracker to focus on.
          </p>
          <input
            id="settings-role-keywords"
            class="input"
            type="text"
            placeholder="e.g. Product Manager, Staff Engineer"
          />
        </div>

        <div class="field-group">
          <label class="field-label" for="settings-locations">Preferred locations</label>
          <p class="field-description">
            Placeholder field for cities, regions, or time zones you care about.
          </p>
          <input
            id="settings-locations"
            class="input"
            type="text"
            placeholder="e.g. Berlin, Remote Europe, Bangalore"
          />
        </div>

        <div class="field-group">
          <label class="field-label" for="settings-mode">Mode</label>
          <p class="field-description">
            Placeholder selection for remote, hybrid, or onsite roles.
          </p>
          <select id="settings-mode" class="input">
            <option>Remote</option>
            <option>Hybrid</option>
            <option>Onsite</option>
          </select>
        </div>

        <div class="field-group">
          <label class="field-label" for="settings-experience">Experience level</label>
          <p class="field-description">
            Placeholder selection for the seniority band this tracker should assume.
          </p>
          <select id="settings-experience" class="input">
            <option>Entry / Junior</option>
            <option>Mid-level</option>
            <option>Senior / Lead</option>
            <option>Director+</option>
          </select>
        </div>
      `
    } else if (route === 'dashboard') {
      mainInner.innerHTML = `
        <p class="field-description">
          No jobs yet. In the next step, you will load a realistic dataset.
        </p>
      `
    } else if (route === 'saved') {
      mainInner.innerHTML = `
        <p class="field-description">
          No saved jobs yet. This space will hold curated roles once saving is introduced.
        </p>
      `
    } else if (route === 'digest') {
      mainInner.innerHTML = `
        <p class="field-description">
          Your daily 9AM job digest will appear here in a future step.
        </p>
      `
    } else if (route === 'proof') {
      mainInner.innerHTML = `
        <p class="field-description">
          This page will collect artifacts that show how this tracker behaves end to end.
        </p>
      `
    } else if (route === 'not-found') {
      mainInner.innerHTML = `
        <p class="field-description">
          The page you are trying to reach does not exist in this workspace.
        </p>
      `
    } else {
      mainInner.innerHTML = ''
    }
  }

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
