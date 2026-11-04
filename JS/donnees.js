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
    window.location.href = "Connexion.html";
    return null;
  }
  return data.session.user;
}

async function deconnexion() {
  await client.auth.signOut();
  window.location.href = "Connexion.html";
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
  const { error } = await client.from("seances").insert({
    date: seance.date,
    type: seance.type,
    notes: seance.notes
  });
  if (error) throw error;
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