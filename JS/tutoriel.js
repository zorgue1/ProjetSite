// Visite guidée de SportApp, directement sur les vrais écrans.
// - Chaque page a son petit guide : un projecteur éclaire le vrai bouton, une bulle explique.
// - Il se lance tout seul la première fois qu'on ouvre la page (Accueil : lancé par la page).
// - Le bouton « ? » en haut de chaque page le relance ; Paramètres → Aide les relance tous.
// - « Passer » le ferme à tout moment. Flèches du clavier et glisser à gauche / droite marchent aussi.

const CLE_VISITE = "sportapp:visite:";      // + nom de la page : guide déjà vu

/* ---------- Les étapes de chaque page ---------- */
// cible : élément à éclairer (sélecteur CSS) ; sans cible, la bulle s'affiche au centre
const VISITES = {
  "Accueil.html": [
    { titre: "Bienvenue{prenom} 👋",
      texte: "On te montre l’appli en une minute, directement sur l’écran. Tu peux passer à tout moment." },
    { cible: "#hero", titre: "Ta séance du jour",
      texte: "Ta prochaine séance s’affiche ici. Le bouton orange l’ouvre : tu n’as plus qu’à noter tes séries." },
    { cible: ".serie", titre: "Ta série 🔥",
      texte: "Les jours d’entraînement d’affilée (jusqu’à 3 jours de pause, ça compte encore). Ne la casse pas !" },
    { cible: ".profil", titre: "Toi",
      texte: "Ton niveau, ton poids et tes stats. Le bouton du bas met ton poids à jour." },
    { cible: ".barre-bas", titre: "Le menu",
      texte: "Sport : tes séances, exercices et records. Nutrition : tes repas. Progression : tes courbes. Profil : ton niveau et tes amis." },
    { cible: ".ajout-rapide", titre: "Le bouton ＋",
      texte: "Sur toutes les pages : ajoute une séance, un repas, une pesée, un record, ou lance le chrono de repos." },
    { cible: ".reglages", titre: "Paramètres",
      texte: "Ton programme d’entraînement, tes infos (taille, date de naissance…), le thème et les notifications." },
    { cible: ".aide-page", titre: "Perdu ? Touche « ? »",
      texte: "Chaque page a son petit guide comme celui-ci. Il s’affiche la première fois, et ce bouton le relance quand tu veux." }
  ],
  "Activite.html": [
    { cible: ".sous-onglets", titre: "La rubrique Sport",
      texte: "Trois onglets : Séances (tes entraînements), Exercices (ta liste d’exercices) et Records (tes PR)." },
    { cible: "#btn-nouvelle", titre: "Commencer une séance",
      texte: "À la salle, touche ici. Choisis le type de séance, ajoute tes exercices, règle reps et kilos avec − / +, puis « ✓ Valider » à chaque série." },
    { titre: "Pendant la séance",
      texte: "Le chrono de repos démarre tout seul après chaque série validée. « Dernière fois » te rappelle ta perf précédente. Pas de réseau ? Tout est envoyé plus tard." },
    { cible: "#historique", titre: "Tes séances passées",
      texte: "Rangées par mois. Touche une séance pour revoir tous ses exercices et ses séries." }
  ],
  "Exercices.html": [
    { cible: "#liste", titre: "Tes exercices",
      texte: "La liste des exercices que tu peux choisir pendant une séance, rangés par muscle." },
    { cible: "#btn-nouvel-exo", titre: "Un exercice manque ?",
      texte: "Ajoute-le ici, avec une photo si tu veux. Il apparaîtra dans tes séances." }
  ],
  "Records.html": [
    { cible: "#btn-nouveau", titre: "Noter un record",
      texte: "Ton PR = la charge la plus lourde soulevée sur 1 répétition. Note-le ici après l’avoir réussi." },
    { cible: "#pr-grille", titre: "Tes meilleurs PR",
      texte: "Un PR « ✓ vérifié » colle avec tes séries récentes et te rapporte de l’XP. Les records battus en séance sont fêtés tout seuls." }
  ],
  "Nutrition.html": [
    { cible: ".bilan-jour", titre: "Ton bilan du jour",
      texte: "Le cercle montre les calories qu’il te reste. À droite : protéines, glucides et lipides mangés par rapport à ton objectif." },
    { cible: ".nav-jour", titre: "Changer de jour",
      texte: "Les flèches passent à la veille ou au lendemain. Touche « Aujourd’hui » pour revenir." },
    { cible: "#carte-eau", titre: "L’eau",
      texte: "Touche « + 1 verre » à chaque verre bu. La bouteille se remplit jusqu’à ton objectif." },
    { cible: ".journal", titre: "Tes repas",
      texte: "Touche ＋ à côté d’un moment pour ajouter un repas : choisis tes aliments ou scanne un paquet, tout est calculé. Touche un repas pour voir son détail." },
    { cible: "#besoins", titre: "Ton objectif",
      texte: "Sèche, maintien ou prise de masse : tes besoins en calories sont calculés ici. Plus bas, un guide explique les bases de la nutrition." }
  ],
  "Progression.html": [
    { cible: ".sous-onglets", titre: "Trois vues",
      texte: "Séances : ta régularité. Poids : ta courbe de poids et tes pesées. Exercices : l’évolution de tes charges, exercice par exercice." },
    { cible: "#zone-periode", titre: "La période",
      texte: "Choisis sur combien de mois afficher tes courbes." }
  ],
  "Profil.html": [
    { cible: "#hero-moi", titre: "Ton profil",
      texte: "Ton niveau et ton XP, tes abonnés et tes abonnements. Chaque séance et chaque record te font gagner de l’XP." },
    { cible: ".recherche", titre: "Trouver tes amis",
      texte: "Tape le pseudo d’un pote et suis-le : ses séances et ses records arriveront dans ton fil d’activité." },
    { cible: "#onglets-defis", titre: "Les défis",
      texte: "Semaine : des objectifs qui donnent de l’XP en plus. Mois : un classement entre amis, le premier devient champion 👑." },
    { cible: "#badges", titre: "Tes badges",
      texte: "Ils se débloquent en progressant. Ceux que tu as gagnés sont en premier." }
  ],
  "Parametres.html": [
    { cible: "#r-profil", titre: "Tes infos",
      texte: "Taille, poids, date de naissance… Elles servent à calculer tes besoins en nutrition." },
    { cible: "#r-programme", titre: "Ton programme",
      texte: "Choisis l’ordre de tes séances (Push / Pull / Leg…). L’appli te propose la suivante, même si tu sautes un jour." },
    { cible: "#r-notifs", titre: "Notifications",
      texte: "Rappels de séance, records de tes amis, encouragements : active ce que tu veux." }
  ]
};

