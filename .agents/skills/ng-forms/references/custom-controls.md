# Custom Form Controls (`FormValueControl`)

A custom control implements `FormValueControl<T>`: expose the value as a `model<T>()` two-way
binding, plus optional `input()`s for state (`readonly`, `invalid`, `errors`, …). It then binds with
`[formField]` like any built-in control. For the interface details, see
[../../angular-developer/references/signal-forms.md](../../angular-developer/references/signal-forms.md).

In `rating.ts`, native buttons provide keyboard activation and an accessible name for each rating.

```typescript
import { Component, input, InputSignal, model, Signal, signal } from '@angular/core';
import { FormValueControl, ValidationError, WithOptionalFieldTree } from '@angular/forms/signals';

@Component({
  selector: 'app-rating',
  template: `
    <fieldset class="star-rating-container" [attr.aria-invalid]="invalid()">
      <legend>Rating</legend>
      @for (star of starArray(); track star) {
        <button
          class="star-icon"
          type="button"
          [attr.aria-label]="star + ' of 5 stars'"
          [attr.aria-pressed]="star === value()"
          [attr.aria-disabled]="readonly()"
          [class.readonly]="readonly()"
          [class.error]="invalid()"
          [class.filled]="star <= value()"
          [disabled]="disabled()"
          (click)="onRate(star)"
        >
          <span aria-hidden="true">{{ star <= value() ? '★' : '☆' }}</span>
        </button>
      }
      @if (errors().at(0)?.message) {
        <p>{{ errors().at(0)?.message }}</p>
      }
    </fieldset>
  `,
})
export class Rating implements FormValueControl<number> {
  // Required: the value, exposed as a two-way binding.
  readonly value = model<number>(0);

  // Optional: bindings for other form control states.
  readonly readonly = input<boolean>(false);
  readonly disabled = input(false);
  readonly invalid = input<boolean>(false);
  readonly errors: InputSignal<readonly WithOptionalFieldTree<ValidationError>[]> = input<
    readonly WithOptionalFieldTree<ValidationError>[]
  >([]);

  protected readonly starArray: Signal<number[]> = signal(
    Array(5)
      .fill(0)
      .map((_, i) => i + 1),
  );

  protected onRate(index: number): void {
    if (!this.readonly() && !this.disabled()) {
      this.value.set(index);
    }
  }
}
```

Bind it with `[formField]`, exactly like a native input:

```typescript
import { Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { Rating } from './rating';

@Component({
  selector: 'app-signal-forms',
  imports: [FormField, Rating],
  template: `
    <form autocomplete="off" (submit)="onSubmit($event)">
      <div class="form-field">
        <app-rating [formField]="ratingForm.rating" />
        <!-- Read the bound value back. -->
        {{ ratingForm.rating().value() }}
      </div>
    </form>
  `,
})
export class SignalForms {
  protected readonly ratingModel = signal({ rating: 0 });
  protected readonly ratingForm = form(this.ratingModel);

  onSubmit(event: Event): void {
    event.preventDefault();
    console.log(this.ratingForm.rating().value());
  }
}
```
