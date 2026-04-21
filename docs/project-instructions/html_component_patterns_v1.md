# HTML Component Patterns v1

Use these patterns to prevent regressions in generated HTML pages.
They are implementation guidance, not reader-facing prose.

## 1. Inline glossary hover pattern

### HTML term shape
```html
<span class="term" tabindex="0" data-term="asset manager" data-def="A firm that manages money for clients such as pensions, ETFs, and institutions." aria-label="asset manager: A firm that manages money for clients such as pensions, ETFs, and institutions." title="asset manager: A firm that manages money for clients such as pensions, ETFs, and institutions.">asset manager</span>
```

### Defensive CSS
```css
.term{
  display:inline !important;
  width:auto !important;
  min-width:0 !important;
  max-width:none !important;
  height:auto !important;
  min-height:0 !important;
  margin:0 !important;
  padding:0 .045em !important;
  border-top:0 !important;
  border-left:0 !important;
  border-right:0 !important;
  border-bottom:2px dotted #9b8058 !important;
  border-radius:.12em !important;
  background:linear-gradient(180deg, transparent 55%, rgba(245,232,200,.56) 55%) !important;
  box-shadow:none !important;
  color:inherit !important;
  font:inherit !important;
  line-height:inherit !important;
  text-align:inherit !important;
  vertical-align:baseline !important;
  white-space:nowrap;
  overflow-wrap:normal;
  word-break:normal;
  hyphens:none;
  cursor:help;
  box-decoration-break:clone;
  -webkit-box-decoration-break:clone;
}
.term:focus{outline:3px solid rgba(79,121,138,.45); outline-offset:2px;}
body.gloss-off .term{border-bottom:0 !important; background:transparent !important; cursor:inherit; padding:0 !important;}
p .term, li .term, h2 .term, h3 .term, h4 .term, strong .term, .card .term, .loop-card .term, .stack-row .term{display:inline !important; width:auto !important; max-width:none !important;}
```

### Tooltip CSS
```css
.gloss-tooltip{
  position:fixed;
  z-index:999;
  max-width:min(360px, calc(100vw - 32px));
  background:#2f2923;
  color:#fff8ee;
  border-radius:14px;
  padding:.75rem .85rem;
  box-shadow:0 16px 30px rgba(0,0,0,.25);
  opacity:0;
  pointer-events:none;
  transform:translateY(4px);
  transition:opacity .12s ease, transform .12s ease;
}
.gloss-tooltip.show{opacity:1; transform:translateY(0);}
.gloss-tooltip strong{display:block; margin-bottom:.15rem; color:#f7dfb7;}
```

### JS checklist
- Sort terms by longest alias first.
- Match whole phrases before single words.
- Skip nav, aside, button, summary, source shelf, code, pre, script, style, SVG, and glossary definition section.
- Do not skip `strong`, cards, or lower-level headings by default.
- Add `aria-label` and `title` fallback.
- Reposition tooltip inside viewport.
- Close on Escape or outside click.

## 2. Safe four-picture visual pretraining grid
Use for abstract topics.

Rules:
- 2 columns desktop, 1 column mobile.
- Each picture has a specific title.
- Every arrow is separate from text.
- Captions explain the memory job.

CSS skeleton:
```css
.visual-grid{display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:14px;}
.visual-card{border:1px solid var(--border); border-radius:18px; background:#fff9f1; padding:1rem;}
.visual-title{font-weight:900; margin-bottom:.65rem;}
@media(max-width:820px){.visual-grid{grid-template-columns:1fr;}}
```

## 3. Safe K-shape chart
Avoid rotated div lines that escape frames.
Use clipped SVG or bounded CSS.

```html
<div class="k-svg-wrap" aria-hidden="true">
  <svg class="k-svg" viewBox="0 0 420 150" preserveAspectRatio="none">
    <line class="k-axis" x1="34" y1="128" x2="395" y2="128"></line>
    <line class="k-axis" x1="34" y1="18" x2="34" y2="128"></line>
    <path class="k-up" d="M78 88 C150 68 230 42 350 20"></path>
    <path class="k-down" d="M78 96 C160 105 245 118 350 130"></path>
  </svg>
</div>
```

```css
.k-svg-wrap{border:1px solid rgba(196,170,132,.55); border-radius:15px; background:rgba(255,255,255,.42); overflow:hidden; padding:.4rem;}
.k-svg{width:100%; height:150px; display:block;}
.k-axis{stroke:#c4aa84; stroke-width:2;}
.k-up{stroke:#668957; stroke-width:6; stroke-linecap:round; fill:none;}
.k-down{stroke:#b36f64; stroke-width:6; stroke-linecap:round; fill:none;}
```

## 4. Centered number badge pattern
```css
.num,.step-num,.action-step::before{
  display:grid !important;
  place-items:center !important;
  width:2rem;
  height:2rem;
  border-radius:50%;
  line-height:1 !important;
  padding:0 0 .03em 0;
  font-variant-numeric:tabular-nums;
}
```

## 5. Stacked mobile comparison pattern
Desktop table may become mobile cards.

```css
.table-wrap{overflow-x:auto; -webkit-overflow-scrolling:touch; overscroll-behavior-x:contain; scrollbar-gutter:stable both-edges;}
@media(max-width:820px){
  .table-wrap{overflow:visible; overflow-x:visible; overflow-y:visible; -webkit-overflow-scrolling:auto; overscroll-behavior-x:auto; overscroll-behavior-y:auto; touch-action:auto; scrollbar-gutter:auto;}
  table.responsive-table, table.responsive-table thead, table.responsive-table tbody, table.responsive-table tr, table.responsive-table td{display:block;}
  table.responsive-table thead{display:none;}
  table.responsive-table tr{border:1px solid var(--border); border-radius:14px; margin-bottom:12px; background:#fff9f1;}
  table.responsive-table td{display:grid; grid-template-columns:minmax(8rem,32%) 1fr; gap:.75rem;}
  table.responsive-table td::before{content:attr(data-label); font-weight:900; color:var(--muted);}
}
```

## 6. Regression scan before final answer
Search saved HTML for:
- `Study page`
- `Single-source study page`
- `The whole argument in one breath`
- `The clean version`
- `This page turns`
- `Primary source:`
- `.term` missing `display:inline`
- diagrams using text over path/line
- mobile wrappers retaining `touch-action: pan-x`
