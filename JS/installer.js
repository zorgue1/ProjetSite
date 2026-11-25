// Guide d'installation de SportApp sur le téléphone (iPhone / Android), pas à pas.
// Autonome (pas besoin de donnees.js) : utilisable sur la page d'accueil publique comme dans l'appli.
// ouvrirGuideInstallation() ouvre le guide ; appliInstallee() dit si on est déjà dans l'appli installée.

const ADRESSE_APPLI = "https://zorgue1.github.io/ProjetSite/";

let invitationNavigateur = null;     // Chrome / Edge Android : installation en un geste
window.addEventListener("beforeinstallprompt", function (e) {
  e.preventDefault();
  invitationNavigateur = e;
});

function appliInstallee() {
  return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
}

// Quel téléphone, quel navigateur ?
function appareil() {
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  return {
    ios: ios,
    android: /android/i.test(ua),
    // Navigateurs intégrés aux applis (Insta, Snap, TikTok, Facebook…) : impossible d'installer depuis eux
    integre: /instagram|fban|fbav|fb_iab|snapchat|tiktok|bytedance|musical_ly|linkedinapp|twitter|line\//i.test(ua),
    chromeIos: /crios/i.test(ua),
    samsung: /samsungbrowser/i.test(ua),
    firefox: /firefox|fxios/i.test(ua)
  };
}

/* ---------- Icônes dessinées comme celles du téléphone ---------- */
const ICONES_INSTALL = {
  partager: '<svg viewBox="0 0 24 24"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5"/><path d="M8 10H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-2"/></svg>',
  ajouter: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8.5v7M8.5 12h7"/></svg>',
  points: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>',
  pointsH: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>',
  menu: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  telephone: '<svg viewBox="0 0 24 24"><rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M10.5 18.5h3"/></svg>'
};

// [icône, texte] ; le texte peut contenir <b> (texte fixe, jamais de données venant de l'extérieur)
const ETAPES_INSTALL = {
  iphone: [
    ["partager", "Dans <b>Safari</b>, touche le bouton <b>Partager</b> en bas de l’écran. <span>Sur les iPhone récents, il est dans le menu <b>⋯</b> en bas à droite.</span>"],
    ["ajouter", "Fais défiler et touche <b>« Sur l’écran d’accueil »</b>. <span>Tu ne le vois pas ? Touche <b>« Plus »</b> ou <b>« Modifier les actions »</b> tout en bas.</span>"],
    ["ajouter", "Laisse <b>« Ouvrir comme app web »</b> activé, puis touche <b>« Ajouter »</b> en haut à droite."],
    ["telephone", "C’est fait ! Ouvre maintenant SportApp avec <b>son icône</b> sur ton écran d’accueil, plus besoin de Safari."]
  ],
  android: [
    ["points", "Dans <b>Chrome</b>, touche le menu <b>⋮</b> en haut à droite."],
    ["ajouter", "Touche <b>« Installer l’application »</b> <span>Ou « Ajouter à l’écran d’accueil », selon ton téléphone.</span>"],
    ["ajouter", "Confirme avec <b>« Installer »</b>."],
    ["telephone", "C’est fait ! Ouvre SportApp avec <b>son icône</b>, comme une vraie appli."]
  ],
  samsung: [
    ["menu", "Dans <b>Samsung Internet</b>, touche le menu <b>≡</b> en bas à droite."],
    ["ajouter", "Touche <b>« Ajouter la page à »</b> puis <b>« Écran d’accueil »</b>."],
    ["telephone", "C’est fait ! Ouvre SportApp avec <b>son icône</b>."]
  ]
};

