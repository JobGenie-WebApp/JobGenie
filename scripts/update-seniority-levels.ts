import { createAdminClient } from "../src/lib/supabase/admin";

async function updateSeniorityLevels() {
    console.log("Starting seniority levels migration...");
    
    const adminClient = createAdminClient();

    try {
        // Step 1: Update existing job_designations to new level mapping
        console.log("Step 1: Remapping existing job designations...");
        
        // We need to do this carefully to avoid foreign key violations
        // First, get all current designations
        const { data: currentDesignations, error: fetchError } = await adminClient
            .from("job_designations")
            .select("designation_id, level_id");

        if (fetchError) {
            console.error("Error fetching designations:", fetchError);
            throw fetchError;
        }

        console.log(`Found ${currentDesignations?.length || 0} designations to update`);

        // Step 2: Temporarily disable foreign key constraints (if possible) or update in order
        // For Supabase, we'll update the designations first
        const levelMapping: Record<number, number> = {
            1: 2, // Old Junior -> New Junior
            2: 3, // Old Mid -> New Mid Level  
            3: 4, // Old Senior -> New Senior
        };

        for (const designation of currentDesignations || []) {
            const newLevelId = levelMapping[designation.level_id];
            if (newLevelId) {
                const { error: updateError } = await adminClient
                    .from("job_designations")
                    .update({ level_id: newLevelId })
                    .eq("designation_id", designation.designation_id);

                if (updateError) {
                    console.error(`Error updating designation ${designation.designation_id}:`, updateError);
                }
            }
        }

        console.log("Step 2: Clearing old seniority levels...");
        
        // Delete old levels
        const { error: deleteError } = await adminClient
            .from("seniority_levels")
            .delete()
            .neq("level_id", 0); // Delete all

        if (deleteError) {
            console.error("Error deleting old levels:", deleteError);
            throw deleteError;
        }

        console.log("Step 3: Inserting new seniority levels...");

        // Insert new levels
        const newLevels = [
            { level_id: 1, level_name: "Entry Level", level_order: 1 },
            { level_id: 2, level_name: "Junior", level_order: 2 },
            { level_id: 3, level_name: "Mid Level", level_order: 3 },
            { level_id: 4, level_name: "Senior", level_order: 4 },
            { level_id: 5, level_name: "Lead", level_order: 5 },
            { level_id: 6, level_name: "Principal", level_order: 6 },
        ];

        const { error: insertError } = await adminClient
            .from("seniority_levels")
            .insert(newLevels);

        if (insertError) {
            console.error("Error inserting new levels:", insertError);
            throw insertError;
        }

        console.log("✅ Migration completed successfully!");

        // Verify the results
        const { data: verifyLevels } = await adminClient
            .from("seniority_levels")
            .select("*")
            .order("level_id");

        console.log("\n📋 Current Seniority Levels:");
        console.table(verifyLevels);

        const { data: verifyDesignations } = await adminClient
            .from("job_designations")
            .select(`
                designation_name,
                seniority_level:seniority_levels(level_name)
            `)
            .limit(5);

        console.log("\n📋 Sample Designations (first 5):");
        console.table(verifyDesignations);

    } catch (error) {
        console.error("❌ Migration failed:", error);
        throw error;
    }
}

updateSeniorityLevels()
    .then(() => {
        console.log("\n✅ All done!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Migration failed:", error);
        process.exit(1);
    });
