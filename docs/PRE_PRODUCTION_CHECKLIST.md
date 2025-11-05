# FarmaDisplay - Pre-Production Checklist

## Version: 1.0.0
## Date: 2025-11-05

This comprehensive checklist ensures all systems are ready for production deployment.

---

## 📋 Infrastructure Readiness

### DNS & Domain
- [ ] Domain name registered
- [ ] DNS records configured (A, AAAA, CNAME)
- [ ] Subdomain configured (api.farmadisplay.com, display.farmadisplay.com)
- [ ] TTL values appropriate (3600s recommended)
- [ ] DNS propagation verified (nslookup, dig)

### SSL/TLS Certificates
- [ ] SSL certificate installed (Let's Encrypt or commercial)
- [ ] Certificate auto-renewal configured
- [ ] Certificate expiration monitoring set up
- [ ] TLS 1.2+ enforced
- [ ] SSL Labs test passed (Grade A)
- [ ] Certificate chain complete

### Web Server (nginx/Apache)
- [ ] Reverse proxy configured
- [ ] HTTP to HTTPS redirect enabled
- [ ] HSTS header configured
- [ ] Gzip/Brotli compression enabled
- [ ] Static file caching configured
- [ ] Upload size limits configured
- [ ] Rate limiting enabled
- [ ] Security headers added

### Firewall & Network
- [ ] UFW/iptables configured
- [ ] Ports opened: 80 (HTTP), 443 (HTTPS), 22 (SSH - restricted)
- [ ] Unnecessary ports closed
- [ ] Fail2ban configured (SSH protection)
- [ ] DDoS protection enabled (CloudFlare, AWS Shield)
- [ ] IP whitelisting for admin access (optional)

### Server Resources
- [ ] CPU: Minimum 2 cores
- [ ] RAM: Minimum 4GB
- [ ] Disk: Minimum 50GB SSD
- [ ] Bandwidth: Minimum 100Mbps
- [ ] Load balancing configured (if multi-server)
- [ ] Auto-scaling configured (if cloud)

### Database
- [ ] PostgreSQL 15+ installed
- [ ] PostGIS extension enabled
- [ ] Database user created (not superuser)
- [ ] Strong password set
- [ ] Remote access restricted
- [ ] Connection pooling configured (pgBouncer)
- [ ] Backup schedule configured (daily minimum)
- [ ] Backup retention policy defined (30 days minimum)
- [ ] Backup restoration tested
- [ ] Database monitoring enabled

### Monitoring & Logging
- [ ] Uptime monitoring (UptimeRobot, Pingdom)
- [ ] Performance monitoring (New Relic, DataDog)
- [ ] Error tracking (Sentry, Rollbar)
- [ ] Log aggregation (ELK, Loki, CloudWatch)
- [ ] Disk space monitoring
- [ ] Memory usage monitoring
- [ ] CPU usage monitoring
- [ ] Database performance monitoring
- [ ] Alert thresholds configured
- [ ] On-call schedule defined

---

## 🔧 Backend Deployment

### Environment Configuration
- [ ] `.env` file created (not .env.example)
- [ ] `SECRET_KEY` generated (strong, random, 64+ chars)
- [ ] `DATABASE_URL` configured
- [ ] `ALLOWED_ORIGINS` restricted (not "*")
- [ ] `DEBUG=False` in production
- [ ] `LOG_LEVEL=INFO` or higher
- [ ] Email SMTP settings configured (if applicable)
- [ ] Third-party API keys configured
- [ ] Redis URL configured (if caching enabled)

### Application Setup
- [ ] Python 3.11+ installed
- [ ] Virtual environment created
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] Database migrations applied (`alembic upgrade head`)
- [ ] Initial admin user created
- [ ] Test data loaded (optional, staging only)
- [ ] Static files collected (if applicable)
- [ ] Logs directory created with permissions

