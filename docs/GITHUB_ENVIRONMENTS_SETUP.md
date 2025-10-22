# GitHub Environments Setup Guide

## 🎯 Why Use Environments?

GitHub Environments provide:
- ✅ **Better organization**: Secrets grouped by environment (development vs production)
- ✅ **Protection rules**: Require approvals before production deployments
- ✅ **Deployment tracking**: See which version is deployed where
- ✅ **URL visibility**: Each environment shows its deployment URL
- ✅ **Easier management**: Change development settings without touching production

---

## 📋 Setup Steps

### Step 1: Create Environments

1. Go to your repository settings:
   ```
   https://github.com/frankbria/frankbria-com/settings/environments
   ```

2. Click **"New environment"**

3. Create **"development"** environment:
   - Name: `development`
   - Click **"Configure environment"**
   - **Don't add any protection rules** (for now)
   - Click **"Save protection rules"**

4. Create **"production"** environment:
   - Name: `production`
   - Click **"Configure environment"**
   - ✅ **Check "Required reviewers"** (optional but recommended)
   - Add yourself as a reviewer
   - Click **"Save protection rules"**

---

### Step 2: Add Development Environment Configuration

Go to the **development** environment settings:
```
https://github.com/frankbria/frankbria-com/settings/environments/<environment-id>/edit
```

#### Add Environment Secrets (🔒 Encrypted)

Click **"Add secret"** for each:

| Secret Name | Value |
|------------|-------|
| `DEPLOY_HOST` | `47.88.89.175` |
| `DEPLOY_USER` | `root` |
| `DEPLOY_SSH_KEY` | *See below* |

**DEPLOY_SSH_KEY value**:

⚠️ **SECURITY**: Never commit private SSH keys to git!

To get this value:
```bash
cat ~/.ssh/github-actions-dev-new
```

Copy the **entire output** including BEGIN and END lines, then add it as a secret in GitHub.

**Note**: The corresponding public key (`ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAcHpHv0QyNv3NRUVxX4KIaA2gB5xklJ0eAF8j+sxAvi`) has already been added to the server.

#### Add Environment Variables (📝 Plain text, not sensitive)

Click **"Add variable"** for each:

| Variable Name | Value |
|--------------|-------|
| `DEPLOY_PATH` | `/var/nodejs/frankbria-com` |
| `STRAPI_DEPLOY_PATH` | `/var/nodejs/frankbria-strapi` |
| `PM2_PROCESS_NAME` | `frankbria-nextjs` |
| `STRAPI_PM2_NAME` | `strapi` |
| `SITE_URL` | `https://beta.frankbria.com` |
| `STRAPI_URL` | `https://beta.frankbria.com` |

---

### Step 3: Add Production Environment Configuration (Later)

**Don't do this yet** - Production deployments are disabled until MVP is approved.

When you're ready:

#### Production Secrets

| Secret Name | Value |
|------------|-------|
| `DEPLOY_HOST` | `[Your production server IP]` |
| `DEPLOY_USER` | `root` |
| `DEPLOY_SSH_KEY` | `[New SSH key for production]` |

#### Production Variables

| Variable Name | Value |
|--------------|-------|
| `DEPLOY_PATH` | `/var/nodejs/frankbria-com` |
| `STRAPI_DEPLOY_PATH` | `/var/nodejs/frankbria-strapi` |
| `PM2_PROCESS_NAME` | `frankbria-nextjs` |
| `STRAPI_PM2_NAME` | `strapi` |
| `SITE_URL` | `https://frankbria.com` |
| `STRAPI_URL` | `https://frankbria.com` |

---

## 🔍 Understanding Secrets vs Variables

### Secrets (🔒 Encrypted)
- **Use for**: Passwords, SSH keys, API tokens
- **Encrypted**: Yes, at rest and in transit
- **Visible in logs**: No (masked as ***)
- **Examples**: `DEPLOY_SSH_KEY`, `DATABASE_PASSWORD`, `API_TOKEN`

### Variables (📝 Plain text)
- **Use for**: Non-sensitive configuration
- **Encrypted**: No
- **Visible in logs**: Yes
- **Examples**: `DEPLOY_PATH`, `SITE_URL`, `PM2_PROCESS_NAME`

**Why separate?**
- Makes it easier to see configuration at a glance
- Can share variables across workflows
- Cleaner organization

