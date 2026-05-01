import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  previewAccessibleReaderGraphFromSnapshot,
} from '../../src/features/learning-map/portableAdapters';
import {
  listPortableDocumentRefs,
  listPortableRelationshipRefs,
  validatePortableSnapshotShape,
} from '../../src/features/learning-map/portableSnapshot';
import {
  buildPortableReviewNextQueue,
  getPortableReviewSummary,
} from '../../src/features/learning-map/portableReview';
import {
  buildPortableBundleFromRuntimePageStates,
  buildPortableSnapshotFromRuntimePageState,
  buildPortableSnapshotsFromRuntimePageState,
  getRuntimePortableParitySummary,
  listRuntimeMapViewsFromPageState,
  normalizeRuntimeReviewState,
  selectRuntimeMapViewFromPageState,
} from '../../src/features/learning-map/runtimePortableSnapshot';
import {
  runtimeDocuments,
  runtimeInvalidRelationshipPageState,
  runtimeMultiMapPageState,
  runtimePageRecord,
  runtimeReviewCards,
  runtimeSingleMapPageState,
  runtimeWorkspaceBackupFixture,
} from '../fixtures/learning-map/runtimePortableFixtures';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDirectory, '../..');

function readSource(relativePath: string): string {
  return readFileSync(resolve(root, relativePath), 'utf8');
}

function stableSerialized(value: unknown): string {
  return JSON.stringify(value);
}

