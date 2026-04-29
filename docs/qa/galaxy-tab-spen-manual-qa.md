# Galaxy Tab / S Pen Manual QA

Use this guide when testing the live Neuro Map Studio map editor on a real Galaxy Tab with finger input and S Pen input.

## URLs

- App root: `https://adel199223.github.io/neuro-map-studio/`
- Project hub: `https://adel199223.github.io/neuro-map-studio/prototypes/current/project.html?projectId=geopolitics-economics`
- Map editor: `https://adel199223.github.io/neuro-map-studio/prototypes/current/mindmap.html`
- Diagnostics map: `https://adel199223.github.io/neuro-map-studio/prototypes/current/mindmap.html?debugInput=1`

Optional persistent diagnostics flag from the browser console:

```js
localStorage.setItem("neuro-map-studio:debug-input", "1")
localStorage.removeItem("neuro-map-studio:debug-input")
```

## Terms

- Sources & blocks panel: the panel used to add Concept, Question, Evidence, and Document blocks.
- Selection toolbar: the floating toolbar for selected blocks or links.
- Notification bubble: a brief status message such as "View reset" or "Document block added".
- Zoom controls: the lower-right zoom buttons and reset-view button.

## Before Testing

1. Open the app root and hard refresh if the old UI appears.
2. Open the Geopolitics & Economics project.
3. Export a workspace backup before destructive testing.
4. Test in Chrome and Samsung Internet if practical.
5. If something feels wrong, repeat with the diagnostics URL and keep a screenshot or short screen recording.

## Placement Mode

- [ ] Open a map page.
- [ ] Open the Sources & blocks panel.
- [ ] Tap Concept with S Pen, then tap the canvas to place it.
- [ ] Tap Question, then tap the canvas to place it.
- [ ] Tap Evidence, then tap the canvas to place it.
- [ ] Tap Add as document block from a project source, then tap the canvas to place it.
- [ ] Press Cancel or Escape-equivalent browser action if available, and confirm placement mode exits.
- [ ] Confirm placed blocks do not appear under the Sources & blocks panel, selection toolbar, notification bubble, or zoom controls.

## Document Blocks

- [ ] Document block shows source title and type.
- [ ] Document block preserves after reload.
- [ ] Drag document block with S Pen.
- [ ] Drag document block with finger.
- [ ] Link document block to another block.
- [ ] Move the linked block and confirm the relationship line follows.

## Connection Ports

- [ ] Tap a block connection port with S Pen and confirm the menu includes Connect existing block.
- [ ] Tap Connect existing block, then tap a different existing block.
- [ ] Confirm one relationship line is created and selected.
- [ ] Use undo and redo to remove and restore that relationship line.
- [ ] Try connecting a block to itself and confirm no line is created.
- [ ] Try connecting the same source and target twice and confirm the existing line is selected instead of creating a duplicate.
- [ ] Tap Cancel or blank canvas during targeting and confirm normal editing resumes.
- [ ] Confirm linked Concept / Question / Evidence / Document quick-add still works from the same port menu.

## Relationship Reconnect

- [ ] Tap a relationship line or label and confirm the selection toolbar shows Change source and Change target.
- [ ] Tap Change target, then tap a different block with S Pen.
- [ ] Confirm the relationship line stays selected, keeps its label/type/style, and moves to the new target.
- [ ] Use undo and redo to restore and reapply the changed endpoint.
- [ ] Tap Change source, then tap a different block with finger.
- [ ] Try choosing the same block or the opposite endpoint and confirm no self-link is created.
- [ ] Try reconnecting into an already-existing same-direction relationship and confirm the existing line is selected instead of creating a duplicate.
- [ ] Tap Cancel or blank canvas during reconnect targeting and confirm normal editing resumes.

## Canvas And Zoom

- [ ] Finger pan moves the canvas.
- [ ] Pinch zoom works without obvious drift.
- [ ] Zoom controls remain reachable when Sources & blocks is open.
- [ ] Reset view uses the `1x` button and shows a brief notification bubble.
- [ ] Main map content remains visible after reset.

## Selection Toolbar

- [ ] Tap a block and confirm the selection toolbar appears.
- [ ] Use common block actions from the selection toolbar.
- [ ] Tap a relationship line and confirm link actions are reachable.
- [ ] Confirm the selection toolbar does not cover the selected block title/body in a confusing way.

## Long-Press Menus

- [ ] Long-press a block with S Pen.
- [ ] Long-press a block with finger.
- [ ] Long-press empty canvas.
- [ ] Long-press a relationship line or label.
- [ ] Confirm duplicate native context menus do not appear after app menus.

## Diagnostics

Use `?debugInput=1` only when investigating a bug.

- [ ] Diagnostics panel opens.
- [ ] Clear the log before reproducing.
- [ ] Reproduce the issue.
- [ ] Copy diagnostics and include browser/device details.

Report template:

```text
Device:
Browser:
URL:
Input used: finger / S Pen / mouse
Diagnostics enabled: yes / no

Steps:
Expected:
Actual:
Repeatable:
Screenshot or video:
Anything else that felt awkward:
```
