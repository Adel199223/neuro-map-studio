# HTML Style System v11

This file defines the visual identity for default HTML output.
It includes the v6 regression fixes for font, headings, glossary hovers, diagrams, and mobile layout.

## Overall feel
The page should feel like a designed learning interface, not a generic export or decorative poster.

Target feel:
- calm
- elegant
- structured
- tactile but not noisy
- ADHD-friendly
- dyslexia-friendly
- serious but readable
- visually clear on phone and desktop

## Required Latin reading font
Use Comic Sans as the default Latin reading stack unless the user explicitly asks otherwise:

```css
font-family: "Comic Sans MS", "Comic Sans", cursive, "OpenDyslexic", "Atkinson Hyperlegible", Verdana, Arial, sans-serif;
```

Rules:
- Do not embed or share font files.
- Do not use tight negative letter-spacing with Comic Sans.
- Prefer `letter-spacing: 0` for body and headings.
- Do not force this Latin stack onto Arabic or other RTL script; use the Arabic typography file.
- If Comic Sans is unavailable, the fallback stack still works.

## Background and surface system
Default palette:
- page background: warm sepia / low-glare cream
- main content surfaces: slightly lighter cream
- borders: subtle warm brown / muted neutral
- text: dark warm charcoal, not pure black

Semantic colors:
- neutral panels for standard content
- soft green for conclusions, exit paths, or strongest takeaways
- soft amber for cautions, uncertainty, risk, or evidence limits
- soft blue for framing, context, controls, or learning cues
- warm quote treatment for excerpts or core memory statements
- quiet recap treatment for “remember this” blocks

Same function = same visual treatment.
Do not randomly vary colors.
Do not make the page monochrome and flat.
Do not make the page visually noisy.

## Hero block rules
The hero must be compact.
It should orient quickly and then let the reader start learning.

Preferred hero structure:
1. optional small subject-facing eyebrow
2. concise subject title
3. one short summary paragraph
4. quiet linked source/byline when sources exist
5. optional topic-facing chips

Avoid:
- oversized banner sections
- long stacked titles
- multiple large paragraphs before the first real section
- “Study page” / “Single-source study page” badges
- visible process narration
- source-count chips
- “Primary source:” when a linked work title or byline reads naturally

## Specific heading rule
Headings must name the actual idea.
Do not use generic scaffolding headings as reader-facing titles.

Avoid:
- The whole argument in one breath
- The clean version
- The machine
- The players
- Applications
- Deep explanation
- Worked anchor
- Main organizing frame
- Bucket 1 / Bucket 2 / Bucket 3

Prefer:
- Core thesis: debt money concentrates power
- Four mental pictures for the power system
- How debt becomes political control
- Why a £100 bank loan creates new money
- Who holds leverage in the system
- Wars, bailouts, algorithms, and slow collapse
- Why Bitcoin and gold are exit tools
- ADHD and dyslexia study plan

## Cards and panels
Cards should:
- have rounded corners
- have gentle borders
- have enough padding to breathe
- group related ideas clearly
- avoid cramped text
- avoid random decorative color changes

A card should teach one idea, not become a mini essay.

## Inline glossary system
Use inline glossary hovers for technical material.
This is required for economics, finance, politics, law, technical systems, medicine, acronyms, jargon, and any subject with unfamiliar terms.

### What terms should look like
Glossary terms should look like normal inline text with:
- light highlight
- dotted underline
- hover/focus/tap definition

They must not become:
- pills
- boxes
- buttons
- cards
- full-line blocks
- layout-breaking spans

Use this defensive CSS pattern:

```css
.term{
  display:inline !important;
  width:auto !important;
  min-width:0 !important;
  max-width:none !important;
  height:auto !important;
  margin:0 !important;
  padding:0 .045em !important;
  border-top:0 !important;
  border-left:0 !important;
  border-right:0 !important;
  border-bottom:2px dotted #9b8058 !important;
  border-radius:.12em !important;
  background:linear-gradient(180deg, transparent 55%, rgba(245,232,200,.56) 55%) !important;
  color:inherit !important;
  font:inherit !important;
  line-height:inherit !important;
  vertical-align:baseline !important;
  white-space:nowrap;
  overflow-wrap:normal;
  word-break:normal;
  hyphens:none;
  cursor:help;
  box-decoration-break:clone;
  -webkit-box-decoration-break:clone;
}
```

### Tooltip requirements
Each term should have:
- `data-term`
- `data-def`
- `tabindex="0"`
- `aria-label`
- native `title` fallback when practical
- custom tooltip for hover/focus/tap

Tooltip behavior:
- hover on desktop
- keyboard focus
- tap on phone
- Esc or outside click closes
- tooltip stays inside viewport
- no tooltip over source shelf, nav, or code

### Term coverage rules
Do not mark only the first occurrence.
When a technical term appears in multiple useful places, it should generally be hoverable in each place unless that would create visual clutter.

Apply to:
- paragraphs
- list items
- bold labels
- cards
- lower-level headings when useful

Skip:
- nav
- aside
- buttons
- summaries
- code/pre
- script/style
- SVG text
- source shelf
- glossary definition section itself

Use aliases and phrase variants.
Sort terms by length before matching so multiword expressions win before single words.

## Visual diagrams
For abstract concepts, include visual pretraining.
But diagrams must be robust.

Rules:
- Labels must sit inside their boxes.
- Arrows must not cross text.
- Graph lines must stay inside frames.
- Text must not sit on top of lines.
- Number badges must be visibly centered.
- Diagrams must work at phone width.
- If SVG text is fragile, prefer HTML/CSS diagrams with cards and arrows.

### Safe visual patterns
Good patterns:
- card-based flow diagrams
- ladder diagrams
- two-line K-shape charts using clipped SVG with labels below
- stacked “who does what” cards
- visual grids with 2 columns desktop / 1 column mobile

Avoid:
- free-floating text on paths
- arrows behind labels
- text outside viewBox
- long labels inside tiny circles
- graph lines that extend beyond the plot area

## Number circles and badges
Use grid or inline-flex centering.

```css
.step-num,
.loop-card .num,
.action-step::before{
  display:grid !important;
  place-items:center !important;
  line-height:1 !important;
  font-variant-numeric:tabular-nums;
  padding:0 0 .03em 0;
}
```

## Tables and comparison structures
Use tables only if they reduce cognitive load.
For phone widths, prefer stacked cards when comprehension improves.

Phone fallback must reset wrappers:
```css
overflow: visible;
overflow-x: visible;
overflow-y: visible;
-webkit-overflow-scrolling: auto;
overscroll-behavior-x: auto;
overscroll-behavior-y: auto;
touch-action: auto;
scrollbar-gutter: auto;
```

Do not use `touch-action: pan-x` in the main phone reading flow.

## Source and reference styling
Use quiet links.
Prefer clickable source names over raw URLs.
Reference shelf should be collapsed by default when inline links are good.
Do not make the shelf the only source access point.

## Final artifact visual audit
Before finalizing any HTML file, check:
- Comic Sans stack is present in saved HTML.
- No generic headings remain.
- Glossary terms stay inline and hover/tap correctly.
- Terms inside bold/card text are not skipped unnecessarily.
- Diagrams have no line/text overlap.
- Number badges are centered.
- Phone width has no horizontal overflow.
- The saved file has no build-note footer or process narration.
