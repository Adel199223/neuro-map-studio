# Codex Execution Plans

Use an ExecPlan for complex features, refactors, or bugs that affect more than one file.

Create plans in `docs/exec-plans/`. The plan is a living document: update it as facts change.

## Required sections

### Goal

One paragraph explaining the user-visible outcome.

### Current behavior

Describe what the app does now, citing specific files/functions/selectors.

### Desired behavior

Describe the exact behavior after the change.

### Constraints

Include ADHD/dyslexia learning constraints, accessibility constraints, browser constraints, and backwards-compatibility constraints.

### Implementation steps

Use small numbered steps. Each step should be verifiable.

### Test plan

List unit/manual/e2e checks. Include at least one regression test if feasible.

### Risks and rollback

Explain what could break and how to recover.

### Completion checklist

List the commands to run and observable done conditions.
