import './style.css'
import { jobs, type Job } from './jobs'

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

type Filters = {
  keyword: string
  location: string
  mode: string
  experience: string
  source: string
  sort: 'latest' | 'match' | 'salary'
}

type Preferences = {
  roleKeywords: string
  preferredLocations: string[]
  preferredModes: Job['mode'][]
  experienceLevel: '' | Job['experience']
  skills: string
  minMatchScore: number
}

const STORAGE_KEY_SAVED = 'job-notification-tracker.savedJobs'
const STORAGE_KEY_PREFS = 'JobTrackerPreferences'

let savedJobIds = new Set<string>()
let currentFilters: Filters = {
  keyword: '',
  location: 'all',
  mode: 'all',
  experience: 'all',
  source: 'all',
  sort: 'latest',
}

let currentPreferences: Preferences = {
  roleKeywords: '',
  preferredLocations: [],
  preferredModes: [],
  experienceLevel: '',
  skills: '',
  minMatchScore: 40,
}

let showOnlyMatches = false

function loadSavedJobs() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_SAVED)
    if (!raw) {
      savedJobIds = new Set()
      return
    }
    const parsed = JSON.parse(raw) as string[]
    if (Array.isArray(parsed)) {
      savedJobIds = new Set(parsed)
    } else {
      savedJobIds = new Set()
    }
  } catch {
    savedJobIds = new Set()
  }
}

function persistSavedJobs() {
  try {
    window.localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(Array.from(savedJobIds)))
  } catch {
    // ignore
  }
}

function loadPreferences() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_PREFS)
    if (!raw) return
    const parsed = JSON.parse(raw) as Partial<Preferences>
    if (parsed && typeof parsed === 'object') {
      currentPreferences = {
        roleKeywords: parsed.roleKeywords ?? '',
        preferredLocations: Array.isArray(parsed.preferredLocations)
          ? parsed.preferredLocations
          : [],
        preferredModes: Array.isArray(parsed.preferredModes)
          ? (parsed.preferredModes as Job['mode'][])
          : [],
        experienceLevel: (parsed.experienceLevel as Preferences['experienceLevel']) ?? '',
        skills: parsed.skills ?? '',
        minMatchScore:
          typeof parsed.minMatchScore === 'number' && parsed.minMatchScore >= 0
            ? parsed.minMatchScore
            : 40,
      }
    }
  } catch {
    // ignore and keep defaults
  }
}

function persistPreferences() {
  try {
    window.localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(currentPreferences))
  } catch {
    // ignore
  }
}

function parseCommaList(value: string): string[] {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
}

function preferencesAreSet(prefs: Preferences): boolean {
  return (
    prefs.roleKeywords.trim().length > 0 ||
    prefs.preferredLocations.length > 0 ||
    prefs.preferredModes.length > 0 ||
    !!prefs.experienceLevel ||
    prefs.skills.trim().length > 0
  )
}

function computeMatchScore(job: Job, prefs: Preferences): number {
  let score = 0

  const roleTokens = parseCommaList(prefs.roleKeywords).map((t) => t.toLowerCase())
  const skillTokens = parseCommaList(prefs.skills).map((t) => t.toLowerCase())

  const titleLower = job.title.toLowerCase()
  const descLower = job.description.toLowerCase()

  if (roleTokens.length) {
    if (roleTokens.some((t) => t && titleLower.includes(t))) {
      score += 25
    }
    if (roleTokens.some((t) => t && descLower.includes(t))) {
      score += 15
    }
  }

  if (prefs.preferredLocations.length) {
    if (prefs.preferredLocations.includes(job.location)) {
      score += 15
    }
  }

  if (prefs.preferredModes.length) {
    if (prefs.preferredModes.includes(job.mode)) {
      score += 10
    }
  }

  if (prefs.experienceLevel && prefs.experienceLevel === job.experience) {
    score += 10
  }

  if (skillTokens.length) {
    const jobSkillsLower = job.skills.map((s) => s.toLowerCase())
    const overlap = skillTokens.some((s) => jobSkillsLower.includes(s))
    if (overlap) {
      score += 15
    }
  }

  if (job.postedDaysAgo <= 2) {
    score += 5
  }

  if (job.source === 'LinkedIn') {
    score += 5
  }

  return Math.min(100, score)
}

