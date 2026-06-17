-- Migration: Update Seniority Levels to match application
-- This migration updates the seniority_levels table to include all 6 levels
-- and remaps existing job designations to the new structure

BEGIN;

-- Store old designations temporarily
CREATE TEMP TABLE temp_old_designations AS
SELECT designation_id, level_id as old_level_id
FROM job_designations;

-- Update existing designations to new level mapping before clearing seniority_levels
-- Old level 1 (Junior) -> New level 2 (Junior)
-- Old level 2 (Mid) -> New level 3 (Mid Level)
-- Old level 3 (Senior) -> New level 4 (Senior)
UPDATE job_designations
SET level_id = CASE 
    WHEN level_id = 1 THEN 2  -- Junior -> Junior
    WHEN level_id = 2 THEN 3  -- Mid -> Mid Level
    WHEN level_id = 3 THEN 4  -- Senior -> Senior
    ELSE level_id
END;

-- Clear existing seniority levels
DELETE FROM seniority_levels;

-- Insert new seniority levels structure
INSERT INTO seniority_levels (level_id, level_name, level_order) VALUES
(1, 'Entry Level', 1),
(2, 'Junior', 2),
(3, 'Mid Level', 3),
(4, 'Senior', 4),
(5, 'Lead', 5),
(6, 'Principal', 6);

COMMIT;
