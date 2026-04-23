/* global indexedDB */

const DB_NAME = 'neuro-map-studio-local-workspace';
const DB_VERSION = 1;

export const WORKSPACE_ID = 'local-workspace';
export const SEED_PROJECT_ID = 'geopolitics-economics';
export const SEED_DOCUMENT_ID = 'simon-dixon-debt-power';
export const SEED_LESSON_PAGE_ID = 'simon-dixon-linear-lesson';
export const SEED_MAP_PAGE_ID = 'simon-dixon-debt-power-map';

const STORE_NAMES = ['workspaces', 'projects', 'documents', 'pages', 'pageDocumentLinks'];
const PAGE_TYPES = ['lesson', 'map', 'review', 'glossary', 'notes'];
const DOCUMENT_TYPES = ['pdf', 'docx', 'html', 'note', 'web', 'video'];
const LINK_RELATIONSHIPS = ['source', 'attachment', 'related', 'evidence', 'further-reading'];
const PROTECTED_PAGE_IDS = new Set([SEED_LESSON_PAGE_ID, SEED_MAP_PAGE_ID]);

function now() {
  return new Date().toISOString();
}

function clean(value, fallback = '') {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text || fallback;
}

function listFromTags(tags) {
  if (Array.isArray(tags)) return tags.map((tag) => clean(tag)).filter(Boolean);
  return clean(tags)
    .split(',')
    .map((tag) => clean(tag))
    .filter(Boolean);
}

function id(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted.'));
  });
}

export function openWorkspaceDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of STORE_NAMES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: 'id' });
        }
      }
      const documents = request.transaction.objectStore('documents');
      if (!documents.indexNames.contains('projectId')) documents.createIndex('projectId', 'projectId');
      const pages = request.transaction.objectStore('pages');
      if (!pages.indexNames.contains('projectId')) pages.createIndex('projectId', 'projectId');
      const links = request.transaction.objectStore('pageDocumentLinks');
      if (!links.indexNames.contains('pageId')) links.createIndex('pageId', 'pageId');
      if (!links.indexNames.contains('documentId')) links.createIndex('documentId', 'documentId');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(storeName, mode, callback) {
  const db = await openWorkspaceDb();
  try {
    const tx = db.transaction(storeName, mode);
    const result = await callback(tx.objectStore(storeName), tx);
    await transactionDone(tx);
    return result;
  } finally {
    db.close();
  }
}

async function withStores(storeNames, mode, callback) {
  const db = await openWorkspaceDb();
  try {
    const tx = db.transaction(storeNames, mode);
    const stores = Object.fromEntries(storeNames.map((name) => [name, tx.objectStore(name)]));
    const result = await callback(stores, tx);
    await transactionDone(tx);
    return result;
  } finally {
    db.close();
  }
}

async function getAll(store) {
  return requestToPromise(store.getAll());
}

function seedRecords() {
  const createdAt = '2026-04-23T00:00:00.000Z';
  const workspace = {
    id: WORKSPACE_ID,
    title: 'Neuro Map Studio Workspace',
    projectOrder: [SEED_PROJECT_ID],
    currentProjectId: SEED_PROJECT_ID,
    createdAt,
    updatedAt: createdAt,
  };
  const project = {
    id: SEED_PROJECT_ID,
    title: 'Geopolitics & Economics',
    description:
      'A calm workspace for maps, lessons, and review pages about power, money, debt, institutions, and political economy.',
    theme: 'political-economy',
    createdAt,
    updatedAt: createdAt,
  };
  const document = {
    id: SEED_DOCUMENT_ID,
    projectId: SEED_PROJECT_ID,
    title: 'Simon Dixon debt-power interview/model',
    type: 'note',
    description: 'Seed source notes for understanding debt, assets, power, institutions, and practical exit paths.',
    sourceLabel: 'Interview / notes',
    urlOrPath: '',
    tags: ['debt', 'power', 'assets', 'political economy'],
    createdAt,
    updatedAt: createdAt,
  };
  const pages = [
    {
      id: SEED_LESSON_PAGE_ID,
      projectId: SEED_PROJECT_ID,
      title: 'Debt, assets, power, and exit',
      type: 'lesson',
      description: 'Linear reading page for encoding the Simon Dixon debt-power model.',
      route: 'lesson.html',
      slug: 'debt-assets-power-exit',
      protected: true,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: SEED_MAP_PAGE_ID,
      projectId: SEED_PROJECT_ID,
      title: 'Debt-power map',
      type: 'map',
      description: 'Editable spatial map for restructuring the same source model.',
      route: 'mindmap.html',
      slug: 'debt-power-map',
      protected: true,
      createdAt,
      updatedAt: createdAt,
    },
  ];
  const links = pages.map((page) => ({
    id: `link-${page.id}-${SEED_DOCUMENT_ID}`,
    pageId: page.id,
    documentId: SEED_DOCUMENT_ID,
    relationship: 'source',
    createdAt,
    updatedAt: createdAt,
  }));
  return { workspace, project, document, pages, links };
}

