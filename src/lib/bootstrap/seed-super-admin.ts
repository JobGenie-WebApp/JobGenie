import bcrypt from "bcryptjs";
import { createAdminClient } from "../supabase/admin";
import { DEFAULT_PERMISSIONS } from "../mis/default-permissions";

/**
 * Auto-bootstrap the first super MIS admin on server startup.
 *
 * Called from `src/instrumentation.ts` (Next.js `register()`), in the nodejs runtime.
 *
 * Behaviour:
 *  - Idempotent: does nothing if a super admin already exists.
 *  - Reads credentials from env vars; if they are missing it logs and returns.
 *  - Seeds the full `mis_permissions` catalog (so role management has the full list).
 *  - Creates a `mis_user` with `is_super_admin = true`, which grants ALL permissions
 *    via the super-admin bypass in `src/lib/permissions.ts`.
 *  - All errors are caught and logged — seeding never crashes the server.
 */

// Process-level guard: run at most once per server process even if register()
// fires more than once (e.g. multiple workers / fast refresh).
let inflight: Promise<void> | null = null;

const LOG_PREFIX = "[seed-super-admin]";

export function ensureSuperAdmin(): Promise<void> {
  if (!inflight) {
    inflight = run().catch((error) => {
      console.error(`${LOG_PREFIX} ❌ Unexpected error:`, error);
    });
  }
  return inflight;
}

async function run(): Promise<void> {
  const email = process.env.MIS_SUPERADMIN_EMAIL?.trim();
  const password = process.env.MIS_SUPERADMIN_PASSWORD;
  const firstName = process.env.MIS_SUPERADMIN_FIRST_NAME?.trim() || "Super";
  const lastName = process.env.MIS_SUPERADMIN_LAST_NAME?.trim() || "Admin";

  if (!email || !password) {
    console.log(
      `${LOG_PREFIX} ⏭️  MIS_SUPERADMIN_EMAIL / MIS_SUPERADMIN_PASSWORD not set — skipping super admin bootstrap.`
    );
    return;
  }

  const admin = createAdminClient();

  // 1. Skip if a super admin already exists.
  const { data: existingSuperAdmin, error: existingError } = await admin
    .from("mis_user")
    .select("user_id")
    .eq("is_super_admin", true)
    .limit(1)
    .maybeSingle();

  if (existingError) {
    console.error(`${LOG_PREFIX} ❌ Failed to check for existing super admin:`, existingError.message);
    return;
  }

  if (existingSuperAdmin) {
    console.log(`${LOG_PREFIX} ✅ Super admin already exists (${existingSuperAdmin.user_id}) — nothing to do.`);
    return;
  }

  // 2. Ensure the permissions catalog is fully seeded (idempotent).
  await seedPermissions(admin);

  // 3. Create the super admin user.
  await createSuperAdmin(admin, { email, password, firstName, lastName });
}

type AdminClient = ReturnType<typeof createAdminClient>;

async function seedPermissions(admin: AdminClient): Promise<void> {
  let created = 0;

  for (const permission of DEFAULT_PERMISSIONS) {
    const name = `${permission.resource}.${permission.action}`;

    const { data: existing } = await admin
      .from("mis_permissions")
      .select("id")
      .eq("resource", permission.resource)
      .eq("action", permission.action)
      .maybeSingle();

    if (existing) continue;

    const { error } = await admin.from("mis_permissions").insert({
      name,
      resource: permission.resource,
      action: permission.action,
      description: permission.description,
    });

    if (error) {
      // Tolerate "already exists" races (unique constraint on resource+action).
      console.error(`${LOG_PREFIX} ⚠️  Failed to create permission ${name}:`, error.message);
    } else {
      created++;
    }
  }

  console.log(`${LOG_PREFIX} 🔑 Permissions catalog synced (${created} created).`);
}

async function createSuperAdmin(
  admin: AdminClient,
  creds: { email: string; password: string; firstName: string; lastName: string }
): Promise<void> {
  const { email, password, firstName, lastName } = creds;
  const now = new Date().toISOString();

  // Find or create the Supabase Auth user.
  let userId: string;
  const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existingAuthUser = listData?.users?.find((u) => u.email === email);

  if (existingAuthUser) {
    userId = existingAuthUser.id;
    console.log(`${LOG_PREFIX} ℹ️  Auth user already exists: ${userId}`);
  } else {
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { user_type: "mis" },
    });

    if (authError || !authUser?.user) {
      console.error(`${LOG_PREFIX} ❌ Failed to create auth user:`, authError?.message);
      return;
    }
    userId = authUser.user.id;
  }

  // Ensure a `users` row (role mis, active). Tolerate existing row.
  const hashedPassword = await bcrypt.hash(password, 12);
  const { data: existingUser } = await admin
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!existingUser) {
    const { error: userError } = await admin.from("users").insert({
      id: userId,
      email,
      password: hashedPassword,
      role: "mis",
      status: "active",
      email_verified: true,
      created_at: now,
      updated_at: now,
    });

    if (userError) {
      console.error(`${LOG_PREFIX} ❌ Failed to create users record:`, userError.message);
      return;
    }
  }

  // Ensure a `mis_user` row with is_super_admin = true. Tolerate existing row.
  const { data: existingMisUser } = await admin
    .from("mis_user")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingMisUser) {
    const { error: updateError } = await admin
      .from("mis_user")
      .update({ is_super_admin: true, updated_at: now })
      .eq("user_id", userId);

    if (updateError) {
      console.error(`${LOG_PREFIX} ❌ Failed to promote existing mis_user:`, updateError.message);
      return;
    }
  } else {
    const { error: misUserError } = await admin.from("mis_user").insert({
      user_id: userId,
      first_name: firstName,
      last_name: lastName,
      email,
      role_id: null,
      is_super_admin: true,
      created_at: now,
      updated_at: now,
    });

    if (misUserError) {
      console.error(`${LOG_PREFIX} ❌ Failed to create mis_user record:`, misUserError.message);
      return;
    }
  }

  console.log(`${LOG_PREFIX} ✅ Super MIS admin ready: ${email} (${userId}).`);
}
