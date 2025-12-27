# Security Scan Report - Amari

**Scan Date:** December 26, 2025
**Scan Type:** Comprehensive Security Analysis
**Focus Areas:** React-to-Shell Injection, XSS, Command Injection, Dependency Vulnerabilities

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Critical Vulnerabilities** | 0 |
| **High Vulnerabilities** | 0 |
| **Medium Vulnerabilities** | 1 |
| **Low Vulnerabilities** | 1 |
| **Dependency CVEs** | 0 |
| **React-to-Shell Paths** | 0 (NONE FOUND) |

**Overall Security Posture: STRONG** ✅

---

## 1. React-to-Shell Injection Analysis

### Finding: NO RISK DETECTED ✅

Comprehensive scan found **no execution paths from React components to shell commands**.

**What was checked:**
- All files in `/app` directory for `exec`, `spawn`, `shell`, `child_process`
- All API routes for user input flowing to shell execution
- All React components for dangerous patterns

**Result:** The application properly separates frontend and backend concerns. User input from React components:
1. Flows through API routes with authentication
2. Gets validated by Zod schemas with strict regex patterns
3. Gets filtered by content security (`lib/security/content-filter.ts`)
4. Never reaches shell execution

---

## 2. Dependency Vulnerabilities

### npm audit: CLEAN ✅

```
vulnerabilities: {
  info: 0,
  low: 0,
  moderate: 0,
  high: 0,
  critical: 0,
  total: 0
}
```

### OSV.dev Scan: CLEAN ✅

No known CVEs in any of the 58 production dependencies.

---

## 3. Command Injection Analysis

### CMD-INJ-001: GitHub Helper Script (MEDIUM)

**File:** `.claude/helpers/github-safe.js`
**Lines:** 80, 101, 105
**Risk Score:** 5.5/10

**Vulnerable Code:**
```javascript
const ghCommand = `gh ${command} ${subcommand} ${newArgs.join(' ')}`;
execSync(ghCommand, { stdio: 'inherit', timeout: 30000 });
// ...
execSync(`gh ${args.join(' ')}`, { stdio: 'inherit' });
```

**Issue:** Arguments are joined with spaces and passed to shell without proper escaping. Special characters or shell metacharacters in arguments could lead to command injection.

**Exploitability:** LOW - Requires:
- Local access to run the script
- Intentionally malicious input
- Script is not exposed to users, only used by developers

**Remediation:**
```javascript
// Instead of string concatenation, use spawn with array:
import { spawnSync } from 'child_process';
spawnSync('gh', [command, subcommand, ...newArgs], { stdio: 'inherit' });
```

---

### CMD-INJ-002: Lighthouse Audit Script (LOW)

**File:** `scripts/lighthouse-audit.ts`
**Lines:** 60, 69, 73

**Vulnerable Code:**
```typescript
const command = `npx lighthouse "${url}" --output=json ...`;
await execAsync(command, { maxBuffer: 50 * 1024 * 1024 });
```

**Issue:** URL is interpolated into command string. However, BASE_URL comes from environment variables, not user input.

**Exploitability:** VERY LOW
- Development/CI script only
- URL comes from `process.env.LIGHTHOUSE_BASE_URL`
- Not accessible to end users

**Remediation:** Consider using node lighthouse API directly instead of CLI.

---

## 4. XSS Vector Analysis

### dangerouslySetInnerHTML: SAFE ✅

**File:** `components/accessibility/ReducedMotion.tsx:107`

```tsx
<style
  dangerouslySetInnerHTML={{
    __html: `
      :root {
        --animation-duration: ${prefersReducedMotion ? '0ms' : '300ms'};
        ...
      }
    `,
  }}
/>
```

**Status:** SAFE
**Reason:**
- Only uses `prefersReducedMotion` boolean from `usePrefersReducedMotion()` hook
- No user input ever reaches this code
- Values are hardcoded strings based on boolean

---

## 5. Input Validation

### Strong Zod Schema Validation ✅

**File:** `lib/validations/schemas.ts`

The application uses comprehensive Zod schemas with:

1. **Regex patterns for name fields:**
```typescript
childName: z.string()
  .min(1, 'Child name is required')
  .max(50, 'Child name too long')
  .regex(/^[a-zA-Z\s'-]+$/, 'Child name contains invalid characters')
```

2. **Custom elements with strict validation:**
```typescript
customElements: z.array(
  z.string()
    .min(1)
    .max(100, 'Custom element too long')
    .regex(/^[a-zA-Z0-9\s,.'!?-]+$/, 'Custom element contains invalid characters')
).max(5, 'Maximum 5 custom elements')
```

3. **Security comments in code:**
```typescript
// SECURITY: Strict limits on user input to prevent prompt injection and excessive token usage
// SECURITY: Strict limits on custom elements to prevent prompt injection
```

---

## 6. Content Security

### Input Filtering ✅

**File:** `lib/security/content-filter.ts`

All user story requests are filtered before processing:
```typescript
const inputFilter = filterInputContent(storyRequest)
if (inputFilter.blocked) {
  return NextResponse.json({ error: getBlockedContentMessage(inputFilter) }, { status: 400 })
}
```

### Output Moderation ✅

**File:** `lib/security/output-moderator.ts`

AI-generated content is moderated after generation:
- Uses OpenAI Moderation API
- Checks for age-inappropriate content
- Fallback to regex-based detection if API fails
- Flags categories: sexual, hate, harassment, violence, self-harm

---

## 7. Authentication & Rate Limiting

### Authentication ✅
- **Provider:** Clerk
- **All API routes protected:** Yes
- **User sync to Supabase:** Implemented

### Rate Limiting ✅
- **Provider:** Upstash Redis
- **Suspicious pattern detection:** `checkSuspiciousPattern()`
- **Request hashing:** `hashStoryRequest()`

---

## 8. Secrets Management

### Environment Files ✅

**.gitignore includes:**
```
.env
.env*.local
.env.production
.env.production.*
.env.vercel*
```

### No Hardcoded Secrets ✅
- All secrets accessed via `process.env`
- `.env.example` contains placeholder values only

---

## Remediation Priority

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| 1 | CMD-INJ-001 (github-safe.js) | Low | Medium |
| 2 | CMD-INJ-002 (lighthouse-audit.ts) | Low | Low |

---

## Recommendations

1. **Update github-safe.js** to use `spawnSync` with array arguments
2. **Consider Lighthouse Node API** instead of CLI execution
3. **Continue current security practices** - input validation and content moderation are excellent
4. **Regular dependency audits** - run `npm audit` in CI/CD pipeline

---

## Appendix: Files Scanned

- 72 files with environment variable access
- 58 production dependencies
- 3 environment files
- All API routes in `/app/api`
- All components in `/components`
