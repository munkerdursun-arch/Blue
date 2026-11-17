#!/bin/bash
# =============================================================================
# Fabrique Born.ipa pour un outil de réinstallation automatique (AltStore…).
# Usage (Terminal, depuis ce dossier) :   bash make-ipa.sh
#
# Prérequis : avoir déjà installé une fois l'appli avec Xcode (setup-mac.sh + ▶︎),
# pour que l'équipe de signature soit enregistrée dans BornWidgets.xcodeproj.
# Ne relance pas « xcodegen generate » avant ce script : cela effacerait l'équipe choisie.
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")"

[[ "$(uname)" == "Darwin" ]] || { echo "À lancer sur le Mac."; exit 1; }
[[ -d BornWidgets.xcodeproj ]] || { echo "Projet absent : lance d'abord bash setup-mac.sh"; exit 1; }

rm -rf build Payload Born.ipa
echo "➜ Compilation (2 à 5 min)…"
xcodebuild -project BornWidgets.xcodeproj -scheme BornWidgets -configuration Release \
  -sdk iphoneos -destination 'generic/platform=iOS' -derivedDataPath build \
  -allowProvisioningUpdates -quiet build

APP="build/Build/Products/Release-iphoneos/BornWidgets.app"
[[ -d "$APP" ]] || { echo "✘ Appli compilée introuvable ($APP)"; exit 1; }
[[ -d "$APP/PlugIns" ]] || echo "⚠ L'extension des widgets n'est pas dans l'appli : vérifie la cible BornWidgetsExtension."

mkdir Payload
cp -R "$APP" Payload/
zip -qry Born.ipa Payload
rm -rf Payload
echo "✔ Fichier prêt : $(pwd)/Born.ipa"
echo "  Envoie-le sur l'iPhone (AirDrop → Fichiers), puis ouvre-le depuis AltStore › Mes apps › +."
open -R Born.ipa
