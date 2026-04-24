import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, RefObject } from 'react';

const docsUrl = 'https://github.com/Adel199223/neuro-map-studio/tree/main/docs';

interface WorkspaceRecord {
  id: string;
  title: string;
  projectOrder: string[];
  currentProjectId: string;
}

interface ProjectRecord {
  id: string;
  title: string;
  description: string;
  theme: string;
}

interface WorkspaceSnapshot {
  workspace: WorkspaceRecord;
  projects: ProjectRecord[];
}

interface WorkspaceStore {
  getWorkspaceSnapshot: () => Promise<WorkspaceSnapshot>;
  exportWorkspaceBackup: () => Promise<Record<string, unknown>>;
  validateWorkspaceBackup: (payload: unknown) => { ok: boolean; errors: string[] };
  importWorkspaceBackup: (
    payload: unknown,
    options?: { mode: 'merge' },
  ) => Promise<{
    ok: boolean;
    errors: string[];
    imported: Record<string, number>;
    skipped: Record<string, number>;
  }>;
  createProject: (fields: {
    title: string;
    description?: string;
    theme?: string;
  }) => Promise<ProjectRecord>;
}

function withBase(path: string) {
  const normalizedBase = import.meta.env.BASE_URL.replace(/\/+$/, '');
  const normalizedPath = path.replace(/^\/+/, '');
  return `${normalizedBase}/${normalizedPath}`;
}

const prototypeMindMap = withBase('prototypes/current/mindmap.html');
const prototypeLesson = withBase('prototypes/current/lesson.html');
const prototypePageRuntime = withBase('prototypes/current/page.html');
const prototypeProject = withBase('prototypes/current/project.html');
const workspaceStoreUrl = withBase('prototypes/current/workspace-store.js');

function projectUrl(projectId: string) {
  return `${prototypeProject}?projectId=${encodeURIComponent(projectId)}`;
}

async function loadWorkspaceStore(): Promise<WorkspaceStore> {
  const runtimeImport = new Function('url', 'return import(url)') as (
    url: string,
  ) => Promise<{ workspaceStore: WorkspaceStore }>;
  const module = await runtimeImport(workspaceStoreUrl);
  return module.workspaceStore;
}

