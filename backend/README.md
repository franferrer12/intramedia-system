# Force backend redeploy domingo, 12 de octubre de 2025, 21:17:06 CEST
# Security fixed: permitAll for POS authentication endpoints
# Force redeploy: domingo, 12 de octubre de 2025, 23:39:28 CEST
# CRITICAL FIX: Enable anonymous authentication for public endpoints - 23:47 CEST
# ULTIMATE FIX: Separate SecurityFilterChain for /public/** with @Order(1) - 23:50 CEST
# DEFINITIVE FIX: WebSecurityCustomizer with web.ignoring() - bypasses Spring Security completely - 00:05 CEST
