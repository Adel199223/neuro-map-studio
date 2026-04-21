# Learning map feature notes

The current source of truth is the standalone HTML prototype in `public/prototypes/current/mindmap.html`.

Port it into modules in small, testable steps:

1. map data model and workspace persistence;
2. viewport pan/zoom engine;
3. block rendering, editing, resizing, and shape styling;
4. connection-port geometry and relationship lines;
5. context menus and command model;
6. multi-page workspace management;
7. import/export and autosave;
8. keyboard accessibility and reduced-motion support.

Do not rewrite behavior from memory. Compare against the prototype and add regression tests before large refactors.
