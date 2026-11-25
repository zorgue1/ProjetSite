// Dessins d'exercices : un personnage qui fait le mouvement, le muscle travaillé en rouge.
// Tout est dessiné ici (SVG), sans image externe : pas de droits d'auteur, s'affiche hors ligne.
// dessinExercice(nom, muscle) renvoie le code SVG ; il suffit de l'insérer dans la page.
// Couleurs : variables CSS --d-* (définies dans Commun.css, clair et sombre).

/* ---------- Quels muscles pour quel exercice ---------- */
// [mots du nom (sans accents, minuscules), muscles principaux, muscles secondaires]
const REGLES_MUSCLES = [
  [/mollet/, ["mollets"], []],
  [/shrug/, ["trapezes"], []],
  [/lombaire|good morning/, ["lombaires"], ["ischios", "fessiers"]],
  [/roumain|nordic|leg curl/, ["ischios"], ["fessiers"]],
  [/hip thrust|kickback fessier|fessier/, ["fessiers"], ["ischios"]],
  [/abducteur/, ["fessiers"], []],
  [/adducteur/, ["adducteurs"], []],
  [/leg extension|sissy/, ["quadriceps"], []],
  [/squat|presse a cuisses|fente|step-up|belt/, ["quadriceps", "fessiers"], ["ischios", "adducteurs"]],
  [/souleve de terre|rack pull/, ["lombaires", "fessiers", "ischios"], ["dorsaux", "trapezes"]],
  [/face pull|oiseau|reverse pec/, ["epaulesAr"], ["trapezes"]],
  [/rowing menton/, ["epaulesAv", "trapezes"], []],
  [/elevations? laterale|militaire|epaules|arnold|halteres assis|elevations? frontale/, ["epaulesAv"], ["triceps"]],
  [/traction|tirage|rowing|pull-over|pullover/, ["dorsaux"], ["biceps", "epaulesAr"]],
  [/curl inverse/, ["avantBras"], ["biceps"]],
  [/curl|marteau/, ["biceps"], ["avantBras"]],
  [/prise serree|barre au front|extension|kickback|triceps|dips \(machine\)/, ["triceps"], ["epaulesAv"]],
  [/developpe|presse pectoraux|ecarte|pec deck|pompe|dips/, ["pecs"], ["epaulesAv", "triceps"]],
  [/russian|gainage lateral/, ["obliques"], ["abdos"]],
  [/crunch|releve|gainage|roue|mountain|hollow|abdo/, ["abdos"], ["obliques"]],
  [/farmer/, ["avantBras", "trapezes"], ["abdos"]],
  [/rameur/, ["dorsaux", "quadriceps"], ["biceps", "ischios"]],
  [/natation|nage/, ["dorsaux", "epaulesAv"], ["triceps", "quadriceps"]],
  [/velo|elliptique|tapis|stepper|corde|burpee|traineau|swing|course|marche|running|footing/, ["quadriceps", "mollets"], ["fessiers"]]
];

const MUSCLES_PAR_GROUPE = {
  "Pecs": [["pecs"], ["epaulesAv", "triceps"]],
  "Dos": [["dorsaux"], ["trapezes", "biceps"]],
  "Épaules": [["epaulesAv", "epaulesAr"], []],
  "Biceps": [["biceps"], ["avantBras"]],
  "Triceps": [["triceps"], []],
  "Jambes": [["quadriceps", "fessiers"], ["ischios", "mollets"]],
  "Abdos": [["abdos"], ["obliques"]],
  "Cardio": [["quadriceps", "mollets"], ["fessiers"]],
  "Autre": [[], []]
};

