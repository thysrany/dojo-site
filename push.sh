#!/usr/bin/env bash
# ============================================================
# push.sh — commit and push whatever has changed in this folder
#
# Usage (from inside dojo-site/):
#   bash push.sh "Message décrivant le changement"
#
# If you don't pass a message, it uses a default one.
# ============================================================
set -e
MSG="${1:-Mise à jour du site}"

git add .
git commit -m "$MSG"
git push

echo ""
echo "Poussé sur GitHub avec le message : \"$MSG\""
echo "GitHub Pages va publier ce changement automatiquement dans les prochaines minutes."
