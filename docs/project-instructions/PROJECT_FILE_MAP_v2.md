# Project File Map v2 — Read-Aloud Upgrade

Use these files as the updated ChatGPT Project attachment set.
This version preserves the v6 learning-page improvements and adds the reusable read-aloud layer for future HTML learning files.

## Replace old files with these
- `project_instructions_compact_under8k_replacement_v5.md` replaces `project_instructions_compact_under8k_replacement_v4.md`
- `project_runtime_config_v7.json` replaces `project_runtime_config_v6.json`
- `html_style_system_v12.md` replaces `html_style_system_v11.md`
- `html_component_patterns_v2.md` replaces `html_component_patterns_v1.md`
- `navigation_and_layout_v4.md` replaces `navigation_and_layout_v3.md`
- `learning_and_retention_architecture_v11.md` replaces `learning_and_retention_architecture_v10.md`
- `quality_benchmark_and_review_v15.md` replaces `quality_benchmark_and_review_v14.md`
- `mode_triggers_v14.md` replaces `mode_triggers_v13.md`
- `project_system_improvement_v16.md` replaces `project_system_improvement_v15.md`

## Keep these current files
- `source_handling_and_failure_rules_v9.md`
- `arabic_typography_v4_replacement_v5.md`

## New support file
- `html_read_aloud_component_v1.md` is new. It defines the browser-native Speechify-like read-aloud layer that should be included by default in generated HTML learning pages.

## What the read-aloud upgrade requires
Future HTML pages should include:
- compact vertical side toolbar on desktop
- icon-only controls: ↑, ▶/⏸, ↓, ⏹, ⚙, −/+
- options collapsed by default
- only two visible voices: Ava Natural Multilingual and Andrew Natural Multilingual
- browser default voice fallback if those voices are unavailable
- sentence highlighting while reading
- hover-to-play from any sentence on desktop
- tap-to-read on mobile
- continuous reading from the chosen sentence
- auto-scroll default on and focus lens available in Options
- print CSS that hides all read-aloud controls

## Recommended upload set
Upload all files in `updated_project_files_v7_read_aloud_bundle.zip` to the ChatGPT Project and remove or ignore older versions to avoid conflicting instructions.
