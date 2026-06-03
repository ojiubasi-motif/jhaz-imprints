# Middleware Styleguide

## Unique Patterns
- **Internal Gateway Secret Verification**: To protect the internal catalog service from direct access (bypassing the API gateway), the authentication middleware validates that the incoming `x-internal-secret` matches the environment variable `INTERNAL_GATEWAY_SECRET`.
- **Identity Header Forwarding**: Instead of parsing JWTs directly, the service relies on the API gateway to authenticate requests. It extracts `x-user-id`, `x-user-role`, and `x-user-email` headers forwarded by the gateway, manually casting the role via `userRole as "CUSTOMER" | "ADMIN" | "TAILOR"`.
- **Custom Security Envelope Codes**: Direct bypass attempts are met with a `403 Forbidden` response and custom type `GATEWAY_BYPASS_DETECTED` (code: 403). Missing identity headers on a protected route result in a `401 Unauthorized` response with type `AUTHENTICATION_FAILED` (code: 401).
