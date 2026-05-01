export function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

export function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
}

export function isTouchLikePointer(event) {
  return event.pointerType === 'touch' || event.pointerType === 'pen';
}

export function isTouchGesturePointer(event) {
  return event.pointerType === 'touch';
}

export function isEditingElement(element) {
  return !!element?.closest?.('[contenteditable],input,textarea,select');
}

export function isCanvasGestureBlockedTarget(target) {
  return !!target?.closest?.(
    '.map-node,.toolbar,.zoom-dock,.side-panel,.review-panel,.map-workbench,.selection-shelf,.connect-banner,.input-debug,.menu,.document-picker,.document-detail-card,.placement-overlay,.placement-ghost,.edge-label,g.edge-group',
  );
}
