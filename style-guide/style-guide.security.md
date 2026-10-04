# Security Style Guide

Last updated on 2026-07-29.

This document contains security guidelines for _Angular_ apps. Security is **defense in depth**: Angular ships strong defaults (auto-sanitization, AOT, XSRF protection) – don't undermine them, and add the layers Angular can't provide (CSP, Trusted Types, server-side authorization, patched dependencies).

## Do

### Must do

- treat every value from users, APIs, and URLs as untrusted
- keep dependencies patched: run `pnpm audit` regularly and apply security fixes promptly (see [NPM Packages](style-guide.npm.md))
- render untrusted content with interpolation (`{{ }}`) – Angular always escapes it to inert text
- use `[innerHTML]` only when rendered HTML is genuinely required – Angular sanitizes it and silently strips unsafe parts
- enforce authorization on the server – route guards and hidden UI are UX, not access control
- serve a strict Content Security Policy – hash-based via the builder's `security.autoCsp` option or nonce-based via `ngCspNonce` / the `CSP_NONCE` token; never allow `unsafe-eval`

### Should do

- enable Trusted Types with Angular's policies: `trusted-types angular angular#bundler; require-trusted-types-for 'script'` (start report-only if third-party libs need vetting first)
  - add `angular#unsafe-bypass` to the allowlist only where `bypassSecurityTrust*` is genuinely needed
- sanitize explicitly when direct DOM access is unavoidable: `inject(DomSanitizer).sanitize(SecurityContext.HTML, value)` – only the HTML context sanitizes plain strings (other contexts validate or throw), and the result is `string | null`
- resource URLs (`<iframe [src]>`, `<script src>`, `<object data>`) are never sanitized – build them from an allowlist and wrap with `bypassSecurityTrustResourceUrl` as close to the input as possible
- keep `HttpClient` XSRF protection enabled and verify the `X-XSRF-TOKEN` header on the backend – it covers only mutating requests to relative URLs, and the backend must set the `XSRF-TOKEN` cookie
- prefer `HttpOnly` + `Secure` + `SameSite` cookies managed by the backend for sessions; if a token must be script-reachable, keep it short-lived and in memory
- for SSR: list explicit hostnames in the builder's `security.allowedHosts` and avoid mutable module-level state that survives across requests
- grep for audit points during reviews: `bypassSecurityTrust`, `innerHTML`, `nativeElement`, `document.`, `eval`

## Don't

- don't use `bypassSecurityTrust*` on user-supplied values; every call is an audit point
- don't set `.innerHTML` or use DOM APIs / third-party DOM libs directly with untrusted values – there is no auto-sanitization outside templates
- don't concatenate user input into templates, client- or server-side
- don't store long-lived secrets in `localStorage` / `sessionStorage` – any XSS can read them
- don't rely on client-side checks (guards, hidden buttons, disabled fields) for access decisions

## Resources

- [Angular security guide](https://angular.dev/best-practices/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)
- [web.dev: Trusted Types](https://web.dev/articles/trusted-types)

## Back to index

- [Angular Coding Style Guide](style-guide.md)