const PAGE_VISITE = location.pathname.split("/").pop() || "Accueil.html";

function visiteDejaVue(page) {
  try { return !!localStorage.getItem(CLE_VISITE + (page || PAGE_VISITE)); } catch (e) { return true; }
}

// Utilisé par l'accueil (nouveaux comptes et comptes existants qui n'ont pas vu la nouvelle visite)
function tutorielDejaVu() {
  return visiteDejaVue("Accueil.html");
}

// Paramètres → Aide : tous les guides redeviennent « jamais vus », et on repart de l'accueil
function revoirTousLesGuides() {
  Object.keys(VISITES).forEach(function (p) {
    try { localStorage.removeItem(CLE_VISITE + p); } catch (e) {}
  });
  location.href = "Accueil.html#tutoriel";
}

/* ---------- Le moteur : projecteur + bulle ---------- */

let visiteEnCours = null;

function lancerVisite(options) {
  options = options || {};
  const etapes = (VISITES[PAGE_VISITE] || []).map(function (e) {
    return Object.assign({}, e, { titre: e.titre.replace("{prenom}", options.prenom ? ", " + options.prenom : "") });
  });
  if (!etapes.length || visiteEnCours) return;
  try { localStorage.setItem(CLE_VISITE + PAGE_VISITE, "1"); } catch (e) {}

  function creer(tag, classe, texte) {
    const n = document.createElement(tag);
    if (classe) n.className = classe;
    if (texte !== undefined) n.textContent = texte;
    return n;
  }

  // Les étapes dont l'élément n'est pas affiché (ex. pas encore de séance) sont sautées
  function visible(e) {
    if (!e.cible) return true;
    const n = document.querySelector(e.cible);
    return !!n && n.getClientRects().length > 0 && !n.closest("[hidden]");
  }
  const liste = etapes.filter(visible);
  if (!liste.length) return;

  const fond = creer("div", "visite");
  fond.setAttribute("role", "dialog");
  fond.setAttribute("aria-modal", "true");
  fond.setAttribute("aria-label", "Guide de la page");
  const spot = creer("div", "visite-spot");
  const bulle = creer("div", "visite-bulle");
  fond.appendChild(spot);
  fond.appendChild(bulle);
  document.body.appendChild(fond);
  document.body.classList.add("sans-defilement");
  visiteEnCours = fond;

  let i = 0;
  let cible = null;

  function fermer() {
    document.removeEventListener("keydown", clavier);
    window.removeEventListener("resize", placer);
    fond.remove();
    visiteEnCours = null;
    if (!document.querySelector(".dialogue-fond, .feuille-fond:not([hidden])")) {
      document.body.classList.remove("sans-defilement");
    }
  }

  function aller(n) {
    if (n < 0) return;
    if (n >= liste.length) return fermer();
    i = n;
    montrer();
  }

  // Place le projecteur sur l'élément et la bulle au-dessus ou en dessous, là où il y a de la place
  function placer() {
    const marge = 8;
    const hauteur = window.innerHeight;
    if (!cible) {
      spot.style.cssText = "top:50%;left:50%;width:0;height:0";
      bulle.className = "visite-bulle centre";
      bulle.style.top = "";
      return;
    }
    const r = cible.getBoundingClientRect();
    const haut = Math.max(4, r.top - marge);
    const bas = Math.min(hauteur - 4, r.bottom + marge);
    spot.style.cssText = "top:" + haut + "px;left:" + Math.max(4, r.left - marge) + "px;" +
      "width:" + (Math.min(window.innerWidth - 4, r.right + marge) - Math.max(4, r.left - marge)) + "px;" +
      "height:" + (bas - haut) + "px";

    const hBulle = bulle.offsetHeight;
    bulle.className = "visite-bulle";
    if (hauteur - bas >= hBulle + 16) {
      bulle.style.top = (bas + 12) + "px";
      bulle.classList.add("dessous");
    } else if (haut >= hBulle + 16) {
      bulle.style.top = (haut - hBulle - 12) + "px";
      bulle.classList.add("dessus");
    } else {
      // Élément très grand : la bulle se pose en bas de l'écran, par-dessus
      bulle.style.top = (hauteur - hBulle - 16) + "px";
    }
  }

  function montrer() {
    const e = liste[i];
    const derniere = i === liste.length - 1;
    cible = e.cible ? document.querySelector(e.cible) : null;

    bulle.innerHTML = "";
    const tete = creer("div", "visite-tete");
    tete.appendChild(creer("span", "visite-compteur", (i + 1) + " / " + liste.length));
    if (!derniere) {
      const passer = creer("button", "visite-passer", "Passer");
      passer.type = "button";
      passer.addEventListener("click", fermer);
      tete.appendChild(passer);
    }
    bulle.appendChild(tete);
    bulle.appendChild(creer("h3", "", e.titre));
    bulle.appendChild(creer("p", "", e.texte));

    const boutons = creer("div", "visite-boutons");
    if (i > 0) {
      const avant = creer("button", "btn secondaire", "‹");
      avant.type = "button";
      avant.setAttribute("aria-label", "Étape précédente");
      avant.addEventListener("click", function () { aller(i - 1); });
      boutons.appendChild(avant);
    }
    const suivant = creer("button", "btn", derniere ? "C’est compris 👍" : "Suivant");
    suivant.type = "button";
    suivant.addEventListener("click", function () { aller(i + 1); });
    boutons.appendChild(suivant);
    bulle.appendChild(boutons);

    // Fait défiler jusqu'à l'élément (sauf s'il est fixé à l'écran), puis place le projecteur
    if (cible && getComputedStyle(cible).position !== "fixed" && !cible.closest(".barre-bas, .bandeau")) {
      document.body.classList.remove("sans-defilement");
      cible.scrollIntoView({ block: "center" });
      document.body.classList.add("sans-defilement");
    }
    requestAnimationFrame(function () {
      placer();
      suivant.focus({ preventScroll: true });
    });
  }

  function clavier(e) {
    if (e.key === "Escape") fermer();
    else if (e.key === "ArrowRight") aller(i + 1);
    else if (e.key === "ArrowLeft") aller(i - 1);
  }
  document.addEventListener("keydown", clavier);
  window.addEventListener("resize", placer);

  // Glisser à gauche / à droite pour changer d'étape
  let departX = null;
  fond.addEventListener("touchstart", function (e) { departX = e.touches[0].clientX; }, { passive: true });
  fond.addEventListener("touchend", function (e) {
    if (departX === null) return;
    const dx = e.changedTouches[0].clientX - departX;
    departX = null;
    if (dx < -50) aller(i + 1);
    else if (dx > 50) aller(i - 1);
  }, { passive: true });

  montrer();
}

