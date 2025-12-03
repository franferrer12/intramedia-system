# CI/CD Setup Documentation

## Overview

This document describes the complete CI/CD pipeline configuration for the IntraMedia System, including continuous integration, automated deployment, monitoring, and backup procedures.

**Last Updated:** 2025-12-03
**Sprint:** 1.3 - CI/CD & DevOps
**Status:** ✅ Production Ready

---

## Table of Contents

1. [Pipeline Overview](#pipeline-overview)
2. [Workflow Configuration](#workflow-configuration)
3. [Key Improvements](#key-improvements)
4. [Deployment Process](#deployment-process)
5. [Backup Automation](#backup-automation)
6. [Required Secrets](#required-secrets)
7. [Monitoring & Alerts](#monitoring--alerts)
8. [Troubleshooting](#troubleshooting)

---

## Pipeline Overview

The CI/CD pipeline consists of the following stages:

```
┌─────────────────────────────────────────────────────────────┐
│                    CI/CD PIPELINE FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐     ┌──────────────┐    ┌──────────────┐ │
│  │   Backend    │     │   Frontend   │    │   Security   │ │
│  │    Tests     │────▶│    Tests     │───▶│    Scan      │ │
│  │  + Coverage  │     │   + Build    │    │   (Trivy)    │ │
│  └──────────────┘     └──────────────┘    └──────────────┘ │
│         │                     │                    │        │
│         └─────────────────────┴────────────────────┘        │
│                               │                              │
│                      ┌────────▼────────┐                    │
│                      │  Code Quality    │                    │
│                      │     Checks       │                    │
│                      └────────┬────────┘                    │
│                               │                              │
│         ┌─────────────────────┴────────────────────┐        │
│         │           All Tests Passed?              │        │
│         └─────────────────────┬────────────────────┘        │
│                               │                              │
│          ┌────────────────────┴────────────────────┐        │
│          │        Build & Push Docker Images       │        │
│          └────────────────────┬────────────────────┘        │
│                               │                              │
│      ┌────────────────────────┴──────────────────────┐      │
│      │                                                │      │
│  ┌───▼─────┐                               ┌────▼────┐     │
│  │ Staging │                               │Production│     │
│  │ Deploy  │                               │ Deploy   │     │
│  │ (Auto)  │                               │(Manual)  │     │
│  └─────────┘                               └──────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Workflow Configuration

### Main CI/CD Workflow

**File:** `.github/workflows/ci-cd.yml`

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**

1. **backend-tests**
   - Runs Node.js tests with PostgreSQL and Redis
   - Generates coverage report
   - Uploads to Codecov
   - **⚠️ CRITICAL:** Tests WILL fail the CI if they don't pass (no `|| true`)

2. **frontend-tests**
   - Runs ESLint
   - Builds production bundle
   - Verifies no build errors

3. **security-scan**
   - Runs `npm audit` for vulnerabilities (HIGH/CRITICAL only)
   - Trivy filesystem scan
   - Checks for sensitive files in git
   - **Fails CI on high/critical vulnerabilities**

4. **code-quality**
   - Verifies project structure
   - Scans for TODO/FIXME comments
   - Basic health checks

5. **docker-build**
   - Builds backend and frontend Docker images
   - Pushes to GitHub Container Registry (GHCR)
   - Uses layer caching for faster builds
   - Only runs on push to main/develop

6. **deploy-staging**
   - Auto-deploys to staging environment
   - Runs smoke tests
   - Only on `develop` branch

7. **deploy-production**
   - Deploys to production with **manual approval**
   - Runs health checks
   - Sends notifications
   - Only on `main` branch

8. **notify**
   - Sends notifications on pipeline completion/failure
   - Reports status of all jobs

### Database Backup Workflow

**File:** `.github/workflows/database-backup.yml`

**Triggers:**
- Daily at 2 AM UTC (scheduled)
- Manual trigger via workflow_dispatch

**Features:**
- Creates compressed PostgreSQL dump
- Uploads to GitHub Artifacts (30-day retention)
- Optional S3/cloud storage upload
- Tests backup restore integrity
- Cleans up old backups
- Generates backup report

---

## Key Improvements

### ✅ What Was Fixed

1. **Removed Test Bypass (`|| true`)**
   - **Before:** `npm test || true` - Tests never failed CI
   - **After:** `npm test` - Tests properly fail the pipeline
   - **Impact:** CRITICAL - Ensures code quality

2. **Consolidated Workflows**
   - **Before:** Two separate workflows (ci-cd.yml and ci.yml)
   - **After:** Single consolidated workflow
   - **Impact:** Easier maintenance, clearer pipeline

3. **Proper Error Handling**
   - Security audits now fail on HIGH/CRITICAL vulnerabilities
   - Lint errors fail the build
   - Build failures properly reported

4. **Added Deployment Stages**
   - Staging auto-deploys from `develop`
   - Production requires manual approval
   - Health checks after deployment

5. **Automated Backups**
   - Daily database backups
   - 30-day retention policy
   - Restore integrity testing

---

## Deployment Process

### Staging Deployment

**Automatic on push to `develop` branch**

```bash
# 1. Push to develop branch
git push origin develop

# 2. CI/CD runs automatically
# 3. If all tests pass, deploys to staging
# 4. Smoke tests run
# 5. Check staging environment
```

**Staging URL:** https://staging.intramedia.example.com

### Production Deployment

**Manual approval required**

```bash
# 1. Merge develop to main
git checkout main
git merge develop
git push origin main

# 2. CI/CD runs automatically
# 3. If all tests pass, waits for manual approval
# 4. Approve deployment in GitHub Actions UI
# 5. Production deployment executes
# 6. Health checks run
# 7. Notifications sent
```

**Production URL:** https://intramedia.example.com

### Rollback Procedure

If deployment fails or issues are detected:

```bash
# Option 1: Revert the commit
git revert HEAD
git push origin main

# Option 2: Deploy previous version
# Go to GitHub Actions → Re-run previous successful workflow

# Option 3: Manual rollback
# SSH to server and restore previous Docker images
docker pull ghcr.io/username/intramedia-backend:previous-sha
docker-compose up -d
```

---

## Backup Automation

### Automated Daily Backups

Backups run daily at 2 AM UTC via GitHub Actions.

**Manual Backup:**

```bash
# From backend directory
./scripts/backup-database.sh production

# For staging
./scripts/backup-database.sh staging
```

**Backup Location:**
- GitHub Artifacts: 30 days retention
- S3 (optional): Configure AWS secrets

**Backup Files:**
```
backups/
  intra_media_production_20251203_020000.sql.gz
  intra_media_production_20251202_020000.sql.gz
  ...
```

### Restore from Backup

**From GitHub Artifacts:**

1. Go to GitHub Actions → Backup workflow
2. Download backup artifact
3. Extract the `.sql.gz` file
4. Restore:

```bash
# Extract
gunzip intra_media_production_20251203_020000.sql.gz

# Restore
PGPASSWORD=your_password psql -h localhost -U postgres -d intra_media_system \
  < intra_media_production_20251203_020000.sql
```

**From Local Backup:**

```bash
# Assuming you have the backup file
./scripts/restore-database.sh backups/intra_media_production_20251203_020000.sql.gz
```

---

## Required Secrets

Configure these secrets in GitHub repository settings:

### CI/CD Secrets

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `CODECOV_TOKEN` | Codecov upload token | Optional |
| `GITHUB_TOKEN` | Auto-provided by GitHub | Auto |

### Deployment Secrets

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `PROD_DB_HOST` | Production database host | Yes |
| `PROD_DB_PORT` | Production database port | Yes |
| `PROD_DB_NAME` | Production database name | Yes |
| `PROD_DB_USER` | Production database user | Yes |
| `PROD_DB_PASSWORD` | Production database password | Yes |

### Backup Secrets (Optional)

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `AWS_ACCESS_KEY_ID` | AWS access key for S3 | Optional |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | Optional |
| `AWS_REGION` | AWS region | Optional |
| `BACKUP_S3_BUCKET` | S3 bucket for backups | Optional |

### Notification Secrets (To Be Added)

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `SLACK_WEBHOOK_URL` | Slack webhook for notifications | Optional |
| `SENTRY_DSN` | Sentry error tracking DSN | Optional |

---

## Monitoring & Alerts

### Error Tracking (To Be Implemented)

**Sentry Integration:**
- Track runtime errors
- Performance monitoring
- Release tracking

**Setup:**
```bash
npm install @sentry/node @sentry/tracing
```

Configure in `backend/src/server.js`:
```javascript
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### Uptime Monitoring (To Be Implemented)

**Recommended Tools:**
- UptimeRobot (free tier available)
- Pingdom
- StatusCake

**Endpoints to Monitor:**
- `https://api.intramedia.com/health`
- `https://intramedia.com`

### Health Check Endpoint

Create a health check endpoint:

**File:** `backend/src/routes/health.js`
```javascript
router.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'OK'
  };

  try {
    // Check database
    await pool.query('SELECT 1');
    health.database = 'OK';

    // Check Redis
    await redis.ping();
    health.redis = 'OK';

    res.status(200).json(health);
  } catch (error) {
    health.status = 'ERROR';
    health.error = error.message;
    res.status(503).json(health);
  }
});
```

---

## Troubleshooting

### Pipeline Failures

**Tests Failing:**
```bash
# Run tests locally first
npm test

# Check specific test
npm test -- tests/integration.auth.test.js

# Check test logs in GitHub Actions artifacts
```

**Security Audit Failing:**
```bash
# Check vulnerabilities locally
npm audit

# Fix automatically
npm audit fix

# Fix breaking changes manually
npm audit fix --force
```

**Docker Build Failing:**
```bash
# Build locally
docker build -t intramedia-backend ./backend

# Check Dockerfile syntax
docker build --no-cache -t intramedia-backend ./backend
```

### Deployment Issues

**Staging Deployment Failed:**
1. Check GitHub Actions logs
2. Verify staging server is accessible
3. Check Docker image was pushed
4. Verify environment variables

**Production Approval Not Appearing:**
1. Check environment protection rules in GitHub settings
2. Verify you have required permissions
3. Check branch protection rules

### Backup Issues

**Backup Creation Failed:**
1. Check database credentials
2. Verify PostgreSQL client version
3. Check disk space
4. Review backup logs in Actions

**Restore Failed:**
1. Verify backup file integrity (gunzip -t)
2. Check target database exists
3. Verify user permissions
4. Check PostgreSQL version compatibility

---

## Best Practices

1. **Never Skip Tests:** Don't add `|| true` to test commands
2. **Always Review Changes:** Use pull requests, even for small changes
3. **Test Locally First:** Run tests and builds before pushing
4. **Monitor Pipelines:** Check CI/CD status regularly
5. **Keep Secrets Secure:** Never commit credentials
6. **Document Changes:** Update this file when making CI/CD changes
7. **Test Backups:** Regularly verify backup restores work
8. **Review Security Scans:** Address vulnerabilities promptly

---

## Sprint 1.3 Completion Checklist

- [x] Consolidate CI/CD workflows
- [x] Remove `|| true` from test commands
- [x] Add proper error handling
- [x] Configure Docker image building and pushing
- [x] Add staging deployment stage
- [x] Add production deployment with approval
- [x] Create automated backup workflow
- [x] Create manual backup script
- [x] Document CI/CD setup
- [ ] Configure Sentry for error tracking
- [ ] Setup uptime monitoring
- [ ] Add Slack/email notifications
- [ ] Test complete pipeline end-to-end

---

## Next Steps

1. **Configure Secrets:** Add required secrets in GitHub settings
2. **Test Pipeline:** Push a commit and verify all jobs pass
3. **Setup Monitoring:** Configure Sentry and uptime monitoring
4. **Add Notifications:** Setup Slack/email for pipeline events
5. **Test Backup:** Manually trigger backup and verify restore

---

**Documentation maintained by:** Claude Code
**Questions?** Check GitHub repository issues or project documentation
