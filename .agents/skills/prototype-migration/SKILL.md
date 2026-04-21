---
name: prototype-migration
description: Use when porting behavior from the standalone HTML prototypes into modular React/TypeScript code.
---

# Prototype Migration Skill

Migration rules:

1. Treat `public/prototypes/current/` as the behavior oracle.
2. Extract one subsystem at a time.
3. Keep a working app after every step.
4. Add tests around the extracted subsystem before deep refactoring.
5. Keep data/schema compatibility or provide explicit migrations.
6. Keep old prototypes in place until the modular app is demonstrably equivalent.

Recommended extraction order:

1. shared data types and seed data;
2. workspace persistence/import/export;
3. pan/zoom viewport;
4. block component;
5. connector geometry;
6. context menus;
7. multi-page management;
8. read-aloud component.
