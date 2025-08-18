# Tripthesia Deployment Guide

Complete guide to deploy Tripthesia to production with all features working.

## Pre-Deployment Checklist

### Required Accounts & API Keys
- [ ] **GitHub Account** (for code hosting & CI/CD)
- [ ] **Vercel Account** (for hosting)
- [ ] **Neon Account** (PostgreSQL database)
- [ ] **Upstash Account** (Redis cache)
- [ ] **Clerk Account** (authentication)
- [ ] **OpenAI Account** (AI generation)
- [ ] **Razorpay Account** (payments)
- [ ] **Foursquare Account** (places API)
- [ ] **Mapbox Account** (maps)

## Step-by-Step Deployment

### Step 1: GitHub Repository Setup (5 minutes)

```bash
# Navigate to production directory
cd tripthesia/production

# Initialize Git repository
git init
git add .
git commit -m "Initial Tripthesia production setup"

# Create GitHub repository (via GitHub.com)
# Then connect local repo:
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tripthesia.git
git push -u origin main
```

### Step 2: Vercel Deployment (3 minutes)

1. **Visit [vercel.com](https://vercel.com)** and sign up/login
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Framework**: Next.js (auto-detected)
5. **Root Directory**: `/` (or specify `production` if needed)
6. **Click "Deploy"**

### Step 3: Environment Variables in Vercel (5 minutes)

In Vercel Dashboard → Settings → Environment Variables, add all your API keys from the .env.example file.

### Step 4: Database Migration (2 minutes)

```bash
# In your local terminal
npm run db:migrate

# Or run manually in Vercel Functions
# The database schema will auto-create on first API call
```

### Step 5: Custom Domain (Optional, 2 minutes)

1. **Vercel Dashboard** → Your Project → Settings → Domains
2. **Add Domain**: `tripthesia.com` or `your-domain.com`
3. **Update DNS** as instructed by Vercel
4. **Update NEXT_PUBLIC_APP_URL** in environment variables

## Testing Your Deployment

### 1. Health Check
```bash
curl https://your-app.vercel.app/api/health
```

### 2. Authentication Test
1. Visit your deployed app
2. Click "Sign In"
3. Create account with email/social
4. Should redirect to dashboard

### 3. Trip Creation Test
1. Sign in to your app
2. Click "Create Trip"
3. Fill in trip details
4. Should create successfully

## Go-Live Checklist

### Before Launch
- [ ] All health checks pass
- [ ] Authentication works
- [ ] Trip creation works
- [ ] Payment flow tested
- [ ] Mobile responsive
- [ ] Custom domain configured
- [ ] SSL certificate active

### Launch Day
- [ ] Monitor error rates
- [ ] Check database performance
- [ ] Monitor payment webhooks
- [ ] Test user registration flow

## You're Live!

Once deployed, your Tripthesia app will be:

- Globally Available at your Vercel URL
- Auto-Scaling based on traffic
- Continuously Deployed via GitHub
- Fully Functional with all features
- Mobile Optimized for all devices
- Secure with HTTPS and auth
- Fast with edge caching

## Support

If you encounter issues:

1. **Check Logs**: Vercel Dashboard → Functions → View Logs
2. **Health Endpoint**: `/api/health` for diagnostics
3. **GitHub Issues**: Create issue with error details
4. **Vercel Support**: Contact if hosting issues

---

**Estimated Total Deployment Time**: 15-20 minutes