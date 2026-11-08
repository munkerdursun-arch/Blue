# Palettes par domaine

Chaque site a **5 ambiances de chapitre** (à mettre dans `THEMES` de `main.js`) :
`base` (clair) → `chaud` (clair) → `sombre` (contraste, souvent la section projets/réalisations) → `teinté` (clair) → `final` (accent plein écran, contact / inscription).
Le texte reste quasi noir sur les fonds clairs et quasi blanc sur le sombre. Un seul accent vif.
Vérifier le contraste du texte (≥ 4,5:1 pour le texte courant).

| Domaine | base | chaud | sombre | teinté | final / accent | Palette de la sculpture |
|---|---|---|---|---|---|---|
| **Référence studio créatif** | `#f3efe7` crème | `#f0e3d3` sable | `#111116` nuit | `#e7e2f3` lilas | `#ff5b2e` orange | nacre arc-en-ciel |
| **BTP / conducteurs de travaux / chantier** | `#f2f0eb` béton clair | `#efe6d6` sable de carrière | `#14181d` acier nuit | `#e3e8ec` gris bleuté | `#ffb000` jaune chantier (texte `#14181d`) | ambre, orange sécurité, acier bleuté, béton |
| **Formation / éducation** | `#f4f1ea` papier | `#eee6d8` craie chaude | `#141a2b` bleu encre | `#e4ebf3` bleu clair | `#3d5afe` bleu vif ou `#ff6a3d` | bleus, corail, jaune |
| **Santé / bien-être** | `#f2f4ef` lin | `#ebeee3` sauge pâle | `#10201c` vert profond | `#e3eef0` eau | `#2bb38a` vert | menthe, eau, pêche |
| **Finance / juridique / conseil** | `#f3f2ee` ivoire | `#ece8df` pierre | `#0f1418` encre | `#e6e9ee` ardoise | `#1f4fff` bleu roi | or, bleu, argent |
| **Tech / IA / SaaS** | `#f1f0f5` brume | `#ece9f2` lavande pâle | `#0c0d14` espace | `#e4f0f2` cyan pâle | `#6b4dff` violet électrique | cyan, violet, magenta |
| **Restauration / artisanat** | `#f5efe6` farine | `#f0e1cf` croûte | `#1c1410` cacao | `#eee6dc` lin | `#d9482b` terracotta | ocre, tomate, olive |
| **Luxe / mode / beauté** | `#f4f0eb` poudre | `#efe4dc` rose nude | `#121012` noir velours | `#ece6ee` mauve pâle | `#b8865b` bronze | champagne, rose, or |
| **Sport / énergie** | `#f2f3ef` blanc cassé | `#eeeee2` citron pâle | `#0e1110` noir | `#e5eeea` vert pâle | `#d4ff3a` vert acide (texte noir) | lime, cyan, orange |

## Adapter la sculpture au domaine

Dans `scene.js`, la fonction `pal(t)` du shader définit 5 couleurs en boucle (`c0` à `c4`, en RGB 0–1).
Les remplacer par la palette du domaine. Exemple BTP :
`c0=(1.,.69,0.)` jaune chantier, `c1=(1.,.45,.12)` orange sécurité, `c2=(.55,.62,.7)` acier, `c3=(.82,.8,.76)` béton, `c4=(.25,.4,.6)` bleu plan.
Formes conseillées pour le BTP : 3 (cristal, facettes) et 2 (anneaux, strates géologiques), moins la « fleur ».
