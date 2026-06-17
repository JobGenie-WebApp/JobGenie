import { getServerSql } from "@/lib/db/server-postgres";

export type CandidateRegistrationDirectResult =
    | { ok: true }
    | { ok: false; reason: "no_database_url" | "db_error"; message?: string };

export async function insertCandidateRegistrationDirect(params: {
    userId: string;
    email: string;
    hashedPassword: string;
    verificationCode: string;
    verificationExpiresAt: Date;
    firstName: string;
    lastName: string;
    nicPassport: string;
    gender: string;
    dateOfBirth: string;
    address: string;
    contactNo: string;
}): Promise<CandidateRegistrationDirectResult> {
    const sql = getServerSql();
    if (!sql) {
        return { ok: false, reason: "no_database_url" };
    }

    const now = new Date();
    const yearSuffix = now.getFullYear().toString().slice(-2);
    const yearPrefix = `JG-${yearSuffix}-`;
    const likePattern = `${yearPrefix}%`;

    try {
        await sql.begin(async (tx) => {
            await tx`
                INSERT INTO "users" (
                    "id",
                    "email",
                    "password",
                    "role",
                    "status",
                    "email_verified",
                    "email_verification_token",
                    "verification_token_expires_at",
                    "created_at",
                    "updated_at"
                ) VALUES (
                    ${params.userId}::uuid,
                    ${params.email},
                    ${params.hashedPassword},
                    ${"candidate"}::"UserRole",
                    ${"pending_verification"}::"UserStatus",
                    false,
                    ${params.verificationCode},
                    ${params.verificationExpiresAt},
                    ${now},
                    ${now}
                )
            `;

            const lastRows = await tx`
                SELECT "membership_no"
                FROM "candidates"
                WHERE "membership_no" IS NOT NULL
                  AND "membership_no" LIKE ${likePattern}
                ORDER BY "membership_no" DESC
                LIMIT 1
            `;

            let nextSequence = 1;
            const row = lastRows[0] as { membership_no: string } | undefined;
            const lastMembershipNo = row?.membership_no;
            if (lastMembershipNo) {
                const sequencePart = lastMembershipNo.split("-")[2];
                if (sequencePart) {
                    const n = parseInt(sequencePart, 10);
                    if (!Number.isNaN(n)) nextSequence = n + 1;
                }
            }
            const membershipNumber = `${yearPrefix}${nextSequence.toString().padStart(6, "0")}`;

            await tx`
                INSERT INTO "candidates" (
                    "user_id",
                    "first_name",
                    "last_name",
                    "nicPassport",
                    "gender",
                    "dob",
                    "address",
                    "contact_no",
                    "phone",
                    "email",
                    "current_position",
                    "industry",
                    "membership_no",
                    "created_at",
                    "updated_at"
                ) VALUES (
                    ${params.userId}::uuid,
                    ${params.firstName},
                    ${params.lastName},
                    ${params.nicPassport},
                    ${params.gender}::"Gender",
                    ${params.dateOfBirth}::date,
                    ${params.address},
                    ${params.contactNo},
                    ${params.contactNo},
                    ${params.email},
                    ${""},
                    ${""},
                    ${membershipNumber},
                    ${now},
                    ${now}
                )
            `;
        });
        return { ok: true };
    } catch (e) {
        console.error("insertCandidateRegistrationDirect:", e);
        return {
            ok: false,
            reason: "db_error",
            message: e instanceof Error ? e.message : String(e),
        };
    }
}
