import dotenv from "dotenv";
import { createAdminClient } from "../src/lib/supabase/admin";
import { DEFAULT_PERMISSIONS } from "../src/lib/mis/default-permissions";

// Load environment variables
dotenv.config({ path: ".env.local" });

/**
 * Seed default MIS permissions
 * This script populates the mis_permissions table with standard enterprise permissions.
 * The permission catalog lives in `src/lib/mis/default-permissions.ts` (shared with the
 * startup auto-seed in `src/lib/bootstrap/seed-super-admin.ts`).
 */

async function seedPermissions() {
  const adminClient = createAdminClient();

  console.log("🌱 Seeding MIS permissions...\n");

  let created = 0;
  let skipped = 0;

  for (const permission of DEFAULT_PERMISSIONS) {
    const name = `${permission.resource}.${permission.action}`;

    // Check if permission already exists
    const { data: existing } = await adminClient
      .from("mis_permissions")
      .select("id")
      .eq("resource", permission.resource)
      .eq("action", permission.action)
      .maybeSingle();

    if (existing) {
      console.log(`⏭️  Skipped: ${name} (already exists)`);
      skipped++;
      continue;
    }

    // Insert permission
    const { error } = await adminClient.from("mis_permissions").insert({
      name,
      resource: permission.resource,
      action: permission.action,
      description: permission.description,
    });

    if (error) {
      console.error(`❌ Failed to create ${name}:`, error.message);
    } else {
      console.log(`✅ Created: ${name}`);
      created++;
    }
  }

  console.log(`\n📊 Summary: ${created} created, ${skipped} skipped`);
  console.log("✨ MIS permissions seeding complete!\n");
}

// Run the seed
seedPermissions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
