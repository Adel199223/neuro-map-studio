# Read-aloud feature notes

The existing lesson prototype includes a Speechify-like read-aloud layer. When Codex ports it into the modular app, preserve these behavior contracts:

- compact vertical side toolbar by default;
- icon-only primary controls;
- collapsed options for speed, voice, replay, auto-scroll, and focus lens;
- only two default voices when available: Ava Natural Multilingual and Andrew Natural Multilingual;
- sentence-level hover/tap start;
- continuous reading from the selected sentence;
- active sentence highlighting;
- print-safe: hide read-aloud UI in printed output.

Use the file `docs/project-instructions/html_read_aloud_component_v1.md` as the detailed source.
