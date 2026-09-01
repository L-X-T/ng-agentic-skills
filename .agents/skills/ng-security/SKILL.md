---
name: ng-security
description: Harden Angular applications against common web vulnerabilities. Use when reviewing or improving app security, preventing XSS, configuring Content Security Policy (CSP) or Trusted Types, working with sanitization / DomSanitizer / bypassSecurityTrust, securing HttpClient (XSRF/CSRF, XSSI), auth and token storage, SSR/SSRF (allowedHosts), or keeping dependencies patched.
license: MIT
metadata:
  author: Alexander Thalhammer
  version: '1.0'
---

# Angular Security

Security is **defense in depth**. Angular ships strong defaults (auto-sanitization, AOT, XSRF, SSRF header validation) – your job is to **not undermine them** and to add the layers Angular can't provide (CSP, Trusted Types, server-side authorization, patched dependencies). The browser is hostile territory: every value is untrusted, and any access decision that matters must be re-confirmed on the server.

## Quick checklist

- [ ] **Patch dependencies** frequently – Angular and all npm packages, at least twice a year.
- [ ] **Never concatenate user input into templates** (client or server). Keep AOT; no runtime/JIT template generation.
- [ ] **Bind through templates** (`{{ }}`, property bindings). Avoid raw DOM (`innerHTML`, `ElementRef.nativeElement`, `document`, jQuery-style libs).
- [ ] **`bypassSecurityTrust*` is a last resort** – prefer allowlisting; treat every call as an audit point.
- [ ] **Set up a strict CSP** (nonce-based); fall back to `autoCsp` if you can't.
- [ ] **Enable Trusted Types**.
- [ ] **Enforce authorization server-side** – route guards and hidden UI are UX, not security.
- [ ] **Configure SSR `allowedHosts`**; never trust `X-Forwarded-*` blindly.

## 1. Trust Angular's sanitization – don't undermine it

Angular treats all values as untrusted and auto-escapes/sanitizes anything inserted into the DOM via templates. Interpolation always escapes; `[innerHTML]` strips dangerous elements (e.g. `<script>`) before rendering.

Four **security contexts**, each sanitized differently:

| Context          | Example binding                | Notes                                  |
| ---------------- | ------------------------------ | -------------------------------------- |
| HTML             | `[innerHTML]`                  | sanitized                              |
| Style            | `[style]`                      | sanitized                              |
| URL              | `[href]`, `[src]`              | sanitized                              |
| **Resource URL** | `<script src>`, `<iframe src>` | **cannot** be sanitized – it _is_ code |

Rules:

- **Never build templates from user input** – concatenating user data with template syntax is code injection. This applies to server-side templating too: use auto-escaping server templates and pass data, never assemble Angular templates as strings.
- Keep **AOT** (the CLI default) in production; dynamic JIT template generation with user data bypasses Angular's protections.
- **Avoid direct DOM manipulation.** Browser DOM APIs, `ElementRef.nativeElement`, and third-party libraries have no auto-sanitization. When unavoidable, sanitize explicitly:

```typescript
private sanitizer = inject(DomSanitizer);
const safe = this.sanitizer.sanitize(SecurityContext.HTML, untrustedHtml);
```

## 2. `bypassSecurityTrust*` is a last resort

The five methods – `bypassSecurityTrustHtml`, `…Script`, `…Style`, `…Url`, `…ResourceUrl` – disable sanitization for one context. They are marked security-sensitive: **every call is an audit point.**

- **Prefer explicit allowlisting** over a blanket bypass: validate the protocol (`https:` only), restrict iframe/image sources to known domains, reject everything else.
- If you must bypass, construct the trusted value **as close to the input as possible** so audits are easy.

