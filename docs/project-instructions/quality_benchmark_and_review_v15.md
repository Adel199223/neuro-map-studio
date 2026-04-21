# Quality Benchmark and Review Rules v15

Use this file as:
1. the final quality gate for normal HTML generation
2. the rulebook for QUALITY CHECK mode
3. the regression checklist after fixing an existing artifact

## Purpose
The benchmark evaluates output quality, learning value, source-faithfulness, accessibility, layout stability, read-aloud usability, and regression prevention.
It is not about researching the subject matter.

## Non-negotiable baseline
A result fails if it:
- researches when the task was transform-only
- uses inaccessible or guessed content as if accessible
- ignores the hard-stop rule when source access is insufficient
- creates noisy, cramped, generic, or hard-to-scan output
- keeps visible workflow/build narration after the page is structurally clear
- mishandles Arabic or forces Latin font onto Arabic
- invents Arabic diacritics/vocalization not present in the source
- fails phone reading flow when sidebar/table/visual grid exists
- ships diagrams with arrows/lines over text or labels outside boxes
- ships glossary hovers that turn into pills, blocks, or broken full-line highlights
- ships a noisy or broken read-aloud layer when read-aloud is required

## Strong-output profile
A strong page:
- reads like a finished study page, not a report about notes
- has a compact hero
- uses subject-specific headings
- teaches the central idea early
- uses visual pretraining when abstract
- decodes technical terms inline
- keeps useful nuance and control cases
- has consistent cards/panels and semantic color
- has mobile layout that feels intentional
- has retrieval/review support when material is study-worthy
- gives source access without clutter
- includes a compact read-aloud layer that supports focus without covering the lesson

## Regression lessons from v1–v7 refinement
Always check these before finalizing:

### 1. Headings
Fail if headings are vague, such as:
- The whole argument in one breath
- The clean version
- The machine
- The players
- Applications
- Deep explanation

Pass when headings name the actual idea:
- How debt becomes political control
- Why a £100 bank loan creates new money
- Who holds leverage in the system
- Wars, bailouts, algorithms, and slow collapse

### 2. Font
Fail if Latin body text does not use the required Comic Sans stack.
Pass when saved HTML contains:
```css
font-family: "Comic Sans MS", "Comic Sans", cursive, "OpenDyslexic", "Atkinson Hyperlegible", Verdana, Arial, sans-serif;
```
Arabic must still use Arabic-friendly stacks.

### 3. Inline glossary
Fail if:
- obvious technical terms are not hoverable where they appear
- terms only work in some paragraphs but not cards/bold labels
- terms become pills, badges, boxes, or full-line blocks
- highlighted span width forces the next words onto a new line
- native fallback is missing

Pass when:
- glossary terms remain inline
- multiword terms and aliases are covered
- terms work in paragraphs, list items, bold labels, cards, and useful headings
- tooltip works on hover/focus/tap
- `aria-label` or `title` fallback exists

Test terms that commonly reveal failure:
- asset ownership
- leverage
- commercial banks
- central banks
- QE
- reserves
- bailout
- primary dealers
- corporate debt
- asset managers
- ETFs
- sovereign wealth funds

### 4. Diagrams
Fail if:
- graph lines escape their box
- lines/arrows cross text
- labels are outside boxes
- number circles are not centered
- text is too tiny in diagrams

Pass when:
- labels are in boxes
- arrows have clear lanes
- chart lines stay clipped inside chart frame
- number badges are visually centered
- diagrams stack cleanly on phone

### 5. Mobile layout
Fail if:
- sidebar remains visible on phone
- tables require sideways panning without need
- `touch-action: pan-x` traps the reading flow
- table label strips become dead horizontal zones
- visual cards overflow the viewport
- glossary tooltips cause horizontal overflow

Pass when:
- mobile nav collapses
- main content is single-column
- table rows stack as cards when helpful
- wrappers reset overflow/touch behavior
- no horizontal overflow at 320–430px


### 6. Read-aloud layer
Fail if:
- the read-aloud toolbar is a large rectangle or visually dominates the page
- desktop controls are not compact and vertical
- visible controls contain words like “Play” or “Stop” instead of icons
- visible sentence-status text appears, such as “Sentence 11 of 203”
- options are expanded by default
- the voice selector lists more than Ava Natural Multilingual and Andrew Natural Multilingual
- current sentence highlighting is missing
- hover-to-play is missing on desktop
- tap-to-read is missing on phone
- reading stops after one sentence instead of continuing
- print mode shows speech controls

Pass when:
- visible controls are icon-only: ↑, ▶/⏸, ↓, ⏹, ⚙, −/+
- options are collapsed and contain speed, voice, auto-scroll, focus lens, and replay
- Ava is the default visible voice, Andrew is the only alternate visible voice, and browser fallback works silently
- sentence highlighting follows the speech
- the toolbar remains usable without covering important text
- `.speech-panel`, `.read-bubble`, and current sentence classes are excluded from normal reading/glossary processing

## Source-faithfulness benchmark
A good transform:
- keeps the source’s meaningful distinctions
- does not add outside claims unless requested
- preserves counterweights and control cases
- does not over-certify disputed claims
- does not keep repeating provenance phrases that clutter learning

Fail if:
- claims are invented from title or partial access
- missing content is silently filled in
- qualified material becomes unqualified
- unique examples are removed when they teach the model

## Learning benchmark
A good study-worthy page includes:
- core thesis early
- visual pretraining if abstract
- concept primer if terminology is unfamiliar
- concrete anchor example
- segmented sections with specific headings
- inline glossary hovers
- retrieval checks
- short review-later plan when useful

Fail if:
- it is only a pleasant summary
- the reader cannot tell how ideas relate
- too many cards are equal-weight and ungrouped
- definitions are only at the bottom
- retrieval prompts are missing when the page is clearly for study

## Visual/HTML inspection checklist
Inspect the saved file itself.
Do not rely only on the intended draft.

Required scans:
- banned phrase scan
- heading specificity scan
- Comic Sans stack scan
- glossary CSS scan for `display:inline !important`
- read-aloud scan for compact `.speech-panel`, `.read-bubble`, hidden status, collapsed options, and icon-only controls
- diagram overlap scan or visual inspection
- phone layout sanity check when layout is complex
- source shelf collapsed by default if inline source access is good

Suggested quick text scan:
```text
Study page
Single-source study page
The whole argument in one breath
The clean version
This page turns
This page restructures
Primary source:
Play reading
Stop reading
Sentence 11 of
built from the pasted discussion
without adding outside subject research
```

## QUALITY CHECK mode output
When asked for QUALITY CHECK:
- be short and diagnostic
- list the highest-impact issues first
- identify exact fixes
- do not rewrite the whole artifact unless asked
- separate content issues, learning issues, visual issues, mobile issues, glossary issues, and source issues

## Final pass scorecard
Use this mental scorecard:
- Source access: pass/fail
- Transform-only boundary: pass/fail
- Heading specificity: pass/fail
- Typography: pass/fail
- Glossary coverage/layout: pass/fail
- Visual diagrams: pass/fail
- Mobile layout: pass/fail
- Learning architecture: pass/fail
- Read-aloud layer: pass/fail
- Reader-facing polish: pass/fail

Any fail in typography, glossary layout, visual overlap, read-aloud usability, hard-stop, or mobile overflow must be fixed before delivery.
