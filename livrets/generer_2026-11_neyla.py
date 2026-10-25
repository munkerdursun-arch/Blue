#!/usr/bin/env python3
"""Génère le livret du mois 1 (novembre 2026) de Neyla en HTML A4.

Usage : python3 generer_2026-11_neyla.py  -> écrit 2026-11_Neyla_mois1.html
Le PDF est ensuite produit par rendre_pdf.cjs (Chromium / Playwright).
"""
import re
from pathlib import Path

ACCENT = "#1B6E86"      # couleur d'accent de Neyla (bleu pétrole)
TINT = "#E6F1F4"        # même teinte, très claire
OUT = Path(__file__).with_name("2026-11_Neyla_mois1.html")

# ---------------------------------------------------------------- helpers
def tr(word, phon, fr=None):
    """Mot turc + phonétique (+ sens)."""
    s = f'<b class="tk">{word}</b> <span class="ph">« {phon} »</span>'
    return s + (f" = {fr}" if fr else "")


def trace(*groups):
    """Lignes d'écriture avec lettres grises à repasser."""
    rows = "".join(f'<div class="trace"><span>{g}</span></div>' for g in groups)
    return f'<div class="ws-trace">{rows}</div>'


def draw(label, h=19):
    return f'<div class="drawbox" style="height:{h}mm"><span>Dessine : <b>{label}</b></span></div>'


def readlist(items, big=True):
    cls = "readlist big" if big else "readlist"
    return f'<div class="{cls}">' + "".join(f"<span>{i}</span>" for i in items) + "</div>"


def lines(n=2):
    return '<div class="wlines">' + '<div class="wl"></div>' * n + "</div>"


def row(*parts):
    return '<div class="wsrow">' + "".join(parts) + "</div>"


def calc(items):
    return '<div class="calc">' + "".join(
        f'<div><span class="op">{a}</span><span class="tro">{b}</span></div>' for a, b in items
    ) + "</div>"


# ---------------------------------------------------------------- séquences
# Chaque séquence : code, jour, titre, durée, matériel, consigne, étapes, espace de travail, à deux (★)
W = {}

W[1] = dict(
    titre="Merhaba !", sous="Saluer, remercier, se présenter",
    dates="lundi 2 → dimanche 8 novembre", lettres="A · E · M", mdp="Merhaba",
    seq=[
        ("1·1", "Lun 2", "Les peluches parlent turc", "10 min", "2 peluches",
         "« Ces peluches ne parlent que turc. Dis-leur bonjour ! »",
         ["La peluche arrive : " + tr("Merhaba !", "mèr-ha-ba", "bonjour") + ". Neyla répond pareil.",
          "La peluche s'en va : " + tr("Hoşça kal !", "hoch-tcha kal", "au revoir") + " (celle qui part).",
          "Neyla répond " + tr("Güle güle !", "gu-lè gu-lè") + " (celle qui reste).",
          "On échange : Neyla fait parler la peluche."], "", True),
        ("1·2", "Mar 3", "Lettre A comme araba", "15 min", "crayon, petite voiture",
         "« En turc, A se lit [a], comme en français. Repasse-la, puis dessine une voiture. »",
         ["Faire rouler la voiture en disant " + tr("araba", "a-ra-ba", "voiture") + ".",
          "Repasser les lettres, puis dessiner."],
         row(trace("A A A a a a"), draw("araba")), False),
        ("1·3", "Mer 4", "Bir, iki, üç, dört, beş", "10 min", "5 petits objets",
         "« Compte les objets en turc. »",
         [tr("bir", "bir", "1") + " · " + tr("iki", "i-ki", "2") + " · " + tr("üç", "utch", "3") + " · "
          + tr("dört", "deurt", "4") + " · " + tr("beş", "bèch", "5"),
          "Papa cache des objets et demande " + tr("Kaç ?", "katch", "combien ?") + " Neyla répond en turc.",
          "Pour finir : 5 sauts en comptant."], "", True),
        ("1·4", "Jeu 5", "Lettre E comme elma", "15 min", "une pomme, crayon",
         "« En turc, E se lit [è], comme dans « mère ». »",
         ["Dire " + tr("elma", "èl-ma", "pomme") + ", puis croquer la pomme.",
          "Jeu éclair : papa montre la pomme ou la voiture, Neyla dit <b>elma</b> ou <b>araba</b>.",
          "Repasser, puis dessiner."],
         row(trace("E E E e e e"), draw("elma")), False),
        ("1·5", "Ven 6", "La marchande", "10 min", "5 fruits ou objets",
         "« Demande avec lütfen, remercie avec teşekkür ederim. »",
         ["Neyla : « Elma, " + tr("lütfen", "lut-fènn", "s'il te plaît") + ". »",
          "Papa donne. Neyla : « " + tr("Teşekkür ederim !", "tè-chèk-kur è-dè-rim", "merci") + " »",
          "On inverse : Neyla est la marchande."], "", True),
        ("1·6", "Sam 7", "Lettre M et premières syllabes", "15 min", "crayon",
         "« M + a = ma. Lis avec moi ! »",
         ["Taper sur la table : " + tr("masa", "ma-ssa", "table") + ".",
          "Lire les syllabes en tapant dans les mains, puis repasser M."],
         row(readlist(["ma", "me", "am", "em", "ma-ma"]), trace("M M M m m m")), False),
        ("1·7", "Sam 7", "Le matin, le soir, la nuit", "15 min", "aucun",
         "« Je mime un moment de la journée. Dis la bonne formule ! »",
         [tr("Günaydın", "gu-naï-deunn", "bonjour (le matin)") + " : mimer le réveil.",
          tr("İyi akşamlar", "i-yi ak-chamm-lar", "bonsoir") + " : mimer le dîner.",
          tr("İyi geceler", "i-yi guè-djè-lèr", "bonne nuit") + " : mimer le dodo.",
          "Ce soir, au coucher, Neyla dit <b>İyi geceler</b> à toute la famille."], "", True),
        ("1·8", "Dim 8", "Ma carte d'identité turque", "15 min", "crayons, photo (option)",
         "« Réponds à la peluche : Adın ne ? »",
         ["Papa : " + tr("Adın ne ?", "a-deunn nè", "comment tu t'appelles ?"),
          "Neyla : " + tr("Benim adım Neyla.", "bè-nim a-deum Neyla", "je m'appelle Neyla"),
          "Neyla pose la question à papa, puis remplit sa carte."],
         '<div class="idcard"><div class="idphoto">photo<br>ou dessin</div><div class="idtxt">'
         '<div>Adım <span class="ph">(mon nom)</span> : <span class="fill"></span></div>'
         '<div>Yaşım <span class="ph">(mon âge)</span> : <span class="fill short"></span></div>'
         '<div>Ülkelerim <span class="ph">(mes pays)</span> : <span class="fill"></span></div></div></div>', False),
        ("1·9", "Dim 8", "Mes jetons, mon seuil", "15 min", "jetons, bocal, page « Tableau de jetons »",
         "« Chaque séance te rapporte un jeton. À combien de jetons veux-tu échanger ? »",
         ["Compter les jetons de la semaine en turc : bir, iki, üç…",
          "Regarder le catalogue de récompenses ensemble.",
          "Neyla choisit son seuil (papa propose entre 5 et 12) et l'écrit sur la page des jetons.",
          "Idée clé : « Si tu attends plus longtemps, tu peux viser plus grand. »"], "", False),
    ])

