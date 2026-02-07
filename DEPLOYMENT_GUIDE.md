# En Pensent Deployment & Monitoring Guide

## Deployment Checklist

### Pre-Deployment
- [ ] Run full test suite: `npm test`
- [ ] Verify TypeScript: `npx tsc --noEmit`
- [ ] Build production: `npm run build`
- [ ] Check bundle size: Under 500KB per chunk
- [ ] Verify no console errors
- [ ] Test on mobile device

### GitHub Pages Deployment
```bash
npm run build
git add dist -f
git commit -m "Deploy to GitHub Pages"
git subtree push --prefix dist origin gh-pages
```

### Environment Variables
Required in production:
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_IB_GATEWAY_HOST=127.0.0.1
VITE_IB_GATEWAY_PORT=5000
```

## Monitoring

### Core Web Vitals
Access via Chrome DevTools > Performance tab or:
```javascript
// In browser console
performance.getEntriesByType('web-vitals');
```

### Error Tracking
Errors automatically logged to Supabase `error_reports` table.
Query recent errors:
```sql
SELECT * FROM error_reports 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### Performance Metrics
Monitor in production:
- LCP: < 2.5s (Good), < 4.0s (Needs Improvement)
- FID: < 100ms (Good), < 300ms (Needs Improvement)
- CLS: < 0.1 (Good), < 0.25 (Needs Improvement)

### Health Check Endpoint
```bash
curl https://api.enpensent.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-02-06T11:45:00Z"
}
```

## Alerts

### Set Up Notifications
Configure webhooks for:
- Build failures
- High error rates (> 10/min)
- Performance degradation
- Security incidents

### Slack Integration
```javascript
// In errorReporting.ts
if (errorCount > 10) {
  fetch('https://hooks.slack.com/YOUR_WEBHOOK', {
    method: 'POST',
    body: JSON.stringify({
      text: `High error rate detected: ${errorCount} errors/min`
    })
  });
}
```

## Rollback Procedure

If deployment fails:
```bash
# Revert to last known good commit
git log --oneline -5
git revert HEAD
git push origin main
```

## Performance Tuning

### Bundle Analysis
```bash
npm run build -- --mode analyze
```

### Lighthouse CI
```bash
npm install -g lighthouse
lighthouse https://enpensent.com --output=json
```

### Memory Profiling
Monitor heap usage in Chrome DevTools Memory tab.

## Security Monitoring

### Audit Logs
Check `security_audit_logs` table:
```sql
SELECT * FROM security_audit_logs 
WHERE event_type = 'rate_limit_exceeded'
ORDER BY created_at DESC
LIMIT 10;
```

### Failed Login Attempts
```sql
SELECT email, COUNT(*) as attempts 
FROM auth_logs 
WHERE success = false 
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY email 
HAVING COUNT(*) > 5;
```

## Maintenance Windows

Recommended schedule:
- Security patches: Immediate
- Feature releases: Thursdays 2AM UTC
- Database maintenance: Sundays 3AM UTC

## Support Escalation

1. Check status page: https://status.enpensent.com
2. Review error logs in Supabase
3. Check Cloudflare dashboard for CDN issues
4. Contact on-call engineer if SLA breach

## Backup & Recovery

### Database Backups
- Automated daily backups at 2AM UTC
- Point-in-time recovery available
- Test restore monthly

### Code Recovery
- GitHub repository mirrored
- All commits tagged with versions
- Rollback procedures documented

---

Last Updated: 2026-02-06
Version: 1.0.0
