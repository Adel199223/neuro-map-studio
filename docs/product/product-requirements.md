# Product requirements

## Product vision

Neuro Map Studio creates learning pages and editable learning maps that help ADHD and dyslexic learners understand complex topics by combining:

- simple language;
- visual structure;
- hover/tap glossary support;
- read-aloud sentence tracking;
- editable blocks;
- relationship lines that encode meaning;
- spaced retrieval and self-explanation prompts.

## Current validated features

### Lesson page

- Comic Sans font stack.
- Main lesson layout with left navigation.
- Glossary terms with hover/tap definitions.
- Reader controls for focus mode, bigger text, more spacing, and glossary hints.
- Compact vertical read-aloud toolbar.
- Sentence-level start, highlighting, continuous reading, and collapsed options.

### Advanced learning map

- Multi-page workspace.
- Infinite-style pan/zoom canvas.
- Movable, editable, resizable blocks.
- Block colors, shapes, sizes, and importance levels.
- Outside connection ports.
- Relationship lines without arrowheads.
- Link types: causes, funds, controls, benefits, costs, loop, exit, evidence, contrast.
- Link label, color, thickness, shape/route, and side ports.
- Right-click menus on canvas, blocks, and links.
- Add free blocks and linked blocks.
- Import/export workspace JSON.
- Browser autosave.
- Recenter/reset/tidy controls.
- Collapsed legend/help panels.

## Learning goals

The app should not merely store notes. It should encourage active learning:

- users should restructure the map to consolidate memory;
- users should verbalize why a block belongs where it is;
- relationship labels should make causal reasoning explicit;
- visual encoding should reduce working-memory load;
- read-aloud should support focus and dyslexia accessibility.

## Non-goals for early versions

- No backend until the local-first app is stable.
- No account system yet.
- No collaborative editing yet.
- No AI generation inside the app yet, unless explicitly requested later.

## Future roadmap

1. Modularize the current prototype.
2. Add robust undo/redo.
3. Add keyboard shortcuts and command palette.
4. Add map templates: causal loop, argument map, timeline, comparison map, concept map.
5. Add export to HTML, JSON, PNG/SVG, and printable PDF.
6. Add optional AI-assisted map creation from articles, transcripts, or videos.
7. Add a reusable project system for generating lesson page + map from any source.