export async function ensureSeedData() {
  return withStores(STORE_NAMES, 'readwrite', async (stores) => {
    const existingWorkspace = await requestToPromise(stores.workspaces.get(WORKSPACE_ID));
    if (existingWorkspace) return existingWorkspace;

    const seed = seedRecords();
    stores.workspaces.put(seed.workspace);
    stores.projects.put(seed.project);
    stores.documents.put(seed.document);
    seed.pages.forEach((page) => stores.pages.put(page));
    seed.links.forEach((link) => stores.pageDocumentLinks.put(link));
    return seed.workspace;
  });
}

export async function getWorkspaceSnapshot() {
  await ensureSeedData();
  return withStores(STORE_NAMES, 'readonly', async (stores) => {
    const [workspace, projects, documents, pages, pageDocumentLinks] = await Promise.all([
      requestToPromise(stores.workspaces.get(WORKSPACE_ID)),
      getAll(stores.projects),
      getAll(stores.documents),
      getAll(stores.pages),
      getAll(stores.pageDocumentLinks),
    ]);
    return { workspace, projects, documents, pages, pageDocumentLinks };
  });
}

export async function getProjectBundle(projectId = SEED_PROJECT_ID) {
  const snapshot = await getWorkspaceSnapshot();
  const project = snapshot.projects.find((item) => item.id === projectId) || snapshot.projects[0] || null;
  if (!project) return { ...snapshot, project: null, documents: [], pages: [], pageDocumentLinks: [] };
  const pages = snapshot.pages.filter((page) => page.projectId === project.id);
  const documents = snapshot.documents.filter((document) => document.projectId === project.id);
  const pageIds = new Set(pages.map((page) => page.id));
  const documentIds = new Set(documents.map((document) => document.id));
  const pageDocumentLinks = snapshot.pageDocumentLinks.filter(
    (link) => pageIds.has(link.pageId) && documentIds.has(link.documentId),
  );
  return { ...snapshot, project, documents, pages, pageDocumentLinks };
}

export async function getPageContext(pageId, fallbackProjectId = SEED_PROJECT_ID) {
  const snapshot = await getWorkspaceSnapshot();
  const page = snapshot.pages.find((item) => item.id === pageId) || null;
  const project = snapshot.projects.find((item) => item.id === (page?.projectId || fallbackProjectId)) || null;
  const links = snapshot.pageDocumentLinks.filter((link) => link.pageId === pageId);
  const documents = links
    .map((link) => snapshot.documents.find((document) => document.id === link.documentId))
    .filter(Boolean);
  return { workspace: snapshot.workspace, project, page, documents, pageDocumentLinks: links };
}

async function saveWorkspaceOrder(projectId) {
  await withStore('workspaces', 'readwrite', async (store) => {
    const workspace = await requestToPromise(store.get(WORKSPACE_ID));
    const projectOrder = Array.from(new Set([...(workspace?.projectOrder || []), projectId]));
    store.put({
      id: WORKSPACE_ID,
      title: workspace?.title || 'Neuro Map Studio Workspace',
      projectOrder,
      currentProjectId: projectId,
      createdAt: workspace?.createdAt || now(),
      updatedAt: now(),
    });
  });
}

