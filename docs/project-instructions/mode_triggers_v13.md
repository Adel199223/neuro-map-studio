# Optional Mode Triggers v13

Default mode remains transformation into the best possible self-contained reading page.
Only change mode when the user explicitly uses one of these trigger words.

## TIMELINE
Rebuild the material into a time-ordered HTML page.
Prioritize chronology, turning points, phase changes, and dated excerpts.
Use a visual timeline when it genuinely improves learning.

## EVIDENCE MAP
Rebuild the material into claims, support, uncertainty, gaps, and evidence strength.
Make it easy to see what is asserted, what is evidenced, and what remains weak.
Use confidence levels without turning the page into a legal memo unless requested.

## COMPARISON
Rebuild the material into a side-by-side comparison.
Use tables only if they reduce cognitive load.
On phone, tables must stack cleanly into cards unless horizontal panning is truly necessary.

## ANNOTATED
Keep the source text central and add quiet, helpful notes around it.
Do not let annotations overwhelm the source.
Use inline glossary hovers for technical terms when helpful.

## SIMPLIFY
Make the page easier to read while preserving substance.
Prefer plainer wording, stronger chunking, more visual anchors, and fewer redundant passages.
Do not flatten qualified or disputed material into a misleadingly clean answer.

## STUDY
Turn the material into a study-oriented page optimized for comprehension and retention.
Consult `learning_and_retention_architecture_v10.md` and respect `project_runtime_config_v6.json`.

Strongly prefer:
- visual pretraining when material is abstract
- subject-specific headings
- one concrete anchor example early
- inline glossary hovers for technical terms
- retrieval checks
- review-later cues

## GLOSSARY
Prioritize a glossary architecture.
Use inline hover/tap terms throughout the body and a collapsed glossary shelf as backup.
Terms must stay inline and must not become pills or full-line blocks.

## DIAGRAM
Prioritize visual explanation.
Use safe diagrams with labels in boxes, arrows away from text, bounded chart lines, and centered number badges.
Test phone width when visual grids exist.

## QUALITY CHECK
Do not rewrite the artifact unless asked.
Produce a short diagnosis using `quality_benchmark_and_review_v14.md`.
Group issues by:
- content/source
- headings
- typography
- glossary
- visuals
- mobile layout
- learning structure

## SYSTEM REVIEW
Improve the project itself: instructions, configs, rule files, benchmarks, triggers, and component patterns.
Consult `project_system_improvement_v15.md`.
Produce replacement files only when they should change.
When creating new files, include a short file map.

## PATCH
Modify the existing artifact with minimal changes.
Use when the user says fix, update, patch, revise, adjust, or points to screenshot issues.
Preserve what is working and fix only the failure class unless a broader improvement is obviously needed.

## REBUILD
Recreate the artifact from the source material and current rules.
Use when the current artifact is structurally flawed or repeated patches would be weaker than a clean build.

## PRINT
Optimize the HTML for printing or saving as PDF.
Add print CSS, avoid sticky elements in print, reveal collapsed study supports only if useful, and keep source shelf readable.

## MOBILE FIRST
Prioritize phone reading.
Use compact mobile nav, single-column flow, stacked cards, no touch traps, and no avoidable horizontal overflow.
