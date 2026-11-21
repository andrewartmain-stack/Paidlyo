# Agentic Development Protocol (ADP)

**Claude Code · Multi-agent workflow · Token efficiency · Scalable
development**

## Objective

Build production-quality web applications quickly using Claude Code
while maintaining control over architecture, generated code, token
consumption, and feature implementation.

**Core principle:** You are the architect. Claude is the implementation
team. You approve the plan, control the scope, review the code, and
approve each feature before moving forward.

Don't let multiple agents independently modify the same codebase. Give
each agent a defined responsibility and isolated context.

------------------------------------------------------------------------

## 1. Environment structure

Use a standardized project structure from the beginning.

``` text
my-app/
├── .claude/
│   ├── agents/
│   │   ├── architect.md
│   │   ├── frontend.md
│   │   ├── backend.md
│   │   ├── reviewer.md
│   │   └── tester.md
│   ├── skills/
│   │   ├── create-feature/
│   │   │   └── SKILL.md
│   │   ├── create-component/
│   │   │   └── SKILL.md
│   │   ├── database-change/
│   │   │   └── SKILL.md
│   │   ├── code-review/
│   │   │   └── SKILL.md
│   │   └── debugging/
│   │       └── SKILL.md
│   └── settings.json
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── DEVELOPMENT.md
│   └── ROADMAP.md
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── types/
│   └── utils/
├── tests/
├── CLAUDE.md
├── package.json
└── README.md
```

Keep application-specific code inside `features/`, organized by domain:

``` text
src/features/
├── authentication/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── schemas/
│   └── types/
├── billing/
├── dashboard/
└── users/
```

This makes features easier to understand, test, modify, and delegate.

## 2. Global instructions: CLAUDE.md

`CLAUDE.md` is the project's permanent instruction file. Keep it
concise; it should contain essential rules, not a massive documentation
dump.

Use it to define:

-   Technology stack.
-   Architecture conventions.
-   Folder structure.
-   Naming conventions.
-   Coding standards.
-   Security requirements.
-   Testing requirements.
-   Agent behavior.

Example:

``` markdown
# Project Instructions

## Stack
- Next.js App Router
- TypeScript (strict)
- Tailwind CSS
- Supabase
- Zod

## Architecture
- Feature-based architecture.
- Keep business logic outside UI components.
- Reuse existing components before creating new ones.
- Keep API/database access in service modules.
- Validate external input with Zod.

## Development Rules
- Never implement multiple unrelated features together.
- Never modify unrelated files.
- Never install dependencies without approval.
- Never change database schema without approval.
- Never bypass TypeScript errors.
- Never remove tests to make builds pass.

## Workflow
1. Analyse the requested feature.
2. Inspect relevant existing code.
3. Propose an implementation plan.
4. Wait for approval.
5. Implement only the approved scope.
6. Run relevant tests and checks.
7. Explain all changes.
8. Wait for approval before the next feature.

## Code Quality
- Small, reusable components.
- Explicit types.
- No unnecessary abstractions.
- No duplicated business logic.
- Production-ready error handling.
```

**Important:** Keep `CLAUDE.md` short. Put detailed architectural
explanations in `docs/` and reference them when needed. This reduces
unnecessary context consumption.

## 3. Multiple agents with separate contexts

Use Claude Code's native subagents. Create specialised agents instead of
asking one agent to do everything.

  Agent       Responsibility
  ----------- ---------------------------------------------
  Architect   Architecture, planning, technical decisions
  Frontend    UI, components, responsive design
  Backend     APIs, database, business logic
  Reviewer    Code quality, security, architecture
  Tester      Unit, integration and E2E tests

Each agent gets its own `.md` definition inside `.claude/agents/`.

Example: `.claude/agents/reviewer.md`

``` markdown
---
name: reviewer
description: Reviews implemented features for bugs, security issues and maintainability.
tools: Read, Grep, Glob, Bash
model: sonnet
---

You are a senior software engineer.

Review only the requested changes.

Check:
- Logic errors
- Security vulnerabilities
- Type safety
- Performance
- Architecture consistency
- Code duplication
- Missing tests

Do not modify files.

Return:
1. Critical issues
2. Recommended fixes
3. Minor improvements
4. Overall verdict
```

### Context isolation rules

1.  Every agent receives only the context necessary for its task.
2.  Agents should not receive the entire project documentation by
    default.
3.  Reviewer should receive the feature requirements and code diff, not
    the entire development conversation.
4.  Agents working on separate features should use separate Git
    worktrees.
