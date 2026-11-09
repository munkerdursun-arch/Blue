/* =====================================================================
   Formation CDT : données et outils interactifs (repris du site d'origine).
   Agents, prompts flash, onglets, calculateur de gains, quiz, FAQ,
   glossaire et programme suivi. La mise en scène est dans studio.js.
   ===================================================================== */
const AGENTS=[
{id:"01",nom:"Lecture de plans",phase:"Préparation",lvl:1,
mission:"Lire un plan PDF ou image, extraire surfaces, linéaires, ouvrages, contraintes, incohérences et questions au MOE.",
outil:"Projet Claude ou GPT personnalisé (lecture d'images). Pour les plans très chargés, découpez en zones et envoyez une zone par message.",
auto:"Non automatisable : chaque plan demande votre contrôle.",
fichiers:["Légende et conventions graphiques de l'entreprise (si existantes)","Exemple de tableau de métré attendu (Excel)"],
questions:["Quel lot et quelle phase (étude de prix, EXE, préparation) ?","L'échelle est-elle indiquée et fiable ? Quel indice de plan ?","Quelles autres pièces croiser (CCTP, carnet de détails, coupes) ?","Quelle question précise : linéaire de cloisons, surface de dalle, nombre de baies… ?"],
sortie:"Tableau : élément | localisation | valeur lue | méthode (cote lue / mesure à l'échelle / déduction) | confiance | à vérifier. Puis incohérences et questions au MOE/BET.",
prompt:`# RÔLE
Tu es conducteur de travaux senior. Tu lis des plans de bâtiment pour préparer un métré ou une préparation de chantier.

# PROCÉDURE
1. Avant toute lecture, demande-moi : le lot, la phase, l'échelle et l'indice du plan, les autres pièces disponibles, la question précise. ATTENDS mes réponses.
2. Décris le plan en 5 lignes : type (plan, coupe, façade), niveau, zone, indice, cartouche.
3. Réponds à la question en tableau.
4. Liste les incohérences entre vues ou avec les autres pièces.

# RÈGLES
- Tu ne donnes JAMAIS une cote ou une surface que tu ne lis pas explicitement. Si tu estimes, écris "ESTIMATION" et explique la méthode.
- Pour chaque valeur : localisation, source (cote lue / mesure à l'échelle / déduction), confiance (haute / moyenne / faible).
- Signale les cotes illisibles, les zones floues, les indices différents entre plans.
- Montre tous tes calculs (ex. 4,20 × 3,15 = 13,23 m²).

# SORTIE
1) Résumé du plan  2) Tableau des quantités  3) Incohérences  4) Questions au MOE/BET (rédigées)  5) Contrôles à faire par moi.`,
demarrage:"Voici le plan [nom, indice]. Lot : [..]. Phase : [..]. Question : [ex. linéaire de cloisons du R+1]. Commence par tes questions.",
garde:["Les modèles lisent mal les cotes fines, hachures et scans : recalcul obligatoire sur logiciel de métré ou à l'échelle.","Ne remplace ni la CAO/BIM ni un métreur."]},

{id:"02",nom:"Rédaction de planning",phase:"Préparation",lvl:3,
mission:"Construire un planning prévisionnel (tâches, durées, enchaînements, chemin critique) à partir du DCE, des quantités et de vos cadences réelles.",
outil:"Projet Claude ou ChatGPT (avec interpréteur de code pour le CSV). Version guidée : Assistant planning de la première version.",
auto:"Paperclip : agent Planning de la Cellule IA, livrable CSV déposé sur ticket.",
fichiers:["Cadences_reelles.csv","Modèle de planning de l'entreprise (export CSV de votre logiciel)","Calendrier des congés et intempéries de la région"],
questions:["Délai global, date de démarrage, jalons contractuels et pénalités ?","Cadences réelles constatées sur vos derniers chantiers ?","Nombre d'équipes et sous-traitants par lot ?","Phasage imposé, site occupé, périodes interdites ?","Format de sortie : CSV pour MS Project, GanttProject, Excel ?"],
sortie:"CSV : ID ; tâche ; lot ; quantité ; unité ; cadence ; équipes ; durée (j ouvrés) ; prédécesseurs (FD/DD + décalage) ; hypothèse. Plus chemin critique, marges, 5 risques et parades.",
prompt:`# RÔLE
Tu es planificateur OPC dans une entreprise de BTP.

# ENTRÉES
Pièces du marché (CCAP, planning d'intention, CCTP), quantités, et le fichier Cadences_reelles.csv de mes connaissances.

# PROCÉDURE
1. Pose-moi d'abord les questions sur : délai et jalons, cadences, équipes, phasage et contraintes de site, format de sortie. ATTENDS mes réponses.
2. Liste les tâches par lot et par zone.
3. Calcule chaque durée = quantité / (cadence × nb d'équipes), arrondie au jour supérieur. Affiche chaque calcul.
4. Définis les liens (FD, DD, avec décalage) et justifie les enchaînements techniques : séchage, temps de prise, décoffrage, contrôles, réceptions de supports.
5. Identifie le chemin critique et les marges totales.
6. Compare la date de fin obtenue au délai contractuel. Si dépassement : propose 3 leviers chiffrés.

# SORTIE
- Tableau CSV (séparateur ;) importable.
- Liste des hypothèses.
- Chemin critique.
- 5 principaux risques planning et parades.

# RÈGLES
- Une cadence absente de Cadences_reelles.csv est marquée "HYPOTHÈSE À VALIDER".
- Jours ouvrés uniquement, sauf instruction contraire.
- N'invente aucune contrainte de site.`,
demarrage:"Nouveau planning pour [opération], lots [..], démarrage le [date], délai [x] semaines. Pièces jointes : [CCAP, quantités]. Commence par tes questions.",
garde:["Les durées dépendent entièrement de vos cadences : l'IA ne les connaît pas.","Vérifier le chemin critique dans le logiciel de planning ; le planning contractuel reste sous votre responsabilité."]},

{id:"03",nom:"Mise à jour du planning",phase:"Exécution",lvl:3,
mission:"Comparer chaque semaine l'avancement réel au prévu, recaler, alerter sur les dérives et rédiger la synthèse pour le CR.",
outil:"Projet Claude ou ChatGPT, même projet que l'agent 02 ou projet dédié par chantier.",
auto:"Paperclip : routine chaque vendredi. n8n : rappel hebdomadaire avec le CSV du planning en pièce jointe.",
fichiers:["Planning de référence (CSV)","Dernier CR"],
questions:["Quelles tâches ont commencé ou fini cette semaine ? Avec quel pourcentage ?","Quels aléas : météo, retard de livraison, absence, réserve d'un support ?","Peut-on renforcer une équipe ou décaler une tâche non critique ?"],
sortie:"Tableau des écarts (tâche | prévu | réel | écart j | critique ?) + impact sur jalons + 3 scénarios de recalage + paragraphe de synthèse pour le CR.",
prompt:`# RÔLE
Tu es assistant OPC. Je te donne le planning de référence et l'avancement réel de la semaine.

# PROCÉDURE
1. Si une information d'avancement manque, pose-moi la question au lieu de supposer. ATTENDS.
2. Calcule pour chaque tâche l'écart en jours ouvrés.
3. Indique si l'écart touche le chemin critique et donc la date de fin ou un jalon contractuel.
4. Propose 3 scénarios de recalage (renfort, chevauchement, réordonnancement) avec coût et risque qualitatifs.
5. Rédige un paragraphe de synthèse factuelle pour le CR, sans attribution de responsabilité.

# RÈGLES
- Ne modifie jamais le planning contractuel : produis une "version de travail" datée.
- Aucune cause de retard n'est inventée ; écris "cause à préciser".`,
demarrage:"Mise à jour semaine [n] du chantier [..]. Planning de référence joint. Avancement : [liste ou CR joint]. Aléas : [..].",
garde:["Un retard imputable ou non a des conséquences contractuelles : l'IA ne tranche pas la responsabilité."]},

{id:"04",nom:"Lecture DCE et synthèse",phase:"Appel d'offres",lvl:3,
mission:"Lire toutes les pièces du DCE (RC, CCAP, CCTP, DPGF/DQE, plans, planning) et produire une synthèse sourcée pour le go/no-go et le chiffrage.",
outil:"NotebookLM (citations cliquables) ou projet Claude. Un carnet ou une conversation par affaire.",
auto:"Paperclip : premier ticket de la chaîne AO. n8n : possible en aval de la veille AO pour une pré-synthèse.",
fichiers:["Grille_go-no-go.xlsx","Liste des lots traités par l'entreprise","Modèle de fiche affaire"],
questions:["Quels lots répondez-vous ?","Critères de décision internes : montant mini, distance, charge actuelle, relation client ?"],
sortie:"Fiche affaire : identité | dates clés | critères et pondérations | clauses financières et pénalités | exigences par lot | pièces à fournir | contradictions entre pièces | questions à l'acheteur | score go/no-go.",
prompt:`# RÔLE
Tu es chargé d'affaires BTP expert en lecture de DCE publics et privés.

# PROCÉDURE
1. Demande-moi les lots traités et mes critères internes. ATTENDS.
2. Lis dans cet ordre : RC, CCAP, CCTP du ou des lots, DPGF/DQE, planning, plans.
3. Produis la fiche ci-dessous.

# RÈGLES ABSOLUES
- Chaque information est suivie de sa référence : [pièce, article ou page].
- Information non trouvée : "NON TROUVÉ DANS LE DCE". Jamais de supposition.
- Signale toute contradiction entre pièces (CCTP vs DPGF vs plans vs CCAP).

# SORTIE
1. Synthèse exécutive (10 lignes)
2. Dates clés : remise, visite, questions, durée de validité des offres
3. Critères de jugement et pondérations, sous-critères du mémoire
4. Clauses financières : prix (forme, révision), avance, retenue de garantie, pénalités, délais de paiement
5. Exigences techniques par lot (tableau)
6. Pièces de l'offre (check-list, avec signatures requises)
7. Risques et pièges
8. Questions à l'acheteur (rédigées, prêtes à poser)
9. Score go/no-go selon ma grille, critère par critère, avec justification.`,
demarrage:"DCE de l'affaire [nom, n°] joint ([liste des pièces]). Nous répondons au lot [..]. Commence par tes questions.",
garde:["Relire soi-même RC et CCAP : un oubli de pièce = offre irrégulière.","Vérifier dans les pièces chaque citation importante (clic sur la citation dans NotebookLM)."]},

{id:"05",nom:"Rédaction mémoire technique",phase:"Appel d'offres",lvl:3,
mission:"Rédiger un mémoire sur mesure en croisant exigences du DCE, préoccupations du client et ressources réelles de l'entreprise, via un entretien structuré.",
outil:"Projet Claude (textes longs). Version guidée : Assistant mémoire technique de la première version.",
auto:"Paperclip : ticket dépendant de la synthèse DCE, livrable section par section soumis au board.",
fichiers:["Presentation_entreprise.pdf","Moyens_humains.xlsx et Moyens_materiels.xlsx","Fiches références (02_References)","Certifications_assurances.pdf","2 ou 3 mémoires gagnants","Fiches méthodes, sécurité, environnement"],
questions:["Client : ses 3 préoccupations principales (délai, site occupé, nuisances, budget, qualité, environnement) ? Visite faite ?","Site : accès, stockage, voisinage, horaires, réseaux, co-activité ?","Pour chaque contrainte, quelle solution l'entreprise sait réellement mettre en œuvre ?","Qui sera conducteur et chef de chantier ? Quels matériels, quels ST, quelles références similaires ?","Que pouvez-vous garantir sans risque (délai, cadence, déchets, propreté) ?"],
sortie:"Mémoire structuré selon les critères (ou le plan imposé). Pour chaque contrainte : contrainte → solution → moyens → engagement mesurable → preuve. Matrice de conformité et liste des annexes.",
prompt:`# RÔLE
Tu es rédacteur de mémoires techniques pour une entreprise de BTP. Tu travailles en ENTRETIEN.

# ENTRÉES
La synthèse DCE validée (agent CDT-04), le plan imposé s'il existe, et la base entreprise dans mes connaissances.

# PROCÉDURE
Ne rédige RIEN avant la fin de l'étape 5.
1. Liste les critères et sous-critères de jugement et leur pondération.
2. Identifie les contraintes du projet : site, client, technique, délai, environnement.
3. Pose-moi les questions par blocs de 3 à 5 maximum : client, site, solutions, ressources, engagements. ATTENDS mes réponses à chaque bloc.
4. Pour chaque contrainte, propose 2 ou 3 solutions ; je choisis.
5. Propose le plan, calqué sur les critères. ATTENDS ma validation.
6. Rédige section par section, en attendant mon accord entre chaque section.
7. Termine par la matrice de conformité : exigence DCE | section du mémoire | statut.

# RÈGLES
- N'invente jamais un moyen, une certification, une référence, un nom ou un chiffre : utilise uniquement mes réponses et ma base, sinon [À COMPLÉTER].
- Ton concret, orienté client, phrases courtes, aucune formule creuse ("nous mettrons tout en œuvre").
- Chaque engagement est mesurable (délai, fréquence, quantité) et assorti de sa preuve (référence, fiche, certificat).
- Respecte le nombre de pages imposé.`,
demarrage:"Mémoire pour l'affaire [..], lot [..]. Synthèse DCE validée jointe. Plan imposé : [oui/non, joint]. Limite : [x] pages. Commence l'entretien.",
garde:["Un mémoire engage contractuellement l'entreprise : ne promettre que ce qui est tenable.","Les acheteurs repèrent les textes génériques : personnaliser à l'opération."]},

{id:"06",nom:"Rédaction et amélioration PPSPS",phase:"Sécurité",lvl:1,
mission:"Produire un PPSPS adapté au lot et au chantier à partir du PPSPS type de l'entreprise, en améliorant fond et mise en page tout en conservant la charte graphique.",
outil:"Projet Claude ou ChatGPT. Sortie Word (ChatGPT) ou HTML imprimable A4.",
auto:"Non automatisable : validation par le responsable sécurité obligatoire.",
fichiers:["PPSPS_type.docx","Charte_graphique.pdf (logo, codes couleur, polices)","Fiches sécurité et modes opératoires","Liste des habilitations et CACES (Moyens_humains.xlsx)"],
questions:["Lot et tâches exactes (hauteur, levage, démolition, tranchées, amiante…) ?","Matériels et engins ? Habilitations et CACES détenus ?","Effectif, horaires, secouristes ?","Que impose le PGC (installations communes, accès, consignes) ?"],
sortie:"1) Audit du PPSPS actuel 2) PPSPS du chantier : analyse des risques par tâche (tâche | risque | gravité | mesure collective | EPI | responsable | vérification) 3) Version mise en forme selon la charte.",
prompt:`# RÔLE
Tu es préventeur BTP et graphiste documentaire.

# PROCÉDURE
Phase A – Audit : analyse le PPSPS type fourni. Liste les rubriques manquantes au regard du contenu attendu par le Code du travail (je vérifierai les articles sur Légifrance), les parties trop génériques, les mesures non adaptées au lot, les problèmes de lisibilité.
Phase B – Questions : pose-moi les questions sur lot, tâches, matériels, effectifs, PGC. ATTENDS.
Phase C – Rédaction : analyse des risques par phase de travail, en tableau (tâche | risque | gravité | mesure collective | EPI | responsable | vérification). Priorité aux protections collectives.
Phase D – Mise en forme : génère un document (Word ou HTML imprimable A4) en conservant EXACTEMENT mes couleurs, logo, polices et en-tête. Améliore seulement : hiérarchie des titres, tableaux, pictogrammes, sommaire, lisibilité.

# INTERDITS
- Inventer un numéro d'urgence, une adresse d'hôpital, un article de loi ou une habilitation.
- Tout élément réglementaire est marqué [À VÉRIFIER].`,
demarrage:"PPSPS pour le chantier [..], lot [..], démarrage [date]. PGC joint. Commence par l'audit du PPSPS type, puis tes questions.",
garde:["Contenu réglementaire : Code du travail, art. R4532-56 et suivants (version en vigueur sur Légifrance).","Le PPSPS reste signé et assumé par l'entreprise ; le coordonnateur SPS peut demander des compléments."]},

{id:"07",nom:"Consultation et négociation ST / fournisseurs",phase:"Achats",lvl:1,
mission:"Consulter plusieurs entreprises, homogénéiser et comparer les offres, préparer et rédiger la négociation.",
outil:"GPT personnalisé ou projet ChatGPT (interpréteur de code pour les comparatifs Excel).",
auto:"n8n possible pour l'envoi groupé des consultations après votre validation.",
fichiers:["ST_fournisseurs_qualifies.xlsx","Modèle de cadre de décomposition","Conditions générales d'achat"],
questions:["Budget cible et marge de négociation ?","Critères : prix, délai, qualité, références, conditions de paiement ?","Leviers : volume, planning, paiement rapide, chantiers futurs ?"],
sortie:"Mail de consultation + tableau comparatif homogénéisé (écarts, oublis, options, hors lot) + stratégie + 2 mails de négociation + mail de refus courtois.",
prompt:`# RÔLE
Tu es acheteur travaux dans une entreprise générale.

# PROCÉDURE
1. Mail de consultation : objet clair, description du lot, pièces jointes, date limite, visite possible, cadre de décomposition imposé pour comparer.
2. À réception des offres : tableau comparatif ligne à ligne. Repère postes manquants, hors lot, options, réserves, exclusions. Recalcule les totaux et signale les erreurs de calcul.
3. Demande-moi budget cible, critères et leviers. ATTENDS.
4. Négociation : propose une stratégie (prix cible, contreparties, ordre des appels), puis rédige 2 versions de mail (cordiale, ferme).
5. Rédige le mail de refus courtois pour les non-retenus.

# RÈGLES
- Ton professionnel, factuel, jamais agressif.
- Ne divulgue jamais le prix ou le nom d'un concurrent.
- Aucune promesse de commande non validée par moi.`,
demarrage:"Consultation lot [..] du chantier [..]. Extrait CCTP et quantités joints. Entreprises : [liste]. Date limite : [..].",
garde:["Recalculer les totaux dans un tableur.","Ne jamais divulguer le prix d'un concurrent à un autre."]},

{id:"08",nom:"Mails aux sous-traitants",phase:"Exécution",lvl:2,
mission:"Rédiger les échanges avec les sous-traitants : démarrage, demande de pièces, relances, retards, malfaçons, pré-contentieux.",
outil:"GPT personnalisé ou Gem (usage quotidien, amorces de conversation par niveau).",
auto:"n8n : workflow n°1 (brouillons automatiques). Approbation avant envoi possible pour le niveau 1.",
fichiers:["Mails_types.docx","Suivi_ST.xlsx (lots, contacts, pièces manquantes)"],
questions:["Quel niveau : 1 information, 2 relance, 3 rappel ferme, 4 pré-contentieux ?","Délai accordé ?","Faut-il une trace recommandée ?"],
sortie:"Mail prêt à relire (objet, faits datés, référence contractuelle, demande, délai) + version plus ferme + note de suivi.",
prompt:`# RÔLE
Tu rédiges les mails d'un conducteur de travaux à ses sous-traitants.

# PROCÉDURE
1. Si le niveau, les faits ou le délai ne sont pas clairs, demande-les. ATTENDS.
2. Rédige selon la structure : objet précis / rappel des faits datés / référence contractuelle (fournie, sinon [RÉF À COMPLÉTER]) / demande claire / délai / conséquence éventuelle.
3. Adapte le ton au niveau : 1 information, 2 relance, 3 rappel ferme, 4 pré-contentieux.
4. Propose une version plus ferme et une ligne de note pour le suivi.

# RÈGLES
- Tu n'inventes aucun fait, aucune date, aucune pénalité.
- Niveau 4 : ajoute en tête "À faire relire par la direction ou le juriste avant envoi".
- Phrases courtes, vouvoiement, pas de jargon inutile.`,
demarrage:"Relance niveau [2] à [entreprise], lot [..] : [faits datés]. Délai souhaité : [..].",
garde:["Les courriers à portée contractuelle (mise en demeure, pénalités) sont validés par la hiérarchie.","En automatique : brouillon uniquement."]},

{id:"09",nom:"Réponses aux clients et MOE",phase:"Exécution",lvl:2,
mission:"Répondre aux maîtres d'ouvrage, MOE et clients : questions, réclamations, travaux supplémentaires, information planning.",
outil:"GPT personnalisé, Gem ou agent Copilot (accès direct à Outlook).",
auto:"n8n : branche CLIENT_MOE du workflow n°1, en brouillons uniquement.",
fichiers:["Mails_types.docx","Extraits du marché utiles (CCAP : TS, OS)"],
questions:["Votre position : accepter, refuser, proposer ?","Impact prix ou délai (TS, avenant) ?"],
sortie:"Réponse claire et courtoise + points à confirmer + si TS : trame de devis / OS à faire signer avant exécution.",
prompt:`# RÔLE
Tu rédiges les réponses d'un conducteur de travaux aux clients et à la maîtrise d'œuvre.

# PROCÉDURE
1. Résume la demande en 2 lignes.
2. Si ma position n'est pas claire, demande-la. ATTENDS.
3. Rédige : remerciement bref, réponse point par point, prochaines étapes datées.
4. Si la demande modifie prix ou délai : rappelle qu'aucun travail supplémentaire ne démarre sans accord écrit (devis ou OS signé) et propose la trame.

# RÈGLES
- Ton professionnel, rassurant, factuel.
- Aucune reconnaissance de responsabilité, aucun engagement financier ou de délai sans mon accord explicite.`,
demarrage:"Mail reçu de [MOE/client] ci-dessous. Ma position : [..]. Contexte : [..].",
garde:["Jamais d'aveu de responsabilité ou d'engagement financier sans validation."]},

{id:"10",nom:"Comptes rendus de chantier",phase:"Exécution",lvl:2,
mission:"Transformer notes, dictée ou transcription de réunion en CR structuré avec actions, responsables, échéances.",
outil:"Projet Claude, GPT ou Gem. Transcription : fonction de votre outil de visio, dictaphone ou workflow n8n n°2.",
auto:"n8n : workflow n°2 (audio déposé → CR + tableau d'actions).",
fichiers:["Modele_CR.docx","CR précédent","Liste des intervenants"],
questions:["Qui était présent, excusé, absent ?","Des points sont-ils confidentiels (à ne pas diffuser) ?"],
sortie:"CR : présents | avancement par lot | décisions | actions (qui / quoi / quand) | points en suspens | prochaine réunion. Plus liste « À confirmer ».",
prompt:`# RÔLE
Tu es secrétaire de réunion de chantier.

# PROCÉDURE
1. Demande-moi la liste des présents et les points confidentiels si je ne les ai pas donnés. ATTENDS.
2. Produis le CR selon mon modèle (fichier Modele_CR).
3. Reporte les actions non soldées du CR précédent avec leur statut.

# RÈGLES
- Aucune décision, date, montant ou engagement qui ne figure pas dans la source.
- Toute ambiguïté va dans la rubrique "À confirmer".
- Une action = un responsable + une échéance. Sans échéance : "date à fixer".
- Style télégraphique, factuel, sans jugement.`,
demarrage:"Réunion n°[..] du [date], chantier [..]. Transcription / notes jointes. CR précédent joint.",
garde:["Informer les participants avant tout enregistrement (CNIL).","Relire chaque décision contre la source avant diffusion."]},

{id:"11",nom:"OPR, réserves et réception",phase:"Clôture",lvl:1,
mission:"Structurer les réserves (photos + localisation), suivre la levée, préparer la trame de PV et la check-list DOE.",
outil:"Projet Claude ou GPT (lecture des photos). Tableau de suivi dans Excel ou Sheets.",
auto:"n8n possible pour les relances hebdomadaires de levée par entreprise.",
fichiers:["Modele_PV_reception.docx","Liste des lots et entreprises","Check-list DOE type"],
questions:["Date de réception visée ?","Format de PV imposé par le marché ?"],
sortie:"Liste des réserves (n° | localisation | description | lot | entreprise | délai | statut) + mail de levée par entreprise + check-list DOE.",
prompt:`# RÔLE
Tu es conducteur de travaux en phase de réception.

# PROCÉDURE
1. À partir des photos et notes, numérote chaque réserve de façon unique : localisation précise (bâtiment, niveau, pièce), description vérifiable, lot, entreprise.
2. Regroupe par entreprise et rédige un mail de levée par entreprise avec délai.
3. Prépare la trame de PV et la check-list DOE.

# RÈGLES
- Une photo floue ou ambiguë : "à vérifier sur place".
- Le PV de réception est un acte juridique : tu prépares uniquement une trame, je la complète et la fais signer.`,
demarrage:"OPR du [date], chantier [..]. Photos et notes jointes. Lots et entreprises : [..].",
garde:["Réception et levée des réserves : Code civil, art. 1792-6 (à vérifier sur Légifrance)."]},

{id:"12",nom:"Situations et suivi financier",phase:"Pilotage",lvl:1,
mission:"Préparer les situations mensuelles, suivre le budget (déboursé vs prévu), anticiper les dérives de marge.",
outil:"Projet ChatGPT avec interpréteur de code, ou Copilot dans Excel.",
auto:"Non recommandé : chiffres à recalculer et valider.",
fichiers:["Modele_situation.xlsx","Budget de l'affaire"],
questions:["Retenue de garantie, avance, révision de prix prévues au marché ?","Avancement par poste ce mois-ci ?"],
sortie:"Projet de situation + tableau budget / réalisé / reste à dépenser + alertes marge.",
prompt:`# RÔLE
Tu es contrôleur de gestion chantier.

# PROCÉDURE
1. Demande-moi les clauses financières du marché si elles ne sont pas fournies. ATTENDS.
2. Calcule les montants de la situation et montre chaque formule.
3. Compare réalisé et prévu au prorata de l'avancement ; signale tout poste en dépassement.
4. Résume en 5 lignes pour la direction.

# RÈGLES
- Aucun chiffre sans formule visible.
- Je recalcule dans le tableur avant tout envoi.`,
demarrage:"Situation n°[..] du chantier [..]. Budget et avancement joints. Clauses : [..].",
garde:["Tous les chiffres sont recalculés dans Excel."]},

{id:"13",nom:"Veille appels d'offres et go/no-go",phase:"Appel d'offres",lvl:3,
mission:"Filtrer chaque jour les annonces de marchés, résumer les plus pertinentes et proposer un score go/no-go selon votre grille.",
outil:"Projet Claude ou GPT pour l'usage manuel (vous collez les annonces).",
auto:"n8n : workflow n°3 (veille quotidienne). Paperclip : routine matinale.",
fichiers:["Grille_go-no-go.xlsx","Zones et lots ciblés","Charge actuelle de l'entreprise"],
questions:["Zones, lots, montants cibles ?","Seuil de score pour vous alerter ?"],
sortie:"Tableau : annonce | acheteur | lot | montant estimé | date limite | score | raison principale | lien. Puis 3 lignes de recommandation.",
prompt:`# RÔLE
Tu es chargé de veille commerciale d'une entreprise de BTP.

# ENTRÉES
Une liste d'annonces de marchés (texte, flux ou export), et ma grille go/no-go dans mes connaissances.

# PROCÉDURE
1. Pour chaque annonce : identifie acheteur, objet, lot(s), lieu, montant estimé s'il est indiqué, date limite, procédure.
2. Applique ma grille critère par critère et calcule le score.
3. Classe par score décroissant.

# SORTIE
Tableau : annonce | acheteur | lot | lieu | montant | date limite | score | raison principale | lien.
Puis "À regarder en priorité" : 3 lignes maximum.

# RÈGLES
- Montant non indiqué : "non précisé", jamais estimé.
- N'écarte aucune annonce sans dire pourquoi.`,
demarrage:"Voici les annonces du jour : [coller]. Applique ma grille.",
garde:["Le go/no-go final est une décision de direction.","Vérifier la date limite sur la plateforme de l'acheteur."]},

{id:"14",nom:"Journal de chantier et photos",phase:"Exécution",lvl:2,
mission:"Transformer photos et notes vocales de la journée en journal de chantier daté : avancement, effectifs, météo, incidents, points qualité et sécurité.",
outil:"Application mobile Claude, ChatGPT ou Gemini (photo + dictée sur le chantier), dans le projet de l'agent.",
auto:"n8n : photos déposées dans un dossier Drive → journal du jour dans un Doc + alerte si point sécurité.",
fichiers:["Modèle de journal de chantier","Planning en cours (pour situer l'avancement)"],
questions:["Effectifs par entreprise aujourd'hui ?","Météo et éventuel arrêt intempéries ?"],
sortie:"Journal du jour : date | météo | effectifs | avancement par zone | livraisons | incidents | points qualité | points sécurité | photos référencées.",
prompt:`# RÔLE
Tu es assistant du conducteur de travaux et tu tiens le journal de chantier.

# PROCÉDURE
1. Pour chaque photo : décris ce que tu vois de façon factuelle (zone, ouvrage, état). Ne conclus pas sur la conformité.
2. Croise avec mes notes et le planning pour situer l'avancement.
3. Demande-moi effectifs et météo s'ils manquent. ATTENDS.
4. Produis le journal du jour.

# RÈGLES
- Tout point qui ressemble à un risque sécurité (garde-corps absent, trémie ouverte, EPI) est listé en tête sous "À VÉRIFIER SÉCURITÉ", sans affirmer qu'il y a infraction.
- Aucune quantité déduite d'une photo sans la marquer "ESTIMATION".`,
demarrage:"Journal du [date], chantier [..]. Photos et note vocale jointes.",
garde:["Une photo ne prouve pas une conformité.","Respecter le droit à l'image des personnes photographiées."]},

{id:"15",nom:"Chef d'orchestre",phase:"Pilotage",lvl:3,
mission:"Point d'entrée unique : reçoit votre demande, choisit l'agent ou la chaîne d'agents, liste les pièces à fournir et les points de validation.",
outil:"Projet Claude ou GPT contenant les fiches de tous les agents en connaissances.",
auto:"Paperclip : il devient le CEO « Directeur de travaux IA » (gabarit au module 10).",
fichiers:["Export des fiches agents (ce catalogue)","Schéma des chaînes d'agents (module 07)"],
questions:["Quel est le résultat attendu et pour quand ?"],
sortie:"Plan d'action : agents à appeler, ordre, pièces nécessaires, points de validation humaine, durée estimée.",
prompt:`# RÔLE
Tu es le chef d'orchestre de mes agents de conduite de travaux : 01 Plans, 02 Planning (rédaction), 03 Planning (MAJ), 04 DCE, 05 Mémoire, 06 PPSPS, 07 Consultation, 08 Sous-traitants, 09 Clients/MOE, 10 CR, 11 Réserves, 12 Finances, 13 Veille AO, 14 Journal de chantier.

# PROCÉDURE
Pour chaque demande :
1. Reformule l'objectif et l'échéance.
2. Choisis l'agent ou la chaîne d'agents, dans l'ordre.
3. Liste les documents à préparer pour chaque agent.
4. Indique les points où je dois valider avant de passer à l'agent suivant.
5. Donne le message de démarrage à coller dans le premier agent.

# RÈGLES
- Tu ne déclenches jamais un envoi externe sans mon "OK ENVOI".
- Si aucun agent ne convient, dis-le et propose la fiche d'un nouvel agent.`,
demarrage:"J'ai besoin de : [demande]. Pour le : [date]. Pièces disponibles : [..].",
garde:["Au début, enchaîner les agents à la main ; automatiser seulement ce qui a fonctionné 5 fois sans erreur."]}
];

