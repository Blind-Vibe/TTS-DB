#!/usr/bin/env bash
set -euo pipefail

# Deployment script for Train Station Dashboard
# Usage: ./scripts/deploy.sh

if [ -f .env.production ]; then
  echo "Loading production environment"
  set -a
  source .env.production
  set +a
fi

npm run build

# Example Supabase migration (optional)
if command -v supabase >/dev/null 2>&1; then
  supabase db push
fi

# Start application using PM2 for monitoring
if command -v pm2 >/dev/null 2>&1; then
  pm2 serve dist 4173 --name trainstation-dashboard --spa || pm2 restart trainstation-dashboard
fi

echo "Deployment completed"
