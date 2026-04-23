import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

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

  const projects = snapshot
    ? [...snapshot.projects].sort((a, b) => {
        const order = snapshot.workspace.projectOrder;
        return order.indexOf(a.id) - order.indexOf(b.id);
      })
    : [];
  const currentProject =
    projects.find((project) => project.id === snapshot?.workspace.currentProjectId) ?? projects[0];

  return (
    <main className="shell">
      <section className="hero-card">
        <p className="eyebrow">Neuro Map Studio · Local-first workspace</p>
        <h1>Build calm learning projects from documents, lessons, maps, and review pages</h1>
        <p className="lede">
          Keep sources at the project level, connect them to pages, and turn ideas into editable
          maps without losing the thread.
        </p>
        <div className="actions">
          {currentProject ? (
            <a className="primary" href={projectUrl(currentProject.id)}>
              Open current project
            </a>
          ) : null}
          <a href={prototypeProject}>Open project workspace</a>
        </div>
        <p className="status" role="status" aria-live="polite">
          {status}
        </p>
      </section>

      <section className="section-block" aria-label="Projects">
        <div className="section-heading">
          <p className="eyebrow">Workspace</p>
          <h2>Projects</h2>
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
              <p>Create a first local project below.</p>
            </article>
          ) : null}
        </div>
      </section>

      <section className="card create-card" aria-label="Create project">
        <h2>Create project</h2>
        <p>
          Start small: a project can hold documents, pages, maps, review prompts, glossary pages,
          and source notes.
        </p>
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
      </section>

      <details className="card backup-details">
        <summary>Backup & restore</summary>
        <p>
          Export a plain JSON backup before doing serious learning work. Import is merge-only here:
          existing local records are kept, and matching backup IDs are skipped.
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

      <details className="card dev-details">
        <summary>Development links</summary>
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
