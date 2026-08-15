# Repository Rename Checklist — shopify-joy-manager → en-pensent

**Status:** In-repo cleanup is DONE (this session). The GitHub rename + Vercel/PM2 updates below are manual actions only you can perform.

---

## What was already done in-repo (this session)

- [x] `package.json` name set to `en-pensent`, description updated to "Path-based chess outcome prediction system"
- [x] `package.json` `lovable-tagger` devDependency removed
- [x] `vite.config.ts` Lovable component-tagger import removed
- [x] `README.md` Lovable references removed; deploy instructions updated for Vercel/gh-pages
- [x] `ecosystem.config.json` hardcoded `/Users/alecshelts/shopify-joy-manager/...` path replaced with relative `./public/...`
- [x] `CNAME` already reads `enpensent.com` (no change needed)
- [x] Art prints / victory cards separated into `art-prints/` directory with its own README

## What you need to do manually (GitHub + infra)

### 1. Rename the GitHub repository

```
GitHub → aarthurshelton-hash/shopify-joy-manager → Settings → Repository name
Change to: en-pensent
Click Rename
```

GitHub auto-redirects old URLs, but update all references:

### 2. Update local remote

```sh
cd ~/shopify-joy-manager
git remote set-url origin https://github.com/aarthurshelton-hash/en-pensent.git
# Optionally rename the local folder:
cd ~
mv shopify-joy-manager en-pensent
cd en-pensent
```

### 3. Update Vercel project

- Vercel Dashboard → your project → Settings → General → Project Name → `en-pensent`
- Confirm the Git integration still points to the renamed repo (Vercel usually auto-updates)
- Domain `enpensent.com` should remain unchanged (CNAME is correct)

### 4. Update PM2 (if workers are running)

```sh
pm2 delete all
pm2 start ecosystem.config.json
pm2 save
```

The `ecosystem.config.json` now uses relative paths, so it works from any folder name.

### 5. Update external references

Search for and update any references to `shopify-joy-manager` in:
- `AUDIT.md` — git clone URL (line 29: `github.com/aarthurshelton-hash/shopify-joy-manager.git`)
- `README.md` — git clone URL (lines 23, 36)
- Any CI/CD configs, webhook URLs, or external documentation
- The Supabase auth settings if they reference the repo URL

### 6. Update GitHub Pages

If using gh-pages branch:
```sh
git push origin main:gh-pages --force
```

### 7. Verify

```sh
git clone https://github.com/aarthurshelton-hash/en-pensent.git
cd en-pensent
npm install
npm run build
# Confirm build succeeds
```

---

## Notes

- The repo was originally bootstrapped via Lovable, hence the `shopify-joy-manager` name. All Lovable references have been removed from tracked files.
- The `bun.lockb` file is vestigial; if you don't use Bun, consider removing it.
- Consider archiving or removing the market-trading and NFT docs (`NFT_VALUE_ACCRUAL_TRADEONLY.md`, `NFT_VISION_ARCHITECTURE.md`, `ENTERPRISE_MARKETING.md`) to reduce noise — they are not part of the chess prediction IP.
