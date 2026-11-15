// Navigation commune à toutes les pages :
// bandeau du haut (logo + Paramètres) et barre du bas (onglets principaux)
(function () {
  const page = location.pathname.split("/").pop();

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

  /* ---------- Barre du bas ---------- */
  const ONGLETS = [
    ["Accueil.html", "Accueil",
      '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>'],
    ["Activite.html", "Activité",
      '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9z"/>' +
      '<line x1="8.5" y1="12" x2="15.5" y2="12"/><line x1="8.5" y1="16" x2="13" y2="16"/>'],
    ["Exercices.html", "Exercices",
      '<rect x="2" y="9" width="3" height="6" rx="1"/><rect x="5" y="6" width="3" height="12" rx="1"/>' +
      '<line x1="8" y1="12" x2="16" y2="12"/><rect x="16" y="6" width="3" height="12" rx="1"/>' +
      '<rect x="19" y="9" width="3" height="6" rx="1"/>'],
    ["Rapport.html", "Rapport",
      '<line x1="4" y1="20" x2="20" y2="20"/><rect x="6" y="12" width="3" height="8"/>' +
      '<rect x="11" y="7" width="3" height="13"/><rect x="16" y="3" width="3" height="17"/>'],
    ["Nutrition.html", "Nutrition",
      '<path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M9 7c0-1.500 1.200-1.500 1.200-3"/>' +
      '<path d="M14 7c0-1.500 1.200-1.500 1.200-3"/>']
  ];

  function creerBarre() {
    const barre = document.createElement("nav");
    barre.className = "barre-bas";
    barre.setAttribute("aria-label", "Navigation principale");
    barre.innerHTML = ONGLETS.map(function (o) {
      return '<a href="' + o[0] + '"' + (o[0] === page ? ' aria-current="page"' : "") + '>' +
        '<svg viewBox="0 0 24 24" aria-hidden="true">' + o[2] + '</svg>' +
        '<span>' + o[1] + '</span></a>';
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