5.  Only the main agent should coordinate architecture decisions.

Use subagents for independent tasks, not for every small operation.
Frontend and backend agents can work independently on separate modules,
while the architect coordinates their interfaces.

## 4. Skills: automate repetitive workflows

Agents define **who performs the work**. Skills define **how a
particular task should be performed**.

Create reusable skills for repetitive operations:

  Skill                Purpose
  -------------------- ------------------------------------------
  `create-feature`     Standard feature implementation workflow
  `create-component`   Reusable UI component creation
  `database-change`    Database migrations and schema changes
  `code-review`        Consistent code review
  `debugging`          Systematic bug investigation
  `api-endpoint`       Standard API implementation
  `seo-page`           SEO metadata and page structure

Example: `.claude/skills/create-feature/SKILL.md`

``` markdown
---
name: create-feature
description: Implements a feature following project architecture.
---

# Feature Development

1. Read the feature requirements.
2. Inspect existing architecture.
3. Identify affected files.
4. Propose implementation plan.
5. Identify database/API changes.
6. Wait for approval.
7. Implement only approved scope.
8. Write or update tests.
9. Run lint, typecheck and tests.
10. Report modified files and outstanding issues.

Rules:
- Do not refactor unrelated code.
- Follow existing conventions.
- Avoid unnecessary dependencies.
- Keep implementation minimal.
- Never silently change existing behavior.
```

Invoke skills when relevant rather than loading every skill into every
agent's context.

Official documentation:
https://docs.anthropic.com/en/docs/claude-code/skills

## 5. Feature-by-feature development workflow

Never ask Claude to "build the entire application." Break the
application into small, independently verifiable features.

### The development cycle

1.  **PLAN** --- Ask the architect to analyse the feature, dependencies,
    affected files and implementation strategy.
2.  **APPROVE** --- Review the plan. Approve or correct it before
    implementation.
3.  **IMPLEMENT** --- Delegate to the appropriate agent. Restrict
    changes to the approved scope.
4.  **VERIFY** --- Run TypeScript, ESLint, tests and relevant manual UI
    checks.
5.  **REVIEW** --- Run the reviewer agent against the Git diff.
6.  **ACCEPT** --- Inspect the code yourself. Commit the feature only
    after approval.

Example development sequence for a CRM:

  Phase   Feature
  ------- ------------------------
  1       Project foundation
  2       Authentication
  3       User management
  4       Dashboard
  5       Client management
  6       Appointment management
  7       Notifications
  8       Billing

Don't start a dependent feature before its prerequisites are stable.

## 6. Git and isolated development environments

Git should be your safety mechanism. Create a commit after every
approved feature:

``` bash
git add .
git commit -m "feat: implement authentication"
```

For multiple agents, use Git worktrees:

``` bash
# Create isolated working environments
git worktree add ../app-frontend -b feature/frontend
git worktree add ../app-backend -b feature/backend
```

Each worktree has its own working directory and branch.

**Important:** Worktrees isolate files and Git branches, but they don't
automatically resolve architectural conflicts. Define API contracts and
shared interfaces before parallel implementation. Merge reviewed changes
into the main branch only after integration tests pass.

## 7. Token efficiency protocol

Avoid wasting tokens and money.

  Rule                       Implementation
  -------------------------- ---------------------------------------------
  Short instructions         Keep CLAUDE.md concise
  Isolated contexts          Use subagents for independent tasks
  Targeted exploration       Read relevant files, not entire directories
  No repeated research       Document established decisions
  Avoid unnecessary agents   Use the main agent for simple changes
  Avoid unnecessary MCPs     Connect only tools you actually need
  Fresh sessions             Start new sessions for unrelated features
  Persistent state           Keep progress in project documentation

Additional practices:

-   Use Sonnet for routine implementation, debugging and testing.
-   Reserve Opus for complex architectural decisions and difficult
    problems.
-   Don't ask Claude to explain every file it reads.
-   Ask for concise implementation reports.
-   Don't repeatedly paste documentation that already exists in the
    repository.
-   Use `/clear` when switching to an unrelated task.
-   Use `/compact` when you need to preserve the current conversation's
    context but reduce its size.

### Maintain a compact progress file

Keep a `docs/PROGRESS.md` file:

``` markdown
# Development Progress

## Completed
- [x] Project foundation
- [x] Authentication

## In progress
- [ ] Client management

## Next
- [ ] Appointment management

## Technical decisions
- Authentication: Supabase Auth
- Database: PostgreSQL
- Validation: Zod

## Known issues
- None
```

