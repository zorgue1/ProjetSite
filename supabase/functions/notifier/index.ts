// Fonction Supabase « notifier » : envoie les notifications de SportApp
//
// Elle est appelée par :
//   - un webhook de la base, à chaque nouveau PR (table prs) ou nouvel encouragement 💪 (table reactions) ;
//   - une tâche planifiée toutes les 15 minutes, pour les rappels de séance ;
//   - l'appli (bouton « M'envoyer un test » dans Paramètres), avec la session de l'utilisateur.
//
// Secrets à définir dans Supabase (Edge Functions → Secrets) :
//   VAPID_PUBLIC, VAPID_PRIVATE : les clés des notifications
//   NOTIF_SECRET : mot de passe partagé avec le webhook et la tâche planifiée
// SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement par Supabase.

import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.119.2";

const base = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
webpush.setVapidDetails(
  "https://zorgue1.github.io/ProjetSite/",
  Deno.env.get("VAPID_PUBLIC")!,
  Deno.env.get("VAPID_PRIVATE")!
);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Message = { titre: string; texte: string; url: string; tag?: string };

// Envoie un message à tous les appareils d'un utilisateur ; oublie ceux qui n'existent plus
async function envoyer(userId: string, message: Message) {
  const { data: appareils } = await base.from("push_abonnements").select("*").eq("user_id", userId);
  for (const a of appareils ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } },
        JSON.stringify(message),
        { TTL: 60 * 60 * 12 }
      );
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await base.from("push_abonnements").delete().eq("id", a.id);
      else console.error("Envoi raté", code, (e as Error).message);
    }
  }
}

async function profil(userId: string) {
  const { data } = await base.from("profils").select("*").eq("user_id", userId).maybeSingle();
  return data;
}

function nom(p: { prenom?: string; pseudo?: string } | null) {
  return (p && (p.prenom || (p.pseudo ? "@" + p.pseudo : ""))) || "Un ami";
}

