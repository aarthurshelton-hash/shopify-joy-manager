# En Pensent Launch Checklist

Ordered, concrete steps. Nothing ships to users until **all** of section 1 is done.

## 1. Deploy (must run yourself — auth prompts block agent)

```bash
# Edge functions: premium grants + redemption analytics
npx supabase functions deploy check-subscription track-funnel-event

# reward_codes / premium_grants / redeem_reward_code migration
npx supabase db push

# Site (git push to main may already auto-deploy — check dashboard first)
npx vercel --prod
```

## 2. Auth hardening (Supabase dashboard — do BEFORE Matcherino traffic)

- **Providers**: Auth → Providers → enable **Google** + **GitHub** (each needs OAuth client credentials). Google works today; GitHub only shows after both this and step below.
- **Env**: set `VITE_AUTH_PROVIDERS="google,github"` in Vercel env vars (already in `.env.example`).
- **SMTP**: Auth → Email → configure custom SMTP (Resend/SES/Postmark). Built-in SMTP ~4 emails/hr — a promo burst silently drops confirmation emails without this.

## 3. Matcherino

- Upload `~/Downloads/matcherino-reward-codes/champions.csv` (100 codes) + `supporters.csv` (1,000).
- Shopify sync when ready (~9 min, resumable):
  `SHOPIFY_ADMIN_TOKEN=<token> node scripts/promo/matcherino-codes.mjs --shopify`

## 4. End-to-end smoke test

- Fresh Gmail signup → redeem `EP-CHAMP-…` on `/redeem` → premium shows on `/account` ("Premium via reward code") → checkout shows 40% discount.
- Scan a champion card front in the vision scanner → "Claim reward" toast → routes to `/redeem`.
- `/verify/:id` on a card back → links to `/redeem`.

## 5. Post-launch (defer)

- `VITE_MARKETPLACE_ENABLED=true` only after the claims/editions remodel.
- `npx supabase gen types` to refresh generated types.
- Admin revamp: kill `CEO_EMAIL` hardcode + `grant-ceo-admin`, consolidate to one `/admin` shell, add `moderator` role.
