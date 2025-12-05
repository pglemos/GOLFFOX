-- ====================================================
-- GolfFox Transport Management System
-- RLS Helper Functions Migration
-- Date: 2025-01-XX
-- ====================================================
-- This migration creates helper functions for RLS policies
-- These functions are used by RLS policies to check user roles and permissions

-- ====================================================
-- PART 1: HELPER FUNCTIONS FOR RLS
-- ====================================================

-- Function: Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Get role from current user's record in users table
  SELECT role INTO v_role
  FROM public.users
  WHERE id = auth.uid();
  
  RETURN COALESCE(v_role = 'admin', false);
END;
$$;

-- Function: Get current user's role
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM public.users
  WHERE id = auth.uid();
  
  RETURN v_role;
END;
$$;

-- Function: Get current user's company_id
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_company_id UUID;
BEGIN
  SELECT company_id INTO v_company_id
  FROM public.users
  WHERE id = auth.uid();
  
  RETURN v_company_id;
END;
$$;

-- Function: Get current user's carrier_id
-- Note: carrier_id is stored as TEXT in current schema, not UUID
CREATE OR REPLACE FUNCTION public.current_carrier_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_carrier_id TEXT;
BEGIN
  SELECT carrier_id INTO v_carrier_id
  FROM public.users
  WHERE id = auth.uid();
  
  RETURN v_carrier_id;
END;
$$;

-- Function: Get user by ID for login (used by auth API)
CREATE OR REPLACE FUNCTION public.get_user_by_id_for_login(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
  company_id UUID,
  transportadora_id TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.company_id,
    u.carrier_id as transportadora_id,
    u.avatar_url
  FROM public.users u
  WHERE u.id = p_user_id;
END;
$$;

-- ====================================================
-- PART 2: COMMENTS FOR DOCUMENTATION
-- ====================================================

COMMENT ON FUNCTION public.is_admin() IS 'Check if current authenticated user has admin role';
COMMENT ON FUNCTION public.current_role() IS 'Get current authenticated user role';
COMMENT ON FUNCTION public.current_company_id() IS 'Get current authenticated user company_id';
COMMENT ON FUNCTION public.current_carrier_id() IS 'Get current authenticated user carrier_id';
COMMENT ON FUNCTION public.get_user_by_id_for_login(p_user_id UUID) IS 'Get user data by ID for login API (bypasses RLS)';

-- ====================================================
-- END OF MIGRATION
-- ====================================================