W[2] = dict(
    titre="Ben ve ailem", sous="Moi et ma famille",
    dates="lundi 9 → dimanche 15 novembre", lettres="İ · O · N", mdp="Teşekkür ederim",
    seq=[
        ("2·1", "Lun 9", "Nasılsın ?", "10 min", "2 peluches",
         "« La peluche demande Nasılsın ? Réponds İyiyim ! »",
         [tr("Nasılsın ?", "na-seul-seunn", "comment vas-tu ?") + " → "
          + tr("İyiyim !", "i-yi-yimm", "je vais bien") + " (pouce levé).",
          "La peluche joue la comédie (fatiguée, grognon) : Neyla la console.",
          "Toute la semaine, papa demande <b>Nasılsın ?</b> au dîner."], "", True),
        ("2·2", "Mar 10", "Le drapeau turc", "15 min", "crayon rouge",
         "« Colorie le drapeau en rouge. La lune et l'étoile restent blanches. »",
         [tr("bayrak", "baï-rak", "drapeau") + " · " + tr("kırmızı", "keur-meu-zeu", "rouge") + " · "
          + tr("beyaz", "bè-yaz", "blanc"),
          tr("ay", "aï", "lune / croissant") + " · " + tr("yıldız", "yeul-deuz", "étoile"),
          "Chaque 10 novembre, la Turquie observe une minute de silence en souvenir d'Atatürk. "
          "Vérifie l'heure exacte sur une source officielle."],
         "FLAG", False),
        ("2·3", "Mer 11", "Lettre İ comme inek", "15 min", "crayon",
         "« Le i turc garde toujours son point, même en majuscule : İ. »",
         ["Faire « meuh » et dire " + tr("inek", "i-nèk", "vache") + ".",
          "Lire les syllabes, puis repasser İ.",
          "Pour papa : le I <i>sans</i> point (ı) est une autre lettre, vue plus tard."],
         row(readlist(["mi", "im", "ma", "me", "mi-mi"]), trace("İ İ İ i i i")), False),
        ("2·4", "Jeu 12", "Altı, yedi, sekiz, dokuz, on", "10 min", "10 petits objets",
         "« Je dis un nombre, tu fais autant de sauts ! »",
         [tr("altı", "al-teu", "6") + " · " + tr("yedi", "yè-di", "7") + " · " + tr("sekiz", "sè-kiz", "8")
          + " · " + tr("dokuz", "do-kouz", "9") + " · " + tr("on", "onn", "10"),
          "Compter sur les doigts de 1 à 10, puis papa dit un nombre et Neyla saute.",
          "On inverse : Neyla dit un nombre, papa saute."], "", True),
        ("2·5", "Ven 13", "Lettre O comme okul", "10 min", "crayon",
         "« O se lit [o], comme en français. »",
         ["Dire " + tr("okul", "o-koul", "école") + " : « Ton école, c'est ton okul ! »",
          "Lire les syllabes, puis repasser O."],
         row(readlist(["mo", "om", "mi", "me", "ma"]), trace("O O O o o o")), False),
        ("2·6", "Sam 14", "Lettre N : je lis mes premiers mots !", "15 min", "crayon",
         "« N se lit [n], jamais nasal : a-n, comme dans « panne ». »",
         ["Dire " + tr("nar", "nar", "grenade") + ", puis lire na, ne, ni, no.",
          "Lire les vrais mots turcs ci-dessous. Grand moment : Neyla lit <b>anne</b> à maman !"],
         readlist(["anne", "on", "ne", "ama", "nane"]) +
         '<p class="mini">anne « ann-nè » = maman · on « onn » = dix · ne « nè » = quoi · '
         'ama « a-ma » = mais · nane « na-nè » = menthe</p>', False),
        ("2·7", "Sam 14", "Ma famille", "15 min", "photos de famille",
         "« Montre une photo et dis qui c'est : Bu annem ! »",
         [tr("Bu annem.", "bou ann-nèmm", "c'est ma maman") + " · "
          + tr("Bu babam.", "bou ba-bamm", "c'est mon papa"),
          tr("Bu kardeşim Nevra.", "bou kar-dè-chimm", "c'est ma petite sœur Nevra"),
          "Neyla est l'" + tr("abla", "a-bla", "grande sœur") + " de Nevra. Puis elle dessine sa famille."],
         draw("ma famille (écris anne, baba…)", 30), True),
        ("2·8", "Dim 15", "Artı, eşittir", "15 min", "10 petits objets",
         "« Bir artı bir eşittir… ? »",
         [tr("artı", "ar-teu", "plus") + " · " + tr("eşittir", "è-chit-tir", "égale"),
          "Manipuler les objets, puis papa lit le calcul en turc et Neyla répond en turc."],
         calc([("2 + 3 = ___", "iki artı üç"), ("4 + 1 = ___", "dört artı bir"),
               ("5 + 5 = ___", "beş artı beş"), ("3 + 4 = ___", "üç artı dört")]), False),
        ("2·9", "Dim 15", "Saute sur la lettre", "15 min", "6 feuilles, gros feutre",
         "« Je dis un son, tu sautes sur la bonne lettre ! »",
         ["Écrire A, E, İ, O, M, N en grand sur 6 feuilles posées au sol.",
          "Papa dit [a], [è], [mmm]… Neyla saute sur la lettre.",
          "On inverse : Neyla dit le son, papa saute. Finir sur une réussite."], "", True),
    ])

