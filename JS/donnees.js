const PROGRAMME_DEFAUT = ["Push", "Pull", "Leg", "Push", "Pull", "Repos", "Repos"];

/* ---------- Outils communs à toutes les pages ---------- */

// Date au format AAAA-MM-JJ (heure locale)
function versTexte(date) {
  const d = new Date(date.getTime());
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function aujourdhui() {
  return versTexte(new Date());
}

// Texte AAAA-MM-JJ -> Date (à midi, pour éviter les décalages d'heure)
function enDate(texte) {
  return new Date(texte + "T12:00:00");
}

// Date courte : 17/11/26
function dateFr(texte) {
  return enDate(texte).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "2-digit"
  });
}

// Nombre arrondi à 1 décimale, avec une virgule : 82,5
function nb(v) {
  return String(Math.round(Number(v) * 10) / 10).replace(".", ",");
}

// Rend un texte sans danger avant de l'insérer dans du HTML écrit à la main (ex. : un graphique SVG)
function echapperHTML(texte) {
  return String(texte).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

// Crée un élément HTML (le texte est inséré en toute sécurité)
function el(balise, classe, texte) {
  const e = document.createElement(balise);
  if (classe) e.className = classe;
  if (texte) e.textContent = texte;
  return e;
}

// Affiche un message dans l'encadré #confirmation pendant 3,5 s
function confirmer(texte) {
  const c = document.getElementById("confirmation");
  c.textContent = texte;
  c.hidden = false;
  setTimeout(function () { c.hidden = true; }, 3500);
}

// Vrai si une séance a été commencée sans être enregistrée (brouillon de la page Séances)
async function seanceEnCours() {
  try {
    const r = await client.auth.getSession();
    if (!r.data.session) return false;
    const brut = localStorage.getItem("sportapp:brouillon:" + r.data.session.user.id);
    const b = JSON.parse(brut || "null");
    return !!(b && ((b.blocs && b.blocs.length) || b.notes));
  } catch (e) {
    return false;
  }
}

/* ---------- Connexion ---------- */

// À appeler au début de chaque page : renvoie l'utilisateur ou redirige vers Connexion.html
async function exigerConnexion() {
  const { data } = await client.auth.getSession();
  if (!data.session) {
    window.location.replace("Connexion.html");
    return null;
  }
  return data.session.user;
}

async function deconnexion() {
  await client.auth.signOut();
  // On vide la page : si le navigateur la garde en cache, il n'y a plus rien à voir
  document.body.innerHTML = "";
  window.location.replace("Connexion.html");
}
/* ---------- Profil ---------- */

async function chargerProfil() {
  const { data, error } = await client.from("profils").select("*").maybeSingle();
  if (error) throw error;
  return {
    prenom: (data && data.prenom) || "",
    nom: (data && data.nom) || "",
    naissance: (data && data.naissance) || "",
    poids: data && data.poids !== null ? String(data.poids) : "",
    sexe: (data && data.sexe) || "",
    programme: (data && data.programme) || PROGRAMME_DEFAUT,
    taille: data && data.taille ? String(data.taille) : "",
    activite: (data && data.activite) || "modere",
    objectif: (data && data.objectif) || "maintien",
    pseudo: (data && data.pseudo) || "",
    partage_prs: !!(data && data.partage_prs),
    photo_url: (data && data.photo_url) || "",
    photo_chemin: (data && data.photo_chemin) || ""
  };
}

async function sauverProfil(profil) {
  const { data: { user } } = await client.auth.getUser();
  const { error } = await client.from("profils").upsert({
    user_id: user.id,
    prenom: profil.prenom,
    nom: profil.nom,
    naissance: profil.naissance || null,
    poids: profil.poids === "" ? null : parseFloat(profil.poids),
    sexe: profil.sexe || null,
    taille: parseFloat(profil.taille) > 0 ? parseFloat(profil.taille) : null,
    programme: profil.programme
  });
  if (error) throw error;
}

/* ---------- Nutrition ---------- */

const NIVEAUX_ACTIVITE = {
  sedentaire: { nom: "Sédentaire", detail: "Peu ou pas de sport", facteur: 1.2 },
  leger:      { nom: "Léger",      detail: "1 à 2 séances / semaine", facteur: 1.375 },
  modere:     { nom: "Modéré",     detail: "3 à 4 séances / semaine", facteur: 1.55 },
  actif:      { nom: "Actif",      detail: "5 à 6 séances / semaine", facteur: 1.725 },
  tres_actif: { nom: "Très actif", detail: "Sport tous les jours + travail physique", facteur: 1.9 }
};

const OBJECTIFS = {
  perte:    { nom: "Sèche",     ajust: -0.15, proteinesKg: 2.0 },
  maintien: { nom: "Maintien",  ajust: 0,     proteinesKg: 1.8 },
  prise:    { nom: "Prise",     ajust: 0.10,  proteinesKg: 1.8 }
};

// Âge en années à partir de la date de naissance (AAAA-MM-JJ)
function calculerAge(naissance) {
  const n = enDate(naissance);
  const a = new Date();
  let age = a.getFullYear() - n.getFullYear();
  if (a.getMonth() < n.getMonth() || (a.getMonth() === n.getMonth() && a.getDate() < n.getDate())) age--;
  return age;
}

// Besoins du jour selon le profil (formule de Mifflin-St Jeor).
// Renvoie null s'il manque une info, avec la liste de ce qui manque.
function calculerBesoins(p) {
  const manque = [];
  const poids = parseFloat(p.poids);
  const taille = parseFloat(p.taille);
  if (!(poids > 0)) manque.push("poids");
  if (!(taille > 0)) manque.push("taille");
  if (!p.naissance) manque.push("date de naissance");
  if (p.sexe !== "homme" && p.sexe !== "femme") manque.push("sexe");
  if (manque.length) return { manque: manque };

  const age = calculerAge(p.naissance);
  const base = 10 * poids + 6.25 * taille - 5 * age + (p.sexe === "homme" ? 5 : -161);
  const niveau = NIVEAUX_ACTIVITE[p.activite] || NIVEAUX_ACTIVITE.modere;
  const objectif = OBJECTIFS[p.objectif] || OBJECTIFS.maintien;
  const entretien = base * niveau.facteur;
  const calories = Math.round(entretien * (1 + objectif.ajust) / 10) * 10;

  // Protéines selon le poids, lipides = 25 % des calories, glucides = le reste
  const proteines = Math.round(poids * objectif.proteinesKg);
  const lipides = Math.round(calories * 0.25 / 9);
  const glucides = Math.max(0, Math.round((calories - proteines * 4 - lipides * 9) / 4));

  return {
    manque: [], age: age, base: Math.round(base), entretien: Math.round(entretien),
    calories: calories, proteines: proteines, glucides: glucides, lipides: lipides
  };
}

async function sauverBesoins(activite, objectif) {
  const { data: { user } } = await client.auth.getUser();
  const { error } = await client.from("profils").upsert({
    user_id: user.id,
    activite: activite,
    objectif: objectif
  });
  if (error) throw error;
}

async function chargerRepas(date) {
  const { data, error } = await client
    .from("repas").select("*")
    .eq("date", date)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

// Les derniers repas différents, pour les rajouter en un clic
async function chargerRepasRecents() {
  const { data, error } = await client
    .from("repas").select("nom, moment, calories, proteines, glucides, lipides")
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw error;
  const vus = new Set();
  return data.filter(function (r) {
    const cle = normaliser(r.nom);
    if (vus.has(cle)) return false;
    vus.add(cle);
    return true;
  }).slice(0, 8);
}

async function ajouterRepas(repas) {
  const { error } = await client.from("repas").insert(repas);
  if (error) throw error;
}

async function supprimerRepas(id) {
  const { error } = await client.from("repas").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- Séances ---------- */

async function chargerSeances() {
  const { data, error } = await client
    .from("seances").select("*")
    .order("date", { ascending: false })
    .order("id", { ascending: false });
  if (error) throw error;
  return data;
}

async function ajouterSeance(seance) {
  const { data, error } = await client.from("seances").insert({
    date: seance.date,
    type: seance.type,
    notes: seance.notes
  }).select("id").single();
  if (error) throw error;
  return data.id;
}

async function supprimerSeance(id) {
  const { error } = await client.from("seances").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- Poids ---------- */

async function ajouterPoids(valeur) {
  const { data: { user } } = await client.auth.getUser();
  const { error: e1 } = await client.from("poids").insert({ date: aujourdhui(), valeur: valeur });
  if (e1) throw e1;
  const { error: e2 } = await client.from("profils").upsert({ user_id: user.id, poids: valeur });
  if (e2) throw e2;
}

async function chargerPoids() {
  const { data, error } = await client
    .from("poids").select("date, valeur")
    .order("date", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw error;
  return data;
}

/* ---------- Exercices ---------- */

async function chargerExercices() {
  const { data, error } = await client
    .from("exercices").select("*")
    .order("nom", { ascending: true });
  if (error) throw error;
  return data;
}

// Redimensionne la photo (800 px max) et la convertit en JPEG léger
function preparerPhoto(fichier) {
  return new Promise(function (resolve, reject) {
    const url = URL.createObjectURL(fichier);
    const img = new Image();
    img.onload = function () {
      const echelle = Math.min(1, 800 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * echelle);
      canvas.height = Math.round(img.height * echelle);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(function (blob) {
        if (blob) resolve(blob);
        else reject(new Error("Photo illisible"));
      }, "image/jpeg", 0.82);
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      reject(new Error("Format de photo non pris en charge"));
    };
    img.src = url;
  });
}

// exercice : { nom, groupe, lienImage } ; fichierPhoto : un fichier ou null
async function ajouterExercice(exercice, fichierPhoto) {
  let imageUrl = exercice.lienImage || null;
  let chemin = null;

  if (fichierPhoto) {
    const { data: { user } } = await client.auth.getUser();
    const blob = await preparerPhoto(fichierPhoto);
    chemin = user.id + "/" + Date.now() + ".jpg";
    const { error: e1 } = await client.storage
      .from("exercices").upload(chemin, blob, { contentType: "image/jpeg" });
    if (e1) throw e1;
    imageUrl = client.storage.from("exercices").getPublicUrl(chemin).data.publicUrl;
  }

    const { error } = await client.from("exercices").insert({
    nom: exercice.nom,
    groupe: exercice.groupe,
    muscle: exercice.muscle || "Autre",
    image_url: imageUrl,
    image_chemin: chemin
  });

  if (error) {
    // L'exercice n'a pas été créé : on retire la photo envoyée
    if (chemin) await client.storage.from("exercices").remove([chemin]);
    throw error;
  }
}

async function supprimerExercice(exercice) {
  const { error } = await client.from("exercices").delete().eq("id", exercice.id);
  if (error) throw error;
  if (exercice.image_chemin) {
    await client.storage.from("exercices").remove([exercice.image_chemin]);
  }
}


/* ---------- Séries d'une séance ---------- */

async function ajouterSeries(seanceId, series) {
  if (series.length === 0) return;
  const lignes = series.map(function (s) {
    return {
      seance_id: seanceId,
      exercice_id: s.exercice_id,
      numero: s.numero,
      repetitions: s.repetitions,
      charge: s.charge
    };
  });
  const { error } = await client.from("series").insert(lignes);
  if (error) throw error;
}

// Séries de plusieurs séances, avec le nom et la photo de chaque exercice
async function chargerSeries(seanceIds) {
  if (seanceIds.length === 0) return [];
  const { data, error } = await client
    .from("series")
    .select("*, exercices(nom, image_url)")
    .in("seance_id", seanceIds)
    .order("id", { ascending: true });
  if (error) throw error;
  return data;
}

// Regroupe les lignes : { idSéance: [ { nom, image_url, series: [...] } ] }
function grouperSeries(lignes) {
  const parSeance = {};
  lignes.forEach(function (l) {
    const liste = parSeance[l.seance_id] || (parSeance[l.seance_id] = []);
    let ex = liste.find(function (e) { return e.exercice_id === l.exercice_id; });
    if (!ex) {
      ex = {
        exercice_id: l.exercice_id,
        nom: l.exercices ? l.exercices.nom : "Exercice",
        image_url: l.exercices ? l.exercices.image_url : null,
        series: []
      };
      liste.push(ex);
    }
    ex.series.push({ repetitions: l.repetitions, charge: Number(l.charge) });
  });
  return parSeance;
}

// Ce que tu as fait la dernière fois pour un exercice
async function chargerDerniereFois(exerciceId) {
  const { data, error } = await client
    .from("series")
    .select("seance_id, numero, repetitions, charge, seances(date)")
    .eq("exercice_id", exerciceId)
    .order("id", { ascending: false })
    .limit(60);
  if (error) throw error;
  if (data.length === 0) return null;

  // La séance la plus récente (par date, puis par identifiant)
  let meilleure = data[0];
  data.forEach(function (l) {
    const a = l.seances.date, b = meilleure.seances.date;
    if (a > b || (a === b && l.seance_id > meilleure.seance_id)) meilleure = l;
  });

  return {
    date: meilleure.seances.date,
    series: data
      .filter(function (l) { return l.seance_id === meilleure.seance_id; })
      .sort(function (x, y) { return x.numero - y.numero; })
      .map(function (l) { return { repetitions: l.repetitions, charge: Number(l.charge) }; })
  };
}

/* ---------- Affichage des exercices (partagé par plusieurs pages) ---------- */

function texteSerie(s) {
  return s.charge > 0
    ? s.repetitions + " × " + String(s.charge).replace(".", ",") + " kg"
    : s.repetitions + " reps";
}

// Photo de l'exercice, ou son initiale s'il n'y en a pas
function creerVignette(ex) {
  const initiale = (ex.nom || "?").charAt(0).toUpperCase();
  function vide() {
    const d = document.createElement("div");
    d.className = "miniature vide";
    d.textContent = initiale;
    return d;
  }
  if (!ex.image_url) return vide();
  const img = document.createElement("img");
  img.className = "miniature";
  img.src = ex.image_url;
  img.alt = ex.nom;
  img.loading = "lazy";
  img.onerror = function () { img.replaceWith(vide()); };
  return img;
}

// Une ligne : photo, nom de l'exercice et ses séries
function creerLigneExercice(ex) {
  const ligne = document.createElement("div");
  ligne.className = "exo-ligne";
  ligne.appendChild(creerVignette(ex));

  const detail = document.createElement("div");
  detail.className = "exo-detail";

  const nom = document.createElement("div");
  nom.className = "exo-nom-ligne";
  nom.textContent = ex.nom;
  detail.appendChild(nom);

  const puces = document.createElement("div");
  puces.className = "puces";
  ex.series.forEach(function (s) {
    const puce = document.createElement("span");
    puce.className = "puce";
    puce.textContent = texteSerie(s);
    puces.appendChild(puce);
  });
  detail.appendChild(puces);

  ligne.appendChild(detail);
  return ligne;
}


/* ---------- Catégories d'exercices ---------- */

const MUSCLES = ["Pecs", "Dos", "Épaules", "Biceps", "Triceps", "Jambes", "Abdos", "Autre"];
const GROUPES_SEANCE = ["Push", "Pull", "Leg", "Autre"];

// Séance proposée par défaut pour chaque muscle (modifiable ensuite)
const GROUPE_PAR_MUSCLE = {
  "Pecs": "Push", "Épaules": "Push", "Triceps": "Push",
  "Dos": "Pull", "Biceps": "Pull",
  "Jambes": "Leg",
  "Abdos": "Autre", "Autre": "Autre"
};

// Minuscules sans accents, pour que « epaules » trouve « Épaules »
function normaliser(texte) {
  return String(texte).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

async function modifierExercice(id, champs) {
  const { error } = await client.from("exercices").update(champs).eq("id", id);
  if (error) throw error;
}

/* ---------- Progression d'un exercice ---------- */

// Toutes les séries d'un exercice, avec la date de leur séance
async function chargerHistoriqueExercice(exerciceId) {
  const { data, error } = await client
    .from("series")
    .select("seance_id, numero, repetitions, charge, seances(date)")
    .eq("exercice_id", exerciceId)
    .order("id", { ascending: true });
  if (error) throw error;
  return data;
}

// L'exercice de la dernière série enregistrée (ou null s'il n'y en a pas)
async function chargerDernierExerciceUtilise() {
  const { data, error } = await client
    .from("series")
    .select("exercice_id")
    .order("id", { ascending: false })
    .limit(1);
  if (error) throw error;
  return data.length ? data[0].exercice_id : null;
}

/* ---------- Types de séance du programme ---------- */

// Vrai si le jour est un jour de repos (quelle que soit la façon dont c'est écrit)
function estRepos(nom) {
  return normaliser(nom || "") === "repos";
}

// Classe de couleur d'une séance : push, pull, leg, repos, ou autre (texte libre)
function classeSeance(nom) {
  const n = normaliser(nom || "");
  return ["push", "pull", "leg", "repos"].indexOf(n) !== -1 ? n : "autre";
}

/* ---------- Records ---------- */

// Records de chaque exercice, calculés par la base (vue records_exercices)
async function chargerRecords() {
  const { data, error } = await client.from("records_exercices").select("*");
  if (error) throw error;
  return data;
}

/* ---------- PR à 1 répétition (saisis à la main) ---------- */

async function chargerPRs() {
  const { data, error } = await client
    .from("prs").select("*")
    .order("date", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw error;
  return data;
}

async function ajouterPR(pr) {
  const { error } = await client.from("prs").insert(pr);
  if (error) throw error;
}

async function supprimerPR(id) {
  const { error } = await client.from("prs").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- Profil social : pseudo et abonnements ---------- */

// Pseudo (pour être trouvé) et partage de ses PR
async function sauverProfilSocial(pseudo, partage) {
  const { data: { user } } = await client.auth.getUser();
  const { error } = await client.from("profils").upsert({
    user_id: user.id,
    pseudo: pseudo || null,
    partage_prs: partage
  });
  if (error) throw error;
}

// Vrai si le pseudo a le bon format et que personne ne l'a (fonctionne aussi sans être connecté)
async function pseudoLibre(pseudo) {
  const { data, error } = await client.rpc("pseudo_libre", { p: pseudo });
  if (error) throw error;
  return data === true;
}

async function trouverPseudo(pseudo) {
  const { data, error } = await client.rpc("trouver_pseudo", { p: pseudo });
  if (error) throw error;
  return data && data.length ? data[0] : null;
}

// Les gens que je suis ou qui me suivent : { id, pseudo, prenom, je_suis, me_suit }
async function chargerAbonnements() {
  const { data, error } = await client.rpc("mes_abonnements");
  if (error) throw error;
  return data;
}

// Niveau, badges, abonnés et PR (si visibles) d'un autre utilisateur
async function chargerProfilPublic(id) {
  const { data, error } = await client.rpc("profil_public", { u: id });
  if (error) throw error;
  return data;
}

async function suivre(id) {
  const { error } = await client.from("abonnements").insert({ suivi: id });
  if (error) throw error;
}

async function nePlusSuivre(id) {
  const { data: { user } } = await client.auth.getUser();
  const { error } = await client.from("abonnements").delete().eq("suiveur", user.id).eq("suivi", id);
  if (error) throw error;
}

/* ---------- Photo de profil ---------- */

// Avatar rond : la photo si elle existe, sinon l'initiale
function creerAvatar(p, classe) {
  const a = el("div", "avatar" + (classe ? " " + classe : ""));
  if (p && p.photo_url) {
    const img = document.createElement("img");
    img.src = p.photo_url;
    img.alt = "";
    img.loading = "lazy";
    a.appendChild(img);
  } else {
    a.textContent = ((p && (p.prenom || p.pseudo)) || "?").trim().charAt(0).toUpperCase() || "?";
  }
  return a;
}

// Recadre la photo en carré (400 px) et la convertit en JPEG léger
function preparerAvatar(fichier) {
  return new Promise(function (resolve, reject) {
    const url = URL.createObjectURL(fichier);
    const img = new Image();
    img.onload = function () {
      const cote = Math.min(img.width, img.height);
      const taille = Math.min(400, cote);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = taille;
      canvas.getContext("2d").drawImage(img,
        (img.width - cote) / 2, (img.height - cote) / 2, cote, cote, 0, 0, taille, taille);
      URL.revokeObjectURL(url);
      canvas.toBlob(function (blob) {
        if (blob) resolve(blob);
        else reject(new Error("Photo illisible"));
      }, "image/jpeg", 0.85);
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      reject(new Error("Format de photo non pris en charge"));
    };
    img.src = url;
  });
}

// Envoie la nouvelle photo, l'enregistre dans le profil et supprime l'ancienne
async function changerPhoto(fichier, ancienChemin) {
  const { data: { user } } = await client.auth.getUser();
  const blob = await preparerAvatar(fichier);
  const chemin = user.id + "/" + Date.now() + ".jpg";
  const { error: e1 } = await client.storage
    .from("avatars").upload(chemin, blob, { contentType: "image/jpeg" });
  if (e1) throw e1;
  const url = client.storage.from("avatars").getPublicUrl(chemin).data.publicUrl;
  const { error: e2 } = await client.from("profils")
    .upsert({ user_id: user.id, photo_url: url, photo_chemin: chemin });
  if (e2) {
    await client.storage.from("avatars").remove([chemin]);
    throw e2;
  }
  if (ancienChemin) await client.storage.from("avatars").remove([ancienChemin]);
  return { photo_url: url, photo_chemin: chemin };
}

async function supprimerPhoto(chemin) {
  const { data: { user } } = await client.auth.getUser();
  const { error } = await client.from("profils")
    .upsert({ user_id: user.id, photo_url: null, photo_chemin: null });
  if (error) throw error;
  if (chemin) await client.storage.from("avatars").remove([chemin]);
}

/* ---------- XP, niveaux et badges (l'XP est calculée par la base) ---------- */

async function chargerXP() {
  const { data, error } = await client.rpc("mon_xp");
  if (error) throw error;
  return data;
}

async function chargerClassement() {
  const { data, error } = await client.rpc("classement_amis");
  if (error) throw error;
  return data;
}

// XP totale à atteindre pour le niveau n : 0, 200, 500, 900, 1400…
function seuilNiveau(n) {
  return 50 * (n - 1) * (n + 2);
}

const TITRES = [[30, "Légende"], [20, "Élite"], [15, "Athlète"], [10, "Confirmé"], [5, "Régulier"], [1, "Débutant"]];

function niveauDe(xp) {
  let n = 1;
  while (xp >= seuilNiveau(n + 1)) n++;
  const debut = seuilNiveau(n), fin = seuilNiveau(n + 1);
  return {
    niveau: n,
    titre: TITRES.find(function (t) { return n >= t[0]; })[1],
    dans: xp - debut,           // XP gagnée dans le niveau
    total: fin - debut,         // XP du niveau entier
    reste: fin - xp
  };
}

// [icône, nom, description, valeur atteinte, objectif]
function listeBadges(s) {
  const n = niveauDe(s.xp).niveau;
  const podium = s.xp > 0 && s.total >= 3 && s.rang <= 3;
  const premier = s.xp > 0 && s.total >= 2 && s.rang === 1;
  return [
    ["👟", "Premier pas", "Ta première séance validée", s.seances, 1],
    ["💪", "Habitué", "10 séances validées", s.seances, 10],
    ["🏋️", "Acharné", "50 séances validées", s.seances, 50],
    ["💯", "Centenaire", "100 séances validées", s.seances, 100],
    ["🔥", "En feu", "4 semaines d’affilée à 3 séances", s.meilleure_serie, 4],
    ["☄️", "Inarrêtable", "12 semaines d’affilée à 3 séances", s.meilleure_serie, 12],
    ["🏆", "Record battu", "Un PR vérifié", s.prs, 1],
    ["⚡", "Briseur de records", "10 PR vérifiés", s.prs, 10],
    ["🦍", "Club des 100", "Un PR vérifié à 100 kg ou plus", Number(s.max_pr), 100],
    ["🚛", "10 tonnes", "10 000 kg soulevés en une séance", Math.round(Number(s.tonnage_max)), 10000],
    ["🤝", "Pas seul", "Ton premier abonné", s.abonnes, 1],
    ["📣", "Populaire", "10 abonnés", s.abonnes, 10],
    ["⭐", "Niveau 10", "Atteindre le niveau 10", n, 10],
    // Classement parmi tous les utilisateurs de l'app
    ["🥉", "Sur le podium", "Top 3 en XP de tous les utilisateurs", podium ? 1 : 0, 1],
    ["👑", "Le plus expérimenté", "N°1 en XP de tous les utilisateurs", premier ? 1 : 0, 1]
  ];
}

// Regroupe les PR par exercice : meilleur PR, gain par rapport au précédent, historique
function resumerPRs(liste) {
  const parExo = {};
  liste.forEach(function (p) {
    (parExo[p.exercice_id] = parExo[p.exercice_id] || []).push(p);
  });
  return Object.keys(parExo).map(function (id) {
    const historique = parExo[id];            // du plus ancien au plus récent
    let meilleur = null;
    let precedent = null;                     // meilleur PR battu par le record actuel
    historique.forEach(function (p) {
      if (!meilleur || Number(p.charge) >= Number(meilleur.charge)) {
        if (meilleur && Number(p.charge) > Number(meilleur.charge)) precedent = meilleur;
        meilleur = p;
      }
    });
    return {
      exercice_id: historique[0].exercice_id,
      meilleur: meilleur,
      gain: precedent ? Number(meilleur.charge) - Number(precedent.charge) : 0,
      historique: historique
    };
  });
}

/* ---------- Modification d'une séance ---------- */

async function modifierSeance(id, champs) {
  const { error } = await client.from("seances").update(champs).eq("id", id);
  if (error) throw error;
}

// Remplace d'un coup toutes les séries d'une séance (opération unique côté base)
async function remplacerSeries(seanceId, lignes) {
  const { error } = await client.rpc("remplacer_series", {
    p_seance_id: seanceId,
    p_lignes: lignes
  });
  if (error) throw error;
}

/* ---------- Protection du bouton « Retour » ---------- */

// La page reste masquée tant que la connexion n'est pas vérifiée
document.documentElement.style.visibility = "hidden";

async function verifierSession() {
  const { data } = await client.auth.getSession();
  if (!data.session) {
    window.location.replace("Connexion.html");
  } else {
    document.documentElement.style.visibility = "visible";
  }
}

// Se déclenche aussi quand le navigateur restaure la page depuis son cache (bouton Retour)
window.addEventListener("pageshow", function (e) {
  if (e.persisted) verifierSession();
});

// Si tu te déconnectes depuis un autre onglet, celui-ci est aussi redirigé
client.auth.onAuthStateChange(function (evenement) {
  if (evenement === "SIGNED_OUT") window.location.replace("Connexion.html");
});

verifierSession();