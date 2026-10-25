#!/usr/bin/env python3
"""Génère le livret du mois 1 (novembre 2026) de Nevra en HTML A4.

Usage : python3 generer_2026-11_nevra.py  -> écrit 2026-11_Nevra_mois1.html
Le PDF est ensuite produit par rendre_pdf.cjs (Chromium / Playwright).
Les transcriptions phonétiques reprennent exactement celles du livret de Neyla.
"""
import re
from pathlib import Path

ACCENT = "#A8502E"      # couleur d'accent de Nevra (terre cuite)
TINT = "#F6EAE4"        # même teinte, très claire
OUT = Path(__file__).with_name("2026-11_Nevra_mois1.html")


# ---------------------------------------------------------------- helpers
def tr(word, phon, fr=None):
    """Mot turc + phonétique (+ sens)."""
    s = f'<b class="tk">{word}</b> <span class="ph">« {phon} »</span>'
    return s + (f" = {fr}" if fr else "")


def bigletter(l, note=""):
    """Grande lettre creuse à suivre du doigt puis au crayon."""
    return (f'<div class="bigl"><span>{l}</span><p class="mini">Suis la lettre avec le doigt, '
            f'puis avec un crayon.{note}</p></div>')


def draw(label, h=18):
    return f'<div class="drawbox" style="height:{h}mm"><span>Dessine : <b>{label}</b></span></div>'


def row(*parts):
    return '<div class="wsrow">' + "".join(parts) + "</div>"


SHAPES = ('<div class="shapes"><div><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="none" '
          'stroke="#999" stroke-width="1" stroke-dasharray="3 2"/></svg><span>daire</span></div>'
          '<div><svg viewBox="0 0 40 40"><rect x="4" y="4" width="32" height="32" fill="none" stroke="#999" '
          'stroke-width="1" stroke-dasharray="3 2"/></svg><span>kare</span></div></div>')

# Drapeau à colorier (même dessin que dans le livret de Neyla)
FLAG = (
    '<div class="wsrow"><svg class="flag" viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">'
    '<rect x="1" y="1" width="118" height="78" fill="none" stroke="#333" stroke-width="1"/>'
    '<path d="M56.9,29.3 A20,20 0 1,0 56.9,50.7 A16,16 0 1,1 56.9,29.3 Z" fill="none" stroke="#333" stroke-width="1"/>'
    '<polygon points="57.5,40.0 63.9,37.8 64.1,31.0 68.2,36.4 74.7,34.4 70.8,40.0 74.7,45.6 68.2,43.6 64.1,49.0 63.9,42.2" '
    'fill="none" stroke="#333" stroke-width="1"/></svg><div></div></div>'
)

HOURGLASS = ('<svg class="hg" viewBox="0 0 12 16"><path d="M1 1h10M1 15h10M2 1c0 5 8 5 8 7s-8 2-8 7M10 1c0 5-8 5-8 7s8 2 8 7" '
             f'fill="none" stroke="{ACCENT}" stroke-width="1.3"/></svg>')

# ---------------------------------------------------------------- séquences
# code, jour, titre, durée, matériel, consigne (1 phrase), étapes (2–3), espace, version 3 min, mouvement, à deux (★)
W = {}

W[1] = dict(
    titre="Merhaba !", sous="Dire bonjour", dates="lundi 2 → dimanche 8 novembre",
    lettre="A", nombres="1 à 5", mdp="Merhaba",
    seq=[
        ("1·1", "Lun 2", "Coucou, la peluche !", "5 min", "1 peluche",
         "« Dis Merhaba à la peluche ! »",
         ["La peluche sort de derrière le dos de papa : " + tr("Merhaba !", "mèr-ha-ba", "bonjour") + ".",
          "Nevra répond « Merhaba ! » en faisant coucou de la main.",
          "La peluche repart : " + tr("Hoşça kal !", "hoch-tcha kal", "au revoir") + "."],
         "", "3 coucous-Merhaba avec la peluche, c'est tout.", True, True),
        ("1·2", "Mar 3", "A comme araba", "10 min", "petite voiture, crayon",
         "« Fais rouler la voiture sur le grand A. »",
         ["Papa ouvre grand la bouche : [a]. Nevra imite.",
          "Elle fait rouler la voiture sur le A en disant " + tr("araba", "a-ra-ba", "voiture") + ".",
          "Puis elle suit le A avec le doigt, et avec un crayon si elle en a envie."],
         bigletter("A"), "Rouler 3 fois sur le A en disant « a-ra-ba ».", False, False),
        ("1·3", "Mer 4", "Bir, iki, üç… saute !", "5 min", "aucun",
         "« Saute quand je dis üç ! »",
         ["Papa compte " + tr("bir", "bir", "1") + ", " + tr("iki", "i-ki", "2") + ", "
          + tr("üç", "utch", "3") + " : à üç, Nevra saute.",
          "On inverse : Nevra compte, papa saute."],
         "", "3 sauts en comptant bir, iki, üç.", True, True),
        ("1·4", "Jeu 5", "Je m'appelle Nevra", "5 min", "1 peluche",
         "« Réponds à la peluche : Benim adım Nevra. »",
         ["La peluche demande " + tr("Adın ne ?", "a-deunn nè", "comment tu t'appelles ?"),
          "Nevra répond " + tr("Benim adım Nevra.", "bè-nim a-deum Nevra", "je m'appelle Nevra")
          + ". Papa souffle le début si besoin."],
         "", "Nevra répond seulement « Nevra ! » : ça compte.", False, False),
        ("1·5", "Ven 6", "Zıpla ! Dur !", "5 min", "aucun",
         "« Quand je dis zıpla, tu sautes ; quand je dis dur, tu t'arrêtes. »",
         [tr("zıpla", "zeup-la", "saute") + " · " + tr("dur", "dour", "stop"),
          "Papa alterne lentement, puis plus vite. Nevra devient ensuite la cheffe."],
         "", "3 « zıpla », 1 « dur », et on s'arrête.", True, True),
        ("1·6", "Sam 7", "Merci, papa !", "10 min", "3 fruits ou jouets",
         "« Quand je te donne un fruit, dis teşekkür ederim. »",
         ["Papa donne un fruit. Nevra dit " + tr("Teşekkür ederim !", "tè-chèk-kur è-dè-rim", "merci")
          + ". Papa souffle le début si besoin.",
          "On inverse : Nevra donne, papa remercie."],
         "", "Un seul échange, un seul « teşekkür ederim ».", False, False),
        ("1·7", "Sam 7", "Je marche sur le A", "10 min", "3 rubans ou cordes",
         "« Marche sur le grand A en disant [a]. »",
         ["Papa forme un grand A au sol avec 3 rubans.",
          "Nevra marche dessus en disant [aaa], puis saute à pieds joints au milieu."],
         "", "Une seule traversée du A.", True, False),
        ("1·8", "Dim 8", "Jusqu'à beş", "10 min", "un escalier ou 5 coussins",
         "« Monte une marche à chaque nombre. »",
         ["Monter en comptant : bir, iki, üç, " + tr("dört", "deurt", "4") + ", " + tr("beş", "bèch", "5") + ".",
          "Redescendre en recomptant. Papa dit " + tr("Aferin !", "a-fè-rinn", "bravo") + "."],
         "", "Monter 3 marches en comptant jusqu'à üç.", True, True),
        ("1·9", "Dim 8", "Mes jetons, mon seuil", "10 min", "jetons, bocal, page « Tableau de jetons »",
         "« Choisis ton seuil : combien de jetons veux-tu pour une surprise ? »",
         ["Montrer le bocal : chaque séquence faite = 1 jeton dedans.",
          "Nevra choisit librement son seuil ; papa l'écrit dans « Mon seuil du mois ».",
          "Compter ensemble les jetons de la semaine : bir, iki, üç…"],
         "", "Nevra dit combien de jetons elle veut ; papa l'écrit.", False, False),
    ])