function parseSalaryValue(range: string): number {
  const lpaMatch = range.match(/(\d+)\s*-\s*(\d+)\s*LPA/i)
  if (lpaMatch) {
    const low = parseInt(lpaMatch[1], 10)
    const high = parseInt(lpaMatch[2], 10)
    return (low + high) / 2
  }

  const monthlyMatch = range.match(/₹\s*(\d+)\s*k\s*-\s*(\d+)\s*k.*month/i)
  if (monthlyMatch) {
    const low = parseInt(monthlyMatch[1], 10)
    const high = parseInt(monthlyMatch[2], 10)
    return ((low + high) / 2) * 12
  }

  return 0
}

function getFilteredJobs(all: Job[], filters: Filters): Job[] {
  const keyword = filters.keyword.trim().toLowerCase()

  const result = all.filter((job) => {
    if (keyword) {
      const haystack = `${job.title} ${job.company}`.toLowerCase()
      if (!haystack.includes(keyword)) return false
    }

    if (filters.location !== 'all' && job.location !== filters.location) return false
    if (filters.mode !== 'all' && job.mode !== filters.mode) return false
    if (filters.experience !== 'all' && job.experience !== filters.experience) return false
    if (filters.source !== 'all' && job.source !== filters.source) return false

    return true
  })
  return result
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
      <div class="modal" id="job-modal" aria-hidden="true">
        <div class="modal__content" role="dialog" aria-modal="true" aria-labelledby="job-modal-title">
          <h2 id="job-modal-title" class="modal__title"></h2>
          <p class="modal__subtitle" id="job-modal-subtitle"></p>
          <p class="modal__section-title">Description</p>
          <p class="modal__description" id="job-modal-description"></p>
          <p class="modal__section-title">Skills</p>
          <div class="modal__skills" id="job-modal-skills"></div>
          <div class="modal__footer">
            <button type="button" class="button button-secondary" id="job-modal-close">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  `
}

function openJobModal(job: Job) {
  const modal = document.querySelector<HTMLDivElement>('#job-modal')
  const title = document.querySelector<HTMLElement>('#job-modal-title')
  const subtitle = document.querySelector<HTMLElement>('#job-modal-subtitle')
  const description = document.querySelector<HTMLElement>('#job-modal-description')
  const skills = document.querySelector<HTMLDivElement>('#job-modal-skills')

  if (!modal || !title || !subtitle || !description || !skills) return

  title.textContent = job.title
  subtitle.textContent = `${job.company} • ${job.location} • ${job.mode}`
  description.textContent = job.description

  skills.innerHTML = ''
  job.skills.forEach((skill) => {
    const el = document.createElement('span')
    el.className = 'badge'
    el.textContent = skill
    skills.appendChild(el)
  })

  modal.classList.add('modal--open')
  modal.setAttribute('aria-hidden', 'false')
}

function closeJobModal() {
  const modal = document.querySelector<HTMLDivElement>('#job-modal')
  if (!modal) return
  modal.classList.remove('modal--open')
  modal.setAttribute('aria-hidden', 'true')
}

function renderJobList(container: HTMLElement, items: Job[]) {
  if (!items.length) {
    container.innerHTML = `
      <div class="job-empty-state">
        No jobs match your search.
      </div>
    `
    return
  }

  const fragments = items
    .map((job) => {
      const score = computeMatchScore(job, currentPreferences)
      const scoreLabel = `${score}`
      let scoreClass = 'badge--score-low'
      if (score >= 80) {
        scoreClass = 'badge--score-strong'
      } else if (score >= 60) {
        scoreClass = 'badge--score-medium'
      } else if (score >= 40) {
        scoreClass = 'badge--score-neutral'
      } else {
        scoreClass = 'badge--score-low'
      }

      const savedLabel = savedJobIds.has(job.id) ? 'Saved' : 'Save'
      return `
        <article class="job-card" data-job-id="${job.id}">
          <div class="job-card__header">
            <div>
              <h2 class="job-card__title">${job.title}</h2>
              <p class="job-card__company">${job.company}</p>
            </div>
            <div>
              <span class="badge badge--score ${scoreClass}">${scoreLabel}</span>
              <span class="badge badge--source">${job.source}</span>
            </div>
          </div>
          <div class="job-card__meta">
            <span>${job.location}</span>
            <span class="meta-separator"></span>
            <span>${job.mode}</span>
            <span class="meta-separator"></span>
            <span>${job.experience} years</span>
            <span class="meta-separator"></span>
            <span>${job.salaryRange}</span>
            <span class="meta-separator"></span>
            <span>${job.postedDaysAgo === 0 ? 'Today' : `${job.postedDaysAgo} days ago`}</span>
          </div>
          <div class="job-card__footer">
            <span class="badge badge--mode">
              ${job.skills.slice(0, 3).join(' • ')}
            </span>
            <div class="job-card__actions">
              <button type="button" class="button button-secondary" data-action="view" data-job-id="${job.id}">
                View
              </button>
              <button type="button" class="button button-secondary" data-action="save" data-job-id="${job.id}">
                ${savedLabel}
              </button>
              <button type="button" class="button button-primary" data-action="apply" data-job-id="${job.id}">
                Apply
              </button>
            </div>
          </div>
        </article>
      `
    })
    .join('')

  container.innerHTML = `<div class="job-list">${fragments}</div>`
}

function renderDashboardPage() {
  const mainInner = document.querySelector<HTMLDivElement>('#page-main-inner')
  if (!mainInner) return

  const locations = Array.from(new Set(jobs.map((j) => j.location))).sort()
  const modes: Array<Job['mode']> = ['Remote', 'Hybrid', 'Onsite']
  const experiences: Array<Job['experience']> = ['Fresher', '0-1', '1-3', '3-5']
  const sources: Array<Job['source']> = ['LinkedIn', 'Naukri', 'Indeed']

  mainInner.innerHTML = `
    ${
      preferencesAreSet(currentPreferences)
        ? ''
        : `<div class="job-empty-state">
             Set your preferences to activate intelligent matching.
           </div>`
    }
    <div class="filter-bar">
      <div class="filter-bar__group filter-bar__keyword">
        <label class="field-label" for="filter-keyword">Keyword</label>
        <input id="filter-keyword" class="input" type="text" placeholder="Search title or company" />
      </div>
      <div class="filter-bar__group">
        <label class="field-label" for="filter-location">Location</label>
        <select id="filter-location" class="input">
          <option value="all">All</option>
          ${locations.map((loc) => `<option value="${loc}">${loc}</option>`).join('')}
        </select>
      </div>
      <div class="filter-bar__group">
        <label class="field-label" for="filter-mode">Mode</label>
        <select id="filter-mode" class="input">
          <option value="all">All</option>
          ${modes.map((m) => `<option value="${m}">${m}</option>`).join('')}
        </select>
      </div>
      <div class="filter-bar__group">
        <label class="field-label" for="filter-experience">Experience</label>
        <select id="filter-experience" class="input">
          <option value="all">All</option>
          ${experiences.map((e) => `<option value="${e}">${e}</option>`).join('')}
        </select>
      </div>
      <div class="filter-bar__group">
        <label class="field-label" for="filter-source">Source</label>
        <select id="filter-source" class="input">
          <option value="all">All</option>
          ${sources.map((s) => `<option value="${s}">${s}</option>`).join('')}
        </select>
      </div>
      <div class="filter-bar__group">
        <label class="field-label" for="filter-sort">Sort</label>
        <select id="filter-sort" class="input">
          <option value="latest">Latest</option>
          <option value="match">Match score</option>
          <option value="salary">Salary</option>
        </select>
      </div>
      <div class="filter-bar__group">
        <label class="field-label" for="filter-only-matches">
          <input type="checkbox" id="filter-only-matches" />
          Show only jobs above my threshold
        </label>
      </div>
    </div>
    <div id="job-list-container"></div>
  `

  const listContainer = document.querySelector<HTMLElement>('#job-list-container')
  if (!listContainer) return

  const update = () => {
    let filtered = getFilteredJobs(jobs, currentFilters)

    if (showOnlyMatches) {
      filtered = filtered.filter(
        (job) => computeMatchScore(job, currentPreferences) >= currentPreferences.minMatchScore,
      )
    }

    if (currentFilters.sort === 'latest') {
      filtered = filtered.slice().sort((a, b) => a.postedDaysAgo - b.postedDaysAgo)
    } else if (currentFilters.sort === 'match') {
      filtered = filtered
        .slice()
        .sort(
          (a, b) => computeMatchScore(b, currentPreferences) - computeMatchScore(a, currentPreferences),
        )
    } else if (currentFilters.sort === 'salary') {
      filtered = filtered
        .slice()
        .sort((a, b) => parseSalaryValue(b.salaryRange) - parseSalaryValue(a.salaryRange))
    }

    renderJobList(listContainer, filtered)
  }

  const keywordInput = document.querySelector<HTMLInputElement>('#filter-keyword')
  const locationSelect = document.querySelector<HTMLSelectElement>('#filter-location')
  const modeSelect = document.querySelector<HTMLSelectElement>('#filter-mode')
  const experienceSelect = document.querySelector<HTMLSelectElement>('#filter-experience')
  const sourceSelect = document.querySelector<HTMLSelectElement>('#filter-source')
  const sortSelect = document.querySelector<HTMLSelectElement>('#filter-sort')
  const onlyMatchesToggle = document.querySelector<HTMLInputElement>('#filter-only-matches')

  if (keywordInput) {
    keywordInput.value = currentFilters.keyword
    keywordInput.addEventListener('input', () => {
      currentFilters.keyword = keywordInput.value
      update()
    })
  }

  if (locationSelect) {
    locationSelect.value = currentFilters.location
    locationSelect.addEventListener('change', () => {
      currentFilters.location = locationSelect.value
      update()
    })
  }

  if (modeSelect) {
    modeSelect.value = currentFilters.mode
    modeSelect.addEventListener('change', () => {
      currentFilters.mode = modeSelect.value
      update()
    })
  }

  if (experienceSelect) {
    experienceSelect.value = currentFilters.experience
    experienceSelect.addEventListener('change', () => {
      currentFilters.experience = experienceSelect.value
      update()
    })
  }

  if (sourceSelect) {
    sourceSelect.value = currentFilters.source
    sourceSelect.addEventListener('change', () => {
      currentFilters.source = sourceSelect.value
      update()
    })
  }

  if (sortSelect) {
    sortSelect.value = currentFilters.sort
    sortSelect.addEventListener('change', () => {
      currentFilters.sort = sortSelect.value as Filters['sort']
      update()
    })
  }

  if (onlyMatchesToggle) {
    onlyMatchesToggle.checked = showOnlyMatches
    onlyMatchesToggle.addEventListener('change', () => {
      showOnlyMatches = onlyMatchesToggle.checked
      update()
    })
  }

  update()
}

function renderSavedPage() {
  const mainInner = document.querySelector<HTMLDivElement>('#page-main-inner')
  if (!mainInner) return

  if (!savedJobIds.size) {
    mainInner.innerHTML = `
      <div class="job-empty-state">
        You have not saved any jobs yet. View the dashboard and save roles that look interesting.
      </div>
    `
    return
  }

  const saved = jobs.filter((job) => savedJobIds.has(job.id))
  mainInner.innerHTML = `<div id="job-list-container"></div>`
  const listContainer = document.querySelector<HTMLElement>('#job-list-container')
  if (!listContainer) return
  renderJobList(listContainer, saved)
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
      const locations = Array.from(new Set(jobs.map((j) => j.location))).sort()
      mainInner.innerHTML = `
        <div class="field-group">
          <label class="field-label" for="settings-role-keywords">Role keywords</label>
          <p class="field-description">
            Comma-separated titles you care about. Used for headline and description matching.
          </p>
          <input
            id="settings-role-keywords"
            class="input"
            type="text"
            placeholder="e.g. SDE Intern, React Developer, Data Analyst"
          />
        </div>

        <div class="field-group">
          <label class="field-label" for="settings-locations">Preferred locations</label>
          <p class="field-description">
            Multi-select locations you are open to.
          </p>
          <select id="settings-locations" class="input" multiple size="4">
            ${locations.map((loc) => `<option value="${loc}">${loc}</option>`).join('')}
          </select>
        </div>

        <div class="field-group">
          <span class="field-label">Preferred mode</span>
          <p class="field-description">
            Choose where you are comfortable working from.
          </p>
          <label class="field-description">
            <input type="checkbox" id="settings-mode-remote" value="Remote" />
            Remote
          </label>
          <label class="field-description">
            <input type="checkbox" id="settings-mode-hybrid" value="Hybrid" />
            Hybrid
          </label>
          <label class="field-description">
            <input type="checkbox" id="settings-mode-onsite" value="Onsite" />
            Onsite
          </label>
        </div>

        <div class="field-group">
          <label class="field-label" for="settings-experience">Experience level</label>
          <p class="field-description">
            Pick the band that best matches where you are today.
          </p>
          <select id="settings-experience" class="input">
            <option value="">Any</option>
            <option value="Fresher">Fresher</option>
            <option value="0-1">0-1</option>
            <option value="1-3">1-3</option>
            <option value="3-5">3-5</option>
          </select>
        </div>

        <div class="field-group">
          <label class="field-label" for="settings-skills">Skills</label>
          <p class="field-description">
            Comma-separated skills you want this tracker to look for.
          </p>
          <input
            id="settings-skills"
            class="input"
            type="text"
            placeholder="e.g. Java, React, SQL, Data Analysis"
          />
        </div>

        <div class="field-group">
          <label class="field-label" for="settings-min-score">Minimum match score</label>
          <p class="field-description">
            Jobs below this score will be hidden when you enable the threshold toggle.
          </p>
          <input
            id="settings-min-score"
            class="input"
            type="range"
            min="0"
            max="100"
            step="5"
          />
          <p class="field-description">
            Current threshold:
            <span id="settings-min-score-value"></span>
          </p>
        </div>
      `

      const roleInput = document.querySelector<HTMLInputElement>('#settings-role-keywords')
      const locationsSelect = document.querySelector<HTMLSelectElement>('#settings-locations')
      const modeRemote = document.querySelector<HTMLInputElement>('#settings-mode-remote')
      const modeHybrid = document.querySelector<HTMLInputElement>('#settings-mode-hybrid')
      const modeOnsite = document.querySelector<HTMLInputElement>('#settings-mode-onsite')
      const experienceSelect =
        document.querySelector<HTMLSelectElement>('#settings-experience')
      const skillsInput = document.querySelector<HTMLInputElement>('#settings-skills')
      const minScoreInput = document.querySelector<HTMLInputElement>('#settings-min-score')
      const minScoreValue = document.querySelector<HTMLElement>('#settings-min-score-value')

      if (roleInput) {
        roleInput.value = currentPreferences.roleKeywords
        roleInput.addEventListener('input', () => {
          currentPreferences.roleKeywords = roleInput.value
          persistPreferences()
        })
      }

      if (locationsSelect) {
        Array.from(locationsSelect.options).forEach((opt) => {
          opt.selected = currentPreferences.preferredLocations.includes(opt.value)
        })
        locationsSelect.addEventListener('change', () => {
          const selected = Array.from(locationsSelect.selectedOptions).map((o) => o.value)
          currentPreferences.preferredLocations = selected
          persistPreferences()
        })
      }

      const updateModesFromUI = () => {
        const modes: Job['mode'][] = []
        if (modeRemote?.checked) modes.push('Remote')
        if (modeHybrid?.checked) modes.push('Hybrid')
        if (modeOnsite?.checked) modes.push('Onsite')
        currentPreferences.preferredModes = modes
        persistPreferences()
      }

      if (modeRemote) {
        modeRemote.checked = currentPreferences.preferredModes.includes('Remote')
        modeRemote.addEventListener('change', updateModesFromUI)
      }
      if (modeHybrid) {
        modeHybrid.checked = currentPreferences.preferredModes.includes('Hybrid')
        modeHybrid.addEventListener('change', updateModesFromUI)
      }
      if (modeOnsite) {
        modeOnsite.checked = currentPreferences.preferredModes.includes('Onsite')
        modeOnsite.addEventListener('change', updateModesFromUI)
      }

      if (experienceSelect) {
        experienceSelect.value = currentPreferences.experienceLevel
        experienceSelect.addEventListener('change', () => {
          currentPreferences.experienceLevel =
            experienceSelect.value as Preferences['experienceLevel']
          persistPreferences()
        })
      }

      if (skillsInput) {
        skillsInput.value = currentPreferences.skills
        skillsInput.addEventListener('input', () => {
          currentPreferences.skills = skillsInput.value
          persistPreferences()
        })
      }

      if (minScoreInput && minScoreValue) {
        minScoreInput.value = String(currentPreferences.minMatchScore)
        minScoreValue.textContent = String(currentPreferences.minMatchScore)
        minScoreInput.addEventListener('input', () => {
          const value = Number(minScoreInput.value)
          currentPreferences.minMatchScore = isNaN(value) ? 40 : value
          minScoreValue.textContent = String(currentPreferences.minMatchScore)
          persistPreferences()
        })
      }
    } else if (route === 'dashboard') {
      renderDashboardPage()
    } else if (route === 'saved') {
      renderSavedPage()
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
  loadSavedJobs()
  loadPreferences()
  renderShell(app)
  bindNavigation()

  const initialRoute = matchRoute(window.location.pathname)
  applyRoute(initialRoute)
}

document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement | null
  if (!target) return

  const action = target.getAttribute('data-action')
  const jobId = target.getAttribute('data-job-id')

  if (action && jobId) {
    const job = jobs.find((j) => j.id === jobId)
    if (!job) return

    if (action === 'view') {
      openJobModal(job)
    } else if (action === 'save') {
      if (savedJobIds.has(job.id)) {
        savedJobIds.delete(job.id)
      } else {
        savedJobIds.add(job.id)
      }
      persistSavedJobs()

      const current = matchRoute(window.location.pathname)
      if (current === 'dashboard') {
        renderDashboardPage()
      } else if (current === 'saved') {
        renderSavedPage()
      }
    } else if (action === 'apply') {
      window.open(job.applyUri, '_blank', 'noopener')
    }
  }

  if (target.id === 'job-modal-close') {
    closeJobModal()
  }
})