function ouvrirGuideInstallation() {
  if (document.querySelector(".installation-fond")) return;
  const a = appareil();

  function creer(tag, classe, html) {
    const n = document.createElement(tag);
    if (classe) n.className = classe;
    if (html !== undefined) n.innerHTML = html;
    return n;
  }

  const fond = creer("div", "installation-fond");
  const carte = creer("div", "installation");
  carte.setAttribute("role", "dialog");
  carte.setAttribute("aria-modal", "true");
  carte.setAttribute("aria-labelledby", "installation-titre");
  fond.appendChild(carte);

  function fermer() {
    document.removeEventListener("keydown", clavier);
    fond.remove();
    document.body.classList.remove("sans-defilement");
  }
  function clavier(e) { if (e.key === "Escape") fermer(); }

  const tete = creer("div", "installation-tete");
  tete.appendChild(creer("img", "installation-icone"));
  tete.firstChild.src = (location.pathname.indexOf("/HTML/") !== -1 ? "../" : "") + "Image/icon-192.png";
  tete.firstChild.alt = "";
  const titres = creer("div", "");
  titres.appendChild(creer("h2", "", "Installer SportApp"));
  titres.firstChild.id = "installation-titre";
  titres.appendChild(creer("p", "mut", "Une icône sur ton écran, en plein écran, avec les notifications. Gratuit, 30 secondes."));
  tete.appendChild(titres);
  const croix = creer("button", "installation-fermer", "✕");
  croix.type = "button";
  croix.setAttribute("aria-label", "Fermer");
  croix.addEventListener("click", fermer);
  tete.appendChild(croix);
  carte.appendChild(tete);

  const corps = creer("div", "installation-corps");
  carte.appendChild(corps);

  // Déjà installée et ouverte depuis l'icône
  if (appliInstallee()) {
    corps.appendChild(creer("p", "installation-ok", "✅ SportApp est déjà installée : tu l’utilises en ce moment depuis son icône."));
  } else {
    // Ouvert depuis Insta, Snap… : il faut d'abord passer dans le vrai navigateur
    if (a.integre) {
      const alerte = creer("div", "installation-alerte",
        "<strong>⚠️ Tu es dans le navigateur d’une appli (Insta, Snap…)</strong>" +
        "<span>On ne peut pas installer depuis ici. Touche <b>⋯</b> ou <b>⋮</b> en haut de l’écran puis <b>« Ouvrir dans " +
        (a.ios ? "Safari" : "Chrome") + " »</b>, ou copie le lien et colle-le dans " + (a.ios ? "Safari" : "Chrome") + ".</span>");
      const copier = creer("button", "btn secondaire", "Copier le lien");
      copier.type = "button";
      copier.addEventListener("click", function () {
        const fait = function () { copier.textContent = "Lien copié ✓"; };
        if (navigator.clipboard) navigator.clipboard.writeText(ADRESSE_APPLI).then(fait, function () {});
      });
      alerte.appendChild(copier);
      corps.appendChild(alerte);
    }

    // Chrome Android : un seul bouton suffit
    if (invitationNavigateur) {
      const direct = creer("button", "btn installation-direct", "📲 Installer maintenant");
      direct.type = "button";
      direct.addEventListener("click", async function () {
        invitationNavigateur.prompt();
        const choix = await invitationNavigateur.userChoice;
        invitationNavigateur = null;
        if (choix.outcome === "accepted") fermer();
        else direct.remove();
      });
      corps.appendChild(direct);
      corps.appendChild(creer("p", "mut petit installation-ou", "Ou à la main :"));
    }

    // Onglets iPhone / Android, celui du téléphone choisi d'office
    const onglets = creer("div", "onglets installation-onglets");
    onglets.setAttribute("role", "group");
    onglets.setAttribute("aria-label", "Ton téléphone");
    const liste = creer("ol", "installation-etapes");
    const noteNavigateur = creer("p", "mut petit installation-note");
    let choix = a.ios ? "iphone" : a.samsung ? "samsung" : "android";

    function afficherEtapes() {
      onglets.querySelectorAll(".onglet").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.dataset.os === (choix === "samsung" ? "android" : choix)));
      });
      liste.innerHTML = "";
      ETAPES_INSTALL[choix].forEach(function (e, n) {
        const li = creer("li", "");
        li.appendChild(creer("span", "installation-numero", String(n + 1)));
        li.appendChild(creer("span", "installation-pictogramme", ICONES_INSTALL[e[0]]));
        li.appendChild(creer("span", "installation-texte", e[1]));
        liste.appendChild(li);
      });
      noteNavigateur.innerHTML =
        choix === "iphone"
          ? (a.chromeIos ? "Tu es dans Chrome : le bouton Partager est en haut à droite, dans la barre d’adresse. Le reste est pareil. " : "") +
            "Sur iPhone, les notifications ne marchent qu’une fois l’appli installée."
          : choix === "samsung"
            ? "Tu as Chrome ? <button type=\"button\" class=\"lien-bouton\" data-os=\"android\">Voir les étapes pour Chrome</button>"
            : "Téléphone Samsung avec Samsung Internet ? <button type=\"button\" class=\"lien-bouton\" data-os=\"samsung\">Voir ces étapes</button>";
      const lien = noteNavigateur.querySelector(".lien-bouton");
      if (lien) lien.addEventListener("click", function () { choix = lien.dataset.os; afficherEtapes(); });
    }

    [["iphone", "📱 iPhone"], ["android", "🤖 Android"]].forEach(function (o) {
      const b = creer("button", "onglet", o[1]);
      b.type = "button";
      b.dataset.os = o[0];
      b.addEventListener("click", function () { choix = o[0]; afficherEtapes(); });
      onglets.appendChild(b);
    });
    corps.appendChild(onglets);
    corps.appendChild(liste);
    corps.appendChild(noteNavigateur);
    afficherEtapes();

    // Sur ordinateur : l'adresse à ouvrir sur le téléphone
    if (!a.ios && !a.android) {
      corps.appendChild(creer("p", "installation-ordi",
        "💻 Tu es sur ordinateur : ouvre <b>zorgue1.github.io/ProjetSite</b> sur ton téléphone, puis suis ces étapes."));
    }
  }

  const ok = creer("button", "btn secondaire installation-compris", "J’ai compris");
  ok.type = "button";
  ok.addEventListener("click", fermer);
  carte.appendChild(ok);

  fond.addEventListener("click", function (e) { if (e.target === fond) fermer(); });
  document.addEventListener("keydown", clavier);
  document.body.appendChild(fond);
  document.body.classList.add("sans-defilement");
  croix.focus();
}