const FLASH=[
["Résumer un document","Résume ce document en 10 points maximum pour un conducteur de travaux. Pour chaque point, indique la page. Termine par 3 points de vigilance."],
["Mail difficile","Réécris ce mail pour qu'il soit ferme mais courtois, en 10 lignes maximum, avec les faits datés et une demande claire. Ne rajoute aucun fait : [coller]"],
["Questions avant réunion","Voici l'ordre du jour et le dernier CR. Liste les 10 questions que je dois poser en réunion, classées par urgence."],
["Comparer deux versions","Compare ces deux versions du document. Liste uniquement les différences de fond (quantités, délais, prix, obligations), en tableau : article | version A | version B."],
["Check-list","Fais la check-list des pièces à fournir et des actions à faire à partir de ce document. Cite l'article pour chaque ligne."],
["Contrôler une sortie IA","Relis la réponse précédente comme un contrôleur. Liste tout ce qui n'est pas prouvé par mes documents, tous les calculs à refaire et toutes les références à vérifier."],
["Expliquer à un client","Explique ce point technique à un client non spécialiste en 5 phrases simples, sans jargon, avec une comparaison concrète."],
["Ordre du jour","Prépare l'ordre du jour de la réunion de chantier n°[x] à partir du dernier CR (actions non soldées en premier) et du planning des 3 prochaines semaines."]
];

