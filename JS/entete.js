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
      '<rect x="11" y="7" width="3" height="13"/><rect x="16" y="3" width="3" height="17"/>',
    profil:
      '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'
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
      pages: ["Progression.html"] },
    { nom: "Profil", lien: "Profil.html", icone: ICONES.profil,
      pages: ["Profil.html"] }
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
    creerAjoutRapide();
    activerRetourGlisse();
  }


  /* ---------- Bouton ＋ : ajout rapide depuis n'importe quelle page ---------- */
  const ACTIONS = [
    ["🏋️", "Séance", "Activite.html#nouvelle"],
    ["🥗", "Repas", "Nutrition.html#ajout"],
    ["⚖️", "Pesée", null],
    ["🏆", "PR", "Records.html#nouveau"]
  ];

  function aller(cible) {
    const morceaux = cible.split("#");
    if (morceaux[0] === page) {
      // Déjà sur la bonne page : on relance l'action sans recharger
      history.replaceState(null, "", "#" + morceaux[1]);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    } else {
      location.href = cible;
    }
  }

  function creerAjoutRapide() {
    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.className = "ajout-rapide";
    bouton.setAttribute("aria-label", "Ajouter une séance, un repas, une pesée ou un PR");
    bouton.setAttribute("aria-expanded", "false");
    bouton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';

    const fond = document.createElement("div");
    fond.className = "ajout-fond";
    fond.hidden = true;
    const menu = document.createElement("div");
    menu.className = "ajout-menu";
    menu.setAttribute("role", "dialog");
    menu.setAttribute("aria-label", "Ajout rapide");
    menu.innerHTML = '<div class="ajout-titre">Ajouter</div><div class="ajout-grille"></div>' +
      '<div class="ajout-pesee" hidden>' +
        '<label for="ajout-poids">Ton poids aujourd’hui</label>' +
        '<div class="ajout-pesee-ligne">' +
          '<div class="champ-unite"><input id="ajout-poids" type="text" autocomplete="off" inputmode="decimal"><span>kg</span></div>' +
          '<button type="button" class="btn" id="ajout-poids-ok">Enregistrer</button>' +
        '</div>' +
      '</div>' +
      '<div class="ajout-chrono">' +
        '<div class="ajout-chrono-titre">⏱️ Chrono de repos</div>' +
        '<div class="chips" id="ajout-chrono-durees"></div>' +
      '</div>';
    fond.appendChild(menu);

    function fermer() {
      fond.hidden = true;
      bouton.setAttribute("aria-expanded", "false");
      bouton.classList.remove("ouvert");
    }
    function ouvrir() {
      fond.hidden = false;
      menu.querySelector(".ajout-pesee").hidden = true;
      afficherDurees();
      bouton.setAttribute("aria-expanded", "true");
      bouton.classList.add("ouvert");
    }
    bouton.addEventListener("click", function () { if (fond.hidden) ouvrir(); else fermer(); });
    fond.addEventListener("click", function (e) { if (e.target === fond) fermer(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !fond.hidden) fermer(); });

    const grille = menu.querySelector(".ajout-grille");
    ACTIONS.forEach(function (a) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ajout-action";
      b.innerHTML = '<span class="ajout-emoji" aria-hidden="true">' + a[0] + '</span><span>' + a[1] + '</span>';
      b.addEventListener("click", function () {
        if (a[2]) {
          fermer();
          aller(a[2]);
        } else {
          // Pesée : directement ici, sans changer de page
          menu.querySelector(".ajout-pesee").hidden = false;
          menu.querySelector("#ajout-poids").focus();
        }
      });
      grille.appendChild(b);
    });

    // Chrono : une durée = le chrono démarre tout de suite (et devient ta durée habituelle)
    function afficherDurees() {
      const zone = menu.querySelector("#ajout-chrono-durees");
      zone.innerHTML = "";
      if (!window.chronoSportApp) return;
      const habituelle = window.chronoSportApp.dureeHabituelle();
      [45, 60, 90, 120, 180].forEach(function (s) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "chip";
        b.textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
        b.setAttribute("aria-pressed", String(s === habituelle));
        b.addEventListener("click", function () {
          window.chronoSportApp.choisirDuree(s);
          window.chronoSportApp.demarrer(s);
          fermer();
        });
        zone.appendChild(b);
      });
    }

    menu.querySelector("#ajout-poids-ok").addEventListener("click", async function () {
      const champ = menu.querySelector("#ajout-poids");
      const valeur = parseFloat(champ.value.replace(",", "."));
      if (!(valeur > 0) || typeof ajouterPoids !== "function") return champ.focus();
      this.disabled = true;
      try {
        await ajouterPoids(valeur);
        champ.value = "";
        fermer();
        if (typeof confirmer === "function") confirmer("Pesée enregistrée : " + String(valeur).replace(".", ",") + " kg");
        window.dispatchEvent(new Event("pesee-ajoutee"));
      } catch (e) {
        if (typeof informer === "function") informer("Erreur : " + e.message);
      } finally {
        this.disabled = false;
      }
    });
    menu.querySelector("#ajout-poids").addEventListener("keydown", function (e) {
      if (e.key === "Enter") menu.querySelector("#ajout-poids-ok").click();
    });

    document.body.appendChild(fond);
    document.body.appendChild(bouton);
  }

  /* ---------- Glisser depuis le bord gauche pour revenir en arrière (vues internes) ---------- */
  function activerRetourGlisse() {
    let depart = null;
    document.addEventListener("touchstart", function (e) {
      const t = e.touches[0];
      depart = t.clientX < 24 ? { x: t.clientX, y: t.clientY } : null;
    }, { passive: true });
    document.addEventListener("touchend", function (e) {
      if (!depart) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - depart.x, dy = Math.abs(t.clientY - depart.y);
      depart = null;
      if (dx < 80 || dy > 60) return;
      // Seulement s'il y a un lien « ‹ Retour » visible sur la vue
      const retour = Array.prototype.find.call(document.querySelectorAll(".retour"), function (r) { return r.offsetParent !== null; });
      if (retour) retour.click();
    }, { passive: true });
  }

  // La barre est ajoutée une fois la page chargée (à la fin du document)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", creerBarre);
  } else {
    creerBarre();
  }
})();