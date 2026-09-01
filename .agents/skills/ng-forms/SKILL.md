---
name: ng-forms
description: Build signal-based forms in Angular v22+ using the Signal Forms API (public API since v22, imported from @angular/forms/signals). Use for form creation with automatic two-way binding, schema-based validation, field state management, and dynamic forms. Triggers on form implementation, adding validation, creating multi-step forms, or building forms with conditional fields. Don't use for template-driven forms without signals or third-party form libraries like Formly or ngx-formly.
license: MIT
metadata:
  author: Alexander Thalhammer
  version: '1.0'
---

# Angular Signal Forms

Build type-safe, reactive forms with Angular's Signal Forms API: a signal model is the single
source of truth, the form structure is derived from it, and a schema function declares validation
and field state. Signal Forms are public API in Angular v22 (imported from `@angular/forms/signals`).

For exhaustive API depth, read the angular-developer skill's canonical reference at
[../angular-developer/references/signal-forms.md](../angular-developer/references/signal-forms.md)
(vendored from Angular's official skill and corrected locally to the stable v22 API – see the local adaptations in `02-SKILLS.md` before re-syncing it). The references below are the project-shaped fast path.

## End-to-end example

```typescript
import { Component, inject, signal } from '@angular/core';
import { form, FormField, required, email, submit } from '@angular/forms/signals';

@Component({
  selector: 'app-login',
  imports: [FormField],
  template: `
    <form (submit)="onSubmit($event)">
      <input type="email" [formField]="loginForm.email" />
      @if (loginForm.email().touched() && loginForm.email().invalid()) {
        <p class="error">{{ loginForm.email().errors()[0].message }}</p>
      }
      <input type="password" [formField]="loginForm.password" />
      <button [disabled]="loginForm().invalid()">Login</button>
    </form>
  `,
})
export class Login {
  private readonly auth = inject(AuthService);

  // Model signal is the single source of truth.
  protected readonly loginModel = signal({ email: '', password: '' });

  protected readonly loginForm = form(this.loginModel, (path) => {
    required(path.email, { message: 'Email is required' });
    email(path.email, { message: 'Enter a valid email address' });
    required(path.password, { message: 'Password is required' });
  });

  onSubmit(event: Event) {
    event.preventDefault();
    // submit() marks all fields touched, then runs the async action only if valid.
    submit(this.loginForm, async () => {
      await this.auth.login(this.loginModel());
    });
  }
}
```

## Critical rules

| Rule                                                                                            | Correct                                                 |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **Call the field** to reach its state signals.                                                  | `form.field().valid()`, not `form.field.valid()`        |
| **The model is the source of truth** – never `.set()` the field tree; update the model signal.  | `this.model.update(...)`, not `form.field.set(...)`     |
| **Forbidden `[formField]` attributes** – these are handled by the directive or by schema rules. | Never set `value`/`min`/`max`/`[disabled]`/`[readonly]` |
| **`submit()` callback must be `async`** and return a Promise.                                   | `submit(form, async () => { ... })`                     |
| **Schema paths are not signals** – don't call them; read other fields via context helpers.      | `valueOf(path.x)` / `stateOf(path.x)`, not `path.x()`   |
| **Every component runs on the default `OnPush` + zoneless (v22+).**                             | Do not set `changeDetection`; never opt into `Eager`    |

## Which reference to load

| Task                                                                         | Reference                                                                                          |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Set up a form, read/update model values, display errors, style, reset        | [references/build-a-form.md](references/build-a-form.md)                                           |
| Read field-level or form-level state (valid, touched, dirty, pending…)       | [references/field-state.md](references/field-state.md)                                             |
| Add validation (built-in, debounce, conditional, custom, cross-field, async) | [references/validation.md](references/validation.md)                                               |
| Conditional fields, submission, arrays / dynamic fields                      | [references/dynamic-forms.md](references/dynamic-forms.md)                                         |
| Build a custom form control (`FormValueControl`)                             | [references/custom-controls.md](references/custom-controls.md)                                     |
| Maintain or migrate an existing Reactive Forms area                          | [references/reactive-forms.md](references/reactive-forms.md)                                       |
| Full API surface, common pitfalls, build-error recovery                      | [../angular-developer/references/signal-forms.md](../angular-developer/references/signal-forms.md) |

## Verify – zero errors before done

Run from the repo root and confirm no errors:

- `pnpm exec tsc --noEmit` (or `pnpm build`)
- `pnpm lint`

There is no nx here – do not run `nx lint`.