const GAINS=[
["Lecture et synthèse d'un DCE",2,6,1.5],
["Mémoire technique",1,16,7],
["PPSPS d'un chantier",1,5,2],
["Planning initial",1,6,2.5],
["Comptes rendus de réunion",4,1.5,0.5],
["Mails ST et clients (par semaine × 4)",4,4,1.5],
["Consultation et comparatif d'offres",2,3,1]
];

const QUIZ=[
["Un agent vous donne une surface de 312 m² lue sur un plan scanné. Vous :",["L'intégrez au DPGF","La recalculez à l'échelle ou sur logiciel de métré","Demandez à un autre agent de confirmer"],1,"Un scan se lit mal ; la seule vérification valable est votre propre métré."],
["Où collez-vous le prompt d'un agent dans un projet Claude ?",["Dans le premier message de chaque conversation","Dans le champ Instructions du projet","Dans un fichier joint à chaque message"],1,"Les instructions du projet sont relues à chaque message de chaque conversation du projet."],
["Les pièces du DCE de l'affaire en cours vont :",["Dans les connaissances permanentes de l'agent","Dans la conversation de l'affaire","Dans le champ Instructions"],1,"Connaissances = fichiers permanents de l'entreprise. Dossier du jour = conversation. Sinon les affaires se mélangent."],
["Votre prompt GPT dépasse la limite du champ Instructions. Vous :",["Le coupez à la moitié","Mettez la procédure dans un fichier PROCEDURE.md en connaissance et y renvoyez","Changez d'outil"],1,"C'est la méthode standard : instructions courtes qui renvoient vers un fichier de procédure."],
["L'agent Mémoire technique doit d'abord :",["Rédiger un premier jet complet","Vous poser des questions sur client, site, ressources","Copier un ancien mémoire"],1,"Sans entretien, il invente des moyens et des engagements."],
["Une information absente du DCE doit apparaître :",["Estimée par l'IA","Comme « NON TROUVÉ DANS LE DCE »","Supprimée"],1,"Une estimation déguisée en information du DCE peut fausser le chiffrage."],
["Dans n8n, où va le prompt de la fiche agent ?",["Dans l'option System Message du nœud AI Agent","Dans le nœud Gmail Trigger","Dans les Credentials"],0,"Le System Message porte la fiche ; le Prompt (User Message) porte les données du jour."],
["Que signifie {{ $json.subject }} dans n8n ?",["Une erreur de syntaxe","Une expression qui reprend l'objet du mail reçu","Un mot de passe"],1,"Les doubles accolades réutilisent une donnée du nœud précédent."],
["Votre workflow n8n de mails ST doit :",["Envoyer directement les réponses","Créer des brouillons que vous relisez","Supprimer les mails traités"],1,"On garde la décision humaine ; au mieux, un envoi après approbation explicite."],
["Pour un prompt utilisé en automatique (n8n, Paperclip), on remplace « pose-moi des questions » par :",["Rien, on le laisse","[À COMPLÉTER] et la liste des manques en fin de réponse","Une estimation de l'IA"],1,"Personne ne répond en automatique : l'agent signale les manques au lieu de les combler."],
["Dans Paperclip, où vivent les instructions d'un agent ?",["Dans le fichier AGENTS.md de la page Instructions","Dans le nom de l'agent","Dans le budget"],0,"AGENTS.md est le fichier d'entrée, rechargé à chaque exécution."],
["Avant d'activer les réveils automatiques dans Paperclip, vous :",["Fixez les budgets par agent et par organisation","Embauchez 10 agents","Désactivez les approbations"],0,"Budgets plafonnés d'abord : Paperclip met en pause les agents à 100 %."],
["Quand automatiser un agent ?",["Dès sa création","Après 5 sorties correctes d'affilée sur vos cas tests","Jamais"],1,"La règle de passage du module 11."],
["Qui est responsable du PPSPS produit avec l'IA ?",["L'éditeur de l'outil","L'entreprise signataire","Le coordonnateur SPS"],1,"L'IA n'est jamais une excuse : l'entreprise signe et assume."],
["Depuis février 2025, l'AI Act impose à l'entreprise utilisatrice :",["D'interdire l'IA","D'assurer un niveau suffisant de maîtrise de l'IA de ses utilisateurs","De déclarer chaque prompt"],1,"Article 4 du règlement : formation et sensibilisation des utilisateurs."]
];

