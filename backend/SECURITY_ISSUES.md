# Known Security Issues

## Overview

This document tracks known security vulnerabilities that cannot be immediately resolved due to lack of upstream fixes or required major refactoring.

**Last Updated:** 2025-12-03
**Sprints:** 2.1 (Backend), 2.2 (Frontend), & 2.3 (Validation) - Dependency Updates

---

## Active Vulnerabilities

### 1. xlsx - Prototype Pollution & ReDoS (HIGH)

**Package:** `xlsx` (SheetJS)
**Severity:** HIGH
**CVEs:**
- GHSA-4r6h-8v6p-xvw6 (Prototype Pollution)
- GHSA-5pgg-2g8v-p4x9 (Regular Expression Denial of Service)

**Status:** ❌ No fix available from upstream

**Description:**
The xlsx library has two high-severity vulnerabilities:
1. **Prototype Pollution**: Attackers can inject properties into Object.prototype
2. **ReDoS**: Malicious input can cause exponential time complexity in regex matching

**Impact Assessment:**
- **Risk Level:** Medium
- **Exposure:** Backend & Frontend (not exposed to untrusted user input in current implementation)
- **Usage:** Excel file import/export functionality
- **Affected Packages:** Both `backend/package.json` and `frontend/package.json`

**Mitigation Strategies:**

1. **Immediate (Current):**
   - Input validation: Only accept Excel files from trusted sources (admin users)
   - File size limits: Enforce maximum file size (currently implemented)
   - Timeout controls: Set processing timeouts for Excel operations

2. **Short-term (Recommended):**
   - **Use exceljs instead**: We already have `exceljs@^4.4.0` installed
   - exceljs has no known high-severity vulnerabilities
   - API is similar, minimal refactoring required

3. **Long-term:**
   - Complete migration to exceljs
   - Remove xlsx dependency entirely
   - Update all Excel processing code

**Migration Guide (xlsx → exceljs):**

```javascript
// BEFORE (xlsx):
const XLSX = require('xlsx');
const workbook = XLSX.readFile('file.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

// AFTER (exceljs):
const ExcelJS = require('exceljs');
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile('file.xlsx');
const worksheet = workbook.getWorksheet(1);
const data = [];
worksheet.eachRow((row, rowNumber) => {
  data.push(row.values);
});
```

**Action Items:**
- [ ] Audit all uses of xlsx in codebase
- [ ] Create migration plan
- [ ] Test exceljs in staging environment
- [ ] Gradually replace xlsx with exceljs
- [ ] Remove xlsx dependency when complete

**References:**
- https://github.com/advisories/GHSA-4r6h-8v6p-xvw6
- https://github.com/advisories/GHSA-5pgg-2g8v-p4x9
- ExcelJS: https://github.com/exceljs/exceljs

---

## Resolved Vulnerabilities (Sprint 2.1)

### Summary

**Initial State:** 7 vulnerabilities (1 LOW, 2 MODERATE, 4 HIGH)
**Final State:** 1 vulnerability (1 HIGH - xlsx only)
**Resolution Rate:** 85.7% (6 of 7 resolved)

### Resolved Issues:

1. ✅ **axios (HIGH)** - CSRF, DoS, SSRF
   - Via: Dev dependency (artillery)
   - Resolution: Updated transitive dependencies

2. ✅ **tmp (LOW)** - Arbitrary file write
   - Via: Dev dependency (artillery)
   - Resolution: Updated transitive dependencies

3. ✅ **js-yaml (MODERATE)** - Prototype pollution
   - Resolution: Updated to patched version

4. ✅ **nodemailer (MODERATE)** - Domain interpretation + DoS
   - Resolution: Force updated to v7.0.11 (breaking change)
   - Testing: Email functionality verified post-update

5. ✅ **posthog-node dependencies**
   - Resolution: Updated via artillery update

6. ✅ **Various dev dependencies**
   - Resolution: npm audit fix

---

## Resolved Vulnerabilities (Sprint 2.2 - Frontend)

### Summary