W[2] = dict(
    titre="Ailem", sous="Ma famille", dates="lundi 9 → dimanche 15 novembre",
    lettre="E", nombres="1 à 5", mdp="İyiyim",
    seq=[
        ("2·1", "Lun 9", "Cours vers la photo !", "5 min", "3 photos (maman, papa, la famille), scotch",
         "« Cours toucher la photo de anne ! »",
         ["Scotcher les photos au mur, un peu loin l'une de l'autre.",
          "Papa dit " + tr("anne", "ann-nè", "maman") + " ou " + tr("baba", "ba-ba", "papa")
          + " : Nevra court toucher la bonne photo."],
         "", "2 photos, 2 courses.", True, True),
        ("2·2", "Mar 10", "Le drapeau rouge", "10 min", "crayon rouge",
         "« Colorie le drapeau en rouge. »",
         [tr("kırmızı", "keur-meu-zeu", "rouge") + " · " + tr("beyaz", "bè-yaz", "blanc") + " · "
          + tr("bayrak", "baï-rak", "drapeau"),
          "Pour papa : chaque 10 novembre, la Turquie observe une minute de silence en souvenir d'Atatürk. "
          "Vérifie l'heure exacte sur une source officielle."],
         FLAG, "Montrer 3 choses rouges en disant « kırmızı ».", False, False),
        ("2·3", "Mer 11", "E comme elma", "10 min", "une pomme, crayon",
         "« Fais le mouton : èèè ! »",
         ["Papa fait le mouton [èèè], Nevra imite.",
          "Dire " + tr("elma", "èl-ma", "pomme") + ", puis croquer la pomme.",
          "Suivre le grand E avec le doigt."],
         bigletter("E"), "Dire « elma » et croquer la pomme.", False, False),
        ("2·4", "Jeu 12", "Tape et compte", "5 min", "aucun",
         "« Tape dans tes mains autant de fois que je dis. »",
         ["Papa dit un nombre de 1 à 5 (bir… beş) ; Nevra tape dans ses mains.",
          "On inverse : Nevra dit le nombre, papa tape."],
         "", "Taper jusqu'à üç, une seule fois.", True, True),
        ("2·5", "Ven 13", "Nasılsın ?", "5 min", "1 peluche",
         "« Quand la peluche demande Nasılsın, lève le pouce et dis İyiyim ! »",
         ["La peluche : " + tr("Nasılsın ?", "na-seul-seunn", "comment vas-tu ?"),
          "Nevra lève le pouce et saute : " + tr("İyiyim !", "i-yi-yimm", "je vais bien") + "."],
         "", "Un seul « İyiyim ! » avec le pouce levé.", True, True),
        ("2·6", "Sam 14", "Ma famille", "10 min", "crayons",
         "« Dessine anne et baba. »",
         ["Nevra dessine dans le cadre, papa écrit « anne » et « baba » à côté.",
          "Nevra montre chaque dessin et dit le mot."],
         draw("anne et baba", 30), "Montrer 2 photos en disant « anne », « baba ».", False, False),
        ("2·7", "Sam 14", "Saute sur A ou E", "10 min", "2 feuilles, gros feutre",
         "« Saute sur la lettre que je dis. »",
         ["Écrire A et E en grand sur 2 feuilles posées au sol.",
          "Papa dit [a] ou [è] : Nevra saute sur la bonne feuille. Puis elle donne le son, papa saute."],
         "", "3 sauts, puis on range.", True, False),
        ("2·8", "Dim 15", "Kaç ?", "10 min", "5 petits objets",
         "« Compte les objets en turc. »",
         ["Papa pose 1 à 5 objets et demande " + tr("Kaç ?", "katch", "combien ?"),
          "Nevra touche chaque objet en comptant : bir, iki, üç…"],
         "", "Compter 3 objets.", False, False),
        ("2·9", "Dim 15", "Zıpla, dur, otur !", "10 min", "aucun",
         "« Fais ce que je dis : zıpla, dur ou otur. »",
         ["Revoir " + tr("zıpla", "zeup-la", "saute") + " et " + tr("dur", "dour", "stop") + ".",
          "Nouveau : " + tr("otur", "o-tour", "assieds-toi") + ". Nevra devient la cheffe à la fin."],
         "", "zıpla, otur, puis fin.", True, True),
    ])

W[3] = dict(
    titre="Renkler", sous="Les couleurs", dates="lundi 16 → dimanche 22 novembre",
    lettre="M", nombres="6 à 10", mdp="Kırmızı",
    seq=[
        ("3·1", "Lun 16", "La chasse au rouge", "5 min", "aucun",
         "« Trouve quelque chose de kırmızı ! »",
         ["Nevra court chercher un objet " + tr("kırmızı", "keur-meu-zeu", "rouge") + " et le rapporte.",
          "Même jeu avec " + tr("mavi", "ma-vi", "bleu") + "."],
         "", "Un seul objet rouge.", True, True),
        ("3·2", "Mar 17", "M comme masa", "10 min", "crayon",
         "« Tape sur la table et dis mmm… masa ! »",
         ["Papa fait [mmm] comme « miam ». Nevra tape sur la table : " + tr("masa", "ma-ssa", "table") + ".",
          "Dire la syllabe « ma », puis suivre le grand M avec le doigt."],
         bigletter("M"), "Taper 3 fois sur la table en disant « masa ».", False, False),
        ("3·3", "Mer 18", "Montre-moi altı !", "5 min", "aucun",
         "« Montre-moi autant de doigts que je dis. »",
         [tr("altı", "al-teu", "6") + " · " + tr("yedi", "yè-di", "7") + " · " + tr("sekiz", "sè-kiz", "8")
          + " · " + tr("dokuz", "do-kouz", "9") + " · " + tr("on", "onn", "10"),
          "Compter les doigts ensemble jusqu'à on, puis faire autant de sauts."],
         "", "Montrer « on » (10 doigts) et sauter une fois.", True, False),
        ("3·4", "Jeu 19", "Bleu ou jaune ?", "10 min", "6 objets bleus et jaunes (cubes, Lego…)",
         "« Mets les mavi ici et les sarı là. »",
         [tr("mavi", "ma-vi", "bleu") + " · " + tr("sarı", "sa-reu", "jaune"),
          "Nevra trie les objets en 2 tas en disant la couleur."],
         "", "Trier 4 objets seulement.", False, False),
        ("3·5", "Ven 20", "Les animaux", "5 min", "aucun",
         "« Quand je dis kedi, fais le chat ! »",
         [tr("kedi", "kè-di", "chat") + " (miaou) · " + tr("köpek", "keu-pèk", "chien") + " (ouaf) · "
          + tr("kuş", "kouch", "oiseau") + " (bras qui volent)",
          "Papa dit un animal, Nevra l'imite. Puis elle donne l'animal, papa l'imite."],
         "", "2 animaux : kedi et kuş.", True, True),
        ("3·6", "Sam 21", "Rond ou carré ?", "10 min", "crayon",
         "« Dessine un grand rond dans l'air avec ton bras. »",
         [tr("daire", "da-i-rè", "rond") + " : grand cercle avec le bras. " + tr("kare", "ka-rè", "carré")
          + " : carré avec le doigt.",
          "Puis suivre les deux formes au crayon dans le livret."],
         SHAPES, "Un rond dans l'air en disant « daire ».", True, False),
        ("3·7", "Sam 21", "Feu rouge, feu vert", "10 min", "1 feuille rouge, 1 feuille verte",
         "« Kırmızı, tu t'arrêtes ; yeşil, tu marches. »",
         ["Papa lève la feuille rouge (" + tr("kırmızı", "keur-meu-zeu") + ") ou verte ("
          + tr("yeşil", "yè-chil", "vert") + ").",
          "Nevra marche ou s'arrête. Puis c'est elle qui tient les feuilles."],
         "", "3 changements de couleur, puis fin.", True, True),
        ("3·8", "Dim 22", "Jusqu'à on", "10 min", "10 petits objets, un bol",
         "« Mets les objets dans le bol en comptant. »",
         ["Nevra met un objet à la fois dans le bol ; papa et elle comptent de bir à on.",
          "On vide le bol et on recommence si elle en a envie."],
         "", "Compter jusqu'à beş seulement.", False, False),
        ("3·9", "Dim 22", "Korkma ! L'hymne", "10 min", "page de l'hymne",
         "« Debout, répète deux mots après moi. »",
         ["Expliquer : c'est l'hymne national ; on se tient debout, en silence.",
          "Papa dit le vers en 4 petits morceaux (page de l'hymne) ; Nevra répète chaque morceau.",
          "Version très courte : " + tr("Korkma !", "kork-ma", "n'aie pas peur") + "."],
         "", "Dire seulement « Korkma ! », debout.", False, False),
    ])