// Ancien nom, gardé pour l'accueil
function lancerTutoriel(prenom) {
  lancerVisite({ prenom: prenom });
}

/* ---------- Bouton « ? » et lancement automatique ---------- */

(function () {
  function preparer() {
    if (!VISITES[PAGE_VISITE]) return;

    // Le « ? » se glisse dans le bandeau, à gauche de Paramètres
    const bandeau = document.getElementById("entete");
    if (bandeau && !bandeau.querySelector(".aide-page")) {
      const aide = document.createElement("button");
      aide.type = "button";
      aide.className = "aide-page";
      aide.textContent = "?";
      aide.setAttribute("aria-label", "Comment marche cette page ?");
      aide.addEventListener("click", function () { lancerVisite(); });
      const reglages = bandeau.querySelector(".reglages");
      bandeau.insertBefore(aide, reglages);
    }

    // L'accueil lance sa visite lui-même (avec le prénom) ; les autres pages, la première fois
    if (PAGE_VISITE === "Accueil.html" || visiteDejaVue()) return;
    // On attend que la page ait chargé ses données (les éléments à éclairer)
    setTimeout(function () {
      if (!document.querySelector(".dialogue-fond, .recap-fond:not([hidden]), .feuille-fond:not([hidden]), .scan-fond:not([hidden])")) {
        lancerVisite();
      }
    }, 1200);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", preparer);
  else preparer();
})();
