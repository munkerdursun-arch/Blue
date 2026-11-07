#!/bin/bash
# =============================================================================
# Installation automatique des widgets Born sur Mac.
# Usage (dans le Terminal, depuis ce dossier) :   bash setup-mac.sh
#
# Ce que le script fait : vérifie Xcode, installe Homebrew et XcodeGen si besoin,
# personnalise l'identifiant de l'appli, génère et ouvre le projet Xcode.
# Ce qu'il ne peut pas faire à ta place : installer Xcode (App Store), te connecter
# à ton compte Apple, choisir l'équipe de signature, brancher et autoriser l'iPhone.
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")"

ok()   { printf "\033[32m✔ %s\033[0m\n" "$1"; }
info() { printf "\033[36m➜ %s\033[0m\n" "$1"; }
stop() { printf "\033[31m✘ %s\033[0m\n" "$1"; exit 1; }

[[ "$(uname)" == "Darwin" ]] || stop "Ce script doit être lancé sur un Mac."

# 1. Xcode -------------------------------------------------------------------
if [[ ! -d /Applications/Xcode.app ]]; then
  info "Xcode n'est pas installé. Ouverture de l'App Store…"
  open "macappstore://apps.apple.com/app/xcode/id497799835" || true
  stop "Installe Xcode, ouvre-le une fois (accepte la licence), puis relance : bash setup-mac.sh"
fi
if [[ "$(xcode-select -p 2>/dev/null)" != /Applications/Xcode.app/* ]]; then
  info "Sélection de Xcode comme outil de développement (mot de passe du Mac demandé)…"
  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
fi
if ! xcodebuild -checkFirstLaunchStatus >/dev/null 2>&1; then
  info "Finalisation de l'installation de Xcode (mot de passe du Mac demandé)…"
  sudo xcodebuild -license accept
  sudo xcodebuild -runFirstLaunch
fi
ok "Xcode prêt : $(xcodebuild -version | head -1)"

# 2. Homebrew + XcodeGen -----------------------------------------------------------
if ! command -v brew >/dev/null 2>&1; then
  for p in /opt/homebrew/bin/brew /usr/local/bin/brew; do [[ -x $p ]] && eval "$($p shellenv)"; done
fi
if ! command -v brew >/dev/null 2>&1; then
  info "Installation de Homebrew (gestionnaire de paquets)…"
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  for p in /opt/homebrew/bin/brew /usr/local/bin/brew; do [[ -x $p ]] && eval "$($p shellenv)"; done
fi
command -v xcodegen >/dev/null 2>&1 || { info "Installation de XcodeGen…"; brew install xcodegen; }
ok "XcodeGen prêt"

# 3. Identifiant unique de l'appli ---------------------------------------------------
if grep -q "com.tonprenom.bornwidgets" project.yml; then
  default_id="com.$(id -un | tr -cd '[:alnum:]' | tr '[:upper:]' '[:lower:]').bornwidgets"
  read -r -p "Identifiant de l'appli [$default_id] : " bundle_id
  bundle_id="${bundle_id:-$default_id}"
  [[ "$bundle_id" =~ ^[a-z0-9]+(\.[a-z0-9-]+)+$ ]] || stop "Identifiant invalide (ex. com.munker.bornwidgets)."
  sed -i '' "s/com\.tonprenom\.bornwidgets/$bundle_id/" project.yml
  ok "Identifiant : $bundle_id"
else
  ok "Identifiant déjà personnalisé : $(grep BUNDLE_ID_BASE: project.yml | awk '{print $2}')"
fi

# 4. Génération et ouverture du projet ----------------------------------------------
xcodegen generate
ok "Projet généré"
open BornWidgets.xcodeproj

cat <<'EOF'

──────────────── Il reste 4 gestes à faire toi-même ────────────────
1. Xcode › Settings › Accounts : ajoute ton identifiant Apple (si pas déjà fait).
2. Clique sur le projet « BornWidgets » (colonne de gauche), puis pour CHAQUE cible
   (BornWidgets ET BornWidgetsExtension) : onglet « Signing & Capabilities »
   → coche « Automatically manage signing » → choisis ton Team.
3. Branche l'iPhone, déverrouille-le, accepte « Faire confiance ».
   Sur l'iPhone : Réglages › Confidentialité et sécurité › Mode développeur → activer.
4. En haut de Xcode, choisis ton iPhone puis clique sur ▶︎ (Run).
   Ensuite sur l'iPhone : Réglages › Général › CarPlay › ta Born › Widgets.
──────────────────────────────────────────────────────────────────────
En cas d'erreur, copie le message rouge de Xcode et envoie-le moi.
EOF