### API Configuration
- [ ] CORS origins restricted to production domains
- [ ] Rate limiting enabled (100 req/min default)
- [ ] JWT expiration configured (24 hours)
- [ ] Password hashing verified (bcrypt, cost 12)
- [ ] Input validation enabled (Pydantic)
- [ ] Error messages sanitized (no stack traces)
- [ ] API versioning enabled (/api/v1)
- [ ] Health check endpoint working (`/health`)

### Security
- [ ] SQL injection protection verified (ORM)
- [ ] XSS protection enabled (input sanitization)
- [ ] CSRF protection enabled (for cookies)
- [ ] Security headers configured (see checklist)
- [ ] Secrets not in source code (verified)
- [ ] Git secrets scanner run (`git secrets --scan`)
- [ ] Bandit security scan passed
- [ ] Safety dependency scan passed

### Process Management
- [ ] Systemd service file created
- [ ] Gunicorn/Uvicorn workers configured (2-4x CPU cores)
- [ ] Process restart on failure enabled
- [ ] Log rotation configured
- [ ] Service auto-start on boot enabled
- [ ] Service status verified (`systemctl status farmadisplay-api`)

---

## 🎨 Frontend Deployment

### Build Process
- [ ] Production build created (`npm run build`)
- [ ] Build errors resolved
- [ ] Build warnings reviewed
- [ ] Bundle size optimized (<500KB main bundle)
- [ ] Source maps disabled or external
- [ ] Tree shaking verified
- [ ] Code splitting configured
- [ ] Unused dependencies removed

### Environment Configuration
- [ ] `VITE_API_URL` set to production API
- [ ] `VITE_ENVIRONMENT=production` set
- [ ] Google Analytics ID configured (if applicable)
- [ ] Feature flags configured
- [ ] Third-party service keys configured

### Static File Hosting
- [ ] Build files uploaded to server
- [ ] Static files served with caching headers
- [ ] Gzip/Brotli compression enabled
- [ ] CDN configured (optional: CloudFlare, AWS CloudFront)
- [ ] 404 page configured (SPA routing)
- [ ] robots.txt configured
- [ ] sitemap.xml generated (if SEO important)

### PWA Configuration
- [ ] Service Worker registered
- [ ] manifest.json configured
- [ ] App icons generated (192x192, 512x512)
- [ ] Offline fallback configured
- [ ] Cache strategy verified
- [ ] PWA installable (tested)

### Performance
- [ ] Lighthouse audit passed (>90% all categories)
- [ ] First Contentful Paint <2s
- [ ] Largest Contentful Paint <2.5s
- [ ] Cumulative Layout Shift <0.1
- [ ] Time to Interactive <3.5s
- [ ] Page load time <3s (tested on 4G)

---

## 📺 Display Page Deployment

### Standalone Deployment
- [ ] Display page accessible via URL
- [ ] Pharmacy ID parameter working (`?id=123`)
- [ ] Load time <2 seconds verified
- [ ] Bundle size <10KB verified
- [ ] Service Worker caching working
- [ ] Offline mode tested (24-hour cache)

### Display Features
- [ ] Real-time clock updating (1s interval)
- [ ] Date in Italian format displayed
- [ ] Pharmacy information loading
- [ ] Current shifts displayed
- [ ] Active shift highlighted (pulse animation)
- [ ] Nearby pharmacies showing (PostGIS 5km)
- [ ] Distance in kilometers displayed
- [ ] Messages carousel working (if data available)
- [ ] QR code placeholder visible
- [ ] Offline indicator working

### Visual Design
- [ ] Glassmorphic design rendering correctly
- [ ] Purple gradient background displaying
- [ ] Backdrop blur effects working
- [ ] Responsive layout verified (1920x1080, 1280x720)
- [ ] Fonts loading correctly
- [ ] No layout shifts on load

### Auto-Refresh
- [ ] API fetching every 60 seconds verified
- [ ] No memory leaks (tested for 24 hours)
- [ ] Error handling on network failure
- [ ] Automatic reconnection working

