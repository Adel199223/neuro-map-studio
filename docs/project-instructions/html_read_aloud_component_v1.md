# HTML Read-Aloud Component v1

Use this file for the default native browser read-aloud layer in generated HTML learning pages.
It is implementation guidance, not reader-facing prose.

## Default requirement
Every normal self-contained HTML learning file should include this read-aloud layer unless the user explicitly asks for:
- no JavaScript
- no audio/read-aloud
- print-only output

The component must be self-contained. Do not use Speechify, external scripts, external APIs, or remote assets.
Use the browser `speechSynthesis` / `SpeechSynthesisUtterance` API.

## Reader-facing behavior
The read-aloud UI should feel like a light reading aid, not another app to learn.

Required visible behavior:
- compact **vertical side toolbar** on desktop
- mobile-safe placement that does not cover the main text too much
- visible controls use icons only, with accessible labels:
  - `↑` previous sentence
  - `▶` / `⏸` play or pause
  - `↓` next sentence
  - `⏹` stop
  - `⚙` options
  - `−` / `+` minimize or expand
- no visible sentence counter or “currently reading sentence…” text
- any status text must be `sr-only` / screen-reader only
- Options must be collapsed by default
- hover-only sentence play bubble on desktop
- tap sentence to start there on mobile
- continuous reading from the chosen sentence
- current sentence highlighted while speaking
- optional focus lens available in Options
- auto-scroll on by default, respecting `prefers-reduced-motion`

## Voice rule
Do not show a long browser voice list.
The visible voice select must only contain:
- Ava Natural Multilingual — default
- Andrew Natural Multilingual

Implementation detail:
- The select values may be `ava` and `andrew`.
- Match actual installed voices by regex/name at runtime.
- Prefer voices whose names contain the target name plus `multilingual` and `natural` or `online`.
- If the exact voice is missing, silently fall back to a matching Ava/Andrew voice, then any browser default.
- Keep the visible choice list to two choices.

## Regions to read and skip
Read from the main content, not from chrome/control areas.

Read from:
- `main`
- headings inside `main`
- paragraphs
- list items
- table cells when they are part of the learning content
- quote/callout/card text when it teaches the material

Skip:
- `nav`
- `aside`
- read-aloud toolbar and play bubble
- reader controls
- glossary tooltip popups
- source/reference shelf when marked optional
- buttons, links if reading them would be distracting
- code/pre blocks
- SVG text
- diagrams where text is not meant to be read as prose
- collapsed `details` content unless the user opens it

Do **not** skip `.term` glossary spans if they already exist. Glossary term text should still be read as part of the sentence.

## Required HTML shape
Place this near the end of `<body>`, outside `<main>`.

```html
<div class="speech-panel no-read" id="speechPanel" role="region" aria-label="Read aloud controls">
  <strong class="speech-title sr-only">Read aloud</strong>
  <span class="speech-status sr-only" id="ttsStatus" aria-live="polite">Ready.</span>

  <button class="speech-btn" id="ttsPrev" type="button" aria-label="Previous sentence" title="Previous sentence">↑</button>
  <button class="speech-btn primary" id="ttsPlay" type="button" aria-label="Play reading" title="Play / pause">▶</button>
  <button class="speech-btn" id="ttsNext" type="button" aria-label="Next sentence" title="Next sentence">↓</button>
  <button class="speech-btn" id="ttsStop" type="button" aria-label="Stop reading" title="Stop">⏹</button>

  <details class="speech-more" id="ttsMore">
    <summary aria-label="Read-aloud options" title="Options">⚙</summary>
    <div class="speech-extra">
      <div class="speech-row">
        <label for="ttsRate">Speed <output id="ttsRateLabel">1.00×</output></label>
        <input id="ttsRate" type="range" min="0.75" max="1.60" step="0.05" value="1.00">
      </div>

      <label class="speech-select" for="ttsVoice">Voice
        <select id="ttsVoice">
          <option value="ava" selected>Ava Natural Multilingual</option>
          <option value="andrew">Andrew Natural Multilingual</option>
        </select>
      </label>

      <div class="speech-toggles">
        <button class="speech-toggle" id="ttsAutoScroll" type="button" aria-pressed="true">Auto-scroll</button>
        <button class="speech-toggle" id="ttsLens" type="button" aria-pressed="false">Focus lens</button>
        <button class="speech-toggle replay" id="ttsReplay" type="button" aria-label="Replay current sentence">↻ Replay</button>
      </div>

      <p class="speech-help">Tip: hover any sentence to start there. Use ↑ and ↓ to move one sentence at a time.</p>
    </div>
  </details>

  <button class="speech-collapse" id="ttsCollapse" type="button" aria-label="Minimize read-aloud controls" aria-expanded="true" title="Minimize">−</button>
  <div class="speech-meter" aria-hidden="true"><span id="ttsBar"></span></div>
</div>

<button class="read-bubble no-read" id="readBubble" type="button" aria-label="Read from this sentence">▶</button>
```

