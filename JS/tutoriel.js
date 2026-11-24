// Tutoriel de SportApp : un tour complet de l'appli, étape par étape.
// Il se lance tout seul pour un nouveau compte (Accueil), et se revoit depuis Paramètres → Aide.
// « Passer » le ferme à tout moment. Flèches du clavier et glisser à gauche / droite pour avancer.

const CLE_TUTORIEL = "sportapp:tutoriel-vu";

function tutorielDejaVu() {
  try { return !!localStorage.getItem(CLE_TUTORIEL); } catch (e) { return true; }
}

// prenom et seanceDuJour sont facultatifs (pour personnaliser le premier écran)
function lancerTutoriel(prenom, seanceDuJour) {
  try { localStorage.setItem(CLE_TUTORIEL, "1"); } catch (e) {}

  const aujourdhuiTexte = seanceDuJour ? "Ta prochaine séance : " + seanceDuJour + "." : "";

  // [emoji, couleur, titre, texte, astuces]
  const ETAPES = [
    ["👋", "orange", "Bienvenue" + (prenom ? ", " + prenom : "") + " !",
      "SportApp t’accompagne à la salle et en dehors : tes séances, tes records, ta nutrition, ta progression et tes potes. " +
      "Voici le tour complet en une minute. " + aujourdhuiTexte,
      ["Tu peux passer à tout moment", "Le tuto se revoit dans Paramètres → Aide"]],
    ["🏠", "orange", "L’accueil",
      "Ta prochaine séance s’affiche ici. Sans programme, c’est une séance libre ; avec un programme, l’appli suit l’ordre de tes séances, pas le calendrier.",
      ["Tu as sauté un jour ? Tu reprends là où tu t’étais arrêté", "Crée ton programme dans Paramètres (modèles Push / Pull / Leg, Upper / Lower…)", "Ta série 🔥 tient tant que tu ne restes pas plus de 2 jours sans t’entraîner"]],
    ["➕", "orange", "Le bouton ＋",
      "En bas à droite, sur toutes les pages : il ajoute en un geste une séance, un repas, une pesée ou un PR.",
      ["La pesée se note directement dans le menu", "Pas besoin de chercher la bonne page"]],
    ["🏋️", "violet", "Noter une séance",
      "Ajoute tes exercices, règle les reps et les kilos avec − / +, puis touche « ✓ Valider la série ».",
      ["« Dernière fois » te rappelle ta perf précédente", "Le chrono de repos démarre tout seul après chaque série", "Sans réseau à la salle ? La séance part toute seule plus tard"]],
    ["🏆", "or", "Tes records",
      "Un record battu pendant la séance est fêté en direct. Dans Sport → Records, note tes PR sur 1 répétition.",
      ["Un PR « ✓ vérifié » est cohérent avec tes séries récentes", "Tes meilleures séries sont calculées automatiquement"]],
    ["🥗", "vert", "Nutrition",
      "Tes besoins en calories sont calculés pour toi (ou choisis ton propre objectif). L’anneau se remplit à chaque repas.",
      ["Scanne le code-barres d’un paquet : tout se remplit", "Plusieurs produits pour un même repas", "« Refaire la veille » recopie les repas d’hier"]],
    ["📈", "turquoise", "Progression",
      "Tes courbes de poids et de charges, ta régularité semaine après semaine, les muscles que tu travailles.",
      ["Choisis la période : 1, 2, 3 ou 6 mois", "L’appli rouvre ton dernier onglet consulté"]],
    ["⭐", "or", "Niveaux, défis et badges",
      "Chaque séance, chaque PR et chaque défi de la semaine te rapportent de l’XP. Monte de niveau et débloque des badges.",
      ["Une séance par jour compte (au moins 3 séries)", "Défis de la semaine : 3 séances, 5 séances, un record, plus de volume"]],
    ["🤝", "violet", "Tes amis",
      "Dans Profil, choisis ton pseudo, cherche celui de tes potes et suis-les : leurs séances et leurs PR arrivent dans ton fil.",
      ["Encourage-les avec un 💪", "Compare vos PR et grimpez au classement", "Tes PR restent privés si tu le souhaites"]],
    ["🔔", "turquoise", "Notifications et installation",
      "Installe SportApp sur ton écran d’accueil pour l’ouvrir comme une vraie appli, puis active les notifications dans Paramètres.",
      ["iPhone : Partager ⬆️ → « Sur l’écran d’accueil »", "Rappel de séance, PR de tes amis, encouragements"]],
    ["🚀", "orange", "C’est parti !",
      "Tu sais tout. Le meilleur moyen de commencer : noter ta première séance.",
      []]
  ];

  let i = 0;
  const fond = el("div", "dialogue-fond tuto-fond");
  const boite = el("div", "dialogue tuto");
  boite.setAttribute("role", "dialog");
  boite.setAttribute("aria-modal", "true");
  boite.setAttribute("aria-label", "Tutoriel de SportApp");
  fond.appendChild(boite);

  function fermer() {
    document.removeEventListener("keydown", clavier);
    fond.remove();
    document.body.classList.remove("sans-defilement");
  }

  function aller(n) {
    if (n < 0 || n >= ETAPES.length) return;
    i = n;
    montrer();
  }

  function montrer() {
    const e = ETAPES[i];
    const derniere = i === ETAPES.length - 1;
    boite.innerHTML = "";

    // En-tête coloré avec le grand emoji et le bouton « Passer »
    const tete = el("div", "tuto-tete " + e[1]);
    tete.appendChild(el("span", "tuto-compteur", (i + 1) + " / " + ETAPES.length));
    if (!derniere) {
      const passer = el("button", "tuto-passer", "Passer");
      passer.type = "button";
      passer.addEventListener("click", fermer);
      tete.appendChild(passer);
    }
    tete.appendChild(el("div", "tuto-emoji", e[0]));
    boite.appendChild(tete);

    const corps = el("div", "tuto-corps");
    corps.appendChild(el("h2", "", e[2]));
    corps.appendChild(el("p", "tuto-texte", e[3]));
    if (e[4].length) {
      const liste = el("ul", "tuto-astuces");
      e[4].forEach(function (a) { liste.appendChild(el("li", "", a)); });
      corps.appendChild(liste);
    }

    // Points de progression (cliquables)
    const points = el("div", "bienvenue-points");
    ETAPES.forEach(function (_, j) {
      const p = el("button", j === i ? "actif" : "");
      p.type = "button";
      p.setAttribute("aria-label", "Étape " + (j + 1));
      p.addEventListener("click", function () { aller(j); });
      points.appendChild(p);
    });
    corps.appendChild(points);

    const boutons = el("div", "dialogue-boutons");
    if (derniere) {
      const explorer = el("button", "btn secondaire", "Explorer l’appli");
      explorer.type = "button";
      explorer.addEventListener("click", fermer);
      const go = el("a", "btn", "Ma première séance 💪");
      go.href = "Activite.html#nouvelle";
      go.addEventListener("click", fermer);
      boutons.appendChild(explorer);
      boutons.appendChild(go);
    } else {
      const avant = el("button", "btn secondaire", "Précédent");
      avant.type = "button";
      avant.disabled = i === 0;
      avant.addEventListener("click", function () { aller(i - 1); });
      const suivant = el("button", "btn", "Suivant");
      suivant.type = "button";
      suivant.addEventListener("click", function () { aller(i + 1); });
      boutons.appendChild(avant);
      boutons.appendChild(suivant);
    }
    corps.appendChild(boutons);
    boite.appendChild(corps);
    boutons.lastChild.focus();
  }

  function clavier(e) {
    if (e.key === "Escape") fermer();
    else if (e.key === "ArrowRight") aller(i + 1);
    else if (e.key === "ArrowLeft") aller(i - 1);
  }
  document.addEventListener("keydown", clavier);

  // Glisser à gauche / à droite pour changer d'étape
  let departX = null;
  boite.addEventListener("touchstart", function (e) { departX = e.touches[0].clientX; }, { passive: true });
  boite.addEventListener("touchend", function (e) {
    if (departX === null) return;
    const dx = e.changedTouches[0].clientX - departX;
    departX = null;
    if (dx < -50) aller(i + 1);
    else if (dx > 50) aller(i - 1);
  }, { passive: true });

  montrer();
  document.body.appendChild(fond);
  document.body.classList.add("sans-defilement");
}