---

## 🔴 Device (Raspberry Pi) Deployment

### Hardware Setup
- [ ] Raspberry Pi Zero 2 W (or compatible)
- [ ] MicroSD card 8GB+ (Class 10)
- [ ] Power supply 5V 2.5A
- [ ] HDMI display connected
- [ ] Ethernet adapter (optional)
- [ ] Case with ventilation

### FullPageOS Installation
- [ ] FullPageOS image downloaded
- [ ] Image flashed to SD card (Balena Etcher)
- [ ] WiFi configured in `fullpageos-wpa-supplicant.txt`
- [ ] Display URL configured in `fullpageos.txt`
- [ ] Chromium flags optimized
- [ ] First boot completed (5-10 minutes)

### Network Configuration
- [ ] Ethernet connection tested (if available)
- [ ] WiFi connection tested
- [ ] Static IP configured (optional)
- [ ] Network healing daemon installed
- [ ] Auto-reconnect working (tested)
- [ ] Ethernet/WiFi fallback working

### FarmaDisplay Scripts
- [ ] Installation script run (`sudo ./install.sh`)
- [ ] Network healing daemon running
- [ ] Bluetooth WiFi config server running
- [ ] Memory watchdog running
- [ ] All systemd services enabled
- [ ] Service logs verified (`tail -f /var/log/farmadisplay-*.log`)

### Device Registration
- [ ] Device ID created in admin panel
- [ ] Serial number recorded
- [ ] Pharmacy assigned
- [ ] Device status "active"
- [ ] Heartbeat working (5-minute interval)
- [ ] Last seen timestamp updating

### Security
- [ ] Default password changed (`passwd`)
- [ ] SSH key-based authentication configured (recommended)
- [ ] Unnecessary services disabled (avahi, bluetooth if not used)
- [ ] Firewall configured (UFW)
- [ ] Automatic security updates enabled
- [ ] SSH restricted to key-based or disabled

### Testing
- [ ] Display page loading correctly
- [ ] Clock updating in real-time
- [ ] Data refreshing every 60 seconds
- [ ] Offline mode tested (disconnect network)
- [ ] Memory usage <450MB (verified with `free -m`)
- [ ] No memory leaks (24-hour test)
- [ ] Chromium not crashing (48-hour test)
- [ ] Watchdog restart working (if memory exceeds 90%)

---

## 🔐 Security Checklist

### Authentication & Authorization
- [ ] JWT tokens working
- [ ] Token expiration enforced (24 hours)
- [ ] Password hashing verified (bcrypt cost 12)
- [ ] Strong password policy enforced
- [ ] Admin/User roles working
- [ ] Protected routes require authentication
- [ ] Authorization checks on all endpoints
- [ ] Session management secure

### Critical Security Fixes (MUST DO)
- [ ] ⚠️ npm audit vulnerabilities resolved (16 found)
- [ ] ⚠️ Account lockout implemented (5 attempts, 15-min lockout)
- [ ] ⚠️ Security headers added (all 6 headers)
- [ ] ⚠️ Comprehensive security logging implemented
- [ ] ⚠️ Automated vulnerability scanning enabled

### Security Headers (Required)
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Strict-Transport-Security: max-age=31536000
- [ ] Content-Security-Policy: configured
- [ ] Referrer-Policy: strict-origin-when-cross-origin

### OWASP Top 10 Compliance
- [ ] 1. Broken Access Control: ✅ Mitigated
- [ ] 2. Cryptographic Failures: ✅ Mitigated
- [ ] 3. Injection: ✅ Mitigated
- [ ] 4. Insecure Design: ⚠️ Partial (needs lockout, MFA)
- [ ] 5. Security Misconfiguration: ⚠️ Partial (needs headers)
- [ ] 6. Vulnerable Components: ⚠️ Partial (needs fixes)
- [ ] 7. Auth Failures: ✅ Mitigated
- [ ] 8. Data Integrity: ✅ Mitigated
- [ ] 9. Logging Failures: ⚠️ Partial (needs logging)
- [ ] 10. SSRF: ✅ Mitigated

