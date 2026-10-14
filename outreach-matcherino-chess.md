# Matcherino chess section — proposal and run-of-show

## One-line pitch
Fair-play-gated lichess tournaments on Matcherino, where every winner's game becomes a one-of-a-kind piece of art. Matcherino holds the prize pool; En Pensent supplies the event operations, the fair-play review and the art.

## What Matcherino gets
- A chess vertical that is not a clone of existing bracket events: a visible, shareable artifact per game.
- Hosted event pages, with entry rules that are enforced by the platform rather than promised in the rules text.
- Per-event reporting on registrations and downstream signups (via the `matcherino_key` attribution already built).
- Zero operational burden: En Pensent creates the lichess events, reviews results and mints winner rewards.

## What En Pensent gets
- Distribution to Matcherino's audience, and the first measurable acquisition channel.
- Reward-code redemptions, shop orders and memberships attributable to each event.

## Event format (start small)
| Event | Format | Time control | Entry conditions (server-enforced by lichess) |
|---|---|---|---|
| Weekly Open U1600 | Arena, 90 min | 5+2 | rating <= 1600, >= 50 rated games, account >= 30 days, team member |
| Monthly Championship | Swiss, 7 rounds | 10+5 | team member, >= 50 rated games, account >= 30 days |

Rationale: 5+2 and 10+5 give enough moves for the fair-play review to have signal. Pure bullet or 3+0 does not. Do not add more rating bands until the weekly fills.

## Fair-play policy (publish this on the event page)
1. Entry gate: account age, rated-game minimum, rating cap, team membership, all enforced by lichess at join time.
2. Platform detection: lichess's own fair-play system applies to every game.
3. Post-event review: En Pensent pulls winners' games with move clocks and checks accuracy and move-time patterns with Stockfish. Outliers are escalated, not auto-banned.
4. Payout window: prizes are released 24 to 48 hours after the event ends, pending review. This is stated in the rules up front.
5. Only lichess games count toward prizes. Chess.com games can be visualized but are not eligible.

## What we will and will not say about the technology
- Say: "A path-based game representation that is used for art and for outcome prediction. Audited against Stockfish 18 on resolved predictions: parity on standard chess overall." Do not cite Chess960 or balanced-position gains until the calibrated-baseline comparison is published on /vs-stockfish.
- Do not say: any lifetime-total figure, any "beats Stockfish overall" claim, or anything about market prediction.
- Source of truth: `/vs-stockfish` (refreshed every 6 hours). Quote numbers from that page only.

## Run of show (per event)
1. T-7d: create the event (`scripts/tournaments/lichess-tournament.mjs create-arena ...`), post the link on the Matcherino page.
2. T-0: event runs on lichess.
3. T+0: `... results <id> --games` pulls standings and clocked games.
4. T+24h to 48h: fair-play review complete, winners confirmed.
5. T+48h: mint and send reward codes (champion 40% + 365 days premium; supporter 20% + 31 days). Winner's game rendered as the featured vision.
6. T+7d: report to Matcherino: registrations, signups, redemptions.

## Prerequisites (one-time)
- A lichess account for En Pensent and a team (e.g. `en-pensent`).
- A lichess API token with the `tournament:write` scope, stored as `LICHESS_TOKEN` in `.env`.
- Custom SMTP configured in Supabase before any traffic (the built-in sender drops mail under load).
- Matcherino SponsorQuest visit URL set to `https://enpensent.com/?matcherino_key=`, action name `first_vision`.

## Open questions for Matcherino
- Who owns the event page copy and the fair-play rules text?
- Is there a revenue share on shop orders attributed to their audience, or is sponsorship flat?
- Cadence: can the weekly open be a standing event, or does each one need approval?