W[4] = dict(
    titre="Evde", sous="À la maison", dates="lundi 23 → dimanche 29 novembre",
    lettre="O", nombres="1 à 10, puis 11 à 20", mdp="Zıpla",
    seq=[
        ("4·1", "Lun 23", "Top !", "5 min", "une balle",
         "« Lance la balle et dis top ! »",
         ["À chaque lancer, Nevra dit " + tr("top", "top", "balle") + ".",
          "Compter les passes en turc jusqu'à on."],
         "", "3 passes, 3 « top ».", True, True),
        ("4·2", "Mar 24", "O comme okul", "10 min", "crayon",
         "« Fais une bouche toute ronde : ooo ! »",
         ["Papa fait [o] avec une bouche ronde. Nevra imite, puis dit " + tr("okul", "o-koul", "école") + ".",
          "Suivre le grand O avec le doigt : il est rond comme une daire !"],
         bigletter("O"), "Faire la bouche ronde [o] 3 fois.", False, False),
        ("4·3", "Mer 25", "Va chercher !", "5 min", "une balle, une petite voiture",
         "« Va chercher le top ! »",
         ["Poser la balle et la voiture dans une autre pièce.",
          "Papa dit " + tr("top", "top") + " ou " + tr("araba", "a-ra-ba") + " : Nevra court chercher le bon objet."],
         "", "Un seul aller-retour.", True, False),
        ("4·4", "Jeu 26", "Le sac mystère", "10 min", "sac opaque, une pomme, une balle, une petite voiture",
         "« Touche sans regarder et dis ce que c'est. »",
         ["Papa demande " + tr("Bu ne ?", "bou nè", "qu'est-ce que c'est ?"),
          "Nevra touche et répond elma, top ou araba. On sort l'objet pour vérifier."],
         "", "Un seul objet dans le sac.", False, False),
        ("4·5", "Ven 27", "Zıpla, dur, otur, kalk !", "5 min", "aucun",
         "« Fais ce que je dis : zıpla, dur, otur ou kalk. »",
         ["Revoir zıpla, dur, otur. Nouveau : " + tr("kalk", "kalk", "lève-toi") + ".",
          "Enchaîner « otur » puis « kalk » en riant. Nevra devient la cheffe."],
         "", "otur, kalk, et fin.", True, True),
        ("4·6", "Sam 28", "Maintenant ou demain ?", "10 min", "jetons, bocal",
         "« Tu choisis : une petite surprise maintenant, ou une plus grande demain ? »",
         ["Compter les jetons du bocal ensemble : bir, iki, üç…",
          "Nevra choisit entre les 2 propositions. Papa respecte son choix, sans commentaire.",
          "Si elle attend, papa tient sa promesse."],
         '<div class="choice"><div><i class="cb"></i> Maintenant</div><div><i class="cb"></i> Demain, plus grand</div></div>',
         "Seulement compter les jetons du bocal.", False, False),
        ("4·7", "Sam 28", "Saute sur la lettre", "10 min", "4 feuilles, gros feutre",
         "« Saute sur la lettre que je dis. »",
         ["Écrire A, E, M, O sur 4 feuilles au sol ; n'en utiliser que 2 à la fois.",
          "Papa dit le son ([a], [è], [mmm], [o]) : Nevra saute sur la bonne lettre."],
         "", "2 lettres seulement : A et O.", True, False),
        ("4·8", "Dim 29", "La grande tour", "10 min", "20 cubes ou Lego",
         "« Ajoute un cube et dis le nombre avec moi. »",
         ["Monter une tour de 10 cubes en comptant jusqu'à " + tr("on", "onn", "10") + ".",
          "Ajouter un cube : " + tr("on bir", "onn bir", "11") + ", " + tr("on iki", "onn i-ki", "12")
          + "… jusqu'à " + tr("yirmi", "yir-mi", "20") + " (optionnel, si elle est à l'aise)."],
         "", "Une tour jusqu'à on, puis on la fait tomber.", False, False),
        ("4·9", "Dim 29", "Mon spectacle", "10 min", "aucun (téléphone en option)",
         "« Montre-nous ce que tu sais faire en turc ! »",
         ["Nevra dit Merhaba, son prénom, compte jusqu'à on et joue à zıpla / dur.",
          "Tout le monde applaudit. Papa coche ce qu'elle a fait, sans note ni comparaison."],
         '<div class="bilan">' + "".join(f'<div><i class="cb"></i>{t}</div>' for t in [
             "Je dis Merhaba", "Je dis mon prénom en turc", "Je compte jusqu'à on",
             "Je reconnais A, E, M, O"]) + "</div>",
         "Seulement « Merhaba ! » et un « zıpla ».", True, True),
    ])


# ---------------------------------------------------------------- tours suivants
# Un tour de jeu dure environ 2 min : ces variantes remplissent le sablier (tour 2, puis tour 3).
MORE = {
    "1·1": ("la peluche se cache ailleurs (sous la table, derrière le canapé) ; Nevra la trouve et dit Merhaba",
            "Nevra cache la peluche, papa la cherche et dit Merhaba en la trouvant"),
    "1·2": ("rouler sur le A en disant [a] très fort, puis en chuchotant",
            "chercher des A dans un livre ou sur une boîte et les montrer du doigt"),
    "1·3": ("papa piège : il saute à iki au lieu de üç, Nevra dit « non ! »",
            "sauts de grenouille, puis de lapin, toujours sur bir, iki, üç"),
    "1·4": ("3 peluches demandent chacune Adın ne ? avec une voix différente",
            "Nevra pose la question Adın ne ? à une peluche, papa répond avec une voix drôle"),
    "1·5": ("zıpla tout doucement, puis très vite",
            "papa chuchote ou crie « zıpla » : petit saut ou grand saut"),
    "1·6": ("papa « oublie » de dire merci : Nevra le lui rappelle",
            "dînette : Nevra sert les peluches, qui disent teşekkür ederim"),
    "1·7": ("traverser le A à quatre pattes, puis en sautant",
            "Nevra forme le A avec les rubans, papa marche dessus en disant [a]"),
    "1·8": ("monter en chuchotant les nombres, redescendre en les disant fort",
            "sauter de coussin en coussin en comptant jusqu'à beş"),
    "1·9": ("mettre les jetons de la semaine dans le bocal, un par un, en comptant",
            "dessiner une première récompense dans le catalogue (page 16)"),
    "2·1": ("papa chuchote le mot au lieu de le dire",
            "Nevra dit le mot, papa court (et se trompe exprès)"),
    "2·2": ("chercher 3 choses kırmızı dans la pièce",
            "chercher 2 choses beyaz"),
    "2·3": ("papa dit elma ou araba : Nevra fait le mouton seulement quand elle entend [è]",
            "tracer un grand E dans l'air avec le bras"),
    "2·4": ("taper sur les genoux, puis sur la table",
            "Nevra tape, papa compte et devine combien"),
    "2·5": ("la peluche est triste : Nevra lui demande Nasılsın ?",
            "Nevra demande Nasılsın ? à chaque personne de la maison"),
    "2·6": ("colorier les dessins",
            "montrer les photos de famille en disant anne ou baba"),
    "2·7": ("sauter à cloche-pied, puis comme une grenouille",
            "éloigner les feuilles : Nevra court jusqu'à la bonne lettre"),
    "2·8": ("papa cache un objet sous sa main : Kaç ? à nouveau",
            "Nevra pose les objets, papa compte (et se trompe exprès)"),
    "2·9": ("avec de la musique : quand elle s'arrête, papa dit otur",
            "Nevra est la cheffe et donne les ordres"),
    "3·1": ("rapporter 2 objets rouges",
            "trouver un objet mavi caché par papa"),
    "3·2": ("taper sur la table en rythme : ma-ma-ma",
            "tracer un M dans l'air, puis sur le dos de papa"),
    "3·3": ("papa montre des doigts, Nevra dit le nombre",
            "Nevra saute autant de fois que papa montre de doigts"),
    "3·4": ("trier dans 2 boîtes, en courant de l'une à l'autre",
            "papa met un objet dans le mauvais tas, Nevra le corrige"),
    "3·5": ("marcher comme l'animal (chat à quatre pattes, oiseau qui vole)",
            "papa fait le bruit, Nevra dit le nom de l'animal"),
    "3·6": ("chercher dans la maison un objet rond (une assiette, une horloge)",
            "faire un rond et un carré au sol avec une ficelle, et marcher dessus"),
    "3·7": ("même jeu en courant, puis en sautant",
            "papa change de feuille très vite : Nevra reste attentive"),
    "3·8": ("vider le bol en recomptant chaque objet",
            "2 bols : papa met 3 objets dans l'un, Nevra en met autant dans l'autre"),
    "3·9": ("redire les morceaux en chuchotant, puis à voix normale",
            "papa dit un morceau, Nevra dit le suivant si elle s'en souvient (sinon elle répète)"),
    "4·1": ("rouler la balle au sol, puis la lancer en l'air",
            "compter les passes réussies sans faire tomber la balle"),
    "4·2": ("chercher dans la maison des objets ronds comme le O",
            "faire un O avec les bras en disant [o] fort, puis doucement"),
    "4·3": ("cacher les objets à des endroits différents",
            "Nevra cache les objets, papa les cherche et dit le mot"),
    "4·4": ("mettre 2 objets dans le sac",
            "Nevra remplit le sac pour papa et lui demande Bu ne ?"),
    "4·5": ("avec de la musique : quand elle s'arrête, papa dit otur ; quand elle reprend, kalk",
            "Nevra est la cheffe et donne les ordres"),
    "4·6": ("dessiner la surprise choisie",
            "ranger les jetons dans le bocal en comptant"),
    "4·7": ("utiliser E et M à la place de A et O",
            "Nevra dit le son, papa saute"),
    "4·8": ("faire tomber la tour et recompter les cubes en les ramassant",
            "construire 2 tours de 5 cubes et compter les deux ensemble jusqu'à on"),
    "4·9": ("refaire le spectacle pour quelqu'un d'autre (maman, les peluches)",
            "Nevra choisit son jeu préféré du mois et on y joue"),
}


