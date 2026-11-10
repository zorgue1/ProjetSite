const PROGRAMME_DEFAUT = ["Push", "Pull", "Leg", "Push", "Pull", "Repos", "Repos"];

function aujourdhui() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
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
    programme: (data && data.programme) || PROGRAMME_DEFAUT
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
    programme: profil.programme
  });
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