### Security Scanning
- [ ] Backend: `bandit -r backend/app/` passed
- [ ] Backend: `safety check` passed
- [ ] Frontend: `npm audit` clean or acceptable risks
- [ ] Git secrets: `git secrets --scan` clean
- [ ] SSL test: SSL Labs Grade A
- [ ] OWASP ZAP scan completed (no high-severity issues)

---

## 🧪 Testing Checklist

### Backend Tests
- [ ] Unit tests passing (`pytest tests/`)
- [ ] Integration tests passing
- [ ] Performance tests passing (`pytest tests/test_performance.py`)
- [ ] Code coverage >70%
- [ ] All API endpoints tested
- [ ] Error handling tested
- [ ] Database queries optimized

### Frontend Tests
- [ ] E2E tests passing - 59 tests (`npm run test:e2e`)
- [ ] All browsers tested (Chrome, Firefox, Mobile)
- [ ] Authentication flow tested
- [ ] CRUD operations tested (pharmacies, shifts, devices)
- [ ] Error states tested
- [ ] Loading states tested
- [ ] Responsive design tested

### Performance Tests
- [ ] API response times <500ms (all endpoints)
- [ ] Database queries <200ms
- [ ] Concurrent load tested (50 requests)
- [ ] Display page load <2 seconds
- [ ] Lighthouse score >90% (all categories)
- [ ] Memory usage acceptable
- [ ] No memory leaks

### Integration Tests
- [ ] End-to-end user workflows tested
- [ ] Display page integration tested
- [ ] Device heartbeat tested
- [ ] PostGIS nearby queries tested
- [ ] Offline mode tested
- [ ] Auto-refresh tested

### Smoke Tests (Production)
- [ ] Homepage loads
- [ ] Login works
- [ ] Dashboard loads
- [ ] API health check (`/health`) returns 200
- [ ] Database connection working
- [ ] Display page loads with data
- [ ] Device heartbeat received

---

## 📚 Documentation Checklist

### Technical Documentation
- [ ] README.md complete with quick start
- [ ] API documentation complete (endpoints, examples)
- [ ] Architecture diagram created
- [ ] Database schema documented
- [ ] Deployment guide created
- [ ] Environment variables documented
- [ ] Troubleshooting guide created

### User Documentation
- [ ] User manual created
- [ ] Admin guide created
- [ ] FAQ document created
- [ ] Video tutorials (optional)
- [ ] Support contact information

### Operational Documentation
- [ ] Runbook created (incident response)
- [ ] Backup and restore procedures
- [ ] Scaling guide
- [ ] Monitoring and alerting guide
- [ ] Security incident response plan
- [ ] Disaster recovery plan

### Code Documentation
- [ ] Inline comments for complex logic
- [ ] Function/method docstrings
- [ ] Type hints (TypeScript, Python)
- [ ] README in each major directory
- [ ] Changelog maintained

---

## 🚀 Deployment Process

### Pre-Deployment
- [ ] Code review completed
- [ ] All tests passing
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Release notes prepared

### Deployment Steps
1. [ ] Create backup of production database
2. [ ] Tag release in Git (`git tag v1.0.0`)
3. [ ] Build production artifacts
4. [ ] Deploy backend (blue-green or rolling)
5. [ ] Run database migrations
6. [ ] Deploy frontend (CDN, static hosting)
7. [ ] Deploy display page
8. [ ] Update Raspberry Pi devices (OTA or manual)
9. [ ] Verify health checks
10. [ ] Run smoke tests
11. [ ] Monitor error rates
12. [ ] Monitor performance metrics