export async function createProject(fields = {}) {
  await ensureSeedData();
  const timestamp = now();
  const project = {
    id: fields.id || id('project'),
    title: clean(fields.title, 'New learning project'),
    description: clean(fields.description, 'A calm space for lessons, maps, documents, and review pages.'),
    theme: clean(fields.theme, 'general-learning'),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await withStore('projects', 'readwrite', async (store) => store.put(project));
  await saveWorkspaceOrder(project.id);
  return project;
}

export async function updateProject(projectId, fields = {}) {
  return withStore('projects', 'readwrite', async (store) => {
    const project = await requestToPromise(store.get(projectId));
    if (!project) return null;
    const updated = {
      ...project,
      title: clean(fields.title, project.title),
      description: clean(fields.description, project.description),
      theme: clean(fields.theme, project.theme),
      updatedAt: now(),
    };
    store.put(updated);
    return updated;
  });
}

export async function createDocument(projectId, fields = {}) {
  await ensureSeedData();
  const timestamp = now();
  const type = DOCUMENT_TYPES.includes(fields.type) ? fields.type : 'note';
  const document = {
    id: fields.id || id('document'),
    projectId,
    title: clean(fields.title, 'Untitled document'),
    type,
    description: clean(fields.description, 'Short source note or reference.'),
    sourceLabel: clean(fields.sourceLabel, type === 'note' ? 'Note' : type.toUpperCase()),
    urlOrPath: clean(fields.urlOrPath),
    tags: listFromTags(fields.tags),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await withStore('documents', 'readwrite', async (store) => store.put(document));
  return document;
}

export async function updateDocument(documentId, fields = {}) {
  return withStore('documents', 'readwrite', async (store) => {
    const document = await requestToPromise(store.get(documentId));
    if (!document) return null;
    const updated = {
      ...document,
      title: clean(fields.title, document.title),
      type: DOCUMENT_TYPES.includes(fields.type) ? fields.type : document.type,
      description: clean(fields.description, document.description),
      sourceLabel: clean(fields.sourceLabel, document.sourceLabel),
      urlOrPath: clean(fields.urlOrPath, document.urlOrPath),
      tags: fields.tags === undefined ? document.tags : listFromTags(fields.tags),
      updatedAt: now(),
    };
    store.put(updated);
    return updated;
  });
}

export async function createPage(projectId, fields = {}) {
  await ensureSeedData();
  const timestamp = now();
  const type = PAGE_TYPES.includes(fields.type) ? fields.type : 'notes';
  const page = {
    id: fields.id || id('page'),
    projectId,
    title: clean(fields.title, 'Untitled page'),
    type,
    description: clean(fields.description, 'A project page for learning work.'),
    route: clean(fields.route, `project.html?projectId=${encodeURIComponent(projectId)}`),
    slug: clean(fields.slug, clean(fields.title, 'untitled-page').toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    protected: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await withStore('pages', 'readwrite', async (store) => store.put(page));
  return page;
}

export async function updatePage(pageId, fields = {}) {
  return withStore('pages', 'readwrite', async (store) => {
    const page = await requestToPromise(store.get(pageId));
    if (!page) return null;
    const updated = {
      ...page,
      title: clean(fields.title, page.title),
      type: PAGE_TYPES.includes(fields.type) ? fields.type : page.type,
      description: clean(fields.description, page.description),
      route: clean(fields.route, page.route),
      slug: clean(fields.slug, page.slug),
      updatedAt: now(),
    };
    store.put(updated);
    return updated;
  });
}

export async function deletePage(pageId) {
  if (PROTECTED_PAGE_IDS.has(pageId)) return { deleted: false, reason: 'protected' };
  return withStores(['pages', 'pageDocumentLinks'], 'readwrite', async (stores) => {
    const page = await requestToPromise(stores.pages.get(pageId));
    if (!page) return { deleted: false, reason: 'missing' };
    stores.pages.delete(pageId);
    const links = await requestToPromise(stores.pageDocumentLinks.index('pageId').getAll(pageId));
    links.forEach((link) => stores.pageDocumentLinks.delete(link.id));
    return { deleted: true };
  });
}

export async function linkPageDocument(pageId, documentId, relationship = 'related') {
  await ensureSeedData();
  const normalizedRelationship = LINK_RELATIONSHIPS.includes(relationship) ? relationship : 'related';
  const existing = await withStore('pageDocumentLinks', 'readonly', async (store) => {
    const links = await requestToPromise(store.index('pageId').getAll(pageId));
    return links.find((link) => link.documentId === documentId && link.relationship === normalizedRelationship);
  });
  if (existing) return existing;
  const timestamp = now();
  const link = {
    id: id('page-document'),
    pageId,
    documentId,
    relationship: normalizedRelationship,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await withStore('pageDocumentLinks', 'readwrite', async (store) => store.put(link));
  return link;
}

export async function unlinkPageDocument(linkId) {
  return withStore('pageDocumentLinks', 'readwrite', async (store) => {
    store.delete(linkId);
    return true;
  });
}

export async function clearWorkspaceForTests() {
  const db = await openWorkspaceDb();
  try {
    const tx = db.transaction(STORE_NAMES, 'readwrite');
    STORE_NAMES.forEach((name) => tx.objectStore(name).clear());
    await transactionDone(tx);
  } finally {
    db.close();
  }
}

export const workspaceStore = {
  ensureSeedData,
  getWorkspaceSnapshot,
  getProjectBundle,
  getPageContext,
  createProject,
  updateProject,
  createDocument,
  updateDocument,
  createPage,
  updatePage,
  deletePage,
  linkPageDocument,
  unlinkPageDocument,
  clearWorkspaceForTests,
};

globalThis.neuroMapWorkspaceStore = workspaceStore;
