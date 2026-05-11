# Security Policy

## Reporting a Vulnerability

**Do not report security vulnerabilities through public GitHub issues.**

Instead, please report them by:

1. Opening a **private security advisory** on GitHub: [Security Advisories](https://github.com/duynd0909/system-design-game/security/advisories/new)
2. Or emailing the maintainer directly

Please include:

- Description of the vulnerability
- Steps to reproduce
- Affected versions (if known)
- Potential impact
- Suggested fix (if you have one)

## Response Timeline

| Stage | Target Time |
|-------|-------------|
| Acknowledgment | Within 48 hours |
| Initial assessment | Within 5 business days |
| Fix or mitigation | Depends on severity |

## Security Best Practices for Contributors

- **Never commit secrets** — API keys, passwords, tokens, or certificates must not appear in code or commits
- **Use `.env.local`** for local development secrets (already gitignored)
- **Validate all inputs** at system boundaries — user input, API payloads, query parameters
- **Sanitize user-generated content** to prevent XSS
- **Use parameterized queries** — Prisma handles this by default, but avoid raw SQL without binding
- **Keep dependencies updated** — run `npm audit` regularly and address high/critical findings
- **Never expose internal errors** to clients — return generic error messages in production

## Supported Versions

| Version | Supported |
|---------|-----------|
| `main` branch | Yes |
| Sprint release branches | Yes |
| Older branches | No |

## Known Security Considerations

- **Graph masking** — answer keys are never sent to the client; all masking happens server-side
- **JWT tokens** — stored as HTTP-only cookies; not accessible via JavaScript
- **Rate limiting** — submission endpoints are throttled (10 req/min per user)
- **OAuth** — GitHub and Google OAuth flows are handled server-side; client secrets never reach the browser