W[3] = dict(
    titre="Bu ne ?", sous="Qu'est-ce que c'est ?",
    dates="lundi 16 → dimanche 22 novembre", lettres="U · L · B", mdp="Korkma !",
    seq=[
        ("3·1", "Lun 16", "Evet ou hayır ?", "10 min", "une pomme, une petite voiture",
         "« Je dis des bêtises : réponds Evet ! ou Hayır ! »",
         [tr("evet", "è-vèt", "oui") + " · " + tr("hayır", "ha-yeur", "non") + " · "
          + tr("bu", "bou", "ceci / c'est"),
          "Papa montre la pomme : « Bu araba ? » → « Hayır ! » ; « Bu elma ? » → « Evet ! »",
          "Neyla essaie de piéger papa à son tour."], "", True),
        ("3·2", "Mar 17", "Lettre U comme uçak", "15 min", "une feuille A4, crayon",
         "« Attention : en turc, U se lit [ou]. »",
         ["Dire " + tr("uçak", "ou-tchak", "avion") + ", plier un avion en papier et l'appeler uçak.",
          "Lire les syllabes, repasser U, puis lancer l'avion en comptant jusqu'à 10."],
         row(readlist(["mu", "nu", "un", "on", "mo"]), trace("U U U u u u")), False),
        ("3·3", "Mer 18", "Les problèmes de ballons", "15 min", "petits objets",
         "« Écoute l'histoire en turc et trouve combien. »",
         ["<span class=\"oneline\">Papa lit : <i>« Neyla'nın üç balonu var. Babası ona iki balon daha veriyor. Neyla'nın kaç balonu var ? »</i></span>",
          "(Neyla a 3 ballons. Papa lui en donne 2 de plus. Combien en a-t-elle ?) Neyla répond en turc. Elle fait ensuite la grille."],
         calc([("3 + 2 = ___", "üç artı iki"), ("4 + 2 = ___", "dört artı iki"),
               ("6 + 3 = ___", "altı artı üç"), ("1 + 7 = ___", "bir artı yedi")]), False),
        ("3·4", "Jeu 19", "Lettre L comme lale", "15 min", "crayon",
         "« L se lit comme en français. Avec L, tu peux lire beaucoup de mots ! »",
         [tr("lale", "la-lè", "tulipe") + ", une fleur très aimée en Turquie.",
          "Lire la, le, li, lo, lu, puis les mots ci-dessous. "
          + tr("al", "al", "rouge") + " : c'est un mot de l'hymne !"],
         row(readlist(["lale", "elma", "limon", "al"]), trace("L L L l l l")), False),
        ("3·5", "Ven 20", "Le sac mystère", "10 min", "sac opaque, 5 objets (pomme, citron, voiture, balle…)",
         "« Touche sans regarder et dis en turc ce que c'est. »",
         [tr("Bu ne ?", "bou nè", "qu'est-ce que c'est ?") + " → « Bu limon. » "
          + tr("limon", "li-monn", "citron"),
          "On sort l'objet pour vérifier. Puis Neyla prépare le sac pour papa."], "", True),
        ("3·6", "Sam 21", "Lettre B : baba, abla", "15 min", "crayon",
         "« B se lit comme en français. Lis les mots de ta famille ! »",
         ["Dire " + tr("bebek", "bè-bèk", "bébé") + ", puis lire ba, be, bi, bo, bu.",
          "Lire les mots, puis écrire <b>baba</b> sur la ligne."],
         row(readlist(["baba", "abla", "bal", "balon"]), trace("B B b b baba")) +
         '<p class="mini">bal « bal » = miel · balon « ba-lonn » = ballon</p>', False),
        ("3·7", "Sam 21", "Le memory des mots", "15 min", "12 petits cartons, crayons",
         "« Pour garder une paire, lis le mot à voix haute. »",
         ["Préparer ensemble 6 cartes-mots et 6 cartes-dessins :",
          "<b>anne · baba · elma · limon · balon · lale</b>",
          "Jouer au memory. Garder les cartes pour les réviser plus tard."], "", True),
        ("3·8", "Dim 22", "De 11 à 20 : facile en turc !", "15 min", "20 petits objets",
         "« En turc, 11 se dit « dix-un » : on bir ! »",
         ["Poser 10 objets, ajouter 1 : " + tr("on bir", "onn bir", "11") + ", puis " + tr("on iki", "onn i-ki", "12") + "…",
          "Jusqu'à " + tr("yirmi", "yir-mi", "20") + ". « Plus facile qu'en français : pas de onze, douze ! »"],
         '<div class="numgrid">' + "".join(
             f'<div><b>{n}</b><span>{t}</span></div>' for n, t in [
                 (11, "on bir"), (12, "on iki"), (13, "on üç"), (14, "on dört"), (15, "on beş"),
                 (16, "on altı"), (17, "on yedi"), (18, "on sekiz"), (19, "on dokuz"), (20, "yirmi")]) + "</div>", False),
        ("3·9", "Dim 22", "Korkma ! L'hymne, vers 1", "15 min", "page de l'hymne",
         "« Écoute, puis répète par petits morceaux. »",
         ["Expliquer : c'est l'hymne national ; on se tient debout, en silence.",
          "Papa lit le vers 1 en 4 morceaux, Neyla répète chaque morceau.",
          tr("Korkma !", "kork-ma", "n'aie pas peur") + " : c'est un mot de courage."], "", False),
    ])

W[4] = dict(
    titre="Ben okuyorum !", sous="Je lis !",
    dates="lundi 23 → dimanche 29 novembre", lettres="T · K", mdp="Tamam",
    seq=[
        ("4·1", "Lun 23", "Lettre T : tamam !", "10 min", "une balle",
         "« On se lance la balle : à chaque passe, lis une syllabe. »",
         ["Dire " + tr("top", "top", "balle") + ", puis lire ta, te, ti, to, tu.",
          "Lire les mots. " + tr("tamam", "ta-mamm", "d'accord") + " : Neyla le dit toute la semaine !"],
         row(readlist(["top", "at", "et", "tamam"]), trace("T T T t t t")) +
         '<p class="mini">at « at » = cheval · et « èt » = viande</p>', True),
        ("4·2", "Mar 24", "Lettre K comme kedi", "15 min", "crayon",
         "« K se lit comme en français. »",
         ["Faire « miaou » et dire " + tr("kedi", "kè-di", "chat") + ".",
          "Lire ka, ke, ki, ko, ku, puis les mots."],
         row(readlist(["kek", "kale", "kalem", "okul", "inek", "bebek"], big=False), draw("kedi", 20)) +
         '<p class="mini">kek « kèk » = gâteau · kale « ka-lè » = château · kalem « ka-lèmm » = crayon</p>', False),
        ("4·3", "Mer 25", "Plus et moins", "15 min", "10 petits objets",
         "« Eksi veut dire « moins » : on enlève ! »",
         ["5 objets, on en enlève 2 : « beş " + tr("eksi", "èk-si", "moins") + " iki eşittir üç ».",
          "Papa lit chaque calcul en turc, Neyla répond en turc."],
         calc([("6 + 3 = ___", "altı artı üç"), ("7 + 2 = ___", "yedi artı iki"),
               ("5 − 2 = ___", "beş eksi iki"), ("8 − 3 = ___", "sekiz eksi üç")]), False),
        ("4·4", "Jeu 26", "Je lis des phrases !", "15 min", "objets de la maison",
         "« Lis la phrase, puis montre l'objet. »",
         ["Neyla lit une phrase, cherche l'objet et coche la case.",
          "Bravo : ce sont ses premières phrases en turc !"],
         '<div class="phrases">' + "".join(
             f'<div><i class="cb"></i><b>{p}</b><span>{f}</span></div>' for p, f in [
                 ("Bu elma.", "C'est une pomme."), ("Bu kalem.", "C'est un crayon."),
                 ("Bu top.", "C'est une balle."), ("Bu bebek.", "C'est un bébé."),
                 ("Anne, bu kek !", "Maman, c'est un gâteau !"), ("Tamam !", "D'accord !")]) + "</div>", False),
        ("4·5", "Ven 27", "La dictée magique", "10 min", "crayon",
         "« Je dis une syllabe en turc, tu l'écris. »",
         ["Dicter : ma · le · ti · bo · ku · ne, puis les mots <b>anne</b> et <b>top</b>.",
          "Chaque réussite : papa dit " + tr("Aferin !", "a-fè-rinn", "bravo") + "."],
         '<div class="dictee">' + '<div></div>' * 8 + "</div>", False),
        ("4·6", "Sam 28", "Maintenant ou plus tard ?", "15 min", "jetons, catalogue",
         "« Compte tes jetons en turc, puis choisis : échanger maintenant ou garder. »",
         ["Compter les jetons en turc (on bir, on iki…).",
          tr("para", "pa-ra", "argent") + " · " + tr("kumbara", "koum-ba-ra", "tirelire"),
          "Choix : une petite récompense maintenant, OU garder ses jetons pour une plus grande.",
          "Neyla explique son choix. Il n'y a pas de mauvaise réponse."],
         '<div class="choice"><div>J\'ai <span class="fill short"></span> jetons.</div>'
         '<div><i class="cb"></i> J\'échange maintenant</div><div><i class="cb"></i> J\'attends pour plus grand</div></div>', False),
        ("4·7", "Sam 28", "Korkma ! L'hymne, vers 2", "15 min", "page de l'hymne",
         "« On révise le vers 1, puis on apprend le vers 2. »",
         ["Redire le vers 1, debout.",
          "Papa lit le vers 2 en 4 morceaux, Neyla répète.",
          "Dire les deux vers d'affilée. Option : écouter un enregistrement issu d'une source officielle."], "", False),
        ("4·8", "Dim 29", "Mon film en turc", "15 min", "téléphone (option)",
         "« Présente-toi en turc, comme une présentatrice télé ! »",
         ["Répéter le texte 2 fois, puis filmer (ou jouer devant la famille) :",
          "<b>Merhaba ! Benim adım Neyla. Altı yaşındayım. Bu babam. Hoşça kal !</b>",
          tr("Altı yaşındayım", "al-teu ya-cheun-da-yeum", "j'ai six ans") + ". Envoyer à un proche turcophone si possible."],
         "", True),
        ("4·9", "Dim 29", "Mon bilan du mois", "15 min", "livret, page des jetons",
         "« Montre-moi tout ce que tu sais faire en turc ! »",
         ["Neyla coche ce qu'elle réussit. Papa compte avec elle les jetons du mois.",
          "Neyla choisit son seuil pour décembre : le garder ou le changer."],
         '<div class="bilan">' + "".join(f'<div><i class="cb"></i>{t}</div>' for t in [
             "Je dis bonjour et au revoir", "Je dis merci et s'il te plaît", "Je me présente",
             "Je compte jusqu'à 20", "Je lis les 11 lettres", "Je lis 5 mots",
             "Je lis une phrase", "Je dis le 1er vers de l'hymne"]) + "</div>", False),
    ])