# ---------------------------------------------------------------- rendu des cartes
def dot(t):
    """Termine une phrase par un point, sauf si elle finit déjà par ? ou !."""
    return t if t.endswith(("?", "!")) else t + "."


def card(s):
    code, day, title, dur, mat, cons, steps, ws, v3, mov, duo = s
    kind = '<span class="kind mov">Mouvement</span>' if mov else '<span class="kind calm">Calme</span>'
    duo_tag = '<span class="duo">★ possible avec Neyla</span>' if duo else ""
    # Lettre creuse et drapeau : placés à droite des étapes pour gagner de la hauteur
    side = ws.startswith('<div class="bigl"') or ws == FLAG
    side_html = f'<div class="side">{ws}</div>' if side else ""
    ws = "" if side else ws
    return f'''
<div class="card">
  <div class="chead"><span class="code">{code}</span><span class="ctitle">{title}</span>{kind}
    <span class="cmeta">{HOURGLASS} {day} · {dur}</span><span class="done"><i class="cb"></i>Réalisée <i class="cb"></i>Jeton</span></div>
  <div class="cline"><span class="lbl">Matériel</span> {mat} {duo_tag}</div>
  <div class="cons"><span class="lbl">Consigne</span> {cons}</div>
  {side_html}<ol class="steps">{"".join(f"<li>{x}</li>" for x in steps)}</ol>
  {f'<div class="ws">{ws}</div>' if ws else ""}
  <div class="more"><b>Tour 2</b> {dot(MORE[code][0])} &nbsp;<b>Tour 3</b> {dot(MORE[code][1])}</div>
  <div class="v3"><b>Version 3 min</b> (si elle sature) : {v3}</div>
</div>'''


PAGE_NO = [0]


def page(content, section, cls=""):
    PAGE_NO[0] += 1
    return f'''
<section class="page {cls}">
  <header class="ph-head"><span><b>Nevra</b> · Mois 1 · Kasım / Novembre 2026</span><span>{section}</span></header>
  <div class="body">{content}</div>
  <footer class="ph-foot">{PAGE_NO[0]}</footer>
</section>'''


pages = []

# 1. Couverture
pages.append(f'''
<section class="page cover">
  <div class="cv-top">Livret mensuel de turc · Mois 1</div>
  <div class="cv-month"><span>Kasım</span><small>Novembre 2026</small></div>
  <div class="cv-name">Nevra Sevim</div>
  <div class="cv-letters"><span>A</span><span>E</span><span>M</span><span>O</span></div>
  <div class="cv-theme"><small>Thème du mois</small>Merhaba !<br><span>Ma famille, les couleurs et la maison</span></div>
  <div class="cv-goals"><h3>Mes 3 objectifs</h3><ol>
    <li>Dire bonjour, merci et mon prénom en turc.</li>
    <li>Reconnaître 4 lettres (A, E, M, O) et leur son.</li>
    <li>Compter jusqu'à 10 en turc.</li></ol></div>
  <div class="cv-time"><b>Durée :</b> 5 soirs de 5 à 10 min + 4 séquences de 10 min le week-end (2 le samedi, 2 le dimanche),
  soit <b>environ 1 h 15 à 1 h 30 par semaine</b>.</div>
  <div class="cv-foot">Ce livret appartient à : <b>Nevra</b> &nbsp;·&nbsp; 4 semaines · 36 séquences courtes</div>
</section>''')
PAGE_NO[0] += 1


# 2–3. Programme hebdomadaire
def week_table(n):
    w = W[n]
    rows = ""
    for code, day, title, dur, *rest in w["seq"]:
        mov, duo = rest[-2], rest[-1]
        rows += (f'<tr><td class="d">{day}</td><td class="c">{code}</td><td>{title}{" <span class=star>★</span>" if duo else ""}</td>'
                 f'<td class="m">{"Mouvement" if mov else "Calme"}</td><td class="t">{dur}</td><td class="k"><i class="cb"></i></td></tr>')
    return f'''
<div class="week">
  <div class="whead"><span class="wnum">Semaine {n}</span><span class="wtitle">{w["titre"]}</span><span class="wsub">{w["sous"]}</span></div>
  <div class="winfo"><span>{w["dates"]}</span><span>Lettre : <b>{w["lettre"]}</b></span><span>Nombres : <b>{w["nombres"]}</b></span>
    <span>Mot de passe : <b class="acc">{w["mdp"]}</b></span></div>
  <table class="prog"><thead><tr><th>Jour</th><th>N°</th><th>Séquence</th><th>Type</th><th>Durée</th><th>Fait</th></tr></thead>
  <tbody>{rows}</tbody></table>
</div>'''


intro = '''<div class="note">
<b>Rythme :</b> 1 séquence de 5 à 10 min les soirs de semaine ; 2 séquences de 10 min le samedi et 2 séquences de 10 min
le dimanche, avec 2 min de mouvement entre les deux. Un sablier ou un minuteur visible à chaque fois.
<b>Un tour de jeu dure environ 2 min :</b> quand il est fini, on enchaîne le « tour 2 », puis le « tour 3 » indiqués sur la carte,
jusqu'à la fin du sablier.
<b>Mot de passe :</b> pendant la semaine, papa demande le mot de passe avant le dessert ou une histoire.
Jours libres : dim. 1<sup>er</sup> et lun. 30 novembre. ★ = séquence possible avec Neyla.</div>'''
pages.append(page("<h1>Programme du mois</h1>" + intro + week_table(1) + week_table(2), "Programme hebdomadaire"))
pages.append(page(week_table(3) + week_table(4), "Programme hebdomadaire"))

# 4. Imagier
LET = [("A a", "araba", "a-ra-ba", "voiture", "[a] comme « ami »", "semaine 1"),
       ("E e", "elma", "èl-ma", "pomme", "[è] comme « mère »", "semaine 2"),
       ("M m", "masa", "ma-ssa", "table", "comme en français", "semaine 3"),
       ("O o", "okul", "o-koul", "école", "[o] comme « moto »", "semaine 4")]
cells = "".join(f'''<div class="lcell"><div class="lbig">{l}</div><div class="lword"><small>{wk}</small><b>{w}</b>
<span class="ph">« {p} »</span><span>{f}</span><span class="lsound">{s}</span></div><div class="ldraw"></div></div>''' for l, w, p, f, s, wk in LET)
ALPHA = "A B C Ç D E F G Ğ H I İ J K L M N O Ö P R S Ş T U Ü V Y Z".split()
M1 = set("A E M O".split())
SPEC = set("Ç Ğ I Ö Ş Ü".split())
strip = "".join(f'<span class="{"on" if a in M1 else ""} {"sp" if a in SPEC else ""}">{a}</span>' for a in ALPHA)
pages.append(page(f'''<h1>Mon imagier : mes 4 lettres de novembre</h1>
<p class="lead">Une lettre par semaine. Nevra dessine le mot-image dans la case. On dit le son avant d'écrire.</p>
<div class="lgrid">{cells}</div>
<div class="tipbox"><b>Astuce :</b> en turc, une lettre = un son. Le turc se lit comme il s'écrit… sauf le <b>ğ</b>, qui est muet.</div>
<h2>L'alphabet turc complet (29 lettres)</h2>
<div class="alpha">{strip}</div>
<p class="mini"><span class="key on">A</span> lettres de ce mois &nbsp; <span class="key sp">Ç</span> lettres propres au turc, vues plus tard :
<b>Ç</b> « tch » · <b>Ğ</b> muet (allonge la voyelle d'avant) · <b>I ı</b> sans point, son proche de « eu » · <b>Ö</b> « eu » ·
<b>Ş</b> « ch » · <b>Ü</b> « u » français. Pas de Q, W ni X en turc.</p>''', "Imagier"))

