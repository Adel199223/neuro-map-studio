import {
  SEED_MAP_PAGE_ID,
  SEED_PROJECT_ID,
  getPageContext,
  getProjectBundle,
  pageRuntimeHref,
  savePageState,
  setCurrentProject,
} from './workspace-store.js';
import {
  DEBUG_INPUT_KEY,
  EDGE_HIT_WIDTH,
  EDGE_HIT_WIDTH_COARSE,
  LONG_PRESS_DELAY,
  LONG_PRESS_MOVE,
  MAP_HISTORY_LIMIT,
  MARQUEE_MIN_SIZE,
  NUDGE_LARGE_STEP,
  NUDGE_STEP,
  PORT_TAP_MOVE,
  RECENT_DRAG_CONTEXTMENU_MS,
  RECENT_LONG_PRESS_MENU_MS,
  REVIEW_CARD_TYPE_LABELS,
  REVIEW_FILTER_LABELS,
  REVIEW_RATING_LABELS,
  REVIEW_SESSION_MODES,
  colors,
  edgeShapes,
  nodeTypes,
  oppositePort,
  portLabels,
  ports,
  relationStyles,
  shapes,
  sizePresets,
} from './mindmapConstants.js';
import {
  clean,
  cloneJson,
  escapeHtml,
  isCanvasGestureBlockedTarget,
  isEditingElement,
  isTouchGesturePointer,
  isTouchLikePointer,
} from './mindmapDomUtils.js';
import {
  clamp,
  distance,
  edgeGeometry,
  marqueeRectFromPoints,
  portPoint,
  rectsOverlap,
} from './mindmapGeometry.js';
import {
  buildReviewNextCards as buildReviewNextCardsFromAttempts,
  buildWeakReviewCards as buildWeakReviewCardsFromAttempts,
  createMapReviewCards,
  filterReviewCards as filterReviewCardsByType,
  latestReviewAttemptsByCard as latestReviewAttemptsByCardFromAttempts,
  normalizeReviewFilter,
  normalizeReviewStore as normalizeReviewStoreData,
  reviewCardCountLabel,
  reviewHistoryText as reviewHistoryTextForData,
  reviewId,
  reviewStats as reviewStatsFromData,
} from './mindmapReviewHelpers.js';
import {
  appendImportedMapPage,
  blankMap,
  blankPageWorkspace,
  buildMapPageStatePayload,
  buildWorkspaceExportPayload,
  cloneDefault,
  loadWorkspaceFallback,
  makePage,
  normalizeMap,
  normalizeWorkspace,
  safeFileName,
  saveWorkspaceMirror,
  scheduleAutosave,
  workspaceFromPageStateData,
} from './mindmapStorageHelpers.js';
import {
  buildInsertBetweenRelationshipPayload,
  changeRelationshipEndpoint,
  createRelationshipDraft,
  findDirectedRelationship,
  isSelfRelationship,
  patchRelationshipPort,
  patchRelationshipRelation,
  patchRelationshipShape,
  patchRelationshipStrength,
  relationshipReviewCleanupCardIds,
  reverseRelationship,
} from './mindmapRelationshipHelpers.js';

