// Bandeau commun à toutes les pages : logo (retour à l'accueil) et accès aux Paramètres
(function () {
  const zone = document.getElementById("entete");
  if (!zone) return;

  const page = location.pathname.split("/").pop();
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
})();