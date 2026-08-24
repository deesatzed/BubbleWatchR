# STANDARDS.md — Decision Covenant Foundation

These are the non-negotiable standards for the active foundation goal.

## Product boundary

- The application records user-authored policy and deterministic state.
- A review condition is never an instruction to buy, sell, or rebalance.
- No broker credentials, order endpoint, external model call, or telemetry is
  permitted in the local foundation.

## Data and audit

- Approved covenant versions are immutable through application write paths.
- Every material lifecycle action creates a durable audit event.
- Audit events retain entity identity, version, timestamp, payload, and a
  chained SHA-256 payload hash.
- Exports include the source covenant version and its audit events.
- User data is stored locally in SQLite and is never transmitted by default.

## Engineering

- Domain, persistence, audit, export, and UI concerns remain separable.
- Runtime validation happens before persistence.
- Tests must cover invalid input, immutable approval, supersession, replay, and
  export contents.
- New functionality requires a test and a progress entry.

## Language and accessibility

- Use calm, plain language.
- Never use “recommended trade,” “crash imminent,” or equivalent claims.
- Forms have labels, visible status text, keyboard-accessible controls, and
  useful error messages.
