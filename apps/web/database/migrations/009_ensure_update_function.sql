-- ====================================================
-- GolfFox Transport Management System
-- Ensure update_updated_at_column Function Exists
-- Date: 2025-01-XX
-- ====================================================
-- This migration ensures the update_updated_at_column function exists
-- This function is used by triggers to automatically update updated_at columns

-- ====================================================
-- CREATE FUNCTION
-- ====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ====================================================
-- COMMENTS FOR DOCUMENTATION
-- ====================================================

COMMENT ON FUNCTION public.update_updated_at_column() IS 
'Trigger function to automatically update updated_at column to current timestamp when row is updated.';

-- ====================================================
-- END OF MIGRATION
-- ====================================================

