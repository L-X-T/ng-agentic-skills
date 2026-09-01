# Clean code & structure

The guardrails that make a component readable for humans **and** for AI agents. Bad code is not
only expensive for people – it is harder for an AI agent to grasp, which produces more
misunderstandings and hallucinations. Good names, small functions, and clear types are the cure.

These are the standards Step 5 (Type) and Step 6 (Refactor) aim at, and the bar Step 7 (Review)
checks against. Most are enforced by the project's ESLint config – let the linter be your
checklist, but note that some rules are warn-level rather than blocking:
`@typescript-eslint/no-explicit-any` in particular is a **warning** in `eslint.config.js`, so lint
stays green with `any` present – treat remaining `any` as a manual check.

## Clean code principles

### Naming

- Every **field** and **function** should explain itself by its name and have a clear role in the
  component's reading flow.
- Symbol names carry meaning; types make contracts explicit; small units bound the scope/context.
- Boolean names start with `is` / `has` / `show`; event handlers start with `on`; observables end
  with `$`.

### KISS & DRY

- **KISS** – readability over cleverness. If code needs a comment to be understood, prefer
  rewriting it so the comment isn't necessary. (Keep comments that explain _why_, not _what_.)
- **DRY** – lift shared logic into services, directives, pipes, utils, or sub-components.

### Single Responsibility & the Rule of One

- **Single Responsibility** – each building block has one clear job.
- **Rule of One** – each "thing" gets its own file (one component / service / type per file;
  `max-classes-per-file: 1`).
- Prefer `private`, `readonly`, and `const`.
- **Max ~400 LoC per file** (`max-lines: 400`). Crossing it is the signal to split.
- `complexity` limits TS branching (≤ 20; the ≤ 10 figure is the template
  `@angular-eslint/template/cyclomatic-complexity` rule). `sort-imports` and `prefer-const` keep the
  surface tidy.
- Keep components and directives focused on **presentation**; push real logic out.

## Structure over chance

A component should read **top-to-bottom**. Group Angular-specific properties instead of scattering
them; order dependencies, inputs, outputs, signals, and methods predictably; keep related things
near each other.

### Canonical member ordering

```
@Component({ … })            // 1. decorator
export class FooComponent     // 2. class (extends & implements)
  extends Bar
  implements Baz {

  // 3. members
  //    a. injects – private readonly svc = inject(Svc);
  //    b. input – value = input.required<string>();
  //    c. model – checked = model(false);
  //    d. output – readonly saved = output<Foo>();
  //    e. queries – ref = viewChild<ElementRef>('ref');
  //    f. signals – protected readonly count = signal(0);
  //                        protected readonly total = computed(() => …);
  //    g. other members

  // 4. methods
  //    a. static
  //    b. constructor – keep it simple: only call methods / one-liners
  //    c. other methods
}
```

Use `protected` for members only used by the template (Angular v20+ style guide); `readonly` for
properties that shouldn't change; one concept per file with `inject()`.

## Functions: smaller & sharper

Large event handlers tend to mix **validation, mapping, state update, and UI side effects**. A
good refactoring separates these into small, named functions with a clear intent – names like
`buildRequest`, `validateInput`, or `updateSelection` make the code almost self-documenting. AI is
particularly strong here: let it **describe the flow first, then slice** it into pieces.

## Types as a safety net

- Strict typing – avoid `any`. Every return type and every parameter type. "Everything has a type."
- The first lever in legacy code is often replacing fuzzy types with explicit ones (or types).
- Prefer `unknown` over `any`, and `type` over `interface`.
- Even small type extractions reduce mental load; put non-trivial types in their own file.
- A component gets more readable through precisely named and typed inputs and outputs.

## Before / after – naming & typing

The single highest-leverage change: name things, type things, and stop the function from doing
several jobs at once.

```ts
// ❌ before – fuzzy names, `any`, mixed concerns
items: any[] = [];
sel: any;

save(data: any) {
  const x = this.items.find((i) => i.id === data.id);
  if (x) {
    this.sel = x;
  }
}
```

```ts
// ✅ after – explicit type (in its own file), precise names, one job
// order-item.ts
export type OrderItem = {
  id: string;
  label: string;
};

// component
protected readonly items: OrderItem[] = [];
protected selectedItem: OrderItem | null = null;

protected selectItem(item: OrderItem): void {
  const selectedItem = this.items.find((currentItem) => currentItem.id === item.id);

  if (!selectedItem) {
    return;
  }

  this.selectedItem = selectedItem;
}
```

What changed and **why** (every edit must earn its keep):

- `any[]` / `any` → `OrderItem[]` / `OrderItem | null` – the compiler now guards every use.
- `OrderItem` extracted to its own file – reusable, and the contract is explicit (Rule of One).
- `x` / `sel` / `save` / `data` → `selectedItem` / `selectItem` / `item` – names carry meaning.
- Early-return guard replaces the nested `if` – flatter, more readable control flow.