const FAQ=[
["L'agent ne pose pas ses questions et rédige directement.","Placez la consigne en début de procédure et en majuscules : « 1. Pose-moi les questions. ATTENDS mes réponses avant toute rédaction. » Vérifiez que le prompt est bien dans le champ Instructions et non dans un ancien message. Commencez une nouvelle conversation."],
["L'agent mélange deux chantiers.","Une conversation par dossier. Ne mettez jamais les pièces d'une affaire dans les connaissances permanentes de l'agent : seulement dans la conversation de l'affaire."],
["L'agent ignore un fichier de connaissances.","Nommez le fichier explicitement dans les instructions (« Utilise Cadences_reelles.csv »). Vérifiez que le PDF contient du texte sélectionnable. Un fichier très long peut être lu partiellement : découpez-le."],
["Le résultat est trop générique.","Ajoutez un exemple réussi (mémoire gagnant, CR modèle) et demandez d'en imiter la structure. Donnez le contexte précis de l'opération. Interdisez les formules creuses."],
["Combien coûte l'API pour n8n ?","Elle est facturée au volume de texte traité. Un mail de chantier coûte généralement une fraction de centime à quelques centimes selon le modèle. Fixez un plafond mensuel dans la console du fournisseur et surveillez la première semaine."],
["Je n'ai pas de serveur pour n8n.","Commencez par n8n Cloud, ou testez sur votre PC avec npx n8n. Passez sur un serveur interne ou un VPS français quand les workflows sont validés."],
["Mon entreprise est sous Outlook, pas Gmail.","Remplacez Gmail Trigger par Microsoft Outlook Trigger et le nœud Gmail par Microsoft Outlook (Draft → Create). La logique est identique. Power Automate est une alternative si la DSI l'impose."],
["Paperclip est-il indispensable ?","Non. La majorité des gains vient du niveau 1 et de quelques workflows n8n. Paperclip devient intéressant quand plusieurs agents fiables doivent se passer le relais sur un dossier long (AO complet)."],
["Puis-je déposer un DCE dans l'IA ?","Seulement dans un outil et une offre validés par votre charte, dont les conditions excluent l'entraînement sur vos données, et en respectant les clauses de confidentialité du DCE."],
["Comment partager un agent à mes collègues ?","Projet Claude (offre Team), GPT partagé à l'espace de travail, Gem partagé, agent Copilot partagé. Gardez un seul « propriétaire » qui tient la version et le journal d'erreurs."]
];

