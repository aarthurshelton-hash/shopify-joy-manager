# 🔍 DNS Verification Guide for enpensent.com

## Current Status
- **Domain**: enpensent.com
- **Current IP**: 185.158.133.1
- **Target**: Netlify servers
- **Status**: DNS update needed

## 🎯 DNS Update Steps

### Step 1: Get Netlify DNS Info
1. Go to Netlify Dashboard
2. Site settings → Domain management
3. Find "DNS configuration" section
4. Copy the required DNS records

### Step 2: Update Domain Registrar
Go to your domain provider (GoDaddy, Namecheap, etc.):

#### Option A: CNAME (Recommended)
- **Type**: CNAME
- **Host**: @ (or www)
- **Value**: your-site-name.netlify.app

#### Option B: A Records
- **Type**: A
- **Host**: @
- **Value**: Netlify's IP addresses (4 IPs provided)

### Step 3: Verify Changes
After updating DNS:

#### Check DNS Propagation:
```bash
nslookup enpensent.com
dig enpensent.com
```

#### Online Tools:
- https://www.whatsmydns.net/
- https://dnschecker.org/

### Step 4: Netlify Verification
1. Go back to Netlify
2. Click "Verify DNS configuration"
3. Wait for green checkmark

## ⏱️ Timeline
- **5-30 minutes**: Basic propagation
- **1-2 hours**: Most users can access
- **24-48 hours**: Full global propagation

## 🔧 Common Issues

### Issue: Still pointing to old IP
**Solution**: Wait longer for DNS propagation

### Issue: Netlify shows error
**Solution**: Double-check DNS record values

### Issue: Partial loading
**Solution**: Clear browser cache, try incognito mode

## 🎯 Success Indicators
✅ DNS points to Netlify  
✅ Netlify shows verified status  
✅ Site loads at enpensent.com  
✅ All pages work correctly  

---

**Once DNS is updated, your site will be live on enpensent.com!**
