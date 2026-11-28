-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 004: Q-Simutron Connect, Private Customer Storage, OAuth Vault,
-- Explicit Consent Management, and Deletion Audit Trail
-- Idempotent, NON-DESTRUCTIVE, preserves existing tables, 002 RLS, and rows.
-- Review before executing in Supabase SQL Editor AFTER 001, 002, and 003.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Uploaded Files Indexes & Write Policies (preserves 002 SELECT policy) ─
CREATE INDEX IF NOT EXISTS idx_uploaded_files_org_created
    ON public.uploaded_files (organization_id, created_at DESC);

ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;

-- Note: public.uploaded_files SELECT policy ("uploaded_files_select_org_member")
-- already exists from 002_change1_rls_and_security.sql and is preserved as-is.
DROP POLICY IF EXISTS uploaded_files_insert_org_member ON public.uploaded_files;
CREATE POLICY uploaded_files_insert_org_member ON public.uploaded_files
    FOR INSERT TO authenticated
    WITH CHECK (
        (select auth.uid()) = user_id
        AND public.is_org_member(organization_id)
    );

DROP POLICY IF EXISTS uploaded_files_delete_org_member ON public.uploaded_files;
CREATE POLICY uploaded_files_delete_org_member ON public.uploaded_files
    FOR DELETE TO authenticated
    USING (
        ((select auth.uid()) = user_id AND public.is_org_member(organization_id))
        OR public.is_platform_admin()
    );

-- ── 2. Private Supabase Storage Bucket (`customer-uploads`) & Tenant Isolation ─
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'customer-uploads',
    'customer-uploads',
    false,
    10485760,
    ARRAY[
        'text/csv',
        'application/csv',
        'text/plain',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS customer_uploads_select_org ON storage.objects;
CREATE POLICY customer_uploads_select_org ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'customer-uploads'
        AND array_length(storage.foldername(name), 1) >= 2
        AND EXISTS (
            SELECT 1 FROM public.organization_memberships m
            WHERE m.organization_id::text = (storage.foldername(name))[1]
              AND m.user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS customer_uploads_insert_org ON storage.objects;
CREATE POLICY customer_uploads_insert_org ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'customer-uploads'
        AND array_length(storage.foldername(name), 1) >= 2
        AND EXISTS (
            SELECT 1 FROM public.organization_memberships m
            WHERE m.organization_id::text = (storage.foldername(name))[1]
              AND m.user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS customer_uploads_delete_org ON storage.objects;
CREATE POLICY customer_uploads_delete_org ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'customer-uploads'
        AND array_length(storage.foldername(name), 1) >= 2
        AND EXISTS (
            SELECT 1 FROM public.organization_memberships m
            WHERE m.organization_id::text = (storage.foldername(name))[1]
              AND m.user_id = (select auth.uid())
        )
    );

-- ── 3. Customer Data Sharing & Explicit Consent Preferences ───────────────────
CREATE TABLE IF NOT EXISTS public.data_consent_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    category text NOT NULL CHECK (
        category IN (
            'uploaded_files',
            'google_drive',
            'google_sheets',
            'business_dna',
            'competitor_intelligence',
            'financial_data',
            'enterprise_connectors'
        )
    ),
    granted boolean NOT NULL DEFAULT false,
    granted_at timestamptz,
    revoked_at timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (organization_id, user_id, category)
);

CREATE INDEX IF NOT EXISTS idx_consent_org_user
    ON public.data_consent_preferences (organization_id, user_id);

ALTER TABLE public.data_consent_preferences ENABLE ROW LEVEL SECURITY;

-- Server writes via service_role; users can read their own org-scoped preferences
DROP POLICY IF EXISTS consent_select_own ON public.data_consent_preferences;
CREATE POLICY consent_select_own ON public.data_consent_preferences
    FOR SELECT TO authenticated
    USING (
        ((select auth.uid()) = user_id AND public.is_org_member(organization_id))
        OR public.is_platform_admin()
    );

-- Preserved without ON DELETE CASCADE so consent audit history survives org cleanup
CREATE TABLE IF NOT EXISTS public.data_consent_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
    user_id uuid NOT NULL,
    category text NOT NULL,
    action text NOT NULL CHECK (action IN ('granted', 'revoked')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consent_audit_org_user
    ON public.data_consent_audit_log (organization_id, user_id, created_at DESC);

ALTER TABLE public.data_consent_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS consent_audit_select_own ON public.data_consent_audit_log;
CREATE POLICY consent_audit_select_own ON public.data_consent_audit_log
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = user_id OR public.is_platform_admin());

-- ── 4. Encrypted OAuth Integrations (Google Drive & Google Sheets) ──────────
CREATE TABLE IF NOT EXISTS public.oauth_integrations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    provider text NOT NULL CHECK (provider IN ('google_drive', 'google_sheets')),
    status text NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'revoked', 'error')),
    scopes text[] NOT NULL DEFAULT '{}',
    account_email text,
    encrypted_tokens jsonb NOT NULL DEFAULT '{}'::jsonb,
    selected_resources jsonb NOT NULL DEFAULT '[]'::jsonb,
    token_expires_at timestamptz,
    revoked_at timestamptz,
    last_error text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (organization_id, user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_oauth_integrations_org_user
    ON public.oauth_integrations (organization_id, user_id, provider);

ALTER TABLE public.oauth_integrations ENABLE ROW LEVEL SECURITY;

-- Strict protection of encrypted_tokens: all client reads/writes go through backend
-- endpoints; direct PostgREST access is restricted to platform admins only.
DROP POLICY IF EXISTS oauth_select_own ON public.oauth_integrations;
DROP POLICY IF EXISTS oauth_manage_own ON public.oauth_integrations;
DROP POLICY IF EXISTS oauth_select_admin ON public.oauth_integrations;
CREATE POLICY oauth_select_admin ON public.oauth_integrations
    FOR SELECT TO authenticated
    USING (public.is_platform_admin());

-- ── 5. Non-Sensitive Privacy Deletion Audit Trail ───────────────────────────
CREATE TABLE IF NOT EXISTS public.privacy_deletion_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status text NOT NULL CHECK (status IN ('completed', 'partial_failure', 'failed')),
    summary jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_privacy_deletion_org_user
    ON public.privacy_deletion_logs (organization_id, user_id, created_at DESC);

ALTER TABLE public.privacy_deletion_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS privacy_deletion_select_own ON public.privacy_deletion_logs;
CREATE POLICY privacy_deletion_select_own ON public.privacy_deletion_logs
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = user_id OR public.is_platform_admin());
