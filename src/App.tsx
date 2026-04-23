import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

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
          <a href={prototypeProject}>Open seeded project shell</a>
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

      <details className="card dev-details">
        <summary>Development links</summary>
        <div className="actions">
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