// Même règle que l'appli (donnees.js) : on suit l'ordre du programme, pas le jour de la semaine
function normaliser(t: string) {
  return String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function prochaineSeance(programme: unknown, seances: { type: string }[]) {
  const liste = (Array.isArray(programme) ? programme : [])
    .map(String).filter((s) => s.trim() && normaliser(s) !== "repos");
  if (!liste.length) return null;
  const cles = liste.map(normaliser);
  let curseur = -1;
  for (const s of seances.slice().reverse()) {              // de la plus ancienne à la plus récente
    const cle = normaliser(s.type ?? "");
    for (let pas = 1; pas <= cles.length; pas++) {
      const j = (curseur + pas) % cles.length;
      if (cles[j] === cle) { curseur = j; break; }
    }
  }
  return liste[(curseur + 1) % liste.length];
}

// Nouveau PR : prévenir les abonnés mutuels, si l'auteur partage ses PR
async function nouveauPR(pr: { user_id: string; exercice_id: unknown; charge: number }) {
  const auteur = await profil(pr.user_id);
  if (!auteur || !auteur.partage_prs) return;
  const { data: exo } = await base.from("exercices").select("nom").eq("id", pr.exercice_id).maybeSingle();
  const { data: abonnes } = await base.from("abonnements").select("suiveur").eq("suivi", pr.user_id);
  for (const a of abonnes ?? []) {
    const { data: retour } = await base.from("abonnements").select("suiveur")
      .eq("suiveur", pr.user_id).eq("suivi", a.suiveur).maybeSingle();
    if (!retour) continue;                                  // seulement entre abonnés mutuels
    const ami = await profil(a.suiveur);
    if (!ami || ami.notif_amis === false) continue;
    await envoyer(a.suiveur, {
      titre: "🏆 " + nom(auteur) + " a un nouveau PR",
      texte: (exo?.nom ?? "Exercice") + " : " + String(pr.charge).replace(".", ",") + " kg. Va l’encourager 💪",
      url: "HTML/Profil.html#fil",
      tag: "pr-" + pr.user_id,
    });
  }
}

// Nouvel encouragement : prévenir le propriétaire de la séance ou du PR
async function nouvelleReaction(r: { auteur: string; cible_type: string; cible_id: string }) {
  const table = r.cible_type === "pr" ? "prs" : "seances";
  const { data: cible } = await base.from(table).select("*").eq("id", r.cible_id).maybeSingle();
  if (!cible || cible.user_id === r.auteur) return;
  const proprio = await profil(cible.user_id);
  if (!proprio || proprio.notif_reactions === false) return;
  const auteur = await profil(r.auteur);
  await envoyer(cible.user_id, {
    titre: "💪 " + nom(auteur) + " t’encourage",
    texte: r.cible_type === "pr" ? "Pour ton PR. Continue comme ça !" : "Pour ta séance " + (cible.type ?? "") + ". Continue comme ça !",
    url: "HTML/Profil.html#fil",
    tag: "reaction-" + r.cible_type + "-" + r.cible_id,
  });
}

// Rappels : toutes les 15 min, pour ceux dont l'heure est arrivée, chaque jour, sauf si une séance est déjà notée
async function rappels() {
  const paris = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  const creneau = String(paris.getHours()).padStart(2, "0") + ":" + String(Math.floor(paris.getMinutes() / 15) * 15).padStart(2, "0");
  const date = paris.getFullYear() + "-" + String(paris.getMonth() + 1).padStart(2, "0") + "-" + String(paris.getDate()).padStart(2, "0");

  const { data: gens } = await base.from("profils").select("user_id, prenom, programme")
    .eq("notif_rappel", true).eq("notif_heure", creneau);
  for (const p of gens ?? []) {
    const { count } = await base.from("seances").select("id", { count: "exact", head: true })
      .eq("user_id", p.user_id).eq("date", date);
    if (count) continue;                                    // déjà faite aujourd'hui
    const { data: recentes } = await base.from("seances").select("type")
      .eq("user_id", p.user_id).order("date", { ascending: false }).order("id", { ascending: false }).limit(120);
    const prochaine = prochaineSeance(p.programme, recentes ?? []);
    await envoyer(p.user_id, prochaine
      ? {
          titre: "C’est l’heure de ta séance " + prochaine + " 💪",
          texte: (p.prenom ? p.prenom + ", l" : "L") + "a suite de ton programme t’attend.",
          url: "HTML/Activite.html#nouvelle",
          tag: "rappel",
        }
      : {
          titre: "Une séance aujourd’hui ? 💪",
          texte: (p.prenom ? p.prenom + ", u" : "U") + "ne séance libre pour garder ta série 🔥",
          url: "HTML/Activite.html#nouvelle",
          tag: "rappel",
        });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const corps = await req.json().catch(() => ({}));

    // Test depuis l'appli : uniquement pour l'utilisateur connecté
    if (corps.test) {
      const jeton = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
      const { data: { user } } = await base.auth.getUser(jeton);
      if (!user) return new Response("Non connecté", { status: 401, headers: CORS });
      await envoyer(user.id, { titre: "Les notifications marchent 🎉", texte: "Tu recevras tes rappels et les nouvelles de tes amis ici.", url: "HTML/Accueil.html" });
      return new Response("ok", { headers: CORS });
    }

    // Tout le reste vient du serveur : on vérifie le mot de passe partagé
    if (req.headers.get("x-sportapp-secret") !== Deno.env.get("NOTIF_SECRET")) {
      return new Response("Interdit", { status: 403, headers: CORS });
    }
    if (corps.rappel) await rappels();
    else if (corps.type === "INSERT" && corps.table === "prs") await nouveauPR(corps.record);
    else if (corps.type === "INSERT" && corps.table === "reactions") await nouvelleReaction(corps.record);
    return new Response("ok", { headers: CORS });
  } catch (e) {
    console.error(e);
    return new Response("Erreur", { status: 500, headers: CORS });
  }
});