(function(){
  'use strict';
  const stage = document.getElementById('stage');
  const world = document.getElementById('world');
  const worldScale = document.getElementById('worldScale');
  const nodeLayer = document.getElementById('nodeLayer');
  const edgeLayer = document.getElementById('edgeLayer');
  const edgeDefs = document.getElementById('edgeDefs');
  const edgeLabelLayer = document.getElementById('edgeLabelLayer');
  const selectionMarquee = document.getElementById('selectionMarquee');
  const menu = document.getElementById('contextMenu');
  const saveStatus = document.getElementById('saveStatus');
  const toast = document.getElementById('toast');
  const inputDebugPanel = document.getElementById('inputDebugPanel');
  const inputDebugSummary = document.getElementById('inputDebugSummary');
  const inputDebugToggle = document.getElementById('inputDebugToggle');
  const inputDebugClear = document.getElementById('inputDebugClear');
  const inputDebugCopy = document.getElementById('inputDebugCopy');
  const inputDebugLog = document.getElementById('inputDebugLog');
  const connectBanner = document.getElementById('connectBanner');
  const connectText = document.getElementById('connectText');
  const cancelConnectButton = document.getElementById('cancelConnect');
  const selectionShelf = document.getElementById('selectionShelf');
  const selectionActions = document.getElementById('selectionActions');
  const selectedTitle = document.getElementById('selectedTitle');
  const selectionLabel = document.getElementById('selectionLabel');
  const shelfToggle = document.getElementById('shelfToggle');
  const shelfAddLinked = document.getElementById('shelfAddLinked');
  const shelfEdit = document.getElementById('shelfEdit');
  const shelfCopy = document.getElementById('shelfCopy');
  const shelfPaste = document.getElementById('shelfPaste');
  const shelfDuplicate = document.getElementById('shelfDuplicate');
  const shelfConnect = document.getElementById('shelfConnect');
  const shelfStyle = document.getElementById('shelfStyle');
  const shelfCenter = document.getElementById('shelfCenter');
  const shelfFocus = document.getElementById('shelfFocus');
  const shelfLabel = document.getElementById('shelfLabel');
  const shelfRelation = document.getElementById('shelfRelation');
  const shelfStrength = document.getElementById('shelfStrength');
  const shelfRoute = document.getElementById('shelfRoute');
  const shelfChangeSource = document.getElementById('shelfChangeSource');
  const shelfChangeTarget = document.getElementById('shelfChangeTarget');
  const shelfInsertBetween = document.getElementById('shelfInsertBetween');
  const shelfFromPort = document.getElementById('shelfFromPort');
  const shelfToPort = document.getElementById('shelfToPort');
  const shelfReverse = document.getElementById('shelfReverse');
  const shelfClear = document.getElementById('shelfClear');
  const shelfDelete = document.getElementById('shelfDelete');
  const promptText = document.getElementById('promptText');
  const legendCard = document.getElementById('legendCard');
  const panelDrawer = document.getElementById('panelDrawer');
  const promptCard = document.getElementById('promptCard');
  const btnReviewMap = document.getElementById('btnReviewMap');
  const reviewPanel = document.getElementById('reviewPanel');
  const reviewProgress = document.getElementById('reviewProgress');
  const reviewHistory = document.getElementById('reviewHistory');
  const reviewLauncher = document.getElementById('reviewLauncher');
  const reviewLauncherTitle = document.getElementById('reviewLauncherTitle');
  const reviewFilterOptions = document.getElementById('reviewFilterOptions');
  const reviewFilterState = document.getElementById('reviewFilterState');
  const reviewStart = document.getElementById('reviewStart');
  const reviewStartNext = document.getElementById('reviewStartNext');
  const reviewStartWeak = document.getElementById('reviewStartWeak');
  const reviewNextState = document.getElementById('reviewNextState');
  const reviewWeakState = document.getElementById('reviewWeakState');
  const reviewEmpty = document.getElementById('reviewEmpty');
  const reviewEmptyText = document.getElementById('reviewEmptyText');
  const reviewCard = document.getElementById('reviewCard');
  const reviewCardType = document.getElementById('reviewCardType');
  const reviewPrompt = document.getElementById('reviewPrompt');
  const reviewLeakHint = document.getElementById('reviewLeakHint');
  const reviewAnswer = document.getElementById('reviewAnswer');
  const reviewReveal = document.getElementById('reviewReveal');
  const reviewRatings = document.getElementById('reviewRatings');
  const reviewSummary = document.getElementById('reviewSummary');
  const reviewSummaryTitle = document.getElementById('reviewSummaryTitle');
  const reviewSummaryReviewed = document.getElementById('reviewSummaryReviewed');
  const reviewSummaryGotIt = document.getElementById('reviewSummaryGotIt');
  const reviewSummaryAlmost = document.getElementById('reviewSummaryAlmost');
  const reviewSummaryMissed = document.getElementById('reviewSummaryMissed');
  const reviewRestart = document.getElementById('reviewRestart');
  const reviewExit = document.getElementById('reviewExit');
  const reviewExitSummary = document.getElementById('reviewExitSummary');
  const btnRememberPanel = document.getElementById('btnRememberPanel');
  const btnVisualPanel = document.getElementById('btnVisualPanel');
  const btnClosePanel = document.getElementById('btnClosePanel');
  const zoomPercent = document.getElementById('btnZoomPercent');
  const zoomDock = document.getElementById('zoomDock');
  const btnUndo = document.getElementById('btnUndo');
  const btnRedo = document.getElementById('btnRedo');
  const btnMultiSelect = document.getElementById('btnMultiSelect');
  const pageSelect = document.getElementById('pageSelect');
  const btnNewPage = document.getElementById('btnNewPage');
  const btnPageMenu = document.getElementById('btnPageMenu');
  const btnDuplicatePage = document.getElementById('btnDuplicatePage');
  const btnRenamePage = document.getElementById('btnRenamePage');
  const btnDeletePage = document.getElementById('btnDeletePage');
  const importFileInput = document.getElementById('importFile');
  const documentPicker = document.getElementById('documentPicker');
  const documentPickerList = document.getElementById('documentPickerList');
  const documentPickerClose = document.getElementById('documentPickerClose');
  const documentDetailCard = document.getElementById('documentDetailCard');
  const documentDetailTitle = document.getElementById('documentDetailTitle');
  const documentDetailMeta = document.getElementById('documentDetailMeta');
  const documentDetailDescription = document.getElementById('documentDetailDescription');
  const documentDetailClose = document.getElementById('documentDetailClose');
  const mapStarterPanel = document.getElementById('mapStarterPanel');
  const starterAddQuestion = document.getElementById('starterAddQuestion');
  const starterAddEvidence = document.getElementById('starterAddEvidence');
  const starterAddDocument = document.getElementById('starterAddDocument');
  const starterHide = document.getElementById('starterHide');
  const starterDocumentHint = document.getElementById('starterDocumentHint');
  const mapWorkbench = document.getElementById('mapWorkbench');
  const btnWorkbenchToggle = document.getElementById('btnWorkbenchToggle');
  const btnWorkbenchClose = document.getElementById('btnWorkbenchClose');
  const workbenchDrawer = document.getElementById('workbenchDrawer');
  const workbenchAddConcept = document.getElementById('workbenchAddConcept');
  const workbenchAddQuestion = document.getElementById('workbenchAddQuestion');
  const workbenchAddEvidence = document.getElementById('workbenchAddEvidence');
  const workbenchAddDocument = document.getElementById('workbenchAddDocument');
  const workbenchDocumentList = document.getElementById('workbenchDocumentList');
  const placementOverlay = document.getElementById('placementOverlay');
  const placementText = document.getElementById('placementText');
  const placementCancel = document.getElementById('placementCancel');
  const placementGhost = document.getElementById('placementGhost');
  const projectBackLink = document.getElementById('projectBackLink');
  const lessonBackLink = document.getElementById('lessonBackLink');
  const projectKicker = document.getElementById('projectKicker');
  const mapPageTitle = document.getElementById('mapPageTitle');

  const runtimeParams = new URLSearchParams(window.location.search);
  const runtimePageId = runtimeParams.get('pageId') || SEED_MAP_PAGE_ID;
  const cssZoomOK = !!(document.documentElement && 'zoom' in document.documentElement.style);

  let workspace = loadWorkspaceFallback(localStorage);
  let data = activePage().map;
  let view = Object.assign({x:0,y:0,scale:1}, data.view || {});
  let selectedId = data.nodes.some(n => n.id === 'core') ? 'core' : (data.nodes[0]?.id || null);
  let selectedEdgeId = null;
  const selectedNodeIds = new Set(selectedId ? [selectedId] : []);
  const selectedEdgeIds = new Set();
  let dragNode = null;
  let resizeNode = null;
  let panDrag = null;
  let marqueeSelection = null;
  let saveTimer = null;
  let menuContext = null;
  let connectFrom = null;
  let zoomDockPassThroughTimer = null;
  let focusMode = false;
  let reconnectTarget = null;
  let wheelTimer = null;
  let activePanel = null;
  let shelfCollapsed = false;
  let pendingEdgeDeleteId = null;
  let suppressSelectionShelf = false;
  let selectionShelfShown = false;
  let longPressState = null;
  const activeTouchPoints = new Map();
  let touchGesture = null;
  const pointerGestureOwners = new Map();
  const gestureLockReasons = new Set();
  let recentLongPressMenu = null;
  let dragInteractionState = null;
  let projectDocuments = [];
  let pendingDocumentBlockPoint = null;
  let pendingDocumentQuickAdd = null;
  let pendingRelationshipInsert = null;
  let runtimePageRecord = null;
  let runtimeProject = null;
  let runtimeProjectPages = [];
  let runtimePageInitialized = false;
  let starterHidden = false;
  let workbenchOpen = false;
  let workbenchUserToggled = false;
  let pendingPlacement = null;
  let suppressNextPlacementClick = false;
  let activePortTap = null;
  let suppressedPortClick = null;
  let activeConnectTargetTap = null;
  let suppressedConnectClick = null;
  let activePortMenuButton = null;
  let multiSelectMode = false;
  let mapClipboard = null;
  let textEditState = null;
  let reviewDeepLinkHandled = false;
  const mapHistory = {undo:[], redo:[]};
  let reviewStore = {version:1, attempts:[], sessions:[]};
  const reviewMode = {
    active:false,
    cards:[],
    index:0,
    revealed:false,
    mode:'normal',
    selectedFilter:'all',
    session:null,
    highlightNodeIds:new Set(),
    highlightEdgeIds:new Set(),
    maskNodeBodyIds:new Set(),
    maskNodeAllContentIds:new Set(),
    maskEdgeLabelIds:new Set()
  };

  const inputDebugState = {
    enabled: (() => {
      try{
        const params = new URLSearchParams(window.location.search);
        if(params.get('debugInput') === '1') return true;
      }catch(e){}
      try{
        return localStorage.getItem(DEBUG_INPUT_KEY) === '1';
      }catch(e){
        return false;
      }
    })(),
    collapsed: true,
    entries: [],
    maxEntries: 150,
    lastPointer: null
  };

  function formatDebugNumber(value, digits=2){
    if(typeof value !== 'number' || !Number.isFinite(value)) return '';
    return Number(value.toFixed(digits)).toString();
  }
  function describeDebugTarget(target){
    const el = target instanceof Element ? target : null;
    if(!el) return '';
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : '';
    const classes = Array.from(el.classList || []).filter(Boolean).slice(0, 3).map(name => `.${name}`).join('');
    const attrs = [];
    if(el.dataset?.action) attrs.push(`action=${el.dataset.action}`);
    if(el.dataset?.field) attrs.push(`field=${el.dataset.field}`);
    if(el.hasAttribute('contenteditable')) attrs.push('editable');
    return [tag + id + classes, attrs.join(' ')].filter(Boolean).join(' ');
  }
  function getDebugPointerMeta(source, fallback=inputDebugState.lastPointer){
    if(!source) return fallback ? {...fallback} : {};
    const meta = {};
    if(typeof source.pointerType === 'string' && source.pointerType) meta.pointerType = source.pointerType;
    if(Number.isFinite(source.pointerId)) meta.pointerId = source.pointerId;
    if(Number.isFinite(source.buttons)) meta.buttons = source.buttons;
    if(typeof source.pressure === 'number') meta.pressure = Number(source.pressure.toFixed(2));
    if(typeof source.tiltX === 'number') meta.tiltX = source.tiltX;
    if(typeof source.tiltY === 'number') meta.tiltY = source.tiltY;
    return Object.keys(meta).length ? meta : (fallback ? {...fallback} : {});
  }
  function rememberDebugPointer(source){
    if(!inputDebugState.enabled) return;
    const meta = getDebugPointerMeta(source, null);
    if(Object.keys(meta).length) inputDebugState.lastPointer = meta;
  }
  function formatDebugEntry(entry){
    const parts = [entry.time, entry.action];
    const pointerBits = [];
    if(entry.pointerType) pointerBits.push(entry.pointerType);
    if(entry.pointerId !== '') pointerBits.push(`#${entry.pointerId}`);
    if(entry.buttons !== '') pointerBits.push(`buttons=${entry.buttons}`);
    if(entry.pressure !== '') pointerBits.push(`pressure=${entry.pressure}`);
    if(entry.tiltX !== '' || entry.tiltY !== ''){
      pointerBits.push(`tilt=${entry.tiltX !== '' ? entry.tiltX : '?'}:${entry.tiltY !== '' ? entry.tiltY : '?'}`);
    }
    if(pointerBits.length) parts.push(pointerBits.join(' '));
    if(entry.mode) parts.push(`mode=${entry.mode}`);
    if(entry.reason) parts.push(`reason=${entry.reason}`);
    if(entry.target) parts.push(`target=${entry.target}`);
    if(entry.detail) parts.push(entry.detail);
    return parts.join(' | ');
  }
  function getDebugDetail(details={}){
    const bits = [];
    if(details.edgeId) bits.push(`edge=${details.edgeId}`);
    if(details.hitKind) bits.push(`hit=${details.hitKind}`);
    if(details.suppressed) bits.push(`suppressed=${details.suppressed}`);
    return bits.join(' ');
  }
  function updateInputDebugUI(){
    if(!inputDebugState.enabled){
      inputDebugPanel.hidden = true;
      updateOverlayOffsets();
      return;
    }
    inputDebugPanel.hidden = false;
    inputDebugPanel.classList.toggle('collapsed', inputDebugState.collapsed);
    inputDebugToggle.textContent = inputDebugState.collapsed ? '▸' : '▾';
    inputDebugToggle.title = inputDebugState.collapsed ? 'Expand input diagnostics' : 'Collapse input diagnostics';
    inputDebugToggle.setAttribute('aria-label', inputDebugToggle.title);
    inputDebugSummary.textContent = inputDebugState.entries.length
      ? `${inputDebugState.entries.length}/${inputDebugState.maxEntries} recent interactions`
      : 'Interaction metadata only';
    inputDebugLog.textContent = inputDebugState.entries.length
      ? inputDebugState.entries.map(formatDebugEntry).join('\n')
      : 'No recent input yet.';
    inputDebugClear.disabled = inputDebugState.entries.length === 0;
    inputDebugCopy.disabled = inputDebugState.entries.length === 0;
    updateOverlayOffsets();
  }
  function logInputDebug(action, source=null, details={}){
    if(!inputDebugState.enabled) return;
    const meta = getDebugPointerMeta(source, inputDebugState.lastPointer);
    if(Object.keys(meta).length) inputDebugState.lastPointer = meta;
    const entry = {
      time: new Date().toISOString().slice(11, 23),
      action,
      pointerType: meta.pointerType || '',
      pointerId: Number.isFinite(meta.pointerId) ? meta.pointerId : '',
      buttons: Number.isFinite(meta.buttons) ? meta.buttons : '',
      pressure: formatDebugNumber(meta.pressure),
      tiltX: Number.isFinite(meta.tiltX) ? meta.tiltX : '',
      tiltY: Number.isFinite(meta.tiltY) ? meta.tiltY : '',
      mode: details.mode || '',
      reason: details.reason || '',
      target: details.targetSummary || describeDebugTarget(details.target || source?.target),
      detail: getDebugDetail(details)
    };
    inputDebugState.entries.unshift(entry);
    if(inputDebugState.entries.length > inputDebugState.maxEntries) inputDebugState.entries.length = inputDebugState.maxEntries;
    updateInputDebugUI();
  }
  function getPointerId(source){
    return Number.isFinite(source?.pointerId) ? source.pointerId : null;
  }
  function setPointerGestureOwner(pointerId, owner){
    if(!Number.isFinite(pointerId)) return;
    pointerGestureOwners.set(pointerId, owner);
  }
  function getPointerGestureOwner(pointerId){
    if(!Number.isFinite(pointerId)) return null;
    return pointerGestureOwners.get(pointerId) || null;
  }
  function clearPointerGestureOwner(pointerId){
    if(!Number.isFinite(pointerId)) return;
    pointerGestureOwners.delete(pointerId);
  }
  function noteRecentLongPressMenu(source, context){
    recentLongPressMenu = {
      pointerId:getPointerId(source),
      openedAt:Date.now(),
      mode:context?.type || '',
      itemId:context?.id || '',
      edgeId:context?.type === 'edge' ? context?.id : '',
      hitKind:context?.hitKind || ''
    };
  }
  function shouldSuppressRecentContextMenu(source, target=null, extraDetails={}){
    if(!recentLongPressMenu) return false;
    if(Date.now() - recentLongPressMenu.openedAt > RECENT_LONG_PRESS_MENU_MS) return false;
    const pointerId = getPointerId(source);
    const sourceTarget = source?.target instanceof Element ? source.target : null;
    const targetEl = target instanceof Element ? target : sourceTarget;
    if(sourceTarget?.closest?.('.menu') && menu.classList.contains('show')) return true;
    if(pointerId !== null && recentLongPressMenu.pointerId !== null){
      if(pointerId === recentLongPressMenu.pointerId) return true;
      if(recentLongPressMenu.mode === 'node'){
        const nodeTarget = sourceTarget?.closest?.('.map-node') || targetEl?.closest?.('.map-node');
        if(nodeTarget?.dataset?.id === recentLongPressMenu.itemId) return true;
      }
      if(recentLongPressMenu.mode === 'edge'){
        const edgeId = extraDetails.edgeId || sourceTarget?.closest?.('[data-edge-id]')?.dataset?.edgeId || targetEl?.closest?.('[data-edge-id]')?.dataset?.edgeId || '';
        if(edgeId && edgeId === (recentLongPressMenu.edgeId || recentLongPressMenu.itemId)) return true;
      }
      return false;
    }
    return true;
  }
  function suppressRecentContextMenu(source, mode, target, extraDetails={}){
    if(!shouldSuppressRecentContextMenu(source, target, extraDetails)) return false;
    source.preventDefault?.();
    source.stopPropagation?.();
    logInputDebug('contextmenu-suppressed', source, {
      mode,
      reason:'recent-long-press',
      target,
      edgeId:extraDetails.edgeId || recentLongPressMenu?.edgeId || '',
      hitKind:extraDetails.hitKind || recentLongPressMenu?.hitKind || '',
      suppressed:'native-contextmenu'
    });
    return true;
  }
  async function copyInputDebugEntries(){
    if(!inputDebugState.entries.length) return;
    const text = inputDebugState.entries.map(formatDebugEntry).join('\n');
    try{
      if(navigator.clipboard?.writeText){
        await navigator.clipboard.writeText(text);
      }else{
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', 'true');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      showToast('Copied input diagnostics');
    }catch(e){
      showToast('Could not copy diagnostics');
    }
  }

  function activePage(){
    if(!workspace.pages.length) workspace.pages.push({id:'page-main', title:'Debt-power map', map: cloneDefault()});
    let p = workspace.pages.find(x => x.id === workspace.activePageId);
    if(!p){ p = workspace.pages[0]; workspace.activePageId = p.id; }
    return p;
  }
  function syncCurrentPage(){
    const p = workspace.pages.find(x => x.id === workspace.activePageId);
    if(p){ data.view = view; p.map = data; }
  }
  async function persistWorkspaceState(msg='Saved'){
    try{
      const statePayload = mapPageStatePayload();
      if(runtimePageId === SEED_MAP_PAGE_ID){
        saveWorkspaceMirror(localStorage, workspace);
      }
      if(runtimePageInitialized && runtimePageId){
        await savePageState(runtimePageId, 'map', statePayload);
      }
      setStatus(msg);
      renderPageControls();
    }catch(e){
      setStatus('Could not save');
    }
  }
  function save(msg='Saved'){
    saveTimer = scheduleAutosave(saveTimer, () => {
      void persistWorkspaceState(msg);
    }, {delay:140});
  }
  function setStatus(text){ saveStatus.textContent = text; }
  function showToast(text){
    setStatus(text);
    toast.textContent = text;
    toast.classList.add('show');
    updateOverlayOffsets();
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => {
      toast.classList.remove('show');
      updateOverlayOffsets();
    }, 1600);
  }
  function documentById(documentId){ return projectDocuments.find(document => document.id === documentId) || null; }
  function normalizeReviewStore(value={}){
    return normalizeReviewStoreData(value, {fallbackPageId:runtimePageId || ''});
  }
  function mapPageStatePayload(){
    syncCurrentPage();
    return buildMapPageStatePayload({
      workspace,
      starterHidden,
      review:normalizeReviewStore(reviewStore)
    });
  }
  function currentMapViewId(){ return String(workspace.activePageId || activePage().id || 'page-main'); }
  function currentReviewAttempts(){
    const mapViewId = currentMapViewId();
    return reviewStore.attempts.filter(attempt => attempt.pageId === runtimePageId && attempt.mapViewId === mapViewId);
  }
  function currentReviewSessions(){
    const mapViewId = currentMapViewId();
    return reviewStore.sessions.filter(session => session.pageId === runtimePageId && session.mapViewId === mapViewId);
  }
  function relationshipReviewCardId(edgeId){
    return relationshipReviewCleanupCardIds(currentMapViewId(), edgeId)[0];
  }
  function clearRelationshipReviewAttempts(edgeId){
    const mapViewId = currentMapViewId();
    const cleanupCardIds = new Set(relationshipReviewCleanupCardIds(mapViewId, edgeId));
    reviewStore.attempts = reviewStore.attempts.filter(attempt => !(attempt.pageId === runtimePageId && attempt.mapViewId === mapViewId && cleanupCardIds.has(attempt.cardId)));
  }
  function latestReviewAttemptsByCard(cardIds=null){
    return latestReviewAttemptsByCardFromAttempts(currentReviewAttempts(), cardIds);
  }
  function filterReviewCards(cards, filter=reviewMode.selectedFilter){
    return filterReviewCardsByType(cards, filter);
  }
  function buildWeakReviewCards(cards){
    return buildWeakReviewCardsFromAttempts(cards, currentReviewAttempts());
  }
  function buildReviewNextCards(cards){
    return buildReviewNextCardsFromAttempts(cards, currentReviewAttempts());
  }
  function reviewStats(cards=generateReviewCards()){
    return reviewStatsFromData(cards, currentReviewAttempts(), currentReviewSessions());
  }
  function reviewHistoryText(cards=generateReviewCards()){
    return reviewHistoryTextForData(cards, currentReviewAttempts(), currentReviewSessions());
  }
  async function saveReviewState(){
    if(!runtimePageInitialized || !runtimePageId) return null;
    try{
      const state = await savePageState(runtimePageId, 'map', mapPageStatePayload());
      setStatus('Review saved locally');
      return state;
    }catch(error){
      setStatus('Could not save review');
      return null;
    }
  }
  function generateReviewCards(){
    return createMapReviewCards({
      mapViewId:currentMapViewId(),
      nodes:data.nodes,
      edges:data.edges,
      documents:projectDocuments,
      hasNode:nodeId => !!byId(nodeId),
      hasEdge:edgeId => !!edgeById(edgeId)
    });
  }
  function clearReviewHighlights(){
    reviewMode.highlightNodeIds.clear();
    reviewMode.highlightEdgeIds.clear();
    reviewMode.maskNodeBodyIds.clear();
    reviewMode.maskNodeAllContentIds.clear();
    reviewMode.maskEdgeLabelIds.clear();
    applyReviewHighlights();
  }
  function setReviewVisualState(card){
    const state = reviewMode.revealed ? card?.postReveal : card?.preReveal;
    reviewMode.highlightNodeIds = new Set(state?.highlight?.nodes || []);
    reviewMode.highlightEdgeIds = new Set(state?.highlight?.edges || []);
    reviewMode.maskNodeBodyIds = new Set(state?.mask?.nodeBodies || []);
    reviewMode.maskNodeAllContentIds = new Set(state?.mask?.nodeAllContent || []);
    reviewMode.maskEdgeLabelIds = new Set(state?.mask?.edgeLabels || []);
    applyReviewHighlights();
  }
  function applyReviewHighlights(){
    nodeLayer.querySelectorAll('.map-node.review-highlight,.map-node.review-answer-hidden,.map-node.review-source-hidden').forEach(el => {
      el.classList.remove('review-highlight', 'review-answer-hidden', 'review-source-hidden');
    });
    edgeLayer.querySelectorAll('.edge.review-highlight').forEach(el => el.classList.remove('review-highlight'));
    edgeLabelLayer.querySelectorAll('.edge-label.review-highlight,.edge-label.review-label-hidden').forEach(el => {
      el.classList.remove('review-highlight', 'review-label-hidden');
    });
    if(!reviewMode.active) return;
    reviewMode.maskNodeBodyIds.forEach(nodeId => {
      const el = nodeLayer.querySelector(`.map-node[data-id="${CSS.escape(nodeId)}"]`);
      if(el) el.classList.add('review-answer-hidden');
    });
    reviewMode.maskNodeAllContentIds.forEach(nodeId => {
      const el = nodeLayer.querySelector(`.map-node[data-id="${CSS.escape(nodeId)}"]`);
      if(el) el.classList.add('review-source-hidden');
    });
    reviewMode.maskEdgeLabelIds.forEach(edgeId => {
      const label = edgeLabelLayer.querySelector(`.edge-label[data-edge-id="${CSS.escape(edgeId)}"]`);
      if(label) label.classList.add('review-label-hidden');
    });
    reviewMode.highlightNodeIds.forEach(nodeId => {
      const el = nodeLayer.querySelector(`.map-node[data-id="${CSS.escape(nodeId)}"]`);
      if(el){
        el.classList.add('review-highlight');
        el.classList.remove('dimmed');
      }
    });
    reviewMode.highlightEdgeIds.forEach(edgeId => {
      edgeLayer.querySelectorAll(`g.edge-group[data-edge-id="${CSS.escape(edgeId)}"] .edge`).forEach(el => {
        el.classList.add('review-highlight');
        el.classList.remove('dimmed');
      });
      const label = edgeLabelLayer.querySelector(`.edge-label[data-edge-id="${CSS.escape(edgeId)}"]`);
      if(label){
        label.classList.add('review-highlight');
        label.classList.remove('dimmed');
      }
    });
  }
  function currentReviewCard(){
    if(!reviewMode.active || !reviewMode.session || reviewMode.session.completed || !reviewMode.cards.length) return null;
    return reviewMode.cards[reviewMode.index] || null;
  }
  function updateReviewFilterControls(){
    const selected = normalizeReviewFilter(reviewMode.selectedFilter);
    reviewFilterOptions?.querySelectorAll('button[data-review-filter]').forEach(button => {
      const active = button.dataset.reviewFilter === selected;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }
  function prepareReviewPanelForUse(){
    closeMenu();
    closeSidePanel();
    cancelPlacementMode('review');
    if(isBlockTargetingActive()) cancelBlockTargeting();
    setWorkbenchOpen(false, {user:false});
    setSelectionShelfSuppressed(true, 'review-open');
  }
  function renderReviewLauncher(allCards){
    const selectedFilter = normalizeReviewFilter(reviewMode.selectedFilter);
    reviewMode.selectedFilter = selectedFilter;
    const filteredCards = filterReviewCards(allCards, selectedFilter);
    const weakCards = buildWeakReviewCards(filteredCards);
    const nextCards = buildReviewNextCards(filteredCards);
    const stats = reviewStats(allCards);
    updateReviewFilterControls();
    reviewLauncher.hidden = false;
    reviewCard.hidden = true;
    reviewSummary.hidden = true;
    if(reviewLeakHint) reviewLeakHint.hidden = true;
    reviewProgress.textContent = 'Ready to review';
    reviewLauncherTitle.textContent = 'Choose a review session.';
    if(selectedFilter === 'all'){
      reviewFilterState.textContent = `${reviewCardCountLabel(filteredCards.length)} in All.`;
    }else{
      reviewFilterState.textContent = `${reviewCardCountLabel(filteredCards.length)} for ${REVIEW_FILTER_LABELS[selectedFilter]}.`;
    }
    const hasCards = filteredCards.length > 0;
    reviewStart.disabled = !hasCards;
    reviewStart.title = hasCards ? 'Start reviewing cards from this map' : 'No cards match this filter';
    reviewStartNext.disabled = nextCards.length === 0;
    reviewStartNext.textContent = nextCards.length ? `Review next (${nextCards.length})` : 'Review next';
    reviewStartNext.title = nextCards.length ? 'Review Missed, Almost, then new cards' : 'Nothing urgent to review next';
    reviewNextState.hidden = false;
    if(nextCards.length){
      const filteredStats = reviewStats(filteredCards);
      reviewNextState.textContent = `${filteredStats.missedCards} missed · ${filteredStats.almostCards} almost · ${filteredStats.unreviewedCards} new.`;
    }else{
      reviewNextState.textContent = 'Nothing urgent. Review any card or add more map content.';
    }
    reviewStartWeak.disabled = weakCards.length === 0;
    reviewStartWeak.textContent = weakCards.length ? `Review weak cards (${weakCards.length})` : 'Review weak cards';
    reviewStartWeak.title = weakCards.length ? 'Review cards last rated Missed or Almost' : 'No weak cards are available';
    reviewWeakState.hidden = false;
    if(weakCards.length){
      reviewWeakState.textContent = `${reviewCardCountLabel(weakCards.length)} last rated Missed or Almost.`;
    }else if(!stats.reviewedCards){
      reviewWeakState.textContent = 'No weak cards yet. Review this map first.';
    }else{
      reviewWeakState.textContent = selectedFilter === 'all' ? 'No weak cards right now.' : 'No weak cards match this filter.';
    }
    if(!allCards.length){
      reviewEmptyText.textContent = 'Add a few blocks with explanations or relationship labels to review this map.';
      reviewEmpty.hidden = false;
    }else if(!filteredCards.length){
      reviewEmptyText.textContent = 'No cards match this filter yet.';
      reviewEmpty.hidden = false;
    }else if(!nextCards.length && reviewStart.disabled && reviewStartWeak.disabled){
      reviewEmptyText.textContent = 'Nothing urgent. Review any card or add more map content.';
      reviewEmpty.hidden = false;
    }else{
      reviewEmpty.hidden = true;
    }
    clearReviewHighlights();
  }
  function renderReviewPanel(){
    if(!reviewMode.active){
      reviewPanel.hidden = true;
      btnReviewMap?.classList.remove('active');
      if(reviewLeakHint) reviewLeakHint.hidden = true;
      clearReviewHighlights();
      return;
    }
    reviewPanel.hidden = false;
    btnReviewMap?.classList.add('active');
    const allCards = generateReviewCards();
    reviewHistory.textContent = reviewHistoryText(allCards);
    if(!reviewMode.session){
      renderReviewLauncher(allCards);
      return;
    }
    if(reviewMode.session?.completed){
      reviewProgress.textContent = reviewMode.mode === 'weak' ? 'Weak-card review complete' : (reviewMode.mode === 'next' ? 'Review next complete' : 'Review complete');
      reviewLauncher.hidden = true;
      reviewEmpty.hidden = true;
      reviewCard.hidden = true;
      reviewSummary.hidden = false;
      if(reviewLeakHint) reviewLeakHint.hidden = true;
      reviewSummaryTitle.textContent = reviewMode.mode === 'weak' ? 'Weak-card session summary' : (reviewMode.mode === 'next' ? 'Review next session summary' : 'Session summary');
      reviewSummaryReviewed.textContent = String(reviewMode.session.reviewedCount);
      reviewSummaryGotIt.textContent = String(reviewMode.session.gotIt);
      reviewSummaryAlmost.textContent = String(reviewMode.session.almost);
      reviewSummaryMissed.textContent = String(reviewMode.session.missed);
      clearReviewHighlights();
      reviewRestart?.focus();
      return;
    }
    const card = currentReviewCard();
    if(!card){
      reviewMode.session = null;
      renderReviewLauncher(allCards);
      return;
    }
    const modePrefix = reviewMode.mode === 'weak' ? 'Weak cards · ' : (reviewMode.mode === 'next' ? 'Review next · ' : '');
    reviewProgress.textContent = `${modePrefix}${reviewMode.index + 1} of ${reviewMode.cards.length}`;
    reviewLauncher.hidden = true;
    reviewEmpty.hidden = true;
    reviewCard.hidden = false;
    reviewSummary.hidden = true;
    reviewCard.dataset.cardType = card.type;
    reviewCard.dataset.sessionMode = reviewMode.mode;
    reviewCardType.textContent = REVIEW_CARD_TYPE_LABELS[card.type] || 'Review card';
    reviewPrompt.textContent = card.prompt;
    reviewAnswer.hidden = !reviewMode.revealed;
    reviewAnswer.textContent = reviewMode.revealed ? card.answer : '';
    if(reviewLeakHint) reviewLeakHint.hidden = reviewMode.revealed;
    reviewReveal.hidden = reviewMode.revealed;
    reviewRatings.hidden = !reviewMode.revealed;
    setReviewVisualState(card);
  }
  function openReviewLauncher(){
    reviewMode.active = true;
    reviewMode.cards = [];
    reviewMode.index = 0;
    reviewMode.revealed = false;
    reviewMode.mode = 'normal';
    reviewMode.session = null;
    prepareReviewPanelForUse();
    renderReviewPanel();
    setStatus('Choose review session');
    requestAnimationFrame(() => {
      if(!reviewStart?.disabled) reviewStart?.focus();
      else reviewExit?.focus();
    });
  }
  function requestedReviewModeFromUrl(){
    const value = clean(runtimeParams.get('review') || '').toLowerCase();
    if(['1', 'true', 'yes', 'normal', 'map'].includes(value)) return 'normal';
    if(value === 'weak') return 'weak';
    if(value === 'next') return 'next';
    return '';
  }
  function launchReviewFromUrl(){
    if(reviewDeepLinkHandled) return;
    reviewDeepLinkHandled = true;
    const requestedMode = requestedReviewModeFromUrl();
    if(requestedMode === 'weak' || requestedMode === 'next'){
      startReviewSession(requestedMode);
    }else if(requestedMode === 'normal'){
      openReviewLauncher();
    }
  }
  function startReviewSession(mode='normal'){
    const selectedMode = REVIEW_SESSION_MODES.has(mode) ? mode : 'normal';
    const selectedFilter = normalizeReviewFilter(reviewMode.selectedFilter);
    const allCards = generateReviewCards();
    const filteredCards = filterReviewCards(allCards, selectedFilter);
    const cards = selectedMode === 'weak'
      ? buildWeakReviewCards(filteredCards)
      : (selectedMode === 'next' ? buildReviewNextCards(filteredCards) : filteredCards);
    reviewMode.active = true;
    reviewMode.cards = cards;
    reviewMode.index = 0;
    reviewMode.revealed = false;
    reviewMode.mode = selectedMode;
    reviewMode.selectedFilter = selectedFilter;
    if(!cards.length){
      reviewMode.session = null;
      prepareReviewPanelForUse();
      renderReviewPanel();
      setStatus(selectedMode === 'weak' ? 'No weak cards yet' : (selectedMode === 'next' ? 'Nothing urgent to review next' : 'No review cards match'));
      requestAnimationFrame(() => reviewExit?.focus());
      return;
    }
    reviewMode.session = {
      id:reviewId('review-session'),
      pageId:runtimePageId,
      mapViewId:currentMapViewId(),
      startedAt:new Date().toISOString(),
      completedAt:'',
      reviewedCount:0,
      gotIt:0,
      almost:0,
      missed:0,
      cardIds:cards.map(card => card.id),
      mode:selectedMode,
      filter:selectedFilter,
      completed:false
    };
    prepareReviewPanelForUse();
    renderReviewPanel();
    setStatus(selectedMode === 'weak' ? 'Weak cards ready' : (selectedMode === 'next' ? 'Review next ready' : 'Review ready'));
    requestAnimationFrame(() => {
      reviewReveal?.focus();
    });
  }
  function exitReviewMode(reason='exit'){
    if(!reviewMode.active) return;
    reviewMode.active = false;
    reviewMode.cards = [];
    reviewMode.index = 0;
    reviewMode.revealed = false;
    reviewMode.mode = 'normal';
    reviewMode.session = null;
    reviewPanel.hidden = true;
    if(reviewLeakHint) reviewLeakHint.hidden = true;
    btnReviewMap?.classList.remove('active');
    clearReviewHighlights();
    setSelectionShelfSuppressed(false, 'review-exit');
    setStatus(reason === 'escape' ? 'Review closed' : 'Map ready');
    if(reason !== 'summary-exit') btnReviewMap?.focus();
  }
  function revealCurrentReviewCard(){
    if(!currentReviewCard()) return;
    reviewMode.revealed = true;
    renderReviewPanel();
    requestAnimationFrame(() => reviewRatings?.querySelector('button')?.focus());
  }
  function completeReviewSession(){
    const session = reviewMode.session;
    if(!session || session.completed) return;
    session.completed = true;
    session.completedAt = new Date().toISOString();
    reviewStore.sessions.push({
      id:session.id,
      pageId:session.pageId,
      mapViewId:session.mapViewId,
      startedAt:session.startedAt,
      completedAt:session.completedAt,
      reviewedCount:session.reviewedCount,
      gotIt:session.gotIt,
      almost:session.almost,
      missed:session.missed,
      cardIds:session.cardIds,
      mode:session.mode || 'normal',
      filter:session.filter || 'all'
    });
  }
  function rateCurrentReviewCard(rating){
    const card = currentReviewCard();
    if(!card || !REVIEW_RATING_LABELS[rating] || !reviewMode.session) return;
    const previousAttemptCount = reviewStore.attempts.filter(attempt =>
      attempt.cardId === card.id &&
      attempt.pageId === runtimePageId &&
      attempt.mapViewId === currentMapViewId()
    ).length;
    reviewStore.attempts.push({
      id:reviewId('review-attempt'),
      cardId:card.id,
      pageId:runtimePageId,
      mapViewId:currentMapViewId(),
      cardType:card.type,
      rating,
      reviewedAt:new Date().toISOString(),
      attemptCount:previousAttemptCount + 1
    });
    reviewMode.session.reviewedCount += 1;
    if(rating === 'got-it') reviewMode.session.gotIt += 1;
    else if(rating === 'almost') reviewMode.session.almost += 1;
    else reviewMode.session.missed += 1;
    if(reviewMode.index >= reviewMode.cards.length - 1){
      completeReviewSession();
    }else{
      reviewMode.index += 1;
      reviewMode.revealed = false;
    }
    void saveReviewState();
    renderReviewPanel();
    if(!reviewMode.session.completed){
      requestAnimationFrame(() => reviewReveal?.focus());
    }
  }
  async function refreshProjectDocuments(){
    let documents = [];
    try{
      const bundle = await getProjectBundle(runtimeProject?.id || SEED_PROJECT_ID);
      documents = bundle.documents || [];
    }catch(error){
      documents = [];
    }
    projectDocuments = documents;
    renderDocumentPicker();
    renderWorkbenchDocuments();
    render();
  }
  function updateRuntimeChrome(){
    if(runtimeProject?.id){
      projectBackLink.href = `project.html?projectId=${encodeURIComponent(runtimeProject.id)}`;
      const fullContext = `Neuro Map Studio · Project: ${runtimeProject.title} · Page: Editable map`;
      projectKicker.textContent = `${runtimeProject.title} · Editable map`;
      projectKicker.title = fullContext;
    }
    const lessonPage = runtimeProjectPages.find(page => page.type === 'lesson');
    if(lessonPage){
      lessonBackLink.href = pageRuntimeHref(lessonPage.id);
      lessonBackLink.textContent = 'Open related lesson';
      lessonBackLink.hidden = false;
    }else{
      lessonBackLink.removeAttribute('href');
      lessonBackLink.textContent = 'No related lesson yet';
      lessonBackLink.hidden = true;
    }
    if(runtimePageRecord?.title){
      mapPageTitle.textContent = runtimePageRecord.title;
      document.title = `${runtimePageRecord.title} · ${runtimeProject?.title || 'Project'} · Neuro Map Studio`;
    }
  }
  async function initializeRuntimePage(){
    try{
      const context = await getPageContext(runtimePageId, SEED_PROJECT_ID);
      if(context.page && context.page.type !== 'map'){
        location.replace(pageRuntimeHref(runtimePageId));
        return;
      }
      runtimePageRecord = context.page || null;
      runtimeProject = context.project || null;
      runtimeProjectPages = context.projectPages || [];
      if(runtimeProject?.id){
        setCurrentProject(runtimeProject.id).catch(() => {});
      }
      updateRuntimeChrome();
      const storedWorkspace = workspaceFromPageStateData(context.pageState?.data);
      starterHidden = Boolean(context.pageState?.data?.starterHidden);
      reviewStore = normalizeReviewStore(context.pageState?.data?.review);
      if(storedWorkspace){
        workspace = storedWorkspace;
      }else if(context.pageState?.data?.kind === 'seeded-debt-power-map' || runtimePageId === SEED_MAP_PAGE_ID){
        workspace = loadWorkspaceFallback(localStorage);
        await savePageState(runtimePageId, 'map', mapPageStatePayload());
      }else{
        workspace = blankPageWorkspace(context.page?.title || 'Untitled map');
        await savePageState(runtimePageId, 'map', mapPageStatePayload());
      }
      data = activePage().map;
      view = Object.assign({x:0,y:0,scale:1}, data.view || {});
      connectFrom = null;
      reconnectTarget = null;
      const freshStartupView = positionFreshStarterView();
      const startupSelection = freshStartupView ? null : (data.nodes.some(n => n.id === 'core') ? 'core' : (data.nodes[0]?.id || null));
      applySelectionSnapshot({nodes:startupSelection ? [startupSelection] : [], edges:[]});
      resetMapHistory();
      renderPageControls();
      render();
      applyView();
      updatePrompt();
      recoverViewSoon('runtime-load');
      runtimePageInitialized = true;
      setStatus('Map ready');
      await refreshProjectDocuments();
      if(freshStartupView) await persistWorkspaceState('View ready');
      launchReviewFromUrl();
    }catch(error){
      setStatus('Using local map fallback');
      updateRuntimeChrome();
      await refreshProjectDocuments();
      launchReviewFromUrl();
    }
  }
  function renderPageControls(){
    if(!pageSelect) return;
    const current = workspace.activePageId;
    pageSelect.innerHTML = '';
    workspace.pages.forEach((p,i) => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = (i+1) + '. ' + (p.title || 'Untitled view');
      pageSelect.appendChild(opt);
    });
    pageSelect.value = current;
    if(btnDeletePage) btnDeletePage.disabled = workspace.pages.length <= 1;
  }
  function switchPage(pageId){
    if(pageId === workspace.activePageId) return;
    if(reviewMode.active) exitReviewMode('map-view-change');
    const next = workspace.pages.find(p => p.id === pageId); if(!next) return;
    syncCurrentPage();
    workspace.activePageId = next.id;
    data = next.map;
    view = Object.assign({x:0,y:0,scale:1}, data.view || {});
    const nextSelection = data.nodes.some(n => n.id === 'core') ? 'core' : (data.nodes[0]?.id || null);
    applySelectionSnapshot({nodes:nextSelection ? [nextSelection] : [], edges:[]});
    resetMapHistory();
    connectFrom = null; reconnectTarget = null; closeMenu(); closeSidePanel();
    render(); applyView(); updatePrompt(); recoverViewSoon('map view switched'); save('Map view switched'); showToast('Map view switched');
  }
  function createNewPage(){
    if(reviewMode.active) exitReviewMode('map-view-change');
    const name = prompt('Name for the new map view inside this page:', 'New view');
    if(name === null) return;
    syncCurrentPage();
    const p = makePage(name, blankMap());
    workspace.pages.push(p);
    workspace.activePageId = p.id;
    data = p.map;
    view = Object.assign({x:0,y:0,scale:1}, data.view || {});
    applySelectionSnapshot({nodes:['core'], edges:[]});
    resetMapHistory();
    connectFrom = null;
    reconnectTarget = null;
    render(); resetView(); save('Map view created'); showToast('New map view created');
  }
  function duplicateCurrentPage(){
    if(reviewMode.active) exitReviewMode('map-view-change');
    const current = activePage();
    syncCurrentPage();
    const copyMap = normalizeMap(JSON.parse(JSON.stringify(current.map)));
    const p = makePage((current.title || 'View') + ' copy', copyMap);
    workspace.pages.push(p);
    workspace.activePageId = p.id;
    data = p.map;
    view = Object.assign({x:0,y:0,scale:1}, data.view || {});
    const copySelection = data.nodes.some(n => n.id === 'core') ? 'core' : (data.nodes[0]?.id || null);
    applySelectionSnapshot({nodes:copySelection ? [copySelection] : [], edges:[]});
    resetMapHistory();
    connectFrom = null;
    reconnectTarget = null;
    render(); applyView(); recoverViewSoon('map view duplicated'); save('Map view duplicated'); showToast('Map view duplicated');
  }
  function renameCurrentPage(){
    const p = activePage();
    const name = prompt('Rename this map view:', p.title || 'Untitled view');
    if(name === null) return;
    p.title = clean(name) || p.title || 'Untitled view';
    renderPageControls(); save('Map view renamed'); showToast('Map view renamed');
  }
  function deleteCurrentPage(){
    if(reviewMode.active) exitReviewMode('map-view-change');
    if(workspace.pages.length <= 1){ showToast('Keep at least one map view'); return; }
    const p = activePage();
    if(!confirm(`Delete map view “${p.title || 'Untitled view'}”? This only deletes this view from this browser save.`)) return;
    const idx = workspace.pages.findIndex(x => x.id === p.id);
    workspace.pages.splice(idx,1);
    workspace.activePageId = (workspace.pages[Math.max(0,idx-1)] || workspace.pages[0]).id;
    data = activePage().map;
    view = Object.assign({x:0,y:0,scale:1}, data.view || {});
    const nextSelection = data.nodes.some(n => n.id === 'core') ? 'core' : (data.nodes[0]?.id || null);
    applySelectionSnapshot({nodes:nextSelection ? [nextSelection] : [], edges:[]});
    resetMapHistory();
    connectFrom = null;
    reconnectTarget = null;
    render(); applyView(); recoverViewSoon('map view deleted'); save('Map view deleted'); showToast('Map view deleted');
  }
  function createPageFromNode(nodeId){
    const origin = byId(nodeId); if(!origin) return;
    syncCurrentPage();
    const neighborEdges = data.edges.filter(e => e.from === nodeId || e.to === nodeId).slice(0, 10);
    const ids = new Set([nodeId]); neighborEdges.forEach(e => { ids.add(e.from); ids.add(e.to); });
    const copiedNodes = Array.from(ids).map((nid, i) => JSON.parse(JSON.stringify(byId(nid)))).filter(Boolean);
    const radius = 330;
    copiedNodes.forEach((n, i) => {
      if(n.id === nodeId){ n.x = -140; n.y = -70; n.w = Math.max(n.w || 310, 320); n.h = Math.max(n.h || 168, 170); n.importance = 3; n.group = origin.group || n.group; n.tag = 'page focus'; }
      else{
        const k = i - 1, total = Math.max(1, copiedNodes.length - 1);
        const angle = (-Math.PI/2) + (Math.PI*2*k/total);
        n.x = Math.round(-140 + Math.cos(angle)*radius);
        n.y = Math.round(-70 + Math.sin(angle)*radius);
        n.w = Math.min(Math.max(n.w || 268, 245), 330);
        n.h = Math.min(Math.max(n.h || 145, 130), 190);
      }
    });
    const kept = new Set(copiedNodes.map(n => n.id));
    const copiedEdges = data.edges.filter(e => kept.has(e.from) && kept.has(e.to)).map(e => JSON.parse(JSON.stringify(e)));
    const map = normalizeMap({version:19, view:{x:0,y:0,scale:1}, nodes:copiedNodes, edges:copiedEdges});
    const p = makePage((origin.title || 'Block') + ' detail map', map);
    workspace.pages.push(p);
    workspace.activePageId = p.id;
    data = p.map; view = Object.assign({x:0,y:0,scale:1}, data.view || {});
    applySelectionSnapshot({nodes:[nodeId], edges:[]});
    resetMapHistory();
    connectFrom = null;
    reconnectTarget = null;
    render(); resetView(); save('Detail map view created'); showToast('Detail map view created');
  }
  function id(){ return 'node-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,7); }
  function edgeId(){ return 'edge-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,7); }
  function byId(nodeId){ return data.nodes.find(n => n.id === nodeId); }
  function edgeById(eid){ return data.edges.find(e => e.id === eid); }
  function stageCoords(clientX, clientY){
    const r = stage.getBoundingClientRect();
    return {x:clientX - r.left, y:clientY - r.top};
  }
  function worldToStage(x, y){ return {x:view.x + x * view.scale, y:view.y + y * view.scale}; }
  function menuPointFromButton(button){
    const rect = button.getBoundingClientRect();
    return {x:rect.left + rect.width / 2, y:rect.bottom + 8};
  }
  function currentSelectionMode(){
    if(selectedNodeIds.size && selectedEdgeIds.size) return 'mixed';
    if(selectedEdgeIds.size) return 'edge';
    if(selectedNodeIds.size) return 'node';
    return 'selection';
  }
  function isTextEditingActive(){
    return isEditingElement(document.activeElement);
  }
  function isMapShortcutContext(){
    if(isTextEditingActive()) return false;
    const active = document.activeElement;
    if(!active || active === document.body || active === stage) return true;
    if(active.closest?.('#stage') && !active.closest?.('input,textarea,select,[contenteditable]')) return true;
    return hasMapSelection();
  }
  function updateMarqueeBox(rect){
    if(!selectionMarquee || !rect) return;
    selectionMarquee.hidden = false;
    selectionMarquee.style.left = rect.left + 'px';
    selectionMarquee.style.top = rect.top + 'px';
    selectionMarquee.style.width = rect.width + 'px';
    selectionMarquee.style.height = rect.height + 'px';
  }
  function hideMarqueeBox(){
    if(!selectionMarquee) return;
    selectionMarquee.hidden = true;
    selectionMarquee.style.left = '';
    selectionMarquee.style.top = '';
    selectionMarquee.style.width = '';
    selectionMarquee.style.height = '';
  }
  function canStartMarqueeSelection(event, target){
    if(!selectionMarquee || dragNode || resizeNode || panDrag || pendingPlacement || isBlockTargetingActive() || touchGesture) return false;
    if(event.button !== 0 || isTouchLikePointer(event)) return false;
    if(getPointerGestureOwner(event.pointerId)) return false;
    if(isCanvasGestureBlockedTarget(target)) return false;
    const menuOpen = menu && menu.getAttribute('aria-hidden') !== 'true';
    if(menuOpen) return false;
    return !!(event.shiftKey || multiSelectMode);
  }
  function beginMarqueeSelection(event){
    const point = stageCoords(event.clientX, event.clientY);
    marqueeSelection = {
      pointerId:event.pointerId,
      start:point,
      current:point,
      moved:false
    };
    event.preventDefault();
    event.stopPropagation();
    closeMenu();
    clearEdgeDeleteArm();
    cancelLongPress(event.pointerId, 'box-select-start', event);
    setGestureLock('marquee-select', true);
    stage.classList.add('marquee-selecting');
    requestPointerCapture(stage, event.pointerId, event, 'selection');
    updateMarqueeBox(marqueeRectFromPoints(point, point));
    logInputDebug('box-select-start', event, {mode:'selection', target:stage});
  }
  function updateMarqueeSelection(event){
    if(!marqueeSelection || marqueeSelection.pointerId !== event.pointerId) return false;
    event.preventDefault();
    const point = stageCoords(event.clientX, event.clientY);
    marqueeSelection.current = point;
    const rect = marqueeRectFromPoints(marqueeSelection.start, point);
    marqueeSelection.moved = rect.width >= MARQUEE_MIN_SIZE || rect.height >= MARQUEE_MIN_SIZE;
    updateMarqueeBox(rect);
    return true;
  }
  function nodeIdsInMarquee(rect){
    if(!rect || rect.width < MARQUEE_MIN_SIZE || rect.height < MARQUEE_MIN_SIZE) return [];
    const stageRect = stage.getBoundingClientRect();
    return data.nodes.flatMap(node => {
      const el = nodeLayer.querySelector(`.map-node[data-id="${CSS.escape(node.id)}"]`);
      if(!el) return [];
      const nodeRect = rectToStage(el.getBoundingClientRect(), stageRect);
      return rectsOverlap(rect, nodeRect) ? [node.id] : [];
    });
  }
  function finishMarqueeSelection(event, reason='pointerup'){
    if(!marqueeSelection || marqueeSelection.pointerId !== event.pointerId) return false;
    event.preventDefault();
    event.stopPropagation();
    const rect = marqueeRectFromPoints(marqueeSelection.start, stageCoords(event.clientX, event.clientY));
    const nodeIds = nodeIdsInMarquee(rect);
    marqueeSelection = null;
    hideMarqueeBox();
    stage.classList.remove('marquee-selecting');
    setGestureLock('marquee-select', false);
    releasePointerCapture(stage, event.pointerId);
    if(nodeIds.length){
      nodeIds.forEach(nodeId => selectedNodeIds.add(nodeId));
      pendingEdgeDeleteId = null;
      syncSelectionAliases();
      refreshSelectionUI('box-select', event);
      showToast(`Selected ${selectionSummary()}`);
    }else{
      updateSelectionUI('box-select-empty');
    }
    logInputDebug('box-select-end', event, {mode:'selection', reason, target:stage});
    return true;
  }
  function cancelMarqueeSelection(reason='cancel', source=inputDebugState.lastPointer){
    if(!marqueeSelection) return false;
    const pointerId = marqueeSelection.pointerId;
    marqueeSelection = null;
    hideMarqueeBox();
    stage.classList.remove('marquee-selecting');
    setGestureLock('marquee-select', false);
    releasePointerCapture(stage, pointerId);
    logInputDebug('box-select-cancel', source, {mode:'selection', reason, target:stage});
    return true;
  }
  function syncSelectionAliases(){
    const nodes = Array.from(selectedNodeIds).filter(nodeId => !!byId(nodeId));
    const edges = Array.from(selectedEdgeIds).filter(edgeId => !!edgeById(edgeId));
    selectedNodeIds.clear();
    selectedEdgeIds.clear();
    nodes.forEach(nodeId => selectedNodeIds.add(nodeId));
    edges.forEach(edgeId => selectedEdgeIds.add(edgeId));
    selectedId = nodes[0] || null;
    selectedEdgeId = edges[0] || null;
  }
  function getSelectionSnapshot(){
    syncSelectionAliases();
    return {nodes:Array.from(selectedNodeIds), edges:Array.from(selectedEdgeIds)};
  }
  function applySelectionSnapshot(selection={}){
    selectedNodeIds.clear();
    selectedEdgeIds.clear();
    (selection.nodes || []).forEach(nodeId => { if(byId(nodeId)) selectedNodeIds.add(nodeId); });
    (selection.edges || []).forEach(edgeId => { if(edgeById(edgeId)) selectedEdgeIds.add(edgeId); });
    syncSelectionAliases();
  }
  function selectionCounts(){
    syncSelectionAliases();
    return {nodes:selectedNodeIds.size, edges:selectedEdgeIds.size, total:selectedNodeIds.size + selectedEdgeIds.size};
  }
  function hasMapSelection(){
    return selectionCounts().total > 0;
  }
  function plural(count, singular, pluralText=singular + 's'){
    return `${count} ${count === 1 ? singular : pluralText}`;
  }
  function selectionSummary(){
    const counts = selectionCounts();
    const parts = [];
    if(counts.nodes) parts.push(plural(counts.nodes, 'block'));
    if(counts.edges) parts.push(plural(counts.edges, 'line'));
    return parts.join(', ') || 'No selection';
  }
  function setMultiSelectMode(active, options={}){
    multiSelectMode = Boolean(active);
    if(btnMultiSelect){
      btnMultiSelect.classList.toggle('active', multiSelectMode);
      btnMultiSelect.setAttribute('aria-pressed', String(multiSelectMode));
      btnMultiSelect.title = multiSelectMode ? 'Selecting multiple blocks and relationship lines' : 'Select multiple blocks and relationship lines';
    }
    if(options.announce) showToast(multiSelectMode ? 'Select multiple on' : 'Select multiple off');
  }
  function shouldToggleSelection(event){
    return !!(multiSelectMode || event?.shiftKey || event?.ctrlKey || event?.metaKey);
  }
  function setSelectionFromIds(nodeIds=[], edgeIds=[], reason='selection-change', source=inputDebugState.lastPointer){
    selectedNodeIds.clear();
    selectedEdgeIds.clear();
    nodeIds.forEach(nodeId => { if(byId(nodeId)) selectedNodeIds.add(nodeId); });
    edgeIds.forEach(edgeId => { if(edgeById(edgeId)) selectedEdgeIds.add(edgeId); });
    pendingEdgeDeleteId = null;
    syncSelectionAliases();
    refreshSelectionUI(reason, source);
  }
  function toggleNodeSelection(nodeId, reason='toggle-node', source=inputDebugState.lastPointer){
    if(!byId(nodeId)) return;
    if(selectedNodeIds.has(nodeId)) selectedNodeIds.delete(nodeId);
    else selectedNodeIds.add(nodeId);
    pendingEdgeDeleteId = null;
    syncSelectionAliases();
    refreshSelectionUI(reason, source);
  }
  function toggleEdgeSelection(edgeId, reason='toggle-line', source=inputDebugState.lastPointer){
    if(!edgeById(edgeId)) return;
    if(selectedEdgeIds.has(edgeId)) selectedEdgeIds.delete(edgeId);
    else selectedEdgeIds.add(edgeId);
    pendingEdgeDeleteId = null;
    syncSelectionAliases();
    refreshSelectionUI(reason, source);
  }
  function refreshSelectionUI(reason='selection-change', source=inputDebugState.lastPointer){
    syncSelectionAliases();
    nodeLayer.querySelectorAll('.map-node').forEach(el => el.classList.toggle('selected', selectedNodeIds.has(el.dataset.id)));
    renderEdges();
    updateSelectionUI(reason);
    updatePrompt();
    applyFocus();
    logInputDebug('selection-change', source, {mode:currentSelectionMode(), reason, target:stage});
  }
  function captureMapSnapshot(){
    return {nodes:cloneJson(data.nodes), edges:cloneJson(data.edges)};
  }
  function beginMapCommand(){
    return {map:captureMapSnapshot(), selection:getSelectionSnapshot()};
  }
  function mapSnapshotsMatch(a, b){
    return JSON.stringify(a) === JSON.stringify(b);
  }
  function updateHistoryControls(){
    if(btnUndo){
      btnUndo.disabled = mapHistory.undo.length === 0;
      btnUndo.classList.toggle('history-live', mapHistory.undo.length > 0);
    }
    if(btnRedo){
      btnRedo.disabled = mapHistory.redo.length === 0;
      btnRedo.classList.toggle('history-live', mapHistory.redo.length > 0);
    }
  }
  function resetMapHistory(){
    mapHistory.undo = [];
    mapHistory.redo = [];
    updateHistoryControls();
  }
  function commitMapCommand(label, before, options={}){
    if(!before) return false;
    syncSelectionAliases();
    const after = captureMapSnapshot();
    if(mapSnapshotsMatch(before.map, after)){
      updateHistoryControls();
      return false;
    }
    mapHistory.undo.push({
      label,
      before:before.map,
      after,
      beforeSelection:before.selection,
      afterSelection:getSelectionSnapshot()
    });
    if(mapHistory.undo.length > MAP_HISTORY_LIMIT) mapHistory.undo.shift();
    mapHistory.redo = [];
    updateHistoryControls();
    if(options.render !== false) render();
    if(options.save !== false) save(label);
    return true;
  }
  function applyMapSnapshot(snapshot){
    data.nodes = cloneJson(snapshot.nodes || []);
    data.edges = cloneJson(snapshot.edges || []);
    data.view = view;
    syncCurrentPage();
  }
  function restoreHistoryEntry(entry, direction){
    const snapshot = direction === 'undo' ? entry.before : entry.after;
    const selection = direction === 'undo' ? entry.beforeSelection : entry.afterSelection;
    applyMapSnapshot(snapshot);
    applySelectionSnapshot(selection);
    pendingEdgeDeleteId = null;
    suppressSelectionShelf = false;
    render();
    save(direction === 'undo' ? 'Undo' : 'Redo');
    showToast(`${direction === 'undo' ? 'Undid' : 'Redid'} ${entry.label.toLowerCase()}`);
  }
  function undoMapCommand(){
    const entry = mapHistory.undo.pop();
    if(!entry){ showToast('Nothing to undo'); updateHistoryControls(); return; }
    mapHistory.redo.push(entry);
    restoreHistoryEntry(entry, 'undo');
    updateHistoryControls();
  }
  function redoMapCommand(){
    const entry = mapHistory.redo.pop();
    if(!entry){ showToast('Nothing to redo'); updateHistoryControls(); return; }
    mapHistory.undo.push(entry);
    if(mapHistory.undo.length > MAP_HISTORY_LIMIT) mapHistory.undo.shift();
    restoreHistoryEntry(entry, 'redo');
    updateHistoryControls();
  }
  function setSelectionShelfRendered(visible, reason=''){
    if(!visible){
      selectionShelf.dataset.mode = '';
      selectionShelf.classList.remove('show', 'anchored', 'docked');
      selectionShelf.hidden = true;
      selectionShelf.style.left = '';
      selectionShelf.style.top = '';
      if(selectionShelfShown){
        logInputDebug('toolbar-hidden', inputDebugState.lastPointer, {mode:currentSelectionMode(), reason, target:selectionShelf});
      }
      selectionShelfShown = false;
      return;
    }
    selectionShelf.hidden = false;
    selectionShelf.classList.add('show');
    positionSelectionShelf();
    if(!selectionShelfShown){
      logInputDebug('toolbar-shown', inputDebugState.lastPointer, {mode:currentSelectionMode(), reason, target:selectionShelf});
    }
    selectionShelfShown = true;
  }
  function setSelectionShelfSuppressed(active, reason=''){
    if(suppressSelectionShelf === active) return;
    suppressSelectionShelf = active;
    updateSelectionUI(reason || (active ? 'toolbar-suppressed' : 'toolbar-restored'));
  }
  function clearSelection(reason='selection-cleared', source=inputDebugState.lastPointer){
    if(!hasMapSelection()){
      pendingEdgeDeleteId = null;
      suppressSelectionShelf = false;
      setMultiSelectMode(false);
      updateSelectionUI(reason);
      return;
    }
    selectedNodeIds.clear();
    selectedEdgeIds.clear();
    selectedId = null;
    selectedEdgeId = null;
    pendingEdgeDeleteId = null;
    suppressSelectionShelf = false;
    setMultiSelectMode(false);
    refreshSelectionUI(reason, source);
    logInputDebug('selection-cleared', source, {mode:'selection', reason, target:stage});
  }
  function rectFromElement(element){
    if(!element || element.hidden) return null;
    const style = getComputedStyle(element);
    if(style.display === 'none' || style.visibility === 'hidden') return null;
    const rect = element.getBoundingClientRect();
    if(rect.width <= 0 || rect.height <= 0) return null;
    return {left:rect.left, top:rect.top, right:rect.right, bottom:rect.bottom, width:rect.width, height:rect.height};
  }
  function rectToStage(rect, stageRect=null){
    if(!rect) return null;
    const base = stageRect || stage.getBoundingClientRect();
    return {
      left:rect.left - base.left,
      top:rect.top - base.top,
      right:rect.right - base.left,
      bottom:rect.bottom - base.top,
      width:rect.width,
      height:rect.height
    };
  }
  function overlayVisible(element, className=''){
    if(!element) return false;
    if(className && !element.classList.contains(className)) return false;
    return !!rectFromElement(element);
  }
  function getOverlayRects(options={}){
    const includeShelf = options.includeShelf !== false;
    const includeToast = options.includeToast !== false;
    return {
      stage:rectFromElement(stage),
      toolbar:rectFromElement(document.querySelector('.toolbar')),
      workbench:overlayVisible(workbenchDrawer) ? rectFromElement(workbenchDrawer) : null,
      workbenchToggle:overlayVisible(btnWorkbenchToggle) ? rectFromElement(btnWorkbenchToggle) : null,
      zoomDock:rectFromElement(zoomDock),
      shelf:includeShelf && overlayVisible(selectionShelf, 'show') ? rectFromElement(selectionShelf) : null,
      toast:includeToast && toast.classList.contains('show') ? rectFromElement(toast) : null,
      placement:placementOverlay && !placementOverlay.hidden ? rectFromElement(placementOverlay) : null,
      starter:mapStarterPanel && !mapStarterPanel.hidden ? rectFromElement(mapStarterPanel) : null,
      documentPicker:documentPicker && !documentPicker.hidden ? rectFromElement(documentPicker) : null,
      documentDetail:documentDetailCard && !documentDetailCard.hidden ? rectFromElement(documentDetailCard) : null,
      inputDebug:inputDebugState.enabled && inputDebugPanel && !inputDebugPanel.hidden ? rectFromElement(inputDebugPanel) : null
    };
  }
  function getOverlayLanes(options={}){
    const overlays = getOverlayRects(options);
    return {
      ...overlays,
      rightUtility:overlays.workbench || overlays.documentPicker || overlays.documentDetail || overlays.workbenchToggle || null,
      bottomUtility:overlays.zoomDock || overlays.toast || overlays.placement || null
    };
  }
  function getCanvasSafeArea(options={}){
    const overlays = getOverlayLanes(options);
    const stageRect = overlays.stage || stage.getBoundingClientRect();
    const nodeWidth = Number(options.nodeWidth) || 268;
    const nodeHeight = Number(options.nodeHeight) || 145;
    const margin = Number(options.margin) || 20;
    const minWidth = Math.min(Math.max(nodeWidth * view.scale + 28, 190), Math.max(190, stageRect.width - 28));
    const minHeight = Math.min(Math.max(nodeHeight * view.scale + 28, 150), Math.max(150, stageRect.height - 28));
    const safe = {left:margin, top:margin, right:stageRect.width - margin, bottom:stageRect.height - margin, stageRect};
    const consumeLeft = rect => {
      if(rectsOverlap(rect, stageRect)) safe.left = Math.max(safe.left, rect.right - stageRect.left + margin);
    };
    const consumeRight = rect => {
      if(!rectsOverlap(rect, stageRect)) return;
      const next = rect.left - stageRect.left - margin;
      if(next - safe.left >= minWidth) safe.right = Math.min(safe.right, next);
    };
    const consumeTop = rect => {
      if(rectsOverlap(rect, stageRect)) safe.top = Math.max(safe.top, rect.bottom - stageRect.top + margin);
    };
    const consumeBottom = rect => {
      if(!rectsOverlap(rect, stageRect)) return;
      const next = rect.top - stageRect.top - margin;
      if(next - safe.top >= minHeight) safe.bottom = Math.min(safe.bottom, next);
    };
    consumeLeft(overlays.toolbar);
    const rightSide = stageRect.left + stageRect.width * .52;
    const lowerHalf = stageRect.top + stageRect.height * .42;
    [overlays.workbench, overlays.documentPicker, overlays.documentDetail].forEach(rect => {
      if(!rect) return;
      if(rect.left >= rightSide) consumeRight(rect);
      if(rect.top >= lowerHalf || rect.width > stageRect.width * .72) consumeBottom(rect);
    });
    if(overlays.zoomDock){
      if(overlays.zoomDock.left >= rightSide) consumeRight(overlays.zoomDock);
      if(overlays.zoomDock.top >= lowerHalf) consumeBottom(overlays.zoomDock);
    }
    if(overlays.shelf){
      if(overlays.shelf.top < stageRect.top + stageRect.height * .33) consumeTop(overlays.shelf);
      else consumeBottom(overlays.shelf);
    }
    if(overlays.toast){
      if(overlays.toast.top < stageRect.top + stageRect.height * .5) consumeTop(overlays.toast);
      else consumeBottom(overlays.toast);
    }
    if(overlays.placement){
      if(overlays.placement.top < stageRect.top + stageRect.height * .5) consumeTop(overlays.placement);
      else consumeBottom(overlays.placement);
    }
    if(safe.right - safe.left < minWidth){
      safe.left = Math.max(margin, Math.min(safe.left, stageRect.width - minWidth - margin));
      safe.right = Math.min(stageRect.width - margin, safe.left + minWidth);
    }
    if(safe.bottom - safe.top < minHeight){
      safe.top = Math.max(margin, Math.min(safe.top, stageRect.height - minHeight - margin));
      safe.bottom = Math.min(stageRect.height - margin, safe.top + minHeight);
    }
    safe.width = Math.max(1, safe.right - safe.left);
    safe.height = Math.max(1, safe.bottom - safe.top);
    return safe;
  }
  function getBroadCanvasSafeArea(options={}){
    const overlays = getOverlayLanes(options);
    const stageRect = overlays.stage || stage.getBoundingClientRect();
    const margin = Number(options.margin) || 18;
    const safe = {
      left:margin,
      top:margin,
      right:stageRect.width - margin,
      bottom:stageRect.height - margin,
      stageRect
    };
    if(overlays.toolbar && rectsOverlap(overlays.toolbar, stageRect)){
      safe.left = Math.max(safe.left, overlays.toolbar.right - stageRect.left + margin);
    }
    safe.width = Math.max(1, safe.right - safe.left);
    safe.height = Math.max(1, safe.bottom - safe.top);
    return safe;
  }
  function nodeScreenRectFromWorld(x, y, w, h){
    const left = view.x + x * view.scale;
    const top = view.y + y * view.scale;
    const width = w * view.scale;
    const height = h * view.scale;
    return {left, top, right:left + width, bottom:top + height, width, height};
  }
  function worldRect(x, y, w, h){
    return {x, y, w, h, left:x, top:y, right:x + w, bottom:y + h, width:w, height:h};
  }
  function worldRectsOverlap(a, b, margin=0){
    if(!a || !b) return false;
    return a.left < b.right + margin && a.right > b.left - margin && a.top < b.bottom + margin && a.bottom > b.top - margin;
  }
  function screenMarginForWorld(worldMargin=28){
    return clamp(worldMargin * Math.max(view.scale || 1, .18), 12, 38);
  }
  function nodeWorldRect(node){
    const dims = renderedNodeDims(node);
    return worldRect(Number(node.x) || 0, Number(node.y) || 0, dims.w, dims.h);
  }
  function nodeAtClientPoint(clientX, clientY){
    const stageRect = stage.getBoundingClientRect();
    const localX = clientX - stageRect.left;
    const localY = clientY - stageRect.top;
    return data.nodes.find(node => {
      const dims = nodeDims(node);
      const rect = nodeScreenRectFromWorld(node.x, node.y, dims.w, dims.h);
      return localX >= rect.left && localX <= rect.right && localY >= rect.top && localY <= rect.bottom;
    }) || null;
  }
  function firstNodeOverlappingCandidate(candidate, w, h, margin=16){
    const candidateRect = nodeScreenRectFromWorld(candidate.x, candidate.y, w, h);
    return data.nodes.find(node => {
      const dims = nodeDims(node);
      return rectsOverlap(candidateRect, nodeScreenRectFromWorld(node.x, node.y, dims.w, dims.h), margin);
    }) || null;
  }
  function nodeFitsSafeArea(candidate, w, h, safe){
    const rect = nodeScreenRectFromWorld(candidate.x, candidate.y, w, h);
    return rect.left >= safe.left && rect.top >= safe.top && rect.right <= safe.right && rect.bottom <= safe.bottom;
  }
  function getNodeAvoidRects(options={}){
    const stageRect = stage.getBoundingClientRect();
    const rects = [];
    data.nodes.forEach(node => {
      if(options.excludeNodeId && node.id === options.excludeNodeId) return;
      const element = nodeLayer.querySelector(`[data-id="${CSS.escape(node.id)}"]`);
      const domRect = rectFromElement(element);
      if(domRect) rects.push(rectToStage(domRect, stageRect));
      else{
        const dims = nodeDims(node);
        rects.push(nodeScreenRectFromWorld(node.x, node.y, dims.w, dims.h));
      }
    });
    return rects.filter(Boolean);
  }
  function getPlacementAvoidRects(options={}){
    const overlays = getOverlayLanes({includeShelf:options.includeShelf, includeToast:options.includeToast});
    const stageRect = overlays.stage || stage.getBoundingClientRect();
    const rects = [
      overlays.toolbar,
      overlays.workbench,
      overlays.workbenchToggle,
      overlays.zoomDock,
      overlays.shelf,
      overlays.toast,
      overlays.placement,
      overlays.starter,
      overlays.documentPicker,
      overlays.documentDetail,
      overlays.inputDebug,
      overlays.rightUtility,
      overlays.bottomUtility
    ].map(rect => rectToStage(rect, stageRect)).filter(Boolean);
    if(options.includeNodes !== false) rects.push(...getNodeAvoidRects(options));
    return rects;
  }
  function candidateIsClear(candidate, w, h, safe, avoidRects, margin=28, excludeNodeId=''){
    if(!nodeFitsSafeArea(candidate, w, h, safe)) return false;
    if(!nodeSlotIsOpen(candidate.x, candidate.y, w, h, margin, excludeNodeId)) return false;
    const candidateRect = nodeScreenRectFromWorld(candidate.x, candidate.y, w, h);
    return !avoidRects.some(rect => rectsOverlap(candidateRect, rect, screenMarginForWorld(margin)));
  }
  function safeAreaFallbackPosition(w, h, safe){
    const screenWidth = w * view.scale;
    const screenHeight = h * view.scale;
    const localX = clamp(safe.left + Math.min(28, safe.width * .12), safe.left, Math.max(safe.left, safe.right - screenWidth));
    const localY = clamp(safe.top + Math.min(28, safe.height * .12), safe.top, Math.max(safe.top, safe.bottom - screenHeight));
    return {x:(localX - view.x) / view.scale, y:(localY - view.y) / view.scale};
  }
  function scanSafeNodePosition(w, h, safe, avoidRects=[], excludeNodeId='', margin=28){
    const screenWidth = w * view.scale;
    const screenHeight = h * view.scale;
    const stepX = Math.max(70, Math.min(145, screenWidth * .5));
    const stepY = Math.max(64, Math.min(125, screenHeight * .5));
    for(let localY = safe.top; localY <= Math.max(safe.top, safe.bottom - screenHeight); localY += stepY){
      for(let localX = safe.left; localX <= Math.max(safe.left, safe.right - screenWidth); localX += stepX){
        const candidate = {x:(localX - view.x) / view.scale, y:(localY - view.y) / view.scale};
        if(candidateIsClear(candidate, w, h, safe, avoidRects, margin, excludeNodeId)) return candidate;
      }
    }
    return null;
  }
  function radialSafeNodePosition(w, h, safe, avoidRects=[], origin=null, excludeNodeId='', margin=28){
    const start = origin || safeAreaFallbackPosition(w, h, safe);
    const angles = [0, Math.PI / 2, -Math.PI / 2, Math.PI, Math.PI / 4, -Math.PI / 4, Math.PI * 3 / 4, -Math.PI * 3 / 4];
    for(let radius = 130; radius <= 980; radius += 90){
      for(const angle of angles){
        const candidate = {
          x:start.x + Math.cos(angle) * radius,
          y:start.y + Math.sin(angle) * radius
        };
        if(candidateIsClear(candidate, w, h, safe, avoidRects, margin, excludeNodeId)) return candidate;
      }
    }
    return null;
  }
  function nodeVisibleEnough(candidate, w, h){
    const stageRect = stage.getBoundingClientRect();
    const rect = nodeScreenRectFromWorld(candidate.x, candidate.y, w, h);
    const visibleWidth = Math.min(rect.right, stageRect.width) - Math.max(rect.left, 0);
    const visibleHeight = Math.min(rect.bottom, stageRect.height) - Math.max(rect.top, 0);
    return visibleWidth >= Math.min(rect.width, 150) && visibleHeight >= Math.min(rect.height, 110);
  }
  function visibleCandidateIsClear(candidate, w, h, avoidRects, margin=28, excludeNodeId=''){
    if(!nodeVisibleEnough(candidate, w, h)) return false;
    if(!nodeSlotIsOpen(candidate.x, candidate.y, w, h, margin, excludeNodeId)) return false;
    const candidateRect = nodeScreenRectFromWorld(candidate.x, candidate.y, w, h);
    return !avoidRects.some(rect => rectsOverlap(candidateRect, rect, screenMarginForWorld(margin)));
  }
  function visibleClearNodePosition(w, h, origin=null, avoidRects=[], excludeNodeId='', margin=28){
    const start = origin || {x:0, y:0};
    const angles = [0, Math.PI / 2, -Math.PI / 2, Math.PI, Math.PI / 4, -Math.PI / 4, Math.PI * 3 / 4, -Math.PI * 3 / 4];
    for(let radius = 120; radius <= 2800; radius += 90){
      for(const angle of angles){
        const candidate = {x:start.x + Math.cos(angle) * radius, y:start.y + Math.sin(angle) * radius};
        if(visibleCandidateIsClear(candidate, w, h, avoidRects, margin, excludeNodeId)) return candidate;
      }
    }
    return null;
  }
  function findNodeClearPosition(w, h, safe, origin=null){
    const start = origin || safeAreaFallbackPosition(w, h, safe);
    const angles = [0, Math.PI / 2, -Math.PI / 2, Math.PI, Math.PI / 4, -Math.PI / 4, Math.PI * 3 / 4, -Math.PI * 3 / 4];
    const candidates = [start];
    for(let radius = 120; radius <= 1400; radius += 80){
      angles.forEach(angle => candidates.push({
        x:start.x + Math.cos(angle) * radius,
        y:start.y + Math.sin(angle) * radius
      }));
    }
    return candidates.find(candidate => nodeFitsSafeArea(candidate, w, h, safe) && nodeSlotIsOpen(candidate.x, candidate.y, w, h, 28)) || null;
  }
  function worldClearNodePosition(w, h, origin=null, excludeNodeId='', margin=28){
    const start = origin || {x:0, y:0};
    const angles = [0, Math.PI / 2, -Math.PI / 2, Math.PI, Math.PI / 4, -Math.PI / 4, Math.PI * 3 / 4, -Math.PI * 3 / 4];
    for(let radius = 160; radius <= 3600; radius += 120){
      for(const angle of angles){
        const candidate = {x:start.x + Math.cos(angle) * radius, y:start.y + Math.sin(angle) * radius};
        if(nodeSlotIsOpen(candidate.x, candidate.y, w, h, margin, excludeNodeId)) return candidate;
      }
    }
    return null;
  }
  function avoidVisibleWorkbenchOverlap(position, w, h){
    const workbenchRect = overlayVisible(workbenchDrawer) ? rectFromElement(workbenchDrawer) : null;
    if(!workbenchRect) return position;
    const stageRect = stage.getBoundingClientRect();
    const workbenchStageRect = rectToStage(workbenchRect, stageRect);
    if(!rectsOverlap(nodeScreenRectFromWorld(position.x, position.y, w, h), workbenchStageRect, 12)) return position;
    const screenWidth = w * view.scale;
    const screenHeight = h * view.scale;
    const broadSafe = getBroadCanvasSafeArea({includeShelf:false, includeToast:false, margin:18});
    const preferredRect = nodeScreenRectFromWorld(position.x, position.y, w, h);
    const preferredLocalX = clamp(workbenchStageRect.left - screenWidth - 26, broadSafe.left, Math.max(broadSafe.left, broadSafe.right - screenWidth));
    const offsets = [0, -180, 180, -340, 340, -520, 520];
    for(let localX = preferredLocalX; localX >= broadSafe.left; localX -= Math.max(72, screenWidth * .28)){
      for(const offset of offsets){
        const localY = clamp(preferredRect.top + offset, broadSafe.top, Math.max(broadSafe.top, broadSafe.bottom - screenHeight));
        const candidate = {x:(localX - view.x) / view.scale, y:(localY - view.y) / view.scale};
        const candidateRect = nodeScreenRectFromWorld(candidate.x, candidate.y, w, h);
        if(nodeFitsSafeArea(candidate, w, h, broadSafe) && nodeSlotIsOpen(candidate.x, candidate.y, w, h, 28) && !rectsOverlap(candidateRect, workbenchStageRect, 12)){
          return candidate;
        }
      }
    }
    return position;
  }
  function findFreeNodePlacement({preferredTopLeft=null, w=268, h=145, candidates=[], options={}}={}){
    const collisionMargin = Number(options.collisionMargin) || 28;
    const safe = getCanvasSafeArea({nodeWidth:w, nodeHeight:h, includeShelf:options.includeShelf, includeToast:options.includeToast, margin:options.margin});
    const avoidRects = getPlacementAvoidRects({includeShelf:options.includeShelf, includeToast:options.includeToast, excludeNodeId:options.excludeNodeId});
    const broadSafe = getBroadCanvasSafeArea({includeShelf:false, includeToast:false, margin:options.margin});
    const broadAvoidRects = getPlacementAvoidRects({includeShelf:false, includeToast:false, excludeNodeId:options.excludeNodeId});
    const allCandidates = [];
    const addCandidate = candidate => {
      if(candidate && Number.isFinite(candidate.x) && Number.isFinite(candidate.y)) allCandidates.push(candidate);
    };
    addCandidate(preferredTopLeft);
    candidates.forEach(addCandidate);
    addCandidate(safeAreaFallbackPosition(w, h, safe));
    let reason = 'candidate';
    let position = allCandidates.find(candidate => candidateIsClear(candidate, w, h, safe, avoidRects, collisionMargin, options.excludeNodeId));
    if(!position){ reason = 'safe-scan'; position = scanSafeNodePosition(w, h, safe, avoidRects, options.excludeNodeId, collisionMargin); }
    if(!position){ reason = 'radial'; position = radialSafeNodePosition(w, h, safe, avoidRects, preferredTopLeft || allCandidates[0], options.excludeNodeId, collisionMargin); }
    if(!position){ reason = 'broad-scan'; position = scanSafeNodePosition(w, h, broadSafe, broadAvoidRects, options.excludeNodeId, collisionMargin); }
    if(!position){ reason = 'broad-radial'; position = radialSafeNodePosition(w, h, broadSafe, broadAvoidRects, preferredTopLeft || allCandidates[0], options.excludeNodeId, collisionMargin); }
    if(!position){ reason = 'visible-clear'; position = visibleClearNodePosition(w, h, preferredTopLeft || allCandidates[0], broadAvoidRects, options.excludeNodeId, collisionMargin); }
    if(!position){ reason = 'clear-fallback'; position = findNodeClearPosition(w, h, broadSafe, preferredTopLeft || allCandidates[0]); }
    if(!position){ reason = 'world-clear'; position = worldClearNodePosition(w, h, preferredTopLeft || allCandidates[0], options.excludeNodeId, collisionMargin); }
    if(!position){ reason = 'safe-fallback'; position = safeAreaFallbackPosition(w, h, safe); }
    const adjusted = avoidVisibleWorkbenchOverlap(position, w, h);
    if(adjusted !== position) reason = 'workbench-adjusted';
    return {position:adjusted, reason, preferred:preferredTopLeft || null};
  }
  function findFreeNodePosition(args={}){
    return findFreeNodePlacement(args).position;
  }
  function panNodeIntoSafeArea(node, w, h, options={}){
    if(!node) return false;
    const safe = getCanvasSafeArea({nodeWidth:w, nodeHeight:h, includeShelf:options.includeShelf, includeToast:options.includeToast, margin:options.margin});
    const rect = nodeScreenRectFromWorld(node.x, node.y, w, h);
    let dx = 0, dy = 0;
    if(rect.width <= safe.width){
      if(rect.left < safe.left) dx = safe.left - rect.left;
      else if(rect.right > safe.right) dx = safe.right - rect.right;
    }else{
      dx = safe.left - rect.left;
    }
    if(rect.height <= safe.height){
      if(rect.top < safe.top) dy = safe.top - rect.top;
      else if(rect.bottom > safe.bottom) dy = safe.bottom - rect.bottom;
    }else{
      dy = safe.top - rect.top;
    }
    if(Math.abs(dx) < 1 && Math.abs(dy) < 1) return false;
    view.x += dx;
    view.y += dy;
    applyView();
    renderEdges();
    return true;
  }
  function nodeOverlapsExisting(node, w, h, margin=20){
    const candidate = worldRect(node.x, node.y, w, h);
    return data.nodes.some(other => {
      if(other.id === node.id) return false;
      return worldRectsOverlap(candidate, nodeWorldRect(other), margin);
    });
  }
  function nodeOverlapsVisibleWorkbench(node, w, h, margin=12){
    const workbenchRect = overlayVisible(workbenchDrawer) ? rectFromElement(workbenchDrawer) : null;
    if(!workbenchRect) return false;
    return rectsOverlap(nodeScreenRectFromWorld(node.x, node.y, w, h), rectToStage(workbenchRect, stage.getBoundingClientRect()), margin);
  }
	  function nodeOverlapsOverlayLanes(node, w, h, margin=12){
	    const rect = nodeScreenRectFromWorld(node.x, node.y, w, h);
	    const avoidRects = getPlacementAvoidRects({
	      includeShelf:false,
	      includeToast:false,
      includeNodes:false,
      excludeNodeId:node.id
	    });
	    return avoidRects.some(avoidRect => rectsOverlap(rect, avoidRect, margin));
	  }
	  function panNodeAwayFromOverlayLanes(node, w, h, options={}){
	    if(!node) return false;
	    const margin = Number(options.margin) || 12;
	    let moved = false;
	    for(let pass = 0; pass < 3; pass++){
	      const stageRect = stage.getBoundingClientRect();
	      const avoidRects = getPlacementAvoidRects({
	        includeShelf:options.includeShelf !== false,
	        includeToast:options.includeToast !== false,
	        includeNodes:false,
	        excludeNodeId:node.id
	      });
	      const currentRect = nodeScreenRectFromWorld(node.x, node.y, w, h);
	      if(!avoidRects.some(avoidRect => rectsOverlap(currentRect, avoidRect, margin))) return moved;
	      const maxLeft = Math.max(8, stageRect.width - currentRect.width - 8);
	      const maxTop = Math.max(8, stageRect.height - currentRect.height - 8);
	      const candidates = [];
	      const addCandidate = (left, top) => {
	        if(!Number.isFinite(left) || !Number.isFinite(top)) return;
	        const nextLeft = clamp(left, 8, maxLeft);
	        const nextTop = clamp(top, 8, maxTop);
	        candidates.push({
	          left:nextLeft,
	          top:nextTop,
	          right:nextLeft + currentRect.width,
	          bottom:nextTop + currentRect.height,
	          width:currentRect.width,
	          height:currentRect.height
	        });
	      };
	      avoidRects.forEach(avoidRect => {
	        const centerLeft = avoidRect.left + avoidRect.width / 2 - currentRect.width / 2;
	        const centerTop = avoidRect.top + avoidRect.height / 2 - currentRect.height / 2;
	        [currentRect.top, centerTop, 8, maxTop].forEach(top => {
	          addCandidate(avoidRect.left - currentRect.width - margin, top);
	          addCandidate(avoidRect.right + margin, top);
	        });
	        [currentRect.left, centerLeft, 8, maxLeft].forEach(left => {
	          addCandidate(left, avoidRect.top - currentRect.height - margin);
	          addCandidate(left, avoidRect.bottom + margin);
	        });
	      });
	      const clearCandidates = candidates
	        .filter(candidate => candidate.left >= 8 && candidate.top >= 8 && candidate.right <= stageRect.width - 8 && candidate.bottom <= stageRect.height - 8)
	        .filter(candidate => !avoidRects.some(avoidRect => rectsOverlap(candidate, avoidRect, margin)))
	        .sort((a, b) => {
	          const da = Math.hypot(a.left - currentRect.left, a.top - currentRect.top);
	          const db = Math.hypot(b.left - currentRect.left, b.top - currentRect.top);
	          return da - db;
	        });
	      const chosen = clearCandidates[0];
	      if(!chosen) return moved;
	      view.x += chosen.left - currentRect.left;
	      view.y += chosen.top - currentRect.top;
	      moved = true;
	      applyView();
	      renderEdges();
	      positionSelectionShelf();
	      updateOverlayOffsets();
	    }
	    return moved;
	  }
	  function visibleOverlayRectsForPlacement(options={}){
	    const includeShelf = options.includeShelf !== false;
	    const includeToast = options.includeToast !== false;
	    return [
	      document.querySelector('.toolbar'),
	      workbenchDrawer && !workbenchDrawer.hidden ? workbenchDrawer : null,
	      workbenchOpen && btnWorkbenchToggle ? btnWorkbenchToggle : null,
	      documentPicker && !documentPicker.hidden ? documentPicker : null,
	      documentDetailCard && !documentDetailCard.hidden ? documentDetailCard : null,
	      zoomDock && !zoomDock.hidden ? zoomDock : null,
	      includeShelf && selectionShelf && !selectionShelf.hidden && selectionShelf.classList.contains('show') ? selectionShelf : null,
	      includeToast && toast && toast.classList.contains('show') ? toast : null,
	      inputDebugState.enabled && inputDebugPanel && !inputDebugPanel.hidden ? inputDebugPanel : null
	    ].map(rectFromElement).filter(Boolean);
	  }
	  function panRenderedNodeAwayFromOverlayLanes(node, options={}){
	    if(!node) return false;
	    const element = nodeLayer.querySelector(`[data-id="${CSS.escape(node.id)}"]`);
	    if(!element) return false;
	    const margin = Number(options.margin) || 12;
	    let moved = false;
	    for(let pass = 0; pass < 3; pass++){
	      const stageRect = stage.getBoundingClientRect();
	      const currentRect = rectFromElement(element);
	      if(!currentRect) return moved;
	      const avoidRects = visibleOverlayRectsForPlacement(options)
	        .filter(avoidRect => rectsOverlap(avoidRect, stageRect));
	      if(!avoidRects.some(avoidRect => rectsOverlap(currentRect, avoidRect, margin))) return moved;
	      const minLeft = stageRect.left + 8;
	      const minTop = stageRect.top + 8;
	      const maxLeft = Math.max(minLeft, stageRect.right - currentRect.width - 8);
	      const maxTop = Math.max(minTop, stageRect.bottom - currentRect.height - 8);
	      const candidates = [];
	      const addCandidate = (left, top) => {
	        if(!Number.isFinite(left) || !Number.isFinite(top)) return;
	        const nextLeft = clamp(left, minLeft, maxLeft);
	        const nextTop = clamp(top, minTop, maxTop);
	        candidates.push({
	          left:nextLeft,
	          top:nextTop,
	          right:nextLeft + currentRect.width,
	          bottom:nextTop + currentRect.height,
	          width:currentRect.width,
	          height:currentRect.height
	        });
	      };
	      avoidRects.forEach(avoidRect => {
	        const centerLeft = avoidRect.left + avoidRect.width / 2 - currentRect.width / 2;
	        const centerTop = avoidRect.top + avoidRect.height / 2 - currentRect.height / 2;
	        [currentRect.top, centerTop, minTop, maxTop].forEach(top => {
	          addCandidate(avoidRect.left - currentRect.width - margin, top);
	          addCandidate(avoidRect.right + margin, top);
	        });
	        [currentRect.left, centerLeft, minLeft, maxLeft].forEach(left => {
	          addCandidate(left, avoidRect.top - currentRect.height - margin);
	          addCandidate(left, avoidRect.bottom + margin);
	        });
	      });
	      const chosen = candidates
	        .filter(candidate => candidate.left >= minLeft && candidate.top >= minTop && candidate.right <= stageRect.right - 8 && candidate.bottom <= stageRect.bottom - 8)
	        .filter(candidate => !avoidRects.some(avoidRect => rectsOverlap(candidate, avoidRect, margin)))
	        .sort((a, b) => Math.hypot(a.left - currentRect.left, a.top - currentRect.top) - Math.hypot(b.left - currentRect.left, b.top - currentRect.top))[0];
	      if(!chosen) return moved;
	      view.x += chosen.left - currentRect.left;
	      view.y += chosen.top - currentRect.top;
	      moved = true;
	      applyView();
	      renderEdges();
	      positionSelectionShelf();
	      updateOverlayOffsets();
	    }
	    return moved;
	  }
	  function nudgeNodeLeftOfOverlay(node, overlayElement, gap=14){
	    if(!node || !overlayElement || overlayElement.hidden) return false;
	    const overlayRect = rectFromElement(overlayElement);
	    const nodeElement = nodeLayer.querySelector(`[data-id="${CSS.escape(node.id)}"]`);
    const nodeRect = rectFromElement(nodeElement);
    if(!overlayRect || !nodeRect || !rectsOverlap(nodeRect, overlayRect, gap)) return false;
    const stageRect = stage.getBoundingClientRect();
    const toolbarRect = rectFromElement(document.querySelector('.toolbar'));
    const minLeft = toolbarRect ? toolbarRect.right - stageRect.left + gap : gap;
    const currentLeft = nodeRect.left - stageRect.left;
    const currentTop = nodeRect.top - stageRect.top;
    const targetLeft = Math.max(minLeft, overlayRect.left - stageRect.left - nodeRect.width - gap);
    const targetTop = clamp(currentTop, gap, Math.max(gap, stageRect.height - nodeRect.height - gap));
    const dx = targetLeft - currentLeft;
    const dy = targetTop - currentTop;
    if(Math.abs(dx) < 1 && Math.abs(dy) < 1) return false;
    node.x += dx / view.scale;
    node.y += dy / view.scale;
    return true;
  }
  function nudgeNodeRightOfOverlay(node, overlayElement, gap=14){
    if(!node || !overlayElement || overlayElement.hidden) return false;
    const overlayRect = rectFromElement(overlayElement);
    const nodeElement = nodeLayer.querySelector(`[data-id="${CSS.escape(node.id)}"]`);
    const nodeRect = rectFromElement(nodeElement);
    if(!overlayRect || !nodeRect || !rectsOverlap(nodeRect, overlayRect, gap)) return false;
    const stageRect = stage.getBoundingClientRect();
    const targetLeft = overlayRect.right - stageRect.left + gap;
    const currentLeft = nodeRect.left - stageRect.left;
    const dx = targetLeft - currentLeft;
    if(Math.abs(dx) < 1) return false;
    node.x += dx / view.scale;
    return true;
  }
  function renderedNodeDims(node){
    const fallback = nodeDims(node);
    const element = nodeLayer.querySelector(`[data-id="${CSS.escape(node.id)}"]`);
    const rect = rectFromElement(element);
    if(!rect || !view.scale) return fallback;
    return {
      w:Math.max(fallback.w, rect.width / view.scale),
      h:Math.max(fallback.h, rect.height / view.scale)
    };
  }
  function nodeDomOverlapsExisting(node, margin=12){
    const element = nodeLayer.querySelector(`[data-id="${CSS.escape(node.id)}"]`);
    const rect = rectFromElement(element);
    if(!rect) return false;
    const stageRect = stage.getBoundingClientRect();
    const candidateRect = rectToStage(rect, stageRect);
    return Array.from(nodeLayer.querySelectorAll('.map-node')).some(other => {
      if(other === element) return false;
      return rectsOverlap(candidateRect, rectToStage(rectFromElement(other), stageRect), margin);
    });
  }
  function clearInsertedNodePlacement(node){
    if(!node) return false;
    const dims = renderedNodeDims(node);
	    const shouldAdjust = node.nodeType === 'document'
	      || nodeOverlapsExisting(node, dims.w, dims.h, 20)
	      || nodeDomOverlapsExisting(node, 12)
	      || nodeOverlapsVisibleWorkbench(node, dims.w, dims.h, 12)
	      || nodeOverlapsOverlayLanes(node, dims.w, dims.h, 12);
	    if(!shouldAdjust) return false;
    const candidates = [];
    const addCandidate = candidate => {
      if(candidate && Number.isFinite(candidate.x) && Number.isFinite(candidate.y)) candidates.push(candidate);
    };
    [byId('core'), data.nodes.find(candidate => candidate.id !== node.id)].filter(Boolean).forEach(anchor => {
      [28, 72, 120, 260, 420].forEach(gap => candidatesAroundNode(anchor, dims.w, dims.h, gap).forEach(addCandidate));
    });
	    const broadSafe = getBroadCanvasSafeArea({includeShelf:false, includeToast:false, margin:18});
	    const avoidRects = getPlacementAvoidRects({includeShelf:true, includeToast:true, excludeNodeId:node.id});
	    const stageRect = stage.getBoundingClientRect();
	    const currentRect = nodeScreenRectFromWorld(node.x, node.y, dims.w, dims.h);
	    const screenWidth = dims.w * view.scale;
	    const screenHeight = dims.h * view.scale;
	    const addScreenCandidate = (localX, localY) => {
	      if(!Number.isFinite(localX) || !Number.isFinite(localY)) return;
	      addCandidate({x:(localX - view.x) / view.scale, y:(localY - view.y) / view.scale});
	    };
	    const addAroundOverlayCandidates = (rect, gap=28) => {
	      if(!rect || !rectsOverlap(rect, stageRect)) return;
	      const overlay = rectToStage(rect, stageRect);
	      const maxLeft = Math.max(broadSafe.left, broadSafe.right - screenWidth);
	      const maxTop = Math.max(broadSafe.top, broadSafe.bottom - screenHeight);
	      const xOptions = [
	        currentRect.left,
	        overlay.left + overlay.width / 2 - screenWidth / 2,
	        broadSafe.left + 20,
	        maxLeft - 20
	      ].map(localX => clamp(localX, broadSafe.left, maxLeft));
	      const yOptions = [
	        currentRect.top,
	        overlay.top + overlay.height / 2 - screenHeight / 2,
	        broadSafe.top + 20,
	        maxTop - 20
	      ].map(localY => clamp(localY, broadSafe.top, maxTop));
	      const left = overlay.left - screenWidth - gap;
	      const right = overlay.right + gap;
	      const above = overlay.top - screenHeight - gap;
	      const below = overlay.bottom + gap;
	      yOptions.forEach(localY => {
	        addScreenCandidate(left, localY);
	        addScreenCandidate(right, localY);
	      });
	      xOptions.forEach(localX => {
	        addScreenCandidate(localX, above);
	        addScreenCandidate(localX, below);
	      });
	    };
	    [workbenchDrawer, documentPicker, documentDetailCard].forEach(element => {
	      if(element && !element.hidden) addAroundOverlayCandidates(rectFromElement(element));
	    });
	    if(zoomDock && !zoomDock.hidden) addAroundOverlayCandidates(rectFromElement(zoomDock), 8);
	    if(selectionShelf && !selectionShelf.hidden && selectionShelf.classList.contains('show')) addAroundOverlayCandidates(rectFromElement(selectionShelf), 18);
	    if(toast && toast.classList.contains('show')) addAroundOverlayCandidates(rectFromElement(toast), 18);
	    if(inputDebugPanel && !inputDebugPanel.hidden) addAroundOverlayCandidates(rectFromElement(inputDebugPanel), 18);
    let next = candidates.find(candidate => candidateIsClear(candidate, dims.w, dims.h, broadSafe, avoidRects, 28, node.id))
      || scanSafeNodePosition(dims.w, dims.h, broadSafe, avoidRects, node.id, 28)
      || radialSafeNodePosition(dims.w, dims.h, broadSafe, avoidRects, {x:node.x, y:node.y}, node.id, 28);
    if(!next){
      next = findFreeNodePlacement({
        preferredTopLeft:{x:node.x, y:node.y},
        w:dims.w,
        h:dims.h,
        candidates,
        options:{includeShelf:true, includeToast:true, excludeNodeId:node.id, margin:18, collisionMargin:28}
      }).position;
    }
    if(!next) return false;
    node.x = Math.round(next.x);
    node.y = Math.round(next.y);
    render();
    let nudgedAfterRender = false;
	    if(node.nodeType === 'document'){
	      for(let pass = 0; pass < 2; pass++){
	        [workbenchDrawer, documentPicker, documentDetailCard, zoomDock].forEach(element => {
	          if(nudgeNodeLeftOfOverlay(node, element, 14)) nudgedAfterRender = true;
	        });
        if(nudgeNodeRightOfOverlay(node, document.querySelector('.toolbar'), 14)) nudgedAfterRender = true;
	        if(nudgedAfterRender) render();
	      }
	    }
	    panNodeAwayFromOverlayLanes(node, dims.w, dims.h, {includeShelf:true, includeToast:true, margin:12});
	    const latest = mapHistory.undo[mapHistory.undo.length - 1];
    if(latest?.after?.nodes?.some(snapshotNode => snapshotNode.id === node.id)){
      latest.after = captureMapSnapshot();
      latest.afterSelection = getSelectionSnapshot();
      updateHistoryControls();
    }
    save('Placement adjusted');
    return true;
  }
  function chooseSafeNodePosition(w=268, h=145, options={}){
    const candidates = [];
    const addCandidate = candidate => {
      if(candidate && Number.isFinite(candidate.x) && Number.isFinite(candidate.y)) candidates.push(candidate);
    };
    const nearNode = byId(options.preferredNearNodeId) || byId(selectedId) || byId('core') || data.nodes[0];
    if(nearNode && options.near !== false){
      const r = nodeRect(nearNode);
      const gap = Number(options.gap) || 120;
      addCandidate({x:r.x + r.w + gap, y:r.y + 8});
      addCandidate({x:r.x, y:r.y + r.h + gap});
      addCandidate({x:r.x - w - gap, y:r.y + 8});
      addCandidate({x:r.x, y:r.y - h - gap});
      addCandidate({x:r.x + r.w + gap, y:r.y + r.h + gap});
      addCandidate({x:r.x - w - gap, y:r.y + r.h + gap});
    }
    return findFreeNodePosition({
      preferredTopLeft:options.preferredTopLeft || null,
      w,
      h,
      candidates,
      options
    });
  }
  function narrowDocumentPreferredPosition(w, h, fallback){
    const stageRect = stage.getBoundingClientRect();
    const toolbarRect = rectFromElement(document.querySelector('.toolbar'));
    const zoomRect = rectFromElement(zoomDock);
    const margin = 12;
    const screenWidth = w * view.scale;
    const screenHeight = h * view.scale;
    const fallbackRect = nodeScreenRectFromWorld(fallback.x, fallback.y, w, h);
    const minLeft = toolbarRect ? toolbarRect.right - stageRect.left + margin : margin;
    const maxLeft = Math.max(minLeft, stageRect.width - screenWidth - margin);
    const preferredLeft = zoomRect ? zoomRect.left - stageRect.left - screenWidth - margin : fallbackRect.left;
    const localX = clamp(preferredLeft, minLeft, maxLeft);
    const localY = clamp(fallbackRect.top, margin, Math.max(margin, stageRect.height - screenHeight - margin));
    return {x:(localX - view.x) / view.scale, y:(localY - view.y) / view.scale};
  }
  function updateOverlayOffsets(){
    const narrow = window.innerWidth <= 860;
    const debugVisible = inputDebugState.enabled && !inputDebugPanel.hidden && narrow;
    const debugLift = debugVisible ? Math.round(inputDebugPanel.getBoundingClientRect().height + 12) : 0;
    const drawerRect = workbenchOpen && workbenchDrawer && !workbenchDrawer.hidden ? workbenchDrawer.getBoundingClientRect() : null;
    const stageRect = stage.getBoundingClientRect();
    const rightDrawerOpen = drawerRect && window.innerWidth > 520 && drawerRect.left > stageRect.left + stageRect.width * .45;
    const bottomSheetOpen = drawerRect && window.innerWidth <= 520;
    const zoomRightOffset = rightDrawerOpen ? Math.round(drawerRect.width + 18) : 0;
    const zoomDockRect = rectFromElement(zoomDock);
    const constrainedDrawerOpen = drawerRect && !bottomSheetOpen && window.innerWidth <= 1120;
    const placementVisible = placementOverlay && !placementOverlay.hidden;
    const narrowPlacementOpen = placementVisible && window.innerWidth <= 640;
    const zoomDockLift = (constrainedDrawerOpen || narrowPlacementOpen) && zoomDockRect
      ? Math.round(zoomDockRect.height + 16)
      : 0;
    const zoomLift = Math.max(debugLift, bottomSheetOpen ? Math.round(drawerRect.height + 118) : 0);
    const placementLift = Math.max(zoomLift, zoomDockLift, bottomSheetOpen ? Math.round(drawerRect.height + 20) : 0);
    const placementRect = placementOverlay && !placementOverlay.hidden ? placementOverlay.getBoundingClientRect() : null;
    const toastLift = Math.max(
      zoomLift,
      bottomSheetOpen ? Math.round(drawerRect.height + 16) : 70,
      placementRect ? placementLift + Math.round(placementRect.height + 12) : 0
    );
    const toolbarRect = rectFromElement(document.querySelector('.toolbar'));
    const toastLeftOffset = toolbarRect && toolbarRect.bottom > stageRect.top + stageRect.height * .55
      ? Math.max(0, Math.round(toolbarRect.right - stageRect.left + 12))
      : 0;
    const placementLeftOffset = toastLeftOffset;
    stage.style.setProperty('--zoom-dock-right-offset', `${zoomRightOffset}px`);
    stage.style.setProperty('--zoom-dock-lift', `${zoomLift}px`);
    stage.style.setProperty('--toast-left-offset', `${toastLeftOffset}px`);
    stage.style.setProperty('--toast-bottom-offset', `${toastLift}px`);
    stage.style.setProperty('--placement-left-offset', `${placementLeftOffset}px`);
    stage.style.setProperty('--placement-bottom-offset', `${placementLift}px`);
  }
  function temporarilyPassThroughZoomDock(duration=1600){
    stage.classList.add('zoom-dock-pass-through');
    clearTimeout(zoomDockPassThroughTimer);
    zoomDockPassThroughTimer = setTimeout(() => {
      stage.classList.remove('zoom-dock-pass-through');
    }, duration);
  }
  function openMenuFromButton(button, title, items, context){
    const point = menuPointFromButton(button);
    showMenu(title, items, point.x, point.y, {...context, trigger:'toolbar'});
  }
  function setButtonVisible(button, visible){ button.hidden = !visible; }
  function focusNodeEditor(nodeId){
    const el = nodeLayer.querySelector(`[data-id="${CSS.escape(nodeId)}"]`);
    if(!el) return;
    const title = el.querySelector('.node-title');
    if(title) title.focus();
  }
  function beginTextEdit(nodeId, field){
    const node = byId(nodeId);
    if(!node || !field) return;
    if(textEditState && textEditState.nodeId === nodeId && textEditState.field === field) return;
    commitTextEdit('switch-field');
    textEditState = {nodeId, field, before:beginMapCommand()};
  }
  function commitTextEdit(reason='text-edit'){
    if(!textEditState) return;
    const state = textEditState;
    textEditState = null;
    if(!byId(state.nodeId)) return;
    commitMapCommand('Edited block text', state.before, {render:false});
    logInputDebug('text-edit-commit', inputDebugState.lastPointer, {mode:'node', reason, target:nodeLayer.querySelector(`[data-id="${CSS.escape(state.nodeId)}"]`)});
  }
  function clearEdgeDeleteArm(){
    if(!pendingEdgeDeleteId) return;
    pendingEdgeDeleteId = null;
    updateSelectionUI();
  }
  function getGestureSurfaceKind(target){
    const el = target instanceof Element ? target : null;
    if(!el) return '';
    if(el.closest('.drag-handle')) return 'drag-handle';
    if(el.closest('.resize-handle')) return 'resize-handle';
    if(el.closest('.connection-port')) return 'connection-port';
    if(el.closest('#nodeLayer')) return 'node-layer';
    if(el.closest('#stage')) return 'stage';
    return '';
  }
  function clearGestureSelection(){
    try{
      if(document.activeElement?.closest?.('[contenteditable]')) return;
      const selection = window.getSelection?.();
      if(selection && selection.rangeCount) selection.removeAllRanges();
    }catch(e){}
  }
  function isReconnectTargetingActive(){
    return !!(reconnectTarget && edgeById(reconnectTarget.edgeId));
  }
  function isBlockTargetingActive(){
    return !!connectFrom || isReconnectTargetingActive();
  }
  function cancelBlockTargeting(options={}){
    if(isReconnectTargetingActive()) return cancelReconnect(options);
    return cancelConnect(options);
  }
  function completeBlockTargetingToBlock(nodeId, sourceEvent=null){
    if(isReconnectTargetingActive()) return completeReconnectToBlock(nodeId, sourceEvent);
    return completeConnectToBlock(nodeId, sourceEvent);
  }
  function syncGestureLockUI(){
    const active = gestureLockReasons.size > 0 || isBlockTargetingActive();
    const connecting = isBlockTargetingActive();
    document.body.classList.toggle('drag-gesture-lock', active);
    document.body.classList.toggle('connect-targeting', connecting);
    stage.classList.toggle('drag-gesture-lock', active);
    stage.classList.toggle('connect-targeting', connecting);
    nodeLayer.classList.toggle('drag-gesture-lock', active);
    nodeLayer.classList.toggle('connect-targeting', connecting);
    if(active) clearGestureSelection();
  }
  function setGestureLock(reason, active){
    if(!reason) return;
    if(active) gestureLockReasons.add(reason);
    else gestureLockReasons.delete(reason);
    syncGestureLockUI();
  }
  function noteDragInteraction(kind, pointerId, target){
    dragInteractionState = {
      active:true,
      kind,
      pointerId:Number.isFinite(pointerId) ? pointerId : null,
      target:target instanceof Element ? target : null,
      startedAt:Date.now(),
      endedAt:0,
      reason:''
    };
  }
  function finishDragInteraction(pointerId=null, reason='', target=null){
    if(!dragInteractionState) return;
    if(pointerId !== null && dragInteractionState.pointerId !== null && dragInteractionState.pointerId !== pointerId) return;
    dragInteractionState = {
      ...dragInteractionState,
      active:false,
      endedAt:Date.now(),
      reason,
      target:target instanceof Element ? target : dragInteractionState.target
    };
  }
  function getDragContextSuppression(target){
    if(!dragInteractionState) return null;
    const surfaceKind = getGestureSurfaceKind(target);
    if(!surfaceKind) return null;
    if(dragInteractionState.active){
      return {reason:'active-drag', surfaceKind};
    }
    if(Date.now() - dragInteractionState.endedAt > RECENT_DRAG_CONTEXTMENU_MS) return null;
    if(surfaceKind === dragInteractionState.kind || surfaceKind === 'node-layer' || surfaceKind === 'stage'){
      return {reason:'recent-drag', surfaceKind};
    }
    return null;
  }
  function suppressGestureContextMenu(source, mode, target, extraDetails={}){
    const suppression = getDragContextSuppression(target || source?.target);
    if(!suppression) return false;
    source.preventDefault?.();
    source.stopPropagation?.();
    logInputDebug('contextmenu-suppressed', source, {
      mode,
      reason:suppression.reason,
      target:target || source?.target,
      edgeId:extraDetails.edgeId || '',
      hitKind:extraDetails.hitKind || '',
      suppressed:'drag-gesture'
    });
    return true;
  }
  function getLongPressDebugDetails(source, reason=''){
    return {
      mode:source.type,
      reason,
      target:source.target,
      edgeId:source.type === 'edge' ? (source.edgeId || source.id) : '',
      hitKind:source.hitKind || '',
      suppressed:source.suppressed || ''
    };
  }
  function requestPointerCapture(target, pointerId, source, mode='node'){
    if(!target?.setPointerCapture) return false;
    logInputDebug('capture-requested', source, {mode, target});
    try{
      target.setPointerCapture(pointerId);
      logInputDebug('capture-acquired', source, {mode, target});
      return true;
    }catch(e){
      return false;
    }
  }
  function releasePointerCapture(target, pointerId){
    if(!target?.releasePointerCapture) return;
    try{
      if(typeof target.hasPointerCapture !== 'function' || target.hasPointerCapture(pointerId)){
        target.releasePointerCapture(pointerId);
      }
    }catch(e){}
  }
  function finishNodeDrag(source, reason='pointerup'){
    if(!dragNode) return false;
    const active = dragNode;
    const pointerId = Number.isFinite(source?.pointerId) ? source.pointerId : null;
    if(pointerId !== null && active.pointerId !== pointerId) return false;
    dragNode = null;
    setGestureLock('node-drag', false);
    suppressSelectionShelf = false;
    const dragReason = reason === 'pointercancel' && active.captureAcquired
      ? 'pointercancel-after-capture'
      : reason === 'lostpointercapture' && active.captureAcquired
        ? 'lostpointercapture-after-capture'
        : reason;
    finishDragInteraction(active.pointerId, dragReason, source?.target || active.handle);
    if(reason === 'lostpointercapture'){
      logInputDebug('capture-lost', source || inputDebugState.lastPointer, {mode:'node', reason:'lostpointercapture', target:active.captureTarget});
    }else{
      releasePointerCapture(active.captureTarget, active.pointerId);
    }
    renderEdges();
    updateSelectionUI('node-drag-end');
    logInputDebug('drag-end', source || inputDebugState.lastPointer, {mode:'node', reason:dragReason === 'pointerup' ? '' : dragReason, target:active.handle});
    const movedCount = active.items?.length || 1;
    const label = movedCount > 1 ? 'Moved blocks' : 'Moved block';
    const committed = commitMapCommand(label, active.beforeCommand, {render:false});
    if(reason === 'pointerup' && committed) showToast(movedCount > 1 ? `Moved ${plural(movedCount, 'block')}` : 'Moved');
    return true;
  }
  function armEdgeDelete(edgeId){
    pendingEdgeDeleteId = edgeId;
    updateSelectionUI();
    showToast('Tap delete again to remove this link');
  }
  function cancelLongPress(pointerId=null, reason='cancel', source=null){
    if(!longPressState) return;
    if(pointerId !== null && longPressState.pointerId !== pointerId) return;
    if(longPressState.lockReason) setGestureLock(longPressState.lockReason, false);
    logInputDebug('long-press-cancel', source || longPressState, getLongPressDebugDetails(longPressState, reason));
    clearTimeout(longPressState.timer);
    longPressState = null;
  }
  function startLongPress(target){
    cancelLongPress();
    if(dragNode || resizeNode) return;
    if(menu.classList.contains('show')) return;
    const lockReason = `long-press-${target.type}-${Number.isFinite(target.pointerId) ? target.pointerId : 'active'}`;
    setGestureLock(lockReason, true);
    logInputDebug('long-press-start', target, getLongPressDebugDetails(target));
    longPressState = {
      ...target,
      lockReason,
      timer:setTimeout(() => {
        const active = longPressState;
        if(!active || active.pointerId !== target.pointerId) return;
        if(active.lockReason) setGestureLock(active.lockReason, false);
        longPressState = null;
        logInputDebug('long-press-fire', active, getLongPressDebugDetails(active));
        closeMenu();
        if(active.type === 'canvas'){
          canvasMenu(screenToWorld(active.clientX, active.clientY), active.clientX, active.clientY, {trigger:'long-press', source:active});
        }else if(active.type === 'node'){
          const node = byId(active.id);
          if(!node) return;
          select(node.id);
          nodeMenu(node, active.clientX, active.clientY, {trigger:'long-press', source:active});
        }else if(active.type === 'edge'){
          const edge = edgeById(active.id);
          if(!edge) return;
          selectEdge(edge.id);
          edgeMenu(edge, active.clientX, active.clientY, {trigger:'long-press', source:active, hitKind:active.hitKind});
        }
      }, LONG_PRESS_DELAY)
    };
  }
  function beginCanvasPan(e){
    cancelLongPress(e.pointerId, 'pan-start', e);
    clearSelection('pan-start', e);
    panDrag = {pointerId:e.pointerId, sx:e.clientX, sy:e.clientY, x:view.x, y:view.y};
    setGestureLock('canvas-pan', true);
    stage.classList.add('is-panning');
    if(stage.setPointerCapture) stage.setPointerCapture(e.pointerId);
    logInputDebug('pan-start', e, {mode:'canvas', target:stage});
  }
  function stopCanvasPan(shouldSave=true, pointerId=null){
    if(!panDrag) return;
    if(pointerId !== null && panDrag.pointerId !== pointerId) return;
    setGestureLock('canvas-pan', false);
    logInputDebug('pan-end', inputDebugState.lastPointer, {mode:'canvas', target:stage});
    panDrag = null;
    stage.classList.remove('is-panning');
    if(shouldSave) save('View saved');
  }
  function midpoint(a, b){ return {x:(a.x + b.x) / 2, y:(a.y + b.y) / 2}; }
  function createTouchGestureState(){
    const points = [...activeTouchPoints.values()];
    if(points.length < 2) return null;
    const [a, b] = points;
    const startMid = midpoint(a, b);
    const startDistance = Math.max(1, distance(a, b));
    setGestureLock('canvas-pinch', true);
    logInputDebug('pinch-start', inputDebugState.lastPointer, {mode:'canvas', target:stage});
    return {
      startMid,
      startDistance,
      startViewX:view.x,
      startViewY:view.y,
      startScale:view.scale
    };
  }
  function updateTouchGesture(){
    if(activeTouchPoints.size < 2) return;
    if(!touchGesture) touchGesture = createTouchGestureState();
    if(!touchGesture) return;
    const [a, b] = [...activeTouchPoints.values()];
    const mid = midpoint(a, b);
    const dist = Math.max(1, distance(a, b));
    const factor = dist / touchGesture.startDistance;
    const nextScale = clamp(touchGesture.startScale * factor, .18, 2.6);
    const anchorWorldX = (touchGesture.startMid.x - touchGesture.startViewX) / touchGesture.startScale;
    const anchorWorldY = (touchGesture.startMid.y - touchGesture.startViewY) / touchGesture.startScale;
    view.scale = nextScale;
    view.x = mid.x - anchorWorldX * nextScale;
    view.y = mid.y - anchorWorldY * nextScale;
    applyView();
  }

  function installMarkers(){
    edgeDefs.innerHTML = '';
    Object.entries(relationStyles).forEach(([key, r]) => {
      const marker = document.createElementNS('http://www.w3.org/2000/svg','marker');
      marker.setAttribute('id', 'arrow-' + key);
      marker.setAttribute('markerWidth','10');
      marker.setAttribute('markerHeight','10');
      marker.setAttribute('refX','8.5');
      marker.setAttribute('refY','3');
      marker.setAttribute('orient','auto');
      marker.setAttribute('markerUnits','strokeWidth');
      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d','M0,0 L0,6 L9,3 z');
      path.setAttribute('fill', r.color);
      marker.appendChild(path);
      edgeDefs.appendChild(marker);
    });
  }

  function applyView(){
    view.scale = clamp(Number(view.scale) || 1, .18, 2.6);
    view.x = Number(view.x) || 0; view.y = Number(view.y) || 0;
    const dpr = window.devicePixelRatio || 1;
    const px = Math.round(view.x * dpr) / dpr;
    const py = Math.round(view.y * dpr) / dpr;
    // Stable crisp zoom model:
    // 1) The outer world only translates, so panning and zoom anchoring stay stable.
    // 2) The inner world-scale layer zooms the content. In Chromium/Edge, CSS zoom
    //    keeps text crisper than transform-scaling, without scaling the translation offset.
    world.style.left = '0px';
    world.style.top = '0px';
    world.style.transform = `translate(${px}px, ${py}px)`;
    if(cssZoomOK){
      worldScale.style.zoom = String(view.scale);
      worldScale.style.transform = 'none';
    }else{
      worldScale.style.zoom = '1';
      worldScale.style.transform = `scale(${view.scale})`;
    }
    const grid = Math.max(5, 24 * view.scale);
    stage.style.setProperty('--grid-size', grid + 'px');
    stage.style.setProperty('--grid-x', (view.x % grid) + 'px');
    stage.style.setProperty('--grid-y', (view.y % grid) + 'px');
    if(zoomPercent) zoomPercent.textContent = Math.round(view.scale * 100) + '%';
    positionSelectionShelf();
  }
  function screenToWorld(clientX, clientY){ const r = stage.getBoundingClientRect(); return {x:(clientX - r.left - view.x) / view.scale, y:(clientY - r.top - view.y) / view.scale}; }
  function zoomAt(clientX, clientY, factor, shouldSave=true){
    const r = stage.getBoundingClientRect();
    const before = screenToWorld(clientX, clientY);
    const next = clamp(view.scale * factor, .18, 2.6);
    view.x = clientX - r.left - before.x * next;
    view.y = clientY - r.top - before.y * next;
    view.scale = next;
    applyView();
    if(shouldSave) save('View saved');
  }
  function zoomCenter(factor, shouldSave=true){ const r = stage.getBoundingClientRect(); zoomAt(r.left + r.width/2, r.top + r.height/2, factor, shouldSave); }
  function setZoomPercent(percent){
    const p = clamp(Number(percent) || 100, 18, 260) / 100;
    const r = stage.getBoundingClientRect();
    const cx = r.left + r.width/2, cy = r.top + r.height/2;
    const before = screenToWorld(cx, cy);
    view.x = r.width/2 - before.x * p;
    view.y = r.height/2 - before.y * p;
    view.scale = p;
    applyView(); save('Zoom set'); showToast('Zoom ' + Math.round(p*100) + '%');
  }
  function promptZoomPercent(){
    const current = Math.round(view.scale * 100);
    const val = prompt('Zoom percentage (18–260):', String(current));
    if(val === null) return;
    const num = parseFloat(String(val).replace('%',''));
    if(Number.isFinite(num)) setZoomPercent(num);
  }
  function nodeDims(node){
    const w = Number(node.w) || 268, h = Number(node.h) || 145;
    return node.shape === 'oval' ? {w:Math.max(w,340), h:Math.max(h,172)} : {w, h};
  }
  function nodeRect(node){ const d = nodeDims(node); return {x:node.x, y:node.y, w:d.w, h:d.h, cx:node.x+d.w/2, cy:node.y+d.h/2}; }
  function bbox(){
    if(!data.nodes.length) return {x:0,y:0,w:800,h:500,cx:0,cy:0};
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    data.nodes.forEach(n => { const r = nodeRect(n); minX = Math.min(minX, r.x); minY = Math.min(minY, r.y); maxX = Math.max(maxX, r.x+r.w); maxY = Math.max(maxY, r.y+r.h); });
    const pad = 120; minX -= pad; minY -= pad; maxX += pad; maxY += pad;
    return {x:minX,y:minY,w:maxX-minX,h:maxY-minY,cx:(minX+maxX)/2,cy:(minY+maxY)/2};
  }
  function recenter(){
    const b = bbox(), r = stage.getBoundingClientRect();
    const s = clamp(Math.min((r.width-150)/Math.max(1,b.w), (r.height-130)/Math.max(1,b.h)), .28, 1.1);
    view.scale = s; view.x = r.width/2 - b.cx*s; view.y = r.height/2 - b.cy*s;
    applyView(); save('View centered'); showToast('Map centered');
  }
  function resetView(){
    view.scale = 1;
    const r = stage.getBoundingClientRect(); const n = byId(selectedId) || byId('core') || data.nodes[0];
    if(n){ const nr = nodeRect(n); view.x = r.width/2 - nr.cx; view.y = r.height/2 - nr.cy; } else { view.x = r.width/2; view.y = r.height/2; }
    applyView(); save('View reset'); showToast('View reset');
  }
  function isDefaultViewState(candidate){
    return !candidate || (Number(candidate.x) === 0 && Number(candidate.y) === 0 && Number(candidate.scale || 1) === 1);
  }
  function positionFreshStarterView(){
    if(!isFreshStarterMap() || !isDefaultViewState(data.view)) return false;
    const n = byId('core') || data.nodes[0];
    if(!n) return false;
    const stageRect = stage.getBoundingClientRect();
    if(stageRect.width < 120 || stageRect.height < 120) return false;
    const toolbarRect = document.querySelector('.toolbar')?.getBoundingClientRect();
    const toolbarRight = toolbarRect ? toolbarRect.right - stageRect.left : 88;
    const leftGuard = clamp(toolbarRight + 24, 24, Math.max(24, stageRect.width * 0.42));
    const workbenchGuard = !starterHidden ? Math.min(405, Math.max(320, stageRect.width * 0.38)) : 0;
    const rightGuard = stageRect.width >= 720 ? Math.max(Math.min(390, Math.max(260, stageRect.width * 0.34)), workbenchGuard) : 24;
    const topGuard = stageRect.width >= 720 ? 30 : 24;
    const nr = nodeRect(n);
    const availableRight = Math.max(leftGuard + nr.w + 24, stageRect.width - rightGuard);
    const targetLeft = clamp(leftGuard + 8, leftGuard, Math.max(leftGuard, availableRight - nr.w));
    const targetTop = clamp(topGuard, 20, Math.max(20, stageRect.height - nr.h - 170));
    view = {x:targetLeft - nr.x, y:targetTop - nr.y, scale:1};
    data.view = view;
    syncCurrentPage();
    return true;
  }
  function centerOnNode(nodeId){
    const n = byId(nodeId); if(!n) return;
    const r = stage.getBoundingClientRect(); const nr = nodeRect(n);
    view.x = r.width/2 - nr.cx*view.scale; view.y = r.height/2 - nr.cy*view.scale;
    applyView(); save('View saved');
  }
  function combineWorldRects(rects){
    if(!rects.length) return null;
    const bounds = rects.reduce((acc, rect) => {
      acc.left = Math.min(acc.left, rect.left);
      acc.top = Math.min(acc.top, rect.top);
      acc.right = Math.max(acc.right, rect.right);
      acc.bottom = Math.max(acc.bottom, rect.bottom);
      return acc;
    }, {left:Infinity, top:Infinity, right:-Infinity, bottom:-Infinity});
    bounds.width = bounds.right - bounds.left;
    bounds.height = bounds.bottom - bounds.top;
    bounds.cx = (bounds.left + bounds.right) / 2;
    bounds.cy = (bounds.top + bounds.bottom) / 2;
    return bounds;
  }
  function getSelectionWorldBounds(){
    syncSelectionAliases();
    const rects = [];
    selectedNodeIds.forEach(nodeId => {
      const node = byId(nodeId);
      if(!node) return;
      const rect = nodeRect(node);
      rects.push({left:rect.x, top:rect.y, right:rect.x + rect.w, bottom:rect.y + rect.h});
    });
    selectedEdgeIds.forEach(edgeId => {
      const edge = edgeById(edgeId);
      if(!edge) return;
      [byId(edge.from), byId(edge.to)].filter(Boolean).forEach(node => {
        const rect = nodeRect(node);
        rects.push({left:rect.x, top:rect.y, right:rect.x + rect.w, bottom:rect.y + rect.h});
      });
      const layout = getEdgeLayout(edge);
      if(layout){
        rects.push({left:layout.mid.x - 24, top:layout.mid.y - 20, right:layout.mid.x + 24, bottom:layout.mid.y + 20});
      }
    });
    return combineWorldRects(rects);
  }
  function zoomToSelection(){
    const bounds = getSelectionWorldBounds();
    if(!bounds){
      showToast('Select a block to zoom to selection.');
      return false;
    }
    const safe = getCanvasSafeArea({
      includeShelf:true,
      includeToast:false,
      nodeWidth:bounds.width,
      nodeHeight:bounds.height,
      margin:28
    });
    const padding = clamp(Math.min(safe.width, safe.height) * .12, 42, 96);
    const availableWidth = Math.max(90, safe.width - padding * 2);
    const availableHeight = Math.max(90, safe.height - padding * 2);
    const fitScale = Math.min(
      availableWidth / Math.max(1, bounds.width),
      availableHeight / Math.max(1, bounds.height)
    );
    view.scale = clamp(Math.min(fitScale, 1.6), .18, 2.6);
    view.x = safe.left + safe.width / 2 - bounds.cx * view.scale;
    view.y = safe.top + safe.height / 2 - bounds.cy * view.scale;
    applyView();
    renderEdges();
    save('View saved');
    showToast('Zoomed to selection');
    requestAnimationFrame(positionSelectionShelf);
    return true;
  }

  function nodeIsVisible(node, margin=24){
    if(!node) return false;
    const r = stage.getBoundingClientRect();
    if(r.width < 80 || r.height < 80) return true;
    const nr = nodeRect(node);
    const left = view.x + nr.x * view.scale;
    const top = view.y + nr.y * view.scale;
    const right = view.x + (nr.x + nr.w) * view.scale;
    const bottom = view.y + (nr.y + nr.h) * view.scale;
    return right > margin && left < r.width - margin && bottom > margin && top < r.height - margin;
  }
  function anyNodeVisible(){ return data.nodes.some(n => nodeIsVisible(n, 18)); }
  function recoverViewIfBlank(reason=''){
    if(!data.nodes.length) return false;
    const r = stage.getBoundingClientRect();
    if(r.width < 120 || r.height < 120) return false;
    if(anyNodeVisible()) return false;
    // A blank canvas normally means an old saved pan/zoom offset put the map offscreen.
    // Recover without deleting or changing any blocks.
    view.scale = 1;
    const n = byId(selectedId) || byId('core') || data.nodes[0];
    if(n){ const nr = nodeRect(n); view.x = r.width/2 - nr.cx; view.y = r.height/2 - nr.cy; }
    else { view.x = r.width/2; view.y = r.height/2; }
    applyView();
    save('View recovered');
    if(reason) showToast('View recovered');
    setStatus('View recovered');
    return true;
  }
  function recoverViewSoon(reason=''){
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if(recoverViewIfBlank(reason)){ renderEdges(); applyFocus(); }
      else if(reason === 'startup') setStatus('Map ready');
    }));
  }

  function render(){ renderPageControls(); renderNodes(); requestAnimationFrame(() => { renderEdges(); applyFocus(); }); updateSelectionUI(); applyView(); syncGestureLockUI(); renderMapStarter(); renderWorkbench(); }
  function renderNodes(){
    nodeLayer.innerHTML = '';
    data.nodes.forEach(n => {
      const el = document.createElement('article');
      const nodeType = nodeTypes.includes(n.nodeType) ? n.nodeType : 'concept';
      const documentRecord = nodeType === 'document' ? documentById(n.documentId) : null;
      el.className = `map-node ${n.group} shape-${n.shape} imp-${n.importance} type-${nodeType}`;
      if(selectedNodeIds.has(n.id)) el.classList.add('selected');
      const activeReconnectEdge = isReconnectTargetingActive() ? edgeById(reconnectTarget.edgeId) : null;
      const reconnectChangingNodeId = activeReconnectEdge
        ? (reconnectTarget.mode === 'change-source' ? activeReconnectEdge.from : activeReconnectEdge.to)
        : '';
      const reconnectFixedNodeId = activeReconnectEdge
        ? (reconnectTarget.mode === 'change-source' ? activeReconnectEdge.to : activeReconnectEdge.from)
        : '';
      if(connectFrom === n.id || reconnectChangingNodeId === n.id) el.classList.add('connect-source');
      if((connectFrom && connectFrom !== n.id) || (activeReconnectEdge && n.id !== reconnectChangingNodeId && n.id !== reconnectFixedNodeId)) el.classList.add('connect-target');
      el.dataset.id = n.id;
      el.dataset.nodeType = nodeType;
      if(n.documentId) el.dataset.documentId = n.documentId;
      el.style.left = n.x + 'px'; el.style.top = n.y + 'px'; el.style.width = n.w + 'px'; el.style.height = n.h + 'px';
      const content = document.createElement('div'); content.className = 'node-content';
      const top = document.createElement('div'); top.className = 'node-top';
      const title = document.createElement('h3'); title.className = 'node-title'; title.contentEditable = nodeType === 'document' ? 'false' : 'plaintext-only'; title.spellcheck = false; if(nodeType !== 'document') title.dataset.field = 'title'; title.textContent = documentRecord?.title || n.title || 'Untitled block';
      const handle = document.createElement('button'); handle.className = 'drag-handle'; handle.type = 'button'; handle.title = 'Drag block'; handle.setAttribute('aria-label','Drag block');
      const handleIcon = document.createElement('span'); handleIcon.className = 'drag-handle-icon'; handleIcon.setAttribute('aria-hidden', 'true'); handleIcon.textContent = '↕';
      handle.append(handleIcon);
      top.append(title, handle);
      const body = document.createElement('div'); body.className = 'node-body'; body.contentEditable = 'plaintext-only'; body.spellcheck = false; body.dataset.field = 'body'; body.textContent = n.body || documentRecord?.description || 'Rewrite this in your own words.';
      const tag = document.createElement('span'); tag.className = 'node-tag'; tag.textContent = n.tag || 'custom';
      const resize = document.createElement('span'); resize.className = 'resize-handle'; resize.title = 'Resize block'; resize.setAttribute('aria-hidden','true');
      content.append(top, body, tag);
      if(nodeType === 'document'){
        const badge = document.createElement('span');
        badge.className = 'document-type-badge';
        badge.textContent = documentRecord ? documentRecord.type.toUpperCase() : 'DOCUMENT';
        const detailButton = document.createElement('button');
        detailButton.className = 'document-detail-button';
        detailButton.type = 'button';
        detailButton.dataset.action = 'document-detail';
        detailButton.textContent = 'Details';
        detailButton.setAttribute('aria-label', 'Open document details');
        content.append(badge, detailButton);
      }
      el.append(content, resize);
      ['top','right','bottom','left'].forEach(side => {
        const port = document.createElement('button');
        port.className = 'connection-port port-' + side;
        port.type = 'button';
        port.dataset.nodeId = n.id;
        port.dataset.portSide = side;
        port.title = `Add linked block from ${side} side of ${documentRecord?.title || n.title || 'this block'}, or connect an existing block`;
        port.setAttribute('aria-label', port.title);
        el.appendChild(port);
      });
      nodeLayer.appendChild(el);
    });
  }
  function edgePath(a,b,shape){ return edgeGeometry(a,b,shape).d; }
  function edgeMid(a,b,shape){ return edgeGeometry(a,b,shape).mid; }
  function getEdgeLayout(edge){
    if(!edge) return null;
    const from = byId(edge.from), to = byId(edge.to);
    if(!from || !to) return null;
    const style = relationStyles[edge.relation] || relationStyles.causes;
    const fromRect = nodeRect(from), toRect = nodeRect(to);
    const start = portPoint(fromRect, edge.fromPort || 'auto', toRect);
    const end = portPoint(toRect, edge.toPort || 'auto', fromRect);
    const geometry = edgeGeometry(start, end, edge.shape || 'curve');
    return {edge, from, to, style, fromRect, toRect, start, end, path:geometry.d, mid:geometry.mid};
  }
  function renderEdges(){
    [...edgeLayer.querySelectorAll('g.edge-group')].forEach(g => g.remove());
    edgeLabelLayer.innerHTML = '';
    data.edges.forEach(e => {
      const layout = getEdgeLayout(e);
      if(!layout) return;
      const g = document.createElementNS('http://www.w3.org/2000/svg','g'); g.setAttribute('class','edge-group'); g.dataset.edgeId = e.id;
      const hit = document.createElementNS('http://www.w3.org/2000/svg','path');
      hit.setAttribute('class', 'edge-hit');
      hit.dataset.edgeId = e.id;
      hit.setAttribute('d', layout.path);
      hit.setAttribute('stroke-width', String(Math.max(window.matchMedia('(pointer:coarse)').matches ? EDGE_HIT_WIDTH_COARSE : EDGE_HIT_WIDTH, layout.style.base + e.strength*.58 + 12)));
      g.appendChild(hit);
      const p = document.createElementNS('http://www.w3.org/2000/svg','path');
      p.setAttribute('class', 'edge' + (selectedEdgeIds.has(e.id) ? ' selected' : ''));
      p.setAttribute('d', layout.path); p.setAttribute('stroke', layout.style.color); p.setAttribute('stroke-width', String(layout.style.base + e.strength*.58));
      if(layout.style.dash) p.setAttribute('stroke-dasharray', layout.style.dash);
      g.appendChild(p); edgeLayer.appendChild(g);
      const label = document.createElement('button');
      label.className = 'edge-label' + (selectedEdgeIds.has(e.id) ? ' selected' : '');
      label.type = 'button'; label.dataset.edgeId = e.id;
      label.style.left = layout.mid.x + 'px'; label.style.top = layout.mid.y + 'px'; label.style.borderColor = layout.style.color + '66';
      label.textContent = e.label || layout.style.label;
      label.title = 'Right-click or long-press to modify this relationship, connection side, or line route';
      edgeLabelLayer.appendChild(label);
    });
    applyReviewHighlights();
  }
  function getSelectionAnchor(){
    syncSelectionAliases();
    const selectedNodes = Array.from(selectedNodeIds).map(nodeId => byId(nodeId)).filter(Boolean);
    if(selectedNodes.length > 1){
      const bounds = selectedNodes.reduce((acc, node) => {
        const rect = nodeRect(node);
        acc.left = Math.min(acc.left, rect.x);
        acc.top = Math.min(acc.top, rect.y);
        acc.right = Math.max(acc.right, rect.x + rect.w);
        acc.bottom = Math.max(acc.bottom, rect.y + rect.h);
        return acc;
      }, {left:Infinity, top:Infinity, right:-Infinity, bottom:-Infinity});
      return worldToStage((bounds.left + bounds.right) / 2, bounds.top);
    }
    if(selectedId){
      const node = byId(selectedId);
      if(node){
        const rect = nodeRect(node);
        return worldToStage(rect.cx, rect.y);
      }
    }
    if(selectedEdgeId){
      const layout = getEdgeLayout(edgeById(selectedEdgeId));
      if(layout){
        return worldToStage(layout.mid.x, layout.mid.y);
      }
    }
    return null;
  }
  function getSelectionScreenRect(){
    syncSelectionAliases();
    const rects = [];
    selectedNodeIds.forEach(nodeId => {
      const node = byId(nodeId);
      if(node) rects.push(nodeScreenRectFromWorld(node.x, node.y, nodeDims(node).w, nodeDims(node).h));
    });
    selectedEdgeIds.forEach(edgeId => {
      const edge = edgeById(edgeId);
      const layout = getEdgeLayout(edge);
      if(layout) rects.push({left:layout.mid.x * view.scale + view.x - 22, top:layout.mid.y * view.scale + view.y - 18, right:layout.mid.x * view.scale + view.x + 22, bottom:layout.mid.y * view.scale + view.y + 18, width:44, height:36});
      [byId(edge?.from), byId(edge?.to)].filter(Boolean).forEach(node => {
        rects.push(nodeScreenRectFromWorld(node.x, node.y, nodeDims(node).w, nodeDims(node).h));
      });
    });
    if(!rects.length) return null;
    const bounds = rects.reduce((acc, rect) => {
      acc.left = Math.min(acc.left, rect.left);
      acc.top = Math.min(acc.top, rect.top);
      acc.right = Math.max(acc.right, rect.right);
      acc.bottom = Math.max(acc.bottom, rect.bottom);
      return acc;
    }, {left:Infinity, top:Infinity, right:-Infinity, bottom:-Infinity});
    bounds.width = bounds.right - bounds.left;
    bounds.height = bounds.bottom - bounds.top;
    return bounds;
  }
  function positionSelectionShelf(){
    if(selectionShelf.hidden || !selectionShelf.classList.contains('show')) return;
    selectionShelf.classList.remove('anchored', 'docked', 'tight');
    selectionShelf.style.left = '';
    selectionShelf.style.top = '';
    selectionShelf.style.bottom = '';
    const anchor = getSelectionAnchor();
    let width = selectionShelf.offsetWidth;
    let height = selectionShelf.offsetHeight;
    if(!width || !height){
      selectionShelf.classList.add('docked');
      return;
    }
    const safe = getCanvasSafeArea({includeShelf:false, includeToast:true, nodeWidth:width / Math.max(view.scale, .01), nodeHeight:height / Math.max(view.scale, .01), margin:14});
    const drawerOpenForShelf = Boolean(workbenchDrawer && !workbenchDrawer.hidden);
    const selectedNode = selectedId ? byId(selectedId) : null;
    const documentShelfNeedsCompact = selectedNode?.nodeType === 'document' && window.innerWidth <= 720;
    if(width > safe.width || drawerOpenForShelf || documentShelfNeedsCompact){
      selectionShelf.classList.add('tight');
      width = selectionShelf.offsetWidth || width;
      height = selectionShelf.offsetHeight || height;
    }
    const gap = workbenchOpen ? 44 : 30;
    const compactGap = Math.min(gap, 20);
    let selectedRect = getSelectionScreenRect();
    let effectiveAnchor = anchor;
    if(selectedNode && selectedNodeIds.size === 1 && selectedEdgeIds.size === 0){
      const nodeElement = nodeLayer.querySelector(`[data-id="${CSS.escape(selectedNode.id)}"]`);
      const nodeBox = rectFromElement(nodeElement);
      if(nodeBox){
        const stageRect = stage.getBoundingClientRect();
        selectedRect = {
          left:nodeBox.left - stageRect.left,
          top:nodeBox.top - stageRect.top,
          right:nodeBox.right - stageRect.left,
          bottom:nodeBox.bottom - stageRect.top,
          width:nodeBox.width,
          height:nodeBox.height
        };
        effectiveAnchor = {x:selectedRect.left + selectedRect.width / 2, y:selectedRect.top};
      }
    }
    const shelfRect = (left, top) => ({left, top, right:left + width, bottom:top + height, width, height});
    const insideSafe = rect => rect.left >= safe.left && rect.right <= safe.right && rect.top >= safe.top && rect.bottom <= safe.bottom;
    const insideStage = rect => rect.left >= 8 && rect.right <= safe.stageRect.width - 8 && rect.top >= 8 && rect.bottom <= safe.stageRect.height - 8;
    const overlayRects = getPlacementAvoidRects({includeShelf:false, includeToast:true, includeNodes:false});
    const clearOverlays = rect => !overlayRects.some(overlayRect => rectsOverlap(rect, overlayRect, 8));
    const clearNode = rect => !selectedRect || !rectsOverlap(rect, selectedRect, 16);
    const place = rect => {
      selectionShelf.classList.add('anchored');
      selectionShelf.style.left = Math.round(rect.left + (stage.scrollLeft || 0)) + 'px';
      selectionShelf.style.top = Math.round(rect.top + (stage.scrollTop || 0)) + 'px';
      selectionShelf.style.bottom = 'auto';
    };
    const fallbackLeft = clamp((effectiveAnchor?.x ?? safe.left + safe.width / 2) - width / 2, safe.left, Math.max(safe.left, safe.right - width));
    const candidates = [];
    if(effectiveAnchor && selectedRect){
      candidates.push(shelfRect(clamp(effectiveAnchor.x - width / 2, safe.left, Math.max(safe.left, safe.right - width)), selectedRect.top - height - gap));
      candidates.push(shelfRect(clamp(effectiveAnchor.x - width / 2, safe.left, Math.max(safe.left, safe.right - width)), selectedRect.bottom + gap));
      if(compactGap < gap){
        candidates.push(shelfRect(clamp(effectiveAnchor.x - width / 2, safe.left, Math.max(safe.left, safe.right - width)), selectedRect.top - height - compactGap));
        candidates.push(shelfRect(clamp(effectiveAnchor.x - width / 2, safe.left, Math.max(safe.left, safe.right - width)), selectedRect.bottom + compactGap));
      }
      const sideTop = clamp(selectedRect.top + selectedRect.height / 2 - height / 2, safe.top, Math.max(safe.top, safe.bottom - height));
      candidates.push(shelfRect(selectedRect.left - width - gap, sideTop));
      candidates.push(shelfRect(selectedRect.right + gap, sideTop));
      if(compactGap < gap){
        candidates.push(shelfRect(selectedRect.left - width - compactGap, sideTop));
        candidates.push(shelfRect(selectedRect.right + compactGap, sideTop));
      }
    }else if(effectiveAnchor){
      candidates.push(shelfRect(clamp(effectiveAnchor.x - width / 2, safe.left, Math.max(safe.left, safe.right - width)), effectiveAnchor.y - height - gap));
      candidates.push(shelfRect(clamp(effectiveAnchor.x - width / 2, safe.left, Math.max(safe.left, safe.right - width)), effectiveAnchor.y + gap));
      if(compactGap < gap){
        candidates.push(shelfRect(clamp(effectiveAnchor.x - width / 2, safe.left, Math.max(safe.left, safe.right - width)), effectiveAnchor.y - height - compactGap));
        candidates.push(shelfRect(clamp(effectiveAnchor.x - width / 2, safe.left, Math.max(safe.left, safe.right - width)), effectiveAnchor.y + compactGap));
      }
    }
    candidates.push(shelfRect(fallbackLeft, safe.top));
    candidates.push(shelfRect(fallbackLeft, Math.max(safe.top, safe.bottom - height)));
    candidates.push(shelfRect(safe.left, safe.top));
    candidates.push(shelfRect(Math.max(safe.left, safe.right - width), safe.top));
    candidates.push(shelfRect(safe.left, Math.max(safe.top, safe.bottom - height)));
    candidates.push(shelfRect(Math.max(safe.left, safe.right - width), Math.max(safe.top, safe.bottom - height)));
    const chosen = candidates.find(rect => insideSafe(rect) && clearNode(rect))
      || candidates.find(rect => insideStage(rect) && clearNode(rect) && clearOverlays(rect))
      || (!selectedRect ? candidates.find(insideSafe) : null);
    if(chosen){
      place(chosen);
      return;
    }
    if(selectedRect){
      const below = selectedRect.bottom + gap;
      const above = selectedRect.top - height - gap;
      const top = below + height <= safe.bottom
        ? below
        : (above >= safe.top ? above : clamp(below, safe.top, Math.max(safe.top, safe.bottom - height)));
      place(shelfRect(fallbackLeft, top));
      return;
    }
    selectionShelf.classList.add('docked');
  }
  function applyFocus(){
    document.body.classList.toggle('focus-mode', focusMode);
    if(!focusMode || !selectedId){
      nodeLayer.querySelectorAll('.map-node').forEach(el => el.classList.remove('dimmed'));
      edgeLayer.querySelectorAll('.edge').forEach(el => el.classList.remove('dimmed'));
      edgeLabelLayer.querySelectorAll('.edge-label').forEach(el => el.classList.remove('dimmed'));
      applyReviewHighlights();
      return;
    }
    const keep = new Set([selectedId]);
    const edgeKeep = new Set();
    data.edges.forEach(e => { if(e.from === selectedId || e.to === selectedId){ keep.add(e.from); keep.add(e.to); edgeKeep.add(e.id); } });
    nodeLayer.querySelectorAll('.map-node').forEach(el => el.classList.toggle('dimmed', !keep.has(el.dataset.id)));
    edgeLayer.querySelectorAll('g.edge-group .edge').forEach(p => { const gid = p.parentNode.dataset.edgeId; p.classList.toggle('dimmed', !edgeKeep.has(gid)); });
    edgeLabelLayer.querySelectorAll('.edge-label').forEach(el => el.classList.toggle('dimmed', !edgeKeep.has(el.dataset.edgeId)));
    applyReviewHighlights();
  }

  function select(nodeId, reason='select-node'){
    if(!byId(nodeId)) return;
    setSelectionFromIds([nodeId], [], reason);
  }
  function selectEdge(edgeId, reason='select-edge'){
    const e = edgeById(edgeId); if(!e) return;
    setSelectionFromIds([], [edgeId], reason);
  }
  function updateSelectionUI(reason='selection-change'){
    syncSelectionAliases();
    const counts = selectionCounts();
    const node = counts.nodes === 1 && counts.edges === 0 ? byId(selectedId) : null;
    const edge = counts.edges === 1 && counts.nodes === 0 ? edgeById(selectedEdgeId) : null;
    const hasSelection = counts.total > 0;
    const hasCopyableBlocks = counts.nodes > 0;
    const hasClipboard = !!(mapClipboard && mapClipboard.nodes && mapClipboard.nodes.length);
    selectionShelf.classList.toggle('collapsed', shelfCollapsed);
    shelfToggle.textContent = shelfCollapsed ? '▸' : '▾';
    shelfToggle.title = shelfCollapsed ? 'Expand selected item toolbar' : 'Collapse selected item toolbar';
    shelfToggle.setAttribute('aria-label', shelfToggle.title);
    shelfCenter.title = 'Zoom to selection';
    shelfCenter.setAttribute('aria-label', 'Zoom to selection');
    if(node){
      pendingEdgeDeleteId = null;
      selectionLabel.textContent = 'Selection:';
      selectedTitle.textContent = '1 block';
      selectionShelf.dataset.mode = 'node';
      selectionShelf.setAttribute('aria-label', 'Selection toolbar for selected block');
      setButtonVisible(shelfAddLinked, true);
      setButtonVisible(shelfEdit, true);
      setButtonVisible(shelfCopy, true);
      setButtonVisible(shelfPaste, hasClipboard);
      setButtonVisible(shelfDuplicate, true);
      setButtonVisible(shelfConnect, true);
      setButtonVisible(shelfStyle, true);
      setButtonVisible(shelfCenter, true);
      setButtonVisible(shelfFocus, true);
      setButtonVisible(shelfLabel, false);
      setButtonVisible(shelfRelation, false);
      setButtonVisible(shelfStrength, false);
      setButtonVisible(shelfRoute, false);
      setButtonVisible(shelfChangeSource, false);
      setButtonVisible(shelfChangeTarget, false);
      setButtonVisible(shelfInsertBetween, false);
      setButtonVisible(shelfFromPort, false);
      setButtonVisible(shelfToPort, false);
      setButtonVisible(shelfReverse, false);
      setButtonVisible(shelfClear, true);
      setButtonVisible(shelfDelete, true);
      shelfDuplicate.disabled = false;
      shelfCopy.disabled = false;
      shelfPaste.disabled = !hasClipboard;
      shelfDelete.textContent = '⌫';
      shelfDelete.title = 'Delete selected block';
      shelfDelete.setAttribute('aria-label', 'Delete selected block');
    }else if(edge){
      if(pendingEdgeDeleteId && pendingEdgeDeleteId !== edge.id) pendingEdgeDeleteId = null;
      selectionLabel.textContent = 'Selection:';
      selectedTitle.textContent = '1 line';
      selectionShelf.dataset.mode = 'edge';
      selectionShelf.setAttribute('aria-label', 'Selection toolbar for selected relationship line');
      setButtonVisible(shelfAddLinked, false);
      setButtonVisible(shelfEdit, false);
      setButtonVisible(shelfCopy, true);
      setButtonVisible(shelfPaste, hasClipboard);
      setButtonVisible(shelfDuplicate, true);
      setButtonVisible(shelfConnect, false);
      setButtonVisible(shelfStyle, false);
      setButtonVisible(shelfCenter, true);
      setButtonVisible(shelfFocus, false);
      setButtonVisible(shelfLabel, true);
      setButtonVisible(shelfRelation, true);
      setButtonVisible(shelfStrength, true);
      setButtonVisible(shelfRoute, true);
      setButtonVisible(shelfChangeSource, true);
      setButtonVisible(shelfChangeTarget, true);
      setButtonVisible(shelfInsertBetween, true);
      setButtonVisible(shelfFromPort, true);
      setButtonVisible(shelfToPort, true);
      setButtonVisible(shelfReverse, true);
      setButtonVisible(shelfClear, true);
      setButtonVisible(shelfDelete, true);
      shelfDuplicate.disabled = true;
      shelfCopy.disabled = false;
      shelfPaste.disabled = !hasClipboard;
      shelfDelete.textContent = '⌫';
      shelfDelete.title = 'Delete selected line';
      shelfDelete.setAttribute('aria-label', shelfDelete.title);
    }else if(hasSelection){
      pendingEdgeDeleteId = null;
      selectionLabel.textContent = 'Selection:';
      selectedTitle.textContent = selectionSummary();
      selectionShelf.dataset.mode = currentSelectionMode();
      selectionShelf.setAttribute('aria-label', 'Selection toolbar for selected blocks and relationship lines');
      setButtonVisible(shelfAddLinked, false);
      setButtonVisible(shelfEdit, false);
      setButtonVisible(shelfCopy, true);
      setButtonVisible(shelfPaste, hasClipboard);
      setButtonVisible(shelfDuplicate, true);
      setButtonVisible(shelfConnect, false);
      setButtonVisible(shelfStyle, false);
      setButtonVisible(shelfCenter, true);
      setButtonVisible(shelfFocus, false);
      setButtonVisible(shelfLabel, false);
      setButtonVisible(shelfRelation, false);
      setButtonVisible(shelfStrength, false);
      setButtonVisible(shelfRoute, false);
      setButtonVisible(shelfChangeSource, false);
      setButtonVisible(shelfChangeTarget, false);
      setButtonVisible(shelfInsertBetween, false);
      setButtonVisible(shelfFromPort, false);
      setButtonVisible(shelfToPort, false);
      setButtonVisible(shelfReverse, false);
      setButtonVisible(shelfClear, true);
      setButtonVisible(shelfDelete, true);
      shelfDuplicate.disabled = !hasCopyableBlocks;
      shelfCopy.disabled = false;
      shelfPaste.disabled = !hasClipboard;
      shelfDelete.textContent = '⌫';
      shelfDelete.title = `Delete ${selectionSummary()}`;
      shelfDelete.setAttribute('aria-label', shelfDelete.title);
    }else{
      pendingEdgeDeleteId = null;
      setButtonVisible(shelfCopy, false);
      setButtonVisible(shelfPaste, hasClipboard);
      setButtonVisible(shelfCenter, false);
      setButtonVisible(shelfClear, false);
      shelfDuplicate.disabled = false;
      shelfCopy.disabled = false;
      shelfPaste.disabled = !hasClipboard;
    }
    setSelectionShelfRendered(hasSelection && !suppressSelectionShelf, reason);
    shelfDelete.classList.toggle('danger-armed', false);
    document.getElementById('btnConnect').classList.toggle('active', isBlockTargetingActive());
    document.getElementById('btnFocus').classList.toggle('active', focusMode);
    shelfFocus.classList.toggle('active', focusMode && !!node);
    updateHistoryControls();
  }
  function updatePrompt(){
    const counts = selectionCounts();
    if(counts.total > 1){
      promptText.textContent = `Teach-back: explain why this ${selectionSummary()} belongs together.`;
      return;
    }
    if(selectedEdgeId){
      const e = edgeById(selectedEdgeId), style = e && relationStyles[e.relation];
      if(e) promptText.textContent = `Teach-back: explain why “${byId(e.from)?.title || 'block'}” ${e.label || style.label} “${byId(e.to)?.title || 'block'}”.`;
      return;
    }
    if(selectedId){
      const n = byId(selectedId);
      promptText.textContent = `Teach-back: explain “${n.title}” in one sentence, then say which block should come before it.`;
      return;
    }
    promptText.textContent = 'Move one block or change one link, then say aloud: “This belongs here because…”';
  }
  function selectedMovableNodes(){
    syncSelectionAliases();
    return Array.from(selectedNodeIds).map(nodeId => byId(nodeId)).filter(Boolean);
  }
  function nudgeSelectedBlocks(dx, dy){
    const nodes = selectedMovableNodes();
    if(!nodes.length) return false;
    const before = beginMapCommand();
    nodes.forEach(node => {
      node.x = Math.round(Number(node.x || 0) + dx);
      node.y = Math.round(Number(node.y || 0) + dy);
    });
    render();
    commitMapCommand(nodes.length === 1 ? 'Nudged block' : 'Nudged blocks', before, {render:false});
    updateSelectionUI('nudge-selection');
    return true;
  }

  function addNodeAt(x,y, opts={}){
    const before = opts.history === false ? null : beginMapCommand();
    const nodeType = nodeTypes.includes(opts.nodeType) ? opts.nodeType : 'concept';
    const newNode = { id:id(), title:opts.title || (opts.linkFrom ? 'New linked idea' : 'New block'), body:opts.body || 'Rewrite this in your own words.', group:opts.group || 'blue', shape:opts.shape || 'card', importance:2, x:Math.round(x), y:Math.round(y), w:opts.w || 268, h:opts.h || 145, tag:opts.tag || (nodeType === 'document' ? 'document' : 'custom'), nodeType, documentId:nodeType === 'document' ? String(opts.documentId || '') : '' };
    data.nodes.push(newNode);
    if(opts.linkFrom && byId(opts.linkFrom)) data.edges.push({id:edgeId(), from:opts.linkFrom, to:newNode.id, relation:opts.relation || 'causes', strength:3, shape:'curve', fromPort:opts.fromPort || 'auto', toPort:opts.toPort || 'auto', label:''});
    applySelectionSnapshot({nodes:[newNode.id], edges:[]});
    render();
    if(before) commitMapCommand(opts.historyLabel || 'Added block', before, {render:false});
    else if(opts.save !== false) save(opts.historyLabel || 'Added block');
    showToast(opts.toast || (opts.linkFrom ? 'Linked block added' : 'Block added'));
    if(opts.focus !== false) setTimeout(() => nodeLayer.querySelector(`[data-id="${CSS.escape(newNode.id)}"] .node-title`)?.focus(), 30);
    return newNode;
  }
  function selectedClipboardPayload(){
    syncSelectionAliases();
    const selectedNodes = Array.from(selectedNodeIds).map(nodeId => byId(nodeId)).filter(Boolean);
    const copiedNodeIds = new Set(selectedNodes.map(node => node.id));
    const copiedEdges = data.edges.filter(edge => copiedNodeIds.has(edge.from) && copiedNodeIds.has(edge.to));
    const skippedSelectedLines = Array.from(selectedEdgeIds).filter(edgeId => {
      const edge = edgeById(edgeId);
      return edge && !(copiedNodeIds.has(edge.from) && copiedNodeIds.has(edge.to));
    });
    if(!selectedNodes.length){
      return {nodes:[], edges:[], skippedSelectedLines};
    }
    return {
      nodes:selectedNodes.map(node => cloneJson(node)),
      edges:copiedEdges.map(edge => cloneJson(edge)),
      skippedSelectedLines
    };
  }
  function clipboardBounds(nodes){
    if(!nodes.length) return {left:0, top:0, right:0, bottom:0, width:0, height:0};
    const bounds = nodes.reduce((acc, node) => {
      const dims = nodeDims(node);
      acc.left = Math.min(acc.left, Number(node.x) || 0);
      acc.top = Math.min(acc.top, Number(node.y) || 0);
      acc.right = Math.max(acc.right, (Number(node.x) || 0) + dims.w);
      acc.bottom = Math.max(acc.bottom, (Number(node.y) || 0) + dims.h);
      return acc;
    }, {left:Infinity, top:Infinity, right:-Infinity, bottom:-Infinity});
    bounds.width = bounds.right - bounds.left;
    bounds.height = bounds.bottom - bounds.top;
    return bounds;
  }
  function clipboardSummary(payload){
    const parts = [];
    if(payload.nodes?.length) parts.push(plural(payload.nodes.length, 'block'));
    if(payload.edges?.length) parts.push(plural(payload.edges.length, 'line'));
    return parts.join(' and ') || 'nothing';
  }
  function groupScreenRectFromWorld(target, bounds){
    const left = view.x + target.x * view.scale;
    const top = view.y + target.y * view.scale;
    const width = bounds.width * view.scale;
    const height = bounds.height * view.scale;
    return {left, top, right:left + width, bottom:top + height, width, height};
  }
  function groupFitsSafeArea(target, bounds, safe){
    const rect = groupScreenRectFromWorld(target, bounds);
    return rect.left >= safe.left && rect.top >= safe.top && rect.right <= safe.right && rect.bottom <= safe.bottom;
  }
  function groupNodeWorldRects(nodes, target, bounds){
    return nodes.map(node => {
      const dims = nodeDims(node);
      return worldRect(
        target.x + ((Number(node.x) || 0) - bounds.left),
        target.y + ((Number(node.y) || 0) - bounds.top),
        dims.w,
        dims.h
      );
    });
  }
  function groupAvoidsExistingNodes(nodes, target, bounds, margin=28){
    const nextRects = groupNodeWorldRects(nodes, target, bounds);
    return !nextRects.some(nextRect => data.nodes.some(existing => worldRectsOverlap(nextRect, nodeWorldRect(existing), margin)));
  }
  function groupCandidateIsClear(nodes, target, bounds, safe, avoidRects, margin=28){
    if(!groupFitsSafeArea(target, bounds, safe)) return false;
    const groupRect = groupScreenRectFromWorld(target, bounds);
    if(avoidRects.some(rect => rectsOverlap(groupRect, rect, screenMarginForWorld(margin)))) return false;
    return groupAvoidsExistingNodes(nodes, target, bounds, margin);
  }
  function scanSafeGroupPosition(nodes, bounds, safe, avoidRects, margin=28){
    const screenWidth = bounds.width * view.scale;
    const screenHeight = bounds.height * view.scale;
    const stepX = Math.max(88, Math.min(220, screenWidth * .42));
    const stepY = Math.max(82, Math.min(190, screenHeight * .48));
    for(let localY = safe.top; localY <= Math.max(safe.top, safe.bottom - screenHeight); localY += stepY){
      for(let localX = safe.left; localX <= Math.max(safe.left, safe.right - screenWidth); localX += stepX){
        const target = {x:(localX - view.x) / view.scale, y:(localY - view.y) / view.scale};
        if(groupCandidateIsClear(nodes, target, bounds, safe, avoidRects, margin)) return target;
      }
    }
    return null;
  }
  function radialSafeGroupPosition(nodes, bounds, safe, avoidRects, origin=null, margin=28){
    const start = origin || safeAreaFallbackPosition(bounds.width, bounds.height, safe);
    const radiusStep = Math.max(110, Math.min(240, Math.max(bounds.width, bounds.height) * .32));
    const angles = [Math.PI / 4, 0, Math.PI / 2, -Math.PI / 2, Math.PI, -Math.PI / 4, Math.PI * 3 / 4, -Math.PI * 3 / 4];
    for(let radius = radiusStep; radius <= 1600; radius += radiusStep){
      for(const angle of angles){
        const target = {x:start.x + Math.cos(angle) * radius, y:start.y + Math.sin(angle) * radius};
        if(groupCandidateIsClear(nodes, target, bounds, safe, avoidRects, margin)) return target;
      }
    }
    return null;
  }
  function worldClearGroupPosition(nodes, bounds, origin=null, margin=28){
    const start = origin || {x:bounds.left, y:bounds.top};
    const radiusStep = Math.max(140, Math.min(300, Math.max(bounds.width, bounds.height) * .34));
    const angles = [Math.PI / 4, 0, Math.PI / 2, -Math.PI / 2, Math.PI, -Math.PI / 4, Math.PI * 3 / 4, -Math.PI * 3 / 4];
    for(let radius = radiusStep; radius <= 3600; radius += radiusStep){
      for(const angle of angles){
        const target = {x:start.x + Math.cos(angle) * radius, y:start.y + Math.sin(angle) * radius};
        if(groupAvoidsExistingNodes(nodes, target, bounds, margin)) return target;
      }
    }
    return null;
  }
  function groupPlacementCandidates(bounds, pasteCount){
    const step = Math.max(bounds.height + 64, Math.min(360, Math.max(180, Math.max(bounds.width, bounds.height) * .28))) * Math.max(1, pasteCount);
    const half = step * .58;
    return [
      {x:bounds.left + step, y:bounds.top + step},
      {x:bounds.left + step, y:bounds.top},
      {x:bounds.left, y:bounds.top + step},
      {x:bounds.left + step, y:bounds.top - half},
      {x:bounds.left - half, y:bounds.top + step},
      {x:bounds.left + step * 1.45, y:bounds.top + half},
      {x:bounds.left + half, y:bounds.top + step * 1.45},
      {x:bounds.left - step, y:bounds.top + step},
      {x:bounds.left + step, y:bounds.top - step}
    ];
  }
  function findFreeGroupPosition(payload, bounds, pasteCount, options={}){
    const nodes = payload.nodes || [];
    const collisionMargin = Number(options.collisionMargin) || 28;
    const safe = getCanvasSafeArea({nodeWidth:bounds.width, nodeHeight:bounds.height, includeShelf:options.includeShelf, includeToast:options.includeToast, margin:options.margin});
    const avoidRects = getPlacementAvoidRects({includeShelf:options.includeShelf, includeToast:options.includeToast, includeNodes:false});
    const broadSafe = getBroadCanvasSafeArea({includeShelf:false, includeToast:false, margin:options.margin});
    const broadAvoidRects = getPlacementAvoidRects({includeShelf:false, includeToast:false, includeNodes:false});
    const stageBox = stage.getBoundingClientRect();
    const safeCenter = screenToWorld(stageBox.left + safe.left + safe.width * .46, stageBox.top + safe.top + safe.height * .38);
    const candidates = [
      ...groupPlacementCandidates(bounds, pasteCount),
      {x:safeCenter.x - bounds.width / 2, y:safeCenter.y - bounds.height / 2},
      safeAreaFallbackPosition(bounds.width, bounds.height, safe)
    ];
    return candidates.find(target => groupCandidateIsClear(nodes, target, bounds, safe, avoidRects, collisionMargin))
      || scanSafeGroupPosition(nodes, bounds, safe, avoidRects, collisionMargin)
      || radialSafeGroupPosition(nodes, bounds, safe, avoidRects, candidates[0], collisionMargin)
      || scanSafeGroupPosition(nodes, bounds, broadSafe, broadAvoidRects, collisionMargin)
      || radialSafeGroupPosition(nodes, bounds, broadSafe, broadAvoidRects, candidates[0], collisionMargin)
      || worldClearGroupPosition(nodes, bounds, candidates[0], collisionMargin)
      || safeAreaFallbackPosition(bounds.width, bounds.height, safe);
  }
  function copySelectionToClipboard(options={}){
    const payload = selectedClipboardPayload();
    if(!payload.nodes.length){
      if(!options.silent) showToast(payload.skippedSelectedLines.length ? 'Copy the blocks on both ends of a line to paste it.' : 'Select blocks to copy.');
      return null;
    }
    mapClipboard = {
      nodes:payload.nodes,
      edges:payload.edges,
      pasteCount:0
    };
    updateSelectionUI('clipboard-updated');
    if(!options.silent){
      const skipped = payload.skippedSelectedLines.length ? ` Skipped ${plural(payload.skippedSelectedLines.length, 'line')} without both blocks.` : '';
      showToast(`Copied ${clipboardSummary(payload)}.${skipped}`);
    }
    return cloneJson(mapClipboard);
  }
  function groupWouldBeVisible(targetLeft, targetTop, bounds){
    const stageBox = stage.getBoundingClientRect();
    const left = view.x + targetLeft * view.scale;
    const top = view.y + targetTop * view.scale;
    const right = left + bounds.width * view.scale;
    const bottom = top + bounds.height * view.scale;
    return right > 36 && bottom > 36 && left < stageBox.width - 36 && top < stageBox.height - 36;
  }
  function pasteTargetForPayload(payload, pasteCount){
    const bounds = clipboardBounds(payload.nodes);
    const target = findFreeGroupPosition(payload, bounds, pasteCount, {includeShelf:true, includeToast:true, margin:34, collisionMargin:28});
    return {target, bounds};
  }
  function pasteClipboardPayload(payload, options={}){
    if(!payload?.nodes?.length){ showToast('Nothing to paste'); return false; }
    const pasteCount = options.pasteCount || ((mapClipboard && payload === mapClipboard) ? mapClipboard.pasteCount + 1 : 1);
    const {target, bounds} = pasteTargetForPayload(payload, pasteCount);
    const before = beginMapCommand();
    const idMap = new Map();
    const newNodes = payload.nodes.map(node => {
      const next = cloneJson(node);
      const nextId = id();
      idMap.set(node.id, nextId);
      next.id = nextId;
      next.x = Math.round(target.x + ((Number(node.x) || 0) - bounds.left));
      next.y = Math.round(target.y + ((Number(node.y) || 0) - bounds.top));
      return next;
    });
    const newEdges = (payload.edges || []).filter(edge => idMap.has(edge.from) && idMap.has(edge.to)).map(edge => ({
      ...cloneJson(edge),
      id:edgeId(),
      from:idMap.get(edge.from),
      to:idMap.get(edge.to)
    }));
    data.nodes.push(...newNodes);
    data.edges.push(...newEdges);
    applySelectionSnapshot({nodes:newNodes.map(node => node.id), edges:newEdges.map(edge => edge.id)});
    if(mapClipboard && payload === mapClipboard) mapClipboard.pasteCount = pasteCount;
    render();
    commitMapCommand(options.label || 'Pasted selection', before, {render:false});
    showToast(options.toast || `Pasted ${clipboardSummary({nodes:newNodes, edges:newEdges})}. Ctrl+Z to undo.`);
    return true;
  }
  function pasteClipboard(){
    if(!mapClipboard?.nodes?.length){ showToast('Nothing to paste'); return false; }
    return pasteClipboardPayload(mapClipboard, {label:'Pasted selection'});
  }
  function duplicateSelection(){
    const payload = selectedClipboardPayload();
    if(!payload.nodes.length){
      showToast(payload.skippedSelectedLines.length ? 'Duplicate the blocks on both ends of a line to copy the line.' : 'Select blocks to duplicate.');
      return false;
    }
    return pasteClipboardPayload(payload, {label:'Duplicated selection', toast:`Duplicated ${clipboardSummary(payload)}. Ctrl+Z to undo.`});
  }
  function deleteSummary(blockCount, lineCount){
    const parts = [];
    if(blockCount) parts.push(plural(blockCount, 'block'));
    if(lineCount) parts.push(plural(lineCount, 'line'));
    return parts.join(' and ') || 'nothing';
  }
  function deleteSelection(){
    syncSelectionAliases();
    if(!hasMapSelection()){ showToast('Nothing selected'); return false; }
    const blockIds = new Set(Array.from(selectedNodeIds).filter(nodeId => byId(nodeId)));
    const explicitLineIds = new Set(Array.from(selectedEdgeIds).filter(edgeId => edgeById(edgeId)));
    const lineIds = new Set(explicitLineIds);
    data.edges.forEach(edge => {
      if(blockIds.has(edge.from) || blockIds.has(edge.to)) lineIds.add(edge.id);
    });
    const before = beginMapCommand();
    data.nodes = data.nodes.filter(node => !blockIds.has(node.id));
    data.edges = data.edges.filter(edge => !lineIds.has(edge.id));
    if(connectFrom && blockIds.has(connectFrom)) connectFrom = null;
    if(reconnectTarget){
      const reconnectEdge = edgeById(reconnectTarget.edgeId);
      if(!reconnectEdge || lineIds.has(reconnectTarget.edgeId) || blockIds.has(reconnectEdge.from) || blockIds.has(reconnectEdge.to)) reconnectTarget = null;
    }
    applySelectionSnapshot({nodes:[], edges:[]});
    suppressSelectionShelf = false;
    render();
    commitMapCommand('Deleted selection', before, {render:false});
    showToast(`Deleted ${deleteSummary(blockIds.size, lineIds.size)}. Ctrl+Z to undo.`);
    return true;
  }
  function addLinkedFrom(nodeId, x, y, fromPort='auto'){
    const source = byId(nodeId); if(!source) return;
    const w = 268;
    const h = 145;
    if(typeof x !== 'number' || typeof y !== 'number'){
      if(ports.includes(fromPort) && fromPort !== 'auto'){
        const placement = choosePortLinkedPlacement(source, fromPort, w, h);
        x = placement.position.x;
        y = placement.position.y;
      }else{
        const p = chooseSafeNodePosition(w, h, {preferredNearNodeId:source.id, gap:132, includeShelf:true, includeToast:true, collisionMargin:28});
        x = p.x;
        y = p.y;
        fromPort = 'auto';
      }
    }else{
      const preferredTopLeft = {x, y};
      const p = findFreeNodePosition({
        preferredTopLeft,
        w,
        h,
        candidates:[...candidatesAroundNode(source, w, h, 96), ...candidatesAroundNode(source, w, h, 220)],
        options:{includeShelf:true, includeToast:true, margin:18, collisionMargin:28}
      });
      x = p.x;
      y = p.y;
    }
    const usesFixedPorts = ports.includes(fromPort) && fromPort !== 'auto';
    return addNodeAt(x,y,{
      linkFrom:source.id,
      group:'blue',
      fromPort:usesFixedPorts ? fromPort : 'auto',
      toPort:usesFixedPorts ? (oppositePort[fromPort] || 'auto') : 'auto'
    });
  }
  function portSideLabel(side){
    return portLabels[side] || side || 'auto';
  }
  function portLinkedCandidates(source, side, w, h){
    const r = nodeRect(source);
    const gap = 148;
    const wideGap = 256;
    const fartherGap = 390;
    const centerY = r.cy - h / 2;
    const centerX = r.cx - w / 2;
    const offsets = [0, -(h + 72), h + 72, -(h * 2 + 140), h * 2 + 140];
    const horizontal = distance => offsets.map(offset => ({
      x:side === 'left' ? r.x - w - distance : r.x + r.w + distance,
      y:centerY + offset
    }));
    const verticalOffsets = [0, -(w + 82), w + 82, -(w * 2 + 150), w * 2 + 150];
    const vertical = distance => verticalOffsets.map(offset => ({
      x:centerX + offset,
      y:side === 'top' ? r.y - h - distance : r.y + r.h + distance
    }));
    const primary = (side === 'left' || side === 'right') ? horizontal(gap) : vertical(gap);
    const secondary = (side === 'left' || side === 'right') ? horizontal(wideGap) : vertical(wideGap);
    const tertiary = (side === 'left' || side === 'right') ? horizontal(fartherGap) : vertical(fartherGap);
    return [...primary, ...secondary, ...tertiary, ...candidatesAroundNode(source, w, h, 220), ...candidatesAroundNode(source, w, h, 380)];
  }
	  function positionOnPortSide(source, side, position, w, h){
	    const r = nodeRect(source);
	    if(side === 'right') return position.x >= r.x + r.w + 12;
	    if(side === 'left') return position.x + w <= r.x - 12;
	    if(side === 'top') return position.y + h <= r.y - 12;
	    if(side === 'bottom') return position.y >= r.y + r.h + 12;
	    return false;
	  }
	  function choosePortLinkedPlacement(source, side, w, h){
	    updateOverlayOffsets();
	    const candidates = portLinkedCandidates(source, side, w, h);
	    const placement = findFreeNodePlacement({
	      preferredTopLeft:candidates[0] || null,
	      w,
	      h,
	      candidates:candidates.slice(1),
	      options:{includeShelf:true, includeToast:true, margin:18, collisionMargin:28}
	    });
	    placement.sameSide = positionOnPortSide(source, side, placement.position, w, h);
	    return placement;
	  }
  function choosePortLinkedPosition(source, side, w, h){
    return choosePortLinkedPlacement(source, side, w, h).position;
  }
  function createPortLinkedBlock(sourceId, side, type){
    const source = byId(sourceId);
    if(!source){ showToast('Source block not found'); return null; }
    const config = workbenchBlockConfig(type);
    const placement = choosePortLinkedPlacement(source, side, config.w || 268, config.h || 145);
    const position = placement.position;
    markStarterMeaningfulAction();
    const linkedLabel = type === 'question' ? 'question' : (type === 'evidence' ? 'evidence' : 'concept');
	    const toastText = placement.sameSide
	      ? `Linked ${linkedLabel} added. Ctrl+Z to undo.`
	      : `Linked ${linkedLabel} placed in nearest open space. Ctrl+Z to undo.`;
	    const node = addNodeAt(position.x, position.y, {
	      ...config,
	      linkFrom:source.id,
	      fromPort:'auto',
	      toPort:'auto',
	      historyLabel:`Linked ${linkedLabel} added`,
	      toast:toastText,
	      focus:false
	    });
	    clearInsertedNodePlacement(node);
	    if(placement.reason === 'world-clear') panNodeIntoSafeArea(node, config.w || 268, config.h || 145, {includeShelf:true, includeToast:true, margin:18});
	    temporarilyPassThroughZoomDock();
	    updateOverlayOffsets();
	    panRenderedNodeAwayFromOverlayLanes(node, {includeShelf:true, includeToast:true, margin:12});
	    requestAnimationFrame(() => {
	      positionSelectionShelf();
	      updateOverlayOffsets();
	      renderEdges();
	    });
    return node;
  }
  function createPortLinkedDocumentBlock(sourceId, side, documentId){
    const source = byId(sourceId);
    if(!source){ showToast('Source block not found'); return null; }
    const size = documentBlockSize();
    const placement = choosePortLinkedPlacement(source, side, size.w, size.h);
    const position = placement.position;
    const node = addDocumentBlock(documentId, position, {
      topLeft:true,
      w:size.w,
      h:size.h,
      linkFrom:source.id,
      fromPort:'auto',
      toPort:'auto',
	      historyLabel:'Linked document added',
	      toast:placement.sameSide ? 'Linked document added. Ctrl+Z to undo.' : 'Linked document placed in nearest open space. Ctrl+Z to undo.',
	      focus:false
	    });
	    clearInsertedNodePlacement(node);
	    if(placement.reason === 'world-clear') panNodeIntoSafeArea(node, size.w, size.h, {includeShelf:true, includeToast:true, margin:18});
	    updateOverlayOffsets();
	    panRenderedNodeAwayFromOverlayLanes(node, {includeShelf:true, includeToast:true, margin:12});
	    return node;
	  }
  function chooseDocumentFromPicker(documentId){
    const relationshipInsert = pendingRelationshipInsert;
    if(relationshipInsert?.edgeId){
      insertBlockBetweenRelationship(relationshipInsert.edgeId, 'document', {documentId});
      return;
    }
    const quickAdd = pendingDocumentQuickAdd;
    if(quickAdd?.sourceId && quickAdd?.side){
      createPortLinkedDocumentBlock(quickAdd.sourceId, quickAdd.side, documentId);
      return;
    }
    addDocumentBlock(documentId, pendingDocumentBlockPoint);
  }
  function openPortQuickAddMenu(button){
    const nodeId = button?.dataset?.nodeId;
    const side = button?.dataset?.portSide;
    const source = byId(nodeId);
    if(!source || !ports.includes(side) || side === 'auto') return;
    cancelPlacementMode('port-quick-add');
    closeDocumentPicker();
    closeDocumentDetail();
    clearEdgeDeleteArm();
    if(isBlockTargetingActive()) cancelBlockTargeting();
    select(source.id, 'port-quick-add');
    const menuButton = nodeLayer.querySelector(`.map-node[data-id="${CSS.escape(source.id)}"] .connection-port.port-${CSS.escape(side)}`) || button;
    const rect = menuButton.getBoundingClientRect();
    showMenu(`Add linked block from ${portSideLabel(side)} side`, [
      {
        label:'Connect existing block',
        action:'port-connect-existing',
        title:'Connect this block to another existing block',
        ariaLabel:'Connect existing block from this port'
      },
      {type:'section', label:'Create new linked block'},
      {label:'Concept block', action:'port-add-concept'},
      {label:'Question block', action:'port-add-question'},
      {label:'Evidence block', action:'port-add-evidence'},
      {label:'Document block', action:'port-add-document'}
    ], rect.left + rect.width / 2, rect.bottom + 10, {type:'port', id:source.id, side, trigger:'port-button', source:{target:menuButton}});
    setActivePortMenuButton(menuButton);
  }
  function clearActivePortMenuButton(){
    if(activePortMenuButton) activePortMenuButton.classList.remove('port-menu-open');
    activePortMenuButton = null;
  }
  function setActivePortMenuButton(button){
    clearActivePortMenuButton();
    activePortMenuButton = button;
    if(activePortMenuButton) activePortMenuButton.classList.add('port-menu-open');
  }
  function portTapKey(port){
    return `${port?.dataset?.nodeId || ''}:${port?.dataset?.portSide || ''}`;
  }
  function startPortTap(port, event){
    activePortTap = {
      pointerId:event.pointerId,
      port,
      key:portTapKey(port),
      sx:event.clientX,
      sy:event.clientY
    };
  }
  function clearPortTap(pointerId=null){
    if(pointerId !== null && activePortTap?.pointerId !== pointerId) return;
    activePortTap = null;
  }
  function portTapMoved(event){
    if(!activePortTap || activePortTap.pointerId !== event.pointerId) return false;
    return Math.hypot(event.clientX - activePortTap.sx, event.clientY - activePortTap.sy) > PORT_TAP_MOVE;
  }
  function portTapCanOpen(port, event){
    return activePortTap
      && activePortTap.pointerId === event.pointerId
      && activePortTap.port === port
      && activePortTap.key === portTapKey(port)
      && !portTapMoved(event);
  }
  function suppressNextPortClick(port){
    suppressedPortClick = {
      key:portTapKey(port),
      until:Date.now() + 700
    };
  }
  function consumeSuppressedPortClick(port){
    if(!suppressedPortClick) return false;
    if(Date.now() > suppressedPortClick.until){
      suppressedPortClick = null;
      return false;
    }
    if(suppressedPortClick.key !== portTapKey(port)) return false;
    suppressedPortClick = null;
    return true;
  }
  function startConnectTargetTap(nodeId, event){
    activeConnectTargetTap = {
      pointerId:event.pointerId,
      nodeId,
      sx:event.clientX,
      sy:event.clientY
    };
  }
  function clearConnectTargetTap(pointerId=null){
    if(pointerId !== null && activeConnectTargetTap?.pointerId !== pointerId) return;
    activeConnectTargetTap = null;
  }
  function connectTargetTapMoved(event){
    if(!activeConnectTargetTap || activeConnectTargetTap.pointerId !== event.pointerId) return false;
    return Math.hypot(event.clientX - activeConnectTargetTap.sx, event.clientY - activeConnectTargetTap.sy) > PORT_TAP_MOVE;
  }
  function suppressNextConnectClick(nodeId){
    suppressedConnectClick = {
      nodeId,
      until:Date.now() + 700
    };
  }
  function consumeSuppressedConnectClick(nodeId){
    if(!suppressedConnectClick) return false;
    if(Date.now() > suppressedConnectClick.until){
      suppressedConnectClick = null;
      return false;
    }
    if(suppressedConnectClick.nodeId !== nodeId) return false;
    suppressedConnectClick = null;
    return true;
  }
  function addFreeAtCenter(){ const r = stage.getBoundingClientRect(); const p = screenToWorld(r.left + r.width/2, r.top + r.height/2); addNodeAt(p.x - 130, p.y - 70); }
  function nodeSlotIsOpen(x, y, w, h, margin=36, excludeNodeId=''){
    const candidate = worldRect(x, y, w, h);
    return !data.nodes.some(node => {
      if(excludeNodeId && node.id === excludeNodeId) return false;
      return worldRectsOverlap(candidate, nodeWorldRect(node), margin);
    });
  }
  function chooseDocumentBlockPosition(worldPoint=null, w=300, h=170){
    const selected = byId(selectedId) || byId('core') || data.nodes[0];
    const preferredTopLeft = worldPoint ? {x:worldPoint.x - w/2, y:worldPoint.y - h/2} : null;
    return chooseSafeNodePosition(w, h, {
      preferredTopLeft,
      preferredNearNodeId:selected?.id || 'core',
      gap:140
    });
  }
  function renderDocumentPicker(){
    if(!documentPickerList) return;
    if(!projectDocuments.length){
      documentPickerList.innerHTML = '<div class="document-picker-item"><strong>No documents yet</strong><span>Add document metadata on the project page first.</span></div>';
      return;
    }
    documentPickerList.innerHTML = '';
    projectDocuments.forEach(doc => {
      const button = document.createElement('button');
      button.className = 'document-picker-item';
      button.type = 'button';
      button.dataset.documentId = doc.id;
      button.innerHTML = `<strong>${escapeHtml(doc.title)}</strong><span>${escapeHtml(doc.type.toUpperCase())} · ${escapeHtml(doc.description || 'Project document')}</span>`;
      button.addEventListener('pointerdown', e => e.stopPropagation());
      button.addEventListener('pointerup', e => e.stopPropagation());
      button.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        chooseDocumentFromPicker(doc.id);
        closeDocumentPicker();
      });
      documentPickerList.appendChild(button);
    });
  }
  async function openDocumentPicker(worldPoint=null, options={}){
    if(!projectDocuments.length) await refreshProjectDocuments();
    pendingDocumentBlockPoint = worldPoint;
    pendingDocumentQuickAdd = options.quickAdd || null;
    pendingRelationshipInsert = options.relationshipInsert || null;
    renderDocumentPicker();
    documentDetailCard.hidden = true;
    mapStarterPanel.hidden = true;
    documentPicker.hidden = false;
    closeMenu();
    documentPicker.querySelector('button')?.focus();
  }
  function closeDocumentPicker(){
    documentPicker.hidden = true;
    pendingDocumentBlockPoint = null;
    pendingDocumentQuickAdd = null;
    pendingRelationshipInsert = null;
    renderMapStarter();
  }
  function isFreshStarterMap(){
    if(runtimePageId === SEED_MAP_PAGE_ID) return false;
    if(!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) return false;
    if(data.edges.length) return false;
    if(data.nodes.length !== 1) return false;
    const onlyNode = data.nodes[0];
    return onlyNode.id === 'core' || clean(onlyNode.title || '').toLowerCase() === 'main idea';
  }
  function starterPosition(offsetX=360, offsetY=0, w=268, h=145){
    const core = byId('core') || data.nodes[0];
    if(core) return {x:core.x + offsetX, y:core.y + offsetY};
    const sr = stage.getBoundingClientRect();
    const center = screenToWorld(sr.left + sr.width/2, sr.top + sr.height/2);
    return {x:center.x - w/2, y:center.y - h/2};
  }
  function setWorkbenchOpen(open, options={}){
    if(!mapWorkbench || !workbenchDrawer || !btnWorkbenchToggle) return;
    workbenchOpen = Boolean(open);
    mapWorkbench.classList.toggle('open', workbenchOpen);
    mapWorkbench.classList.toggle('collapsed', !workbenchOpen);
    workbenchDrawer.hidden = !workbenchOpen;
    btnWorkbenchToggle.setAttribute('aria-expanded', String(workbenchOpen));
    btnWorkbenchToggle.textContent = 'Sources & blocks';
    if(options.user) workbenchUserToggled = true;
    if(workbenchOpen && options.focus) workbenchDrawer.querySelector('button,summary')?.focus();
    requestAnimationFrame(() => { updateOverlayOffsets(); renderEdges(); });
  }
  function renderWorkbenchDocuments(){
    if(!workbenchDocumentList) return;
    const hasDocuments = projectDocuments.length > 0;
    if(workbenchAddDocument){
      workbenchAddDocument.disabled = !hasDocuments;
      const documentHint = workbenchAddDocument.querySelector('span');
      if(documentHint) documentHint.textContent = hasDocuments ? 'Reference a project source' : 'Add a source first';
    }
    if(!hasDocuments){
      workbenchDocumentList.innerHTML = '<div class="workbench-empty">Add a document in the project first.</div>';
      return;
    }
    workbenchDocumentList.innerHTML = '';
    projectDocuments.forEach(doc => {
      const row = document.createElement('article');
      row.className = 'workbench-document';
      row.innerHTML = `
        <div class="workbench-document-top">
          <div>
            <strong>${escapeHtml(doc.title)}</strong>
            <span>${escapeHtml(doc.description || doc.sourceLabel || 'Project document')}</span>
          </div>
          <span class="workbench-document-type">${escapeHtml(String(doc.type || 'source').toUpperCase())}</span>
        </div>
        <button class="workbench-source-action" type="button" data-workbench-document-id="${escapeHtml(doc.id)}">Add as document block</button>
      `;
      workbenchDocumentList.appendChild(row);
    });
  }
  function renderWorkbench(){
    renderWorkbenchDocuments();
    if(!mapWorkbench) return;
    const shouldOpenFresh = runtimePageInitialized && !starterHidden && isFreshStarterMap();
    if(shouldOpenFresh && !workbenchUserToggled && !workbenchOpen) setWorkbenchOpen(true);
  }
  function visibleWorkbenchPosition(w=268, h=145){
    return chooseSafeNodePosition(w, h, {near:false});
  }
  function documentBlockSize(){
    return window.innerWidth <= 520 ? {w:245, h:176} : {w:300, h:170};
  }
  function chooseWorkbenchBlockPosition(w=268, h=145){
    return chooseSafeNodePosition(w, h, {preferredNearNodeId:selectedId || 'core'});
  }
  function workbenchBlockConfig(type, options={}){
    const starter = Boolean(options.starter);
    const compact = window.innerWidth <= 520;
    const configs = {
      concept:{title:'New concept', body:'What idea belongs here?', group:'blue', shape:'card', tag:'concept', nodeType:'concept', w:compact ? 245 : 268, h:145, toast:'Concept block placed', placementLabel:'concept block'},
      question:{title:starter ? 'Central question' : 'Question to answer', body:starter ? 'What question should this map help you answer?' : 'What needs explaining?', group:'amber', shape:'pill', tag:'question', nodeType:'question', w:compact ? 245 : 300, h:132, toast:'Question block placed', placementLabel:'question block'},
      evidence:{title:starter ? 'Evidence to check' : 'Evidence block', body:starter ? 'What source, example, or observation supports this idea?' : 'What source, example, or observation supports this?', group:'green', shape:'note', tag:'evidence', nodeType:'evidence', w:compact ? 245 : 300, h:150, toast:'Evidence block placed', placementLabel:'evidence block'}
    };
    return configs[type] || configs.concept;
  }
  function markStarterMeaningfulAction(){
    if(!starterHidden && isFreshStarterMap()){
      starterHidden = true;
      renderMapStarter();
    }
  }
  function clearWorkbenchPlacementActive(){
    mapWorkbench?.querySelectorAll('.placement-active').forEach(button => {
      button.classList.remove('placement-active');
      button.removeAttribute('aria-pressed');
    });
  }
  function setPlacementButtonActive(button){
    clearWorkbenchPlacementActive();
    if(!button) return;
    button.classList.add('placement-active');
    button.setAttribute('aria-pressed', 'true');
  }
  function placementStatusText(pending){
    return `Tap the canvas to place ${pending?.label || 'block'}`;
  }
  function setPlacementOverlayVisible(visible){
    if(!placementOverlay) return;
    placementOverlay.hidden = !visible;
    stage.classList.toggle('placement-mode', visible);
    if(!visible && placementGhost) placementGhost.hidden = true;
    updateOverlayOffsets();
  }
  function cancelPlacementMode(reason='cancel'){
    if(!pendingPlacement) return;
    pendingPlacement = null;
    clearWorkbenchPlacementActive();
    setPlacementOverlayVisible(false);
    setStatus(reason === 'escape' ? 'Placement canceled' : 'Map ready');
  }
  function startPlacementMode(pending, options={}){
    pendingPlacement = pending;
    closeMenu();
    closeDocumentPicker();
    closeDocumentDetail();
    clearEdgeDeleteArm();
    if(isBlockTargetingActive()) cancelBlockTargeting();
    clearSelection('placement-start');
    setPlacementButtonActive(options.sourceButton || null);
    if(placementText) placementText.textContent = placementStatusText(pending);
    setPlacementOverlayVisible(true);
    if(window.innerWidth <= 640 && workbenchOpen) setWorkbenchOpen(false, {user:false});
    setStatus(placementStatusText(pending));
    updatePlacementGhost(null);
  }
  function isPlacementControlTarget(target){
    if(!target) return false;
    return Boolean(target.closest('.connection-port,.toolbar,.zoom-dock,.side-panel,.review-panel,.map-workbench,.selection-shelf,.connect-banner,.input-debug,.menu,.document-picker,.document-detail-card,.placement-overlay,.edge-label,g.edge-group'));
  }
  function placementTopLeftFromClient(clientX, clientY, w, h){
    const worldPoint = screenToWorld(clientX, clientY);
    return {x:worldPoint.x - w / 2, y:worldPoint.y - h / 2};
  }
  function candidatesAroundNode(node, w, h, gap=104){
    if(!node) return [];
    const r = nodeRect(node);
    return [
      {x:r.x, y:r.y + r.h + gap},
      {x:r.x + r.w + gap, y:r.y + 8},
      {x:r.x - w - gap, y:r.y + 8},
      {x:r.x, y:r.y - h - gap},
      {x:r.x + r.w + gap, y:r.y + r.h + gap},
      {x:r.x - w - gap, y:r.y + r.h + gap}
    ];
  }
  function choosePlacementPositionFromClient(clientX, clientY, w, h, options={}){
    const preferredTopLeft = placementTopLeftFromClient(clientX, clientY, w, h);
    const occupiedNode = options.occupiedNode || nodeAtClientPoint(clientX, clientY) || firstNodeOverlappingCandidate(preferredTopLeft, w, h);
    const preferredCandidates = occupiedNode ? [] : [preferredTopLeft];
    const occupiedCandidates = occupiedNode
      ? [
          ...candidatesAroundNode(occupiedNode, w, h, 28),
          ...candidatesAroundNode(occupiedNode, w, h, 104),
          ...candidatesAroundNode(occupiedNode, w, h, 220),
          ...candidatesAroundNode(occupiedNode, w, h, 340)
        ]
      : [];
    return findFreeNodePosition({
      preferredTopLeft:occupiedNode ? null : preferredTopLeft,
      w,
      h,
      candidates:[...occupiedCandidates, ...preferredCandidates],
      options:{includeShelf:false, includeToast:true, margin:18}
    });
  }
  function updatePlacementGhost(event){
    if(!placementGhost || !pendingPlacement){
      if(placementGhost) placementGhost.hidden = true;
      return;
    }
    if(!event || isPlacementControlTarget(event.target instanceof Element ? event.target : null)){
      placementGhost.hidden = true;
      return;
    }
    const w = pendingPlacement.w || 268;
    const h = pendingPlacement.h || 145;
    const targetNodeElement = event.target instanceof Element ? event.target.closest('.map-node') : null;
    const occupiedNode = targetNodeElement ? byId(targetNodeElement.dataset.id) : null;
    const p = choosePlacementPositionFromClient(event.clientX, event.clientY, w, h, {occupiedNode});
    const rect = nodeScreenRectFromWorld(p.x, p.y, w, h);
    placementGhost.style.left = `${Math.round(rect.left)}px`;
    placementGhost.style.top = `${Math.round(rect.top)}px`;
    placementGhost.style.width = `${Math.round(rect.width)}px`;
    placementGhost.style.height = `${Math.round(rect.height)}px`;
    placementGhost.textContent = pendingPlacement.previewTitle || pendingPlacement.label || 'Block';
    placementGhost.hidden = false;
  }
  function completePlacementAt(clientX, clientY, sourceEvent=null){
    if(!pendingPlacement) return null;
    const pending = pendingPlacement;
    const w = pending.w || 268;
    const h = pending.h || 145;
    const targetNodeElement = sourceEvent?.target instanceof Element ? sourceEvent.target.closest('.map-node') : null;
    const occupiedNode = targetNodeElement ? byId(targetNodeElement.dataset.id) : null;
    const p = choosePlacementPositionFromClient(clientX, clientY, w, h, {occupiedNode});
    markStarterMeaningfulAction();
    cancelPlacementMode('placed');
    suppressNextPlacementClick = true;
    let node = null;
    if(pending.kind === 'document'){
      const documentPoint = window.innerWidth <= 640
        ? chooseSafeNodePosition(w, h, {preferredTopLeft:narrowDocumentPreferredPosition(w, h, p), preferredNearNodeId:'core', gap:180, margin:14, collisionMargin:20})
        : p;
      node = addDocumentBlock(pending.documentId, documentPoint, {topLeft:true, w, h});
    }else{
      node = addNodeAt(p.x, p.y, pending.config);
      showToast(pending.toast || pending.config?.toast || 'Block placed');
    }
    if(node){
      clearInsertedNodePlacement(node);
      temporarilyPassThroughZoomDock();
      renderMapStarter();
      requestAnimationFrame(() => {
        positionSelectionShelf();
        updateOverlayOffsets();
        renderEdges();
      });
      logInputDebug('placement-complete', sourceEvent || inputDebugState.lastPointer, {mode:'canvas', target:stage, nodeId:node.id, blockType:pending.kind});
    }
    return node;
  }
  function startWorkbenchBlockPlacement(type, sourceButton=null){
    const config = workbenchBlockConfig(type);
    startPlacementMode({
      kind:type,
      label:config.placementLabel,
      previewTitle:config.title,
      w:config.w,
      h:config.h,
      config,
      toast:config.toast
    }, {sourceButton});
  }
  async function startWorkbenchDocumentPlacement(documentId=null, sourceButton=null){
    if(!projectDocuments.length) await refreshProjectDocuments();
    if(!projectDocuments.length){
      showToast('Add a document first');
      setStatus('Add document metadata on the project page before adding document blocks.');
      renderMapStarter();
      return null;
    }
    const docId = documentId || projectDocuments[0]?.id;
    const documentRecord = documentById(docId);
    if(!docId || !documentRecord){
      showToast('Document not found');
      return null;
    }
    const size = documentBlockSize();
    startPlacementMode({
      kind:'document',
      label:'document block',
      previewTitle:documentRecord.title || 'Document block',
      w:size.w,
      h:size.h,
      documentId:docId,
      toast:'Document block added'
    }, {sourceButton});
    return documentRecord;
  }
  function addWorkbenchBlock(type, options={}){
    const config = workbenchBlockConfig(type, options);
    markStarterMeaningfulAction();
    const p = chooseWorkbenchBlockPosition(config.w, config.h);
    addNodeAt(p.x, p.y, config);
    showToast(config.toast);
    requestAnimationFrame(() => positionSelectionShelf());
    renderMapStarter();
  }
  async function addWorkbenchDocumentBlock(documentId=null){
    if(!projectDocuments.length) await refreshProjectDocuments();
    if(!projectDocuments.length){
      showToast('Add a document first');
      setStatus('Add document metadata on the project page before adding document blocks.');
      renderMapStarter();
      return null;
    }
    const docId = documentId || projectDocuments[0]?.id;
    if(!docId) return null;
    markStarterMeaningfulAction();
    const size = documentBlockSize();
    const p = chooseWorkbenchBlockPosition(size.w, size.h);
    const node = addDocumentBlock(docId, {x:p.x + size.w / 2, y:p.y + size.h / 2}, {w:size.w, h:size.h});
    if(window.innerWidth <= 640) setWorkbenchOpen(false);
    renderMapStarter();
    return node;
  }
  function renderMapStarter(){
    if(!mapStarterPanel) return;
    const shouldShow = runtimePageInitialized && !starterHidden && isFreshStarterMap();
    mapStarterPanel.hidden = !shouldShow;
    if(!shouldShow) return;
    const hasDocuments = projectDocuments.length > 0;
    starterAddDocument.textContent = hasDocuments ? 'Add source/document block' : 'Add a document first';
    starterAddDocument.disabled = !hasDocuments;
    starterDocumentHint.textContent = hasDocuments
      ? `${projectDocuments.length} project ${projectDocuments.length === 1 ? 'document' : 'documents'} available.`
      : 'Add document metadata on the project page before making document blocks.';
  }
  function addStarterQuestion(){
    addWorkbenchBlock('question', {starter:true});
  }
  function addStarterEvidence(){
    addWorkbenchBlock('evidence', {starter:true});
  }
  async function addStarterDocumentBlock(){
    if(!projectDocuments.length) await refreshProjectDocuments();
    if(!projectDocuments.length){
      showToast('Add a document first');
      setStatus('Add document metadata on the project page before adding document blocks.');
      renderMapStarter();
      return;
    }
    const size = documentBlockSize();
    const p = chooseSafeNodePosition(size.w, size.h, {preferredNearNodeId:selectedId || 'core'});
    openDocumentPicker({x:p.x + size.w / 2, y:p.y + size.h / 2});
  }
  function handleMapStarterClick(event){
    const button = event.target.closest('button');
    if(!button || !mapStarterPanel.contains(button)) return;
    event.preventDefault();
    event.stopPropagation();
    if(button === starterAddQuestion) addStarterQuestion();
    else if(button === starterAddEvidence) addStarterEvidence();
    else if(button === starterAddDocument) void addStarterDocumentBlock();
    else if(button === starterHide){
      starterHidden = true;
      renderMapStarter();
      void persistWorkspaceState('Starter hidden');
      showToast('Starter hidden');
    }
  }
  function addDocumentBlock(documentId, worldPoint=null, options={}){
    const documentRecord = documentById(documentId);
    if(!documentRecord){ showToast('Document not found'); return null; }
    markStarterMeaningfulAction();
    const size = {w:Number(options.w) || 300, h:Number(options.h) || 170};
    const position = options.topLeft && worldPoint
      ? worldPoint
      : chooseDocumentBlockPosition(worldPoint, size.w, size.h);
    const node = addNodeAt(position.x, position.y, {
      title:documentRecord.title,
      body:documentRecord.description || 'Add a note about why this document matters here.',
      group:'violet',
      shape:'note',
      tag:documentRecord.type,
      w:size.w,
      h:size.h,
      nodeType:'document',
      documentId:documentRecord.id,
      linkFrom:options.linkFrom || '',
      relation:options.relation || 'causes',
      fromPort:options.fromPort || 'auto',
      toPort:options.toPort || 'auto',
      historyLabel:options.historyLabel || 'Added document block',
      toast:options.toast || 'Document block added',
      focus:options.focus !== false
    });
    temporarilyPassThroughZoomDock();
    requestAnimationFrame(() => positionSelectionShelf());
    return node;
  }
  function openDocumentDetail(nodeOrDocumentId){
    const documentId = typeof nodeOrDocumentId === 'string' ? nodeOrDocumentId : nodeOrDocumentId?.documentId;
    const documentRecord = documentById(documentId);
    if(!documentRecord){ showToast('Document details unavailable'); return; }
    documentDetailTitle.textContent = documentRecord.title;
    documentDetailMeta.textContent = `${documentRecord.type.toUpperCase()} · ${documentRecord.sourceLabel || 'Project document'}${documentRecord.tags?.length ? ' · ' + documentRecord.tags.join(', ') : ''}`;
    documentDetailDescription.textContent = documentRecord.description || 'No description yet.';
    documentPicker.hidden = true;
    documentDetailCard.hidden = false;
  }
  function closeDocumentDetail(){
    documentDetailCard.hidden = true;
  }
  function duplicateNode(nodeId){ const n = byId(nodeId); if(!n) return; setSelectionFromIds([nodeId], [], 'duplicate-source'); duplicateSelection(); }
  function deleteNode(nodeId, options={}){
    const n = byId(nodeId); if(!n) return; if(options.confirm !== false && !confirm(`Delete “${n.title || 'this block'}”?`)) return;
    const before = beginMapCommand();
    data.nodes = data.nodes.filter(x => x.id !== nodeId); data.edges = data.edges.filter(e => e.from !== nodeId && e.to !== nodeId);
    if(connectFrom === nodeId) connectFrom = null;
    if(reconnectTarget){
      const reconnectEdge = edgeById(reconnectTarget.edgeId);
      if(!reconnectEdge || reconnectEdge.from === nodeId || reconnectEdge.to === nodeId) reconnectTarget = null;
    }
    applySelectionSnapshot({nodes:[], edges:[]});
    suppressSelectionShelf = false;
    render();
    commitMapCommand('Deleted block', before, {render:false});
    showToast('Block deleted. Ctrl+Z to undo.');
  }
  function directedEdgeBetween(from, to, excludeEdgeId=''){
    return findDirectedRelationship(data.edges, from, to, excludeEdgeId);
  }
  function addEdge(from,to,opts={}){
    if(!from || !to || !byId(from) || !byId(to)) return null;
    if(isSelfRelationship(from, to)){
      showToast(opts.selfToast || 'Choose a different block to connect.');
      return null;
    }
    const existingEdge = directedEdgeBetween(from, to);
    if(existingEdge){
      selectEdge(existingEdge.id, 'duplicate-relationship');
      showToast(opts.duplicateToast || 'Those blocks are already connected.');
      return existingEdge;
    }
    const before = beginMapCommand();
    const e = createRelationshipDraft(from, to, {...opts, createId:edgeId});
    data.edges.push(e);
    applySelectionSnapshot({nodes:[], edges:[e.id]});
    render();
    commitMapCommand('Connected blocks', before, {render:false});
    showToast(opts.toast || 'Blocks connected. Ctrl+Z to undo.');
    temporarilyPassThroughZoomDock(); logInputDebug('connect-complete', opts.source || inputDebugState.lastPointer, {mode:'edge'});
    return e;
  }
  function deleteEdge(edgeId){
    if(!edgeById(edgeId)) return;
    const before = beginMapCommand();
    data.edges = data.edges.filter(e => e.id !== edgeId);
    applySelectionSnapshot({nodes:Array.from(selectedNodeIds), edges:Array.from(selectedEdgeIds).filter(id => id !== edgeId)});
    suppressSelectionShelf = false; render(); commitMapCommand('Deleted line', before, {render:false}); showToast('Line deleted. Ctrl+Z to undo.');
  }
  function reverseEdge(edgeId){ const e = edgeById(edgeId); if(!e) return; const before = beginMapCommand(); Object.assign(e, reverseRelationship(e)); render(); commitMapCommand('Reversed line', before, {render:false}); }
  function removeNodeEdges(nodeId){ const before = beginMapCommand(); data.edges = data.edges.filter(e => e.from !== nodeId && e.to !== nodeId); render(); if(commitMapCommand('Removed connections', before, {render:false})) showToast('Connections removed'); }
  function setNodeColor(nodeId, color){ const n = byId(nodeId); if(!n) return; const before = beginMapCommand(); n.group = color; render(); commitMapCommand('Color changed', before, {render:false}); }
  function setNodeShape(nodeId, shape){ const n = byId(nodeId); if(!n) return; const before = beginMapCommand(); n.shape = shape; render(); commitMapCommand('Shape changed', before, {render:false}); }
  function setNodeImportance(nodeId, val){ const n = byId(nodeId); if(!n) return; const before = beginMapCommand(); n.importance = clamp(Number(val),1,3); render(); commitMapCommand('Importance changed', before, {render:false}); }
  function setNodeSize(nodeId, preset){ const n = byId(nodeId), s = sizePresets[preset]; if(!n || !s) return; const before = beginMapCommand(); n.w = s.w; n.h = s.h; render(); commitMapCommand('Size changed', before, {render:false}); }
  function setEdgeRelation(edgeId, relation){ const e = edgeById(edgeId); if(!e) return; const before = beginMapCommand(); Object.assign(e, patchRelationshipRelation(e, relation)); render(); commitMapCommand('Line type changed', before, {render:false}); }
  function setEdgeStrength(edgeId, strength){ const e = edgeById(edgeId); if(!e) return; const before = beginMapCommand(); Object.assign(e, patchRelationshipStrength(e, strength)); render(); commitMapCommand('Line strength changed', before, {render:false}); }
  function setEdgeShape(edgeId, shape){ const e = edgeById(edgeId); if(!e) return; const before = beginMapCommand(); Object.assign(e, patchRelationshipShape(e, shape)); render(); commitMapCommand('Line route changed', before, {render:false}); }
  function setEdgePort(edgeId, end, port){ const e = edgeById(edgeId); if(!e || !ports.includes(port)) return; const before = beginMapCommand(); Object.assign(e, patchRelationshipPort(e, end, port)); render(); if(commitMapCommand('Connection side changed', before, {render:false})) showToast('Connection side changed'); }
  function setEdgeLabel(edgeId){ const e = edgeById(edgeId); if(!e) return; const style = relationStyles[e.relation]; const txt = prompt('Short label for this link:', e.label || style.label); if(txt === null) return; const before = beginMapCommand(); e.label = clean(txt); render(); commitMapCommand('Line label changed', before, {render:false}); }
  function relationshipInsertMenuPoint(edge, anchor={}){
    if(anchor.button) return menuPointFromButton(anchor.button);
    const source = anchor.source || inputDebugState.lastPointer;
    if(Number.isFinite(source?.clientX) && Number.isFinite(source?.clientY)){
      return {x:source.clientX, y:source.clientY};
    }
    if(source?.target instanceof Element){
      const rect = source.target.getBoundingClientRect();
      return {x:rect.left + rect.width / 2, y:rect.bottom + 8};
    }
    const layout = getEdgeLayout(edge);
    if(layout?.mid){
      const stageRect = stage.getBoundingClientRect();
      const stagePoint = worldToStage(layout.mid.x, layout.mid.y);
      return {x:stageRect.left + stagePoint.x, y:stageRect.top + stagePoint.y + 8};
    }
    return {x:window.innerWidth / 2, y:window.innerHeight / 2};
  }
  function showInsertBetweenMenu(edgeId, anchor={}){
    const edge = edgeById(edgeId);
    if(!edge){ showToast('Relationship not found'); return; }
    const point = relationshipInsertMenuPoint(edge, anchor);
    showMenu('Insert block between', [
      {label:'Concept block', action:'insert-concept'},
      {label:'Question block', action:'insert-question'},
      {label:'Evidence block', action:'insert-evidence'},
      {label:'Document block', action:'insert-document'}
    ], point.x, point.y, {type:'edge-insert', id:edge.id, trigger:'insert-between', source:anchor.source || inputDebugState.lastPointer});
  }
  function relationshipInsertNodeTemplate(blockType, options={}){
    if(blockType === 'document'){
      const documentRecord = documentById(options.documentId);
      if(!documentRecord){ showToast('Document not found'); return null; }
      const size = documentBlockSize();
      return {
        title:documentRecord.title,
        body:documentRecord.description || 'Add a note about why this document matters here.',
        group:'violet',
        shape:'note',
        tag:documentRecord.type,
        nodeType:'document',
        documentId:documentRecord.id,
        w:size.w,
        h:size.h
      };
    }
    const normalizedType = ['concept', 'question', 'evidence'].includes(blockType) ? blockType : 'concept';
    return workbenchBlockConfig(normalizedType);
  }
  function relationshipMidpointCandidates(layout, w, h){
    const preferred = {x:layout.mid.x - w / 2, y:layout.mid.y - h / 2};
    const dx = layout.toRect.cx - layout.fromRect.cx;
    const dy = layout.toRect.cy - layout.fromRect.cy;
    const length = Math.max(1, Math.hypot(dx, dy));
    const along = {x:dx / length, y:dy / length};
    const normal = {x:-along.y, y:along.x};
    const candidates = [];
    const addCentered = (center, offset) => candidates.push({x:center.x + offset.x - w / 2, y:center.y + offset.y - h / 2});
    [120, -120, 220, -220, 340, -340].forEach(distance => {
      addCentered(layout.mid, {x:normal.x * distance, y:normal.y * distance});
    });
    [150, -150, 280, -280].forEach(distance => {
      addCentered(layout.mid, {x:along.x * distance, y:along.y * distance});
    });
    [layout.from, layout.to].forEach(node => {
      candidatesAroundNode(node, w, h, 92).forEach(candidate => candidates.push(candidate));
      candidatesAroundNode(node, w, h, 210).forEach(candidate => candidates.push(candidate));
    });
    return {preferred, candidates};
  }
  function chooseRelationshipMidpointPlacement(edge, w, h){
    const layout = getEdgeLayout(edge);
    if(!layout) return null;
    updateOverlayOffsets();
    const {preferred, candidates} = relationshipMidpointCandidates(layout, w, h);
    return findFreeNodePlacement({
      preferredTopLeft:preferred,
      w,
      h,
      candidates,
      options:{includeShelf:true, includeToast:true, margin:18, collisionMargin:28}
    });
  }
  function insertBlockBetweenRelationship(relationshipEdgeId, blockType='concept', options={}){
    const edge = edgeById(relationshipEdgeId);
    if(!edge){ showToast('Relationship not found'); return null; }
    const fromNode = byId(edge.from);
    const toNode = byId(edge.to);
    if(!fromNode || !toNode || fromNode.id === toNode.id){
      showToast('Choose a valid relationship line.');
      return null;
    }
    const template = relationshipInsertNodeTemplate(blockType, options);
    if(!template) return null;
    const placement = chooseRelationshipMidpointPlacement(edge, template.w || 268, template.h || 145);
    if(!placement?.position){
      showToast('Could not find room for the new block.');
      return null;
    }
    const before = beginMapCommand();
    const original = cloneJson(edge);
    const {node:newNode, firstEdge, secondEdge} = buildInsertBetweenRelationshipPayload({
      originalEdge:original,
      template,
      placement:placement.position,
      createNodeId:id,
      createEdgeId:edgeId
    });
    const edgeIndex = data.edges.findIndex(entry => entry.id === original.id);
    if(edgeIndex < 0){
      showToast('Relationship not found');
      return null;
    }
    markStarterMeaningfulAction();
    clearRelationshipReviewAttempts(original.id);
    data.nodes.push(newNode);
    data.edges.splice(edgeIndex, 1, firstEdge, secondEdge);
    applySelectionSnapshot({nodes:[newNode.id], edges:[]});
    render();
    const committed = commitMapCommand('Inserted block between', before, {render:false});
    if(committed){
      showToast('Block inserted between connected blocks. Ctrl+Z to undo.');
      temporarilyPassThroughZoomDock();
      if(placement.reason === 'world-clear') panNodeIntoSafeArea(newNode, newNode.w, newNode.h, {includeShelf:true, includeToast:true, margin:18});
      requestAnimationFrame(() => {
        positionSelectionShelf();
        updateOverlayOffsets();
        panRenderedNodeAwayFromOverlayLanes(newNode, {includeShelf:true, includeToast:true, margin:12});
        renderEdges();
        nodeLayer.querySelector(`[data-id="${CSS.escape(newNode.id)}"] .node-title`)?.focus();
      });
      logInputDebug('insert-between-complete', options.source || inputDebugState.lastPointer, {mode:'edge', reason:blockType, edgeId:original.id});
    }
    return newNode;
  }
  function startReconnect(edgeId, mode, options={}){
    const edge = edgeById(edgeId);
    if(!edge) return;
    const selectedMode = mode === 'change-source' ? 'change-source' : 'change-target';
    cancelPlacementMode('reconnect');
    closeDocumentPicker();
    closeDocumentDetail();
    closeMenu();
    clearEdgeDeleteArm();
    connectFrom = null;
    activeConnectTargetTap = null;
    suppressedConnectClick = null;
    reconnectTarget = {edgeId:edge.id, mode:selectedMode};
    applySelectionSnapshot({nodes:[], edges:[edge.id]});
    syncGestureLockUI();
    render();
    const instruction = selectedMode === 'change-source'
      ? 'Tap a block to use as the new source. Esc to cancel.'
      : 'Tap a block to use as the new target. Esc to cancel.';
    connectText.textContent = instruction;
    cancelConnectButton.title = 'Cancel relationship reconnect mode';
    cancelConnectButton.setAttribute('aria-label', 'Cancel relationship reconnect mode');
    connectBanner.classList.add('show');
    setStatus(instruction);
    showToast(options.toast || instruction.replace(' Esc to cancel.', ''));
    logInputDebug('reconnect-start', options.source || inputDebugState.lastPointer, {mode:'edge', reason:selectedMode});
  }
  function cancelReconnect(options={}){
    const wasReconnecting = isReconnectTargetingActive() || !!activeConnectTargetTap;
    reconnectTarget = null;
    activeConnectTargetTap = null;
    suppressedConnectClick = null;
    syncGestureLockUI();
    connectBanner.classList.remove('show');
    cancelConnectButton.title = 'Cancel connect existing block mode';
    cancelConnectButton.setAttribute('aria-label', 'Cancel connect existing block mode');
    if(options.render !== false) render();
    if(options.announce) showToast(options.announce === true ? 'Connection canceled.' : options.announce);
    if(wasReconnecting) setStatus('Map ready');
    return wasReconnecting;
  }
  function completeReconnectToBlock(targetNodeId, sourceEvent=null){
    if(!isReconnectTargetingActive()) return false;
    const target = byId(targetNodeId);
    const edge = edgeById(reconnectTarget.edgeId);
    if(!target || !edge){
      cancelReconnect({announce:'Connection canceled.'});
      return false;
    }
    const mode = reconnectTarget.mode;
    const fixedEndpointId = mode === 'change-source' ? edge.to : edge.from;
    const currentEndpointId = mode === 'change-source' ? edge.from : edge.to;
    if(targetNodeId === currentEndpointId || targetNodeId === fixedEndpointId){
      showToast('Choose a different block.');
      return true;
    }
    const nextFrom = mode === 'change-source' ? targetNodeId : edge.from;
    const nextTo = mode === 'change-target' ? targetNodeId : edge.to;
    const duplicate = directedEdgeBetween(nextFrom, nextTo, edge.id);
    if(duplicate){
      reconnectTarget = null;
      activeConnectTargetTap = null;
      suppressedConnectClick = null;
      syncGestureLockUI();
      connectBanner.classList.remove('show');
      cancelConnectButton.title = 'Cancel connect existing block mode';
      cancelConnectButton.setAttribute('aria-label', 'Cancel connect existing block mode');
      applySelectionSnapshot({nodes:[], edges:[duplicate.id]});
      render();
      showToast('Those blocks are already connected.');
      return true;
    }
    const before = beginMapCommand();
    Object.assign(edge, changeRelationshipEndpoint(edge, mode, targetNodeId));
    clearRelationshipReviewAttempts(edge.id);
    applySelectionSnapshot({nodes:[], edges:[edge.id]});
    reconnectTarget = null;
    activeConnectTargetTap = null;
    suppressedConnectClick = null;
    syncGestureLockUI();
    connectBanner.classList.remove('show');
    cancelConnectButton.title = 'Cancel connect existing block mode';
    cancelConnectButton.setAttribute('aria-label', 'Cancel connect existing block mode');
    render();
    if(commitMapCommand('Updated relationship', before, {render:false})){
      showToast('Relationship updated. Ctrl+Z to undo.');
      temporarilyPassThroughZoomDock();
      logInputDebug('reconnect-complete', sourceEvent || inputDebugState.lastPointer, {mode:'edge', reason:mode});
    }
    return true;
  }
  function completeConnectToBlock(targetNodeId, sourceEvent=null){
    if(!connectFrom) return false;
    const sourceId = connectFrom;
    const source = byId(sourceId);
    const target = byId(targetNodeId);
    if(!source || !target){
      cancelConnect({announce:'Connection canceled.'});
      return false;
    }
    if(sourceId === targetNodeId){
      showToast('Choose a different block to connect.');
      return true;
    }
    const edge = addEdge(sourceId, targetNodeId, {
      toast:'Blocks connected. Ctrl+Z to undo.',
      duplicateToast:'Those blocks are already connected.',
      source:sourceEvent || inputDebugState.lastPointer
    });
    if(edge) cancelConnect();
    return !!edge;
  }
  function startConnect(nodeId, options={}){
    const source = byId(nodeId);
    if(!source) return;
    cancelPlacementMode('connect');
    closeDocumentPicker();
    closeDocumentDetail();
    closeMenu();
    clearEdgeDeleteArm();
    reconnectTarget = null;
    activeConnectTargetTap = null;
    connectFrom = nodeId;
    syncGestureLockUI();
    render();
    connectText.textContent = `Connecting from “${source.title || 'block'}”: tap a block to connect. Esc to cancel.`;
    cancelConnectButton.title = 'Cancel connect existing block mode';
    cancelConnectButton.setAttribute('aria-label', 'Cancel connect existing block mode');
    connectBanner.classList.add('show');
    setStatus('Tap a block to connect. Esc to cancel.');
    showToast(options.toast || 'Tap a block to connect');
    logInputDebug('connect-start', options.source || inputDebugState.lastPointer, {mode:'node', reason:options.origin || 'direct'});
  }
  function cancelConnect(options={}){
    const wasConnecting = !!connectFrom || !!activeConnectTargetTap;
    connectFrom = null;
    activeConnectTargetTap = null;
    suppressedConnectClick = null;
    syncGestureLockUI();
    connectBanner.classList.remove('show');
    render();
    if(options.announce) showToast(options.announce === true ? 'Connection canceled.' : options.announce);
    if(wasConnecting) setStatus('Map ready');
    return wasConnecting;
  }

  function tidy(){
    const before = beginMapCommand();
    const positions = { core:[-120,-40], money:[-620,-40], dependence:[-380,190], cheap:[-50,190], assets:[310,120], policy:[310,-170], public:[-50,-315], assetmgr:[-50,475], government:[-625,-315], crises:[-925,-110], media:[-760,275], bitcoin:[310,460], exit:[-380,675] };
    let custom = 0;
    data.nodes.forEach(n => { if(positions[n.id]){ n.x=positions[n.id][0]; n.y=positions[n.id][1]; } else { const col = custom % 4, row = Math.floor(custom/4); n.x = -820 + col*330; n.y = 930 + row*210; custom++; } });
    render(); commitMapCommand('Tidied map', before, {render:false}); recenter();
  }
  function downloadJson(payload, filename, toastText){
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 700);
    showToast(toastText);
  }
  function exportMap(){
    syncCurrentPage();
    const p = activePage();
    downloadJson(p.map, safeFileName(p.title) + '-page-map.json', 'Current map view exported');
  }
  function exportWorkspace(){
    syncCurrentPage();
    const payload = buildWorkspaceExportPayload(workspace);
    downloadJson(payload, 'learning-map-all-pages-workspace.json', 'All map views exported');
  }
  function importMap(file){
    if(!file) return; const reader = new FileReader();
    reader.onload = () => {
      try{
        if(reviewMode.active) exitReviewMode('map-import');
        const parsed = JSON.parse(reader.result);
        if(parsed && Array.isArray(parsed.pages)){
          workspace = normalizeWorkspace(parsed);
        }else{
          syncCurrentPage();
          appendImportedMapPage(workspace, file.name, parsed);
        }
        data = activePage().map; view = Object.assign({x:0,y:0,scale:1}, data.view);
        const importedSelection = data.nodes.some(n => n.id === 'core') ? 'core' : (data.nodes[0]?.id || null);
        applySelectionSnapshot({nodes:importedSelection ? [importedSelection] : [], edges:[]});
        resetMapHistory();
        connectFrom = null;
        reconnectTarget = null;
        render(); applyView(); save('Imported'); showToast('Import complete');
      }catch(e){ showToast('Import failed'); }
    };
    reader.readAsText(file);
  }
  function resetMap(){
    if(reviewMode.active) exitReviewMode('map-reset');
    const seededReset = runtimePageId === SEED_MAP_PAGE_ID;
    const promptText = seededReset
      ? 'Reset this map page to the original debt-power layout? Other map views stay safe.'
      : 'Reset this map page to a calm blank layout? Other map views stay safe.';
    if(!confirm(promptText)) return;
    data = seededReset ? cloneDefault() : blankMap();
    activePage().map = data;
    view = Object.assign({}, data.view);
    applySelectionSnapshot({nodes:['core'], edges:[]});
    resetMapHistory();
    connectFrom = null;
    reconnectTarget = null;
    render();
    recenter();
    save(seededReset ? 'Map page reset' : 'Blank map restored');
  }

  function showMenu(title, items, clientX, clientY, context){
    clearActivePortMenuButton();
    if(context?.type === 'canvas' || context?.type === 'page-menu'){
      clearSelection('menu-open', context?.source || inputDebugState.lastPointer);
    }
    menuContext = context || null;
    const source = context?.source || inputDebugState.lastPointer;
    logInputDebug('menu-open', source, {
      mode:context?.type || 'menu',
      reason:context?.trigger || 'direct',
      target:context?.source?.target || source?.target,
      edgeId:context?.type === 'edge' ? context?.id : context?.source?.edgeId,
      hitKind:context?.hitKind || context?.source?.hitKind || ''
    });
    if(context?.trigger === 'long-press') noteRecentLongPressMenu(source, context);
    menu.innerHTML = '';
    const heading = document.createElement('div'); heading.className = 'menu-title'; heading.textContent = title; menu.appendChild(heading);
    items.forEach(item => {
      if(item.type === 'section'){ const s = document.createElement('div'); s.className = 'menu-section'; s.textContent = item.label; menu.appendChild(s); return; }
      if(item.type === 'colors'){ const row = document.createElement('div'); row.className = 'menu-row'; colors.forEach(c => { const b = document.createElement('button'); b.className = `dot-${c}`; b.title = `Color: ${c}`; b.setAttribute('aria-label',`Color: ${c}`); b.dataset.action = 'color-' + c; b.textContent = c[0].toUpperCase(); row.appendChild(b); }); menu.appendChild(row); return; }
      if(item.type === 'shapes'){ const row = document.createElement('div'); row.className = 'menu-row'; shapes.forEach(s => { const b = document.createElement('button'); b.dataset.action = 'shape-' + s; b.textContent = s; row.appendChild(b); }); menu.appendChild(row); return; }
      if(item.type === 'sizes'){ const row = document.createElement('div'); row.className = 'menu-row'; Object.keys(sizePresets).forEach(s => { const b = document.createElement('button'); b.dataset.action = 'size-' + s; b.textContent = s; row.appendChild(b); }); menu.appendChild(row); return; }
      if(item.type === 'importance'){ const row = document.createElement('div'); row.className = 'menu-row'; [1,2,3].forEach(v => { const b = document.createElement('button'); b.dataset.action = 'importance-' + v; b.textContent = '★'.repeat(v); row.appendChild(b); }); menu.appendChild(row); return; }
      if(item.type === 'relations'){ const row = document.createElement('div'); row.className = 'menu-row'; Object.entries(relationStyles).forEach(([key,r]) => { const b = document.createElement('button'); b.dataset.action = 'relation-' + key; b.style.borderColor = r.color; b.textContent = r.label; row.appendChild(b); }); menu.appendChild(row); return; }
      if(item.type === 'strengths'){ const row = document.createElement('div'); row.className = 'menu-row'; [1,2,3,4,5].forEach(v => { const b = document.createElement('button'); b.dataset.action = 'strength-' + v; b.textContent = String(v); row.appendChild(b); }); menu.appendChild(row); return; }
      if(item.type === 'edgeShapes'){ const row = document.createElement('div'); row.className = 'menu-row'; edgeShapes.forEach(s => { const b = document.createElement('button'); b.dataset.action = 'edge-shape-' + s; b.textContent = s; row.appendChild(b); }); menu.appendChild(row); return; }
      if(item.type === 'fromPorts'){ const row = document.createElement('div'); row.className = 'menu-row'; ports.forEach(s => { const b = document.createElement('button'); b.dataset.action = 'port-from-' + s; b.textContent = portLabels[s]; row.appendChild(b); }); menu.appendChild(row); return; }
      if(item.type === 'toPorts'){ const row = document.createElement('div'); row.className = 'menu-row'; ports.forEach(s => { const b = document.createElement('button'); b.dataset.action = 'port-to-' + s; b.textContent = portLabels[s]; row.appendChild(b); }); menu.appendChild(row); return; }
      if(item.type === 'linkedDirs'){ const row = document.createElement('div'); row.className = 'menu-row'; ['top','right','bottom','left'].forEach(s => { const b = document.createElement('button'); b.dataset.action = 'add-linked-' + s; b.textContent = s; row.appendChild(b); }); menu.appendChild(row); return; }
      const b = document.createElement('button'); b.type = 'button'; b.dataset.action = item.action; b.textContent = item.label; if(item.title) b.title = item.title; b.setAttribute('aria-label', item.ariaLabel || item.label); if(item.danger) b.classList.add('danger'); if(item.disabled) b.disabled = true; menu.appendChild(b);
    });
    menu.classList.add('show'); menu.setAttribute('aria-hidden','false');
    const pad = 8, rect = menu.getBoundingClientRect(); let x = clientX, y = clientY;
    if(x + rect.width > window.innerWidth - pad) x = window.innerWidth - rect.width - pad;
    if(y + rect.height > window.innerHeight - pad) y = window.innerHeight - rect.height - pad;
    menu.style.left = Math.max(pad,x) + 'px'; menu.style.top = Math.max(pad,y) + 'px';
  }
  function closeMenu(){ clearActivePortMenuButton(); menu.classList.remove('show'); menu.setAttribute('aria-hidden','true'); menuContext = null; }
  function nodeMenu(node, clientX, clientY, extraContext={}){
    const isTarget = connectFrom && connectFrom !== node.id;
    const documentActions = node.nodeType === 'document' ? [{label:'▣ Open document details', action:'document-details'}] : [];
    showMenu(node.title || 'Block', [
      {label:'✎ Edit title', action:'edit-title'}, {label:'☰ Edit body text', action:'edit-body'},
      ...documentActions,
      {label:'＋ Add linked block', action:'add-linked-node'}, {type:'section', label:'Add linked block from side'}, {type:'linkedDirs'}, ...(isTarget ? [{label:'⛓ Connect pending source to this', action:'connect-pending'}] : []),
      {label:'⛓ Start connection from this', action:'start-connect'}, {label:'↳ Create detail map view from this block', action:'page-from-node'}, {label:'⧉ Duplicate block', action:'duplicate'}, {label:'◎ Center on this block', action:'center-node'},
      {type:'section', label:'Block color'}, {type:'colors'}, {type:'section', label:'Block shape'}, {type:'shapes'}, {type:'section', label:'Block size'}, {type:'sizes'}, {type:'section', label:'Importance'}, {type:'importance'},
      {label:'⌫ Remove all its connections', action:'remove-edges'}, {label:'Delete block', action:'delete-node', danger:true}
    ], clientX, clientY, {type:'node', id:node.id, ...extraContext});
  }
  function edgeMenu(edge, clientX, clientY, extraContext={}){
    const from = byId(edge.from), to = byId(edge.to), rel = relationStyles[edge.relation] || relationStyles.causes;
    showMenu(`${from?.title || 'Block'} — ${to?.title || 'Block'}`, [
      {label:'✎ Rename link label', action:'edge-label'}, {label:'⇄ Reverse direction', action:'edge-reverse'},
      {label:'Insert block between', action:'edge-insert-between', title:'Insert block between', ariaLabel:'Insert block between'},
      {label:'Change source', action:'edge-change-source', title:'Change source', ariaLabel:'Change source'},
      {label:'Change target', action:'edge-change-target', title:'Change target', ariaLabel:'Change target'},
      {type:'section', label:'Relationship type'}, {type:'relations'},
      {type:'section', label:'Importance / thickness'}, {type:'strengths'},
      {type:'section', label:'Line route'}, {type:'edgeShapes'},
      {type:'section', label:'From-side connection point'}, {type:'fromPorts'},
      {type:'section', label:'To-side connection point'}, {type:'toPorts'},
      {label:'Delete this link', action:'edge-delete', danger:true},
      {type:'section', label:'Current meaning'}, {label:`${rel.label}: ${rel.note}`, action:'noop', disabled:true}
    ], clientX, clientY, {type:'edge', id:edge.id, ...extraContext});
  }
  function canvasMenu(worldPoint, clientX, clientY, extraContext={}){
    const selected = byId(selectedId);
    showMenu('Canvas space', [
      {label:'＋ Add free block here', action:'add-free-here'}, {label:'＋↗ Add linked block from selected here', action:'add-linked-here', disabled:!selected},
      {label:'▣ Add document block here', action:'add-document-block'},
      {label:'◎ Recenter full map', action:'recenter'}, {label:'1× Reset zoom around selected', action:'reset-view'},
      {label:focusMode ? '◉ Turn focus mode off' : '◉ Turn focus mode on', action:'toggle-focus'}, {label:'↺ Show remember prompt', action:'toggle-remember'}, {label:'? Show visual code', action:'toggle-legend'},
      {label:'⌁ Tidy map layout', action:'tidy'}, {label:'＋ Create new map view', action:'new-page'}, {label:'⧉ Duplicate map view', action:'duplicate-page'}, {label:'⇩ Export current map view', action:'export'}, {label:'⇩ Export map workspace backup', action:'export-workspace'}, {label:'⇧ Import map or workspace', action:'import-file'}
    ], clientX, clientY, {type:'canvas', point:worldPoint, ...extraContext});
  }
  function pageMenu(clientX, clientY){
    const items = [{type:'section', label:'Switch map view'}];
    workspace.pages.forEach(p => items.push({label:(p.id === workspace.activePageId ? '✓ ' : '') + (p.title || 'Untitled view'), action:'switch-page-' + p.id}));
    items.push(
      {type:'section', label:'Create and manage'},
      {label:'＋ New blank map view', action:'new-page'},
      {label:'⧉ Duplicate current map view', action:'duplicate-page'},
      {label:'✎ Rename current map view', action:'rename-page'},
      {label:'⇩ Export current map view', action:'export'},
      {label:'⇩ Export all map views', action:'export-workspace'},
      {label:'Delete current map view', action:'delete-page', danger:true, disabled:workspace.pages.length <= 1}
    );
    showMenu('Map views', items, clientX || window.innerWidth - 240, clientY || 70, {type:'page-menu'});
  }
  function runMenuAction(ctx, action){
    if(!ctx || !action || action === 'noop') return;
    if(ctx.type === 'page-menu'){
      if(action.startsWith('switch-page-')) switchPage(action.replace('switch-page-',''));
      else if(action === 'new-page') createNewPage();
      else if(action === 'duplicate-page') duplicateCurrentPage();
      else if(action === 'rename-page') renameCurrentPage();
      else if(action === 'delete-page') deleteCurrentPage();
      else if(action === 'export') exportMap();
      else if(action === 'export-workspace') exportWorkspace();
    }else if(ctx.type === 'node'){
      const n = byId(ctx.id); if(!n) return;
      if(action === 'edit-title') focusNodeEditor(n.id);
      else if(action === 'edit-body'){
        const el = nodeLayer.querySelector(`[data-id="${CSS.escape(n.id)}"]`);
        el?.querySelector('.node-body')?.focus();
      }
      else if(action === 'add-linked-node') addLinkedFrom(n.id);
      else if(action === 'document-details') openDocumentDetail(n);
      else if(action.startsWith('add-linked-')) addLinkedFrom(n.id, undefined, undefined, action.replace('add-linked-',''));
      else if(action === 'start-connect') startConnect(n.id);
      else if(action === 'page-from-node') createPageFromNode(n.id);
      else if(action === 'connect-pending') completeConnectToBlock(n.id, ctx.source || inputDebugState.lastPointer);
      else if(action === 'duplicate') duplicateNode(n.id);
      else if(action === 'center-node') centerOnNode(n.id);
      else if(action === 'remove-edges') removeNodeEdges(n.id);
      else if(action === 'delete-node') deleteNode(n.id);
      else if(action.startsWith('color-')) setNodeColor(n.id, action.replace('color-',''));
      else if(action.startsWith('shape-')) setNodeShape(n.id, action.replace('shape-',''));
      else if(action.startsWith('size-')) setNodeSize(n.id, action.replace('size-',''));
      else if(action.startsWith('importance-')) setNodeImportance(n.id, action.replace('importance-',''));
    }else if(ctx.type === 'edge'){
      const edge = edgeById(ctx.id); if(!edge) return;
      if(action === 'edge-label') setEdgeLabel(edge.id);
      else if(action === 'edge-reverse') reverseEdge(edge.id);
      else if(action === 'edge-insert-between') showInsertBetweenMenu(edge.id, {source:ctx.source || inputDebugState.lastPointer});
      else if(action === 'edge-change-source') startReconnect(edge.id, 'change-source', {source:ctx.source || inputDebugState.lastPointer});
      else if(action === 'edge-change-target') startReconnect(edge.id, 'change-target', {source:ctx.source || inputDebugState.lastPointer});
      else if(action === 'edge-delete') deleteEdge(edge.id);
      else if(action.startsWith('relation-')) setEdgeRelation(edge.id, action.replace('relation-',''));
      else if(action.startsWith('strength-')) setEdgeStrength(edge.id, action.replace('strength-',''));
      else if(action.startsWith('edge-shape-')) setEdgeShape(edge.id, action.replace('edge-shape-',''));
      else if(action.startsWith('port-from-')) setEdgePort(edge.id, 'from', action.replace('port-from-',''));
      else if(action.startsWith('port-to-')) setEdgePort(edge.id, 'to', action.replace('port-to-',''));
    }else if(ctx.type === 'edge-insert'){
      const edge = edgeById(ctx.id); if(!edge) return;
      if(action === 'insert-document') openDocumentPicker(null, {relationshipInsert:{edgeId:edge.id}});
      else if(action.startsWith('insert-')) insertBlockBetweenRelationship(edge.id, action.replace('insert-',''), {source:ctx.source || inputDebugState.lastPointer});
    }else if(ctx.type === 'port'){
      if(action === 'port-connect-existing') startConnect(ctx.id, {origin:'port', side:ctx.side, toast:'Tap a block to connect', source:ctx.source});
      else if(action === 'port-add-document') openDocumentPicker(null, {quickAdd:{sourceId:ctx.id, side:ctx.side}});
      else if(action.startsWith('port-add-')) createPortLinkedBlock(ctx.id, ctx.side, action.replace('port-add-',''));
    }else if(ctx.type === 'canvas'){
      const p = ctx.point;
      if(action === 'add-free-here') addNodeAt(p.x, p.y);
      else if(action === 'add-linked-here' && selectedId) addNodeAt(p.x, p.y, {linkFrom:selectedId});
      else if(action === 'add-document-block') openDocumentPicker(p);
      else if(action === 'recenter') recenter();
      else if(action === 'reset-view') resetView();
      else if(action === 'toggle-focus') toggleFocus();
      else if(action === 'toggle-remember') toggleRemember();
      else if(action === 'toggle-legend') toggleLegend();
      else if(action === 'tidy') tidy();
      else if(action === 'new-page') createNewPage();
      else if(action === 'duplicate-page') duplicateCurrentPage();
      else if(action === 'export-workspace') exportWorkspace();
      else if(action === 'export') exportMap();
      else if(action === 'import-file') importFileInput?.click();
    }
  }

  menu.addEventListener('click', e => {
    const b = e.target.closest('button[data-action]'); if(!b || b.disabled || !menuContext) return;
    const action = b.dataset.action, ctx = menuContext; if(action === 'noop') return; closeMenu();
    runMenuAction(ctx, action);
  });
  menu.addEventListener('contextmenu', e => {
    if(suppressRecentContextMenu(e, recentLongPressMenu?.mode || 'menu', menu, {edgeId:recentLongPressMenu?.edgeId || '', hitKind:recentLongPressMenu?.hitKind || ''})) return;
    e.preventDefault();
    e.stopPropagation();
  });

  stage.addEventListener('pointerdown', e => {
    if(!pendingPlacement) return;
    if(e.button !== 0) return;
    const target = e.target instanceof Element ? e.target : null;
    if(isPlacementControlTarget(target)) return;
    e.preventDefault();
    e.stopPropagation();
    cancelLongPress(e.pointerId, 'placement', e);
    stopCanvasPan(false);
    completePlacementAt(e.clientX, e.clientY, e);
  }, true);
  stage.addEventListener('pointerdown', e => {
    if(!isBlockTargetingActive() || e.button !== 0) return;
    const target = e.target instanceof Element ? e.target : null;
    if(!target || isCanvasGestureBlockedTarget(target)) return;
    e.preventDefault();
    e.stopPropagation();
    cancelLongPress(e.pointerId, 'connect-canvas-cancel', e);
    stopCanvasPan(false);
    cancelBlockTargeting({announce:'Connection canceled.'});
  }, true);
  stage.addEventListener('pointermove', e => {
    if(!pendingPlacement) return;
    updatePlacementGhost(e);
  }, true);
  stage.addEventListener('pointerleave', () => {
    if(placementGhost) placementGhost.hidden = true;
  });
  stage.addEventListener('click', e => {
    if(!suppressNextPlacementClick) return;
    suppressNextPlacementClick = false;
    if(e.target instanceof Element && isPlacementControlTarget(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
  }, true);
  nodeLayer.addEventListener('contextmenu', e => { const el = e.target.closest('.map-node') || e.target.closest('#nodeLayer') || e.target.closest('.drag-handle') || e.target.closest('.resize-handle') || e.target.closest('.connection-port'); if(!el) return; if(suppressGestureContextMenu(e, 'node', e.target.closest('.drag-handle') || e.target.closest('.resize-handle') || e.target.closest('.connection-port') || el)) return; if(suppressRecentContextMenu(e, 'node', el)) return; e.preventDefault(); closeMenu(); const nodeEl = e.target.closest('.map-node'); const n = nodeEl ? byId(nodeEl.dataset.id) : null; if(!n) return; select(n.id); nodeMenu(n, e.clientX, e.clientY, {trigger:'contextmenu', source:e}); });
  edgeLabelLayer.addEventListener('contextmenu', e => { const lab = e.target.closest('.edge-label'); if(!lab) return; const ed = edgeById(lab.dataset.edgeId); if(suppressGestureContextMenu(e, 'edge', lab, {edgeId:ed?.id, hitKind:'edge-label'})) return; if(suppressRecentContextMenu(e, 'edge', lab, {edgeId:ed?.id, hitKind:'edge-label'})) return; e.preventDefault(); closeMenu(); if(!ed) return; selectEdge(ed.id); edgeMenu(ed, e.clientX, e.clientY, {trigger:'contextmenu', source:e, hitKind:'edge-label'}); });
  edgeLayer.addEventListener('contextmenu', e => { const g = e.target.closest('g.edge-group'); if(!g) return; const ed = edgeById(g.dataset.edgeId); const hitKind = e.target.closest('.edge-hit') ? 'edge-hit-target' : 'edge-group'; if(suppressGestureContextMenu(e, 'edge', g, {edgeId:ed?.id, hitKind})) return; if(suppressRecentContextMenu(e, 'edge', g, {edgeId:ed?.id, hitKind})) return; e.preventDefault(); closeMenu(); if(!ed) return; selectEdge(ed.id); edgeMenu(ed, e.clientX, e.clientY, {trigger:'contextmenu', source:e, hitKind}); });
  stage.addEventListener('contextmenu', e => { if(pendingPlacement){ e.preventDefault(); e.stopPropagation(); return; } if(suppressGestureContextMenu(e, 'canvas', e.target.closest('#stage') || stage)) return; if(suppressRecentContextMenu(e, 'canvas', stage)) return; if(e.target.closest('.map-node') || e.target.closest('.toolbar') || e.target.closest('.zoom-dock') || e.target.closest('.side-panel') || e.target.closest('.review-panel') || e.target.closest('.map-workbench') || e.target.closest('.selection-shelf') || e.target.closest('.connect-banner') || e.target.closest('.input-debug') || e.target.closest('.menu') || e.target.closest('.document-picker') || e.target.closest('.document-detail-card') || e.target.closest('.edge-label') || e.target.closest('g.edge-group')) return; e.preventDefault(); closeMenu(); canvasMenu(screenToWorld(e.clientX, e.clientY), e.clientX, e.clientY, {trigger:'contextmenu', source:e}); });

  nodeLayer.addEventListener('pointerdown', e => {
    const port = e.target.closest('.connection-port');
    if(!port || e.button !== 0) return;
    e.stopPropagation();
    closeMenu();
    cancelLongPress(e.pointerId, 'connection-port', e);
    if(isTouchLikePointer(e)){
      e.preventDefault();
      startPortTap(port, e);
      setPointerGestureOwner(e.pointerId, {owner:'port', nodeId:port.dataset.nodeId, side:port.dataset.portSide});
    }
  }, true);
  nodeLayer.addEventListener('pointermove', e => {
    if(!activePortTap || activePortTap.pointerId !== e.pointerId) return;
    e.stopPropagation();
    if(isTouchLikePointer(e)) e.preventDefault();
    if(portTapMoved(e)){
      clearPortTap(e.pointerId);
      clearPointerGestureOwner(e.pointerId);
    }
  }, true);
  nodeLayer.addEventListener('pointerup', e => {
    const port = e.target.closest('.connection-port');
    if(!port){
      clearPortTap(e.pointerId);
      return;
    }
    e.stopPropagation();
    cancelLongPress(e.pointerId, 'connection-port', e);
    if(portTapCanOpen(port, e)){
      e.preventDefault();
      suppressNextPortClick(port);
      clearPortTap(e.pointerId);
      clearPointerGestureOwner(e.pointerId);
      openPortQuickAddMenu(port);
      return;
    }
    clearPortTap(e.pointerId);
    clearPointerGestureOwner(e.pointerId);
  }, true);
  nodeLayer.addEventListener('pointercancel', e => {
    if(!activePortTap || activePortTap.pointerId !== e.pointerId) return;
    clearPortTap(e.pointerId);
    clearPointerGestureOwner(e.pointerId);
  }, true);
  nodeLayer.addEventListener('click', e => {
    const port = e.target.closest('.connection-port');
    if(!port) return;
    e.preventDefault();
    e.stopPropagation();
    if(consumeSuppressedPortClick(port)) return;
    openPortQuickAddMenu(port);
  }, true);

  nodeLayer.addEventListener('pointerdown', e => {
    if(!isBlockTargetingActive() || !isTouchLikePointer(e) || e.button !== 0) return;
    const target = e.target instanceof Element ? e.target : null;
    const el = target?.closest('.map-node');
    if(!el || target.closest('.connection-port,.drag-handle,.resize-handle,[contenteditable]')) return;
    e.preventDefault();
    e.stopPropagation();
    closeMenu();
    cancelLongPress(e.pointerId, 'connect-target', e);
    startConnectTargetTap(el.dataset.id, e);
    setPointerGestureOwner(e.pointerId, {owner:'connect-target', nodeId:el.dataset.id});
  }, true);
  nodeLayer.addEventListener('pointermove', e => {
    if(!activeConnectTargetTap || activeConnectTargetTap.pointerId !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    if(connectTargetTapMoved(e)){
      clearConnectTargetTap(e.pointerId);
      clearPointerGestureOwner(e.pointerId);
    }
  }, true);
  nodeLayer.addEventListener('pointerup', e => {
    if(!activeConnectTargetTap || activeConnectTargetTap.pointerId !== e.pointerId) return;
    const targetNodeId = activeConnectTargetTap.nodeId;
    e.preventDefault();
    e.stopPropagation();
    cancelLongPress(e.pointerId, 'connect-target', e);
    if(!connectTargetTapMoved(e)){
      suppressNextConnectClick(targetNodeId);
      completeBlockTargetingToBlock(targetNodeId, e);
    }
    clearConnectTargetTap(e.pointerId);
    clearPointerGestureOwner(e.pointerId);
  }, true);
  nodeLayer.addEventListener('pointercancel', e => {
    if(!activeConnectTargetTap || activeConnectTargetTap.pointerId !== e.pointerId) return;
    clearConnectTargetTap(e.pointerId);
    clearPointerGestureOwner(e.pointerId);
  }, true);

  nodeLayer.addEventListener('click', e => { const detailButton = e.target.closest('[data-action="document-detail"]'); if(detailButton){ const nodeEl = detailButton.closest('.map-node'); const node = nodeEl ? byId(nodeEl.dataset.id) : null; if(node) openDocumentDetail(node); e.stopPropagation(); return; } const el = e.target.closest('.map-node'); if(!el) return; if(consumeSuppressedConnectClick(el.dataset.id)){ e.preventDefault(); e.stopPropagation(); return; } logInputDebug('tap', inputDebugState.lastPointer, {mode:'node', target:el}); if(isBlockTargetingActive()){ e.preventDefault(); e.stopPropagation(); completeBlockTargetingToBlock(el.dataset.id, e); return; } if(shouldToggleSelection(e)) toggleNodeSelection(el.dataset.id, 'toggle-node', e); else select(el.dataset.id); });
  edgeLabelLayer.addEventListener('click', e => { const lab = e.target.closest('.edge-label'); if(!lab) return; logInputDebug('tap', inputDebugState.lastPointer, {mode:'edge', target:lab}); if(shouldToggleSelection(e)) toggleEdgeSelection(lab.dataset.edgeId, 'toggle-line', e); else selectEdge(lab.dataset.edgeId); });
  edgeLayer.addEventListener('click', e => { const g = e.target.closest('g.edge-group'); if(!g) return; logInputDebug('tap', inputDebugState.lastPointer, {mode:'edge', target:g}); if(shouldToggleSelection(e)) toggleEdgeSelection(g.dataset.edgeId, 'toggle-line', e); else selectEdge(g.dataset.edgeId); });
  nodeLayer.addEventListener('focusin', e => { const field = e.target.dataset.field, el = e.target.closest('.map-node'); if(!field || !el) return; beginTextEdit(el.dataset.id, field); });
  nodeLayer.addEventListener('focusout', e => { if(e.target.closest('[contenteditable]')) commitTextEdit('blur'); });
  nodeLayer.addEventListener('input', e => { const field = e.target.dataset.field, el = e.target.closest('.map-node'); if(!field || !el) return; const n = byId(el.dataset.id); if(!n) return; beginTextEdit(el.dataset.id, field); n[field] = clean(e.target.textContent) || (field === 'title' ? 'Untitled block' : ''); renderEdges(); save('Saved'); updateSelectionUI(); updatePrompt(); });
  nodeLayer.addEventListener('paste', e => { if(!e.target.closest('[contenteditable]')) return; e.preventDefault(); const text = (e.clipboardData || window.clipboardData).getData('text/plain'); document.execCommand('insertText', false, text); });

  nodeLayer.addEventListener('pointerdown', e => {
    if(dragNode && dragNode.pointerId !== e.pointerId) return;
    const resize = e.target.closest('.resize-handle');
    if(resize){ const el = resize.closest('.map-node'), n = byId(el.dataset.id); if(!n) return; cancelLongPress(e.pointerId, 'resize-start', e); e.preventDefault(); closeMenu(); clearEdgeDeleteArm(); suppressSelectionShelf = true; select(n.id, 'resize-start'); resizeNode = {id:n.id, pointerId:e.pointerId, sx:e.clientX, sy:e.clientY, w:n.w, h:n.h, handle:resize, beforeCommand:beginMapCommand()}; noteDragInteraction('resize-handle', e.pointerId, resize); setGestureLock('node-resize', true); resize.setPointerCapture(e.pointerId); logInputDebug('resize-start', e, {mode:'node', target:resize}); return; }
    const handle = e.target.closest('.drag-handle');
    if(handle){
      const el = handle.closest('.map-node'), n = byId(el.dataset.id); if(!n) return;
      cancelLongPress(e.pointerId, 'drag-start', e);
      e.preventDefault(); e.stopPropagation(); closeMenu(); clearEdgeDeleteArm(); suppressSelectionShelf = true;
      const preserveSelectionForDrag = selectedNodeIds.has(n.id) && (selectedNodeIds.size > 1 || selectedEdgeIds.size > 0);
      if(preserveSelectionForDrag) syncSelectionAliases();
      else select(n.id, 'drag-start');
      const dragItems = Array.from(selectedNodeIds).map(nodeId => byId(nodeId)).filter(Boolean).map(node => ({id:node.id, x:node.x, y:node.y}));
      if(!dragItems.some(item => item.id === n.id)) dragItems.push({id:n.id, x:n.x, y:n.y});
      dragNode = {
        id:n.id,
        pointerId:e.pointerId,
        sx:e.clientX,
        sy:e.clientY,
        x:n.x,
        y:n.y,
        items:dragItems,
        handle,
        captureTarget:nodeLayer,
        captureAcquired:false,
        beforeCommand:beginMapCommand()
      };
      noteDragInteraction('drag-handle', e.pointerId, handle); setGestureLock('node-drag', true);
      logInputDebug('drag-start', e, {mode:'node', target:handle});
      dragNode.captureAcquired = requestPointerCapture(nodeLayer, e.pointerId, e, 'node');
      return;
    }
    const el = e.target.closest('.map-node');
    if(!el || !isTouchLikePointer(e) || e.target.closest('[contenteditable]')) return;
    const node = byId(el.dataset.id);
    if(!node) return;
    e.preventDefault();
    if(multiSelectMode){
      e.stopPropagation();
      closeMenu();
      toggleNodeSelection(node.id, 'touch-toggle-node', e);
      setPointerGestureOwner(e.pointerId, {owner:'node', nodeId:node.id});
      return;
    }
    closeMenu();
    startLongPress({type:'node', id:node.id, pointerId:e.pointerId, pointerType:e.pointerType, buttons:e.buttons, pressure:e.pressure, tiltX:e.tiltX, tiltY:e.tiltY, clientX:e.clientX, clientY:e.clientY, target:el});
  });
  nodeLayer.addEventListener('pointermove', e => {
    if(resizeNode){ const n = byId(resizeNode.id); if(!n) return; n.w = clamp(Math.round(resizeNode.w + (e.clientX - resizeNode.sx)/view.scale), 160, 640); n.h = clamp(Math.round(resizeNode.h + (e.clientY - resizeNode.sy)/view.scale), 95, 520); const el = nodeLayer.querySelector(`[data-id="${CSS.escape(n.id)}"]`); if(el){ el.style.width = n.w + 'px'; el.style.height = n.h + 'px'; } renderEdges(); return; }
    if(!dragNode || dragNode.pointerId !== e.pointerId) return;
    e.preventDefault();
    const dx = (e.clientX - dragNode.sx) / view.scale;
    const dy = (e.clientY - dragNode.sy) / view.scale;
    (dragNode.items || [{id:dragNode.id, x:dragNode.x, y:dragNode.y}]).forEach(item => {
      const n = byId(item.id);
      if(!n) return;
      n.x = Math.round(item.x + dx);
      n.y = Math.round(item.y + dy);
      const el = nodeLayer.querySelector(`[data-id="${CSS.escape(n.id)}"]`);
      if(el){
        el.style.left = n.x + 'px';
        el.style.top = n.y + 'px';
      }
    });
    renderEdges();
  });
  nodeLayer.addEventListener('pointerup', e => { cancelLongPress(e.pointerId, 'pointerup', e); if(resizeNode && resizeNode.pointerId === e.pointerId){ const activeResize = resizeNode; setGestureLock('node-resize', false); finishDragInteraction(e.pointerId, 'pointerup', activeResize.handle); logInputDebug('resize-end', e, {mode:'node'}); resizeNode=null; suppressSelectionShelf = false; renderEdges(); updateSelectionUI('resize-end'); commitMapCommand('Resized block', activeResize.beforeCommand, {render:false}); showToast('Resized'); } finishNodeDrag(e, 'pointerup'); });
  nodeLayer.addEventListener('pointercancel', e => { cancelLongPress(e.pointerId, 'pointercancel', e); if(resizeNode && resizeNode.pointerId === e.pointerId){ const activeResize = resizeNode; setGestureLock('node-resize', false); finishDragInteraction(e.pointerId, 'pointercancel', activeResize.handle); logInputDebug('resize-end', e, {mode:'node', reason:'pointercancel'}); resizeNode=null; suppressSelectionShelf = false; renderEdges(); updateSelectionUI('resize-cancel'); commitMapCommand('Resized block', activeResize.beforeCommand, {render:false}); } finishNodeDrag(e, 'pointercancel'); });
  nodeLayer.addEventListener('lostpointercapture', e => {
    if(!dragNode || dragNode.pointerId !== e.pointerId) return;
    finishNodeDrag(e, 'lostpointercapture');
  });
  edgeLabelLayer.addEventListener('pointerdown', e => {
    const label = e.target.closest('.edge-label');
    if(!label || !isTouchLikePointer(e)) return;
    const edge = edgeById(label.dataset.edgeId);
    if(!edge) return;
    e.preventDefault();
    e.stopPropagation();
    closeMenu();
    if(multiSelectMode){
      toggleEdgeSelection(edge.id, 'touch-toggle-line', e);
      setPointerGestureOwner(e.pointerId, {owner:'edge', edgeId:edge.id, hitKind:'edge-label'});
      return;
    }
    selectEdge(edge.id);
    setPointerGestureOwner(e.pointerId, {owner:'edge', edgeId:edge.id, hitKind:'edge-label'});
    startLongPress({type:'edge', id:edge.id, edgeId:edge.id, hitKind:'edge-label', suppressed:'canvas-long-press', pointerId:e.pointerId, pointerType:e.pointerType, buttons:e.buttons, pressure:e.pressure, tiltX:e.tiltX, tiltY:e.tiltY, clientX:e.clientX, clientY:e.clientY, target:label});
  });
  edgeLayer.addEventListener('pointerdown', e => {
    const group = e.target.closest('g.edge-group');
    if(!group || !isTouchLikePointer(e)) return;
    const edge = edgeById(group.dataset.edgeId);
    if(!edge) return;
    e.preventDefault();
    e.stopPropagation();
    closeMenu();
    const hitKind = e.target.closest('.edge-hit') ? 'edge-hit-target' : 'edge-group';
    if(multiSelectMode){
      toggleEdgeSelection(edge.id, 'touch-toggle-line', e);
      setPointerGestureOwner(e.pointerId, {owner:'edge', edgeId:edge.id, hitKind});
      return;
    }
    selectEdge(edge.id);
    setPointerGestureOwner(e.pointerId, {owner:'edge', edgeId:edge.id, hitKind});
    startLongPress({type:'edge', id:edge.id, edgeId:edge.id, hitKind, suppressed:'canvas-long-press', pointerId:e.pointerId, pointerType:e.pointerType, buttons:e.buttons, pressure:e.pressure, tiltX:e.tiltX, tiltY:e.tiltY, clientX:e.clientX, clientY:e.clientY, target:group});
  });

  stage.addEventListener('pointerdown', e => {
    if(dragNode || marqueeSelection) return;
    if(getPointerGestureOwner(e.pointerId)) return;
    if(isTouchGesturePointer(e)){
      activeTouchPoints.set(e.pointerId, stageCoords(e.clientX, e.clientY));
      if(activeTouchPoints.size >= 2){
        cancelLongPress(null, 'pinch-start', e);
        clearSelection('pinch-start', e);
        stopCanvasPan(false);
        touchGesture = createTouchGestureState();
        return;
      }
    }
    if(e.button !== 0) return;
    const target = e.target instanceof Element ? e.target : null;
    if(isCanvasGestureBlockedTarget(target)) return;
    if(canStartMarqueeSelection(e, target)){
      beginMarqueeSelection(e);
      return;
    }
    e.preventDefault();
    closeMenu();
    if(multiSelectMode) return;
    clearSelection('canvas-deselect', e);
    if(isTouchLikePointer(e)){
      startLongPress({type:'canvas', pointerId:e.pointerId, pointerType:e.pointerType, buttons:e.buttons, pressure:e.pressure, tiltX:e.tiltX, tiltY:e.tiltY, clientX:e.clientX, clientY:e.clientY, target:stage});
      return;
    }
    beginCanvasPan(e);
  });
  stage.addEventListener('pointermove', e => {
    if(updateMarqueeSelection(e)) return;
    if(isTouchGesturePointer(e) && activeTouchPoints.has(e.pointerId)){
      activeTouchPoints.set(e.pointerId, stageCoords(e.clientX, e.clientY));
      if(activeTouchPoints.size >= 2){
        cancelLongPress(null, 'pinch-move', e);
        stopCanvasPan(false);
        updateTouchGesture();
        return;
      }
    }
    if(longPressState && longPressState.pointerId === e.pointerId){
      const moved = Math.hypot(e.clientX - longPressState.clientX, e.clientY - longPressState.clientY);
      if(moved > LONG_PRESS_MOVE){
        const pressType = longPressState.type;
        cancelLongPress(e.pointerId, 'movement', e);
        if(pressType === 'canvas' && isTouchLikePointer(e) && activeTouchPoints.size < 2) beginCanvasPan(e);
      }
    }
    if(!panDrag || panDrag.pointerId !== e.pointerId) return;
    view.x = panDrag.x + (e.clientX - panDrag.sx);
    view.y = panDrag.y + (e.clientY - panDrag.sy);
    applyView();
  });
  stage.addEventListener('pointerup', e => {
    cancelLongPress(e.pointerId, 'pointerup', e);
    if(finishMarqueeSelection(e, 'pointerup')) return;
    if(isTouchGesturePointer(e)){
      activeTouchPoints.delete(e.pointerId);
      if(touchGesture && activeTouchPoints.size < 2){
        setGestureLock('canvas-pinch', false);
        logInputDebug('pinch-end', e, {mode:'canvas'});
        touchGesture = null;
        save('View saved');
      }
    }
    stopCanvasPan(true, e.pointerId);
  });
  stage.addEventListener('pointercancel', e => {
    cancelLongPress(e.pointerId, 'pointercancel', e);
    if(marqueeSelection?.pointerId === e.pointerId){
      cancelMarqueeSelection('pointercancel', e);
      return;
    }
    if(isTouchGesturePointer(e)){
      activeTouchPoints.delete(e.pointerId);
      if(touchGesture && activeTouchPoints.size < 2){
        setGestureLock('canvas-pinch', false);
        logInputDebug('pinch-end', e, {mode:'canvas', reason:'pointercancel'});
        touchGesture = null;
        save('View saved');
      }
    }
    stopCanvasPan(true, e.pointerId);
  });
  stage.addEventListener('lostpointercapture', e => {
    if(marqueeSelection?.pointerId === e.pointerId) cancelMarqueeSelection('lostpointercapture', e);
  });
  stage.addEventListener('wheel', e => {
    if(e.target.closest('.menu') || e.target.closest('.map-workbench') || e.target.closest('.review-panel')) return;
    e.preventDefault(); closeMenu();
    const modeScale = e.deltaMode === 1 ? 16 : (e.deltaMode === 2 ? 600 : 1);
    const dx = e.deltaX * modeScale, dy = e.deltaY * modeScale;
    if(e.ctrlKey || e.metaKey){
      const factor = clamp(Math.exp(-dy * 0.0027), 0.76, 1.32);
      // Anchor trackpad/browser zoom on the viewport center. This prevents the map from
      // drifting left/right while zooming and feels calmer for long study sessions.
      zoomCenter(factor, false);
      clearTimeout(wheelTimer); wheelTimer = setTimeout(() => save('View saved'), 260);
    }else{
      view.x -= dx; view.y -= dy; applyView();
      clearTimeout(wheelTimer); wheelTimer = setTimeout(() => save('View saved'), 220);
    }
  }, {passive:false});

  function toggleFocus(){ focusMode = !focusMode; applyFocus(); updateSelectionUI(); showToast(focusMode ? 'Focus mode on' : 'Focus mode off'); }
  function openSidePanel(panel){
    activePanel = panel;
    panelDrawer.hidden = false;
    promptCard.hidden = panel !== 'remember';
    legendCard.hidden = panel !== 'legend';
    btnRememberPanel.classList.toggle('active', panel === 'remember');
    btnVisualPanel.classList.toggle('active', panel === 'legend');
  }
  function closeSidePanel(){
    activePanel = null;
    panelDrawer.hidden = true;
    promptCard.hidden = true;
    legendCard.hidden = true;
    btnRememberPanel.classList.remove('active');
    btnVisualPanel.classList.remove('active');
  }
  function toggleSidePanel(panel){ activePanel === panel ? closeSidePanel() : openSidePanel(panel); }
  function toggleLegend(){ toggleSidePanel('legend'); }
  function toggleRemember(){ toggleSidePanel('remember'); }

  document.addEventListener('pointerdown', e => {
    if(marqueeSelection) return;
    if(hasMapSelection() && !multiSelectMode && e.button === 0){
      const target = e.target instanceof Element ? e.target : null;
      if(!target) return;
      if(
        target.closest('#stage') &&
        !isCanvasGestureBlockedTarget(target) &&
        !isTextEditingActive()
      ){
        clearSelection('canvas-deselect', e);
      }
    }
  });
  document.addEventListener('click', e => { if(!e.target.closest('.menu')) closeMenu(); if(!e.target.closest('#shelfDelete')) clearEdgeDeleteArm(); });
  document.addEventListener('selectionchange', () => { if(gestureLockReasons.size > 0 || isBlockTargetingActive()) clearGestureSelection(); });
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape'){
      if(reviewMode.active && !isTextEditingActive()){
        e.preventDefault();
        exitReviewMode('escape');
        return;
      }
      if(marqueeSelection){
        e.preventDefault();
        cancelMarqueeSelection('escape', e);
        return;
      }
      if(pendingPlacement){
        e.preventDefault();
        cancelPlacementMode('escape');
        return;
      }
      closeMenu();
      clearEdgeDeleteArm();
      if(isBlockTargetingActive()){
        e.preventDefault();
        cancelBlockTargeting({announce:'Connection canceled.'});
        return;
      }
      if(multiSelectMode){
        e.preventDefault();
        setMultiSelectMode(false, {announce:true});
        return;
      }
      if(!isTextEditingActive()) clearSelection('escape', e);
      return;
    }
    if(!isMapShortcutContext()) return;
    const key = e.key.toLowerCase();
    const commandKey = e.ctrlKey || e.metaKey;
    if(commandKey && key === 'z'){
      e.preventDefault();
      if(e.shiftKey) redoMapCommand();
      else undoMapCommand();
      return;
    }
    if((e.ctrlKey && key === 'y') || (commandKey && e.shiftKey && key === 'z')){
      e.preventDefault();
      redoMapCommand();
      return;
    }
    if(commandKey && key === 'c'){
      e.preventDefault();
      copySelectionToClipboard();
      return;
    }
    if(commandKey && key === 'v'){
      e.preventDefault();
      pasteClipboard();
      return;
    }
    if(commandKey && key === 'd'){
      e.preventDefault();
      duplicateSelection();
      return;
    }
    if(commandKey && key === 'a'){
      e.preventDefault();
      setSelectionFromIds(data.nodes.map(node => node.id), data.edges.map(edge => edge.id), 'select-all', e);
      showToast(`Selected ${selectionSummary()}`);
      return;
    }
    if(!commandKey && !e.altKey && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key) && selectedMovableNodes().length){
      e.preventDefault();
      const step = e.shiftKey ? NUDGE_LARGE_STEP : NUDGE_STEP;
      const dx = e.key === 'ArrowLeft' ? -step : (e.key === 'ArrowRight' ? step : 0);
      const dy = e.key === 'ArrowUp' ? -step : (e.key === 'ArrowDown' ? step : 0);
      nudgeSelectedBlocks(dx, dy);
      return;
    }
    if(e.key === 'Home'){ e.preventDefault(); recenter(); }
    else if(e.key === '+' || e.key === '='){ e.preventDefault(); zoomCenter(1.25); }
    else if(e.key === '-' || e.key === '_'){ e.preventDefault(); zoomCenter(.80); }
    else if(e.key === '0'){ e.preventDefault(); resetView(); }
    else if(e.key === 'Delete' || e.key === 'Backspace'){ if(hasMapSelection()){ e.preventDefault(); deleteSelection(); } }
    else if(key === 'c' && selectedId && !commandKey){ e.preventDefault(); startConnect(selectedId); }
    else if(key === 'f' && !commandKey){ e.preventDefault(); toggleFocus(); }
  });
  window.addEventListener('resize', () => { applyView(); renderEdges(); applyFocus(); updateOverlayOffsets(); positionSelectionShelf(); updatePlacementGhost(null); });
  if(inputDebugState.enabled){
    document.addEventListener('pointerdown', e => rememberDebugPointer(e), true);
    document.addEventListener('pointermove', e => {
      if(e.pointerType === 'touch' || e.pointerType === 'pen') rememberDebugPointer(e);
    }, true);
    document.addEventListener('pointerup', e => rememberDebugPointer(e), true);
  }
  document.addEventListener('pointerup', e => clearPointerGestureOwner(e.pointerId), true);
  document.addEventListener('pointercancel', e => clearPointerGestureOwner(e.pointerId), true);

  btnUndo?.addEventListener('click', () => { cancelPlacementMode('tool'); undoMapCommand(); });
  btnRedo?.addEventListener('click', () => { cancelPlacementMode('tool'); redoMapCommand(); });
  btnMultiSelect?.addEventListener('click', () => { cancelPlacementMode('tool'); setMultiSelectMode(!multiSelectMode, {announce:true}); });
  document.getElementById('btnCenter').addEventListener('click', () => { cancelPlacementMode('tool'); recenter(); });
  document.getElementById('btnZoomIn').addEventListener('click', () => { cancelPlacementMode('tool'); zoomCenter(1.25); });
  document.getElementById('btnZoomOut').addEventListener('click', () => { cancelPlacementMode('tool'); zoomCenter(.80); });
  document.getElementById('btnZoomPercent').addEventListener('click', () => { cancelPlacementMode('tool'); promptZoomPercent(); });
  document.getElementById('btnResetView').addEventListener('click', () => { cancelPlacementMode('tool'); resetView(); });
  document.getElementById('btnAddLinked').addEventListener('click', () => { cancelPlacementMode('tool'); selectedId ? addLinkedFrom(selectedId) : addFreeAtCenter(); });
  document.getElementById('btnAddFree').addEventListener('click', () => { cancelPlacementMode('tool'); addFreeAtCenter(); });
  document.getElementById('btnAddDocumentBlock').addEventListener('click', () => { cancelPlacementMode('tool'); openDocumentPicker(); });
  reviewPanel?.addEventListener('pointerdown', event => event.stopPropagation(), true);
  reviewPanel?.addEventListener('pointerup', event => event.stopPropagation(), true);
  reviewPanel?.addEventListener('click', event => event.stopPropagation());
  reviewPanel?.addEventListener('wheel', event => event.stopPropagation(), {passive:true});
  btnReviewMap?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    openReviewLauncher();
  });
  reviewFilterOptions?.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest('button[data-review-filter]');
    if(!button || (reviewMode.session && !reviewMode.session.completed)) return;
    event.preventDefault();
    reviewMode.selectedFilter = normalizeReviewFilter(button.dataset.reviewFilter);
    if(!reviewMode.active) openReviewLauncher();
    else renderReviewPanel();
  });
  reviewStart?.addEventListener('click', () => startReviewSession('normal'));
  reviewStartNext?.addEventListener('click', () => startReviewSession('next'));
  reviewStartWeak?.addEventListener('click', () => startReviewSession('weak'));
  reviewReveal?.addEventListener('click', revealCurrentReviewCard);
  reviewRatings?.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest('button[data-rating]');
    if(!button) return;
    event.preventDefault();
    rateCurrentReviewCard(button.dataset.rating);
  });
  reviewRestart?.addEventListener('click', () => startReviewSession(reviewMode.mode || 'normal'));
  reviewExit?.addEventListener('click', () => exitReviewMode('exit'));
  reviewExitSummary?.addEventListener('click', () => exitReviewMode('summary-exit'));
  mapWorkbench?.addEventListener('pointerdown', event => event.stopPropagation(), true);
  mapWorkbench?.addEventListener('pointerup', event => event.stopPropagation(), true);
  mapWorkbench?.addEventListener('click', event => event.stopPropagation());
  btnWorkbenchToggle?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    setWorkbenchOpen(!workbenchOpen, {user:true, focus:!workbenchOpen});
  });
  btnWorkbenchClose?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    cancelPlacementMode('workbench-close');
    setWorkbenchOpen(false, {user:true});
    btnWorkbenchToggle?.focus();
  });
  workbenchAddConcept?.addEventListener('click', () => startWorkbenchBlockPlacement('concept', workbenchAddConcept));
  workbenchAddQuestion?.addEventListener('click', () => startWorkbenchBlockPlacement('question', workbenchAddQuestion));
  workbenchAddEvidence?.addEventListener('click', () => startWorkbenchBlockPlacement('evidence', workbenchAddEvidence));
  workbenchAddDocument?.addEventListener('click', () => void startWorkbenchDocumentPlacement(null, workbenchAddDocument));
  workbenchDocumentList?.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest('[data-workbench-document-id]');
    if(!button) return;
    event.preventDefault();
    event.stopPropagation();
    void startWorkbenchDocumentPlacement(button.dataset.workbenchDocumentId, button);
  });
  mapStarterPanel.addEventListener('pointerdown', event => event.stopPropagation(), true);
  mapStarterPanel.addEventListener('pointerup', event => event.stopPropagation(), true);
  mapStarterPanel.addEventListener('click', handleMapStarterClick);
  placementCancel?.addEventListener('click', () => cancelPlacementMode('cancel'));
  document.getElementById('btnConnect').addEventListener('click', () => { cancelPlacementMode('tool'); selectedId && startConnect(selectedId); });
  document.getElementById('btnFocus').addEventListener('click', () => { cancelPlacementMode('tool'); toggleFocus(); });
  document.getElementById('btnLegend').addEventListener('click', () => { cancelPlacementMode('tool'); toggleLegend(); });
  document.getElementById('btnTidy').addEventListener('click', () => { cancelPlacementMode('tool'); tidy(); });
  document.getElementById('btnExport').addEventListener('click', () => { cancelPlacementMode('tool'); exportWorkspace(); });
  importFileInput.addEventListener('change', e => importMap(e.target.files?.[0]));
  document.getElementById('btnResetMap').addEventListener('click', () => { cancelPlacementMode('tool'); resetMap(); });
  cancelConnectButton.addEventListener('click', () => cancelBlockTargeting({announce:'Connection canceled.'}));
  documentPickerClose.addEventListener('click', closeDocumentPicker);
  documentDetailClose.addEventListener('click', closeDocumentDetail);
  documentPickerList.addEventListener('click', e => {
    const button = e.target.closest('[data-document-id]');
    if(!button) return;
    e.preventDefault();
    e.stopPropagation();
    chooseDocumentFromPicker(button.dataset.documentId);
    closeDocumentPicker();
  });
  shelfToggle.addEventListener('click', () => { shelfCollapsed = !shelfCollapsed; updateSelectionUI(); });
  shelfAddLinked.addEventListener('click', () => selectedId && addLinkedFrom(selectedId));
  shelfEdit.addEventListener('click', () => selectedId && focusNodeEditor(selectedId));
  shelfCopy.addEventListener('click', copySelectionToClipboard);
  shelfPaste.addEventListener('click', pasteClipboard);
  shelfDuplicate.addEventListener('click', duplicateSelection);
  shelfConnect.addEventListener('click', () => selectedId && startConnect(selectedId));
  shelfStyle.addEventListener('click', () => {
    if(!selectedId) return;
    openMenuFromButton(shelfStyle, 'Block style', [
      {type:'section', label:'Block color'}, {type:'colors'},
      {type:'section', label:'Block shape'}, {type:'shapes'},
      {type:'section', label:'Block size'}, {type:'sizes'},
      {type:'section', label:'Importance'}, {type:'importance'}
    ], {type:'node', id:selectedId});
  });
  shelfCenter.addEventListener('click', zoomToSelection);
  shelfFocus.addEventListener('click', toggleFocus);
  shelfLabel.addEventListener('click', () => selectedEdgeId && setEdgeLabel(selectedEdgeId));
  shelfRelation.addEventListener('click', () => {
    if(!selectedEdgeId) return;
    openMenuFromButton(shelfRelation, 'Relationship type', [
      {type:'section', label:'Relationship type'}, {type:'relations'}
    ], {type:'edge', id:selectedEdgeId});
  });
  shelfStrength.addEventListener('click', () => {
    if(!selectedEdgeId) return;
    openMenuFromButton(shelfStrength, 'Importance / thickness', [
      {type:'section', label:'Importance / thickness'}, {type:'strengths'}
    ], {type:'edge', id:selectedEdgeId});
  });
  shelfRoute.addEventListener('click', () => {
    if(!selectedEdgeId) return;
    openMenuFromButton(shelfRoute, 'Line route', [
      {type:'section', label:'Line route'}, {type:'edgeShapes'}
    ], {type:'edge', id:selectedEdgeId});
  });
  shelfChangeSource.addEventListener('click', () => selectedEdgeId && startReconnect(selectedEdgeId, 'change-source'));
  shelfChangeTarget.addEventListener('click', () => selectedEdgeId && startReconnect(selectedEdgeId, 'change-target'));
  shelfInsertBetween.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    if(selectedEdgeId) showInsertBetweenMenu(selectedEdgeId, {button:shelfInsertBetween, source:inputDebugState.lastPointer});
  });
  shelfFromPort.addEventListener('click', () => {
    if(!selectedEdgeId) return;
    openMenuFromButton(shelfFromPort, 'Source connection side', [
      {type:'section', label:'From-side connection point'}, {type:'fromPorts'}
    ], {type:'edge', id:selectedEdgeId});
  });
  shelfToPort.addEventListener('click', () => {
    if(!selectedEdgeId) return;
    openMenuFromButton(shelfToPort, 'Target connection side', [
      {type:'section', label:'To-side connection point'}, {type:'toPorts'}
    ], {type:'edge', id:selectedEdgeId});
  });
  shelfReverse.addEventListener('click', () => selectedEdgeId && reverseEdge(selectedEdgeId));
  shelfClear.addEventListener('click', () => clearSelection('toolbar-clear'));
  shelfDelete.addEventListener('click', deleteSelection);
  btnRememberPanel.addEventListener('click', toggleRemember);
  btnVisualPanel.addEventListener('click', toggleLegend);
  btnClosePanel.addEventListener('click', closeSidePanel);
  inputDebugToggle.addEventListener('click', () => { inputDebugState.collapsed = !inputDebugState.collapsed; updateInputDebugUI(); });
  inputDebugClear.addEventListener('click', () => { inputDebugState.entries = []; updateInputDebugUI(); showToast('Cleared input diagnostics'); });
  inputDebugCopy.addEventListener('click', copyInputDebugEntries);
  pageSelect?.addEventListener('change', e => switchPage(e.target.value));
  btnNewPage?.addEventListener('click', createNewPage);
  btnPageMenu?.addEventListener('click', e => { e.stopPropagation(); pageMenu(e.clientX, e.clientY); });
  btnDuplicatePage?.addEventListener('click', duplicateCurrentPage);
  btnRenamePage?.addEventListener('click', renameCurrentPage);
  btnDeletePage?.addEventListener('click', deleteCurrentPage);
  stage.addEventListener('click', e => {
    if(e.target.closest('.map-node') || e.target.closest('.toolbar') || e.target.closest('.zoom-dock') || e.target.closest('.side-panel') || e.target.closest('.review-panel') || e.target.closest('.map-workbench') || e.target.closest('.selection-shelf') || e.target.closest('.connect-banner') || e.target.closest('.input-debug') || e.target.closest('.menu') || e.target.closest('.document-picker') || e.target.closest('.document-detail-card') || e.target.closest('.edge-label') || e.target.closest('g.edge-group')) return;
    if(isTextEditingActive()) return;
    if(multiSelectMode) return;
    clearSelection('canvas-tap', e);
  });

  installMarkers();
  renderPageControls();
  updateInputDebugUI();
  render();
  updateOverlayOffsets();
  requestAnimationFrame(() => {
    if(!data.view || (data.view.x === 0 && data.view.y === 0 && data.view.scale === 1)) resetView(); else applyView();
    recoverViewSoon('startup');
  });
  void initializeRuntimePage();
})();
