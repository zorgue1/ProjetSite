// Navigation commune à toutes les pages :
// bandeau du haut (logo + Paramètres), sous-onglets de la section et barre du bas
(function () {
  const page = location.pathname.split("/").pop();

  /* ---------- Icônes ---------- */
  const ICONES = {
    accueil:
      '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    sport:
      '<rect x="2" y="9" width="3" height="6" rx="1"/><rect x="5" y="6" width="3" height="12" rx="1"/>' +
      '<line x1="8" y1="12" x2="16" y2="12"/><rect x="16" y="6" width="3" height="12" rx="1"/>' +
      '<rect x="19" y="9" width="3" height="6" rx="1"/>',
    nutrition:
      '<path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M9 7c0-1.500 1.200-1.500 1.200-3"/>' +
      '<path d="M14 7c0-1.500 1.200-1.500 1.200-3"/>',
    progression:
      '<line x1="4" y1="20" x2="20" y2="20"/><rect x="6" y="12" width="3" height="8"/>' +
      '<rect x="11" y="7" width="3" height="13"/><rect x="16" y="3" width="3" height="17"/>'
  };

  /* ---------- Sections de la barre du bas ---------- */
  // « lien » : page ouverte par le bouton ; « pages » : fichiers qui appartiennent à la section
  const SECTIONS = [
    { nom: "Accueil", lien: "Accueil.html", icone: ICONES.accueil,
      pages: ["Accueil.html"] },
    { nom: "Sport", lien: "Activite.html", icone: ICONES.sport,
      pages: ["Activite.html", "Exercices.html", "Records.html"] },
    { nom: "Nutrition", lien: "Nutrition.html", icone: ICONES.nutrition,
      pages: ["Nutrition.html"] },
    { nom: "Progression", lien: "Progression.html", icone: ICONES.progression,
      pages: ["Progression.html"] }
  ];

  /* ---------- Sous-onglets de chaque section ---------- */
  // Une adresse avec # change de vue dans la même page (ex. Progression.html#poids)
  const SOUS_ONGLETS = {
    "Sport": [
      ["Activite.html", "Séances"],
      ["Exercices.html", "Exercices"],
      ["Records.html", "Records"]
    ],
    "Progression": [
      ["Progression.html#seances", "Séances"],
      ["Progression.html#poids", "Poids"],
      ["Progression.html#exercices", "Exercices"]
    ]
  };

  const section = SECTIONS.find(function (s) { return s.pages.indexOf(page) !== -1; });

  /* ---------- Bandeau du haut ---------- */
  const zone = document.getElementById("entete");
  if (zone) {
    const courant = page === "Parametres.html" ? ' aria-current="page"' : "";
    zone.innerHTML =
      '<a class="marque" href="Accueil.html" aria-label="SportApp : retour à l’accueil">' +
        '<svg viewBox="0 0 64 64" aria-hidden="true">' +
          '<rect x="4" y="24" width="6" height="16" rx="2"/>' +
          '<rect x="11" y="18" width="7" height="28" rx="2"/>' +
          '<rect x="18" y="29" width="28" height="6" rx="2"/>' +
          '<rect x="46" y="18" width="7" height="28" rx="2"/>' +
          '<rect x="54" y="24" width="6" height="16" rx="2"/>' +
        '</svg>' +
        '<span>SportApp</span>' +
      '</a>' +
      '<a class="reglages" href="Parametres.html"' + courant + '>' +
        '<svg viewBox="0 0 24 24" aria-hidden="true">' +
          '<line x1="4" y1="6" x2="20" y2="6"/><circle cx="9" cy="6" r="2" fill="currentColor"/>' +
          '<line x1="4" y1="12" x2="20" y2="12"/><circle cx="15" cy="12" r="2" fill="currentColor"/>' +
          '<line x1="4" y1="18" x2="20" y2="18"/><circle cx="8" cy="18" r="2" fill="currentColor"/>' +
        '</svg>' +
        '<span>Paramètres</span>' +
      '</a>';
  }

  /* ---------- Sous-onglets (sous le bandeau) ---------- */
  function majSousOnglets() {
    const liens = document.querySelectorAll(".sous-onglets a");
    const hash = location.hash.slice(1);
    const vues = Array.prototype.map.call(liens, function (l) {
      return l.getAttribute("href").split("#")[1];
    }).filter(Boolean);
    const vueCourante = vues.indexOf(hash) !== -1 ? hash : vues[0];

    liens.forEach(function (l) {
      const morceaux = l.getAttribute("href").split("#");
      const actif = morceaux[0] === page && (!morceaux[1] || morceaux[1] === vueCourante);
      if (actif) l.setAttribute("aria-current", "page");
      else l.removeAttribute("aria-current");
    });
  }

  const sous = section && SOUS_ONGLETS[section.nom];
  if (sous && zone) {
    const nav = document.createElement("nav");
    nav.className = "sous-onglets";
    nav.setAttribute("aria-label", "Sous-menu " + section.nom);
    nav.innerHTML = '<div class="sous-onglets-piste">' +
      sous.map(function (o) { return '<a href="' + o[0] + '">' + o[1] + '</a>'; }).join("") +
      '</div>';
    zone.insertAdjacentElement("afterend", nav);
    majSousOnglets();
    window.addEventListener("hashchange", majSousOnglets);
  }

  /* ---------- Barre du bas ---------- */
  function creerBarre() {
    const barre = document.createElement("nav");
    barre.className = "barre-bas";
    barre.setAttribute("aria-label", "Navigation principale");
    barre.innerHTML = SECTIONS.map(function (s) {
      const actif = section && s.nom === section.nom;
      return '<a href="' + s.lien + '"' + (actif ? ' aria-current="page"' : "") + '>' +
        '<svg viewBox="0 0 24 24" aria-hidden="true">' + s.icone + '</svg>' +
        '<span>' + s.nom + '</span></a>';
    }).join("");
    document.body.appendChild(barre);
    document.body.classList.add("avec-barre");
  }

  // La barre est ajoutée une fois la page chargée (à la fin du document)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", creerBarre);
  } else {
    creerBarre();
  }
})();