# ---------------------------------------------------------------- drapeau (dessin simplifié à colorier)
FLAG = (
    '<div class="wsrow"><svg class="flag" viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">'
    '<rect x="1" y="1" width="118" height="78" fill="none" stroke="#333" stroke-width="1"/>'
    '<path d="M56.9,29.3 A20,20 0 1,0 56.9,50.7 A16,16 0 1,1 56.9,29.3 Z" fill="none" stroke="#333" stroke-width="1"/>'
    '<polygon points="57.5,40.0 63.9,37.8 64.1,31.0 68.2,36.4 74.7,34.4 70.8,40.0 74.7,45.6 68.2,43.6 64.1,49.0 63.9,42.2" '
    'fill="none" stroke="#333" stroke-width="1"/></svg>'
    '</div>'
)


# ---------------------------------------------------------------- rendu des cartes
def card(s):
    code, day, title, dur, mat, cons, steps, ws, duo = s
    ws = FLAG if ws == "FLAG" else ws
    duo_tag = '<span class="duo">★ possible avec Nevra</span>' if duo else ""
    return f'''
<div class="card">
  <div class="chead"><span class="code">{code}</span><span class="ctitle">{title}</span>
    <span class="cmeta">{day} · {dur}</span><span class="done"><i class="cb"></i>Réalisée <i class="cb"></i>Jeton</span></div>
  <div class="cline"><span class="lbl">Matériel</span> {mat} {duo_tag}</div>
  <div class="cons"><span class="lbl">Consigne</span> {cons}</div>
  <ol class="steps">{"".join(f"<li>{x}</li>" for x in steps)}</ol>
  {f'<div class="ws">{ws}</div>' if ws else ""}
</div>'''


PAGE_NO = [0]


def page(content, section, cls=""):
    PAGE_NO[0] += 1
    n = PAGE_NO[0]
    return f'''
<section class="page {cls}">
  <header class="ph-head"><span><b>Neyla</b> · Mois 1 · Kasım / Novembre 2026</span><span>{section}</span></header>
  <div class="body">{content}</div>
  <footer class="ph-foot">{n}</footer>
</section>'''


# ---------------------------------------------------------------- pages
pages = []

# 1. Couverture
pages.append(f'''
<section class="page cover">
  <div class="cv-top">Livret mensuel de turc · Mois 1</div>
  <div class="cv-month"><span>Kasım</span><small>Novembre 2026</small></div>
  <div class="cv-name">Neyla Güler</div>
  <div class="cv-letters"><span>A</span><span>E</span><span>İ</span><span>O</span><span>U</span><span>M</span><span>N</span><span>L</span><span>B</span><span>T</span><span>K</span></div>
  <div class="cv-theme"><small>Thème du mois</small>Merhaba !<br><span>Moi, ma famille et mes premières lettres</span></div>
  <div class="cv-goals"><h3>Mes 3 objectifs</h3><ol>
    <li>Saluer, remercier et me présenter en turc.</li>
    <li>Lire 11 lettres turques, des syllabes, des mots et une petite phrase.</li>
    <li>Compter jusqu'à 20 en turc et calculer jusqu'à 10.</li></ol></div>
  <div class="cv-foot">Ce livret appartient à : <b>Neyla</b> &nbsp;·&nbsp; 4 semaines · 36 séquences · environ 2 h par semaine (5 soirs de 10–15 min + 4 séquences de 15 min le week-end)</div>
</section>''')
PAGE_NO[0] += 1


# 2–3. Programme hebdomadaire
def week_table(n):
    w = W[n]
    rows = ""
    for code, day, title, dur, *_ in w["seq"]:
        rows += f'<tr><td class="d">{day}</td><td class="c">{code}</td><td>{title}</td><td class="t">{dur}</td><td class="k"><i class="cb"></i></td></tr>'
    return f'''
<div class="week">
  <div class="whead"><span class="wnum">Semaine {n}</span><span class="wtitle">{w["titre"]}</span><span class="wsub">{w["sous"]}</span></div>
  <div class="winfo"><span>{w["dates"]}</span><span>Lettres : <b>{w["lettres"]}</b></span>
    <span>Mot de passe de la semaine : <b class="acc">{w["mdp"]}</b></span></div>
  <table class="prog"><thead><tr><th>Jour</th><th>N°</th><th>Séquence</th><th>Durée</th><th>Fait</th></tr></thead>
  <tbody>{rows}</tbody></table>
</div>'''


intro = '''<div class="note">
<b>Rythme :</b> 1 séquence les soirs de semaine (10–15 min) ; 2 séquences de 15 min le samedi et 2 séquences de 15 min le dimanche (30 min par jour, soit 1&nbsp;h pour le week-end), avec une pause mouvement entre les deux. <b>Mot de passe :</b> pendant la semaine,
papa demande le mot de passe en turc avant le dessert ou une histoire. Jours libres : dim. 1<sup>er</sup> et
lun. 30 novembre (rattrapage ou repos). ★ = séquence possible à deux avec Nevra.</div>'''
pages.append(page("<h1>Programme du mois</h1>" + intro + week_table(1) + week_table(2), "Programme hebdomadaire"))
pages.append(page(week_table(3) + week_table(4), "Programme hebdomadaire"))

