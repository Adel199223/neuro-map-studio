# Project System Improvement Rules v15

Use this file only in SYSTEM REVIEW mode or when the user explicitly asks to improve the project, rules, workflow, instructions, or output quality.

## Purpose
This mode improves:
- project instructions
- attached rule files
- runtime config
- trigger system
- HTML component patterns
- quality benchmark
- source handling
- learning architecture
- typography rules
- recurring artifact failures

It is not for researching the subject matter of user content.

## Inputs to inspect
When available, inspect:
1. current main project instructions
2. runtime JSON config
3. attached rule files
4. generated HTML artifacts
5. screenshots of artifacts
6. user feedback on output quality
7. repeated patch history
8. quality benchmark
9. learning architecture
10. typography and layout rules

## Core diagnosis buckets
Separate issues into:
- prompt/instruction gap
- runtime hard-setting gap
- style-system gap
- component implementation gap
- learning-architecture gap
- source-handling gap
- layout/mobile gap
- QA benchmark gap
- regression-test gap

Do not solve an implementation bug only in prose if a reusable component pattern would prevent recurrence.

## v6 regression lessons to preserve
The refinement cycle exposed these reusable rules:

### Headings
Problem: generic headings sounded polished but did not teach.
Fix: require subject-specific headings.
Do not allow “The whole argument in one breath” or “The clean version.”

### Font
Problem: output drifted away from the requested reading font.
Fix: hard-default Latin body stack to Comic Sans and scan saved HTML.

### Glossary
Problem: hover definitions worked in some places but skipped bold labels/cards/headings.
Problem: glossary terms inherited layout styles and became pills/full-line blocks.
Fix:
- glossary terms must be inline with defensive CSS
- do not skip `strong` or useful lower-level headings by default
- add aliases and multiword terms
- add `aria-label`/`title` fallback
- scan screenshots/DOM for missed terms

### Diagrams
Problem: arrows/lines overlapped text and chart lines escaped boxes.
Fix:
- labels in boxes
- arrows in clear lanes
- bounded SVG charts or card-based diagrams
- center number badges with grid/flex
- review phone and desktop

### Mobile
Problem: wide wrappers and visual grids can create phone reading issues.
Fix:
- compact mobile nav
- stacked visual grids
- reset table/wrapper overflow in phone mode
- no `touch-action: pan-x` in main reading flow

## Improvement output policy
When updating project files:
- create new versioned replacement files rather than silently editing old names
- include only files that should change
- include a file map / README when many files are produced
- include a zip bundle when practical
- keep final chat response brief with download links

## File naming
Use version increments:
- project_runtime_config_v6.json
- html_style_system_v11.md
- navigation_and_layout_v3.md
- learning_and_retention_architecture_v10.md
- quality_benchmark_and_review_v14.md
- source_handling_and_failure_rules_v9.md
- mode_triggers_v13.md
- project_system_improvement_v15.md
- arabic_typography_v4_replacement_v5.md
- html_component_patterns_v1.md when reusable implementation patterns are needed

## How to improve a rule file
For each changed file:
1. preserve its core role
2. remove stale references to older file versions
3. add only rules that reduce future failure probability
4. convert repeated user feedback into explicit acceptance criteria
5. avoid overly long prose if a hard setting belongs in JSON
6. avoid conflicting soft and hard instructions
7. keep examples concrete

## Runtime JSON update rules
Use JSON for hard-edged defaults:
- font stack
- heading prohibitions
- glossary requirements
- diagram requirements
- mobile review requirements
- final artifact scans

Use Markdown files for nuance, judgment, and examples.

## Component pattern file
Create or update a component pattern file when failures are implementation-specific, such as:
- glossary hover spans
- tooltip viewport logic
- K-chart layout
- number badge centering
- mobile stacked tables
- visual pretraining grids

## Final system-review quality gate
Before delivering updated project files, check:
- new file names are consistent
- main instructions reference new file versions
- JSON references new benchmark/system files
- glossary and visual fixes are encoded in both style rules and QA checks
- source handling still preserves transform-only default
- Arabic rules remain protected from Latin font defaults
- zip bundle contains every replacement file

## Final response in SYSTEM REVIEW mode
Provide:
- short summary of what changed
- direct links to replacement files
- zip bundle link when created
- any important installation note such as “replace old versions with these”

Do not include a long essay unless the user asks for one.
