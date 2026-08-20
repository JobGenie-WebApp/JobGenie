import dotenv from "dotenv";
import { createAdminClient } from "../src/lib/supabase/admin";

dotenv.config({ path: process.env.ENV_FILE || ".env.local" });

/**
 * Seed the `countries` reference table from mledoze/countries (ODbL 1.0).
 * Idempotent: upserts on `code`, so re-running refreshes without dropping rows.
 * Flag images are not stored - derive from code: https://flagcdn.com/w320/{lowercase code}.png
 */
const SOURCE =
  "https://raw.githubusercontent.com/mledoze/countries/master/dist/countries.json";

type Raw = {
  cca2: string;
  cca3: string;
  ccn3?: string;
  name: { common: string };
  flag: string;
  idd?: { root?: string; suffixes?: string[] };
  region?: string;
  subregion?: string;
};

async function seedCountries() {
  console.log(`🌍 Fetching ${SOURCE}`);
  const res = await fetch(SOURCE);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);

  const raw: Raw[] = await res.json();
  const rows = raw
    .filter((c) => c.cca2 && c.cca3 && c.ccn3)
    .map((c) => ({
      code: c.cca2,
      code3: c.cca3,
      numeric: c.ccn3!,
      name: c.name.common,
      // Derive rather than trust: a few source records carry a stale emoji.
      flag_emoji: String.fromCodePoint(
        ...[...c.cca2].map((ch) => ch.codePointAt(0)! + 127397)
      ),
      // Single-suffix countries get a full dial code; multi-suffix (NANP +1, etc.)
      // keep just the root, since one row can't represent 20 area codes.
      calling_code:
        c.idd?.root && c.idd.suffixes?.length === 1
          ? `${c.idd.root}${c.idd.suffixes[0]}`
          : c.idd?.root || null,
      region: c.region || null,
      subregion: c.subregion || null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  console.log(`📦 Upserting ${rows.length} countries...`);
  const { error } = await createAdminClient()
    .from("countries")
    .upsert(rows, { onConflict: "code" });

  if (error) throw new Error(`Upsert failed: ${error.message}`);
  console.log(`✅ Seeded ${rows.length} countries.`);
}

seedCountries().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
