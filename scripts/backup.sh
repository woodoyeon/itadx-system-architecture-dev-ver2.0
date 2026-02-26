#!/bin/bash
# PostgreSQL backup script
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"
mkdir -p $BACKUP_DIR
docker exec itadx-postgres pg_dump -U itadx itadx_mvp | gzip > "$BACKUP_DIR/itadx_$DATE.sql.gz"
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
echo "Backup completed: itadx_$DATE.sql.gz"
