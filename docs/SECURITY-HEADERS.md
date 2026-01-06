# Security Headers - GitHub Pages Limitations

## Status: ⚠️ Platform Limitation

GitHub Pages **does not support custom HTTP headers**. Security headers cannot be added server-side.

## Headers Already Implemented

### Content Security Policy (CSP)
✅ **Implemented via `<meta>` tag** in `index.html` (line 15-25)

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' https://cdn.jsdelivr.net;
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
               img-src 'self' data: https:;
               font-src 'self' https://fonts.gstatic.com;
               connect-src 'self' https://formspree.io;
               object-src 'none';
               base-uri 'self';
               form-action 'self' https://formspree.io;">
```

### Subresource Integrity (SRI)
✅ **Implemented** on Three.js CDN script (line 47-49)
```html
<script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"
        integrity="sha384-qOkzR5Ke/XkQxuGVJ9hpFEpDlcoLtWwVYhnJf06cLIZa2vaIptSqaubivErzmD5O"
        crossorigin="anonymous"></script>
```

## Headers NOT Available on GitHub Pages

The following security headers **cannot be added** on GitHub Pages without migrating:

| Header | Purpose | Alternative |
|--------|---------|-------------|
| `Strict-Transport-Security` | Force HTTPS | GitHub Pages already enforces HTTPS |
| `X-Frame-Options: DENY` | Prevent clickjacking | CSP `frame-ancestors 'none'` (not in meta CSP) |
| `X-Content-Type-Options: nosniff` | Prevent MIME sniffing | Browser defaults are sufficient |
| `X-XSS-Protection` | Legacy XSS filter | Modern browsers ignore this (CSP is better) |
| `Referrer-Policy` | Control referrer header | Use `<meta name="referrer">` tag |
| `Permissions-Policy` | Feature policy | Use `<meta http-equiv="Permissions-Policy">` |

## Workarounds Implemented

### 1. Referrer Policy (Meta Tag)
Add to `<head>`:
```html
<meta name="referrer" content="strict-origin-when-cross-origin">
```

### 2. Frame Ancestors (Cannot be enforced via meta)
- **Risk**: Site could be embedded in iframe on another domain
- **Mitigation**: CSP `frame-ancestors` only works via HTTP header, not meta tag
- **Decision**: Accept risk for GitHub Pages deployment

## Migration Options for Full Headers

If security headers become critical, migrate to:

| Platform | Headers Support | Complexity |
|----------|-----------------|------------|
| **Netlify** | `netlify.toml` | Low |
| **Vercel** | `vercel.json` | Low |
| **Cloudflare Pages** | `_headers` file | Low |
| **AWS S3 + CloudFront** | Custom headers | Medium |

### Example: Netlify (netlify.toml)
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=()"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"
```

## Current Security Posture

| Control | Status | Notes |
|---------|--------|-------|
| HTTPS | ✅ Enforced by GitHub Pages | Automatic |
| CSP | ✅ Meta tag implementation | Comprehensive |
| SRI | ✅ Three.js verified | CDN integrity |
| Form Validation | ✅ maxlength attributes | DoS prevention |
| Security Headers | ⚠️ Platform limitation | Meta tags where possible |

## Recommendation

**Stay on GitHub Pages** unless:
- Regulatory requirements mandate HTTP headers
- Clickjacking protection becomes critical
- Advanced feature policies are needed

Current security posture is **acceptable for a small business marketing site**.

---

*Last updated: 2026-01-06*
*Task: TaskMaster #8 - Add missing security headers*
