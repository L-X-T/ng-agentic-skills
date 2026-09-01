# Domain-Driven Design for Angular

The reference model this review judges against – strategic design plus the Nrwl/Nx monorepo library patterns (Enterprise Monorepo Patterns, Nrwl; Steyer, _Enterprise Angular_). It applies to **any** Angular project: in an **Nx monorepo** the categories are libraries with tags; in a **plain app** they are feature folders under `src/app`. The rules are the same – only their enforcement differs.

## Strategic design

- **Sub-domain** – a coherent slice of the business (a flight system → Booking, Check-in, Boarding, Luggage). Found from real-world roles and activities, not from the technology.
- **Bounded context** – the boundary within which a model and its terms have one precise meaning. The same word differs across contexts ("Flight", "Ticket", "Passenger" each mean different things in Booking vs Boarding). One context ≈ one **domain** in the structure below.
- **Ubiquitous language** – the agreed vocabulary inside a context, used identically in conversation, code, and types. Naming drift is a design smell. The project's `CONTEXT.md` is where this language is recorded.
- **Context map** – how contexts relate. The relationships to look for:
  - **Shared kernel** – a small model shared by two contexts. Powerful but risky: shared responsibility, and breaking changes ripple across both. Keep it minimal (the `shared` scope).
  - **Open/host service** – a context exposes a defined **api** for others to consume, instead of letting them reach into its internals.

## Library categories – the structural model

Each unit of code has exactly one **type**. Tag both its **type** and its **domain/scope** (`booking`, `boarding`, `shared`, …):

| Category      | Holds                                                                  | Notes                                   |
| ------------- | ---------------------------------------------------------------------- | --------------------------------------- |
| `feature`     | use-case **smart** components that orchestrate state and data-access   | one per use case                        |
| `ui`          | use-case-agnostic **dumb** presentational components                   | reusable; no domain or data deps        |
| `data-access` | REST/GraphQL client services – the delegate layer to server-tier APIs  | the infrastructure seam                 |
| `domain`      | entities, business logic, domain state (e.g. fare calculation)         | **no** framework or infrastructure deps |
| `util`        | pure helpers/services/functions                                        | depends on nothing above it             |
| `api`         | the functionality a domain exposes to _other_ domains                  | the open/host-service seam              |
| `shell`       | a domain's entry point and routing, when one app hosts several domains | thin                                    |

**Smart vs dumb:** `feature` components hold state and talk to `data-access`/`domain`; `ui` components take `input()`s and emit `output()`s only. Domain logic must never live in a `ui` component.

## Layering – isolate the domain

Three layers, dependencies pointing inward:

1. **Application** – use-case facades and state management (`feature`).
2. **Domain model** – entities and business logic (`domain`), with **no** dependency on infrastructure or Angular.
3. **Infrastructure** – data access, HTTP, persistence (`data-access`).

"Isolate your domain": the domain layer is the deepest and most stable; nothing in it imports a `data-access` service, an HTTP client, or a framework type. Hexagonal and Clean Architecture are alternative spellings of the same rule. (In [language.md](language.md) terms, the domain layer is a **deep module** with infrastructure injected at a **seam**.)

## Access restrictions

Allowed dependency directions – enforce with `@nx/enforce-module-boundaries` in a monorepo, or with ESLint plus review in a plain app:

- By **type**: `feature` → `ui`, `domain`, `data-access`, `util`; `ui` / `domain` / `data-access` → `util`; **`util` depends on nothing above it**; nothing depends on `feature`.
- By **scope**: a domain may depend on `shared`, and on another domain **only through that domain's `api`** – never its `feature`, `domain`, or `data-access` internals.

A violated arrow is a finding. The most common: a `util` reaching up into `feature`; a `ui` component importing `data-access`; one domain importing another's internals instead of its `api`.

## Review checklist – domain lens

- Can you name the bounded contexts? Does the folder/lib structure reflect them?
- Is each `domain` layer free of infrastructure and Angular?
- Are `feature` (smart) and `ui` (dumb) components cleanly separated?
- Do cross-domain dependencies pass only through an `api`/`shell` seam?
- Is the ubiquitous language consistent within each context, and recorded in `CONTEXT.md`?
- Are the access-restriction rules actually enforced (tags / ESLint), or only hoped for?

## Advanced: micro frontends

Splitting domains into separately deployed apps (Module Federation, web components, iframes) is about **scaling teams and deployment**, not domain modelling – it sits on top of the structure above. Treat it as out of scope for a standard architecture review unless the user explicitly asks; when they do, the same bounded-context seams decide where an app may be split.
