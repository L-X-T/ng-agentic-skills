# NG Agentic Engineering

![Agentic Engineering workshop overview](AE-workshop-overview.png)

This sketch outlines the Agentic Engineering workshop arc: choosing AI models and harnesses, setting up an Angular AI workspace with best practices and style guides, building reusable AI skills, applying AI supported workflows, and using those foundations for targeted Angular refactoring. It connects directly to my recent [Agentic Engineering blog post series](https://www.angulararchitects.io/blog/best-llms-for-angular/), where I walk through the model choices, app and harness tradeoffs, costs, data privacy questions, and final setup recommendations behind the workshop.

A practical Angular workspace starter with modern best practices, AI-ready tooling, and scalable project setup guidance.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.0.0 on June 6th, 2026.

## Generate a new project with the CLI

To start we've created a new Angular project using the `ng new` command:

```shell
ng new ng-agentic
```

This sets up the basic structure of your Angular application, including configuration files, dependencies, and a simple starter component. It also initializes a Git repository for version control.

### Fix initial commit

We fixed the initial commit by removing unnecessary duplications of the `AGENTS.md` instructions and running the following command:

```shell
pnpm format
```

which then executes:

```shell
prettier --write .
```

To avoid doing this manually every time, we can set up a pre-commit hook using Husky to automatically run the formatter before each commit.

## Install & setup Husky

### Install Husky

```shell
pnpm add -D husky
```

### Initialize Husky

```shell
pnpm exec husky init
```

### Update .husky/pre-commit

```shell
pnpm format
```

## Install Angular ESLint

To ensure code quality and consistency, we install Angular ESLint in our project. This tool helps us identify and fix issues in our TypeScript code according to best practices.

Our pre-commit hook only runs the formatter so far, so we add Angular ESLint with the following command:

```shell
ng add angular-eslint
```

Besides the `angular-eslint` package itself this also registers the `angular-eslint` schematic collection in `angular.json` and pins `@angular-eslint/builder` as an explicit devDependency, so the lint builder resolves reliably under pnpm.

### Lint-staged

We configured Angular ESLint to run as part of our development workflow, ensuring that any new code adheres to our coding standards before it's committed to the repository.

```shell
pnpm add -D lint-staged
```

In our `package.json`, we added the following configuration to run ESLint on staged files:

```json
{
  "lint-staged": {
    "*.{html,js,ts}": ["eslint --fix", "prettier --write"],
    "*.{css,json,md,scss}": ["prettier --write"]
  }
}
```

We updated our Husky pre-commit hook to run lint-staged:

```shell
pnpm exec lint-staged
```

This way, we can maintain code quality without having to remember to run the commands manually.

### Extend ESLint configuration

By adding more rules to our flat ESLint configuration in `eslint.config.js`, we can enforce better
coding practices and catch potential issues early. Look at `eslint.config.js` to see my
recommendations.

To apply the new ESLint rules, we can run the following command:

```shell
ng lint --fix
```

There are two remaining issues that we need to fix manually:

```text
/Users/lxt/ng/ng-agentic/src/app/app.ts
  4:1  warning  The component's `changeDetection` value should be set to `ChangeDetectionStrategy.OnPush`  @angular-eslint/prefer-on-push-component-change-detection

/Users/lxt/ng/ng-agentic/src/main.server.ts
  5:47  error  Missing return type on function  @typescript-eslint/explicit-function-return-type
```

Because these are mechanical fixes, we can ask `codex` or another agent to make them for us.

## Angular Coding Style Guide

Find our [Angular Coding Style Guide](style-guide/style-guide.md) in the `style-guide` folder.

It contains general guidelines for writing clean and maintainable code in Angular projects, as well as specific style guides for different file types such as Git commits, HTML templates, NPM packages, SCSS styling files, and TypeScript files.

Anyone who copies and pastes this style guide should replace the `lxt-` class-name prefix with a prefix that is meaningful for her or his own app.

## Opinionated Agent Instructions

This commit turns `AGENTS.md` from a generic Angular guidance file into a repo specific operating contract for AI agents, adding workflow rules for preserving user edits, loading only the narrowest relevant style guides, applying modern Angular v22+ defaults, keeping TypeScript strict, and respecting template, accessibility, service, and testing boundaries.

Two things to keep in mind when adopting these instructions:

- **They are tuned for a specific model generation.** This `AGENTS.md` was developed and tested against Opus 4.5 to Opus 4.8 and GPT-5.2 to GPT-5.5. With newer, more intelligent models arriving – Fable 5, GPT-5.6 – we will have to reevaluate whether the detailed instructions on Angular and TypeScript best practices are still necessary to get high-quality code output, or whether the models already internalize them. Treat this as a constantly evolving instruction set, not a finished artifact.
- **Less can be more.** Parts of the community argue that shorter instruction files outperform long ones, because every rule competes for the model's attention. So don't copy this file verbatim – play around with the instructions, measure what actually changes your output quality, and fine-tune them for your own projects and workflows.

## Finish the AI Setup

In the last commit we wrapped up the agentic tooling so every AI tool – Claude Code, Codex, Cursor, Cline, Junie, Gemini, Windsurf, GitHub Copilot and VS Code – works from the same conventions and the same servers:

- **Reduced accidental secret reads per tool** – there's no cross-vendor ignore standard yet, so
  configure each tool deliberately. Claude Code's `permissions.deny` rules guard its built-in file
  tools but may not cover shell commands. Codex's `no-secrets` filesystem profile applies its deny
  patterns across filesystem access, including shell commands, when that profile is active. Neither
  mechanism is a complete security boundary. Verify the configured behavior with a harmless fixture,
  keep real secrets outside the checkout, use sandboxing for filesystem isolation, constrain shell
  access for unattended runs, and prefer short-lived, scoped credentials.
- **Registered MCP servers** in `.mcp.json` (Angular CLI, Spartan UI, Chrome DevTools, Figma and
  Figma Desktop) and mirrored them into the tool-specific locations that don't read the root file:
  `.vscode/mcp.json`, `.junie/mcp/mcp.json` and `.codex/config.toml`.
- **Added thin per-agent files** (`.cursorrules`, `.clinerules`, `.junie/AGENTS.md`, `.gemini/GEMINI.md`, `.windsurf/rules/guidelines.md`, `.github/copilot-instructions.md`) that defer to `AGENTS.md`, plus `.claude/settings.json` to enable the project MCP servers.
- **Renamed `.prettierrc` to `.prettierrc.json`** and added an `ng:update` script to `package.json` for upgrading Angular.

## Feedback Loops

Agentic feature work is strongest when every change is checked against fast, concrete feedback from the application.
The core agent-facing expectations behind these loops are also captured in [AGENTS.md](AGENTS.md), including lint and static verification, serving ownership, Chrome debugging, and test setup boundaries.

### Linting

Linting turns the project's static rules into immediate feedback for an agent by catching style, accessibility, and TypeScript issues before runtime. Run `ng lint` or the repo's lint script and feed any diagnostics back into the next agent prompt.

### Building

A build verifies that the full Angular graph still compiles and that strict TypeScript, templates, imports, and bundling remain valid. When `ng build` or the project build target fails, the error output gives the agent exact files and symbols to fix.

### Serving

Serving the app creates the live feedback loop for manual checks, browser inspection, and debugging. I prefer to start and stop the dev server myself in a terminal so I keep full control of the running process, and agents should use the already-running app instead of starting it for me.

### Chrome Debugger

Some tools, including Codex, provide an internal browser that agents can use for debugging browser state, console errors, network traffic, and interaction bugs. I still prefer running Chrome in debugging mode for this feedback loop: start Chrome with a remote debugging port – the [Chrome DevTools remote debugging docs](https://developer.chrome.com/docs/devtools/remote-debugging/local-server) explain the setup in more detail – for example `open -na "Google Chrome" --args --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-agent-debug` – then connect Chrome DevTools or an agent browser tool to `http://localhost:9222`.

### E2E Testing

E2E tests exercise real user flows in the browser, so they catch integration and interaction bugs that linting and builds miss. When a Playwright or Cypress run fails, screenshots, traces, logs, and failure messages become focused feedback that an agent can use to repair the feature.

## Recommended AI Companion Apps

Agentic work changes what you do all day: less typing code, more talking to agents, reviewing diffs, and shuttling context between apps. These eight companion apps support exactly that. None of the links below are referral links, just my pure recommendations – the only exception is the Wispr Flow link, and that one is written out so you can see it.

### Must Use

#### Wispr Flow

Wispr Flow is a system-wide voice dictation app – you speak, it types into whatever app has focus. Prompting agents is much faster when you talk instead of type. Stop pretending it's still 2025. ☺ Get a free month via <https://wisprflow.ai/r?ALEXANDER14084> – yes, that's a referral link, but a really good one.

#### Git GUI

A Git GUI makes it easy to review agent-generated changes, stage them selectively, and switch branches – especially if you otherwise live in VS Code. Look at the [Git GUI overview](https://git-scm.com/tools/guis) or use [Fork](https://fork.dev).

#### Ghostty or WezTerm

We preferably drive agents from super apps like Codex, Claude Desktop, Cursor, or even T3 Code – but for the CLI moments that remain, a modern terminal like [Ghostty](https://ghostty.org) (mac) or [WezTerm](https://wezterm.org) (cross-platform) is worth it.

#### Clipboard History Manager

You constantly shuttle prompts, snippets, and screenshots between agents, editors, and browsers. [Raycast](https://raycast.com) (mac) or [Ditto](https://ditto-cp.sourceforge.io) (win) make sure you never lose one to the next copy.

### Should Use

#### GitHub CLI

Agents lean on the [GitHub CLI](https://cli.github.com) (`gh`) for creating pull requests, reading issues, and checking CI – install it once and every agent can use it.

#### Screenshot Tool

Screenshots are the fastest way to hand visual context – broken layouts, design references, error dialogs – to an agent. Use e.g. [Shottr](https://shottr.cc) (mac) or [ShareX](https://getsharex.com) (win).

#### Markdown WYSIWYG Editor

Agentic workflows produce a lot of Markdown – plans, reviews, docs like this one. [Typora](https://typora.io) (cross-platform) makes editing them pleasant.

#### Window Manager / Split Screen Helper

Agent, editor, and browser side by side is the standard layout – [Rectangle](https://rectangleapp.com) (mac) or [FancyZones](https://learn.microsoft.com/en-us/windows/powertoys/fancyzones) (win, part of PowerToys) get you there with one shortcut.