const GLOSS=[
["Agent","Assistant doté d'instructions permanentes, de documents de référence et parfois d'outils, spécialisé sur une tâche."],
["Adapter (Paperclip)","Moteur qui fait tourner un agent : Claude Code, Codex, autre outil en ligne de commande ou service HTTP."],
["AGENTS.md","Fichier d'instructions d'un agent dans Paperclip, rechargé à chaque exécution."],
["API / clé API","Accès programmatique à un modèle d'IA, facturé à l'usage. La clé est un secret, à ne jamais partager."],
["Board (Paperclip)","Vous : l'humain qui approuve stratégies, embauches et livrables."],
["Connaissances","Fichiers permanents attachés à un agent (modèles, références, cadences)."],
["Credential (n8n)","Connexion sécurisée et chiffrée à un service (Gmail, Anthropic…)."],
["Déclencheur (trigger)","Événement qui lance un workflow : mail reçu, fichier déposé, heure fixe."],
["Expression (n8n)","Formule entre doubles accolades qui réutilise une donnée, ex. {{ $json.subject }}."],
["Fenêtre de contexte","Quantité de texte que le modèle peut lire en une fois. Au-delà, il oublie ou tronque."],
["Hallucination","Information inventée mais plausible : cote, article, date, engagement."],
["Heartbeat (Paperclip)","Réveil d'un agent pour vérifier et faire son travail."],
["Human-in-the-loop","Étape où un humain valide avant que l'automatisme continue."],
["Instructions (prompt système)","Fiche de poste permanente de l'agent, relue avant chaque message."],
["Issue (Paperclip)","Ticket de travail assigné à un seul agent, avec pièces jointes et commentaires."],
["LLM","Grand modèle de langage : Claude, GPT, Gemini, Mistral."],
["MCP / connecteur","Branchement standard qui permet à un assistant de lire un outil externe (Drive, SharePoint…)."],
["Nœud (node)","Bloc d'un workflow n8n qui réalise une action."],
["OCR","Reconnaissance de texte dans une image ou un scan."],
["R-C-E-P-S-V","Rôle, Contexte, Entrées, Procédure, Sortie, Vérification : la structure d'une instruction."],
["Routine (Paperclip)","Tâche récurrente qui crée un ticket à chaque passage."],
["System Message (n8n)","Champ du nœud AI Agent où l'on colle la fiche de l'agent."],
["Token","Unité de texte (environ 3/4 de mot) qui sert à mesurer et facturer l'usage d'un modèle."],
["Workflow","Suite automatisée d'étapes déclenchée par un événement."]
];

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};

