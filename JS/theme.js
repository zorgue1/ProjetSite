// Thème : automatique, clair ou sombre (choix mémorisé sur cet appareil)
// En automatique, on suit le réglage du téléphone, même s'il change pendant que l'appli est ouverte.
(function () {
  const CLE = "sportapp:theme";
  const modeClair = window.matchMedia("(prefers-color-scheme: light)");

  function lire() {
    try { return localStorage.getItem(CLE) || "auto"; } catch (e) { return "auto"; }
  }

  function appliquer(choix) {
    const clair = choix === "clair" || (choix === "auto" && modeClair.matches);
    document.documentElement.setAttribute("data-theme", clair ? "light" : "dark");

    // Couleur de la barre du téléphone
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", clair ? "#fbf7f3" : "#090d13");
  }

  modeClair.addEventListener("change", function () {
    if (lire() === "auto") appliquer("auto");
  });

  window.themeSportApp = {
    lire: lire,
    choisir: function (choix) {
      try { localStorage.setItem(CLE, choix); } catch (e) {}
      appliquer(choix);
    }
  };

  appliquer(lire());
})();
