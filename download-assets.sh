#!/usr/bin/env bash
# ============================================================
# download-assets.sh
#
# Downloads the two REAL client assets from mushindojo.net into
# assets/. Everything else on their current site is Unsplash
# stock photography (already wired into index.html directly) —
# these are the only two files actually worth pulling from them.
#
# Run this from inside the dojo-site/ folder:
#   bash download-assets.sh
#
# index.html already looks for these files first and falls back
# gracefully (a text logo glyph / an Unsplash photo) if they're
# not there yet — so it's safe to run this whenever, and the
# site upgrades itself automatically once the files land.
# ============================================================
set -e

mkdir -p assets

echo "Téléchargement du logo..."
curl -L -f -o assets/logo.png "https://mushindojo.net/wp-content/uploads/2026/06/mushin.png" \
  && echo "  -> assets/logo.png" \
  || echo "  -> ÉCHEC : le logo n'a pas pu être téléchargé (voir note ci-dessous)"

echo "Téléchargement de la photo du séminaire..."
curl -L -f -o assets/seminaire-sensei-ralph.jpg "https://mushindojo.net/wp-content/uploads/2026/06/photo-seminaire-Sensei-Ralph.jpg" \
  && echo "  -> assets/seminaire-sensei-ralph.jpg" \
  || echo "  -> ÉCHEC : la photo n'a pas pu être téléchargée (voir note ci-dessous)"

echo ""
echo "Terminé. Vérifie les fichiers dans assets/."
echo ""
echo "Si un téléchargement a échoué : leur hébergeur (Hostinger) bloque"
echo "parfois le téléchargement direct par un outil comme curl, même si"
echo "l'image s'affiche bien dans un navigateur. Dans ce cas, ouvre"
echo "l'URL dans ton navigateur, clic droit -> 'Enregistrer l'image sous...',"
echo "et sauvegarde-la manuellement sous le même nom dans le dossier assets/."
