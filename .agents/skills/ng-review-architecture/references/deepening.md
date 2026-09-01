# Deepening

How to deepen a cluster of shallow modules safely, given its dependencies. Assumes the vocabulary in [language.md](language.md) – **module**, **interface**, **seam**, **adapter**.

## Dependency categories

When assessing a candidate for deepening, classify its dependencies. The category determines how the deepened module can be verified across its seam. In this workspace, do not create or modify `.spec.ts` files unless `AGENTS.md` changes or the user explicitly asks for tests.

### 1. In-process

Pure computation, in-memory state, no I/O. Always deepenable – merge the modules and verify through the new interface directly. No adapter needed.

### 2. Local-substitutable

Dependencies that have local stand-ins (PGLite for Postgres, in-memory filesystem). Deepenable if the stand-in exists. The deepened module can be verified with the stand-in when the project has an approved test surface. The seam is internal; no port at the module's external interface.

### 3. Remote but owned (Ports & Adapters)

Your own services across a network boundary (microservices, internal APIs). Define a **port** (interface) at the seam. The deep module owns the logic; the transport is injected as an **adapter**. Verification can use an in-memory adapter when tests are in scope. Production uses an HTTP/gRPC/queue adapter.

Recommendation shape: _"Define a port at the seam, implement an HTTP adapter for production and an in-memory adapter for approved verification, so the logic sits in one deep module even though it's deployed across a network."_

### 4. True external (Mock)

Third-party services (Stripe, Twilio, etc.) you don't control. The deepened module takes the external dependency as an injected port; approved verification can provide a mock adapter.

## Seam discipline

- **One adapter means a hypothetical seam. Two adapters means a real one.** Don't introduce a port unless at least two adapters are justified (typically production + test). A single-adapter seam is just indirection.
- **Internal seams vs external seams.** A deep module can have internal seams private to its implementation as well as the external seam at its interface. Don't expose internal seams through the interface just for verification.

## Verification strategy: replace, don't layer

- Old checks on shallow modules become waste once an approved check at the deepened module's interface exists.
- Verify observable outcomes through the interface, not internal state.
- Checks should survive internal refactors – they describe behaviour, not implementation. If a check has to change when the implementation changes, it's checking past the interface.
