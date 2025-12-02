# 🔐 Secrets Management Guide

## Overview

This document outlines security best practices for managing secrets, API keys, and sensitive configuration in the IntraMedia System.

## Critical Rules

### ❌ NEVER DO THIS:
- Commit `.env` files to version control
- Hardcode secrets in source code
- Share secrets via email, Slack, or other insecure channels
- Use the same secrets for dev/staging/production
- Leave default secrets in production

### ✅ ALWAYS DO THIS:
- Use `.env.example` as a template (committed to git)
- Keep actual `.env` files local only (in `.gitignore`)
- Use strong, randomly-generated secrets
- Rotate secrets regularly (every 90 days minimum)
- Use a secrets manager in production

## Environment Files

### Structure
```
backend/
├── .env                  # Local development (NOT in git)
├── .env.example          # Template with descriptions (IN git)
├── .env.production       # Production secrets (NOT in git)
└── .env.staging          # Staging secrets (NOT in git)
```

### .gitignore Rules
Ensure these patterns are in `.gitignore`:
```
.env
.env.local
.env.*.local
.env.production
.env.staging
*.key
*.pem
```

## Secret Generation

### JWT Secret (64+ characters)
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Encryption Key (exactly 32 bytes = 64 hex chars)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Database Password (24+ characters)
```bash
openssl rand -base64 24
```

### API Keys
Use provider-specific generation (never create your own)

## Production Secrets Management

### Recommended Solutions

#### 1. **AWS Secrets Manager** (Recommended for AWS deployments)
```javascript
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

async function getSecret(secretName) {
  const client = new SecretsManagerClient({ region: "us-east-1" });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );
  return JSON.parse(response.SecretString);
}
```

#### 2. **HashiCorp Vault** (For multi-cloud)
```bash
# Login
vault login

# Read secret
vault kv get secret/intra-media/production

# Write secret
vault kv put secret/intra-media/production \
  db_password="..." \
  jwt_secret="..."
```

#### 3. **Docker Secrets** (For Docker Swarm)
```yaml
services:
  api:
    secrets:
      - db_password
      - jwt_secret

secrets:
  db_password:
    external: true
  jwt_secret:
    external: true
```

#### 4. **Kubernetes Secrets** (For K8s deployments)
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: intra-media-secrets
type: Opaque
data:
  db-password: <base64-encoded>
  jwt-secret: <base64-encoded>
```

### Environment Variables in Production

Never use `.env` files in production. Instead:

1. **Container Orchestration**: Inject via Kubernetes/Docker secrets
2. **Cloud Providers**: Use AWS Parameter Store, Google Secret Manager
3. **CI/CD**: Set via GitHub Secrets, GitLab CI Variables
4. **Manual**: Set system environment variables

## Secret Rotation

### Rotation Schedule
- **JWT Secret**: Every 90 days
- **Database Password**: Every 180 days
- **API Keys**: When compromised or annually
- **Encryption Keys**: Never (or migrate data first)

### Rotation Process

1. **Generate new secret**
   ```bash
   NEW_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
   ```

2. **Update secrets manager**
   ```bash
   # AWS
   aws secretsmanager update-secret \
     --secret-id intra-media/jwt-secret \
     --secret-string "$NEW_SECRET"
   ```

3. **Rolling deployment**
   - Deploy app with dual-secret support
   - Update all instances
   - Remove old secret

4. **Verify**
   - Test authentication
   - Monitor error rates
   - Rollback if needed

## Access Control

### Who Needs Access?
- **Full secrets**: DevOps engineers only
- **Read-only**: Senior developers (on-demand)
- **No access**: Junior developers, contractors

### Audit Trail
- Log all secret accesses
- Review access logs monthly
- Revoke unused access

## Incident Response

### If a Secret is Compromised:

1. **Immediate Actions** (within 1 hour)
   - Rotate the compromised secret
   - Review access logs
   - Notify security team

2. **Investigation** (within 24 hours)
   - Identify breach source
   - Check for unauthorized access
   - Document findings

3. **Prevention** (within 1 week)
   - Patch vulnerability
   - Update security policies
   - Train team if needed

## Development Workflow

### Local Development
```bash
# 1. Copy example
cp .env.example .env

# 2. Generate secrets
echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")" >> .env
echo "ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" >> .env

# 3. Set database password
echo "DB_PASSWORD=local_dev_password" >> .env

# 4. Verify
npm run dev
```

### Sharing Secrets with Team

**Option 1: 1Password/LastPass** (Recommended)
- Create shared vault
- Add team members
- Share .env file via secure note

**Option 2: Encrypted Git**
```bash
# Encrypt
gpg -c .env

# Commit encrypted version
git add .env.gpg
git commit -m "Add encrypted secrets"

# Decrypt (team member)
gpg .env.gpg
```

**Option 3: Internal Secrets Portal**
- Build internal tool
- OAuth authentication
- Audit logging
- Time-limited access

## Verification Checklist

Before deploying to production:

- [ ] No secrets in code
- [ ] No secrets in git history
- [ ] All secrets are strong (entropy > 128 bits)
- [ ] Secrets manager configured
- [ ] Backup of secrets exists
- [ ] Team trained on procedures
- [ ] Incident response plan documented
- [ ] Monitoring/alerting configured
- [ ] Access controls implemented
- [ ] Rotation schedule defined

## Tools & Resources

### Secret Scanning
```bash
# Scan git history for secrets
git-secrets --scan

# Scan with truffleHog
truffleHog git file://. --json

# GitHub secret scanning (automatic)
```

### Entropy Check
```bash
# Check secret strength
echo "your_secret" | ent
```

### Validation
```javascript
// Check secret meets requirements
function validateSecret(secret, minLength = 64) {
  if (secret.length < minLength) {
    throw new Error(`Secret must be at least ${minLength} characters`);
  }
  if (!/[A-Z]/.test(secret) || !/[a-z]/.test(secret) || !/[0-9]/.test(secret)) {
    throw new Error('Secret must contain uppercase, lowercase, and numbers');
  }
  return true;
}
```

## References

- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [AWS Secrets Manager Best Practices](https://docs.aws.amazon.com/secretsmanager/latest/userguide/best-practices.html)
- [HashiCorp Vault Documentation](https://www.vaultproject.io/docs)
- [12-Factor App: Config](https://12factor.net/config)

## Support

For questions or security concerns:
- Contact: security@intramedia.com
- Emergency: Use incident response procedure
- Non-urgent: File GitHub issue (without exposing secrets)

---

**Last Updated:** December 2, 2025
**Next Review:** March 2, 2026
