import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')

if (app) {
  app.innerHTML = `
    <div class="app-shell">
      <header class="app-shell__top-bar">
        <div class="top-bar__left">
          Job Notification App
        </div>
        <div class="top-bar__center">
          <span class="top-bar__progress-label">Step 1 of 4</span>
          <div class="top-bar__progress-steps" aria-hidden="true">
            <span class="progress-step progress-step--active"></span>
            <span class="progress-step"></span>
            <span class="progress-step"></span>
            <span class="progress-step"></span>
          </div>
        </div>
        <div class="top-bar__right">
          <span class="status-badge status-badge--in-progress">
            In Progress
          </span>
        </div>
      </header>

      <section class="app-shell__context-header">
        <h1 class="context-header__headline">
          Define how this workspace should behave.
        </h1>
        <p class="context-header__subtext">
          Use this space to design the structure and rules for your job notification flow. Keep it calm, predictable, and focused.
        </p>
      </section>

      <main class="app-shell__content" aria-label="Primary workspace">
        <section class="workspace-primary" aria-label="Primary workspace area">
          <article class="card">
            <h2 class="card__title">Workspace framing</h2>
            <p class="card__body">
              Capture the intent of this workspace without adding product features. Focus on what needs to stay consistent every time someone configures job notifications.
            </p>

            <div class="field-group">
              <label class="field-label" for="workspace-name">
                Workspace name
              </label>
              <p class="field-description">
                A short, stable label that describes this notification workspace.
              </p>
              <input
                id="workspace-name"
                class="input"
                type="text"
                placeholder="e.g. Candidate notification rules"
              />
            </div>

            <div class="field-group">
              <label class="field-label" for="workspace-purpose">
                Primary purpose
              </label>
              <p class="field-description">
                One calm sentence that explains why this workspace exists.
              </p>
              <textarea
                id="workspace-purpose"
                class="input"
                rows="3"
                placeholder="Describe what this workspace should reliably handle."
              ></textarea>
            </div>

            <div class="button-row">
              <button class="button button-primary" type="button">
                Save framing
              </button>
              <button class="button button-secondary" type="button">
                Add later
              </button>
              <button class="button button-ghost" type="button">
                Clear
              </button>
            </div>
          </article>

          <article class="card card--muted">
            <h2 class="card__title">Error &amp; empty state rules</h2>
            <p class="card__body">
              Define how this workspace should speak when something is missing, delayed, or misconfigured. Focus on clarity, next steps, and never blaming the user.
            </p>
          </article>
        </section>

        <aside class="workspace-secondary" aria-label="Secondary guidance panel">
          <section class="card">
            <h2 class="card__title">Step notes</h2>
            <p class="card__body">
              Use this panel to record how you expect teams to use this step. Keep the language neutral and outcome-oriented.
            </p>
          </section>

          <section class="card">
            <div class="prompt-box">
              <div>
                <h2 class="card__title">Copyable prompt</h2>
                <p class="card__body">
                  This prompt is a starting point for refining how job notifications should behave. Adjust it before you reuse it elsewhere.
                </p>
              </div>
              <div class="prompt-box__body">
Define a calm, predictable workspace for job notifications.
- No product features yet.
- Focus on structure, copy, and error language.
- Keep the tone confident, not excited.
              </div>
              <div class="prompt-box__footer">
                <button class="button button-secondary" type="button">
                  Copy prompt
                </button>
              </div>
            </div>
          </section>
        </aside>
      </main>

      <footer class="app-shell__footer" aria-label="Proof checklist">
        <div class="footer__label">Proof of completion</div>
        <div class="footer__checklist">
          <div class="checklist-item">
            <span class="checklist-item__marker checklist-item__marker--pending" aria-hidden="true"></span>
            <span>UI built</span>
          </div>
          <div class="checklist-item">
            <span class="checklist-item__marker checklist-item__marker--pending" aria-hidden="true"></span>
            <span>Logic working</span>
          </div>
          <div class="checklist-item">
            <span class="checklist-item__marker checklist-item__marker--pending" aria-hidden="true"></span>
            <span>Test passed</span>
          </div>
          <div class="checklist-item">
            <span class="checklist-item__marker checklist-item__marker--pending" aria-hidden="true"></span>
            <span>Deployed</span>
          </div>
        </div>
        <p class="helper-text">
          This checklist is intentionally static for now. It exists to remind you what “done” should eventually mean for this workspace.
        </p>
      </footer>
    </div>
  `
}
