# Conditional Fields, Submission & Arrays

Field-state rules, the canonical submit flow, and dynamic arrays. For nested `@for` caveats and the
full pitfalls table, see
[../../angular-developer/references/signal-forms.md](../../angular-developer/references/signal-forms.md).

## Conditional fields

Field state (`hidden`, `disabled`, `readonly`) is declared in the schema, not in the template. Never
set `[disabled]`/`[readonly]` on an input bound with `[formField]` – the directive drives them.

### Hidden

```typescript
import { hidden } from '@angular/forms/signals';

const profileForm = form(this.profileModel, (path) => {
  hidden(path.publicUrl, { when: ({ valueOf }) => !valueOf(path.isPublic) });
});
```

```html
@if (!profileForm.publicUrl().hidden()) {
<input [formField]="profileForm.publicUrl" />
}
```

### Disabled

```typescript
import { disabled } from '@angular/forms/signals';

const orderForm = form(this.orderModel, (path) => {
  disabled(path.couponCode, { when: ({ valueOf }) => valueOf(path.total) < 50 });
});
```

### Readonly

```typescript
import { readonly } from '@angular/forms/signals';

const accountForm = form(this.accountModel, (path) => {
  readonly(path.username); // always readonly
});
```

## Form submission

Standardize on `submit()`: it marks all fields touched and runs the callback only if the form is
valid. The callback **must be `async`** and return a Promise.

```typescript
import { Component, inject, signal } from '@angular/core';
import { form, FormField, required, submit } from '@angular/forms/signals';

@Component({
  selector: 'app-login',
  imports: [FormField],
  template: `
    <form (submit)="onSubmit($event)">
      <input [formField]="loginForm.email" />
      <input [formField]="loginForm.password" />
      <button type="submit" [disabled]="loginForm().invalid()">Submit</button>
    </form>
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  protected readonly model = signal({ email: '', password: '' });
  protected readonly loginForm = form(this.model, (path) => {
    required(path.email);
    required(path.password);
  });

  onSubmit(event: Event) {
    event.preventDefault();
    submit(this.loginForm, async () => {
      await this.auth.login(this.model());
    });
  }
}
```

> Anti-pattern: don't hand-roll `if (this.loginForm().valid()) { … }` in place of `submit()`. It
> skips marking fields touched (so errors stay hidden) and the async lifecycle `submit()` manages.

## Arrays and dynamic fields

Use `applyEach` to apply rules per item; its callback takes exactly **one** argument (the item path).
Add and remove items by updating the model – never mutate the field tree.

```typescript
import { Component, signal } from '@angular/core';
import { form, FormField, applyEach, required, min } from '@angular/forms/signals';

interface Order {
  items: Array<{ product: string; quantity: number }>;
}

@Component({
  selector: 'app-order',
  imports: [FormField],
  template: `
    @for (item of orderForm.items; track $index; let i = $index) {
      <div>
        <input [formField]="item.product" placeholder="Product" />
        <input [formField]="item.quantity" type="number" />
        <button type="button" (click)="removeItem(i)">Remove</button>
      </div>
    }
    <button type="button" (click)="addItem()">Add Item</button>
  `,
})
export class Order {
  protected readonly orderModel = signal<Order>({
    items: [{ product: '', quantity: 1 }],
  });

  protected readonly orderForm = form(this.orderModel, (path) => {
    applyEach(path.items, (item) => {
      required(item.product, { message: 'Product required' });
      min(item.quantity, 1, { message: 'Min quantity is 1' });
    });
  });

  addItem() {
    this.orderModel.update((m) => ({
      ...m,
      items: [...m.items, { product: '', quantity: 1 }],
    }));
  }

  removeItem(index: number) {
    this.orderModel.update((m) => ({
      ...m,
      items: m.items.filter((_, i) => i !== index),
    }));
  }
}
```
