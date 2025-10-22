# GitHub Secrets Setup Guide

## 🔐 Required Secrets for Development CI/CD

You need to add the following secrets to your GitHub repository to enable automated deployments.

### How to Add Secrets

1. Go to: **https://github.com/frankbria/frankbria-com/settings/secrets/actions**
2. Click **"New repository secret"**
3. Add each secret below with the exact name and value

---

## Development Server Secrets

### 1. DEPLOY_HOST
**Value**: `47.88.89.175`

**Description**: IP address of your development server

---

### 2. DEPLOY_USER
**Value**: `root`

**Description**: SSH user for deployment

---

### 3. DEPLOY_SSH_KEY

**⚠️ SECURITY**: Never commit private SSH keys to git!

**How to get this value**:

1. Read the private key from your local machine:
   ```bash
   cat ~/.ssh/github-actions-dev-new
   ```

2. Copy the **entire output** including BEGIN and END lines

3. Add it as a secret in GitHub (it will be encrypted)

**Description**: SSH private key for GitHub Actions authentication

**Note**: The corresponding public key has already been added to the server at `47.88.89.175`

---

### 4. DEPLOY_FRONTEND_PATH
**Value**: `/var/nodejs/frankbria-com`

**Description**: Path to Next.js application on the server

---

### 5. DEPLOY_BACKEND_PATH (Optional)
**Value**: `/var/nodejs/frankbria-strapi`

**Description**: Path to Strapi application on the server

---

### 6. NEXT_PUBLIC_STRAPI_URL (Optional)
**Value**: `https://beta.frankbria.com`

**Description**: Strapi API URL for development builds

---

## Quick Checklist

Before proceeding, verify:

- [ ] All 4 required secrets added (DEPLOY_HOST, DEPLOY_USER, DEPLOY_SSH_KEY, DEPLOY_FRONTEND_PATH)
- [ ] SSH key copied completely (including BEGIN and END lines)
- [ ] No extra spaces or line breaks in values
- [ ] Server IP address is correct (47.88.89.175)

---

## Testing the Setup

After adding secrets, you can test the deployment:

### Option 1: Manual Trigger (Recommended for First Test)

1. Go to: **https://github.com/frankbria/frankbria-com/actions**
2. Click on **"Deploy Frontend (Next.js)"** workflow
3. Click **"Run workflow"**
4. Select **"development"** environment
5. Click **"Run workflow"**

### Option 2: Push to Develop Branch

```bash
# Make a small change (e.g., update README)
echo "# Test deployment" >> README.md

# Commit and push
git add README.md
git commit -m "Test: Trigger GitHub Actions deployment"
git push origin develop
```

Then check: **https://github.com/frankbria/frankbria-com/actions**

---

## Troubleshooting

### "Error: Permission denied (publickey)"
- Verify DEPLOY_SSH_KEY is copied completely
- Ensure no extra spaces or formatting in the key
- Check that public key was added to server's authorized_keys

### "Error: Host key verification failed"
- This is normal on first run - the workflow adds the host automatically
- If persists, check DEPLOY_HOST value is correct

### "Error: secrets.DEPLOY_HOST is not set"
- Ensure secret names are EXACTLY as shown (case-sensitive)
- Check you're adding them as "repository secrets" not "environment secrets"

### Deployment succeeds but site doesn't update
- Check PM2 is running: `ssh root@47.88.89.175 "pm2 status"`
- View PM2 logs: `ssh root@47.88.89.175 "pm2 logs frankbria-nextjs"`
- Verify git pull worked on server

---

## Production Secrets (Add Later)

When you're ready to enable production deployments, you'll need to add:

- `DEPLOY_HOST_PROD`: Production server IP
- `DEPLOY_USER_PROD`: `root`
- `DEPLOY_SSH_KEY_PROD`: New SSH key for production
- `NEXT_PUBLIC_STRAPI_URL_PROD`: `https://frankbria.com`

**Don't add these yet** - production deployments are currently disabled.

---

## Security Notes

✅ **Safe to commit**: Workflow files (already done)
❌ **NEVER commit**: SSH private keys, server IPs in code
✅ **Encrypted**: All GitHub Secrets are encrypted at rest
✅ **Access**: Only GitHub Actions can decrypt and use these secrets

---

## Next Steps

1. ✅ Add all required secrets
2. ✅ Test deployment with manual trigger
3. ✅ Verify deployment on beta.frankbria.com
4. ✅ Start developing - deployments now automatic!

Questions? Check the main design docs in `/docs/CICD_DESIGN.md`