This gives a new session a compact source of truth without
reconstructing an entire conversation.

## 8. Permissions and safety

Configure Claude Code so it can perform routine operations without
repeatedly interrupting you, but cannot silently make dangerous changes.

Recommended approach:

-   Allow reading, searching, linting and running approved tests.
-   Ask permission before installing packages.
-   Ask permission before changing database schemas.
-   Ask permission before deleting files.
-   Protect `.env` files and secrets.
-   Never use unrestricted permission bypasses as your default workflow.

Use `.claude/settings.json` for project-specific permissions and
configuration.

## 9. Essential development commands

  -----------------------------------------------------------------------
  Command                             Purpose
  ----------------------------------- -----------------------------------
  `/init`                             Initialize project instructions

  `/agents`                           Manage subagents

  `/skills`                           Explore available skills

  `/clear`                            Start a fresh context

  `/compact`                          Compress current context

  `/context`                          Inspect context consumption

  `/cost`                             Inspect token/cost information
                                      where supported

  `/plan`                             Enter planning mode

  `claude --worktree feature-name`    Start an isolated Git worktree
                                      session
  -----------------------------------------------------------------------

Command availability can vary by Claude Code version. Consult the CLI
reference: https://docs.anthropic.com/en/docs/claude-code/cli-reference

## 10. Standard prompt templates

Save and reuse these prompts.

### A. Start a new feature

``` text
I want to implement: [FEATURE]

First, analyse the existing project.

Do not modify any files yet.

Return:
1. Feature requirements
2. Existing files that need modification
3. New files required
4. Database/API changes
5. Dependencies
6. Implementation steps
7. Potential risks

Wait for my approval.
```

### B. Implement an approved feature

``` text
Implement the approved feature plan.

Rules:
- Follow CLAUDE.md.
- Use the create-feature skill.
- Modify only files within the approved scope.
- Do not implement additional features.
- Do not refactor unrelated code.
- Write appropriate tests.
- Run typecheck, lint and relevant tests.

When finished, report:
1. Files changed
2. What was implemented
3. Tests performed and results
4. Remaining issues

Do not commit.
```

### C. Review generated code

``` text
Review the latest Git diff.

Do not modify files.

Check:
- Bugs and incorrect logic
- Security
- Architecture
- Performance
- TypeScript
- Maintainability
- Missing tests

Classify issues as critical, major or minor.

Provide specific file references and suggested fixes.
```

## 11. Initial setup checklist

-   [ ] Install and configure Claude Code
-   [ ] Initialize Git repository
-   [ ] Create project folder structure
-   [ ] Create concise CLAUDE.md
-   [ ] Create ARCHITECTURE.md and DATABASE.md
-   [ ] Configure specialised subagents
-   [ ] Create reusable development skills
-   [ ] Configure permissions and safety rules
-   [ ] Set up lint, typecheck and test scripts
-   [ ] Test isolated development using Git worktrees
-   [ ] Create feature planning and review workflow

## 12. Official resources

Use official documentation rather than random collections of Claude Code
configurations.

1.  Claude Code documentation:
    https://docs.anthropic.com/en/docs/claude-code/overview
2.  Subagents: https://docs.anthropic.com/en/docs/claude-code/sub-agents
3.  Skills: https://docs.anthropic.com/en/docs/claude-code/skills
4.  Memory and CLAUDE.md:
    https://docs.anthropic.com/en/docs/claude-code/memory
5.  Settings and permissions:
    https://docs.anthropic.com/en/docs/claude-code/settings
6.  Common workflows:
    https://docs.anthropic.com/en/docs/claude-code/common-workflows

------------------------------------------------------------------------

## Final recommendation

Don't overcomplicate your agent infrastructure.

Start with:

-   **One orchestrator**
-   **Four specialised agents** (architect, frontend, backend,
    reviewer/tester)
-   **Five reusable skills**
-   **Git worktrees** for independent parallel tasks
-   **One source of truth** for architecture and project progress

Your ideal workflow:

1.  You define requirements and approve plans.
2.  Claude Code's main agent coordinates work.
3.  Specialist agents implement independent tasks.
4.  Skills provide repeatable procedures.
5.  Git, tests and human review control integration.

More agents do not automatically mean faster development. Parallelise
independent work, isolate contexts, and keep one source of truth for
architecture.

**Your biggest productivity improvement will come from making Claude
consistently execute small, approved, testable tasks rather than
generating large amounts of code that you then have to untangle.**