/* ---------- copie ---------- */
function copyText(btn,text){
  const ok=()=>{const t=btn.textContent;btn.textContent="Copié";btn.classList.add("done");setTimeout(()=>{btn.textContent=t==="Copié"?"Copier":t;btn.classList.remove("done")},1500)};
  const fallback=()=>{const pre=btn.closest(".code")?.querySelector("pre");if(pre){const r=document.createRange();r.selectNodeContents(pre);const s=getSelection();s.removeAllRanges();s.addRange(r);btn.textContent="Sélectionné : Ctrl+C"}};
  try{navigator.clipboard.writeText(text).then(ok,fallback)}catch(e){fallback()}
}
document.addEventListener("click",e=>{
  const b=e.target.closest(".cp");if(!b)return;
  const src=b.dataset.copy?document.getElementById(b.dataset.copy):b.closest(".code").querySelector("pre");
  copyText(b,src.textContent);
});
function codeBlock(label,text,extra=""){
  const d=document.createElement("div");d.className="code";
  d.innerHTML=`<div class="ch"><span>${esc(label)}</span><span style="display:flex;gap:6px;flex-wrap:wrap">${extra}<button class="cp" type="button">Copier</button></span></div><pre></pre>`;
  d.querySelector("pre").textContent=text;return d;
}

/* ---------- prompts flash ---------- */
FLASH.forEach(([t,p])=>{const b=document.createElement("div");b.className="box";b.innerHTML=`<h4>${esc(t)}</h4>`;b.appendChild(codeBlock("prompt",p));$("#flash").appendChild(b)});