# 4. Imagier des lettres
LET = [("A a", "araba", "a-ra-ba", "voiture", "[a] comme « ami »"),
       ("E e", "elma", "èl-ma", "pomme", "[è] comme « mère »"),
       ("M m", "masa", "ma-ssa", "table", "comme en français"),
       ("İ i", "inek", "i-nèk", "vache", "[i] comme « lit », toujours avec un point"),
       ("O o", "okul", "o-koul", "école", "[o] comme « moto »"),
       ("N n", "nar", "nar", "grenade", "[n], jamais nasal"),
       ("U u", "uçak", "ou-tchak", "avion", "[ou] comme « loup »"),
       ("L l", "lale", "la-lè", "tulipe", "comme en français"),
       ("B b", "bebek", "bè-bèk", "bébé", "comme en français"),
       ("T t", "top", "top", "balle", "comme en français"),
       ("K k", "kedi", "kè-di", "chat", "[k] comme « kiwi »")]
cells = "".join(f'''<div class="lcell"><div class="lbig">{l}</div><div class="lword"><b>{w}</b>
<span class="ph">« {p} »</span><span>{f}</span></div><div class="lsound">{s}</div><div class="ldraw"></div></div>'''
                for l, w, p, f, s in LET)
ALPHA = "A B C Ç D E F G Ğ H I İ J K L M N O Ö P R S Ş T U Ü V Y Z".split()
M1 = set("A E M İ O N U L B T K".split())
SPEC = set("Ç Ğ I Ö Ş Ü".split())
strip = "".join(f'<span class="{"on" if a in M1 else ""} {"sp" if a in SPEC else ""}">{a}</span>' for a in ALPHA)
pages.append(page(f'''<h1>Mon imagier : mes 11 lettres de novembre</h1>
<p class="lead">Dans chaque case, Neyla dessine le mot-image. Les lettres turques se lisent toujours de la même façon.</p>
<div class="lgrid">{cells}<div class="lcell tip"><b>Astuce</b><br>Le turc se lit comme il s'écrit :
une lettre = un son. Pas de lettres muettes… sauf une : le <b>ğ</b> !</div></div>
<h2>L'alphabet turc complet (29 lettres)</h2>
<div class="alpha">{strip}</div>
<p class="mini"><span class="key on">A</span> lettres de ce mois &nbsp; <span class="key sp">Ç</span> lettres propres au turc, vues plus tard :
<b>Ç</b> « tch » · <b>Ğ</b> muet (allonge la voyelle d'avant) · <b>I ı</b> sans point, son proche de « eu » · <b>Ö</b> « eu » ·
<b>Ş</b> « ch » · <b>Ü</b> « u » français. Pas de Q, W ni X en turc.</p>''', "Imagier"))

# 5. Lexique
VOC = [
    ("Saluer et être poli", [("Merhaba", "mèr-ha-ba", "bonjour, salut"), ("Günaydın", "gu-naï-deunn", "bonjour (le matin)"),
                             ("İyi akşamlar", "i-yi ak-chamm-lar", "bonsoir"), ("İyi geceler", "i-yi guè-djè-lèr", "bonne nuit"),
                             ("Hoşça kal", "hoch-tcha kal", "au revoir (dit par celui qui part)"),
                             ("Güle güle", "gu-lè gu-lè", "au revoir (dit par celui qui reste)"),
                             ("Lütfen", "lut-fènn", "s'il te plaît"), ("Teşekkür ederim", "tè-chèk-kur è-dè-rim", "merci"),
                             ("Evet / Hayır", "è-vèt / ha-yeur", "oui / non"), ("Tamam", "ta-mamm", "d'accord"),
                             ("Aferin !", "a-fè-rinn", "bravo !")]),
    ("Me présenter", [("Adın ne ?", "a-deunn nè", "comment tu t'appelles ?"), ("Benim adım Neyla.", "bè-nim a-deum Neyla", "je m'appelle Neyla"),
                      ("Nasılsın ?", "na-seul-seunn", "comment vas-tu ?"), ("İyiyim.", "i-yi-yimm", "je vais bien"),
                      ("Altı yaşındayım.", "al-teu ya-cheun-da-yeum", "j'ai six ans"), ("Bu ne ?", "bou nè", "qu'est-ce que c'est ?")]),
    ("Ma famille", [("anne / annem", "ann-nè / ann-nèmm", "maman / ma maman"), ("baba / babam", "ba-ba / ba-bamm", "papa / mon papa"),
                    ("abla", "a-bla", "grande sœur"), ("kardeşim", "kar-dè-chimm", "mon petit frère / ma petite sœur")]),
    ("Le drapeau", [("bayrak", "baï-rak", "drapeau"), ("kırmızı", "keur-meu-zeu", "rouge"), ("beyaz", "bè-yaz", "blanc"),
                    ("ay", "aï", "lune, croissant"), ("yıldız", "yeul-deuz", "étoile")]),
]
voc_html = "".join(f'<div class="vblock"><h3>{t}</h3><table class="voc">' +
                   "".join(f'<tr><td class="tk">{a}</td><td class="ph">« {b} »</td><td>{c}</td></tr>' for a, b, c in items) +
                   "</table></div>" for t, items in VOC)
nums = [("0", "sıfır", "seu-feur"), ("1", "bir", "bir"), ("2", "iki", "i-ki"), ("3", "üç", "utch"), ("4", "dört", "deurt"),
        ("5", "beş", "bèch"), ("6", "altı", "al-teu"), ("7", "yedi", "yè-di"), ("8", "sekiz", "sè-kiz"),
        ("9", "dokuz", "do-kouz"), ("10", "on", "onn"), ("20", "yirmi", "yir-mi")]
num_html = '<div class="nums">' + "".join(f'<div><b>{a}</b><span class="tk">{b}</span><span class="ph">« {c} »</span></div>' for a, b, c in nums) + "</div>"
pages.append(page(f'''<h1>Mes mots de novembre</h1>
<p class="lead">La prononciation entre « » est une aide en sons français (voir les règles page « Pour le papa »).</p>
<div class="vcols">{voc_html}</div>
<h2>Les nombres · <span class="tk">sayılar</span> <span class="ph">« saï-ya-lar »</span></h2>{num_html}
<p class="mini">11 à 19 : <b>on</b> + unité (on bir = 11, on iki = 12…). Calculs : <b>artı</b> « ar-teu » = plus ·
<b>eksi</b> « èk-si » = moins · <b>eşittir</b> « è-chit-tir » = égale · <b>Kaç ?</b> « katch » = combien ?
· Après un nombre, le nom reste au singulier : <i>iki elma</i> (deux pommes).</p>''', "Lexique"))

# 6–13. Séquences détaillées : 2 pages par semaine (5 soirs, puis le week-end)
for n in range(1, 5):
    seqs = W[n]["seq"]
    head = f'<div class="shead"><span class="wnum">Semaine {n}</span> <b>{W[n]["titre"]}</b> · {W[n]["sous"]}</div>'
    pages.append(page(head + '<div class="tag">Les soirs · 10 à 15 min</div>' + "".join(card(s) for s in seqs[:5]),
                      f"Séquences · semaine {n}", "seqpage"))
    pages.append(page(head + '<div class="tag">Le week-end · 2 séquences de 15 min le samedi et 2 séquences de 15 min le dimanche (30 min par jour, soit 1&nbsp;h pour le week-end)</div>' + "".join(card(s) for s in seqs[5:]),
                      f"Séquences · semaine {n}", "seqpage"))

