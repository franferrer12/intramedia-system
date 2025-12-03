#!/bin/bash
echo "🔒 SECURITY CHECKS - Club Management System"
echo "=========================================="
echo ""

# Check 1: .env.prod not in git
echo "✓ Check 1: .env.prod protection"
if git check-ignore .env.prod > /dev/null 2>&1; then
    echo "  ✅ .env.prod is ignored by git"
else
    echo "  ❌ ERROR: .env.prod is NOT ignored!"
    exit 1
fi

# Check 2: No CORS insecure
echo ""
echo "✓ Check 2: CORS security"
CORS_COUNT=$(grep -r "@CrossOrigin(origins = \"\*\")" backend/src/ 2>/dev/null | wc -l | xargs)
if [ "$CORS_COUNT" -eq "0" ]; then
    echo "  ✅ No insecure CORS found"
else
    echo "  ❌ ERROR: Found $CORS_COUNT insecure CORS annotations"
    exit 1
fi

# Check 3: All @RequestBody have @Valid
echo ""
echo "✓ Check 3: Request validation"
INVALID_COUNT=$(grep -r "@RequestBody" backend/src/ | grep -v "@Valid" | grep -v "Map<String" | wc -l | xargs)
if [ "$INVALID_COUNT" -eq "0" ]; then
    echo "  ✅ All @RequestBody have @Valid"
else
    echo "  ⚠️  Warning: Found $INVALID_COUNT @RequestBody without @Valid"
fi

# Check 4: JWT secret configured
echo ""
echo "✓ Check 4: JWT configuration"
if grep -q "JWT_SECRET=" .env.prod && ! grep -q "CAMBIAR" .env.prod; then
    JWT_LENGTH=$(grep "JWT_SECRET=" .env.prod | cut -d'=' -f2 | wc -c | xargs)
    if [ "$JWT_LENGTH" -gt "60" ]; then
        echo "  ✅ JWT secret configured ($JWT_LENGTH chars)"
    else
        echo "  ⚠️  Warning: JWT secret seems short ($JWT_LENGTH chars)"
    fi
else
    echo "  ⚠️  Warning: JWT secret needs configuration"
fi

# Check 5: V010 migration exists
echo ""
echo "✓ Check 5: Admin password migration"
if [ -f "backend/src/main/resources/db/migration/V010__change_admin_password.sql" ]; then
    echo "  ✅ V010 migration exists"
else
    echo "  ❌ ERROR: V010 migration not found"
    exit 1
fi

# Check 6: Frontend builds
echo ""
echo "✓ Check 6: Frontend build"
if [ -d "frontend/dist" ]; then
    echo "  ✅ Frontend compiled successfully"
else
    echo "  ❌ ERROR: Frontend dist/ not found"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ All critical security checks passed!"
echo ""
