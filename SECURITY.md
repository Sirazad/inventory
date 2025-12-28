# Security Considerations

## Security Summary

This application implements several security measures, but as with any web application, there are important security considerations to understand before deploying to production.

## Implemented Security Measures

### 1. Authentication & Authorization
- **JWT-based authentication**: Stateless authentication using JSON Web Tokens
- **Password encryption**: All passwords are encrypted using BCrypt before storage
- **Token expiration**: JWT tokens expire after 24 hours (configurable)
- **Protected endpoints**: All API endpoints except registration and login require authentication
- **JWT Secret Key**: Uses HS512 algorithm with a 520-bit secret key (exceeds the required 512-bit minimum)

### 2. Database Security
- **SQL Injection protection**: JPA/Hibernate parameterized queries prevent SQL injection
- **Password hashing**: BCrypt with automatic salt generation
- **Credential separation**: Database credentials configured via environment variables

### 3. Input Validation
- **Backend validation**: Jakarta Validation annotations on DTOs
- **Frontend validation**: HTML5 form validation and TypeScript type checking

## Security Vulnerabilities & Mitigations

### CSRF Protection (Disabled)
**Status**: CSRF protection is intentionally disabled for this REST API.

**Rationale**: 
- This is a stateless REST API using JWT tokens stored in localStorage
- CSRF attacks primarily target session-based authentication with cookies
- JWTs in localStorage are not automatically sent with requests, making traditional CSRF attacks ineffective

**Risk**: 
- While immune to CSRF, JWTs in localStorage are vulnerable to XSS attacks
- If an attacker can inject malicious scripts, they can steal the JWT token

**Mitigation for Production**:
1. Implement Content Security Policy (CSP) headers
2. Use HttpOnly, Secure cookies for token storage instead of localStorage
3. Enable CSRF protection when using cookie-based token storage
4. Implement proper input sanitization to prevent XSS

### Known Limitations

1. **Token Storage**
   - Current: Tokens stored in browser localStorage
   - Risk: Vulnerable to XSS attacks
   - Recommendation: Use HttpOnly, Secure cookies in production

2. **CORS Configuration**
   - Current: Allows localhost:3000
   - Risk: May be too permissive
   - Recommendation: Configure proper origins for production environment

3. **Error Messages**
   - Current: Generic error messages
   - Risk: Some internal details may leak in stack traces
   - Recommendation: Implement proper error handling and logging

4. **Rate Limiting**
   - Current: Not implemented
   - Risk: Vulnerable to brute force attacks
   - Recommendation: Implement rate limiting on authentication endpoints

5. **HTTPS**
   - Current: HTTP only
   - Risk: Credentials and tokens sent in plaintext
   - Recommendation: **Required** for production - use HTTPS/TLS

## Production Security Checklist

Before deploying to production, ensure:

- [ ] Change default database credentials
- [ ] Use a strong, unique JWT secret (minimum 512 bits for HS512 algorithm)
- [ ] Enable HTTPS/TLS for all connections
- [ ] Implement rate limiting on authentication endpoints
- [ ] Set up proper CORS origins (remove localhost)
- [ ] Implement Content Security Policy headers
- [ ] Add security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- [ ] Set up monitoring and alerting for security events
- [ ] Implement proper logging (without sensitive data)
- [ ] Regular security updates for all dependencies
- [ ] Database backups and disaster recovery plan
- [ ] Consider moving JWT storage to HttpOnly cookies
- [ ] Implement refresh token mechanism
- [ ] Add account lockout after failed login attempts
- [ ] Implement password strength requirements
- [ ] Add email verification for new accounts
- [ ] Consider implementing 2FA for sensitive operations

## Dependency Security

Run regular security audits:

```bash
# Frontend
cd frontend
npm audit

# Backend
cd backend
mvn dependency-check:check
```

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:
1. Do not open a public issue
2. Contact the maintainers directly
3. Provide detailed information about the vulnerability
4. Allow time for the issue to be addressed before public disclosure

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [Spring Security Documentation](https://docs.spring.io/spring-security/reference/)