# 14. Hymne
VERS = [
    ("Korkma, sönmez bu şafaklarda yüzen al sancak;",
     "Kork-ma, seun-mèz bou cha-fak-lar-da yu-zènn al sann-djak",
     [("Korkma", "kork-ma"), ("sönmez", "seun-mèz"), ("bu", "bou"), ("şafaklarda", "cha-fak-lar-da"),
      ("yüzen", "yu-zènn"), ("al", "al"), ("sancak", "sann-djak")]),
    ("Sönmeden yurdumun üstünde tüten en son ocak.",
     "Seun-mè-dènn your-dou-moun us-tun-dè tu-tènn ènn sonn o-djak",
     [("Sönmeden", "seun-mè-dènn"), ("yurdumun", "your-dou-moun"), ("üstünde", "us-tun-dè"),
      ("tüten", "tu-tènn"), ("en", "ènn"), ("son", "sonn"), ("ocak", "o-djak")]),
]
v_html = ""
for i, (t, p, words) in enumerate(VERS, 1):
    chunks = "".join(f'<span><b>{a}</b><i>{b}</i></span>' for a, b in words)
    v_html += f'''<div class="vers"><div class="vnum">Vers {i}<small>{"semaine 3 (séq. 3·9)" if i == 1 else "semaine 4 (séq. 4·7)"}</small></div>
<div class="vtxt">{t}</div><div class="vph">« {p} »</div><div class="vchunks">{chunks}</div></div>'''
pages.append(page(f'''<h1>L'hymne du mois · <span class="tk">İstiklal Marşı</span></h1>
<p class="lead">« La Marche de l'Indépendance », hymne national de la Turquie, écrit par le poète Mehmet Akif Ersoy
et adopté par la Grande Assemblée nationale de Turquie le 12 mars 1921 (date généralement citée, à confirmer sur une source officielle). Ce mois-ci : <b>les 2 premiers vers</b>.</p>
{v_html}
<div class="sens"><h3>Ce que ça veut dire (version simplifiée pour Neyla)</h3>
<p>« N'aie pas peur ! Notre drapeau rouge flotte dans le ciel du matin. Il ne s'éteindra jamais,
tant que le dernier foyer de notre pays restera allumé. » <span class="mini">(traduction libre, non officielle)</span></p>
<p class="mini">Mot à mot : <b>korkma</b> n'aie pas peur · <b>sönmez</b> ne s'éteint pas · <b>şafak</b> aube ·
<b>yüzen</b> qui flotte (litt. « qui nage ») · <b>al sancak</b> le drapeau rouge · <b>yurt</b> le pays, la patrie ·
<b>tüten</b> qui fume · <b>en son ocak</b> le tout dernier foyer.
Traduction libre et non officielle.</p></div>
<div class="warn"><b>À vérifier par le papa :</b> texte et traduction à faire vérifier par un locuteur natif ; comparez aussi le texte avec le texte officiel
publié par une institution de l'État turc (par exemple la Grande Assemblée nationale, TBMM) avant de le faire apprendre.
Pour la mélodie, cherchez vous-même un enregistrement issu d'une source officielle : aucun lien n'est fourni ici.
La phonétique est une approximation.</div>
<div class="tip2"><b>Comment l'apprendre :</b> debout, par morceaux de 2 ou 3 mots, papa dit, Neyla répète.
Une seule fois par séance, puis on passe à autre chose. Pas d'exigence de perfection.</div>
<p class="verif">Texte à vérifier avant apprentissage : comparer avec le texte officiel publié par la Grande Assemblée nationale de Turquie (TBMM).</p>''', "Hymne"))

# 15. Tableau de jetons
DAYS = ["L", "M", "M", "J", "V", "S1", "S2", "D1", "D2"]
grid = "".join(
    f'<tr><th>Semaine {n}</th>' + "".join(f'<td><div class="tok"><small>{d}</small></div></td>' for d in DAYS)
    + '<td><div class="tok bonus"><small>+1</small></div></td></tr>' for n in range(1, 5))
