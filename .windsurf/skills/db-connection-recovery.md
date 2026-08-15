---
description: Recover from Supabase DB lockouts / connection exhaustion
tags: [database, supabase, recovery, pm2]
---

# Skill: Recover DB Connections

## Symptoms
- Workers log connection timeouts.
- Supabase pooler circuit breaker triggers.
- `pm2 logs` shows repeated DB errors.

## Root Cause
Orphaned Node processes (from `pm2 logs` or previous worker restarts) survive `pm2 kill` and hold DB connections, exhausting the pool.

## Recovery Steps

1. **Kill orphaned processes**
   ```bash
   ps aux | grep -E "farm/workers|pm2"
   pkill -f "farm/workers"
   pkill -f "pm2 logs"
   ```

2. **Use direct DB connection**
   - In `.env`, use `db.ezvfslkjyjsqycztyfxh.supabase.co:5432` (direct), not `pooler.supabase.com:5432`.
   - Keep the pooler URL as a comment for reference.

3. **Set worker pool max to 1**
   - Each worker connection pool should be `max: 1`.

4. **Restart and save**
   ```bash
   pm2 restart all
   pm2 save
   ```

## Prevention
- Always check for orphan processes before blaming Supabase.
- Save PM2 config after adding or removing workers.
