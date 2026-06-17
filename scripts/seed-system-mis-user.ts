import dotenv from "dotenv";
import { createAdminClient } from "../src/lib/supabase/admin";

// Load environment variables
dotenv.config({ path: ".env.local" });

/**
 * Creates a "system" MIS user used for employer-initiated payment requests
 * (e.g., job advertisement payments where no human MIS user is the initiator).
 *
 * The resulting user_id is stored in SYSTEM_MIS_USER_ID env var.
 *
 * Run: npx tsx scripts/seed-system-mis-user.ts
 */

async function seedSystemMisUser() {
  const admin = createAdminClient();

  const SYSTEM_EMAIL = "system@jobgenie.internal";

  console.log("🌱 Seeding system MIS user...\n");

  // Check if already exists
  const { data: existing } = await admin
    .from("users")
    .select("id")
    .eq("email", SYSTEM_EMAIL)
    .maybeSingle();

  if (existing) {
    console.log(`✅ System user already exists: ${existing.id}`);
    console.log(`\n📌 Add to your .env.local:\n   SYSTEM_MIS_USER_ID=${existing.id}\n`);
    return;
  }

  // Find or create auth user
  let userId: string;
  const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existingAuthUser = listData?.users?.find((u) => u.email === SYSTEM_EMAIL);

  if (existingAuthUser) {
    userId = existingAuthUser.id;
    console.log(`ℹ️  Auth user already exists: ${userId}`);
  } else {
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email: SYSTEM_EMAIL,
      password: crypto.randomUUID() + crypto.randomUUID(),
      email_confirm: true,
    });

    if (authError || !authUser.user) {
      console.error("❌ Failed to create auth user:", authError?.message);
      process.exit(1);
    }
    userId = authUser.user.id;
  }

  // Create users record with role mis (password is a locked sentinel — account uses auth.admin only)
  const now = new Date().toISOString();
  const { error: userError } = await admin.from("users").insert({
    id: userId,
    email: SYSTEM_EMAIL,
    password: "*SYSTEM*",
    role: "mis",
    status: "active",
    email_verified: true,
    created_at: now,
    updated_at: now,
  });

  if (userError) {
    console.error("❌ Failed to create users record:", userError.message);
    process.exit(1);
  }

  // Get or create a system role
  let roleId: string;
  const { data: existingRole } = await admin
    .from("mis_roles")
    .select("id")
    .eq("name", "System")
    .maybeSingle();

  if (existingRole) {
    roleId = existingRole.id;
  } else {
    const { data: newRole, error: roleError } = await admin
      .from("mis_roles")
      .insert({ name: "System", description: "Internal system role for automated actions", is_active: true, created_by: userId, created_at: now, updated_at: now })
      .select("id")
      .single();

    if (roleError || !newRole) {
      console.error("❌ Failed to create system role:", roleError?.message);
      process.exit(1);
    }
    roleId = newRole.id;
  }

  // Create mis_user record
  const { error: misUserError } = await admin.from("mis_user").insert({
    user_id: userId,
    first_name: "System",
    last_name: "Account",
    email: SYSTEM_EMAIL,
    role_id: roleId,
    is_super_admin: false,
  });

  if (misUserError) {
    console.error("❌ Failed to create mis_user record:", misUserError.message);
    process.exit(1);
  }

  console.log(`✅ System MIS user created: ${userId}`);
  console.log(`\n📌 Add to your .env.local:\n   SYSTEM_MIS_USER_ID=${userId}\n`);
  console.log("✨ Done!\n");
}

seedSystemMisUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