counter = "".join(f'<div class="cnt"><small>{i}</small></div>' for i in range(1, 16))
pages.append(page(f'''<h1>Mon tableau de jetons · <span class="tk">jetonlarım</span></h1>
<p class="lead"><b>1 jeton</b> par séance réalisée : 9 séances par semaine (5 soirs + 2 le samedi + 2 le dimanche) · <b>+1 jeton bonus</b>
si les 9 séances de la semaine sont faites. Maximum : 9 jetons + 1 bonus = 10 par semaine, soit 40 pour le mois. On colorie une case par jeton gagné.</p>
<table class="tokens"><thead><tr><th></th>{"".join(f"<th>{d}</th>" for d in DAYS)}<th>Bonus</th></tr></thead><tbody>{grid}</tbody></table>
<div class="tokrow">
  <div class="box"><h3>Mon seuil d'échange : comment ça marche</h3>
    <p class="mini">C'est moi qui choisis mon seuil (je l'écris dans la case « Mon seuil du mois »).
    Quand j'atteins mon seuil, je choisis une récompense et mon compteur repart à zéro.
    Je peux changer mon seuil le mois prochain, avec papa.</p></div>
  <div class="box"><h3>Récompense en cours</h3><p>Je vise :</p><div class="wl"></div><div class="wl"></div>
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

# 16. Catalogue + page du papa
pages.append(page(f'''<h1>Mon catalogue de récompenses</h1>
<p class="lead">À remplir avec Neyla. Le « prix » en jetons est décidé ensemble. Exemples en gris, à remplacer.</p>
<div class="cat">
 <div><h3>Petites</h3><p class="mini">= mon seuil</p><p class="ex">1 carte à collectionner</p><div class="wl"></div><div class="wl"></div><div class="wl"></div></div>
 <div><h3>Moyennes</h3><p class="mini">= 2 × mon seuil</p><p class="ex">un petit cadeau</p><div class="wl"></div><div class="wl"></div><div class="wl"></div></div>
 <div><h3>Grande</h3><p class="mini">réserve de fin d'année</p><p class="ex">une sortie choisie (parc, piscine…)</p><div class="wl"></div><div class="wl"></div><div class="wl"></div></div>
</div>
<h1 class="papa">Pour le papa</h1>
<div class="pcols">
<div>
<h3>Durée conseillée</h3>
<p>Soir : 1 séquence de 10 à 15 min, minuteur visible. Week-end : 2 séquences de 15 min le samedi et 2 séquences de 15 min le dimanche (30 min par jour, soit 1&nbsp;h pour le week-end), avec 2 min de mouvement entre les deux. Soit environ 2 h par semaine. <b>Mieux vaut s'arrêter tôt sur une réussite</b> que finir dans la lassitude.</p>
<h3>Matériel du mois</h3>
<p>Crayons (dont un rouge), 2 peluches, 20 petits objets, un sac opaque, une balle, une petite voiture, une pomme,
un citron, 12 petits cartons, 6 feuilles A4, un bocal pour les jetons, un minuteur ou sablier, un téléphone (option).</p>
<h3>Lire la phonétique « … »</h3>
<p class="mini"><b>e</b>→è · <b>u</b>→ou · <b>ü</b>→u · <b>ö</b>→eu · <b>ı</b>→eu (lèvres non arrondies) · <b>c</b>→dj · <b>ç</b>→tch ·
<b>ş</b>→ch · <b>s</b>→ss toujours · <b>g</b>→gu toujours · <b>h</b> toujours soufflé · <b>r</b> légèrement roulé ·
<b>ğ</b> muet · <b>an, en, on, in</b> jamais nasaux (d'où « onn », « ann »). Ces transcriptions sont approximatives.</p>
<h3>Interférences attendues avec le français</h3>
<p class="mini">Neyla apprend à lire en français : elle lira peut-être <b>u</b> comme « u » ou <b>on</b> comme « on » nasal.
C'est normal. Dites simplement : « En turc, ça se lit… » et redites le bon son, sans insister.</p>
</div>
<div>
<h3>Conseils</h3>
<ul>
<li>Le plaisir d'abord : jeux, mouvement, humour. Une seule consigne à la fois.</li>
<li>Laisser 2 choix (« lettre ou nombres d'abord ? »).</li>
<li>Félicitations immédiates et précises : « Aferin ! Tu as lu <i>anne</i> toute seule ! »</li>
<li>Ne pas corriger sèchement : redire le mot correctement, avec le sourire.</li>
<li>Valoriser son rôle d'<b>abla</b> : Neyla peut apprendre un mot à Nevra ou à maman.</li>
<li>Une séance raccourcie mais faite compte. <b>Ne jamais retirer un jeton.</b></li>
</ul>
<h3>Signaux à observer</h3>
<p class="mini"><b>Ça marche :</b> elle réutilise un mot sans qu'on lui demande, réclame un jeu, corrige papa.<br>
<b>Saturation :</b> bâillements, répond au hasard, « c'est nul » → passer à un jeu de mouvement, raccourcir.<br>
<b>Refus :</b> ne pas forcer ; proposer une version de 5 min ou reporter. Noter quels jeux plaisent le plus.<br>
<b>À signaler à l'enseignante :</b> des difficultés de lecture qui persistent <i>aussi</i> en français.</p>
<h3>À savoir</h3>
<p class="mini">Ce programme est une adaptation libre inspirée du CP français ; ce n'est pas un programme officiel turc.
Le texte de l'hymne doit être vérifié sur une source officielle.</p>
</div></div>''', "Récompenses · Pour le papa"))

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
h1.papa {{ margin-top: 6mm; padding-top: 4mm; border-top: 0.3mm solid #ccc; }}
h2 {{ font-size: 12pt; margin: 5mm 0 2mm; color: #222; }}
h3 {{ font-size: 10pt; margin: 3mm 0 1mm; color: {ACCENT}; }}
p {{ margin: 0 0 2mm; }}
.lead {{ color: #444; margin-bottom: 4mm; }}
.mini {{ font-size: 8.2pt; color: #555; line-height: 1.35; }}
.tk {{ font-weight: 700; color: #111; }}
.ph {{ color: #666; font-style: italic; font-weight: 400; }}
.acc {{ color: {ACCENT}; }}
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
.cv-letters {{ margin-top: 10mm; display: flex; flex-wrap: wrap; gap: 2.5mm; }}
.cv-letters span {{ width: 13mm; height: 13mm; border: 0.5mm solid {ACCENT}; border-radius: 2mm; display: flex;
  align-items: center; justify-content: center; font-size: 17pt; font-weight: 700; color: {ACCENT}; }}
.cv-letters span:nth-child(3n+1) {{ background: {ACCENT}; color: #fff; }}
.cv-theme {{ margin-top: 12mm; font-size: 24pt; font-weight: 800; line-height: 1.15; }}
.cv-theme small {{ display: block; font-size: 9pt; font-weight: 600; letter-spacing: 1.5pt; text-transform: uppercase; color: #888; margin-bottom: 1.5mm; }}
.cv-theme span {{ font-size: 14pt; font-weight: 500; color: #444; }}
.cv-goals {{ margin-top: 10mm; background: {TINT}; border-radius: 3mm; padding: 5mm 7mm; }}
.cv-goals h3 {{ margin: 0 0 2mm; font-size: 11pt; }}
.cv-goals ol {{ margin: 0; padding-left: 5mm; font-size: 11pt; line-height: 1.6; }}
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
.prog td.t {{ width: 16mm; color: #555; }} .prog td.k {{ width: 10mm; text-align: center; }}

/* imagier */
.lgrid {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 2.5mm; }}
.lcell {{ border: 0.3mm solid #bbb; border-radius: 2mm; padding: 2mm 2.5mm; display: grid;
  grid-template-columns: 15mm 1fr; grid-template-rows: auto auto 1fr; column-gap: 2mm; min-height: 42mm; }}
.lbig {{ grid-row: 1 / 3; font-size: 20pt; font-weight: 800; color: {ACCENT}; line-height: 1.1; }}
.lword b {{ font-size: 12pt; display: block; }} .lword span {{ display: block; font-size: 8pt; }}
.lsound {{ font-size: 7.6pt; color: #666; grid-column: 1 / 3; margin-top: 1mm; }}
.ldraw {{ grid-column: 1 / 3; border: 0.3mm dashed #ccc; border-radius: 1.5mm; margin-top: 1.5mm; min-height: 14mm; }}
.lcell.tip {{ display: block; background: {TINT}; border: none; font-size: 9pt; }}
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
.nums {{ display: grid; grid-template-columns: repeat(6, 1fr); gap: 1.5mm; margin-bottom: 2mm; }}
.nums div {{ border: 0.3mm solid #ccc; border-radius: 1.5mm; padding: 1.5mm; text-align: center; }}
.nums b {{ display: block; font-size: 14pt; color: {ACCENT}; }} .nums span {{ display: block; font-size: 8.4pt; }}

/* séquences */
.shead {{ font-size: 11pt; margin-bottom: 1mm; }}
.tag {{ font-size: 8pt; color: #777; text-transform: uppercase; letter-spacing: 1pt; margin-bottom: 2.5mm; }}
.card {{ border: 0.3mm solid #bdbdbd; border-left: 1.2mm solid {ACCENT}; border-radius: 2mm; padding: 2.2mm 3.5mm 2mm;
  margin-bottom: 2.4mm; break-inside: avoid; }}
.chead {{ display: flex; align-items: baseline; gap: 2.5mm; margin-bottom: 0.8mm; }}
.code {{ font-weight: 800; color: {ACCENT}; font-size: 10pt; }}
.ctitle {{ font-weight: 800; font-size: 11pt; flex: 1; }}
.cmeta {{ font-size: 8.4pt; color: #555; white-space: nowrap; background: #f1f1f1; border-radius: 1mm; padding: 0.3mm 1.8mm; }}
.lbl {{ font-size: 7.4pt; text-transform: uppercase; letter-spacing: 0.6pt; color: #888; font-weight: 700; margin-right: 1mm; }}
.cline {{ font-size: 8.8pt; color: #444; }}
.duo {{ float: right; font-size: 8pt; color: {ACCENT}; font-weight: 600; }}
.cons {{ font-weight: 600; margin: 0.6mm 0; }}
.steps {{ margin: 0.5mm 0 0; padding-left: 4.5mm; font-size: 9pt; }}
.steps li {{ margin-bottom: 0.3mm; }}
.ws {{ margin-top: 1.5mm; }}
.wsrow {{ display: flex; gap: 3mm; align-items: stretch; }}
.wsrow > * {{ flex: 1; }}
.done {{ font-size: 8.2pt; color: #444; white-space: nowrap; margin-left: 1mm; }}
.ws-trace {{ display: flex; flex-direction: column; gap: 1mm; }}
.trace {{ height: 11mm; border-bottom: 0.3mm solid #999; border-top: 0.2mm dashed #ddd; position: relative; overflow: hidden; }}
.trace span {{ position: absolute; bottom: -1.6mm; left: 1mm; font-size: 25pt; letter-spacing: 3.2mm; color: #c8c8c8; font-weight: 300; }}
.drawbox {{ border: 0.3mm dashed #aaa; border-radius: 1.5mm; position: relative; }}
.drawbox span {{ position: absolute; top: 1mm; left: 2mm; font-size: 7.8pt; color: #888; }}
.readlist {{ display: flex; flex-wrap: wrap; gap: 2mm; align-content: center; }}
.readlist span {{ border: 0.3mm solid #ccc; border-radius: 1.5mm; padding: 0.3mm 2mm; font-size: 11pt; font-weight: 600; }}
.readlist.big span {{ font-size: 15pt; }}
.calc {{ display: grid; grid-template-columns: 1fr 1fr; gap: 1.5mm 6mm; }}
.calc div {{ display: flex; justify-content: space-between; align-items: baseline; border-bottom: 0.2mm solid #e2e2e2; }}
.calc .op {{ font-size: 13pt; font-weight: 600; }} .calc .tro {{ font-size: 8.2pt; color: #666; font-style: italic; }}
.numgrid {{ display: grid; grid-template-columns: repeat(5, 1fr); gap: 1.2mm; }}
.numgrid div {{ border: 0.3mm solid #ccc; border-radius: 1.2mm; text-align: center; padding: 0.6mm; }}
.numgrid b {{ color: {ACCENT}; font-size: 11pt; display: block; }} .numgrid span {{ font-size: 8.4pt; }}
.idcard {{ display: flex; gap: 3mm; border: 0.4mm solid {ACCENT}; border-radius: 2mm; padding: 2mm; }}
.idphoto {{ width: 20mm; height: 22mm; border: 0.3mm dashed #aaa; font-size: 7.5pt; color: #999; display: flex; align-items: center; justify-content: center; text-align: center; }}
.idtxt {{ flex: 1; display: flex; flex-direction: column; justify-content: space-around; }}
.flag {{ width: 48mm; height: 32mm; flex: 0 0 48mm !important; }}
.phrases {{ display: grid; grid-template-columns: 1fr 1fr; gap: 0.4mm 5mm; }}
.phrases div {{ display: flex; align-items: baseline; gap: 1.5mm; }}
.phrases b {{ font-size: 12pt; }} .phrases span {{ font-size: 8pt; color: #777; margin-left: auto; }}
.dictee {{ display: grid; grid-template-columns: repeat(8, 1fr); gap: 2mm; }}
.dictee div {{ height: 10mm; border-bottom: 0.4mm solid #999; border-left: 0.2mm dashed #ddd; }}
.choice {{ display: flex; gap: 6mm; align-items: center; }}
.bilan {{ display: grid; grid-template-columns: 1fr 1fr; gap: 0.8mm 5mm; font-size: 9pt; }}

/* hymne */
.vers {{ border: 0.3mm solid #bbb; border-radius: 2mm; padding: 4mm 5mm; margin-bottom: 4mm; }}
.vnum {{ font-weight: 800; color: {ACCENT}; font-size: 10pt; }} .vnum small {{ color: #888; font-weight: 500; margin-left: 2mm; }}
.vtxt {{ font-size: 16pt; font-weight: 700; margin: 1.5mm 0; line-height: 1.3; }}
.vph {{ font-size: 11pt; font-style: italic; color: #555; margin-bottom: 2.5mm; }}
.vchunks {{ display: flex; flex-wrap: wrap; gap: 1.5mm; }}
.vchunks span {{ border: 0.3mm solid #ddd; border-radius: 1.2mm; padding: 1mm 2mm; text-align: center; }}
.vchunks b {{ display: block; font-size: 10pt; }} .vchunks i {{ font-size: 8pt; color: #666; }}
.sens {{ background: {TINT}; border-radius: 2mm; padding: 3mm 5mm; margin-bottom: 4mm; }}
.sens h3 {{ margin-top: 0; }} .sens p {{ font-size: 11pt; }} .sens p.mini {{ font-size: 8.4pt; }}
.warn {{ border: 0.4mm solid #333; border-radius: 2mm; padding: 3mm 4mm; font-size: 8.8pt; margin-bottom: 3mm; }}
.tip2 {{ font-size: 9pt; color: #444; }}

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
.big-fill {{ font-size: 14pt; font-weight: 700; margin: 2mm 0 3mm; }}
.nw {{ white-space: nowrap; }}
.oneline {{ white-space: nowrap; font-size: 8.3pt; }}
.verif {{ margin-top: 3mm; font-size: 8.8pt; font-weight: 600; border-top: 0.3mm solid #ccc; padding-top: 2mm; }}
.counter {{ display: flex; gap: 1.8mm; margin-bottom: 2mm; }}
.cnt {{ width: 9mm; height: 9mm; border: 0.4mm solid {ACCENT}; border-radius: 50%; position: relative; }}
.cnt small {{ position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 7pt; color: #bbb; }}
.journal th {{ font-size: 8pt; color: #666; text-align: left; border-bottom: 0.4mm solid #999; padding: 1mm; }}
.journal td {{ border-bottom: 0.2mm solid #ccc; height: 7.5mm; }}
.reserve {{ margin-top: 4mm; background: {TINT}; border-radius: 2mm; padding: 3mm 4mm; }}

/* catalogue + papa */
.cat {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; }}
.cat > div {{ border: 0.3mm solid #bbb; border-radius: 2mm; padding: 2.5mm 3.5mm; }}
.cat h3 {{ margin: 0; }} .cat .ex {{ color: #aaa; font-style: italic; margin: 1mm 0 0; }}
.pcols {{ display: grid; grid-template-columns: 1fr 1fr; gap: 7mm; font-size: 9pt; }}
.pcols h3:first-child {{ margin-top: 0; }}
.pcols ul {{ margin: 0; padding-left: 4mm; }} .pcols li {{ margin-bottom: 0.8mm; }}
'''

HTML = f'''<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>Neyla · Mois 1 · Novembre 2026</title>
<style>{CSS}</style></head><body>{"".join(pages)}</body></html>'''

# « week-end » ne doit jamais être coupé au trait d'union en fin de ligne
HTML = re.sub(r"([Ww]eek-end)", r'<span class="nw">\1</span>', HTML)
OUT.write_text(HTML, encoding="utf-8")
print(f"{OUT} · {PAGE_NO[0]} pages")