test.describe('runtime portable snapshot parity fixtures', () => {
  test('runtime map page-state converts to a valid portable snapshot', () => {
    const snapshot = buildPortableSnapshotFromRuntimePageState({
      pageState: runtimeSingleMapPageState,
      page: runtimePageRecord,
      documents: runtimeDocuments,
      reviewCards: runtimeReviewCards,
    });
    const validation = validatePortableSnapshotShape(snapshot);

    expect(validation).toMatchObject({ valid: true, errors: [] });
    expect(snapshot).toMatchObject({
      id: 'runtime-map-page:page-main',
      title: 'Runtime main map',
      projectId: 'runtime-project',
      pageId: 'runtime-map-page',
      mapViewId: 'page-main',
      createdAt: '2026-02-01T10:00:00.000Z',
      updatedAt: '2026-02-02T10:00:00.000Z',
    });
    expect(snapshot.blocks.map((block) => block.id)).toEqual([
      'runtime-core',
      'runtime-question',
      'runtime-evidence',
      'runtime-document',
    ]);
  });

  test('multi-map page-state emits one portable snapshot per runtime map view', () => {
    const snapshots = buildPortableSnapshotsFromRuntimePageState({
      pageState: runtimeMultiMapPageState,
      page: runtimePageRecord,
      documents: runtimeDocuments,
    });

    expect(snapshots.map((snapshot) => snapshot.mapViewId)).toEqual(['page-main', 'secondary-map']);
    expect(snapshots.map((snapshot) => snapshot.title)).toEqual([
      'Runtime main map',
      'Secondary runtime map',
    ]);
  });

  test('active map selection is stable and explicit map selection works', () => {
    const views = listRuntimeMapViewsFromPageState(runtimeMultiMapPageState);
    const activeView = selectRuntimeMapViewFromPageState(runtimeMultiMapPageState);
    const explicitView = selectRuntimeMapViewFromPageState(runtimeMultiMapPageState, 'page-main');

    expect(views.map((view) => [view.id, view.active])).toEqual([
      ['page-main', false],
      ['secondary-map', true],
    ]);
    expect(activeView?.id).toBe('secondary-map');
    expect(explicitView?.id).toBe('page-main');
  });

  test('layout ports relationship metadata and document refs survive conversion', () => {
    const snapshot = buildPortableSnapshotFromRuntimePageState({
      pageState: runtimeSingleMapPageState,
      page: runtimePageRecord,
      documents: runtimeDocuments,
    });

    expect(snapshot.layout.view).toEqual({ x: 44, y: -22, scale: 1.1 });
    expect(snapshot.layout.blockLayouts['runtime-core']).toEqual({ x: -80, y: -40, w: 300, h: 160 });
    expect(snapshot.relationships.find((relationship) => relationship.id === 'runtime-rel-core-question')).toMatchObject({
      type: 'causes',
      label: 'asks',
      strength: 4,
      route: 'curve',
      ports: { source: 'right', target: 'left' },
    });
    expect(snapshot.layout.relationshipLayouts?.['runtime-rel-document-core']).toMatchObject({
      route: 'elbow',
      label: 'source for',
      ports: { source: 'right', target: 'left' },
    });
    expect(listPortableDocumentRefs(snapshot).map((document) => document.documentId)).toEqual([
      'doc-runtime-source',
      'doc-unlinked',
    ]);
  });

  test('review attempts and sessions are preserved and filtered by page and map view', () => {
    const review = normalizeRuntimeReviewState({
      review: runtimeSingleMapPageState.data.review,
      pageId: 'runtime-map-page',
      mapViewId: 'page-main',
      cards: runtimeReviewCards,
    });

    expect(review?.cards).toHaveLength(4);
    expect(review?.attempts?.map((attempt) => attempt.id)).toEqual([
      'attempt-main-missed',
      'attempt-main-almost',
      'attempt-main-got-it-no-count',
    ]);
    expect(review?.attempts?.[0]).toMatchObject({
      cardId: 'page-main:block:runtime-core',
      rating: 'missed',
      reviewedAt: '2026-02-03T10:00:00.000Z',
      pageId: 'runtime-map-page',
      mapViewId: 'page-main',
    });
    expect(review?.attempts?.find((attempt) => attempt.id === 'attempt-main-got-it-no-count')?.attemptCount)
      .toBeUndefined();
    expect(review?.metadata?.runtime).toMatchObject({
      droppedAttemptCount: 3,
      droppedAttemptReasons: ['missing-card-id', 'invalid-rating', 'missing-reviewed-at'],
    });
    expect(review?.sessions?.map((session) => session.id)).toEqual(['session-main']);
    expect(review?.sessions?.[0].metadata?.runtime).toMatchObject({
      pageId: 'runtime-map-page',
      mapViewId: 'page-main',
    });
  });

  test('runtime-converted review summary matches portable review helpers', () => {
    const snapshot = buildPortableSnapshotFromRuntimePageState({
      pageState: runtimeSingleMapPageState,
      page: runtimePageRecord,
      documents: runtimeDocuments,
      reviewCards: runtimeReviewCards,
    });
    const summary = getPortableReviewSummary(snapshot.review?.cards ?? [], snapshot.review?.attempts ?? []);

    expect(summary).toEqual({
      totalCards: 4,
      reviewedCards: 3,
      weakCards: 2,
      missedCards: 1,
      almostCards: 1,
      newCards: 1,
      unreviewedCards: 1,
      priorityCards: 3,
    });
  });

  test('runtime final portable snapshot keeps missing attemptCount optional', () => {
    const snapshot = buildPortableSnapshotFromRuntimePageState({
      pageState: runtimeSingleMapPageState,
      page: runtimePageRecord,
      documents: runtimeDocuments,
      reviewCards: runtimeReviewCards,
    });
    const gotItAttempt = snapshot.review?.attempts?.find(
      (attempt) => attempt.id === 'attempt-main-got-it-no-count',
    );

    expect(gotItAttempt).toMatchObject({
      cardId: 'page-main:source:runtime-core',
      rating: 'got-it',
      reviewedAt: '2026-02-03T10:04:00.000Z',
    });
    expect(gotItAttempt?.attemptCount).toBeUndefined();
  });

  test('runtime-converted Review Next queue orders weak cards before new cards', () => {
    const snapshot = buildPortableSnapshotFromRuntimePageState({
      pageState: runtimeSingleMapPageState,
      page: runtimePageRecord,
      documents: runtimeDocuments,
      reviewCards: runtimeReviewCards,
    });
    const queue = buildPortableReviewNextQueue(snapshot.review?.cards ?? [], snapshot.review?.attempts ?? []);

    expect(queue.map((card) => card.id)).toEqual([
      'page-main:block:runtime-core',
      'page-main:relationship:runtime-rel-core-question',
      'page-main:neighbor:runtime-core',
    ]);
    expect(queue.map((card) => card.id)).not.toContain('page-main:source:runtime-core');
  });

  test('unknown runtime metadata is retained without invented timestamps', () => {
    const snapshot = buildPortableSnapshotFromRuntimePageState({
      pageState: runtimeSingleMapPageState,
      pageId: 'runtime-map-page',
      documents: runtimeDocuments,
      metadata: { callerMetadata: 'preserved' },
    });

    expect(snapshot.createdAt).toBe('2026-02-01T10:00:00.000Z');
    expect(snapshot.updatedAt).toBe('2026-02-02T10:00:00.000Z');
    expect(snapshot.metadata).toMatchObject({
      callerMetadata: 'preserved',
      runtime: {
        source: 'runtime-page-state',
        pageStateId: 'page-state-runtime-map-page',
        pageStateKind: 'map-workspace',
        starterHidden: true,
        pageStateMetadata: { preservedPageStateField: 'page-state-metadata' },
        dataMetadata: { preservedDataField: 'data-metadata' },
        workspaceMetadata: { preservedWorkspaceField: 'workspace-metadata' },
      },
    });
    expect(snapshot.blocks[0].createdAt).toBeUndefined();
    expect(snapshot.relationships[0].createdAt).toBeUndefined();
  });

  test('invalid runtime relationship endpoints are reported and excluded after normalization', () => {
    const snapshot = buildPortableSnapshotFromRuntimePageState({
      pageState: runtimeInvalidRelationshipPageState,
      page: runtimePageRecord,
      documents: runtimeDocuments,
    });
    const validation = validatePortableSnapshotShape(snapshot);
    const summary = getRuntimePortableParitySummary({
      pageState: runtimeInvalidRelationshipPageState,
      page: runtimePageRecord,
      documents: runtimeDocuments,
    });

    expect(summary.droppedRelationshipIds).toEqual(['runtime-rel-missing-target']);
    expect(validation.warnings.join('\n')).toContain('runtime-rel-missing-target');
    expect(listPortableRelationshipRefs(snapshot).map((relationship) => relationship.relationshipId)).not.toContain(
      'runtime-rel-missing-target',
    );
  });

  test('workspace-backup-like input converts map page states to a portable bundle', () => {
    const bundle = buildPortableBundleFromRuntimePageStates({
      exportedAt: runtimeWorkspaceBackupFixture.exportedAt,
      pageStates: runtimeWorkspaceBackupFixture.pageStates,
      pages: runtimeWorkspaceBackupFixture.pages,
      documents: runtimeWorkspaceBackupFixture.documents,
      pageDocumentLinks: runtimeWorkspaceBackupFixture.pageDocumentLinks,
      source: {
        app: runtimeWorkspaceBackupFixture.app.name,
        version: runtimeWorkspaceBackupFixture.app.version,
        metadata: { storage: runtimeWorkspaceBackupFixture.storage },
      },
      metadata: { schemaVersion: runtimeWorkspaceBackupFixture.schemaVersion },
    });

    expect(bundle.bundleVersion).toBe('neuro-map-bundle.v1');
    expect(bundle.exportedAt).toBe('2026-02-06T10:00:00.000Z');
    expect(bundle.snapshots).toHaveLength(1);
    expect(bundle.snapshots[0]).toMatchObject({
      pageId: 'runtime-map-page',
      projectId: 'runtime-project',
      mapViewId: 'page-main',
    });
    expect(bundle.snapshots[0].documents?.map((document) => document.documentId)).toEqual([
      'doc-runtime-source',
    ]);
  });

  test('runtime conversion helpers do not mutate source fixtures', () => {
    const before = stableSerialized({
      runtimeSingleMapPageState,
      runtimeMultiMapPageState,
      runtimeWorkspaceBackupFixture,
    });

    buildPortableSnapshotFromRuntimePageState({
      pageState: runtimeSingleMapPageState,
      page: runtimePageRecord,
      documents: runtimeDocuments,
      reviewCards: runtimeReviewCards,
    });
    buildPortableSnapshotsFromRuntimePageState({
      pageState: runtimeMultiMapPageState,
      page: runtimePageRecord,
      documents: runtimeDocuments,
      reviewCards: runtimeReviewCards,
    });
    buildPortableBundleFromRuntimePageStates({
      exportedAt: runtimeWorkspaceBackupFixture.exportedAt,
      pageStates: runtimeWorkspaceBackupFixture.pageStates,
      pages: runtimeWorkspaceBackupFixture.pages,
      documents: runtimeWorkspaceBackupFixture.documents,
      pageDocumentLinks: runtimeWorkspaceBackupFixture.pageDocumentLinks,
      source: {
        app: runtimeWorkspaceBackupFixture.app.name,
        version: runtimeWorkspaceBackupFixture.app.version,
        metadata: { storage: runtimeWorkspaceBackupFixture.storage },
      },
      metadata: { schemaVersion: runtimeWorkspaceBackupFixture.schemaVersion },
    });

    expect(stableSerialized({
      runtimeSingleMapPageState,
      runtimeMultiMapPageState,
      runtimeWorkspaceBackupFixture,
    })).toBe(before);
  });

  test('Accessible Reader graph preview keeps runtime layout outside graph semantics', () => {
    const snapshot = buildPortableSnapshotFromRuntimePageState({
      pageState: runtimeSingleMapPageState,
      page: runtimePageRecord,
      documents: runtimeDocuments,
    });
    const preview = previewAccessibleReaderGraphFromSnapshot(snapshot);

    expect(preview.graph.nodes.find((node) => node.id === 'runtime-core')).toMatchObject({
      label: 'Runtime core idea',
      status: 'confirmed',
    });
    expect(preview.layoutByBlockId['runtime-core']).toEqual({ x: -80, y: -40, w: 300, h: 160 });
    expect(preview.graph.edges.find((edge) => edge.id === 'runtime-rel-core-question')).toMatchObject({
      provenance: 'manual',
      relation_type: 'causes',
      status: 'confirmed',
    });
    expect(preview.relationshipMetadataById['runtime-rel-core-question']).toMatchObject({
      label: 'asks',
      type: 'causes',
      layout: {
        route: 'curve',
        ports: { source: 'right', target: 'left' },
      },
    });
  });

  test('runtime portable helpers stay pure and unwired from browser runtime modules', () => {
    const source = readSource('src/features/learning-map/runtimePortableSnapshot.ts');

    for (const forbiddenMarker of [
      'window.',
      'indexedDB',
      'localStorage',
      'fetch(',
      'mindmap.js',
      'workspace-store.js',
    ]) {
      expect(source).not.toContain(forbiddenMarker);
    }
    expect(source).not.toMatch(/\bdocument\.(body|createElement|getElementById|querySelector|addEventListener)\b/);
  });
});
