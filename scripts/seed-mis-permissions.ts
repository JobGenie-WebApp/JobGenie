import dotenv from "dotenv";
import { createAdminClient } from "../src/lib/supabase/admin";

// Load environment variables
dotenv.config({ path: ".env.local" });

/**
 * Seed default MIS permissions
 * This script populates the mis_permissions table with standard enterprise permissions
 */

interface Permission {
  resource: string;
  action: string;
  description: string;
}

const DEFAULT_PERMISSIONS: Permission[] = [
  // Candidate Management
  { resource: "candidates", action: "view", description: "View candidate profiles and list" },
  { resource: "candidates", action: "approve", description: "Approve or reject candidate profiles" },
  { resource: "candidates", action: "edit", description: "Edit candidate information" },
  { resource: "candidates", action: "delete", description: "Delete candidate accounts" },
  { resource: "candidates", action: "export", description: "Export candidate data" },

  // Employer Management
  { resource: "employers", action: "view", description: "View employer profiles and companies" },
  { resource: "employers", action: "approve", description: "Approve or reject employer/company profiles" },
  { resource: "employers", action: "edit", description: "Edit employer/company information" },
  { resource: "employers", action: "delete", description: "Delete employer accounts" },
  { resource: "employers", action: "export", description: "Export employer data" },

  // Job Management
  { resource: "jobs", action: "view", description: "View all job postings" },
  { resource: "jobs", action: "create", description: "Create job postings (on behalf of employers)" },
  { resource: "jobs", action: "edit", description: "Edit job postings" },
  { resource: "jobs", action: "delete", description: "Delete job postings" },
  { resource: "jobs", action: "moderate", description: "Moderate and flag job postings" },

  // Interview Management
  { resource: "interviews", action: "view", description: "View interview schedules and details" },
  { resource: "interviews", action: "reschedule", description: "Reschedule interviews" },
  { resource: "interviews", action: "cancel", description: "Cancel interviews" },
  { resource: "interviews", action: "configure_reminders", description: "Configure interview email reminder schedule (MIS)" },

  // MIS User Management
  { resource: "users", action: "view", description: "View MIS users list" },
  { resource: "users", action: "create", description: "Create new MIS user accounts" },
  { resource: "users", action: "edit", description: "Edit MIS user information" },
  { resource: "users", action: "delete", description: "Delete MIS user accounts" },
  { resource: "users", action: "manage_roles", description: "Assign roles to MIS users" },

  // Role & Permission Management
  { resource: "roles", action: "view", description: "View roles and permissions" },
  { resource: "roles", action: "create", description: "Create new roles" },
  { resource: "roles", action: "edit", description: "Edit roles and assign permissions" },
  { resource: "roles", action: "delete", description: "Delete roles" },

  // Reports & Analytics
  { resource: "reports", action: "view", description: "View system reports and analytics" },
  { resource: "reports", action: "export", description: "Export reports and data" },

  // Audit Logs
  { resource: "audit", action: "view", description: "View audit logs and system activity" },
  { resource: "audit", action: "export", description: "Export audit logs" },

  // Master Data Management
  { resource: "master_data", action: "view", description: "View master data (industries, designations)" },
  { resource: "master_data", action: "edit", description: "Add/edit industries and job designations" },

  // Analytics
  { resource: "analytics", action: "view", description: "View analytics dashboard and reports" },
  { resource: "analytics", action: "export", description: "Export analytics data" },
];

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