# 5. Lexique
VOC = [
    ("Dire bonjour", [("Merhaba", "mèr-ha-ba", "bonjour, salut"), ("Hoşça kal", "hoch-tcha kal", "au revoir"),
                      ("Teşekkür ederim", "tè-chèk-kur è-dè-rim", "merci"), ("Nasılsın ?", "na-seul-seunn", "comment vas-tu ?"),
                      ("İyiyim", "i-yi-yimm", "je vais bien"), ("Adın ne ?", "a-deunn nè", "comment tu t'appelles ?"),
                      ("Benim adım Nevra.", "bè-nim a-deum Nevra", "je m'appelle Nevra"), ("Aferin !", "a-fè-rinn", "bravo !")]),
    ("Ma famille", [("anne", "ann-nè", "maman"), ("baba", "ba-ba", "papa")]),
    ("Les couleurs", [("kırmızı", "keur-meu-zeu", "rouge"), ("beyaz", "bè-yaz", "blanc"), ("mavi", "ma-vi", "bleu"),
                      ("sarı", "sa-reu", "jaune"), ("yeşil", "yè-chil", "vert")]),
    ("Les animaux", [("kedi", "kè-di", "chat"), ("köpek", "keu-pèk", "chien"), ("kuş", "kouch", "oiseau")]),
    ("À la maison", [("masa", "ma-ssa", "table"), ("top", "top", "balle"), ("araba", "a-ra-ba", "voiture"),
                     ("elma", "èl-ma", "pomme"), ("Bu ne ?", "bou nè", "qu'est-ce que c'est ?")]),
    ("Les formes", [("daire", "da-i-rè", "rond, cercle"), ("kare", "ka-rè", "carré")]),
    ("Bouger", [("zıpla", "zeup-la", "saute"), ("dur", "dour", "stop"), ("otur", "o-tour", "assieds-toi"),
                ("kalk", "kalk", "lève-toi")]),
]
voc_html = "".join(f'<div class="vblock"><h3>{t}</h3><table class="voc">' +
                   "".join(f'<tr><td class="tk">{a}</td><td class="ph">« {b} »</td><td>{c}</td></tr>' for a, b, c in items) +
                   "</table></div>" for t, items in VOC)
nums = [("1", "bir", "bir"), ("2", "iki", "i-ki"), ("3", "üç", "utch"), ("4", "dört", "deurt"), ("5", "beş", "bèch"),
        ("6", "altı", "al-teu"), ("7", "yedi", "yè-di"), ("8", "sekiz", "sè-kiz"), ("9", "dokuz", "do-kouz"),
        ("10", "on", "onn")]
num_html = '<div class="nums">' + "".join(f'<div><b>{a}</b><span class="tk">{b}</span><span class="ph">« {c} »</span></div>' for a, b, c in nums) + "</div>"
pages.append(page(f'''<h1>Mes mots de novembre</h1>
<p class="lead">La prononciation entre « » est une aide en sons français (règles page « Pour le papa »). Pas besoin de tout savoir :
un mot répété avec plaisir vaut mieux que dix mots appris de force.</p>
<div class="vcols">{voc_html}</div>
<h2>Les nombres de 1 à 10</h2>{num_html}
<p class="mini">En fin de mois, par manipulation seulement : 11 à 19 = <b>on</b> + unité (on bir « onn bir » = 11, on iki « onn i-ki » = 12…),
20 = <b>yirmi</b> « yir-mi ». <b>Kaç ?</b> « katch » = combien ?</p>''', "Lexique"))

# 6–13. Séquences
for n in range(1, 5):
    seqs = W[n]["seq"]
    head = f'<div class="shead"><span class="wnum">Semaine {n}</span> <b>{W[n]["titre"]}</b> · {W[n]["sous"]}</div>'
    pages.append(page(head + '<div class="tag">Les soirs · 5 à 10 min</div>' + "".join(card(s) for s in seqs[:5]),
                      f"Séquences · semaine {n}", "seqpage"))
    pages.append(page(head + '<div class="tag">Le week-end · 2 séquences de 10 min le samedi et 2 séquences de 10 min le dimanche'
                      ' (2 min de mouvement entre les deux)</div>' + "".join(card(s) for s in seqs[5:]),
                      f"Séquences · semaine {n}", "seqpage"))

# 14. Hymne (vers 1 seulement, transcription identique au livret de Neyla)
CHUNKS = [("Korkma, sönmez", "kork-ma, seun-mèz"), ("bu şafaklarda", "bou cha-fak-lar-da"),
          ("yüzen al", "yu-zènn al"), ("sancak", "sann-djak")]
chunks = "".join(f'<div class="chunk"><small>morceau {i}</small><b>{a}</b><i>« {b} »</i></div>'
                 for i, (a, b) in enumerate(CHUNKS, 1))
pages.append(page(f'''<h1>L'hymne du mois · <span class="tk">İstiklal Marşı</span></h1>
<p class="lead">« La Marche de l'Indépendance », hymne national de la Turquie, écrit par le poète Mehmet Akif Ersoy
et adopté par la Grande Assemblée nationale de Turquie le 12 mars 1921 (date généralement citée, à confirmer sur une source officielle).
Ce mois-ci, pour Nevra : <b>un seul vers</b>, en semaine 3 (séquence 3·9).</p>
<div class="vers"><div class="vnum">Vers 1</div>
<div class="vtxt">Korkma, sönmez bu şafaklarda yüzen al sancak;</div>
<div class="vph">« Kork-ma, seun-mèz bou cha-fak-lar-da yu-zènn al sann-djak »</div></div>
<h2>Par petits morceaux (2 mots à la fois)</h2>
<div class="chunks">{chunks}</div>
<div class="short"><b>Version très courte :</b> <span class="tk">Korkma !</span> <span class="ph">« kork-ma »</span> = n'aie pas peur.
Si Nevra ne dit que ce mot, c'est déjà très bien.</div>
<div class="sens"><h3>Ce que ça veut dire (version simplifiée pour Nevra)</h3>
<p>« N'aie pas peur ! Le drapeau rouge qui flotte dans le ciel du matin ne s'éteindra pas. »
<span class="mini">(traduction libre, non officielle)</span></p>
<p class="mini">Le vers 1 se termine par « sancak » : le drapeau.</p></div>
<div class="tip2"><b>Comment l'apprendre :</b> debout, en silence, papa dit un morceau, Nevra répète. Une seule fois par séance.
Aucune exigence de perfection : on félicite l'effort (« Aferin ! »).</div>
<div class="warn"><b>À vérifier par le papa :</b> texte et traduction à faire vérifier par un locuteur natif. Pour la mélodie,
cherchez vous-même un enregistrement issu d'une source officielle : aucun lien n'est fourni ici. La phonétique est une approximation.</div>
<p class="verif">Texte à vérifier avant apprentissage : comparer avec le texte officiel publié par la Grande Assemblée nationale de Turquie (TBMM).</p>''', "Hymne"))

# 15. Tableau de jetons (mêmes règles que pour Neyla)
DAYS = ["L", "M", "M", "J", "V", "S1", "S2", "D1", "D2"]
grid = "".join(
    f'<tr><th>Semaine {n}</th>' + "".join(f'<td><div class="tok"><small>{d}</small></div></td>' for d in DAYS)
    + '<td><div class="tok bonus"><small>+1</small></div></td></tr>' for n in range(1, 5))
counter = "".join(f'<div class="cnt"><small>{i}</small></div>' for i in range(1, 16))
pages.append(page(f'''<h1>Mon tableau de jetons · <span class="tk">jetonlarım</span></h1>
<p class="lead"><b>1 jeton</b> par séquence réalisée : 9 séquences par semaine (5 soirs + 2 le samedi + 2 le dimanche) · <b>+1 jeton bonus</b>
si les 9 séquences de la semaine sont faites. Maximum : 9 jetons + 1 bonus = 10 par semaine, soit 40 pour le mois.
Nevra colorie une case par jeton gagné.</p>
<table class="tokens"><thead><tr><th></th>{"".join(f"<th>{d}</th>" for d in DAYS)}<th>Bonus</th></tr></thead><tbody>{grid}</tbody></table>
<div class="tokrow">
  <div class="box"><h3>Mon seuil d'échange : comment ça marche</h3>
    <p class="mini">C'est moi qui choisis mon seuil (papa l'écrit dans la case « Mon seuil du mois »).
    Quand j'atteins mon seuil, je choisis une récompense et mon compteur repart à zéro.
    Je peux changer mon seuil le mois prochain, avec papa.</p></div>
  <div class="box"><h3>Récompense en cours</h3><p>Je vise :</p><div class="wl"></div>
    <h3 style="margin-top:4mm">Mon seuil du mois</h3>
    <div class="big-fill"><span class="fill short"></span> jetons</div></div>
</div>
<h2>Mon compteur vers le seuil</h2>
<p class="mini">Cocher un rond par jeton. Au seuil : on échange, on efface (ou on recommence sur la ligne suivante).</p>
<div class="counter">{counter}</div><div class="counter">{counter}</div>
<h2>Mon journal des échanges</h2>
<table class="journal"><thead><tr><th>Date</th><th>Jetons utilisés</th><th>Récompense choisie</th><th>Jetons gardés en réserve</th></tr></thead>
<tbody>{"<tr><td></td><td></td><td></td><td></td></tr>" * 4}</tbody></table>
<div class="reserve"><b>Ma réserve pour la fin d'année</b> (jetons que je décide de ne pas échanger) : <span class="fill short"></span> jetons
<span class="mini">— en juin, la réserve s'échange contre une grande récompense.</span></div>''', "Tableau de jetons"))

