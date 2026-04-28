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
  createdAt?: string;
  updatedAt?: string;
}

interface DocumentRecord {
  id: string;
  projectId: string;
  title: string;
}

interface PageRecord {
  id: string;
  projectId: string;
  title: string;
  type: 'lesson' | 'map' | 'review' | 'glossary' | 'notes' | string;
  description: string;
  updatedAt?: string;
}

interface PageDocumentLinkRecord {
  id: string;
  pageId: string;
  documentId: string;
}

interface PageStateRecord {
  id: string;
  pageId: string;
  data?: Record<string, unknown> & {
    workspace?: {
      pages?: Array<{
        map?: {
          nodes?: unknown[];
          edges?: unknown[];
        };
      }>;
    };
  };
}

interface WorkspaceSnapshot {
  workspace: WorkspaceRecord;
  projects: ProjectRecord[];
  documents: DocumentRecord[];
  pages: PageRecord[];
  pageDocumentLinks: PageDocumentLinkRecord[];
  pageStates: PageStateRecord[];
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
  createPage: (
    projectId: string,
    fields: {
      title: string;
      type: string;
      description?: string;
    },
  ) => Promise<PageRecord>;
  pageRuntimeHref: (pageId: string) => string;
}

interface ReviewCardDescriptor {
  id: string;
  type: 'block' | 'relationship' | 'neighbor' | 'source' | string;
  title?: string;
}

interface MapReviewSummary {
  pageId: string;
  projectId: string;
  title: string;
  totalCards: number;
  reviewedCards: number;
  weakCards: number;
  missedCards: number;
  almostCards: number;
  unreviewedCards: number;
  priorityCards: number;
  lastReviewedAt: string;
  lastReviewedLabel: string;
  weakQueue: ReviewCardDescriptor[];
  reviewNextQueue: ReviewCardDescriptor[];
}

interface WorkspaceReviewSummary {
  summaries: MapReviewSummary[];
  weakMaps: MapReviewSummary[];
  priorityMaps: MapReviewSummary[];
  recentlyReviewed: MapReviewSummary[];
  notReviewed: MapReviewSummary[];
}

