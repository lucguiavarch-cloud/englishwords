/**
 * Indices de désambiguïsation : uniquement en français, sans exemples anglais
 * ni mention du mot anglais attendu (le joueur doit le retrouver lui-même).
 * Clés : en|fr (minuscules), alignées sur add-word-guides.mjs
 */
export const EXPLICIT = {
    "a|un": "Article indéfini placé devant un son consonantique — ce n’est ni la forme devant voyelle, ni le nombre « un ».",
    "an|un": "Article indéfini placé devant voyelle — ce n’est ni la forme devant consonne, ni le nombre « un ».",
    "one|un": "Ici au sens de nombre ou d’unité isolée — ce ne sont pas les articles indéfinis devant un nom.",

    "her|son": "Relatif au féminin (elle) : possessif ou complément correspondant — pas la forme masculine ni le substantif « bruit ».",
    "his|son": "Relatif au masculin (il) : possessif — pas la forme au féminin ni le substantif « bruit ».",
    "sound|son": "Substantif : bruit, ce qu’on entend — pas un adjectif possessif.",

    "fly|voler": "Sens aérien : s’élever ou se déplacer dans les airs — pas dérober ni braquer.",
    "steal|voler": "Sens illégal : prendre ce qui appartient à autrui — pas le sens aérien ni le braquage de personne.",
    "rob|voler": "Dérober à quelqu’un ou dans un lieu (souvent avec violence ou menace) — à distinguer des deux autres sens de « voler ».",

    "book|livre": "Objet qu’on lit (ouvrage) — pas la monnaie ni la livre-mesure de poids.",
    "pound|livre": "Monnaie britannique ou unité de poids — pas l’ouvrage qu’on lit.",

    "practise|pratique": "Verbe (orthographe britannique fréquente) : s’exercer, entraîner — pas le nom d’habitude ni l’adjectif « commode ».",
    "practice|pratique": "Nom : habitude, entraînement, cabinet — pas le verbe d’entraînement ni l’adjectif.",
    "practical|pratique": "Adjectif : concret, utile au quotidien — pas le nom ni le verbe d’entraînement.",
    "convenient|pratique": "Adjectif : commode, qui arrange — autre famille que l’entraînement ou l’habitude.",
    "handy|pratique": "Adjectif : utile sous la main, qui dépanne — nuance proche de « commode » mais distincte des autres entrées.",

    "well|bien": "Adverbe de manière (souvent avec un verbe) — pas l’adjectif de qualité ni « correct / en forme ».",
    "good|bien": "Adjectif de qualité ou de moral — pas l’adverbe de manière.",
    "fine|bien": "Adjectif : correct, convenable, en bonne forme — nuance différente des deux autres « bien ».",
    "nicely|bien": "Adverbe : de façon agréable ou polie — pas les adjectifs ni l’adverbe de manière générale.",

    "not|pas": "Négation avec auxiliaire ou verbe — pas le bruit de pas ni le terrain de sport.",
    "footstep|pas": "Bruit ou empreinte de pas — pas la négation.",
    "pitch|pas": "Terrain (sport) ou hauteur de voix — pas la négation ni l’empreinte.",

    "floor|sol": "Surface sur laquelle on marche dans une pièce — pas le sol extérieur ni la terre végétale.",
    "ground|sol": "Terre, surface extérieure — pas le plancher intérieur ni la terre de jardin.",
    "soil|sol": "Terre végétale, substrat — pas le plancher ni la surface générale du dehors.",

    "grass|herbe": "Gazon, pelouse — pas la plante aromatique ni la mauvaise herbe.",
    "herb|herbe": "Plante aromatique ou médicinale — pas le gazon ni la mauvaise herbe.",
    "weed|herbe": "Mauvaise herbe — pas le gazon ni la plante cultivée.",

    "person|personne": "Un être humain, quelqu’un — sens affirmatif simple.",
    "nobody|personne": "Pronom négatif : aucune personne — sens différent de « quelqu’un ».",
    "anybody|personne": "Pronom : n’importe qui / une personne non précisée — sens différent du négatif et du nom simple.",

    "sensible|sensible": "Faux ami : en anglais, plutôt « raisonnable, sensé » — ce n’est pas « réceptif » comme en français.",
    "sensitive|sensible": "Qui ressent fort, réactif — le faux ami « raisonnable » se dit autrement en anglais.",

    "answer|répondre": "Répondre de façon directe (question, téléphone…) — nuance générale parmi trois verbes proches.",
    "reply|répondre": "Répondre, souvent à un message ou courrier — nuance plutôt écrite ou enchaînée.",
    "respond|répondre": "Réagir ou répondre, parfois plus formel ou large — troisième nuance du groupe.",

    "begin|commencer": "Entamer, être au début de — verbe très courant parmi trois du même champ lexical.",
    "start|commencer": "Démarrer une action ou faire partir quelque chose — très fréquent, proche mais pas identique aux deux autres.",
    "commence|commencer": "Commencer sur un ton plus soutenu ou officiel — troisième verbe du groupe.",

    "big|grand": "Grand ou important de façon générale — à distinguer de « haut » ou « large » selon contexte.",
    "tall|grand": "Grand en hauteur (personne, bâtiment) — pas l’idée de grosseur générale ou de largeur.",
    "large|grand": "Large, étendu en surface ou ampleur — pas la hauteur ni la grosseur générale.",

    "little|petit": "Petit ou peu (souvent affectif) — nuance parmi trois « petit ».",
    "small|petit": "De petite taille, modeste — neutre et fréquent.",
    "petty|petit": "Mesquin, sans envergure — pas seulement la taille physique.",

    "child|enfant": "Enfant, standard neutre.",
    "kid|enfant": "Gamin, registre familier.",
    "youngster|enfant": "Jeune, adolescent ou enfant — ton un peu plus descriptif.",

    "clever|intelligent": "Malin, débrouillard — registre un peu familier parmi trois adjectifs d’esprit.",
    "intelligent|intelligent": "Cognat neutre : qui a de l’intelligence.",
    "smart|intelligent": "Futé, intelligent ou élégant selon contexte — troisième nuance du groupe.",

    "flight|vol": "Trajet aérien ou action de voler dans les airs — pas le délit ni le braquage.",
    "theft|vol": "Délit de vol, larcin — pas l’avion ni le braquage.",
    "robbery|vol": "Vol avec violence ou menace contre une personne — pas le trajet aérien ni le larcin discret.",

    "goal|but": "But au sport ou objectif visé — nuance parmi trois noms d’objectif.",
    "aim|but": "Visée, intention — deuxième nuance du groupe.",
    "purpose|but": "Finalité, raison d’être — troisième nuance du groupe.",

    "fast|rapide": "Rapide, courant — parmi plusieurs adjectifs/adverbes de vitesse.",
    "quick|rapide": "Rapide, souvent bref ou immédiat.",
    "rapid|rapide": "Rapide, un peu plus soutenu ou technique.",
    "swift|rapide": "Rapide et souple, parfois littéraire.",
    "prompt|rapide": "Sans délai, ponctuel.",

    "wrong|faux": "Incorrect, erroné — première nuance du groupe.",
    "false|faux": "Faux, non vrai — deuxième nuance.",
    "fake|faux": "Contrefait, simulé — nuance de tromperie.",
    "untrue|faux": "Inexact — registre plus formel.",

    "travel|voyage": "Voyager ou le voyage en général — terme large.",
    "journey|voyage": "Trajet, parcours d’un point à un autre.",
    "trip|voyage": "Court déplacement, excursion.",
    "voyage|voyage": "Long trajet, souvent maritime ou littéraire — emprunt en anglais.",

    "check|vérifier": "Vérifier, contrôler — verbe courant ; ne pas confondre avec le nom du papier bancaire (même prononciation approximative).",
    "cheque|vérifier": "Nom : ordre de paiement bancaire — pas le verbe de contrôle.",
    "checkout|vérifier": "Caisse ou étape de validation — autre substantif.",
    "verify|vérifier": "Vérifier de façon formelle ou officielle.",

    "in|dans": "Dans l’espace ou le temps, à l’intérieur — statique ou général.",
    "into|dans": "Vers l’intérieur, mouvement d’entrée — insiste sur le passage.",
    "within|dans": "À l’intérieur de, ou avant une limite de temps — nuance plus précise.",

    "on|sur": "Sur la surface, en contact — préposition de base.",
    "over|sur": "Au-dessus, de l’autre côté, ou « plus de » — pas toujours interchangeable.",
    "upon|sur": "Sur, après (souvent littéraire ou figé) — registre plus soutenu.",

    "more|plus": "Comparatif de quantité ou de degré — usage général.",
    "anymore|plus": "Ne… plus (dans une phrase négative anglaise) — construction différente du français.",
    "plus|plus": "Signe ou idée d’addition — contexte math ou symbole.",

    "same|même": "Identique, le même — adjectif ou pronom.",
    "even|même": "Même, jusqu’à (renforcement) — adverbe.",
    "alike|même": "Semblable, de la même façon — adjectif ou adverbe.",

    "say|dire": "Dire quelque chose (énoncer) — complément souvent une chose.",
    "tell|dire": "Dire à quelqu’un, raconter — complément souvent une personne.",
    "utter|dire": "Prononcer, laisser échapper — registre soutenu.",

    "end|fin": "Fin, terme — substantif principal.",
    "ending|fin": "Conclusion, dénouement — substantif dérivé.",
    "finely|fin": "Finement — adverbe (ne pas confondre avec « fin » = conclusion).",

    "last|dernier": "Dernier dans une suite, précédent — attention au faux ami avec « le plus récent ».",
    "latest|dernier": "Le plus récent, à jour — pas « dernier » au sens de « final ».",
    "latter|dernier": "Le second des deux évoqués — sens très précis.",

    "many|beaucoup": "Beaucoup avec nom dénombrable au pluriel.",
    "much|beaucoup": "Beaucoup avec nom indénombrable.",
    "plenty|beaucoup": "Largement assez, abondance — nuance positive.",

    "earn|gagner": "Gagner de l’argent ou mériter — pas la victoire sportive ni le gain soudain.",
    "win|gagner": "Gagner une compétition, un prix — pas le salaire.",
    "gain|gagner": "Acquérir, augmenter — nuance générale d’obtention.",

    "hurt|blesser": "Faire mal ou blesser — courant.",
    "injure|blesser": "Blesser (corps ou réputation) — un peu plus formel.",
    "wound|blesser": "Blesser grièvement ou faire une blessure — registre plus médical ou grave.",

    "stay|rester": "Rester sur place ou dans un état — le plus courant.",
    "remain|rester": "Demeurer, subsister — plus soutenu.",
    "stand|rester": "Rester debout ou supporter — sens selon contexte.",

    "advice|conseil": "Conseil (souvent indénombrable en anglais) — avis général.",
    "tip|conseil": "Astuce ou pourboire selon contexte — homonymie à surveiller.",
    "council|conseil": "Instance, assemblée municipale ou administrative — institution.",
    "board|conseil": "Conseil d’administration ou tableau — autre sens institutionnel.",

    "fool|idiot": "Personne sotte ou imbécile — substantif.",
    "idiot|idiot": "Insulte ou nom cognat.",
    "silly|idiot": "Bête sans méchanceté — adjectif adouci.",
    "foolish|idiot": "Stupide, imprudent.",
    "dumb|idiot": "Stupide (familier ; sens « muet » existe aussi) — attention au registre.",

    "company|entreprise": "Entreprise ou compagnie — sens le plus courant.",
    "business|entreprise": "Affaires, commerce, entreprise — champ large.",
    "corporate|entreprise": "Relatif à l’entreprise — adjectif, pas le nom « société » seul.",
    "enterprise|entreprise": "Entreprise ou projet d’envergure — nuance d’initiative.",
    "undertaking|entreprise": "Entreprise au sens de projet lourd ou engagement — plus abstrait.",

    "complete|complet": "Complet, entier — adjectif.",
    "full|complet": "Plein, complet — proche mais nuance « rempli ».",
    "thorough|complet": "Complet et minutieux — insiste sur la rigueur.",
    "comprehensive|complet": "Qui couvre tout, exhaustif — registre soutenu.",

    "difficult|difficile": "Difficile, standard.",
    "tough|difficile": "Dur, difficile à vivre ou à résoudre.",
    "tricky|difficile": "Délicat, piégeux.",
    "fussy|difficile": "Difficile à satisfaire, tatillon — sens différent de « dur ».",

    "alter|modifier": "Modifier légèrement.",
    "modify|modifier": "Modifier, changer.",
    "edit|modifier": "Éditer, corriger — souvent texte ou média.",
    "amend|modifier": "Amender, corriger officiellement.",

    "critic|critique": "Personne qui critique — substantif.",
    "critical|critique": "Crucial ou critique (jugement) — adjectif ; faux ami avec le journaliste.",
    "critically|critique": "De façon critique ou cruciale — adverbe.",
    "criticism|critique": "Jugement, critique — substantif.",

    "unnecessary|inutile": "Non nécessaire.",
    "useless|inutile": "Qui ne sert à rien — plus fort.",
    "needless|inutile": "Sans utilité, superflu.",
    "pointless|inutile": "Sans intérêt, vain.",

    "headline|titre": "Titre de presse — une des nuances de « titre ».",
    "title|titre": "Titre général.",
    "heading|titre": "Titre de section, rubrique.",
    "entitle|titre": "Verbe : intituler ou donner droit — pas le nom.",

    "grab|saisir": "Attraper vivement.",
    "seize|saisir": "Saisir, confisquer ou profiter de l’occasion.",
    "grasp|saisir": "Saisir ou comprendre — double sens possible.",
    "input|saisir": "Saisir des données — contexte informatique.",

    "sun|soleil": "Astre du jour — mot court.",
    "sunshine|soleil": "Lumière ou chaleur du soleil.",
    "sunlight|soleil": "Rayons du soleil — proche du précédent.",

    "sweet|doux": "Sucré ou gentil selon contexte.",
    "soft|doux": "Doux au toucher ou faible intensité.",
    "gentle|doux": "Doux avec les autres, délicat.",

    "will|volonté": "Volonté ou document testamentaire — substantif court.",
    "willpower|volonté": "Force de volonté.",
    "willingness|volonté": "Bonne volonté, consentement.",

    "advertisement|publicité": "Une publicité, une annonce.",
    "advertising|publicité": "Le secteur ou l’ensemble des annonces.",
    "publicity|publicité": "Retentissement médiatique ou promotion — nuance différente.",

    "afraid|effrayé": "Qui a peur — très courant.",
    "frightened|effrayé": "Effrayé — un peu plus marqué.",
    "scared|effrayé": "Effrayé — familier.",

    "amazing|incroyable": "Étonnant, formidable — registre oral.",
    "incredible|incroyable": "Incroyable — cognat.",
    "unbelievable|incroyable": "Invraisemblable — renforce l’idée.",

    "away|loin": "Au loin, parti — adverbe de distance ou d’éloignement.",
    "far|loin": "Loin — adjectif ou adverbe.",
    "distant|loin": "Éloigné, froid dans le comportement — adjectif.",

    "beginning|début": "Début, commencement — substantif courant.",
    "debut|début": "Première apparition, entrée en scène — emprunt.",
    "outset|début": "Au tout début — registre soutenu.",

    "bicycle|vélo": "Vélo, mot complet.",
    "bike|vélo": "Vélo, familier.",
    "cycling|vélo": "Cyclisme, activité — substantif d’action.",

    "bit|peu": "Petit morceau ou « un peu » selon contexte.",
    "few|peu": "Peu de (pluriel dénombrable).",
    "sparsely|peu": "De façon clairsemée — rare.",

    "blanket|couverture": "Couverture de lit — textile.",
    "cover|couverture": "Couverture, couvercle, jaquette — sens large.",
    "coverage|couverture": "Couverture médiatique ou assurance — faux ami fréquent.",

    "bookcase|bibliothèque": "Meuble à livres.",
    "bookshelf|bibliothèque": "Étagère à livres.",
    "library|bibliothèque": "Lieu ou collection de livres — pas le meuble seul.",

    "boss|chef": "Patron, chef informel.",
    "leader|chef": "Meneur, dirigeant.",
    "chief|chef": "Chef, responsable — titre ou fonction.",

    "bright|brillant": "Lumineux ou intelligent — double champ.",
    "brilliant|brillant": "Très lumineux ou génial.",
    "shiny|brillant": "Qui brille en surface.",

    "calendar|calendrier": "Calendrier mural ou liste de jours.",
    "timetable|calendrier": "Emploi du temps, horaires.",
    "schedule|calendrier": "Planning, programme.",

    "carefully|soigneusement": "Avec soin, prudemment.",
    "thoroughly|soigneusement": "À fond, complètement.",
    "neatly|soigneusement": "Proprement, avec ordre.",

    "carpet|tapis": "Moquette, grand tapis.",
    "rug|tapis": "Tapis.",
    "mat|tapis": "Paillasson, natte — plus petit ou utilitaire.",

    "crazy|fou": "Fou, dingue — familier.",
    "mad|fou": "Fou ou furieux selon contexte.",
    "insane|fou": "Dément — plus fort.",

    "dangerous|dangereux": "Dangereux — standard.",
    "unsafe|dangereux": "Peu sûr, risqué.",
    "hazardous|dangereux": "Dangereux pour la santé ou l’environnement — registre technique.",

    "double|double": "Double, deux fois — adjectif.",
    "twin|double": "Jumeau, doublon — nom ou adjectif.",
    "dual|double": "À deux parties, double fonction.",

    "enough|assez": "Assez, suffisamment.",
    "quite|assez": "Assez, tout à fait — adverbe de degré.",
    "fairly|assez": "Relativement, assez.",

    "extra|supplémentaire": "En plus, supplémentaire — courant.",
    "additional|supplémentaire": "Additionnel — un peu plus formel.",
    "supplementary|supplémentaire": "Supplémentaire — registre soutenu.",

    "foreign|étranger": "Étranger — adjectif.",
    "foreigner|étranger": "Étranger — personne d’un autre pays.",
    "stranger|étranger": "Inconnu — pas forcément d’un autre pays.",

    "fresh|frais": "Frais, neuf — adjectif.",
    "fee|frais": "Frais, honoraires — substantif.",
    "expense|frais": "Dépense — substantif.",

    "indoor|intérieur": "À l’intérieur, en salle — adjectif.",
    "inner|intérieur": "Intérieur, intime.",
    "interior|intérieur": "Intérieur — nom ou adjectif.",

    "least|moins": "Le moins — superlatif négatif.",
    "less|moins": "Moins — comparatif.",
    "minus|moins": "Moins, signe de soustraction.",

    "down|vers le bas": "Vers le bas — adverbe.",
    "downward|vers le bas": "Qui descend — adjectif ou adverbe.",
    "downwards|vers le bas": "Vers le bas — adverbe.",

    "dark|sombre": "Sombre, peu lumineux.",
    "bleak|sombre": "Moralement sombre, désespérant.",
    "grim|sombre": "Sinistre, sévère.",

    "fun|amusant": "Amusement — substantif informel.",
    "amusing|amusant": "Qui amuse — adjectif.",
    "entertaining|amusant": "Divertissant — spectacle ou conversation.",

    "happy|heureux": "Heureux, content — général.",
    "pleased|heureux": "Content, satisfait d’un résultat.",
    "fortunate|heureux": "Chanceux — nuance de circonstance favorable.",

    "fortunately|heureusement": "Heureusement (chance) — adverbe.",
    "luckily|heureusement": "Par chance.",
    "thankfully|heureusement": "Dieu merci / avec soulagement — nuance de gratitude.",
    "happily|heureusement": "Avec joie — adverbe de manière.",

    "quickly|rapidement": "Rapidement — courant.",
    "promptly|rapidement": "Sans tarder.",
    "rapidly|rapidement": "À grande vitesse.",
    "swiftly|rapidement": "Vite et souplement.",

    "weak|faible": "Faible en force ou intensité.",
    "low|faible": "Bas, faible (niveau, quantité).",
    "dim|faible": "Terne, peu intense (lumière, esprit).",
    "feeble|faible": "Chétif, très faible.",

    "beautiful|beau": "Beau — général.",
    "lovely|beau": "Charmant, adorable.",
    "handsome|beau": "Beau (souvent pour un homme).",

    "before|avant": "Avant — temps ou ordre.",
    "prior|avant": "Préalable, antérieur — adjectif.",
    "forward|avant": "En avant — direction.",

    "famous|célèbre": "Célèbre — général.",
    "renowned|célèbre": "Renommé — soutenu.",
    "notorious|célèbre": "Notoire — souvent négatif.",

    "ride|monter": "Monter à vélo, à cheval, conduire un véhicule léger.",
    "mount|monter": "Monter, assembler, installer.",
    "soar|monter": "Monter très haut dans les airs.",

    "slim|mince": "Mince, élancé.",
    "thin|mince": "Mince, parfois maigre.",
    "slender|mince": "Svelte.",
};
