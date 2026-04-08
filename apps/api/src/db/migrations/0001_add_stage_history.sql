-- Add stage_history column to contents table
ALTER TABLE contents ADD COLUMN IF NOT EXISTS stage_history jsonb NOT NULL DEFAULT '[]';
