import dotenv from "dotenv";
import { createAdminClient } from "../src/lib/supabase/admin";

// Load environment variables
dotenv.config({ path: ".env.local" });

/**
 * Add new MIS permissions to the system
 * 
 * Usage:
 * 1. Add your new permissions to the NEW_PERMISSIONS array below
 * 2. Run: npx tsx scripts/add-mis-permissions.ts
 * 
 * The script will only add permissions that don't already exist.
 */

interface Permission {
  resource: string;
  action: string;
  description: string;
}

// ============================================
// ADD YOUR NEW PERMISSIONS HERE
// ============================================
const NEW_PERMISSIONS: Permission[] = [
  {
    resource: "interviews",
    action: "configure_reminders",
    description: "Configure interview email reminder schedule (MIS)",
  },
  // Job Advertisement permissions
  {
    resource: "jobs",
    action: "approve",
    description: "Approve or reject payment for job advertisements — triggers publish/reject workflow",
  },
  {
    resource: "jobs",
    action: "manage_status",
    description: "Force-change job status (publish without payment, pause, expire, restore deleted)",
  },
  {
    resource: "jobs",
    action: "view_applications",
    description: "View all candidate applications across any job",
  },
  {
    resource: "jobs",
    action: "manage_applications",
    description: "Update application status and add internal notes",
  },
];

// ============================================
// SCRIPT LOGIC (Don't modify below)
// ============================================

async function addPermissions() {
  const adminClient = createAdminClient();

  if (NEW_PERMISSIONS.length === 0) {
    console.log("⚠️  No new permissions to add.");
    console.log("📝 Add your permissions to the NEW_PERMISSIONS array in this script.\n");
    return;
  }

  console.log(`🌱 Adding ${NEW_PERMISSIONS.length} new permission(s)...\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const permission of NEW_PERMISSIONS) {
    const name = `${permission.resource}.${permission.action}`;

    // Validate input
    if (!permission.resource || !permission.action) {
      console.log(`❌ Invalid permission: resource and action are required`);
      errors++;
      continue;
    }

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
      errors++;
    } else {
      console.log(`✅ Created: ${name}`);
      created++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  if (errors > 0) {
    console.log(`   ❌ Errors: ${errors}`);
  }
  console.log(`\n✨ Done!\n`);

  if (created > 0) {
    console.log("📌 Next steps:");
    console.log("   1. Navigate to /mis/roles in your browser");
    console.log("   2. Edit the desired role");
    console.log("   3. Assign the new permissions");
    console.log("   4. Save changes\n");
  }
}

// Run the script
addPermissions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
