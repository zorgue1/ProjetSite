// Bouton « œil » dans chaque champ de mot de passe : affiche / masque ce qu'on tape.
// Il suffit d'inclure ce fichier : tous les <input type="password"> de la page en reçoivent un.
(function () {
  const OUVERT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  const FERME = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.9 9.9 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';

  function equiper(champ) {
    if (champ.dataset.oeil) return;
    champ.dataset.oeil = "1";
    const zone = document.createElement("div");
    zone.className = "champ-mdp";
    champ.parentNode.insertBefore(zone, champ);
    zone.appendChild(champ);

    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.className = "oeil";
    function maj() {
      const visible = champ.type === "text";
      bouton.innerHTML = visible ? FERME : OUVERT;
      bouton.setAttribute("aria-label", visible ? "Masquer le mot de passe" : "Afficher le mot de passe");
      bouton.setAttribute("aria-pressed", String(visible));
    }
    // pointerdown : le champ garde le focus (le clavier reste ouvert sur téléphone)
    bouton.addEventListener("pointerdown", function (e) { e.preventDefault(); });
    bouton.addEventListener("click", function () {
      champ.type = champ.type === "password" ? "text" : "password";
      maj();
    });
    maj();
    zone.appendChild(bouton);
  }

  function tout() {
    document.querySelectorAll('input[type="password"]').forEach(equiper);
  }
  // Par sécurité, le mot de passe est remasqué quand on quitte la page
  window.addEventListener("pagehide", function () {
    document.querySelectorAll('.champ-mdp input').forEach(function (c) { c.type = "password"; });
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tout);
  else tout();
})();
