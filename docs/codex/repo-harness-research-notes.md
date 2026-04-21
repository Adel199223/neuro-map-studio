# Repository harness research notes

This harness follows current Codex guidance from OpenAI documentation:

- Use `AGENTS.md` for durable repository-level guidance.
- Keep `AGENTS.md` practical and concise.
- Structure prompts with goal, context, constraints, and done-when criteria.
- Use execution plans for complex, multi-step work.
- Check in reusable skills under `.agents/skills/` for repeated workflows.

Official sources used while designing this harness:

- https://developers.openai.com/codex/learn/best-practices
- https://developers.openai.com/codex/guides/agents-md
- https://developers.openai.com/codex/concepts/customization
- https://developers.openai.com/codex/skills
- https://developers.openai.com/codex/config-advanced
- https://developers.openai.com/cookbook/articles/codex_exec_plans
- https://learn.microsoft.com/en-us/windows/wsl/filesystems
- https://learn.microsoft.com/en-us/windows/wsl/tutorials/wsl-containers
