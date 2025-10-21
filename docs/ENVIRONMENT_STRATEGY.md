# Environment Deployment Strategy

## TL;DR

**Current Setup**: Development deployments only (beta.frankbria.com on 47.88.89.175)
**Production Server**: Already provisioned and ready (different IP address)
**Strategy**: Option B (Separate Servers) - Complete isolation
**Status**: CI/CD will be ready for production launch when MVP is signed off

---

## Visual Overview

### Current State (Phase 1)

```
┌─────────────────────────────────────────────────────────────┐
│ GitHub Repository (frankbria/frankbria-com)                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  main branch          ───────X  (deployments DISABLED)      │
│                                                              │
│  develop branch       ─────┐                                │
│  claude/** branches   ─────┤                                │
│  feature branches     ─────┤                                │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ GitHub Actions │
                    │  CI/CD Pipeline│
                    └────────┬───────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │ Server: 47.88.89.175     │
              ├──────────────────────────┤
              │ /var/nodejs/             │
              │                          │
              │ ├─ frankbria-com/        │ ◄── ALL deployments go here
              │ │  └─ PM2: frankbria-    │
              │ │     nextjs             │
              │ │                        │
              │ └─ frankbria-strapi/     │
              │    └─ PM2: strapi        │
              └──────────────────────────┘
                         │
                         ▼
              https://beta.frankbria.com
```

### Future State - Option A: Same Server, Different Directories

```
┌─────────────────────────────────────────────────────────────┐
│ GitHub Repository                                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  main branch          ─────┐                                │
│                            │                                 │
│  develop branch       ─────┼─────┐                          │
│  claude/** branches   ─────┘     │                          │
│                                   │                          │
└───────────────────────────────────┼──────────────────────────┘
                      │             │
                      │             │
                      ▼             ▼
            ┌─────────────────────────────────────┐
            │ Server: 47.88.89.175                │
            ├─────────────────────────────────────┤
            │                                     │
            │ Production         Development      │
            │ ↓                  ↓                │
            │ frankbria-com-prod frankbria-com    │
            │ Port: 3001         Port: 3000       │
            │ PM2: ...-prod      PM2: ...-nextjs  │
            │                                     │
            │ frankbria-strapi-  frankbria-strapi │
            │    -prod           Port: 1337       │
            │ Port: 1338                          │
            └─────────────────────────────────────┘
                     │                  │
                     ▼                  ▼
            frankbria.com      beta.frankbria.com
```

### Future State - Production Launch (When MVP is Ready)

```
┌─────────────────────────────────────────────────────────────┐
│ GitHub Repository                                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  main branch          ─────┐   (deploys to production)     │
│                            │                                 │
│  develop branch       ─────┼─────┐   (deploys to dev)      │
│  claude/** branches   ─────┘     │                          │
│                                   │                          │
└───────────────────────────────────┼──────────────────────────┘
                      │             │
                      │             │
                      ▼             ▼
      ┌──────────────────┐   ┌──────────────────┐
      │ Production Server│   │ Dev Server       │
      │ (existing IP)    │   │ 47.88.89.175     │
      ├──────────────────┤   ├──────────────────┤
      │ frankbria-com/   │   │ frankbria-com/   │
      │ frankbria-strapi/│   │ frankbria-strapi/│
      └──────────────────┘   └──────────────────┘
              │                      │
              ▼                      ▼
       frankbria.com        beta.frankbria.com
       (replaces WP)        (testing/dev)
```

**Note**: Production server already exists and is configured, just waiting for MVP sign-off to enable deployments and switch DNS from WordPress.

---

## Quick Comparison

| Aspect | Current (Phase 1) | Option A: Same Server | Option B: Separate Servers |
|--------|-------------------|----------------------|---------------------------|
| **Setup Complexity** | ✅ Simple | ⚠️ Medium | ❌ Complex |
| **Cost** | ✅ $5-20/mo | ✅ $5-20/mo | ❌ $10-40/mo |
| **Isolation** | N/A | ⚠️ Shared resources | ✅ Complete isolation |
| **Risk** | ✅ Dev only | ⚠️ Dev can affect prod | ✅ No cross-contamination |
| **Scalability** | N/A | ⚠️ Limited | ✅ Independent scaling |
| **Maintenance** | ✅ One server | ⚠️ One server | ❌ Two servers |
| **Best For** | Testing CI/CD | Small sites (<10k users) | Production sites |