export default function App() {
  const newProjectPanelRef = useRef<HTMLDetailsElement>(null);
  const backupPanelRef = useRef<HTMLDetailsElement>(null);
  const helpPanelRef = useRef<HTMLDetailsElement>(null);
  const [store, setStore] = useState<WorkspaceStore | null>(null);
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot | null>(null);
  const [status, setStatus] = useState('Loading local workspace...');
  const [backupStatus, setBackupStatus] = useState('Backups include workspace metadata and page state.');

  async function refresh(nextStore = store) {
    if (!nextStore) return;
    const nextSnapshot = await nextStore.getWorkspaceSnapshot();
    setSnapshot(nextSnapshot);
    setStatus('Workspace ready');
  }

  useEffect(() => {
    let alive = true;
    loadWorkspaceStore()
      .then(async (nextStore) => {
        if (!alive) return;
        setStore(nextStore);
        const nextSnapshot = await nextStore.getWorkspaceSnapshot();
        if (!alive) return;
        setSnapshot(nextSnapshot);
        setStatus('Workspace ready');
      })
      .catch(() => {
        if (!alive) return;
        setStatus('Local workspace storage is unavailable in this browser.');
      });
    return () => {
      alive = false;
    };
  }, []);

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!store) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const title = String(form.get('title') || '').trim();
    if (!title) return;
    await store.createProject({
      title,
      description: String(form.get('description') || '').trim(),
      theme: String(form.get('theme') || '').trim(),
    });
    formElement.reset();
    await refresh();
    setStatus('Project created locally');
  }

  function backupFileName() {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `neuro-map-studio-workspace-backup-${stamp}.json`;
  }

  async function handleExportBackup() {
    if (!store) return;
    setBackupStatus('Preparing workspace backup...');
    const backup = await store.exportWorkspaceBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = backupFileName();
    anchor.click();
    URL.revokeObjectURL(url);
    setBackupStatus('Workspace backup exported as JSON.');
  }

  function summarizeImport(result: { imported: Record<string, number>; skipped: Record<string, number> }) {
    const importedTotal = Object.values(result.imported).reduce((sum, value) => sum + value, 0);
    const skippedTotal = Object.values(result.skipped).reduce((sum, value) => sum + value, 0);
    return `Imported ${importedTotal} new records. Skipped ${skippedTotal} existing records.`;
  }

  async function handleImportBackup(event: ChangeEvent<HTMLInputElement>) {
    if (!store) return;
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    try {
      setBackupStatus('Reading backup JSON...');
      const payload = JSON.parse(await file.text()) as unknown;
      const validation = store.validateWorkspaceBackup(payload);
      if (!validation.ok) {
        setBackupStatus(`Backup rejected: ${validation.errors.join(' ')}`);
        return;
      }
      const result = await store.importWorkspaceBackup(payload, { mode: 'merge' });
      if (!result.ok) {
        setBackupStatus(`Backup rejected: ${result.errors.join(' ')}`);
        return;
      }
      await refresh();
      setBackupStatus(`Backup merged safely. ${summarizeImport(result)}`);
    } catch {
      setBackupStatus('Backup rejected: choose a valid Neuro Map Studio JSON backup.');
    }
  }

  function openPanel(panelRef: RefObject<HTMLDetailsElement | null>) {
    const panel = panelRef.current;
    if (!panel) return;
    panel.open = true;
    panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    const target = panel.querySelector<HTMLElement>('input, textarea, select, button, a');
    target?.focus({ preventScroll: true });
  }

  const projects = snapshot
    ? [...snapshot.projects].sort((a, b) => {
        const order = snapshot.workspace.projectOrder;
        return order.indexOf(a.id) - order.indexOf(b.id);
      })
    : [];
  const currentProject =
    projects.find((project) => project.id === snapshot?.workspace.currentProjectId) ?? projects[0];

  return (
    <main className="shell app-dashboard">
      <header className="app-bar" aria-label="Workspace header">
        <div>
          <p className="eyebrow">Local-first workspace</p>
          <h1>Neuro Map Studio</h1>
        </div>
        <p className="status-chip" role="status" aria-live="polite">
          {status}
        </p>
      </header>

      <nav className="quick-actions" aria-label="Primary workspace actions">
        {currentProject ? (
          <a className="primary" href={projectUrl(currentProject.id)}>
            Open current project
          </a>
        ) : null}
        <button type="button" onClick={() => openPanel(newProjectPanelRef)}>
          New project
        </button>
        <button type="button" onClick={() => openPanel(backupPanelRef)}>
          Backup & restore
        </button>
        <button type="button" onClick={() => openPanel(helpPanelRef)}>
          Help
        </button>
      </nav>

      <section className="section-block projects-first" aria-label="Projects">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Workspace</p>
            <h2>Projects</h2>
          </div>
          <button type="button" onClick={() => openPanel(newProjectPanelRef)}>
            New project
          </button>
        </div>
        <div className="grid">
          {projects.map((project) => (
            <article className="card project-card" key={project.id}>
              <p className="meta">{project.theme || 'learning project'}</p>
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <div className="actions">
                <a className="primary" href={projectUrl(project.id)}>
                  Open project
                </a>
              </div>
            </article>
          ))}
          {!projects.length ? (
            <article className="card">
              <h3>No projects yet</h3>
              <p>Create a first local project.</p>
              <div className="actions">
                <button className="primary" type="button" onClick={() => openPanel(newProjectPanelRef)}>
                  New project
                </button>
              </div>
            </article>
          ) : null}
        </div>
      </section>

      <details className="card action-panel" id="new-project-panel" ref={newProjectPanelRef}>
        <summary>
          <span>New project</span>
          <small>Create a local workspace container.</small>
        </summary>
        <form onSubmit={handleCreateProject}>
          <label>
            Project title
            <input name="title" required placeholder="My learning project" />
          </label>
          <label>
            Theme or domain
            <input name="theme" placeholder="neuroscience, finance, law..." />
          </label>
          <label className="full">
            Short description
            <textarea
              name="description"
              placeholder="What is this project helping you understand?"
            />
          </label>
          <div className="actions">
            <button className="primary" type="submit">
              Create project locally
            </button>
          </div>
        </form>
      </details>

      <details className="card action-panel backup-details" ref={backupPanelRef}>
        <summary>
          <span>Backup & restore</span>
          <small>Export or merge a JSON workspace backup.</small>
        </summary>
        <p>
          Export a plain JSON backup. Import safely merges new records and skips matching IDs.
        </p>
        <div className="actions">
          <button className="primary" type="button" onClick={() => void handleExportBackup()}>
            Export workspace backup
          </button>
          <label className="file-action">
            Import workspace backup
            <input
              aria-label="Import workspace backup"
              accept="application/json,.json"
              type="file"
              onChange={(event) => void handleImportBackup(event)}
            />
          </label>
        </div>
        <p className="status" role="status" aria-live="polite">
          {backupStatus}
        </p>
      </details>

      <details className="card action-panel help-details" ref={helpPanelRef}>
        <summary>
          <span>Help / About</span>
          <small>Quick orientation and learning tips.</small>
        </summary>
        <div className="help-grid">
          <article>
            <h3>What this is for</h3>
            <p>
              Build calm learning projects from documents, lessons, maps, and review pages.
            </p>
          </article>
          <article>
            <h3>How it fits</h3>
            <p>
              Keep sources at the project level, connect them to pages, and turn ideas into editable maps.
            </p>
          </article>
          <article>
            <h3>Backup reminder</h3>
            <p>
              Export a JSON backup before serious learning sessions or before testing big changes.
            </p>
          </article>
        </div>
      </details>

      <details className="card action-panel dev-details">
        <summary>
          <span>Developer tools</span>
          <small>Prototype and documentation links.</small>
        </summary>
        <div className="actions">
          <a href={prototypePageRuntime}>Open runtime page entry</a>
          <a href={prototypeMindMap}>Open editable map page</a>
          <a href={prototypeLesson}>Open linear lesson page</a>
          <a href={docsUrl}>Read docs on GitHub</a>
          <a href="https://adel199223.github.io/neuro-map-studio/" rel="noreferrer">
            Live preview URL
          </a>
        </div>
      </details>
    </main>
  );
}
