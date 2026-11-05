# Born · widgets CarPlay

Appli iPhone + 4 widgets qui s'affichent **directement sur l'écran de la Cupra Born
via CarPlay** (écran des widgets, iOS 26 ou plus récent). Aucun appareil en plus.

## Les 4 widgets (et pourquoi ceux-là)

L'écran de la Born affiche déjà la batterie et l'autonomie *réelles*. Les widgets
apportent donc surtout ce que la voiture **ne montre pas** :

| Widget | Ce qu'il affiche | Pourquoi c'est utile |
|---|---|---|
| **Autonomie** | Km estimés, %, perte due au froid | L'autonomie annoncée chute l'hiver : le widget l'ajuste selon la température extérieure |
| **Charge** | % estimé en direct, heure de fin, coût | La voiture ne donne pas le **coût** de la charge |
| **Météo & route** | Température, **risque de verglas**, effet sur l'autonomie | Sécurité et anticipation sur un trajet |
| **Budget du mois** | € et kWh rechargés, coût aux 100 km | Suivi des dépenses, inexistant dans la voiture |

> **Limite importante :** CarPlay ne donne pas accès aux données de la voiture. Le
> niveau de batterie est celui que **tu saisis** (appli ou Siri). Tout le reste est
> **estimé** à partir de cette saisie et de tes réglages.

Mise à jour sans toucher l'iPhone, à la voix :
- « Dis Siri, **batterie dans Born** » → Siri demande le pourcentage
- « Dis Siri, **démarrer une charge dans Born** » (objectif 80 %, borne AC 11 kW par défaut)
- « Dis Siri, **arrêter la charge dans Born** »

Option pratique : dans l'app **Raccourcis** → Automatisation → « CarPlay » → *Se connecte*
→ action « Niveau de batterie (Born) ». Siri te demandera le niveau à chaque départ.

## Installation sur ton iPhone (≈ 20 min la première fois)

### 1. Préparer le Mac
1. Installe **Xcode** depuis l'App Store (gratuit, plusieurs Go). Il faut une version
   compatible avec iOS 27 sur ton iPhone, donc la plus récente.
2. Ouvre Xcode une fois, accepte la licence, puis : Xcode › Settings › Accounts → **+** →
   connecte ton identifiant Apple.
3. Installe **XcodeGen** (génère le projet) dans le Terminal :
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"   # si Homebrew n'est pas installé
   brew install xcodegen
   ```

### 2. Récupérer et générer le projet
```bash
git clone https://github.com/munkerdursun-arch/blue.git
cd blue
git checkout claude/turkish-learning-app-kids-6fkd19
cd born-carplay-widgets
```
Ouvre `project.yml` et remplace **`com.tonprenom.bornwidgets`** par un identifiant à
toi, par exemple `com.munker.bornwidgets` (minuscules, sans espace). Puis :
```bash
xcodegen generate
open BornWidgets.xcodeproj
```

### 3. Signer les deux cibles
Dans Xcode, clique sur le projet (en haut à gauche) puis, **pour chacune des deux cibles**
`BornWidgets` et `BornWidgetsExtension` :
1. Onglet **Signing & Capabilities** → coche *Automatically manage signing* → choisis ton **Team**.
2. Vérifie que la capacité **App Groups** est présente avec `group.com.…bornwidgets`
   cochée. Si elle est rouge, clique sur le bouton de rafraîchissement à côté.

### 4. Installer sur l'iPhone
1. Branche l'iPhone au Mac (câble), déverrouille-le, accepte « Faire confiance ».
2. Sur l'iPhone : Réglages › Confidentialité et sécurité › **Mode développeur** → activer (redémarrage).
3. Dans Xcode, en haut, choisis ton iPhone comme destination, cible `BornWidgets`, puis **▶︎ Run**.
4. Première fois : Réglages › Général › VPN et gestion de l'appareil → fais confiance à ton profil développeur.

### 5. Afficher dans la voiture
1. Ouvre l'appli **Born** : saisis le niveau de batterie, touche « Localiser » (météo),
   vérifie les réglages (capacité, prix).
2. iPhone : Réglages › Général › **CarPlay** › ta Born › **Widgets** → ajoute les widgets « Born ».
3. Dans la voiture, sur l'écran CarPlay, balaie jusqu'à l'écran des widgets.

## Compte gratuit ou payant ?

| | Compte Apple gratuit | Apple Developer Program (99 €/an) |
|---|---|---|
| Installer sur ton iPhone | ✅ | ✅ |
| Durée avant réinstallation | **7 jours** (relancer ▶︎ Run depuis le Mac) | 1 an |
| Capacité App Groups (indispensable pour que les widgets lisent les données) | ⚠️ je ne peux pas confirmer qu'elle est disponible avec un compte gratuit | ✅ |

Si Xcode refuse la capacité App Groups avec ton compte gratuit, le compte payant est
nécessaire. L'appli affiche un avertissement orange si le partage ne fonctionne pas.

## En cas de problème

| Symptôme | Cause probable / solution |
|---|---|
| Erreur de signature | Identifiant pas unique : change `BUNDLE_ID_BASE` dans `project.yml`, relance `xcodegen generate` |
| Les widgets affichent « Batterie non saisie » | App Group non partagé : vérifie l'étape 3.2 sur **les deux** cibles |
| Widgets absents du menu CarPlay | iOS 26+ requis ; lance l'appli une fois ; redémarre l'iPhone |
| Erreur de compilation | Je n'ai pas pu compiler ce code (pas de Mac côté serveur). Envoie-moi le message d'erreur exact et je corrige |
| Siri ne comprend pas la phrase | Lance l'appli une fois après installation ; vérifie dans l'app Raccourcis que les actions « Born » existent |

## Organisation

```
born-carplay-widgets/
├── project.yml            configuration XcodeGen (identifiant à personnaliser)
├── Shared/                code commun appli + widgets
│   ├── Models.swift       données (batterie, charge, météo, historique)
│   ├── Store.swift        stockage partagé (App Group)
│   ├── Estimator.swift    autonomie, effet du froid, courbe et coût de charge
│   └── Weather.swift      météo Open-Meteo (gratuit, sans clé)
├── App/                   appli iPhone
│   ├── ContentView.swift  écran de saisie et de réglages
│   ├── Intents.swift      commandes Siri / Raccourcis
│   └── LocationProvider.swift
└── Widget/                extension WidgetKit (les 4 widgets)
```

Les calculs sont des **approximations** (effet du froid ≈ −1,2 %/°C sous 15 °C,
courbe de charge type). Ajuste la consommation moyenne dans l'appli avec la valeur
affichée par ta voiture pour de meilleures estimations.
