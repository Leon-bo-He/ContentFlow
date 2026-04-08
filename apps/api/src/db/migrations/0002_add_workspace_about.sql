-- Add about column to workspaces table
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS about text;
