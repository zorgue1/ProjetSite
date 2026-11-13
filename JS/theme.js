// Thème : automatique, clair ou sombre (choix mémorisé sur cet appareil)
(function () {
  const CLE = "sportapp:theme";

  function lire() {
    try { return localStorage.getItem(CLE) || "auto"; } catch (e) { return "auto"; }
  }

  function appliquer(choix) {
    const racine = document.documentElement;
    if (choix === "clair") racine.setAttribute("data-theme", "light");
    else if (choix === "sombre") racine.setAttribute("data-theme", "dark");
    else racine.removeAttribute("data-theme");

    // Couleur de la barre du téléphone
    const clair = choix === "clair" ||
      (choix === "auto" && window.matchMedia("(prefers-color-scheme: light)").matches);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", clair ? "#f4f2ee" : "#090d13");
  }

  window.themeSportApp = {
    lire: lire,
    choisir: function (choix) {
      try { localStorage.setItem(CLE, choix); } catch (e) {}
      appliquer(choix);
    }
  };

  appliquer(lire());
})();