# 16. Catalogue de récompenses (vide, à remplir avec Nevra)
slot = '<div class="rslot"><div class="rdraw"></div><div class="rprice"><span class="fill short"></span> jetons</div></div>'
pages.append(page(f'''<h1>Mon catalogue de récompenses</h1>
<p class="lead">À remplir avec Nevra : elle dessine (ou papa dessine avec elle) chaque récompense, et le « prix » en jetons est décidé ensemble.
Idées de types : cartes à collectionner, petits cadeaux, sorties.</p>
<div class="rcat">
  <div><h3>Petites</h3><p class="mini">= mon seuil</p>{slot * 2}</div>
  <div><h3>Moyennes</h3><p class="mini">= 2 × mon seuil</p>{slot * 2}</div>
  <div><h3>Grande</h3><p class="mini">réserve de fin d'année</p>{slot * 2}</div>
</div>
<div class="tipbox"><b>Pour papa — éducation au choix :</b> une seule idée par mois. Ce mois-ci : « je choisis » (séquence 1·9, choisir librement son seuil) et « attendre pour avoir plus » (séquence 4·6). Toujours <b>2 choix maximum</b>, jamais de reproche sur le choix fait,
et la promesse est tenue.</div>''', "Récompenses"))

# 17. Page du papa
pages.append(page('''<h1>Pour le papa</h1>
<div class="pcols">
<div>
<h3>Durée conseillée</h3>
<p>Soir : 1 séquence de 5 à 10 min. Week-end : 2 séquences de 10 min le samedi et 2 séquences de 10 min le dimanche, avec 2 min de
mouvement entre les deux. Soit environ 1 h 15 à 1 h 30 par semaine. <b>Toujours un sablier ou un minuteur visible.</b>
S'arrêter sur une réussite, avant la lassitude.</p>
<h3>Déroulé d'une séquence</h3>
<p>1. Ouverture (30 s) : « Merhaba ! », on retourne le sablier. 2. Tour 1 : le jeu de la carte (environ 2 min).
3. Tours 2 et 3 : les variantes de la carte, jusqu'à la fin du sablier. 4. Clôture (30 s) : « Aferin ! » et le jeton.
Une séquence de 5 min = tours 1 et 2 ; une séquence de 10 min = tours 1, 2 et 3, puis on rejoue le tour préféré.
Si elle sature avant la fin : on arrête, la séquence compte.</p>
<h3>Matériel du mois</h3>
<p>Sablier ou minuteur visuel, 1 peluche, crayons (dont rouge), une pomme, une balle, une petite voiture, 20 cubes ou Lego,
un bol, un sac opaque, 4 feuilles A4 + 1 rouge + 1 verte, 3 rubans, scotch, 3 photos de famille, un bocal pour les jetons.</p>
<h3>Lire la phonétique « … »</h3>
<p class="mini"><b>e</b>→è · <b>u</b>→ou · <b>ü</b>→u · <b>ö</b>→eu · <b>ı</b>→eu (lèvres non arrondies) · <b>c</b>→dj · <b>ç</b>→tch ·
<b>ş</b>→ch · <b>s</b>→ss toujours · <b>g</b>→gu toujours · <b>h</b> toujours soufflé · <b>r</b> légèrement roulé ·
<b>ğ</b> muet · <b>an, en, on, in</b> jamais nasaux (d'où « onn », « ann »). Ces transcriptions sont approximatives et identiques
à celles du livret de Neyla.</p>
<h3>Lettres : l'oral avant l'écrit</h3>
<p class="mini">Une seule lettre par semaine (A, E, M, O). On joue d'abord avec le son (imiter, sauter sur la lettre), puis on suit la
lettre avec le doigt. Le crayon est facultatif. Nevra ne lit pas encore : on ne lui demande pas de lire des mots.</p>
</div>
<div>
<h3>Conseils</h3>
<ul>
<li><b>Une seule consigne à la fois</b>, en une phrase courte. Attendre qu'elle ait fini avant la suivante.</li>
<li><b>Deux choix maximum</b> : « le rouge ou le bleu ? », « on commence par sauter ou par compter ? ».</li>
<li>Alterner calme et mouvement : chaque semaine compte au moins 5 séquences « Mouvement » sur 9.</li>
<li>Retour positif immédiat, court et précis : « Aferin ! Tu as dit merci en turc ! »</li>
<li>Ne pas corriger : redire le mot correctement, avec le sourire.</li>
<li>Son parcours est le sien : <b>ne jamais la comparer à sa sœur</b>, ni en positif ni en négatif.</li>
<li>Une séquence raccourcie mais faite compte. <b>Ne jamais retirer un jeton.</b></li>
</ul>
<h3>Saturation (résumé)</h3>
<p class="mini">Elle se lève, touche à tout, regarde ailleurs, rit sans raison ou s'énerve → passer tout de suite à la
<b>version 3 min</b> de la carte, finir sur une réussite, donner le jeton.</p>
<h3>Refus (résumé)</h3>
<p class="mini">Ne pas forcer. Proposer 2 choix, faire jouer la peluche, ou reporter. Aucune punition. Détails page suivante.</p>
<h3>À savoir</h3>
<p class="mini">Ce programme est une adaptation libre inspirée de la moyenne section française ; ce n'est pas un programme officiel turc.
Ce livret ne pose aucun diagnostic.</p>
</div></div>''', "Pour le papa"))

# 18. Signaux à observer (détaillé)
pages.append(page('''<h1>Signaux à observer</h1>
<p class="lead">Ces repères aident à ajuster les séances. Ils ne servent pas à poser un diagnostic.</p>
<div class="sig">
<div class="sbox"><h3>Avant de commencer</h3>
<ul><li>Fatiguée, affamée, très excitée ou juste après un écran → reporter ou faire la version 3 min.</li>
<li>Écran éteint, jouets rangés, un seul objet sur la table.</li>
<li>Sablier posé devant elle : « Quand le sable est en bas, c'est fini. »</li></ul></div>
<div class="sbox"><h3>Ça marche</h3>
<ul><li>Elle répète un mot sans qu'on le lui demande, ou le réutilise plus tard.</li>
<li>Elle réclame un jeu (« encore zıpla ! ») ou veut être la cheffe.</li>
<li>Elle reste dans l'activité jusqu'à la fin du sablier.</li></ul></div>
<div class="sbox"><h3>Saturation : les signes</h3>
<ul><li>Se lève, se tortille, tombe de la chaise, touche à tout.</li>
<li>Regarde ailleurs, n'entend plus la consigne, répond au hasard.</li>
<li>Rit sans raison, fait le clown, devient brusque ou pleure.</li></ul>
<p><b>Que faire :</b> passer à la version 3 min ou à un mouvement (zıpla, dur), dire « Aferin ! » sur ce qui a été fait,
s'arrêter, donner le jeton. Ne pas prolonger « pour finir ».</p></div>
<div class="sbox"><h3>Refus : les signes</h3>
<ul><li>« Non », « je veux pas », se cache, part jouer.</li>
<li>Refuse seulement une partie (écrire, répéter).</li></ul>
<p><b>Que faire :</b> proposer 2 choix (« le chat ou le chien ? ») ; faire parler la peluche ; papa se trompe exprès et Nevra le corrige ;
reporter à plus tard sans reproche. Pas de punition, pas de chantage, pas de jeton retiré. Si elle refuse plusieurs jours,
garder seulement les jeux de mouvement pendant une semaine.</p></div>
</div>
<h2>Mon carnet d'observation (pour papa)</h2>
<table class="journal obs"><thead><tr><th>Semaine</th><th>Ce qui a plu</th><th>Moment de saturation</th><th>Durée réelle moyenne</th></tr></thead>
<tbody>''' + "".join(f"<tr><td>{n}</td><td></td><td></td><td></td></tr>" for n in range(1, 5)) + '''</tbody></table>
<div class="warn"><b>Quand en parler à un professionnel :</b> si des difficultés d'attention ou d'agitation gênent fortement Nevra au
quotidien, <i>à la maison et à l'école</i>, en parler à son enseignante et au médecin traitant ou au pédiatre. Ce carnet peut les aider.
Ce livret ne remplace pas un avis médical.</div>''', "Signaux à observer"))

