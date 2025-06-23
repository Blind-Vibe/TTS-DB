# Admin Guide - Settings & Configuration

## 📋 Overview

This guide outlines how to manage user roles and configure system settings in the **Train Station Dashboard**. It complements the security documentation and provides practical steps for administrators.

## 🔑 User Roles

The application defines five roles:

- `super_admin` – full access to all features and configuration
- `admin` – manages events, finances, and user accounts
- `manager` – handles venue operations and analytics
- `staff` – performs day-to-day operational tasks
- `viewer` – read-only access

Roles and permissions are defined in `src/contexts/AuthContext.tsx` and enforced via database policies.

### Updating Roles

1. **Check the current role**

```sql
SELECT email, role
FROM user_profiles
WHERE email = 'user@example.com';
```

2. **Change the role**

```sql
UPDATE user_profiles
SET role = 'manager'
WHERE email = 'user@example.com';
```

3. **Audit the change**

```sql
SELECT *
FROM audit_logs
WHERE action = 'UPDATE'
  AND table_name = 'user_profiles'
ORDER BY created_at DESC
LIMIT 5;
```

## ⚙️ System Configuration

System-level options are stored in environment variables. Copy `env.template` to `.env.local` and edit the values:

```bash
cp env.template .env.local
```

Update `.env.local` with your Supabase keys, third-party API credentials, and feature flags. Restart the server for changes to take effect.

### Feature Flags

Set these flags to `true` or `false` to enable or disable optional modules:

```
VITE_ENABLE_GAMIFICATION
VITE_ENABLE_SOCIAL_MEDIA_SCHEDULING
VITE_ENABLE_AI_CONTENT_GENERATION
VITE_ENABLE_VENUE_BOOKING
VITE_ENABLE_FAN_ENGAGEMENT
```

## 🛠️ Advanced Settings

Additional security settings are stored in the `security_settings` column of `user_profiles`. Example update:

```sql
UPDATE user_profiles
SET security_settings = jsonb_build_object(
  'sessionTimeout', 30,
  'maxSessions', 5,
  'twoFactorEnabled', true
)
WHERE email = 'user@example.com';
```

## ✅ Next Steps

You can now manage feature flags and advanced security options directly in the Dashboard. Navigate to **Settings → System Settings** in the sidebar. Role management is still handled through the **User Roles** page or database queries.

