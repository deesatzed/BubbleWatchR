# DECISIONS.md — Decision Covenant Foundation

## 2026-08-24 — Foundation stack

Selected Node 24, strict TypeScript, built-in `node:sqlite`, and built-in
`node:http`. This avoids native database compilation and keeps the local-first
runtime small. The blueprint allows a server-rendered TypeScript application
and SQLite, so this choice stays within the approved boundary.

## 2026-08-24 — First slice boundary

The first implementation stops at covenant lifecycle, persistence, audit, and
export. Portfolio calculations, triggers, simulations, market feeds,
notifications, and research evidence are successor work.

## 2026-08-24 — Immutability model

An approved covenant row is never updated. A successor is a new draft with a
`supersedesId` reference; the prior approved row remains byte-for-byte stable.
The relationship is recorded as an audit event.

## 2026-08-24 — Product naming

“Decision Covenant” is the working product name. “BubblerEyes” is retained as
the repository codename until a separate naming decision is made.