---

## Decision Matrix

### Choose **Current Setup** (Phase 1) if:
- ✅ You're just setting up CI/CD for the first time
- ✅ You want to test automation before going to production
- ✅ You're still developing features
- ✅ You want zero risk of affecting production (because it doesn't exist yet)

### Choose **Option A** (Same Server) if:
- ✅ You have low to medium traffic (<10,000 users)
- ✅ You want to minimize server costs
- ✅ You're comfortable with some shared resources
- ✅ You can accept brief production downtime during heavy dev deployments
- ⚠️ You understand dev deployments could slow down production

### Choose **Option B** (Separate Servers) if:
- ✅ You have production traffic (>10,000 users)
- ✅ You need guaranteed uptime SLA
- ✅ You want to test server infrastructure changes safely
- ✅ You're willing to pay for an extra server
- ✅ You need compliance/security isolation

---

## Migration Path

### Today
```bash
# Enable CI/CD for development
1. Set up GitHub Actions (Phase 1)
2. Test deployments to beta.frankbria.com
3. Verify automation works
```

### When Ready for Production

#### If choosing Option A (Same Server):
```bash
# 1. Create production directories
ssh root@47.88.89.175
cd /var/nodejs
git clone <repo> frankbria-com-prod
cd frankbria-com-prod
git checkout main
npm install && npm run build
pm2 start npm --name frankbria-nextjs-prod -- start

# 2. Update GitHub workflows
# Uncomment 'main' branch trigger
# Add environment-specific deployment paths

# 3. Test with a hotfix branch first
```

#### If choosing Option B (Separate Servers):
```bash
# 1. Provision new production server
# DigitalOcean/AWS/etc.

# 2. Set up production server
# Install Node.js, PM2, nginx, etc.

# 3. Add production SSH key to GitHub Secrets

# 4. Update workflows with production server details

# 5. Test deployment to production server
```

---

## Recommendation for You

Based on your **existing production server** setup:

### **Phase 1 (Now - During MVP Development)**
✅ **Development CI/CD Only**
- Deploy automatically to beta.frankbria.com (47.88.89.175)
- Keep `main` branch deployments disabled
- Test and refine features on development
- WordPress production remains untouched

### **Phase 2 (MVP Sign-Off → Production Launch)**
✅ **Enable Production Deployments**
- Uncomment `main` branch in workflows
- Add production server SSH key and secrets
- Deploy to production server (existing IP)
- Switch DNS from WordPress to new Next.js/Strapi
- **Turn off WordPress server** 🎉

### **Phase 3 (Ongoing)**
✅ **Dual-Environment Operations**
- `main` branch → frankbria.com (production)
- `develop`/`claude/**` → beta.frankbria.com (development)
- Complete isolation between environments
- Safe to test features without affecting production

---

## Key Takeaways

1. **The CI/CD workflows I'm designing support ALL three phases**
2. **You can start with Phase 1 (dev only) TODAY**
3. **Enabling production later is just a few configuration changes**
4. **No need to decide on production strategy right now**
5. **The design is flexible and future-proof**

---

## Next Steps

1. ✅ **Approve the design** (or request changes)
2. ✅ **Implement Phase 1** - Development CI/CD only
3. ✅ **Test thoroughly** on beta.frankbria.com
4. ⏸️ **Wait** - Don't enable production until you're ready
5. ⏸️ **Choose Option A or B** when the time comes
6. ⏸️ **Enable production deployments** with minimal changes

**Questions to answer later** (not now):
- Do you need separate production server?
- What's your expected production traffic?
- What's your uptime SLA requirement?
- What's your infrastructure budget?