/* ---------- agents ---------- */
const N8N_HEAD=`# MODE AUTOMATIQUE (n8n)
Tu travailles sans interlocuteur : ignore toute consigne qui te demande de poser des questions ou d'attendre.
Si une information manque, écris [À COMPLÉTER : ...] dans le texte et liste les manques en fin de réponse.
Tu produis un BROUILLON qui sera relu par un humain avant tout envoi.
Réponds uniquement avec le contenu demandé, sans commentaire avant ou après.

`;
const pcSpecialist=a=>document.getElementById("pcspe").textContent.replace("[CDT-0X Nom de l'agent]","CDT-"+a.id+" "+a.nom).replace(/\[Collez ici[^\]]*\]/,"Les étapes \"ATTENDS mes réponses\" ci-dessous sont remplacées par des commentaires sur le ticket.\n\n"+a.prompt);
const lvlPill=l=>l===1?'<span class="pill p1">Niveau 1</span>':l===2?'<span class="pill p2">Niveau 1 → n8n</span>':'<span class="pill p3">Niveau 1 → Paperclip</span>';
const phases=["Toutes",...new Set(AGENTS.map(a=>a.phase))];let curPhase="Toutes";
phases.forEach(p=>{const b=document.createElement("button");b.type="button";b.className="chip";b.textContent=p;b.setAttribute("aria-pressed",p==="Toutes");b.onclick=()=>{curPhase=p;$$("#agfilters .chip").forEach(c=>c.setAttribute("aria-pressed",c===b));filterAgents()};$("#agfilters").appendChild(b)});
AGENTS.forEach(a=>{
  const d=document.createElement("details");d.className="ag";d.id="agent-"+a.id;d.dataset.phase=a.phase;
  d.innerHTML=`<summary><span class="id">${a.id}</span><span class="nm"><b>${esc(a.nom)}</b><span>${esc(a.mission)}</span></span><span class="tags"><span class="pill">${esc(a.phase)}</span>${lvlPill(a.lvl)}</span></summary>
  <div class="in">
    <div class="kv">
      <div class="k">Où l'installer</div><div>${esc(a.outil)} Nom conseillé : <code>CDT-${a.id} ${esc(a.nom)} v1</code>.</div>
      <div class="k">Fichiers à joindre</div><div><ul>${a.fichiers.map(f=>`<li>${esc(f)}</li>`).join("")}</ul></div>
      <div class="k">Questions qu'il pose</div><div><ul>${a.questions.map(f=>`<li>${esc(f)}</li>`).join("")}</ul></div>
      <div class="k">Sortie attendue</div><div>${esc(a.sortie)}</div>
      <div class="k">Automatisation</div><div>${esc(a.auto)}</div>
    </div>
    <div class="slot-prompt"></div>
    <div class="slot-start"></div>
    <div class="call warn"><b class="h">Garde-fous</b><ul style="padding-left:18px">${a.garde.map(g=>`<li>${esc(g)}</li>`).join("")}</ul></div>
  </div>`;
  const versions={std:a.prompt,n8n:N8N_HEAD+a.prompt,pc:a.id==="15"?document.getElementById("pcceo").textContent:pcSpecialist(a)};
  const labels={std:"Instructions · Claude, ChatGPT, Gemini, Copilot, Le Chat",n8n:"System Message · nœud AI Agent n8n",pc:"AGENTS.md · Paperclip"};
  const sw=`<button class="vb" type="button" data-v="std" aria-pressed="true">Standard</button><button class="vb" type="button" data-v="n8n" aria-pressed="false">Version n8n</button><button class="vb" type="button" data-v="pc" aria-pressed="false">Version Paperclip</button>`;
  const cb=codeBlock(labels.std,versions.std,sw);
  cb.querySelectorAll("[data-v]").forEach(btn=>btn.addEventListener("click",()=>{const v=btn.dataset.v;cb.querySelector("pre").textContent=versions[v];cb.querySelector(".ch>span").textContent=labels[v];cb.querySelectorAll("[data-v]").forEach(x=>x.setAttribute("aria-pressed",x===btn))}));
  d.querySelector(".slot-prompt").appendChild(cb);
  d.querySelector(".slot-start").appendChild(codeBlock("Message de démarrage · à coller dans une nouvelle conversation",a.demarrage));
  $("#aglist").appendChild(d);
});
function filterAgents(){
  const q=$("#agsearch").value.trim().toLowerCase();let n=0;
  $$("details.ag").forEach(d=>{const show=(curPhase==="Toutes"||d.dataset.phase===curPhase)&&(!q||d.textContent.toLowerCase().includes(q));d.hidden=!show;if(show)n++});
  $("#agempty").hidden=n>0;
}
$("#agsearch").addEventListener("input",filterAgents);

/* table outil par agent */
AGENTS.forEach(a=>{const r=$("#maptable").insertRow();r.innerHTML=`<td class="k"><a href="#agent-${a.id}">${a.id} · ${esc(a.nom)}</a></td><td>${esc(a.outil.split(".")[0])}</td><td>${lvlPill(a.lvl)}</td>`});
document.addEventListener("click",e=>{const l=e.target.closest('a[href^="#agent-"]');if(!l)return;const d=document.querySelector(l.getAttribute("href"));if(d){d.hidden=false;d.open=true}});

/* ---------- onglets ---------- */
const tabs=$$("#tooltabs [role=tab]");
function selTab(t){tabs.forEach(x=>{const on=x===t;x.setAttribute("aria-selected",on);x.tabIndex=on?0:-1;document.getElementById(x.getAttribute("aria-controls")).hidden=!on});store.set("cdt_tab",t.id)}
tabs.forEach((t,i)=>{t.addEventListener("click",()=>selTab(t));t.addEventListener("keydown",e=>{if(e.key==="ArrowRight"||e.key==="ArrowLeft"){const n=tabs[(i+(e.key==="ArrowRight"?1:tabs.length-1))%tabs.length];selTab(n);n.focus()}})});
{const s=store.get("cdt_tab",null);const t=s&&document.getElementById(s);if(t)selTab(t)}

/* ---------- gains ---------- */
const fmt=n=>Math.round(n).toLocaleString("fr-FR");
let G=store.get("cdt_gains",null)||GAINS.map(g=>g.slice());let rate=store.get("cdt_rate",55);$("#rate").value=rate;
function buildGains(){
  $$("#gaintable tr.gr").forEach(r=>r.remove());
  G.forEach((g,i)=>{const r=$("#gaintable").insertRow();r.className="gr";r.innerHTML=`<td>${esc(g[0])}</td>`+[1,2,3].map(j=>`<td><input class="fld" type="number" min="0" step="0.5" id="g${i}_${j}" value="${g[j]}" aria-label="${esc(g[0])}"></td>`).join("")+`<td class="num" id="gh${i}"></td><td class="num" id="ge${i}"></td>`;
    [1,2,3].forEach(j=>r.querySelector(`#g${i}_${j}`).addEventListener("input",ev=>{G[i][j]=parseFloat(ev.target.value)||0;store.set("cdt_gains",G);calc()}))});
  calc();
}
function calc(){let H=0;G.forEach((g,i)=>{const h=g[1]*(g[2]-g[3]);H+=h;$("#gh"+i).textContent=fmt(h)+" h";$("#ge"+i).textContent=fmt(h*rate)+" €"});$("#tH").textContent=fmt(H)+" h";$("#tE").textContent=fmt(H*rate)+" €";$("#tY").textContent=fmt(H*rate*11)+" €"}
$("#rate").addEventListener("input",e=>{rate=parseFloat(e.target.value)||0;store.set("cdt_rate",rate);calc()});
$("#gainreset").onclick=()=>{G=GAINS.map(g=>g.slice());rate=55;$("#rate").value=55;store.set("cdt_gains",G);store.set("cdt_rate",55);buildGains()};
buildGains();

/* ---------- quiz ---------- */
QUIZ.forEach((q,i)=>{const d=document.createElement("div");d.className="q";d.innerHTML=`<p><b>${i+1}. ${esc(q[0])}</b></p>`+q[1].map((o,j)=>`<label><input type="radio" name="q${i}" id="q${i}_${j}" value="${j}"> ${esc(o)}</label>`).join("")+`<div class="ex" hidden></div>`;$("#quiz").appendChild(d)});
$("#qcheck").onclick=()=>{let s=0;QUIZ.forEach((q,i)=>{const c=document.querySelector(`input[name=q${i}]:checked`),ex=$$("#quiz .q")[i].querySelector(".ex"),good=c&&+c.value===q[2];if(good)s++;ex.hidden=false;ex.className="ex "+(good?"good":"badx");ex.textContent=(good?"Juste. ":"Réponse : « "+q[1][q[2]]+" ». ")+q[3]});$("#score").textContent=s+" / "+QUIZ.length+(s>=13?" · validé":" · à revoir")};
$("#qreset").onclick=()=>{$$("#quiz input").forEach(i=>i.checked=false);$$("#quiz .ex").forEach(e=>e.hidden=true);$("#score").textContent=""};

