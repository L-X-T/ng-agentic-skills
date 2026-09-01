# Field & Form State

Every field is a function: **call it** to reach its state signals. `form.field().valid()` works;
`form.field.valid()` does not. For the full state contract, see
[../../angular-developer/references/signal-forms.md](../../angular-developer/references/signal-forms.md).

## Field state

```typescript
const emailField = this.form.email();

// Validation state.
emailField.valid(); // passes all validation
emailField.invalid(); // has validation errors
emailField.errors(); // array of ValidationError objects
emailField.pending(); // async validation in progress

// Interaction state.
emailField.touched(); // focused then blurred
emailField.dirty(); // modified by the user

// Availability state.
emailField.disabled();
emailField.hidden();
emailField.readonly();

// Value.
emailField.value(); // current value (writable signal)
```

## Form-level state

The form root is itself a field with aggregated state – call it too.

```typescript
this.form().valid(); // all interactive fields valid
this.form().touched(); // any field touched
this.form().dirty(); // any field modified
this.form().pending(); // any async validation running
```

## The one exception: array length

Array length is read on the structural field tree, without calling it.

```typescript
this.form.items.length; // structural – no parentheses
this.form.items().length; // WRONG
```