### Post-Deployment
- [ ] Smoke tests passed
- [ ] Health checks passing
- [ ] Error rate normal (<1%)
- [ ] Response times normal
- [ ] User acceptance testing (UAT)
- [ ] Monitoring dashboards reviewed
- [ ] Rollback plan ready (if needed)
- [ ] Support team notified
- [ ] Users notified (if breaking changes)

---

## 🔄 Rollback Plan

### Rollback Triggers
- [ ] Critical security vulnerability discovered
- [ ] Error rate >5%
- [ ] Response time degradation >50%
- [ ] Data corruption detected
- [ ] Major functionality broken

### Rollback Steps
1. [ ] Notify team
2. [ ] Stop new deployments
3. [ ] Revert to previous Git tag
4. [ ] Restore database from backup (if schema changed)
5. [ ] Redeploy previous version
6. [ ] Verify services restored
7. [ ] Investigate root cause
8. [ ] Document incident

---

## 📞 Support & Contacts

### Emergency Contacts
- [ ] On-call engineer: _________________
- [ ] Backup engineer: _________________
- [ ] Database admin: _________________
- [ ] Security contact: _________________

### Service Contacts
- [ ] Hosting provider support
- [ ] Domain registrar support
- [ ] SSL certificate provider
- [ ] Payment processor (if applicable)

### Communication Channels
- [ ] Status page URL: _________________
- [ ] Incident Slack/Discord channel
- [ ] Support email: support@farmadisplay.com
- [ ] Emergency phone: _________________

---

## ✅ Final Verification

### Critical Path Testing
- [ ] User can register/login
- [ ] Admin can create pharmacy
- [ ] Admin can create shift
- [ ] Admin can create device
- [ ] Display page shows correct data
- [ ] Device heartbeat updates
- [ ] Offline mode works
- [ ] Auto-refresh works

### Performance Verification
- [ ] Page load times acceptable
- [ ] API response times acceptable
- [ ] Database query times acceptable
- [ ] No bottlenecks identified

### Security Verification
- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] Authentication working
- [ ] Authorization working
- [ ] No secrets in logs
- [ ] Error messages sanitized

### Monitoring Verification
- [ ] Uptime monitoring active
- [ ] Error tracking active
- [ ] Performance monitoring active
- [ ] Alerts configured
- [ ] Dashboards accessible

---

## 🎉 Production Launch

### Go-Live Decision
- [ ] All critical items checked
- [ ] All HIGH priority issues resolved
- [ ] Stakeholders approved
- [ ] Support team ready
- [ ] Rollback plan documented

### Launch
- [ ] Go-live time scheduled (off-peak hours recommended)
- [ ] Team on standby
- [ ] Monitoring dashboards open
- [ ] Launch executed
- [ ] Verification completed
- [ ] Success announced

---

## 📊 Post-Launch Monitoring (First 7 Days)

### Daily Checks
- [ ] Error rates (<1%)
- [ ] Response times (<500ms p95)
- [ ] Uptime (>99.9%)
- [ ] User feedback reviewed
- [ ] Log files reviewed
- [ ] Database performance

### Issues Tracker
- [ ] Critical issues: 0
- [ ] High priority issues: __
- [ ] Medium priority issues: __
- [ ] Low priority issues: __

---

**Checklist Completed By**: _________________
**Date**: _________________
**Approved By**: _________________
**Production Launch Date**: _________________

**Status**: ⚠️ READY AFTER SECURITY FIXES

---

## Quick Reference - Must Fix Before Production

1. ⚠️ **npm audit fix** - Resolve 16 vulnerabilities
2. ⚠️ **Add security headers** - All 6 headers required
3. ⚠️ **Implement account lockout** - Prevent brute force
4. ⚠️ **Complete security logging** - All auth events
5. ⚠️ **Change Raspberry Pi password** - Security risk

**Estimated Time**: 2-3 hours
**Production Ready After Fixes**: ✅ YES
