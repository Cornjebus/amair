#!/bin/bash
# =============================================================================
# Amari Design System - Legacy Color Guard
# =============================================================================
# This script checks for any usage of deprecated color classes in the codebase.
# Run in CI to prevent accidental regression of legacy colors.
#
# Usage: ./scripts/check-legacy-colors.sh
# Exit codes: 0 = clean, 1 = legacy colors found
# =============================================================================

set -e

echo "🎨 Checking for legacy color usage..."
echo ""

# Define legacy color patterns to check
LEGACY_PATTERNS=(
    "lavender-"
    "skyblue-"
    "peach-"
    "font-playfair"
)

# Directories to check
CHECK_DIRS="app components lib"

# Files to exclude (config files that may reference these for documentation)
# Also exclude layout.tsx and globals.css which define CSS variables (not usage)
EXCLUDE_PATTERNS="--exclude-dir=.next --exclude-dir=node_modules --exclude-dir=.git --exclude=*.md --exclude=check-legacy-colors.sh --exclude=layout.tsx --exclude=globals.css --exclude=tailwind.config.ts"

FOUND_LEGACY=0

for pattern in "${LEGACY_PATTERNS[@]}"; do
    echo "Checking for '$pattern'..."

    # Use grep to find occurrences
    MATCHES=$(grep -r "$pattern" $CHECK_DIRS $EXCLUDE_PATTERNS 2>/dev/null || true)

    if [ -n "$MATCHES" ]; then
        echo "❌ Found legacy pattern '$pattern':"
        echo "$MATCHES" | head -10
        echo ""
        FOUND_LEGACY=1
    else
        echo "✅ No '$pattern' found"
    fi
done

echo ""

if [ $FOUND_LEGACY -eq 1 ]; then
    echo "=========================================="
    echo "❌ LEGACY COLORS DETECTED!"
    echo "=========================================="
    echo ""
    echo "Please migrate to Amari design system colors:"
    echo ""
    echo "  lavender-* → amari-terracotta, amari-sage, or amari-muted"
    echo "  skyblue-*  → amari-sage or amari-terracotta"
    echo "  peach-*    → amari-terracotta or amari-rose"
    echo "  font-playfair → font-display (Fraunces)"
    echo ""
    echo "See: tailwind.config.ts for available Amari colors"
    echo ""
    exit 1
else
    echo "=========================================="
    echo "✅ No legacy colors found!"
    echo "=========================================="
    echo ""
    echo "Codebase is clean and using Amari design system."
    exit 0
fi
