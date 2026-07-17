#!/usr/bin/env bash
set -euo pipefail

if [ -f ".env" ]; then
  set -a
  . ./.env
  set +a
fi

: "${FTP_HOST:?Missing FTP_HOST}"
: "${FTP_USER:?Missing FTP_USER}"
: "${FTP_PASS:?Missing FTP_PASS}"
FTP_REMOTE_DIR="${FTP_REMOTE_DIR:-/}"

if [ ! -d "public" ]; then
  echo "public/ not found. Run pnpm build first."
  exit 1
fi

if ! command -v lftp >/dev/null 2>&1; then
  echo "lftp is required. Install with: brew install lftp"
  exit 1
fi

lftp -u "${FTP_USER}","${FTP_PASS}" "sftp://${FTP_HOST}" <<EOF
set sftp:auto-confirm yes
mirror -R --verbose public "${FTP_REMOTE_DIR}"
quit
EOF