function sansAccentsDessin(t) {
  return String(t || "").toLowerCase().replace(/œ/g, "oe").normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function musclesDe(nom, muscle) {
  const n = sansAccentsDessin(nom);
  for (const r of REGLES_MUSCLES) {
    if (r[0].test(n)) return { principaux: r[1], secondaires: r[2] };
  }
  const g = MUSCLES_PAR_GROUPE[muscle] || MUSCLES_PAR_GROUPE.Autre;
  return { principaux: g[0], secondaires: g[1] };
}

/* ---------- Petits outils de dessin ---------- */

// Noms de couleur : la vraie couleur vient des classes .t-* (traits) et .r-* (remplissage) de Commun.css.
// (Pas de var() dans les attributs style du SVG : Safari sur iPhone ne dessinait pas les traits.)
const COUL = { corps: "corps", loin: "loin", p: "p", s: "s", fer: "fer", noir: "noir", banc: "banc", sol: "sol", cable: "cable" };

function pt(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
function plus(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
function r1(v) { return Math.round(v * 10) / 10; }

function ligne(a, b, w, c) {
  return '<line x1="' + r1(a[0]) + '" y1="' + r1(a[1]) + '" x2="' + r1(b[0]) + '" y2="' + r1(b[1]) +
    '" stroke-width="' + r1(w) + '" stroke-linecap="round" class="t-' + c + '"/>';
}
function rond(c, r, coul) {
  return '<circle cx="' + r1(c[0]) + '" cy="' + r1(c[1]) + '" r="' + r + '" class="r-' + coul + '"/>';
}
function boite(x, y, w, h, c, rx) {
  return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (rx || 2) + '" class="r-' + c + '"/>';
}
function trace(d, c, w) {
  return '<path d="' + d + '" fill="none" stroke-width="' + (w || 2) + '" stroke-linecap="round" stroke-linejoin="round" class="t-' + c + '"/>';
}
function forme(d, c) { return '<path d="' + d + '" class="r-' + c + '"/>'; }

// Côté de p par rapport au segment a→b (+1 / −1 ; 0 si aligné)
function cote(a, b, p) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const val = -dy * (p[0] - a[0]) + dx * (p[1] - a[1]);
  const L = Math.hypot(dx, dy) * Math.hypot(p[0] - a[0], p[1] - a[1]) || 1;
  return Math.abs(val / L) < 0.08 ? 0 : (val > 0 ? 1 : -1);
}

// Bande de muscle le long d'un segment (côté +1 / −1, 0 = au milieu)
function bande(a, b, w, cote, c, t0, t1) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
  const n = [-dy / L, dx / L];
  const o = [n[0] * cote * w * 0.22, n[1] * cote * w * 0.22];
  return ligne(plus(pt(a, b, t0 === undefined ? 0.15 : t0), o), plus(pt(a, b, t1 === undefined ? 0.85 : t1), o), cote ? w * 0.52 : w * 0.6, c);
}

/* ---------- Le matériel ---------- */

function halteres(m) {
  return rond(plus(m, [5, -4]), 7.5, COUL.noir) + ligne(m, plus(m, [5, -4]), 4, COUL.fer) + rond(m, 7.5, COUL.noir) + rond(m, 2.6, COUL.fer);
}
function barre(m) {
  return rond(m, 15, COUL.noir) + rond(m, 11, COUL.fer) + rond(m, 3, COUL.noir);
}
function kettlebell(m) {
  return trace("M" + (m[0] - 5) + " " + (m[1] + 2) + " Q" + m[0] + " " + (m[1] - 6) + " " + (m[0] + 5) + " " + (m[1] + 2), COUL.noir, 3) +
    rond([m[0], m[1] + 10], 8.5, COUL.noir);
}
function poignee(m) { return ligne(plus(m, [-4, 0]), plus(m, [4, 0]), 4, COUL.noir); }
function cable(m, p) {
  return ligne(m, p, 1.6, COUL.cable) + rond(p, 4, COUL.fer);
}
function sol() { return ligne([6, 141], [194, 141], 2, COUL.sol); }
function bancPlat(x1, x2, y) {
  return boite(x1, y, x2 - x1, 7, COUL.banc, 3) + boite(x1 + 10, y + 7, 6, 134 - y, COUL.fer) + boite(x2 - 16, y + 7, 6, 134 - y, COUL.fer) +
    boite(x1 + 2, 137, 22, 4, COUL.fer) + boite(x2 - 24, 137, 22, 4, COUL.fer);
}
function tour(x) { return boite(x - 4, 0, 8, 141, COUL.banc, 2); }

/* ---------- Le personnage de profil ---------- */
// S épaule, H hanche, E coude, M main, K genou, P cheville ; *2 = membres du côté loin
function profil(p, mu) {
  const S = p.S, H = p.H, K = p.K, P = p.P;
  const av = p.avant || -1;
  const decal = p.decal || [4, -3];
  const E2 = p.E2 || plus(p.E, decal), M2 = p.M2 || plus(p.M, decal);
  const K2 = p.K2 || plus(p.K, decal), P2 = p.P2 || plus(p.P, decal);
  const S2 = plus(S, decal), H2 = plus(H, decal);
  const d = [S[0] - H[0], S[1] - H[1]], L = Math.hypot(d[0], d[1]) || 1;
  const T = p.T || [S[0] + d[0] / L * 15, S[1] + d[1] / L * 15];
  const pied = p.pied || [9, 1];
  const nDos = (function () { const n = [-(H[1] - S[1]) / L, (H[0] - S[0]) / L]; return [n[0] * -av, n[1] * -av]; })();

  function couleur(nom) {
    return mu.principaux.indexOf(nom) !== -1 ? COUL.p : mu.secondaires.indexOf(nom) !== -1 ? COUL.s : null;
  }
  let o = "";
  // Côté loin
  o += ligne(H2, K2, 14, COUL.loin) + ligne(K2, P2, 11, COUL.loin) + ligne(P2, plus(P2, p.pied2 || pied), 6, COUL.loin);
  o += ligne(S2, E2, 10, COUL.loin) + ligne(E2, M2, 8.5, COUL.loin);
  if (p.eq === "halteres" && !p.uneMain) o += halteres(M2);
  // Tronc, cou, tête
  o += ligne(S, H, 24, COUL.corps) + ligne(S, T, 9, COUL.corps) + rond(T, 9.5, COUL.corps);
  let c;
  if ((c = couleur("pecs"))) o += bande(S, H, 24, av, c, 0.12, 0.44);
  if ((c = couleur("abdos") || couleur("obliques"))) o += bande(S, H, 24, av, c, 0.52, 0.9);
  if ((c = couleur("dorsaux"))) o += bande(S, H, 24, -av, c, 0.14, 0.62);
  if ((c = couleur("lombaires"))) o += bande(S, H, 24, -av, c, 0.66, 0.92);
  if ((c = couleur("trapezes"))) o += ligne(plus(S, [nDos[0] * 5, nDos[1] * 5]), pt(S, T, 0.55), 7, c);
  if ((c = couleur("fessiers"))) o += rond(plus(H, [nDos[0] * 6, nDos[1] * 6]), 8.5, c);
  // Jambe proche
  o += ligne(H, K, 15, COUL.corps) + ligne(K, P, 12, COUL.corps) + ligne(P, plus(P, pied), 6.5, COUL.corps);
  const hs = cote(H, K, P) || p.hs || 1;
  if ((c = couleur("quadriceps"))) o += bande(H, K, 15, -hs, c);
  if ((c = couleur("ischios"))) o += bande(H, K, 15, hs, c);
  if ((c = couleur("adducteurs"))) o += bande(H, K, 15, 0, c, 0.2, 0.7);
  const ms = cote(K, P, H) || p.ms || hs;
  if ((c = couleur("mollets"))) o += bande(K, P, 12, ms, c, 0.12, 0.6);
  // Bras proche
  o += ligne(S, p.E, 11, COUL.corps) + ligne(p.E, p.M, 9, COUL.corps) + rond(p.M, 4.2, COUL.corps);
  if ((c = couleur("epaulesAv") || couleur("epaulesAr"))) o += rond(S, 7.5, c);
  const bs = cote(S, p.E, p.M) || p.bs || 1;
  if ((c = couleur("biceps"))) o += bande(S, p.E, 11, bs, c);
  if ((c = couleur("triceps"))) o += bande(S, p.E, 11, -bs, c);
  if ((c = couleur("avantBras"))) o += bande(p.E, p.M, 9, 0, c, 0.1, 0.75);
  return o;
}

/* ---------- Le personnage de face ---------- */
// E, M : coude et main gauches ; K, P : genou et cheville gauches (la droite est le miroir)
function face(p, mu) {
  function m(a) { return [200 - a[0], a[1]]; }
  function couleur(nom) {
    return mu.principaux.indexOf(nom) !== -1 ? COUL.p : mu.secondaires.indexOf(nom) !== -1 ? COUL.s : null;
  }
  const y = p.y || 0;
  const SL = [84, 48 + y], HL = [91, 92 + y], T = [100, 29 + y];
  let o = "";
  [false, true].forEach(function (droite) {
    const f = droite ? m : function (a) { return a; };
    o += ligne(f(HL), f(p.K), 15, COUL.corps) + ligne(f(p.K), f(p.P), 12, COUL.corps) +
      ligne(f(p.P), f(plus(p.P, [-6, 2])), 6, COUL.corps);
  });
  o += forme("M82 " + (44 + y) + " Q100 " + (40 + y) + " 118 " + (44 + y) + " L113 " + (98 + y) + " L87 " + (98 + y) + " Z", COUL.corps);
  o += ligne([100, 38 + y], T, 9, COUL.corps) + rond(T, 10, COUL.corps);
  let c;
  if ((c = couleur("trapezes"))) o += forme("M93 " + (38 + y) + " L84 " + (46 + y) + " L116 " + (46 + y) + " L107 " + (38 + y) + " Z", c);
  if ((c = couleur("pecs"))) o += forme("M86 " + (50 + y) + " Q99 " + (46 + y) + " 99 " + (52 + y) + " L99 " + (63 + y) + " Q90 " + (66 + y) + " 86 " + (58 + y) + " Z", c) +
    forme("M114 " + (50 + y) + " Q101 " + (46 + y) + " 101 " + (52 + y) + " L101 " + (63 + y) + " Q110 " + (66 + y) + " 114 " + (58 + y) + " Z", c);
  if ((c = couleur("dorsaux"))) o += forme("M85 " + (52 + y) + " L89 " + (60 + y) + " L88 " + (78 + y) + " Z", c) + forme("M115 " + (52 + y) + " L111 " + (60 + y) + " L112 " + (78 + y) + " Z", c);
  if ((c = couleur("abdos"))) o += boite(95, 66 + y, 10, 26, c, 3);
  if ((c = couleur("obliques"))) o += boite(89, 70 + y, 5, 20, c, 2) + boite(106, 70 + y, 5, 20, c, 2);
  // Fessiers (moyen fessier) : visibles sur le côté des hanches
  if ((c = couleur("fessiers"))) o += rond([83, 94 + y], 7, c) + rond([117, 94 + y], 7, c);
  [false, true].forEach(function (droite) {
    const f = droite ? m : function (a) { return a; };
    const S = f(SL), E = f(p.E), M = f(p.M), H = f(HL), K = f(p.K), P = f(p.P);
    o += ligne(S, E, 11, COUL.corps) + ligne(E, M, 9, COUL.corps) + rond(M, 4.2, COUL.corps);
    if ((c = couleur("epaulesAv") || couleur("epaulesAr"))) o += rond(S, 7.5, c);
    if ((c = couleur("biceps"))) o += bande(S, E, 11, 0, c);
    if ((c = couleur("avantBras"))) o += bande(E, M, 9, 0, c, 0.1, 0.75);
    if ((c = couleur("quadriceps"))) o += bande(H, K, 15, 0, c);
    if ((c = couleur("adducteurs"))) o += bande(H, K, 15, droite ? -1 : 1, c, 0.1, 0.7);
    if ((c = couleur("mollets"))) o += bande(K, P, 12, droite ? 1 : -1, c, 0.1, 0.6);
    if (p.eq === "halteres") o += ligne(plus(M, [-6, 0]), plus(M, [6, 0]), 3, COUL.fer) + ligne(plus(M, [-7, -6]), plus(M, [-7, 6]), 5, COUL.noir) + ligne(plus(M, [7, -6]), plus(M, [7, 6]), 5, COUL.noir);
    if (p.eq === "poulie" && p.poulie) o += cable(M, f(p.poulie));
  });
  return o;
}

/* ---------- Les positions ---------- */
// Chaque position : le personnage (profil ou face), le décor derrière (fond) et devant (devant)
const DEBOUT = { S: [98, 46], H: [98, 88], K: [100, 113], P: [100, 136] };
function debout(bras, extra) { return Object.assign({ vue: "profil", fond: sol() }, DEBOUT, bras, extra || {}); }

const POSES = {
  // --- Allongé sur banc plat (tête à gauche)
  bancPousse: { vue: "profil", S: [70, 88], H: [116, 90], K: [144, 80], P: [150, 134], E: [72, 64], M: [73, 42], pied: [9, 1], fond: sol() + bancPlat(48, 150, 98) },
  bancEcarte: { vue: "profil", S: [70, 88], H: [116, 90], K: [144, 80], P: [150, 134], E: [80, 66], M: [74, 46], pied: [9, 1], fond: sol() + bancPlat(48, 150, 98) },
  bancFront: { vue: "profil", S: [70, 88], H: [116, 90], K: [144, 80], P: [150, 134], E: [66, 62], M: [50, 72], bs: -1, pied: [9, 1], fond: sol() + bancPlat(48, 150, 98) },
  bancPullover: { vue: "profil", S: [70, 88], H: [116, 90], K: [144, 80], P: [150, 134], E: [48, 76], M: [28, 74], pied: [9, 1], fond: sol() + bancPlat(48, 150, 98) },
  bancDecline: { vue: "profil", S: [64, 98], H: [114, 80], K: [138, 74], P: [150, 100], E: [66, 72], M: [66, 50], pied: [8, 4],
    fond: sol() + forme("M44 106 L128 86 L130 92 L46 112 Z", COUL.banc) + boite(84, 100, 6, 41, COUL.fer) + boite(70, 137, 30, 4, COUL.fer) + rond([152, 96], 5, COUL.banc) },
  // --- Banc incliné (dos vers la gauche)
  inclinePousse: { vue: "profil", S: [72, 66], H: [102, 98], K: [130, 96], P: [134, 134], E: [76, 42], M: [79, 20],
    fond: sol() + ligne([92, 112], [58, 76], 8, COUL.banc) + boite(88, 108, 34, 7, COUL.banc) + boite(100, 115, 6, 26, COUL.fer) + boite(84, 137, 36, 4, COUL.fer) },
  inclineCurl: { vue: "profil", S: [72, 66], H: [102, 98], K: [130, 96], P: [134, 134], E: [66, 92], M: [82, 76], bs: 1,
    fond: sol() + ligne([92, 112], [58, 76], 8, COUL.banc) + boite(88, 108, 34, 7, COUL.banc) + boite(100, 115, 6, 26, COUL.fer) + boite(84, 137, 36, 4, COUL.fer) },
  // --- Assis droit
  assisTete: { vue: "profil", S: [96, 58], H: [96, 100], K: [126, 100], P: [128, 134], E: [110, 46], M: [106, 22],
    fond: sol() + boite(80, 104, 34, 7, COUL.banc) + boite(94, 111, 6, 30, COUL.fer) + ligne([82, 104], [80, 54], 8, COUL.banc) },
  assisAvant: { vue: "profil", S: [96, 58], H: [96, 100], K: [126, 100], P: [128, 134], E: [116, 64], M: [138, 62],
    fond: sol() + boite(80, 104, 34, 7, COUL.banc) + boite(94, 111, 6, 30, COUL.fer) + ligne([82, 104], [80, 50], 8, COUL.banc) + boite(150, 20, 10, 121, COUL.banc),
    devant: ligne([138, 54], [138, 70], 5, COUL.noir) + ligne([138, 62], [152, 62], 4, COUL.fer) },
  assisRow: { vue: "profil", S: [112, 62], H: [94, 100], K: [126, 100], P: [130, 134], E: [96, 80], M: [120, 84], bs: 1,
    fond: sol() + boite(80, 104, 34, 7, COUL.banc) + boite(94, 111, 6, 30, COUL.fer) + ligne([128, 54], [128, 84], 9, COUL.banc) + boite(150, 20, 10, 121, COUL.banc),
    devant: ligne([120, 76], [120, 92], 5, COUL.noir) + ligne([120, 84], [150, 84], 4, COUL.fer) },
  assisReverse: { vue: "profil", S: [96, 58], H: [96, 100], K: [126, 100], P: [128, 134], E: [80, 58], M: [62, 60],
    fond: sol() + boite(80, 104, 34, 7, COUL.banc) + boite(94, 111, 6, 30, COUL.fer) + ligne([112, 102], [112, 56], 9, COUL.banc) + boite(40, 20, 10, 121, COUL.banc),
    devant: ligne([62, 52], [62, 68], 5, COUL.noir) },
  tirageVertical: { vue: "profil", S: [96, 60], H: [96, 102], K: [128, 100], P: [130, 134], E: [100, 82], M: [112, 54], bs: 1, poulie: [112, 2],
    fond: sol() + boite(80, 106, 34, 7, COUL.banc) + boite(94, 113, 6, 28, COUL.fer) + boite(120, 88, 22, 6, COUL.banc) + boite(150, 0, 10, 141, COUL.banc) + ligne([112, 2], [155, 2], 3, COUL.fer),
    devant: ligne([100, 52], [124, 56], 4, COUL.noir) },
  tirageHorizontal: { vue: "profil", S: [86, 78], H: [82, 118], K: [112, 112], P: [140, 116], E: [70, 94], M: [96, 98], bs: 1, pied: [2, -8], poulie: [182, 116],
    fond: sol() + boite(60, 122, 46, 7, COUL.banc) + boite(80, 129, 6, 12, COUL.fer) + ligne([148, 104], [148, 132], 6, COUL.banc) + tour(184) },
  pupitre: { vue: "profil", S: [96, 58], H: [94, 100], K: [126, 100], P: [128, 134], E: [124, 80], M: [120, 54], bs: 1,
    fond: sol() + boite(80, 104, 34, 7, COUL.banc) + boite(94, 111, 6, 30, COUL.fer) + ligne([104, 70], [132, 90], 9, COUL.banc) + ligne([130, 94], [128, 140], 5, COUL.fer) },
  concentre: { vue: "profil", S: [114, 64], H: [92, 100], K: [126, 100], P: [130, 134], E: [126, 92], M: [122, 66], bs: 1, uneMain: true,
    fond: sol() + boite(76, 104, 34, 7, COUL.banc) + boite(90, 111, 6, 30, COUL.fer) },
  legExtension: { vue: "profil", S: [90, 56], H: [92, 98], K: [122, 98], P: [152, 92], E: [98, 80], M: [108, 100], pied: [4, -8],
    fond: sol() + boite(80, 102, 46, 7, COUL.banc) + boite(100, 109, 6, 32, COUL.fer) + ligne([82, 102], [80, 50], 8, COUL.banc),
    devant: rond([154, 98], 5, COUL.banc) },
  legCurlAssis: { vue: "profil", S: [90, 56], H: [92, 98], K: [124, 98], P: [118, 128], E: [98, 80], M: [110, 96], pied: [8, 2],
    fond: sol() + boite(80, 102, 46, 7, COUL.banc) + boite(100, 109, 6, 32, COUL.fer) + ligne([82, 102], [80, 50], 8, COUL.banc),
    devant: rond([114, 132], 5, COUL.banc) + boite(104, 86, 28, 6, COUL.banc, 3) },
  molletsAssis: { vue: "profil", S: [96, 58], H: [96, 100], K: [126, 96], P: [128, 124], E: [108, 80], M: [124, 88], pied: [10, 4],
    fond: sol() + boite(80, 104, 34, 7, COUL.banc) + boite(94, 111, 6, 30, COUL.fer) + boite(130, 128, 16, 13, COUL.banc),
    devant: boite(112, 84, 26, 6, COUL.banc, 3) },
  presse: { vue: "profil", S: [54, 88], H: [82, 118], K: [108, 86], P: [134, 96], E: [66, 110], M: [80, 120], pied: [4, -9],
    fond: sol() + ligne([46, 74], [84, 126], 9, COUL.banc) + ligne([84, 126], [104, 126], 8, COUL.banc) + boite(92, 130, 6, 11, COUL.fer) + ligne([60, 141], [186, 40], 5, COUL.fer),
    devant: ligne([132, 80], [146, 112], 7, COUL.banc) },
  crunchMachine: { vue: "profil", S: [116, 70], H: [96, 100], K: [126, 100], P: [128, 134], E: [124, 78], M: [118, 62],
    fond: sol() + boite(80, 104, 34, 7, COUL.banc) + boite(94, 111, 6, 30, COUL.fer) + boite(126, 56, 8, 22, COUL.banc, 3) },
  // --- Debout
  deboutTete: debout({ E: [112, 44], M: [108, 20] }),
  deboutCurl: debout({ E: [99, 72], M: [120, 62], bs: 1, poulie: [130, 134] }),
  deboutBras: debout({ E: [99, 72], M: [100, 96] }),
  deboutFrontale: debout({ E: [120, 52], M: [142, 54] }),
  deboutMenton: debout({ E: [114, 42], M: [110, 62], bs: -1 }),
  deboutPushdown: debout({ E: [99, 72], M: [116, 90], bs: 1, poulie: [128, 2] }, { fond: sol() + tour(134) }),
  deboutNuque: debout({ E: [106, 20], M: [88, 32], bs: -1 }),
  deboutFacePull: debout({ E: [88, 42], M: [112, 32], bs: 1, poulie: [186, 30] }, { fond: sol() + tour(188) }),
  deboutBrasTendus: { vue: "profil", S: [106, 48], H: [96, 88], K: [102, 113], P: [100, 136], E: [120, 66], M: [128, 88], poulie: [150, 4], fond: sol() + tour(156) },
  deboutCrossover: { vue: "profil", S: [102, 48], H: [98, 88], K: [100, 113], P: [100, 136], E: [118, 66], M: [128, 82], poulie: [180, 6], fond: sol() + tour(184) },
  mollets: { vue: "profil", S: [98, 40], H: [98, 82], K: [100, 107], P: [101, 128], E: [99, 66], M: [100, 90], pied: [8, 6],
    fond: sol() + boite(100, 132, 40, 9, COUL.banc) },
  marche: { vue: "profil", S: [100, 46], H: [98, 88], K: [108, 112], P: [104, 136], K2: [90, 112], P2: [80, 132], E: [92, 68], M: [104, 84], E2: [108, 66], M2: [118, 76], fond: sol() },
  tapis: { vue: "profil", S: [100, 40], H: [98, 82], K: [110, 104], P: [104, 126], K2: [88, 106], P2: [78, 124], E: [92, 62], M: [104, 74], E2: [108, 60], M2: [118, 68],
    fond: boite(40, 128, 140, 8, COUL.banc, 4) + ligne([170, 128], [176, 60], 5, COUL.fer) + boite(166, 54, 18, 8, COUL.banc, 3) + ligne([6, 141], [194, 141], 2, COUL.sol) },
  sautCorde: { vue: "profil", S: [98, 40], H: [98, 82], K: [101, 106], P: [100, 128], E: [96, 64], M: [110, 76], pied: [9, 3],
    fond: '<ellipse cx="106" cy="70" rx="24" ry="66" fill="none" stroke-width="1.6" class="t-cable"/>' + sol() },
  burpee: { vue: "profil", S: [100, 36], H: [100, 78], K: [102, 102], P: [102, 126], E: [106, 16], M: [110, -4], pied: [8, 4], fond: sol() },
  farmer: { vue: "profil", S: [100, 46], H: [98, 88], K: [108, 112], P: [104, 136], K2: [90, 112], P2: [80, 132], E: [100, 72], M: [101, 96], eq: "halteres", fond: sol() },
  fente: { vue: "profil", S: [96, 50], H: [96, 92], K: [122, 110], P: [122, 136], K2: [84, 128], P2: [60, 134], pied2: [-2, 6], E: [97, 76], M: [98, 100], fond: sol() },
  fenteBulgare: { vue: "profil", S: [100, 50], H: [100, 92], K: [126, 110], P: [126, 136], K2: [84, 120], P2: [60, 104], pied2: [-9, -2], E: [101, 76], M: [102, 100],
    fond: sol() + boite(36, 104, 36, 7, COUL.banc) + boite(50, 111, 6, 30, COUL.fer) },
  stepUp: { vue: "profil", S: [100, 44], H: [98, 86], K: [124, 100], P: [124, 120], K2: [96, 112], P2: [90, 136], E: [99, 70], M: [100, 94],
    fond: sol() + boite(112, 122, 36, 19, COUL.banc) },
  squat: { vue: "profil", S: [104, 68], H: [82, 104], K: [114, 106], P: [104, 136], E: [86, 80], M: [96, 60], fond: sol() },
  hack: { vue: "profil", S: [94, 66], H: [82, 104], K: [114, 106], P: [108, 136], E: [92, 80], M: [100, 64],
    fond: sol() + ligne([60, 120], [100, 44], 9, COUL.banc) + ligne([60, 141], [110, 34], 4, COUL.fer) },
  souleve: { vue: "profil", S: [122, 66], H: [88, 90], K: [110, 112], P: [104, 136], E: [120, 92], M: [118, 116], fond: sol() },
  roumain: { vue: "profil", S: [124, 72], H: [90, 88], K: [104, 113], P: [102, 136], E: [122, 96], M: [120, 118], fond: sol() },
  swing: { vue: "profil", S: [100, 46], H: [98, 88], K: [104, 113], P: [100, 136], E: [118, 58], M: [138, 62], eq: "kettlebell", fond: sol() },
  traineau: { vue: "profil", S: [132, 70], H: [98, 96], K: [122, 114], P: [116, 136], K2: [88, 118], P2: [70, 136], E: [148, 74], M: [160, 80],
    fond: sol() + boite(162, 112, 30, 22, COUL.banc, 3) + ligne([164, 76], [164, 112], 5, COUL.fer) + ligne([186, 76], [186, 112], 5, COUL.fer) },
  kickbackFessier: { vue: "profil", S: [112, 52], H: [98, 90], K: [80, 108], P: [64, 128], K2: [100, 114], P2: [100, 136], E: [126, 62], M: [138, 56], poulie: [20, 134],
    fond: sol() + tour(16) + ligne([138, 56], [150, 40], 4, COUL.fer) + tour(152) },
  // --- Penché en avant
  rowing: { vue: "profil", S: [124, 70], H: [86, 90], K: [106, 112], P: [102, 136], E: [104, 82], M: [112, 102], bs: 1, fond: sol() },
  rowingUnBras: { vue: "profil", S: [120, 82], H: [80, 86], K: [76, 114], P: [70, 136], K2: [94, 106], P2: [70, 108], E2: [124, 108], M2: [124, 106], E: [106, 66], M: [114, 90], bs: 1, uneMain: true,
    fond: sol() + bancPlat(60, 150, 110) },
  kickback: { vue: "profil", S: [122, 72], H: [86, 90], K: [106, 112], P: [102, 136], E: [100, 78], M: [76, 76], bs: 1, fond: sol() },
  oiseau: { vue: "profil", S: [124, 72], H: [86, 90], K: [106, 112], P: [102, 136], E: [114, 86], M: [100, 92], fond: sol() },
  lombaire: { vue: "profil", S: [84, 62], H: [116, 92], K: [134, 110], P: [150, 128], E: [96, 76], M: [104, 68], avant: 1, pied: [6, 8],
    fond: sol() + ligne([116, 106], [150, 136], 8, COUL.banc) + ligne([100, 102], [128, 102], 8, COUL.banc) + boite(124, 106, 6, 35, COUL.fer) + rond([154, 122], 5, COUL.banc) },
  // --- Au sol
  pompe: { vue: "profil", S: [132, 94], H: [88, 108], K: [64, 118], P: [42, 128], E: [132, 116], M: [134, 136], pied: [-3, 9], avant: 1, decal: [3, -2], fond: sol() },
  mountain: { vue: "profil", S: [132, 94], H: [90, 106], K: [112, 120], P: [110, 136], K2: [66, 118], P2: [42, 128], E: [132, 116], M: [134, 136], pied: [-3, 9], pied2: [-3, 9], avant: 1, fond: sol() },
  planche: { vue: "profil", S: [130, 112], H: [86, 116], K: [62, 122], P: [40, 128], E: [132, 134], M: [150, 134], pied: [-3, 9], avant: 1, fond: sol() },
  crunch: { vue: "profil", S: [76, 116], H: [112, 128], K: [138, 104], P: [152, 134], E: [70, 96], M: [62, 108], pied: [9, 1], fond: sol() },
  releveJambes: { vue: "profil", S: [60, 126], H: [104, 128], K: [118, 102], P: [128, 74], E: [80, 132], M: [100, 134], pied: [8, -5], fond: sol() },
  russian: { vue: "profil", S: [80, 92], H: [98, 128], K: [124, 108], P: [144, 116], E: [96, 106], M: [114, 100], bs: 1, fond: sol(), devant: rond([118, 98], 7, COUL.noir) },
  roue: { vue: "profil", S: [138, 104], H: [98, 112], K: [84, 134], P: [62, 136], E: [154, 118], M: [166, 128], avant: 1, pied: [-8, 0],
    fond: sol(), devant: rond([168, 132], 8, COUL.noir) + rond([168, 132], 3, COUL.fer) },
  hollow: { vue: "profil", S: [70, 116], H: [104, 128], K: [130, 120], P: [156, 112], E: [54, 106], M: [38, 100], pied: [8, -3], fond: sol() },
  crunchPoulie: { vue: "profil", S: [126, 104], H: [100, 104], K: [98, 134], P: [74, 136], E: [130, 88], M: [128, 74], avant: -1, pied: [-8, 0], poulie: [128, 2],
    fond: sol() + tour(134) },
  hipThrust: { vue: "profil", S: [66, 96], H: [108, 88], K: [134, 98], P: [138, 134], E: [92, 78], M: [106, 80],
    fond: sol() + boite(30, 98, 40, 8, COUL.banc) + boite(46, 106, 6, 35, COUL.fer) },
  legCurlAllonge: { vue: "profil", S: [64, 92], H: [108, 94], K: [142, 94], P: [150, 64], E: [52, 106], M: [54, 116], avant: 1, pied: [8, -2],
    fond: sol() + boite(44, 102, 112, 7, COUL.banc) + boite(70, 109, 6, 32, COUL.fer) + boite(130, 109, 6, 32, COUL.fer), devant: rond([156, 68], 5, COUL.banc) },
  nordic: { vue: "profil", S: [132, 86], H: [104, 112], K: [82, 134], P: [58, 136], E: [144, 102], M: [150, 118], avant: -1, pied: [-8, 0],
    fond: sol() + rond([54, 132], 5, COUL.banc) },
  // --- Suspendu
  traction: { vue: "profil", S: [98, 48], H: [96, 90], K: [100, 112], P: [92, 132], E: [88, 32], M: [100, 8], bs: 1,
    fond: ligne([40, 6], [160, 6], 4, COUL.fer) + ligne([40, 6], [40, 141], 5, COUL.banc) + ligne([160, 6], [160, 141], 5, COUL.banc) + sol() },
  suspenduGenoux: { vue: "profil", S: [98, 48], H: [96, 90], K: [122, 88], P: [122, 112], E: [92, 28], M: [100, 8],
    fond: ligne([40, 6], [160, 6], 4, COUL.fer) + ligne([40, 6], [40, 141], 5, COUL.banc) + ligne([160, 6], [160, 141], 5, COUL.banc) + sol() },
  dips: { vue: "profil", S: [102, 64], H: [96, 104], K: [104, 126], P: [86, 136], E: [84, 76], M: [104, 92], bs: -1,
    fond: ligne([70, 92], [140, 92], 5, COUL.fer) + ligne([76, 92], [76, 141], 5, COUL.banc) + ligne([134, 92], [134, 141], 5, COUL.banc) + sol() },
  // --- Dans l'eau
  nage: { vue: "profil", S: [120, 86], H: [80, 90], K: [56, 92], P: [32, 90], K2: [56, 86], P2: [32, 80], E: [140, 80], M: [162, 76], E2: [104, 96], M2: [88, 104], avant: 1, pied: [-8, 2], pied2: [-8, -2],
    T: [134, 80], fond: trace("M6 96 Q26 88 46 96 T86 96 T126 96 T166 96 T206 96", COUL.cable, 2), devant: trace("M6 104 Q26 96 46 104 T86 104 T126 104 T166 104 T206 104", COUL.cable, 2) },
  // --- Cardio sur machine
  velo: { vue: "profil", S: [114, 58], H: [86, 92], K: [112, 100], P: [100, 128], E: [130, 66], M: [144, 64],
    fond: sol() + boite(76, 96, 20, 6, COUL.banc, 3) + ligne([86, 100], [104, 138], 6, COUL.fer) + ligne([104, 138], [140, 138], 6, COUL.fer) + ligne([140, 138], [146, 66], 6, COUL.fer) + rond([136, 120], 14, COUL.banc) },
  rameur: { vue: "profil", S: [94, 86], H: [100, 124], K: [126, 114], P: [150, 122], E: [82, 104], M: [110, 104], bs: 1, pied: [2, -9], poulie: [168, 112],
    fond: ligne([30, 132], [176, 132], 6, COUL.fer) + boite(86, 126, 26, 6, COUL.banc, 3) + rond([170, 112], 14, COUL.banc) + ligne([156, 108], [156, 130], 5, COUL.banc) + sol() },
  // --- De face
  laterale: { vue: "face", E: [66, 52], M: [50, 54], poulie: [150, 138], K: [90, 116], P: [90, 138], fond: sol() },
  crossover: { vue: "face", E: [74, 66], M: [94, 84], K: [90, 116], P: [90, 138], poulie: [16, 4], fond: sol() + tour(12) + tour(188) },
  crossoverBas: { vue: "face", E: [76, 72], M: [94, 60], K: [90, 116], P: [90, 138], poulie: [16, 134], fond: sol() + tour(12) + tour(188) },
  pecDeck: { vue: "face", y: 8, E: [70, 58], M: [80, 36], K: [80, 124], P: [84, 140],
    fond: sol() + boite(84, 100, 32, 8, COUL.banc) + boite(97, 108, 6, 33, COUL.fer) + boite(62, 26, 8, 32, COUL.banc, 3) + boite(130, 26, 8, 32, COUL.banc, 3) },
  abducteurs: { vue: "face", y: 8, E: [80, 76], M: [84, 98], K: [66, 112], P: [72, 140],
    fond: sol() + boite(78, 102, 44, 8, COUL.banc) + boite(97, 110, 6, 31, COUL.fer) + boite(54, 102, 7, 20, COUL.banc, 3) + boite(139, 102, 7, 20, COUL.banc, 3) },
  adducteurs: { vue: "face", y: 8, E: [80, 76], M: [84, 98], K: [70, 112], P: [74, 140],
    fond: sol() + boite(78, 102, 44, 8, COUL.banc) + boite(97, 110, 6, 31, COUL.fer) + boite(70, 102, 7, 20, COUL.banc, 3) + boite(123, 102, 7, 20, COUL.banc, 3) }
};

/* ---------- Quel dessin pour quel exercice ---------- */
// [mots du nom, position, matériel] : la première règle qui correspond gagne
const REGLES_DESSIN = [
  [/reverse pec/, "assisReverse"],
  [/pec deck/, "pecDeck"],
  [/vis-a-vis|ecarte poulie$|ecarte poulie \(/, "crossover", "poulie"],
  [/ecarte poulie basse/, "crossoverBas", "poulie"],
  [/ecarte incline/, "inclinePousse", "halteres"],
  [/ecarte/, "bancEcarte", "halteres"],
  [/decline/, "bancDecline", "barre"],
  [/presse pectoraux inclinee/, "inclinePousse"],
  [/developpe incline/, "inclinePousse", "barre"],
  [/presse pectoraux/, "assisAvant"],
  [/barre au front/, "bancFront", "barre"],
  [/pull-over haltere|pullover haltere/, "bancPullover", "halteres"],
  [/pull-over|pullover|bras tendus/, "deboutBrasTendus", "poulie"],
  [/developpe couche/, "bancPousse", "barre"],
  [/pompe/, "pompe"],
  [/dips/, "dips"],
  [/relev.* genoux|genoux suspendu/, "suspenduGenoux"],
  [/traction/, "traction"],
  [/tirage vertical/, "tirageVertical", "poulie"],
  [/tirage horizontal/, "tirageHorizontal", "poulie"],
  [/rowing haltere un bras|un bras/, "rowingUnBras", "halteres"],
  [/rowing menton/, "deboutMenton", "barre"],
  [/rowing machine|poitrine appuyee/, "assisRow"],
  [/rowing/, "rowing", "barre"],
  [/good morning/, "roumain", "barreDos"],
  [/souleve de terre roumain/, "roumain", "barre"],
  [/souleve|rack pull/, "souleve", "barre"],
  [/shrug/, "deboutBras", "halteres"],
  [/lombaire/, "lombaire"],
  [/militaire/, "deboutTete", "barre"],
  [/developpe .*assis|developpe epaules|arnold|developpe haltere/, "assisTete", "halteres"],
  [/elevations? laterale/, "laterale", "halteres"],
  [/elevations? frontale/, "deboutFrontale", "halteres"],
  [/oiseau/, "oiseau", "halteres"],
  [/face pull/, "deboutFacePull", "poulie"],
  [/curl incline/, "inclineCurl", "halteres"],
  [/pupitre|spider|curl biceps \(machine\)/, "pupitre", "halteres"],
  [/concentre/, "concentre", "halteres"],
  [/^curl poulie/, "deboutCurl", "poulie"],
  [/^curl haltere|marteau/, "deboutCurl", "halteres"],
  [/^curl/, "deboutCurl", "barre"],
  [/au-dessus de la tete|nuque/, "deboutNuque", "halteres"],
  [/extension poulie|pushdown/, "deboutPushdown", "poulie"],
  [/extension triceps/, "assisAvant"],
  [/kickback fessier/, "kickbackFessier", "poulie"],
  [/kickback/, "kickback", "halteres"],
  [/hack|pendulum/, "hack"],
  [/front squat/, "squat", "barreDevant"],
  [/goblet/, "squat", "gobelet"],
  [/squat/, "squat", "barreDos"],
  [/presse a cuisses|mollets a la presse/, "presse"],
  [/bulgare/, "fenteBulgare", "halteres"],
  [/step-up/, "stepUp", "halteres"],
  [/fente/, "fente", "halteres"],
  [/leg extension/, "legExtension"],
  [/leg curl allonge/, "legCurlAllonge"],
  [/leg curl/, "legCurlAssis"],
  [/nordic/, "nordic"],
  [/hip thrust/, "hipThrust", "barre"],
  [/abducteur/, "abducteurs"],
  [/adducteur/, "adducteurs"],
  [/mollets assis/, "molletsAssis"],
  [/mollet/, "mollets", "halteres"],
  [/crunch a la poulie|crunch poulie/, "crunchPoulie", "poulie"],
  [/crunch \(machine\)/, "crunchMachine"],
  [/crunch/, "crunch"],
  [/releve de jambes/, "releveJambes"],
  [/gainage lateral/, "planche"],
  [/gainage|planche/, "planche"],
  [/russian/, "russian"],
  [/roue/, "roue"],
  [/mountain/, "mountain"],
  [/hollow/, "hollow"],
  [/rameur/, "rameur", "poulie"],
  [/velo(?! elliptique)/, "velo"],
  [/tapis|elliptique|stepper/, "tapis"],
  [/course|footing|running|marche/, "marche"],
  [/natation|nage/, "nage"],
  [/corde a sauter/, "sautCorde"],
  [/burpee/, "burpee"],
  [/kettlebell|swing/, "swing", "kettlebell"],
  [/farmer/, "farmer", "halteres"],
  [/traineau/, "traineau"]
];

// Exercice inconnu : une position selon le muscle choisi
const DESSIN_PAR_MUSCLE = {
  "Pecs": "bancPousse", "Dos": "rowing", "Épaules": "deboutTete", "Biceps": "deboutCurl",
  "Triceps": "deboutPushdown", "Jambes": "squat", "Abdos": "crunch", "Cardio": "tapis", "Autre": "marche"
};

function materielDuNom(n, defaut) {
  if (/halt/.test(n)) return "halteres";
  if (/poulie|corde\)|cable/.test(n)) return "poulie";
  if (/kettlebell/.test(n)) return "kettlebell";
  if (/barre|smith|ez/.test(n)) return defaut && /barre/.test(defaut) ? defaut : "barre";
  return defaut || "";
}

function dessinExercice(nom, muscle) {
  const n = sansAccentsDessin(nom);
  let regle = null;
  for (const r of REGLES_DESSIN) { if (r[0].test(n)) { regle = r; break; } }
  const cle = regle ? regle[1] : (DESSIN_PAR_MUSCLE[muscle] || "marche");
  const pose = Object.assign({}, POSES[cle]);
  pose.eq = pose.eq || materielDuNom(n, regle && regle[2]);
  const mu = musclesDe(nom, muscle);

  let o = pose.fond || "";
  if (pose.vue === "face") {
    o += face(pose, mu);
  } else {
    // Câble et barre sur les épaules : derrière le personnage
    if (pose.eq === "poulie" && pose.poulie) o += cable(pose.M, pose.poulie);
    if (pose.eq === "barreDos") o += barre([pose.S[0] - 6, pose.S[1] - 10]);
    if (pose.eq === "barreDevant") o += barre([pose.S[0] + 8, pose.S[1] - 10]);
    o += profil(pose, mu);
    const M = pose.M;
    if (pose.eq === "halteres") o += halteres(M);
    else if (pose.eq === "barre") o += barre(M);
    else if (pose.eq === "gobelet") o += rond(plus(M, [6, 0]), 8, COUL.noir);
    else if (pose.eq === "kettlebell") o += kettlebell(M);
    else if (pose.eq === "poulie") o += poignee(M);
  }
  o += pose.devant || "";
  return '<svg class="dessin-exo" viewBox="0 -8 200 152" role="img" aria-label="' +
    String(nom).replace(/[<>&"]/g, "") + ' : muscles travaillés en rouge">' + o + "</svg>";
}