```typescript
// Trusted resource URL for a known-safe embed
updateVideoUrl(id: string) {
  const url = `https://www.youtube.com/embed/${encodeURIComponent(id)}`;
  this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
}
```

## 3. Content Security Policy (CSP)

A properly configured CSP blocks the effect of XSS **even when a bug already exists** – the most important defense-in-depth layer. Angular generates scripts/styles at runtime, so use a per-request **nonce** instead of `unsafe-inline`.

Recommended minimal policy (served as a response header):

```
default-src 'self';
script-src 'self' 'nonce-<dynamic>';
style-src 'self' 'nonce-<dynamic>';
img-src 'self' https:;
connect-src 'self' https://api.yourdomain.com;
object-src 'none';
base-uri 'self';
frame-ancestors 'none';
require-trusted-types-for 'script';
```

Wire the nonce into Angular one of three ways:

- `"autoCsp": true` in `angular.json` (also the **fallback** when you can't manage nonces yourself),
- `<app ngCspNonce="…">` attribute, or
- the `CSP_NONCE` injection token (not compatible with critical-CSS inlining – use `autoCsp`/`ngCspNonce` instead):

```typescript
bootstrapApplication(App, {
  providers: [{ provide: CSP_NONCE, useValue: globalThis.myRandomNonce }],
});
```

Rules: nonces must be **unique and unpredictable per request** (a CDN that caches the response freezes the nonce – generate it at the edge). **Never** use `unsafe-inline` or `unsafe-eval`.

## 4. Trusted Types

A browser feature that rejects unsafe strings flowing into `innerHTML`, `eval`, etc. – it holds **even if sanitization is bypassed in code**, and simplifies auditing. Enable it via response header:

```
Content-Security-Policy: trusted-types angular angular#bundler; require-trusted-types-for 'script';
```

Add policies as needed: `angular#unsafe-bypass` (for `bypassSecurityTrust*`), `angular#unsafe-jit` (JIT), `angular#unsafe-upgrade` (AngularJS hybrid). Set the header in production serving, in `ng serve` via `headers` in `angular.json`, and in your unit-test runner's server headers (e.g. `customHeaders` in `karma.config.js` for Karma setups). Unsupported browsers fall back to `DomSanitizer`.

## 5. Keep dependencies patched

Failing to update is not neutral – it's growing exposure to known CVEs.

- **Update Angular and all npm packages frequently – at least twice a year.** Angular only supports a limited number of older versions.
- Run `pnpm audit`; enable **Dependabot** / Snyk / OWASP Dependency-Check; watch GitHub Security Advisories and apply security fixes immediately.
- **Don't fork or customize Angular** – you'll miss security patches; contribute upstream instead. Avoid any API documented as a "Security Risk".
- Stay alert to supply-chain attacks (malicious package versions / compromised maintainer credentials).
- Report Angular vulnerabilities via Google's [OSS VRP](https://bughunters.google.com).

## 6. Authentication & authorization

The frontend is an insecure storage location; **every access decision must be confirmed server-side – otherwise it's only the illusion of security.**

- Route guards and hidden UI elements improve UX but are **not** access control. Enforce authorization on the API for every request.
- **Token storage trade-offs:** `localStorage`/`sessionStorage` is readable by any XSS; `HttpOnly` + `Secure` + `SameSite` cookies resist XSS but invite CSRF (mitigate with XSRF protection below). Store only short-lived tokens/session ids in the browser; keep long-lived secrets on the backend.

## 7. HttpClient: XSRF and XSSI

**XSRF/CSRF** – `HttpClient` reads a token from the `XSRF-TOKEN` cookie and sends it as the `X-XSRF-TOKEN` header on mutating, same-origin requests. The backend must set the cookie and verify the header. Customize or disable:

```typescript
provideHttpClient(
  withXsrfConfiguration({ cookieName: 'CUSTOM_XSRF_TOKEN', headerName: 'X-Custom-Xsrf' }),
  // or: withNoXsrfProtection()
);
```

**XSSI** – servers should prefix JSON responses with `)]}',\n` to make them non-executable; `HttpClient` strips this automatically before parsing.

## 8. Server-Side Rendering & SSRF

- **Configure allowed hosts** to block host-header injection / SSRF – never use the `*` wildcard unless another layer validates hosts:

```json
{ "options": { "security": { "allowedHosts": ["example.com", "*.example.com"] } } }
```

(Node: `NG_ALLOWED_HOSTS`.) Angular treats all `X-Forwarded-*` headers as untrusted by default; only enable `trustProxyHeaders` when behind a proxy that strictly validates/overrides them.

- **Isolate per-request state** – never share a global injector or mutable state across parallel SSR requests, or one user's tokens/content can leak into another's response.

## Reviewing an app

Grep for the audit points and verify each: `bypassSecurityTrust`, `innerHTML`, `ElementRef`, `nativeElement`, `document.`, `eval`, server-side template strings, and missing CSP/Trusted Types headers. Report each audit point as pass/fail with `file:line` evidence.
