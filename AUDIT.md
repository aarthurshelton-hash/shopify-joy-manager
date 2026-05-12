# En Pensent — Audit & Verification Package

**This document is the entry point for any reviewer, auditor, or peer-review collaborator who has been invited to evaluate the En Pensent chess prediction system.**

If you are visiting this repository to verify the empirical claims made by the En Pensent project, this document tells you exactly how to do that — independently, with no private credentials, in under five minutes.

---

## What En Pensent Claims

A path-based representation of chess games — encoding *where pieces have been*, weighted by piece identity, color, and move number — produces a 3-way (white/black/draw) outcome prediction that **outperforms Stockfish 18 on outcome classification across a live, multi-million-prediction corpus**.

Headline numbers we publish:

- **+5.43 percentage points** edge over Stockfish 18 on overall 3-way prediction accuracy across our full corpus
- **+19.13 percentage points** edge over Stockfish 18 on a 1.77M-game Chess960 / Freestyle subset (where Stockfish lacks an opening book)
- **+25-29 percentage points** edge in the 0-25cp eval zone (where Stockfish search is weakest)

The full breakdown is in [`RESULTS.md`](./RESULTS.md). The methodology is in [`METHODOLOGY.md`](./METHODOLOGY.md).

---

## How to Verify in Five Minutes

Every published claim is verifiable from this repository using only the **public anon key** that is already embedded in the en-pensent.com frontend bundle. No private credentials are required, requested, or used.

```bash
# 1. Clone the repository
git clone https://github.com/aarthurshelton-hash/shopify-joy-manager.git
cd shopify-joy-manager

# 2. Install dependencies
npm install

# 3. Run the verification script
node audit/verify.mjs
```

You will see output like:

```
  HEADLINE RESULT — En Pensent vs Stockfish 18
  ----------------------------------------------------------------
  Total predictions:          12,240,000
  En Pensent correct:          8,475,000
  Stockfish 18 correct:        7,809,000

  En Pensent accuracy:        69.24%
  Stockfish 18 accuracy:      63.81%
  En Pensent edge over SF18:  +5.43 percentage points
```

The numbers come from a public read-only Supabase view (`predictions_public`) that:

- Excludes the most recent 7 days of data (cannot be retroactively manipulated against the script)
- Contains no PII (no usernames, emails, IPs, or game URLs)
- Is exposed only via a `SELECT`-only `GRANT`
- Cannot be modified by any party

The view definition is in [`audit/setup-public-view.sql`](./audit/setup-public-view.sql) — fully visible to any reviewer.

---

## What the Repository Contains

| Path | Purpose |
|---|---|
| `src/lib/chess/colorFlowAnalysis/` | Core En Pensent prediction algorithms — color flow signature, archetype classification, equilibrium predictor, signal calibration |
| `src/lib/chess/gameSimulator.ts` | Geometrically accurate piece-path tracing |
| `src/pages/GameExplorer.tsx` | Live public dashboard at `/explore` showing EP vs SF18 head-to-head on real games |
| `src/pages/AcademicPaper.tsx` | The full academic write-up of the En Pensent system across multiple domains |
| `src/pages/EnPensentWhitepaper.tsx` | Public whitepaper |
| `audit/` | This audit package — verification SQL and script |
| `RESULTS.md` | Canonical numbers (single source of truth) |
| `METHODOLOGY.md` | Sampling design, calibration loop, validation approach |

The `farm/` directory contains production-ingest workers and is intentionally not tracked in this repository (per `.gitignore`). Reviewers who need worker-level visibility should request a separate read-only audit window.

---

## What This Repository Does NOT Contain

For clarity:

- **No private credentials** — no service-role keys, database passwords, or API secrets are tracked. The local `.env` file required for development is gitignored.
- **No user PII** — no usernames, emails, addresses, payment data, or identifying tokens.
- **No write access to production data** — even the verification view is `SELECT`-only.

If a reviewer encounters anything that looks like a credential during review, please notify the maintainer immediately at `a.arthur.shelton@gmail.com` so it can be addressed.

---

## What We're Asking Reviewers To Do

If you are doing a substantive technical review:

1. **Verify the headline numbers** — run `node audit/verify.mjs` and compare against [`RESULTS.md`](./RESULTS.md).
2. **Read the methodology** — [`METHODOLOGY.md`](./METHODOLOGY.md) describes sampling, calibration, and the self-learning loop. Push back hard on anything that looks like selection bias or test-on-train.
3. **Inspect the algorithm** — start in `src/lib/chess/colorFlowAnalysis/predictionEngine.ts` and trace into `equilibriumPredictor.ts`. The 15-component fusion is documented inline.
4. **Stratify the data** — query `predictions_public` directly to slice by ELO band, time control, eval zone, archetype. Tell us where the edge breaks down.
5. **Propose ablations** — if you believe a 5-layer transformer trained on PGN sequences would close most of the +5.43pp, we are genuinely interested in running that comparison and would welcome collaboration.

If you are doing a security or compliance review:

1. **Confirm no credentials are tracked** — `git ls-files | grep -iE '\.env|secret|key|password|token'` should return only `.env.example`.
2. **Confirm RLS is enforced** — the public view exposes only what is intended; the underlying tables remain private.
3. **Inspect the access pattern** — the public anon key respects all row-level security; the verification script cannot escalate.

---

## Contact

- **Maintainer:** Alec Arthur Shelton (`a.arthur.shelton@gmail.com`)
- **Public site:** [enpensent.com](https://enpensent.com)
- **Live stats dashboard:** [enpensent.com/explore](https://enpensent.com/explore)
- **Repository:** [github.com/aarthurshelton-hash/shopify-joy-manager](https://github.com/aarthurshelton-hash/shopify-joy-manager)

---

## A Note on Open Verification

The choice to expose a public verification path — instead of asking reviewers to trust private numbers — is deliberate. It makes the published claims falsifiable. If our numbers are wrong, anyone in the world can prove it in under five minutes. We believe that posture is the correct one for empirical research, and we are committed to maintaining it.

Reviewers who find discrepancies, methodological weaknesses, or improvements are explicitly invited to share them. We will respond publicly.
