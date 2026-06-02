-- Extend role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'superadmin';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'client';
