# Navigation and Layout Rules v3

This file controls page structure, navigation behavior, scrolling stability, and phone-width layout.
It includes the regression fixes from the v1–v6 HTML refinement cycle.

## Main layout target
The page should feel like a stable reading interface with a useful outline:
- left sidebar on desktop when space allows
- main reading column with controlled width
- mobile nav collapsed at phone widths
- no horizontal scroll in normal phone reading flow
- no scroll drift, layout jitter, or touch traps

## Desktop layout
Preferred desktop structure:
- compact sidebar column
- main content column
- enough breathing room between columns
- controlled max width
- no over-wide text measure
- no oversized empty gutters

The sidebar should help orientation, not dominate the page.

## Sidebar rules
Sidebar should be an outline, not a plain list.
Use:
- bordered container
- compact context block only when useful
- “On this page” label or equivalent
- nav items in rounded rows
- subtle active state
- sticky only on desktop with enough horizontal space

Avoid:
- huge sticky panels
- sticky panels on phone
- heavy blur effects
- nav labels that are more generic than the page headings

## Mobile navigation
When width is narrow, hide the desktop sidebar and show a collapsed mobile nav.
Mobile nav should be:
- above the hero or first section
- easy to open
- not sticky by default
- not visually heavy
- not duplicated as a second full sidebar

## Heading/nav consistency
Navigation labels may be shorter than headings, but should remain subject-specific.
Avoid generic nav entries like:
- The machine
- Players
- Applications
- Deep explanation

Prefer:
- Debt-control loop
- Power players
- War, bailouts, algorithms
- Capital machine

## Reading width
Keep normal prose readable.
Suggested maximum line length:
- body text: 65–78 characters
- dense explanatory panels: slightly narrower when practical
- source shelves and glossary cards: may be wider but still chunked

## Section rhythm
Use consistent rhythm:
- hero
- core thesis/quick answer
- visual pretraining if abstract
- concept primer if needed
- anchor example
- main sections
- retrieval/review supports
- source shelf

Do not fragment the page into too many tiny same-level sections.
Do not bury the first useful explanation under a large hero.

## Cards and grids
Desktop grids may use 2 or 3 columns.
Phone grids should stack to 1 column.
No card should rely on text squeezed into tiny boxes.

For visual grids:
- 2 columns desktop / 1 column mobile is safest
- labels must remain in boxes
- captions should explain the picture’s memory job

## Tables and comparison blocks
Prefer stacked cards on phone when they improve comprehension.
If using tables:
- add `data-label` to every body cell
- hide table header on phone
- convert rows to cards
- reset scroll wrapper on phone

Phone wrapper reset:
```css
.table-wrap{
  overflow: visible;
  overflow-x: visible;
  overflow-y: visible;
  -webkit-overflow-scrolling: auto;
  overscroll-behavior-x: auto;
  overscroll-behavior-y: auto;
  touch-action: auto;
  scrollbar-gutter: auto;
}
```

## Horizontal scroll policy
Horizontal scroll is only a last-resort fallback for genuinely wide content.
It must never be the default for a main reading-flow component on phone.
Do not use `touch-action: pan-x` in normal phone reading flow.

If horizontal scroll is unavoidable, add:
- `-webkit-overflow-scrolling: touch`
- `overscroll-behavior-x: contain`
- `scrollbar-gutter: stable both-edges`
- clear visual cue that the region scrolls

## Inline glossary layout safety
Glossary term spans must never inherit card, pill, or flowline layout styles.
Defensive rules:
```css
.term{display:inline !important; width:auto !important; max-width:none !important; white-space:nowrap;}
p .term, li .term, strong .term, h2 .term, h3 .term, .card .term, .stack-row .term{display:inline !important;}
```

Do not use selectors such as `.card span:last-child` or `.loop-card span:last-child` unless they are constrained to direct children. They can accidentally convert glossary terms into blocks.
Prefer direct-child selectors:
```css
.loop-card > div > span{display:block;}
.flowline > span:not(.arr){...}
```

## Number badge centering
Number badges must be centered in real rendering, not just visually guessed.
Use grid or inline-flex centering and `line-height:1`.

## Visual diagram layout safety
For diagrams:
- keep graph lines inside chart frames
- do not rotate oversized divs for chart lines unless the frame clips them safely
- prefer SVG paths inside a bounded viewBox for charts
- place text outside paths or inside boxes
- never let arrows overlap labels

## Phone review checklist
When output has sidebar, tables, diagrams, glossary hovers, or RTL content, review phone width around 360–430px.
Check:
- no horizontal overflow
- mobile nav appears and sidebar disappears
- cards stack cleanly
- table/card labels are not dead strips
- glossary hovers do not create long pills or overflow
- visual diagrams stay inside frames
- number badges remain centered