---

## 📊 Environment Overview

### Development Environment

| Setting | Value |
|---------|-------|
| **Name** | `development` |
| **URL** | https://beta.frankbria.com |
| **Server** | 47.88.89.175 |
| **Triggers** | Push to `develop`, `claude/**` branches |
| **Protection** | None (deploys automatically) |
| **Purpose** | Testing and development |

### Production Environment

| Setting | Value |
|---------|-------|
| **Name** | `production` |
| **URL** | https://frankbria.com |
| **Server** | [Existing production server] |
| **Triggers** | Push to `main` branch (currently disabled) |
| **Protection** | Requires reviewer approval |
| **Purpose** | Live production site |

---

## 🧪 Testing Your Setup

### Test Development Deployment

1. Go to Actions:
   ```
   https://github.com/frankbria/frankbria-com/actions
   ```

2. Click **"Deploy Frontend (Next.js)"**

3. Click **"Run workflow"**

4. You should see:
   - Environment: `development`
   - URL: `https://beta.frankbria.com`

5. The workflow will:
   - Use development secrets
   - Deploy to 47.88.89.175
   - Update beta.frankbria.com

### Verify Environment Usage

After the workflow runs, you'll see:

- ✅ **Deployment badge** showing "development" environment
- ✅ **Deployment URL** linking to beta.frankbria.com
- ✅ **Environment history** showing all deployments

---

## 🔐 Security Benefits

### Before (Repository Secrets)
```
DEPLOY_HOST              → Which server?
DEPLOY_HOST_PROD         → Which server?
DEPLOY_SSH_KEY           → Which key?
DEPLOY_SSH_KEY_PROD      → Which key?
DEPLOY_FRONTEND_PATH     → Which path?
...
```
**Problem**: Hard to tell which is which, easy to mix up

### After (Environment Secrets)
```
development/
  DEPLOY_HOST            → Clearly dev server
  DEPLOY_SSH_KEY         → Clearly dev key

production/
  DEPLOY_HOST            → Clearly prod server
  DEPLOY_SSH_KEY         → Clearly prod key
```
**Better**: Crystal clear separation, can't mix them up

---

## 🎯 Quick Setup Checklist

Development environment:
- [ ] Created `development` environment
- [ ] Added `DEPLOY_HOST` secret (`47.88.89.175`)
- [ ] Added `DEPLOY_USER` secret (`root`)
- [ ] Added `DEPLOY_SSH_KEY` secret (full private key)
- [ ] Added `DEPLOY_PATH` variable (`/var/nodejs/frankbria-com`)
- [ ] Added `SITE_URL` variable (`https://beta.frankbria.com`)
- [ ] Added `STRAPI_URL` variable (`https://beta.frankbria.com`)

Production environment (do later):
- [ ] Created `production` environment
- [ ] Enabled "Required reviewers"
- [ ] Added yourself as reviewer
- [ ] Production secrets (when ready for MVP)

---

## 💡 Pro Tips

1. **Variables for paths**: Use variables for paths so you can see them easily
2. **Secrets for keys**: Use secrets for SSH keys and passwords
3. **Protection rules**: Enable reviewer approval for production
4. **Test first**: Always test with development environment first
5. **Clear names**: Use clear variable names (`SITE_URL` not `URL`)

---

## 🐛 Troubleshooting

### "Error: environment is not defined"
- Verify environment name is exactly `development` or `production`
- Check that environment exists in repository settings

### "Error: secrets.DEPLOY_HOST is not set"
- Verify secret is added to the **environment**, not repository
- Check secret name matches exactly (case-sensitive)

### "Error: Required reviewers not satisfied"
- This is expected for production - approve the deployment
- For development, ensure no protection rules are enabled

### Workflow uses wrong environment
- Check that branch triggers are correct
- Verify environment name in workflow file

---

## 📚 Additional Resources

- [GitHub Environments Documentation](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Environment Protection Rules](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment#environment-protection-rules)
- [Deployment History](https://docs.github.com/en/actions/deployment/managing-your-deployments/viewing-deployment-history)

---

## ✅ Next Steps

1. Create both environments (development + production)
2. Add secrets/variables to development environment
3. Test deployment to development
4. Verify on beta.frankbria.com
5. When ready for MVP: Configure production environment

**Start here**: Create the `development` environment and add the secrets/variables above!
