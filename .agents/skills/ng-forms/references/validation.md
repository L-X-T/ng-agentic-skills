# Validation

Validation lives in the schema function passed to `form()`. A validator returns a `ValidationError`
(`{ kind, message? }`) or `null`/`undefined` for valid. Read other fields through context helpers
(`valueOf`, `stateOf`) – schema paths are not signals and must not be called. For the async/resource
contract and the full pitfalls table, see
[../../angular-developer/references/signal-forms.md](../../angular-developer/references/signal-forms.md).

## Built-in validators

```typescript
import { form, required, email, min, max, minLength, maxLength, pattern } from '@angular/forms/signals';

const userForm = form(this.userModel, (path) => {
  required(path.name, { message: 'Name is required' });
  email(path.email, { message: 'Invalid email' });

  min(path.age, 18, { message: 'Must be 18+' });
  max(path.age, 120, { message: 'Invalid age' });

  minLength(path.password, 8, { message: 'Min 8 characters' });
  maxLength(path.bio, 500, { message: 'Max 500 characters' });

  pattern(path.phone, /^\d{3}-\d{3}-\d{4}$/, { message: 'Format: 555-123-4567' });
});
```

In v22, every built-in validator config also accepts `{ when }` (see Conditional validation).

## Debouncing updates

`debounce` controls how often UI input propagates to the model (and re-runs validators) – useful
before async validation.

```typescript
import { debounce } from '@angular/forms/signals';

const loginForm = form(this.loginModel, (path) => {
  debounce(path.email, 500); // ms; also accepts 'blur' or a custom debouncer
  required(path.email);
  email(path.email);
});
```

## Conditional validation

Read the gating field with `valueOf`.

```typescript
const orderForm = form(this.orderModel, (path) => {
  required(path.promoCode, {
    message: 'Promo code required for discounts',
    when: ({ valueOf }) => valueOf(path.applyDiscount),
  });
});
```

Use `applyWhen(path, condition, schemaFn)` to gate a whole group of rules on one condition.

## Custom validators

```typescript
import { validate } from '@angular/forms/signals';

const signupForm = form(this.signupModel, (path) => {
  validate(path.username, ({ value }) => {
    if (value().includes(' ')) {
      return { kind: 'noSpaces', message: 'Username cannot contain spaces' };
    }
    return null;
  });
});
```

## Cross-field validation

Compare fields with `valueOf`.

```typescript
const passwordForm = form(this.passwordModel, (path) => {
  required(path.password);
  required(path.confirmPassword);

  validate(path.confirmPassword, ({ value, valueOf }) => {
    if (value() !== valueOf(path.password)) {
      return { kind: 'mismatch', message: 'Passwords do not match' };
    }
    return null;
  });
});
```

## Async validation

For an HTTP check, use `validateHttp`. `onError` is **required**.

```typescript
import { validateHttp } from '@angular/forms/signals';

const signupForm = form(this.signupModel, (path) => {
  validateHttp(path.username, {
    request: ({ value }) => `/api/check-username?u=${value()}`,
    onSuccess: (response: { taken: boolean }) =>
      response.taken ? { kind: 'taken', message: 'Username already taken' } : null,
    onError: () => ({ kind: 'networkError', message: 'Could not verify username' }),
  });
});
```

For a `resource()`-backed check, use `validateAsync` – its `params`/`factory`/`onError` contract is
documented in the [canonical reference](../../angular-developer/references/signal-forms.md#async-validation).
