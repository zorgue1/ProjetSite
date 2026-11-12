const SUPABASE_URL = "https://unzyqfkxgfepvzirnmfd.supabase.co";
const SUPABASE_CLE = "sb_publishable_t_jV42FAw6T7lezWBomRbQ_MzwC3ow8";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_CLE);

// Installation en application (PWA)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("../sw.js").catch(function () {});
}