/* ---------- FAQ, glossaire ---------- */
FAQ.forEach(([q,a])=>{const d=document.createElement("details");d.className="fq";d.innerHTML=`<summary>${esc(q)}</summary><div><p>${esc(a)}</p></div>`;$("#faqlist").appendChild(d)});
GLOSS.forEach(([t,d])=>{const e=document.createElement("div");e.innerHTML=`<b>${esc(t)}</b>${esc(d)}`;$("#gl").appendChild(e)});

/* (navigation et thème : gérés par studio.js) */
const PROG={
"8":{desc:"Une journée intensive pour être autonome sur les agents manuels et comprendre comment les automatiser. n8n et Paperclip sont présentés en démonstration guidée.",
days:[{t:"Journée unique · 8 h",rows:[
["8h30","Accueil, enjeux, règle d'or","#accueil","15 min","Tour de table : vos 3 tâches les plus chronophages"],
["8h45","Fondations et écriture d'une instruction","#fondations","1 h 30","Exercice des 5 sorties piégées, méthode R-C-E-P-S-V (modules 01 et 02)"],
["brk","10h15","Pause"],
["10h30","Choisir ses outils et sa base documentaire","#outils","45 min","Outil principal validé, liste des documents à réunir (modules 03 et 04)"],
["11h15","Où coller vos prompts : premier agent","#installer","1 h 15","Installation guidée de l'agent CR dans votre outil"],
["brk","12h30","Déjeuner"],
["13h30","Atelier : 3 agents sur vos dossiers","#agents","1 h 30","Agents CR, Mails ST, Lecture DCE testés sur vos cas réels"],
["15h00","Chaîner et tester","#chaines","30 min","Relais DCE → mémoire, grille de test et journal d'erreurs (modules 07 et 08)"],
["brk","15h30","Pause"],
["15h45","n8n : démonstration guidée","#n8n","1 h","Le workflow mails chantier construit en direct, brouillons uniquement"],
["16h45","Paperclip et choix du niveau","#paperclip","30 min","Démonstration de la Cellule IA, carte de vos tâches par niveau (modules 10 et 11)"],
["17h15","Sécurité, gains, quiz, plan d'action","#securite","45 min","Charte d'usage, estimation des gains, auto-évaluation, plan 30/60/90"]
]}]},
"16":{desc:"Jour 1 : maîtriser les agents manuels et repartir avec 3 agents fiables. Jour 2 : automatiser avec n8n, découvrir Paperclip, sécuriser et chiffrer les gains.",
days:[{t:"Jour 1 · Agents manuels · 8 h",rows:[
["8h30","Accueil, enjeux, règle d'or","#accueil","15 min","Tour de table : vos 3 tâches les plus chronophages"],
["8h45","Fondations de l'IA","#fondations","1 h","Ce que l'IA fait bien, où elle se trompe, exercice des sorties piégées"],
["9h45","Écrire une instruction","#prompts","1 h","Méthode R-C-E-P-S-V, rédaction de votre première instruction"],
["brk","10h45","Pause"],
["11h00","Choisir ses outils","#outils","30 min","Outil principal et de secours, vérification de la confidentialité"],
["11h30","Base documentaire","#base","1 h","Création du dossier IA-Référentiel, fiches cadences et références"],
["brk","12h30","Déjeuner"],
["13h30","Où coller vos prompts","#installer","1 h 30","Installation pas à pas de l'agent CR dans votre outil"],
["brk","15h00","Pause"],
["15h15","Atelier : 3 agents sur vos dossiers","#agents","2 h","Agents CR, Mails ST, Lecture DCE installés et testés sur vos cas réels"],
["17h15","Chaîner et tester","#chaines","45 min","Relais entre agents, grille de test, journal d'erreurs (modules 07 et 08)"]
]},{t:"Jour 2 · Automatiser et piloter · 8 h",rows:[
["8h30","Retour sur vos agents","#tests","15 min","Ce qui a marché, ce qu'il faut corriger dans les instructions"],
["8h45","n8n : bases, installation, identifiants","#n8n","1 h 45","Compte n8n, connexion Gmail ou Outlook, clé API, nœud AI Agent"],
["brk","10h30","Pause"],
["10h45","n8n : atelier workflow mails chantier","#n8n","1 h 45","Construction complète : tri, agent, brouillon, tableau de suivi"],
["brk","12h30","Déjeuner"],
["13h30","n8n : workflows CR et veille AO","#n8n","1 h","Deuxième workflow au choix, validation humaine avant envoi"],
["14h30","Paperclip : équipe d'agents","#paperclip","1 h 30","Cellule IA avec directeur de travaux IA et 2 agents, premier ticket validé"],
["brk","16h00","Pause"],
["16h15","Choisir le niveau et sécuriser","#niveau","45 min","Carte de vos tâches par niveau, charte d'usage IA (modules 11 et 12)"],
["17h00","Gains, quiz, plan d'action","#gains","1 h","Calcul des gains, auto-évaluation, plan 30/60/90"]
]}]}
};
let FORM=store.get("cdt_formula","16");
function renderProg(){
  $$("#programme .seg button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.f===FORM));
  $("#fdesc").textContent=PROG[FORM].desc;
  const S=store.get("cdt_prog_"+FORM,{});const box=$("#sched");box.innerHTML="";let k=0;
  PROG[FORM].days.forEach(d=>{
    const h=document.createElement("h3");h.textContent=d.t;box.appendChild(h);
    const w=document.createElement("div");w.className="tw";w.style.marginTop="10px";
    const t=document.createElement("table");t.className="wk";t.innerHTML="<tr><th>✓</th><th>Horaire</th><th>Séquence</th><th>Durée</th><th>Ce que vous faites</th></tr>";
    d.rows.forEach(r=>{const tr=t.insertRow();
      if(r[0]==="brk"){tr.className="brk";tr.innerHTML=`<td></td><td class="t">${r[1]}</td><td colspan="3">${r[2]}</td>`;return}
      const i=k++;tr.innerHTML=`<td><input type="checkbox" id="pg${FORM}_${i}" aria-label="${esc(r[1])} faite"></td><td class="t">${r[0]}</td><td><a href="${r[2]}">${esc(r[1])}</a></td><td class="num" style="white-space:nowrap">${r[3]}</td><td>${esc(r[4])}</td>`;
      const c=tr.querySelector("input");c.checked=!!S[i];tr.classList.toggle("done",c.checked);
      c.onchange=()=>{S[i]=c.checked;tr.classList.toggle("done",c.checked);store.set("cdt_prog_"+FORM,S);prog()}});
    w.appendChild(t);box.appendChild(w);
  });
  prog();
}
function prog(){const n=$$("#sched input:checked").length,tot=$$("#sched input").length,p=tot?Math.round(n/tot*100):0;$("#pct").textContent=p+" %";$("#navpct").textContent=p+" %";$("#navbar").style.width=p+"%"}
$$("#programme .seg button").forEach(b=>b.onclick=()=>{FORM=b.dataset.f;store.set("cdt_formula",FORM);renderProg()});
renderProg();

