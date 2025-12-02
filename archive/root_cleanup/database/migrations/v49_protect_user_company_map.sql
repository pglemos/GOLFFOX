ALTER TABLE public.gf_user_company_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_map ON public.gf_user_company_map
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY insert_self_company ON public.gf_user_company_map
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY update_self_company ON public.gf_user_company_map
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY delete_self_company ON public.gf_user_company_map
FOR DELETE
USING (auth.uid() = user_id);

