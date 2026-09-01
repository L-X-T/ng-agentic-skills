# Build a Form

Setup, reading/updating the model, displaying errors, styling, and resetting. For the API surface,
see [../../angular-developer/references/signal-forms.md](../../angular-developer/references/signal-forms.md).

## Basic setup

A form is a signal model plus a schema. Bind fields with `[formField]`.

```typescript
import { Component, signal } from '@angular/core';
import { form, FormField, required, email } from '@angular/forms/signals';

interface LoginData {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  imports: [FormField],
  template: `
    <form (submit)="onSubmit($event)">
      <label>
        Email
        <input type="email" [formField]="loginForm.email" />
      </label>
      @if (loginForm.email().touched() && loginForm.email().invalid()) {
        <p class="error">{{ loginForm.email().errors()[0].message }}</p>
      }

      <label>
        Password
        <input type="password" [formField]="loginForm.password" />
      </label>
      @if (loginForm.password().touched() && loginForm.password().invalid()) {
        <p class="error">{{ loginForm.password().errors()[0].message }}</p>
      }

      <button type="submit" [disabled]="loginForm().invalid()">Login</button>
    </form>
  `,
})
export class Login {
  // Form model – a writable signal, the single source of truth.
  protected readonly loginModel = signal<LoginData>({
    email: '',
    password: '',
  });

  // Form with validation schema.
  protected readonly loginForm = form(this.loginModel, (path) => {
    required(path.email, { message: 'Email is required' });
    email(path.email, { message: 'Enter a valid email address' });
    required(path.password, { message: 'Password is required' });
  });

  onSubmit(event: Event) {
    event.preventDefault();
    // Prefer submit() over a hand-rolled valid() check – see references/dynamic-forms.md.
  }
}
```

Prefer non-null initial values (`''`, `0`, `[]`); use `null` only when the domain genuinely needs
a nullable field.

## Form models

The model is a writable signal; the form structure is derived from it. Access nested fields via dot
notation on the field tree.

```typescript
interface UserProfile {
  name: string;
  email: string;
  age: number | null;
  preferences: {
    newsletter: boolean;
    theme: 'light' | 'dark';
  };
}

const userModel = signal<UserProfile>({
  name: '',
  email: '',
  age: null,
  preferences: { newsletter: false, theme: 'light' },
});

const userForm = form(userModel);

userForm.name; // FieldTree<string>
userForm.preferences.theme; // FieldTree<'light' | 'dark'>
```

### Reading values

```typescript
// Whole model.
const data = this.userModel();

// A field value – call the field, then read its value signal.
const name = this.userForm.name().value();
const theme = this.userForm.preferences.theme().value();
```

### Updating values

The model is the source of truth – never `.set()` the field tree.

```typescript
// Replace the whole model.
this.userModel.set({
  name: 'Alice',
  email: 'alice@example.com',
  age: 30,
  preferences: { newsletter: true, theme: 'dark' },
});

// Update a single field's value signal.
this.userForm.name().value.set('Bob');
this.userForm.age().value.update((age) => (age ?? 0) + 1);
```

## Displaying errors

```html
<input [formField]="form.email" />

@if (form.email().touched() && form.email().invalid()) {
<ul class="errors">
  @for (error of form.email().errors(); track error) {
  <li>{{ error.message }}</li>
  }
</ul>
} @if (form.email().pending()) {
<span>Validating…</span>
}
```

## Styling based on state

Bind state signals to native `[class.x]` bindings (no `[ngClass]`).

```html
<input
  [formField]="form.email"
  [class.is-invalid]="form.email().touched() && form.email().invalid()"
  [class.is-valid]="form.email().touched() && form.email().valid()"
/>
```

## Reset

`reset()` clears interaction state (touched/dirty); set the model to clear values.

```typescript
async onReset() {
  // Clear interaction state.
  this.form().reset();

  // Clear values.
  this.model.set({ email: '', password: '' });
}
```