# ---------------------------------------------------------------- CSS
CSS = f'''
@page {{ size: A4; margin: 0; }}
* {{ box-sizing: border-box; }}
html, body {{ margin: 0; padding: 0; background: #fff; }}
body {{ font-family: Inter, "DejaVu Sans", sans-serif; color: #222; font-size: 9.6pt; line-height: 1.38;
  -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
.page {{ width: 210mm; height: 297mm; padding: 11mm 15mm 12mm; position: relative; overflow: hidden;
  break-after: page; display: flex; flex-direction: column; }}
.ph-head {{ display: flex; justify-content: space-between; font-size: 8pt; color: #777;
  border-bottom: 0.5mm solid {ACCENT}; padding-bottom: 1.5mm; margin-bottom: 4mm; }}
.ph-head b {{ color: {ACCENT}; }}
.ph-foot {{ position: absolute; bottom: 6mm; left: 0; right: 0; text-align: center; font-size: 8pt; color: #888; }}
.body {{ flex: 1; }}
h1 {{ font-size: 17pt; margin: 0 0 2.5mm; color: {ACCENT}; font-weight: 800; letter-spacing: -0.2pt; }}
h2 {{ font-size: 12pt; margin: 5mm 0 2mm; color: #222; }}
h3 {{ font-size: 10pt; margin: 3mm 0 1mm; color: {ACCENT}; }}
p {{ margin: 0 0 2mm; }}
.lead {{ color: #444; margin-bottom: 4mm; }}
.mini {{ font-size: 8.2pt; color: #555; line-height: 1.35; }}
.tk {{ font-weight: 700; color: #111; }}
.ph {{ color: #666; font-style: italic; font-weight: 400; }}
.acc {{ color: {ACCENT}; }}
.nw {{ white-space: nowrap; }}
.cb {{ display: inline-block; width: 3.6mm; height: 3.6mm; border: 0.45mm solid {ACCENT}; border-radius: 0.8mm;
  vertical-align: -0.6mm; margin-right: 1mm; background: #fff; }}
.fill {{ display: inline-block; min-width: 45mm; border-bottom: 0.3mm solid #999; height: 5mm; vertical-align: bottom; }}
.fill.short {{ min-width: 14mm; }}
.wl {{ border-bottom: 0.3mm solid #bbb; height: 7mm; }}

/* couverture */
.cover {{ padding: 22mm 22mm 18mm; }}
.cv-top {{ font-size: 10pt; letter-spacing: 2pt; text-transform: uppercase; color: #777; }}
.cv-month {{ margin-top: 14mm; font-size: 58pt; font-weight: 800; color: #111; line-height: 1; }}
.cv-month small {{ display: block; font-size: 16pt; font-weight: 500; color: #666; margin-top: 3mm; }}
.cv-name {{ margin-top: 10mm; font-size: 26pt; font-weight: 700; color: {ACCENT}; }}
.cv-letters {{ margin-top: 10mm; display: flex; gap: 4mm; }}
.cv-letters span {{ width: 20mm; height: 20mm; border: 0.6mm solid {ACCENT}; border-radius: 3mm; display: flex;
  align-items: center; justify-content: center; font-size: 28pt; font-weight: 800; color: {ACCENT}; }}
.cv-letters span:nth-child(odd) {{ background: {ACCENT}; color: #fff; }}
.cv-theme {{ margin-top: 12mm; font-size: 24pt; font-weight: 800; line-height: 1.15; }}
.cv-theme small {{ display: block; font-size: 9pt; font-weight: 600; letter-spacing: 1.5pt; text-transform: uppercase; color: #888; margin-bottom: 1.5mm; }}
.cv-theme span {{ font-size: 14pt; font-weight: 500; color: #444; }}
.cv-goals {{ margin-top: 10mm; background: {TINT}; border-radius: 3mm; padding: 5mm 7mm; }}
.cv-goals h3 {{ margin: 0 0 2mm; font-size: 11pt; }}
.cv-goals ol {{ margin: 0; padding-left: 5mm; font-size: 11pt; line-height: 1.6; }}
.cv-time {{ margin-top: 6mm; font-size: 10.5pt; border-left: 1.2mm solid {ACCENT}; padding: 1mm 0 1mm 4mm; }}
.cv-foot {{ position: absolute; bottom: 16mm; left: 22mm; right: 22mm; font-size: 9pt; color: #666;
  border-top: 0.3mm solid #ccc; padding-top: 3mm; }}

/* programme */
.note {{ background: {TINT}; border-radius: 2mm; padding: 3mm 4mm; font-size: 8.8pt; margin-bottom: 4mm; }}
.week {{ margin-bottom: 6mm; }}
.whead {{ display: flex; align-items: baseline; gap: 3mm; }}
.wnum {{ background: {ACCENT}; color: #fff; font-weight: 700; font-size: 8.5pt; padding: 0.8mm 2.5mm; border-radius: 1mm; }}
.wtitle {{ font-size: 14pt; font-weight: 800; }}
.wsub {{ color: #666; }}
.winfo {{ display: flex; gap: 6mm; font-size: 8.6pt; color: #555; margin: 1.5mm 0 2mm; }}
table {{ border-collapse: collapse; width: 100%; }}
.prog th {{ text-align: left; font-size: 8pt; color: #777; font-weight: 600; border-bottom: 0.4mm solid #999; padding: 1mm 1.5mm; }}
.prog td {{ border-bottom: 0.2mm solid #ddd; padding: 1.25mm 1.5mm; }}
.prog td.d {{ width: 17mm; color: #555; }} .prog td.c {{ width: 10mm; color: {ACCENT}; font-weight: 700; }}
.prog td.m {{ width: 22mm; color: #555; font-size: 8.4pt; }}
.prog td.t {{ width: 14mm; color: #555; }} .prog td.k {{ width: 10mm; text-align: center; }}
.star {{ color: {ACCENT}; }}

/* imagier */
.lgrid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }}
.lcell {{ border: 0.3mm solid #bbb; border-radius: 2mm; padding: 3mm 4mm; display: grid;
  grid-template-columns: 30mm 1fr; grid-template-rows: auto 1fr; column-gap: 3mm; min-height: 62mm; }}
.lbig {{ font-size: 34pt; white-space: nowrap; font-weight: 800; color: {ACCENT}; line-height: 1; }}
.lword small {{ display: block; font-size: 7.5pt; color: #888; text-transform: uppercase; letter-spacing: 0.8pt; }}
.lword b {{ font-size: 15pt; display: block; }} .lword span {{ display: block; font-size: 9pt; }}
.lword .lsound {{ font-size: 8pt; color: #666; margin-top: 1mm; }}
.ldraw {{ grid-column: 1 / 3; border: 0.3mm dashed #ccc; border-radius: 1.5mm; margin-top: 2mm; min-height: 26mm; }}
.tipbox {{ background: {TINT}; border-radius: 2mm; padding: 3mm 4mm; margin-top: 4mm; font-size: 9pt; }}
.alpha {{ display: flex; flex-wrap: wrap; gap: 1.2mm; margin-bottom: 2mm; }}
.alpha span, .key {{ width: 8.6mm; height: 9mm; border: 0.3mm solid #bbb; border-radius: 1mm; display: inline-flex;
  align-items: center; justify-content: center; font-weight: 700; font-size: 11pt; color: #999; }}
.key {{ width: 5.5mm; height: 5.5mm; font-size: 8pt; vertical-align: middle; }}
.alpha span.on, .key.on {{ background: {ACCENT}; color: #fff; border-color: {ACCENT}; }}
.alpha span.sp, .key.sp {{ border: 0.5mm dashed #333; color: #333; }}

/* lexique */
.vcols {{ column-count: 2; column-gap: 7mm; }}
.vblock {{ break-inside: avoid; margin-bottom: 2mm; }}
.vblock h3 {{ margin-top: 0; }}
.voc td {{ padding: 0.9mm 1mm; border-bottom: 0.2mm solid #e2e2e2; vertical-align: top; font-size: 8.8pt; }}
.voc td.tk {{ white-space: nowrap; }} .voc td.ph {{ font-size: 8.2pt; }}
.nums {{ display: grid; grid-template-columns: repeat(5, 1fr); gap: 1.5mm; margin-bottom: 2mm; }}
.nums div {{ border: 0.3mm solid #ccc; border-radius: 1.5mm; padding: 1.5mm; text-align: center; }}
.nums b {{ display: block; font-size: 14pt; color: {ACCENT}; }} .nums span {{ display: block; font-size: 8.4pt; }}

/* séquences */
.shead {{ font-size: 11pt; margin-bottom: 1mm; }}
.tag {{ font-size: 8pt; color: #777; text-transform: uppercase; letter-spacing: 0.8pt; margin-bottom: 2.5mm; }}
.card {{ border: 0.3mm solid #bdbdbd; border-left: 1.2mm solid {ACCENT}; border-radius: 2mm; padding: 2.2mm 3.5mm 2mm;
  margin-bottom: 2mm; break-inside: avoid; }}
.chead {{ display: flex; align-items: center; gap: 2.2mm; margin-bottom: 0.8mm; }}
.code {{ font-weight: 800; color: {ACCENT}; font-size: 10pt; }}
.ctitle {{ font-weight: 800; font-size: 11pt; flex: 1; }}
.kind {{ font-size: 7.4pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5pt; padding: 0.3mm 1.6mm; border-radius: 1mm; }}
.kind.mov {{ background: {ACCENT}; color: #fff; }}
.kind.calm {{ border: 0.3mm solid #aaa; color: #666; }}
.cmeta {{ font-size: 8.4pt; color: #555; white-space: nowrap; background: #f1f1f1; border-radius: 1mm; padding: 0.3mm 1.8mm;
  display: inline-flex; align-items: center; gap: 1mm; }}
.hg {{ width: 2.6mm; height: 3.4mm; }}
.lbl {{ font-size: 7.4pt; text-transform: uppercase; letter-spacing: 0.6pt; color: #888; font-weight: 700; margin-right: 1mm; }}
.cline {{ font-size: 8.8pt; color: #444; }}
.duo {{ float: right; font-size: 8pt; color: {ACCENT}; font-weight: 600; }}
.cons {{ font-weight: 600; margin: 0.6mm 0; font-size: 10pt; }}
.steps {{ margin: 0.5mm 0 0; padding-left: 4.5mm; font-size: 9pt; }}
.steps li {{ margin-bottom: 0.3mm; }}
.ws {{ margin-top: 1mm; }}
.wsrow {{ display: flex; gap: 3mm; align-items: stretch; }}
.wsrow > * {{ flex: 1; }}
.done {{ font-size: 8.2pt; color: #444; white-space: nowrap; margin-left: 1mm; }}
.more {{ margin-top: 1mm; font-size: 8.4pt; color: #333; border-left: 0.6mm solid #ccc; padding-left: 2mm; }}
.more b {{ color: #555; }}
.v3 {{ margin-top: 1mm; font-size: 8.4pt; color: #444; background: #f3f3f3; border-radius: 1mm; padding: 0.8mm 2mm; }}
.v3 b {{ color: {ACCENT}; }}
.side {{ float: right; margin: 0 0 1mm 4mm; }}
.side .wsrow > div:empty {{ display: none; }}
.side .bigl {{ display: flex; align-items: center; gap: 2mm; }}
.side .bigl p {{ width: 28mm; margin: 0; }}
.bigl {{ display: flex; align-items: center; gap: 4mm; }}
.more, .v3 {{ clear: both; }}
.bigl span {{ font-size: 34pt; line-height: 1; font-weight: 800; color: #fff; -webkit-text-stroke: 0.35mm #999;
  border: 0.3mm dashed #ccc; border-radius: 2mm; padding: 0 4mm; }}
.drawbox {{ border: 0.3mm dashed #aaa; border-radius: 1.5mm; position: relative; }}
.drawbox span {{ position: absolute; top: 1mm; left: 2mm; font-size: 7.8pt; color: #888; }}
.shapes {{ display: flex; gap: 10mm; }}
.shapes div {{ text-align: center; }} .shapes svg {{ width: 22mm; height: 22mm; display: block; }}
.shapes span {{ font-size: 9pt; font-weight: 700; }}
.flag {{ width: 30mm; height: 20mm; flex: 0 0 30mm !important; }}
.choice {{ display: flex; gap: 8mm; font-size: 10pt; }}
.bilan {{ display: grid; grid-template-columns: 1fr 1fr; gap: 0.8mm 5mm; font-size: 9pt; }}

/* hymne */
.vers {{ border: 0.3mm solid #bbb; border-radius: 2mm; padding: 4mm 5mm; margin-bottom: 2mm; }}
.vnum {{ font-weight: 800; color: {ACCENT}; font-size: 10pt; }}
.vtxt {{ font-size: 16pt; font-weight: 700; margin: 1.5mm 0; line-height: 1.3; }}
.vph {{ font-size: 11pt; font-style: italic; color: #555; }}
.chunks {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; }}
.chunk {{ border: 0.4mm solid {ACCENT}; border-radius: 2mm; padding: 3mm; text-align: center; }}
.chunk small {{ display: block; font-size: 7.5pt; color: #888; text-transform: uppercase; }}
.chunk b {{ display: block; font-size: 13pt; margin: 1mm 0; }} .chunk i {{ font-size: 9pt; color: #555; }}
.short {{ margin: 4mm 0; font-size: 10.5pt; }}
.sens {{ background: {TINT}; border-radius: 2mm; padding: 3mm 5mm; margin-bottom: 4mm; }}
.sens h3 {{ margin-top: 0; }} .sens p {{ font-size: 11pt; }}
.warn {{ border: 0.4mm solid #333; border-radius: 2mm; padding: 3mm 4mm; font-size: 8.8pt; margin: 3mm 0; }}
.tip2 {{ font-size: 9pt; color: #444; }}
.verif {{ margin-top: 3mm; font-size: 8.8pt; font-weight: 600; border-top: 0.3mm solid #ccc; padding-top: 2mm; }}

/* jetons */
.tokens th {{ font-size: 8.5pt; color: #666; padding: 1mm; }}
.tokens tbody th {{ text-align: left; color: #222; width: 20mm; font-size: 8.5pt; }}
.tokens td {{ padding: 1mm; text-align: center; }}
.tok {{ width: 11mm; height: 11mm; border: 0.5mm solid {ACCENT}; border-radius: 50%; margin: auto; position: relative; }}
.tok small {{ position: absolute; top: 0.6mm; left: 0; right: 0; font-size: 6.5pt; color: #aaa; }}
.tok.bonus {{ border-style: dashed; background: {TINT}; }}
.tokrow {{ display: flex; gap: 5mm; margin-top: 4mm; }}
.box {{ flex: 1; border: 0.3mm solid #bbb; border-radius: 2mm; padding: 3mm 4mm; }}
.box h3 {{ margin-top: 0; }}
.big-fill {{ font-size: 14pt; font-weight: 700; margin: 2mm 0 1mm; }}
.counter {{ display: flex; gap: 1.8mm; margin-bottom: 2mm; }}
.cnt {{ width: 9mm; height: 9mm; border: 0.4mm solid {ACCENT}; border-radius: 50%; position: relative; }}
.cnt small {{ position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 7pt; color: #bbb; }}
.journal th {{ font-size: 8pt; color: #666; text-align: left; border-bottom: 0.4mm solid #999; padding: 1mm; }}
.journal td {{ border-bottom: 0.2mm solid #ccc; height: 7.5mm; }}
.journal.obs td {{ height: 12mm; }} .journal.obs td:first-child {{ width: 16mm; font-weight: 700; color: {ACCENT}; }}
.reserve {{ margin-top: 4mm; background: {TINT}; border-radius: 2mm; padding: 3mm 4mm; }}

/* catalogue */
.rcat {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; }}
.rcat > div {{ border: 0.3mm solid #bbb; border-radius: 2mm; padding: 3mm; }}
.rcat h3 {{ margin: 0; }}
.rslot {{ margin-top: 3mm; }}
.rdraw {{ height: 60mm; border: 0.3mm dashed #bbb; border-radius: 1.5mm; }}
.rprice {{ margin-top: 1.5mm; font-size: 9pt; }}

/* papa + signaux */
.pcols {{ display: grid; grid-template-columns: 1fr 1fr; gap: 7mm; font-size: 10pt; }}
.pcols .mini {{ font-size: 9pt; }}
.pcols h3:first-child {{ margin-top: 0; }}
.pcols ul, .sbox ul {{ margin: 0; padding-left: 4mm; }} .pcols li, .sbox li {{ margin-bottom: 0.8mm; }}
.sig {{ display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; font-size: 10pt; }}
.sbox {{ border: 0.3mm solid #bbb; border-radius: 2mm; padding: 3mm 4mm; }}
.sbox h3 {{ margin-top: 0; }} .sbox p {{ margin: 2mm 0 0; }}
'''

HTML = f'''<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>Nevra · Mois 1 · Novembre 2026</title>
<style>{CSS}</style></head><body>{"".join(pages)}</body></html>'''

# « week-end » ne doit jamais être coupé au trait d'union en fin de ligne
HTML = re.sub(r"([Ww]eek-end)", r'<span class="nw">\1</span>', HTML)
OUT.write_text(HTML, encoding="utf-8")
print(f"{OUT} · {PAGE_NO[0]} pages")