## Required CSS behavior
Use the page variables when available. Keep this compact and low-noise.

```css
.sr-only{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important;}
.read-sentence{border-radius:.25em; box-decoration-break:clone; -webkit-box-decoration-break:clone;}
.read-sentence:hover:not(.is-reading){background:rgba(245,232,200,.42);}
body.reader-active .read-sentence.is-reading{background:linear-gradient(180deg, transparent 48%, rgba(255,220,120,.78) 48%); outline:2px solid rgba(180,133,54,.34); outline-offset:.08em;}
body.reader-paused .read-sentence.is-reading{background:rgba(160,196,216,.35);}
body.reader-lens.reader-active main .read-sentence:not(.is-reading){opacity:.50;}
body.reader-lens.reader-active main .read-sentence.is-reading{opacity:1;}

.read-bubble{position:fixed; z-index:1002; width:2.25rem; height:2.25rem; border-radius:999px; border:1px solid var(--border,#d8c6aa); background:var(--green,#e8f3e3); color:var(--ink,#27231f); display:grid; place-items:center; box-shadow:0 12px 26px rgba(0,0,0,.18); opacity:0; pointer-events:none; transform:translateY(4px); transition:opacity .12s ease, transform .12s ease; font:inherit; font-weight:900;}
.read-bubble.show{opacity:1; pointer-events:auto; transform:translateY(0);}

.speech-panel{position:fixed; z-index:1001; right:1rem; top:50%; transform:translateY(-50%); width:3.4rem; padding:.42rem; border:1px solid var(--border,#d8c6aa); border-radius:999px; background:rgba(255,249,241,.96); box-shadow:0 16px 34px rgba(0,0,0,.18); display:flex; flex-direction:column; align-items:center; gap:.34rem; backdrop-filter:blur(8px);}
.speech-btn,.speech-more summary,.speech-collapse{width:2.32rem; height:2.32rem; min-height:2.32rem; border-radius:999px; border:1px solid var(--border,#d8c6aa); background:#fff8ed; color:var(--ink,#27231f); display:grid; place-items:center; cursor:pointer; font:inherit; font-weight:900; line-height:1; padding:0;}
.speech-btn.primary{width:2.56rem; height:2.56rem; min-height:2.56rem; background:var(--green,#e8f3e3); border-color:var(--green-border,#a9c99e); font-size:1.08rem;}
.speech-btn:hover,.speech-more summary:hover,.speech-collapse:hover{background:#fffdf8; border-color:var(--strong-border,#b78c57);}
.speech-btn:focus-visible,.speech-more summary:focus-visible,.speech-collapse:focus-visible,.speech-toggle:focus-visible{outline:3px solid rgba(79,121,138,.45); outline-offset:2px;}
.speech-more{margin:0; position:relative;}
.speech-more summary{list-style:none;}
.speech-more summary::-webkit-details-marker{display:none;}
.speech-extra{position:absolute; right:3.25rem; top:50%; transform:translateY(-50%); width:min(310px, calc(100vw - 92px)); border:1px solid var(--border,#d8c6aa); border-radius:16px; background:#fff9f1; box-shadow:0 18px 36px rgba(0,0,0,.18); padding:.75rem;}
.speech-row,.speech-select{display:grid; grid-template-columns:auto 1fr; gap:.55rem; align-items:center; margin:.45rem 0; font-size:.88rem; color:var(--muted,#6c6256); font-weight:900;}
.speech-row input[type="range"]{width:100%; accent-color:#8b6d42;}
.speech-select select{min-width:0; border:1px solid var(--border,#d8c6aa); border-radius:11px; background:#fff8ed; color:var(--ink,#27231f); padding:.42rem .48rem; font:inherit; font-size:.9rem;}
.speech-toggles{display:grid; grid-template-columns:1fr 1fr; gap:.45rem; margin:.55rem 0 .15rem;}
.speech-toggle{border:1px solid var(--border,#d8c6aa); border-radius:11px; background:#fff8ed; color:var(--ink,#27231f); min-height:2.12rem; padding:.38rem .55rem; font:inherit; font-weight:900; cursor:pointer;}
.speech-toggle.replay{grid-column:1/-1;}
.speech-toggle[aria-pressed="true"]{background:var(--blue,#e5f0f5); border-color:var(--blue-border,#b8d1de);}
.speech-help{margin:.42rem .04rem 0; color:var(--quiet,#7d7164); font-size:.78rem; line-height:1.35;}
.speech-meter{width:.42rem; flex:1 1 auto; min-height:1.6rem; border-radius:999px; background:rgba(216,198,170,.45); overflow:hidden; display:flex; align-items:flex-end;}
.speech-meter span{display:block; width:100%; height:var(--tts-progress,0%); background:linear-gradient(180deg,#cfa969,#8b6d42); border-radius:999px;}
.speech-panel.minimized .speech-btn,.speech-panel.minimized .speech-more,.speech-panel.minimized .speech-meter{display:none!important;}
.speech-panel.minimized{width:auto; padding:.35rem;}
.speech-panel.speech-error{display:none;}

@media(max-width:820px){
  .speech-panel{right:.55rem; top:auto; bottom:1rem; transform:none;}
  .speech-extra{right:3.2rem; top:auto; bottom:0; transform:none; width:min(286px, calc(100vw - 76px));}
  .read-bubble{display:none;}
}
@media print{.speech-panel,.read-bubble{display:none!important;}}
```

