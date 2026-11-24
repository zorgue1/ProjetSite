// Chrono de repos, commun à toute l'appli
// - lancé tout seul après chaque série validée (page Séances), ou depuis le bouton ＋ sur n'importe quelle page ;
// - l'heure de fin est gardée sur l'appareil : il continue si tu changes de page ;
// - anneau qui se vide, compte à rebours 3-2-1 avec bips, puis alarme forte et vibration à la fin.
(function () {
  const CLE = "sportapp:chrono";            // { fin: heure de fin (ms), total: durée (s) }
  const CLE_DUREE = "sportapp:repos";       // durée habituelle (s)
  const RAYON = 26;
  const TOUR = 2 * Math.PI * RAYON;

  let etat = null;
  let minuteur = null;
  let dernierBip = null;
  let son = null;
  let sortieSon = null;
  let zone = null;

  function lire(cle, defaut) {
    try { return JSON.parse(localStorage.getItem(cle)) || defaut; } catch (e) { return defaut; }
  }
  function ecrire(cle, valeur) {
    try { localStorage.setItem(cle, JSON.stringify(valeur)); } catch (e) {}
  }
  function vibrer(motif) {
    try { if (navigator.vibrate) navigator.vibrate(motif); } catch (e) {}
  }
  function dureeHabituelle() {
    return lire(CLE_DUREE, 90);
  }
  function texteDuree(s) {
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }

  /* ---------- Son ---------- */

  // Les navigateurs n'autorisent le son qu'après un geste : on le prépare au premier toucher
  function preparerSon() {
    try {
      if (!son) {
        son = new (window.AudioContext || window.webkitAudioContext)();
        // Compresseur : permet un son fort sans grésillement
        sortieSon = son.createDynamicsCompressor();
        sortieSon.connect(son.destination);
      }
      if (son.state === "suspended") son.resume();
    } catch (e) {}
  }
  document.addEventListener("pointerdown", preparerSon, { passive: true });

  function note(frequence, debut, duree, volume, forme) {
    if (!son) return;
    const t = son.currentTime + debut;
    const o = son.createOscillator();
    const g = son.createGain();
    o.type = forme || "sine";
    o.frequency.value = frequence;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(volume, t + 0.01);
    g.gain.setValueAtTime(volume, t + duree - 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    o.connect(g).connect(sortieSon);
    o.start(t);
    o.stop(t + duree + 0.02);
  }

  // Petit « tic » pour 3, 2, 1
  function tic(dernier) {
    note(dernier ? 988 : 784, 0, 0.12, 0.6, "triangle");
  }

  // Alarme de fin : trois doubles bips forts, puis une note longue
  function alarme() {
    [0, 0.4, 0.8].forEach(function (d) {
      note(1047, d, 0.15, 1, "square");
      note(1319, d + 0.17, 0.15, 1, "square");
    });
    note(1568, 1.25, 0.7, 1, "square");
  }

  /* ---------- Affichage ---------- */

  function construire() {
    if (zone) return zone;
    zone = document.createElement("div");
    zone.className = "chrono";
    zone.hidden = true;
    zone.setAttribute("role", "timer");
    zone.innerHTML =
      '<div class="chrono-anneau">' +
        '<svg viewBox="0 0 64 64" aria-hidden="true">' +
          '<circle class="chrono-fond" cx="32" cy="32" r="' + RAYON + '"/>' +
          '<circle class="chrono-plein" cx="32" cy="32" r="' + RAYON + '" stroke-dasharray="' + TOUR + '"/>' +
        '</svg>' +
        '<span class="chrono-emoji" aria-hidden="true">⏱️</span>' +
      '</div>' +
      '<div class="chrono-texte">' +
        '<span class="chrono-titre">Repos</span>' +
        '<strong class="chrono-temps">1:30</strong>' +
      '</div>' +
      '<button type="button" class="chrono-btn" data-ajout="-15" aria-label="Retirer 15 secondes">−15</button>' +
      '<button type="button" class="chrono-btn" data-ajout="15" aria-label="Ajouter 15 secondes">+15</button>' +
      '<button type="button" class="chrono-btn passer">Passer</button>';
    zone.querySelectorAll("[data-ajout]").forEach(function (b) {
      b.addEventListener("click", function () { ajuster(parseInt(b.dataset.ajout, 10)); });
    });
    zone.querySelector(".passer").addEventListener("click", arreter);
    document.body.appendChild(zone);
    return zone;
  }

  function maj() {
    if (!etat) return;
    const resteMs = Math.max(0, etat.fin - Date.now());
    const reste = Math.ceil(resteMs / 1000);
    zone.querySelector(".chrono-temps").textContent = texteDuree(reste);
    // L'anneau se vide au fil du repos
    zone.querySelector(".chrono-plein").style.strokeDashoffset = TOUR * (1 - resteMs / (etat.total * 1000));
    zone.classList.toggle("bientot", reste <= 5 && reste > 0);

    // 3, 2, 1 : un tic par seconde
    if (reste <= 3 && reste > 0 && dernierBip !== reste) {
      dernierBip = reste;
      tic(reste === 1);
      vibrer(25);
    }
    if (resteMs === 0) terminer();
  }

  function afficher() {
    construire();
    zone.hidden = false;
    zone.classList.remove("fini", "bientot");
    zone.querySelector(".chrono-titre").textContent = "Repos";
    zone.querySelector(".chrono-emoji").textContent = "⏱️";
    zone.querySelector(".passer").textContent = "Passer";
    document.body.classList.add("avec-chrono");
    dernierBip = null;
    clearInterval(minuteur);
    maj();
    minuteur = setInterval(maj, 200);
  }

  function terminer() {
    clearInterval(minuteur);
    etat = null;
    ecrire(CLE, null);
    zone.classList.remove("bientot");
    zone.classList.add("fini");
    zone.querySelector(".chrono-titre").textContent = "C’est reparti !";
    zone.querySelector(".chrono-temps").textContent = "GO";
    zone.querySelector(".chrono-emoji").textContent = "💪";
    zone.querySelector(".passer").textContent = "OK";
    zone.querySelector(".chrono-plein").style.strokeDashoffset = 0;
    alarme();
    vibrer([400, 150, 400, 150, 700]);
    setTimeout(function () { if (!etat) arreter(); }, 6000);
  }

  /* ---------- Commandes ---------- */

  // secondes : durée voulue (sinon la durée habituelle)
  function demarrer(secondes) {
    const total = secondes || dureeHabituelle();
    etat = { fin: Date.now() + total * 1000, total: total };
    ecrire(CLE, etat);
    preparerSon();
    afficher();
  }

  function arreter() {
    clearInterval(minuteur);
    etat = null;
    ecrire(CLE, null);
    if (zone) zone.hidden = true;
    document.body.classList.remove("avec-chrono");
  }

  // ±15 s : change le repos en cours et devient ta durée habituelle
  function ajuster(secondes) {
    if (!etat) return;
    const total = Math.max(15, Math.min(600, etat.total + secondes));
    etat.fin += (total - etat.total) * 1000;
    etat.total = total;
    ecrire(CLE, etat);
    ecrire(CLE_DUREE, total);
    maj();
  }

  // Au chargement de la page : on reprend le chrono en cours
  function reprendre() {
    const c = lire(CLE, null);
    if (c && c.fin > Date.now()) {
      etat = c;
      afficher();
    }
  }
  // Retour sur l'appli (téléphone déverrouillé) : mise à jour immédiate
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && etat) maj();
  });

  window.chronoSportApp = {
    demarrer: demarrer,
    arreter: arreter,
    dureeHabituelle: dureeHabituelle,
    choisirDuree: function (s) { ecrire(CLE_DUREE, s); }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", reprendre);
  else reprendre();
})();