**Initial State:** 5 vulnerabilities (3 MODERATE, 2 HIGH)
**Final State:** 1 vulnerability (1 HIGH - xlsx only)
**Resolution Rate:** 80% (4 of 5 resolved)

### Resolved Issues:

1. ✅ **esbuild (MODERATE)** - Development server vuln
   - Resolution: Updated Vite 5→7 (transitive update)

2. ✅ **vite (transitive from esbuild)**
   - Resolution: Updated to v7.2.6

3. ✅ **glob (HIGH)** - Command injection
   - Via: Dev dependency (sucrase)
   - Resolution: npm audit fix

4. ✅ **js-yaml (MODERATE)** - Prototype pollution
   - Resolution: npm audit fix

---

## Sprint 2.3 - Validation & Breaking Changes

### Summary

**Objective:** Validate all dependency updates work correctly in production build
**Status:** ✅ Build validation successful
**Build Time:** 8.05s
**Modules Transformed:** 4,618

### Key Findings:

1. ✅ **React 19 Migration** - Successful
   - All components render correctly
   - No breaking changes in existing code
   - Peer dependency warnings handled with --legacy-peer-deps

2. ✅ **Vite 7 Upgrade** - Successful
   - Build performance improved
   - All assets bundled correctly
   - Development server compatible

3. ⚠️ **TailwindCSS v4 - ROLLED BACK**
   - **Issue:** TailwindCSS v4 is a complete architectural rewrite
   - **Breaking Changes:**
     - CSS-first architecture (not JS-configured)
     - PostCSS plugin moved to separate `@tailwindcss/postcss` package
     - Theme system completely changed
     - `@apply` directive behavior changed
     - Utility classes not recognized without new configuration
   - **Decision:** Rolled back to v3.4.18
   - **Reason:** v4 migration requires dedicated sprint with full CSS refactoring
   - **Future Action:** Plan TailwindCSS v4 migration as separate sprint (estimated 4-8 hours)

### Build Output:

```
Bundle Sizes:
- index.html: 1.00 kB (gzip: 0.43 kB)
- CSS: 162.58 kB (gzip: 23.40 kB)
- JS Total: ~2.8 MB raw, ~786 kB gzipped
- Largest chunk: index-DM-ocWMl.js (1.13 MB / 233 kB gzipped)
```

### Performance Notes:

- ⚠️ Large bundle warning for main chunk (>1MB)
- Recommendation: Implement code-splitting with dynamic imports
- Consider manual chunk splitting for vendor libraries
- Bundle size optimization opportunity for future sprint

### Action Items:

- [ ] Plan TailwindCSS v4 migration sprint
- [ ] Implement code-splitting to reduce main bundle size
- [ ] Performance testing in staging environment
- [ ] Monitor for React 19 compatibility issues in production

---

## Vulnerability Management Process

### Regular Audits

Run security audits regularly:

```bash
# Check for vulnerabilities
npm audit

# Fix automatically where possible
npm audit fix

# Fix with breaking changes (review first)
npm audit fix --force
```

### Before Each Sprint

1. Run `npm audit`
2. Categorize vulnerabilities by:
   - Severity (LOW, MODERATE, HIGH, CRITICAL)
   - Type (Production vs Development dependency)
   - Exploitability (Theoretical vs Practical)
3. Create action plan
4. Document in this file

### Emergency Procedure

If a CRITICAL vulnerability is discovered:

1. **Immediate:**
   - Assess impact on production
   - Check if actively exploited
   - Apply hotfix if available

2. **Within 24h:**
   - Update dependency
   - Run full test suite
   - Deploy to staging
   - Validate fix

3. **Within 48h:**
   - Deploy to production
   - Monitor for issues
   - Document incident

---

## Contact & Escalation

**Security Issues:**
- Internal: Check with team lead
- External: Report to package maintainers
- Critical: Follow emergency procedure above

**Documentation:**
- Update this file with any new vulnerabilities
- Tag commits with `security:` prefix
- Include CVE numbers in commit messages

---

**Last Security Audit:** 2025-12-03
**Next Scheduled Audit:** 2025-12-10
**Maintained by:** Development Team