## JavaScript implementation sequence
Use this order to avoid component conflicts and keep glossary terms inside readable sentence spans:

1. Install read-aloud sentence spans first.
2. Install the glossary after sentence spans if glossary terms are generated by JavaScript.
3. Build readable sentence units.
4. Install speech controls.

Required functions/behavior:
- `installReaderSentences()`
  - walk text nodes inside `main`
  - wrap sentence fragments in `.read-sentence` spans with `data-read-id`
  - use `Intl.Segmenter(..., {granularity:"sentence"})` when available; fall back to punctuation regex
  - skip the regions listed above
  - do not wrap text inside controls, tooltip, source shelf, code, SVG, or diagrams
  - if glossary spans already exist, do not treat `.term` as skipped
- `buildUnits()`
  - group `.read-sentence` spans by `data-read-id`
  - filter out empty units
  - filter out spans inside `details:not([open])` unless the current user opened the details
  - if a `details` element opens or closes, rebuild units or refresh the unit list
- `installSpeechReader()`
  - detect support for `speechSynthesis` and `SpeechSynthesisUtterance`
  - hide or disable unobtrusively if unsupported
  - keep state: current index, playing, paused, token, voices, auto-scroll, lens
  - store rate, voice choice, current index, auto-scroll, and lens in `localStorage` inside try/catch
  - choose voice using the two-choice Ava/Andrew matcher
  - on sentence start: highlight and optionally scroll into view
  - on utterance end: automatically speak the next unit
  - on stop: cancel speech and clear highlight
  - on beforeunload: cancel speech
- Hover/tap behavior
  - desktop: show `.read-bubble` only when hovering a readable sentence
  - mobile: tapping a sentence starts from that sentence
  - do not trigger on glossary terms, links, buttons, or `.no-read`
- Options behavior
  - keep `<details id="ttsMore">` closed by default
  - close options on outside click or Escape
  - focus lens toggles `body.reader-lens`
  - auto-scroll default is on

## Acceptance checks
Before delivering a saved HTML file with this component, check:
- visible toolbar is compact and vertical on desktop
- no visible sentence count or verbose status text
- Options are collapsed by default
- voice select shows only Ava Natural Multilingual and Andrew Natural Multilingual
- toolbar buttons are icons only, with `aria-label`s
- hover bubble appears only when hovering readable sentence text
- sentence click/tap starts reading from that exact sentence
- reading continues to the next sentence
- current sentence highlight is visible and not visually noisy
- focus lens works and is off by default
- auto-scroll works and is on by default
- print CSS hides toolbar and bubble
- no source shelf, nav, buttons, glossary tooltip text, or controls are read aloud
- glossary `.term` spans remain inline and still work
- no horizontal overflow at 360–430px
