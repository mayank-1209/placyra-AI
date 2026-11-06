#!/bin/bash
# ==============================================================================
# Placyra: Automated MySQL 8.0 Backup Script
# ==============================================================================
set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/placyra_backup_${TIMESTAMP}.sql.gz"

DB_HOST="${MYSQL_HOST:-localhost}"
DB_PORT="${MYSQL_PORT:-3306}"
DB_NAME="${MYSQL_DATABASE:-placyra_db}"
DB_USER="${MYSQL_USER:-placyra_user}"
DB_PASS="${MYSQL_PASSWORD:-placyra_secret_pass}"

mkdir -p "$BACKUP_DIR"
echo "Starting MySQL 8.0 backup for database '$DB_NAME'..."

if command -v docker &> /dev/null && docker ps | grep -q placyra_mysql; then
    echo "Backing up via running Docker container 'placyra_mysql'..."
    docker exec placyra_mysql mysqldump \
        --user="$DB_USER" \
        --password="$DB_PASS" \
        --single-transaction \
        --quick \
        --default-character-set=utf8mb4 \
        "$DB_NAME" | gzip > "$BACKUP_FILE"
elif command -v mysqldump &> /dev/null; then
    echo "Backing up via host mysqldump utility..."
    mysqldump \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASS" \
        --single-transaction \
        --quick \
        --default-character-set=utf8mb4 \
        "$DB_NAME" | gzip > "$BACKUP_FILE"
else
    echo "ERROR: Neither docker 'placyra_mysql' container nor host mysqldump found."
    exit 1
fi

echo "=================================================="
echo "Backup successfully created: $BACKUP_FILE"
echo "Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"
echo "=================================================="