interface ReviewSummaryModule {
  summarizeWorkspaceReview: (input: {
    pages: PageRecord[];
    pageStates: PageStateRecord[];
    documents: DocumentRecord[];
  }) => WorkspaceReviewSummary;
  lastReviewedLabel: (summary: MapReviewSummary) => string;
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
const reviewSummaryUrl = withBase('prototypes/current/review-summary.js');

function projectUrl(projectId: string) {
  return `${prototypeProject}?projectId=${encodeURIComponent(projectId)}`;
}

function runtimeUrl(store: WorkspaceStore | null, pageId: string) {
  const runtimePath = store?.pageRuntimeHref(pageId) ?? `page.html?pageId=${encodeURIComponent(pageId)}`;
  return withBase(`prototypes/current/${runtimePath}`);
}

function mapReviewUrl(pageId: string, mode: '1' | 'weak' | 'next' = '1') {
  return `${prototypeMindMap}?pageId=${encodeURIComponent(pageId)}&review=${encodeURIComponent(mode)}`;
}

async function loadWorkspaceStore(): Promise<WorkspaceStore> {
  const runtimeImport = new Function('url', 'return import(url)') as (
    url: string,
  ) => Promise<{ workspaceStore: WorkspaceStore }>;
  const module = await runtimeImport(workspaceStoreUrl);
  return module.workspaceStore;
}

async function loadReviewSummaryModule(): Promise<ReviewSummaryModule> {
  const runtimeImport = new Function('url', 'return import(url)') as (url: string) => Promise<ReviewSummaryModule>;
  return runtimeImport(reviewSummaryUrl);
}

function pageTypeLabel(type: string) {
  return {
    lesson: 'Lesson',
    map: 'Map',
    notes: 'Notes',
    review: 'Review',
    glossary: 'Glossary',
  }[type] ?? 'Page';
}

function pageOpenLabel(type: string) {
  return type === 'map' ? 'Open map' : `Open ${pageTypeLabel(type).toLowerCase()}`;
}

function defaultTitleForType(type: string) {
  return {
    lesson: 'New lesson page',
    map: 'New learning map',
    notes: 'New notes page',
    review: 'New review page',
    glossary: 'New glossary page',
  }[type] ?? 'New page';
}

function sortByWorkspaceOrder(projects: ProjectRecord[], workspace?: WorkspaceRecord) {
  if (!workspace) return projects;
  return [...projects].sort((a, b) => {
    const order = workspace.projectOrder;
    return order.indexOf(a.id) - order.indexOf(b.id);
  });
}

function newestFirst<T extends { updatedAt?: string }>(items: T[]) {
  return [...items].sort((a, b) => Date.parse(b.updatedAt || '') - Date.parse(a.updatedAt || ''));
}

function mapPageState(snapshot: WorkspaceSnapshot | null, pageId: string) {
  return snapshot?.pageStates.find((state) => state.pageId === pageId) ?? null;
}

function mapStats(snapshot: WorkspaceSnapshot | null, page: PageRecord) {
  const firstMap = mapPageState(snapshot, page.id)?.data?.workspace?.pages?.[0]?.map;
  return {
    nodes: firstMap?.nodes?.length ?? 1,
    edges: firstMap?.edges?.length ?? 0,
  };
}

function relatedDocumentCount(snapshot: WorkspaceSnapshot | null, pageId: string) {
  return snapshot?.pageDocumentLinks.filter((link) => link.pageId === pageId).length ?? 0;
}

function projectStats(snapshot: WorkspaceSnapshot | null, projectId: string) {
  const pages = snapshot?.pages.filter((page) => page.projectId === projectId) ?? [];
  return {
    pages: pages.length,
    maps: pages.filter((page) => page.type === 'map').length,
    documents: snapshot?.documents.filter((documentRecord) => documentRecord.projectId === projectId).length ?? 0,
  };
}

function reviewCardCountLabel(count: number) {
  return `${count} card${count === 1 ? '' : 's'}`;
}

function reviewPriorityText(summary: MapReviewSummary) {
  return `${summary.missedCards || 0} missed · ${summary.almostCards || 0} almost · ${
    summary.unreviewedCards || 0
  } new`;
}

function openDialog(ref: RefObject<HTMLDialogElement | null>) {
  const dialog = ref.current;
  if (!dialog) return;
  if (!dialog.open) dialog.showModal();
  window.setTimeout(() => dialog.querySelector<HTMLElement>('input, textarea, select, button')?.focus(), 0);
}

function closeDialog(ref: RefObject<HTMLDialogElement | null>) {
  const dialog = ref.current;
  if (dialog?.open) dialog.close();
}

function DiagramPreview({ page, snapshot }: { page: PageRecord; snapshot: WorkspaceSnapshot | null }) {
  const stats = page.type === 'map' ? mapStats(snapshot, page) : null;
  return (
    <div className={`preview preview-${page.type}`} aria-hidden="true">
      {page.type === 'map' ? (
        <>
          <span className="node node-a" />
          <span className="node node-b" />
          <span className="node node-c" />
          <span className="line line-a" />
          <span className="line line-b" />
          <strong>{stats?.nodes ?? 1}</strong>
        </>
      ) : (
        <>
          <span className="page-mark">{pageTypeLabel(page.type).slice(0, 1)}</span>
          <span className="preview-line" />
          <span className="preview-line short" />
        </>
      )}
    </div>
  );
}

function PageCard({
  page,
  snapshot,
  store,
  variant = 'page',
}: {
  page: PageRecord;
  snapshot: WorkspaceSnapshot | null;
  store: WorkspaceStore | null;
  variant?: 'page' | 'recent';
}) {
  const isMap = page.type === 'map';
  const stats = isMap ? mapStats(snapshot, page) : null;
  const docCount = relatedDocumentCount(snapshot, page.id);
  return (
    <article className={`object-card page-object type-${page.type}`} data-page-type={page.type}>
      <DiagramPreview page={page} snapshot={snapshot} />
      <div className="object-body">
        <p className="badge">{isMap ? 'Diagram map' : `${pageTypeLabel(page.type)} page`}</p>
        <h3>
          <a href={runtimeUrl(store, page.id)}>{page.title}</a>
        </h3>
        <p>{page.description || (variant === 'recent' ? 'Recent workspace page.' : 'Project page.')}</p>
        <div className="object-meta">
          <span>{docCount} docs</span>
          {isMap ? <span>{stats?.nodes ?? 1} nodes</span> : null}
          {isMap ? <span>{stats?.edges ?? 0} links</span> : null}
        </div>
      </div>
      <a className="button primary" href={runtimeUrl(store, page.id)}>
        {pageOpenLabel(page.type)}
      </a>
    </article>
  );
}

export default function App() {
  const newProjectDialogRef = useRef<HTMLDialogElement>(null);
  const newPageDialogRef = useRef<HTMLDialogElement>(null);
  const backupDialogRef = useRef<HTMLDialogElement>(null);
  const helpDialogRef = useRef<HTMLDialogElement>(null);
  const devDialogRef = useRef<HTMLDialogElement>(null);
  const [store, setStore] = useState<WorkspaceStore | null>(null);
  const [reviewSummaryModule, setReviewSummaryModule] = useState<ReviewSummaryModule | null>(null);
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot | null>(null);
  const [status, setStatus] = useState('Loading workspace...');
  const [backupStatus, setBackupStatus] = useState('Backups include workspace metadata and page state.');
  const [defaultPageType, setDefaultPageType] = useState('notes');

  async function refresh(nextStore = store) {
    if (!nextStore) return;
    const nextSnapshot = await nextStore.getWorkspaceSnapshot();
    setSnapshot(nextSnapshot);
    setStatus('Ready');
  }

  useEffect(() => {
    let alive = true;
    Promise.all([loadWorkspaceStore(), loadReviewSummaryModule().catch(() => null)])
      .then(async ([nextStore, nextReviewSummaryModule]) => {
        if (!alive) return;
        setStore(nextStore);
        setReviewSummaryModule(nextReviewSummaryModule);
        const nextSnapshot = await nextStore.getWorkspaceSnapshot();
        if (!alive) return;
        setSnapshot(nextSnapshot);
        setStatus('Ready');
      })
      .catch(() => {
        if (!alive) return;
        setStatus('Local workspace storage is unavailable.');
      });
    return () => {
      alive = false;
    };
  }, []);

  const projects = snapshot ? sortByWorkspaceOrder(snapshot.projects, snapshot.workspace) : [];
  const currentProject =
    projects.find((project) => project.id === snapshot?.workspace.currentProjectId) ?? projects[0];
  const recentPages = newestFirst(snapshot?.pages ?? []).slice(0, 5);
  const recentMap = recentPages.find((page) => page.type === 'map');
  const continuePage = recentPages[0];
  const workspaceReview =
    snapshot && reviewSummaryModule
      ? reviewSummaryModule.summarizeWorkspaceReview({
          pages: snapshot.pages,
          pageStates: snapshot.pageStates,
          documents: snapshot.documents,
        })
      : null;
  const showDeveloperToolsShortcut =
    typeof window !== 'undefined' &&
    (() => {
      const params = new URLSearchParams(window.location.search);
      return params.has('dev') || params.has('debug');
    })();

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!store) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const title = String(form.get('title') || '').trim();
    if (!title) return;
    const project = await store.createProject({
      title,
      description: String(form.get('description') || '').trim(),
      theme: String(form.get('theme') || '').trim(),
    });
    formElement.reset();
    closeDialog(newProjectDialogRef);
    await refresh();
    setStatus(`Created ${project.title}`);
  }

  async function createPageAndOpen(type: string, title?: string, description?: string) {
    if (!store || !currentProject) return;
    const page = await store.createPage(currentProject.id, {
      title: title?.trim() || defaultTitleForType(type),
      type,
      description: description?.trim() || (type === 'map' ? 'A fresh diagram map.' : 'A workspace page.'),
    });
    window.location.assign(runtimeUrl(store, page.id));
  }

  async function handleCreatePage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    await createPageAndOpen(
      String(form.get('type') || defaultPageType),
      String(form.get('title') || ''),
      String(form.get('description') || ''),
    );
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

  return (
    <main className="workspace-frame">
      <aside className="workspace-rail" aria-label="Workspace rail">
        <a className="rail-brand" href="/">
          <span className="brand-mark">N</span>
          <span>Neuro Map Studio</span>
        </a>
        <nav aria-label="Workspace navigation">
          <a href="#continue">Workspace</a>
          <a href="#review">Review</a>
          <a href="#recent">Recent</a>
          <a href="#projects">Projects</a>
          <button type="button" onClick={() => openDialog(helpDialogRef)}>
            Help
          </button>
          <button type="button" onClick={() => openDialog(backupDialogRef)}>
            Backup
          </button>
        </nav>
        {showDeveloperToolsShortcut ? (
          <button className="rail-utility" type="button" onClick={() => openDialog(devDialogRef)}>
            Developer tools
          </button>
        ) : null}
      </aside>

      <section className="workspace-main" aria-label="Workspace board">
        <header className="workspace-topbar" aria-label="Workspace topbar">
          <div>
            <p className="eyebrow">Local workspace</p>
            <h1>Workspace board</h1>
          </div>
          <div className="topbar-actions" aria-label="Primary workspace actions">
            <button
              className="primary"
              type="button"
              disabled={!store || !currentProject}
              onClick={() => void createPageAndOpen('map', 'New learning map')}
            >
              New map
            </button>
            <button
              type="button"
              disabled={!store || !currentProject}
              onClick={() => {
                setDefaultPageType('notes');
                openDialog(newPageDialogRef);
              }}
            >
              New page
            </button>
            <button type="button" disabled={!store} onClick={() => openDialog(newProjectDialogRef)}>
              New project
            </button>
          </div>
          <p className="status-chip" role="status" aria-live="polite">
            {status}
          </p>
        </header>

        <section className="board-grid" id="continue" aria-label="Continue working">
          <article className="board-panel continue-panel">
            <div className="panel-heading">
              <p className="eyebrow">Continue</p>
              <h2>Continue working</h2>
            </div>
            {currentProject ? (
              <div className="continue-layout">
                <div>
                  <p className="badge">Current project</p>
                  <h3>{currentProject.title}</h3>
                  <p>{currentProject.description}</p>
                  <div className="object-meta">
                    <span>{projectStats(snapshot, currentProject.id).pages} pages</span>
                    <span>{projectStats(snapshot, currentProject.id).maps} maps</span>
                    <span>{projectStats(snapshot, currentProject.id).documents} docs</span>
                  </div>
                </div>
                <div className="actions">
                  <a className="button primary" href={projectUrl(currentProject.id)}>
                    Open project
                  </a>
                  {continuePage ? (
                    <a className="button" href={runtimeUrl(store, continuePage.id)}>
                      Open latest page
                    </a>
                  ) : null}
                  {recentMap ? (
                    <a className="button" href={runtimeUrl(store, recentMap.id)}>
                      Resume map
                    </a>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <h3>No current project yet</h3>
                <p>Create a project to start a workspace board.</p>
                <button className="primary" type="button" onClick={() => openDialog(newProjectDialogRef)}>
                  New project
                </button>
              </div>
            )}
          </article>

          <article className="board-panel quick-create" aria-label="Quick create">
            <p className="eyebrow">Create</p>
            <h2>Quick create</h2>
            <div className="quick-create-grid">
              <button
                className="creation-tile primary"
                type="button"
                disabled={!store || !currentProject}
                onClick={() => void createPageAndOpen('map', 'New learning map')}
              >
                <span className="tile-icon">⌁</span>
                <strong>New map</strong>
                <small>Open a fresh diagram canvas.</small>
              </button>
              <button
                className="creation-tile"
                type="button"
                disabled={!store || !currentProject}
                onClick={() => {
                  setDefaultPageType('notes');
                  openDialog(newPageDialogRef);
                }}
              >
                <span className="tile-icon">✎</span>
                <strong>New page</strong>
                <small>Lesson, notes, review, or glossary.</small>
              </button>
              <button className="creation-tile" type="button" disabled={!store} onClick={() => openDialog(newProjectDialogRef)}>
                <span className="tile-icon">▣</span>
                <strong>New project</strong>
                <small>Start a new learning workspace.</small>
              </button>
            </div>
          </article>
        </section>

        <section className="board-panel review-dashboard" id="review" aria-label="Workspace review">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Review</p>
              <h2>Workspace review</h2>
            </div>
            {currentProject ? (
              <a className="button" href={`${projectUrl(currentProject.id)}#projectReviewPanel`}>
                Open project review
              </a>
            ) : null}
          </div>
          {workspaceReview?.summaries.length ? (
            <div className="review-dashboard-grid">
              <article className="review-dashboard-group">
                <h3>Review next</h3>
                {workspaceReview.priorityMaps.length ? (
                  <div className="review-list">
                    {workspaceReview.priorityMaps.slice(0, 3).map((summary) => (
                      <div className="review-row" key={`next-${summary.pageId}`}>
                        <div>
                          <strong>{summary.title}</strong>
                          <p>
                            {reviewPriorityText(summary)} · {reviewCardCountLabel(summary.totalCards)}
                          </p>
                        </div>
                        <div className="actions">
                          <a className="button primary" href={mapReviewUrl(summary.pageId, 'next')}>
                            Review next
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <h3>Nothing urgent.</h3>
                    <p>Review any card or add more map content.</p>
                  </div>
                )}
              </article>
              <article className="review-dashboard-group">
                <h3>Weak cards</h3>
                {workspaceReview.weakMaps.length ? (
                  <div className="review-list">
                    {workspaceReview.weakMaps.slice(0, 3).map((summary) => (
                      <div className="review-row" key={`weak-${summary.pageId}`}>
                        <div>
                          <strong>{summary.title}</strong>
                          <p>
                            {summary.weakCards} weak · {summary.reviewedCards} reviewed · {reviewPriorityText(summary)}
                          </p>
                        </div>
                        <div className="actions">
                          <a className="button primary" href={mapReviewUrl(summary.pageId, 'weak')}>
                            Review weak cards
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <h3>No weak cards yet.</h3>
                    <p>Review a map and mark cards Almost or Missed to build a focused queue.</p>
                  </div>
                )}
              </article>
              <article className="review-dashboard-group">
                <h3>Recently reviewed</h3>
                {workspaceReview.recentlyReviewed.length ? (
                  <div className="review-list">
                    {workspaceReview.recentlyReviewed.slice(0, 2).map((summary) => (
                      <div className="review-row" key={`recent-review-${summary.pageId}`}>
                        <div>
                          <strong>{summary.title}</strong>
                          <p>
                            {summary.lastReviewedLabel} · {summary.weakCards} weak
                          </p>
                        </div>
                        <a className="button" href={mapReviewUrl(summary.pageId, '1')}>
                          Review map
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="review-note">Review a map to start building review history.</p>
                )}
              </article>
              <article className="review-dashboard-group">
                <h3>Not reviewed yet</h3>
                {workspaceReview.notReviewed.length ? (
                  <div className="review-list">
                    {workspaceReview.notReviewed.slice(0, 2).map((summary) => (
                      <div className="review-row" key={`not-reviewed-${summary.pageId}`}>
                        <div>
                          <strong>{summary.title}</strong>
                          <p>{reviewCardCountLabel(summary.totalCards)} ready</p>
                        </div>
                        <a className="button" href={mapReviewUrl(summary.pageId, '1')}>
                          Review map
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="review-note">Every map has at least one review attempt.</p>
                )}
              </article>
            </div>
          ) : (
            <div className="empty-state">
              <h3>Create a map to start reviewing.</h3>
              <p>Workspace review summaries appear here once a map exists.</p>
            </div>
          )}
        </section>

        <section className="board-panel" id="recent" aria-label="Recent pages and diagrams">
          <div className="panel-heading">
            <p className="eyebrow">Objects</p>
            <h2>Recent pages & diagrams</h2>
          </div>
          {recentPages.length ? (
            <div className="object-grid">
              {recentPages.map((page) => (
                <PageCard key={page.id} page={page} snapshot={snapshot} store={store} variant="recent" />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No pages yet</h3>
              <p>Create a map or page to start filling this board.</p>
            </div>
          )}
        </section>

        <section className="board-panel" id="projects" aria-label="Projects">
          <div className="panel-heading">
            <p className="eyebrow">Projects</p>
            <h2>Project board</h2>
          </div>
          <div className="project-grid">
            {projects.map((project) => {
              const stats = projectStats(snapshot, project.id);
              const pages = snapshot?.pages.filter((page) => page.projectId === project.id) ?? [];
              return (
                <article className="project-object project-card" key={project.id}>
                  <p className="badge">{project.theme || 'learning project'}</p>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <div className="mini-stack" aria-hidden="true">
                    {pages.slice(0, 3).map((page) => (
                      <span className={`mini-card type-${page.type}`} key={page.id} />
                    ))}
                  </div>
                  <div className="object-meta">
                    <span>{stats.pages} pages</span>
                    <span>{stats.maps} maps</span>
                    <span>{stats.documents} docs</span>
                  </div>
                  <a className="button primary" href={projectUrl(project.id)}>
                    Open project
                  </a>
                </article>
              );
            })}
          </div>
        </section>
      </section>

      <dialog className="app-dialog" ref={newProjectDialogRef} aria-label="New project">
        <form onSubmit={handleCreateProject}>
          <div className="dialog-heading">
            <h2>New project</h2>
            <button type="button" onClick={() => closeDialog(newProjectDialogRef)}>
              Close
            </button>
          </div>
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
            <textarea name="description" placeholder="What is this project helping you understand?" />
          </label>
          <div className="actions">
            <button className="primary" type="submit">
              Create project locally
            </button>
          </div>
        </form>
      </dialog>

      <dialog className="app-dialog" ref={newPageDialogRef} aria-label="New page">
        <form onSubmit={handleCreatePage}>
          <div className="dialog-heading">
            <h2>New page</h2>
            <button type="button" onClick={() => closeDialog(newPageDialogRef)}>
              Close
            </button>
          </div>
          <label>
            Page type
            <select name="type" value={defaultPageType} onChange={(event) => setDefaultPageType(event.target.value)}>
              <option value="notes">Notes</option>
              <option value="review">Review</option>
              <option value="glossary">Glossary</option>
              <option value="lesson">Lesson</option>
              <option value="map">Map</option>
            </select>
          </label>
          <label>
            Title
            <input name="title" required placeholder={defaultTitleForType(defaultPageType)} />
          </label>
          <label className="full">
            Description
            <textarea name="description" placeholder="What learning job should this page do?" />
          </label>
          <div className="actions">
            <button className="primary" type="submit">
              Create and open
            </button>
          </div>
        </form>
      </dialog>

      <dialog className="app-dialog utility-dialog" ref={backupDialogRef} aria-label="Backup and restore">
        <div className="dialog-heading">
          <h2>Backup & restore</h2>
          <button type="button" onClick={() => closeDialog(backupDialogRef)}>
            Close
          </button>
        </div>
        <p>Export a plain JSON backup. Import safely merges new records and skips matching IDs.</p>
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
      </dialog>

      <dialog className="app-dialog utility-dialog" ref={helpDialogRef} aria-label="Help and about">
        <div className="dialog-heading">
          <h2>Help / About</h2>
          <button type="button" onClick={() => closeDialog(helpDialogRef)}>
            Close
          </button>
        </div>
        <div className="help-grid">
          <article>
            <h3>Projects</h3>
            <p>Projects hold documents, pages, maps, and review work.</p>
          </article>
          <article>
            <h3>Maps</h3>
            <p>Maps turn ideas and documents into movable connected blocks.</p>
          </article>
          <article>
            <h3>Backup</h3>
            <p>Export a JSON backup before serious sessions or larger tests.</p>
          </article>
        </div>
        <details className="advanced-tools">
          <summary>Advanced tools</summary>
          <p>Developer links stay here so the workspace rail stays focused on learning work.</p>
          <button
            type="button"
            onClick={() => {
              closeDialog(helpDialogRef);
              window.setTimeout(() => openDialog(devDialogRef), 0);
            }}
          >
            Open developer tools
          </button>
        </details>
      </dialog>

      <dialog className="app-dialog utility-dialog" ref={devDialogRef} aria-label="Developer tools">
        <div className="dialog-heading">
          <h2>Developer tools</h2>
          <button type="button" onClick={() => closeDialog(devDialogRef)}>
            Close
          </button>
        </div>
        <div className="actions">
          <a className="button" href={prototypePageRuntime}>Open runtime page entry</a>
          <a className="button" href={prototypeMindMap}>Open editable map page</a>
          <a className="button" href={prototypeLesson}>Open linear lesson page</a>
          <a className="button" href={docsUrl}>Read docs on GitHub</a>
          <a className="button" href="https://adel199223.github.io/neuro-map-studio/" rel="noreferrer">
            Live preview URL
          </a>
        </div>
      </dialog>
    </main>
  );
}
