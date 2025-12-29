# Backup System Documentation

This application provides two types of backup mechanisms:

## 1. User-Level Backup (Individual Data Export)

Allows authenticated users to export their own data in JSON format through the API.

### Endpoint
```
GET /api/backup
```

### Authentication
Requires valid JWT token in Authorization header.

### Usage
```bash
# Get JWT token by logging in
TOKEN=$(curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"myuser","password":"mypassword"}' \
  | jq -r '.token')

# Create user-level backup
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/backup > my_backup.json
```

### Response Format
```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "createdAt": "2024-01-15T10:30:00"
  },
  "characters": [
    {
      "id": 1,
      "name": "Aragorn",
      "createdAt": "2024-01-15T11:00:00",
      "currentYear": 3692,
      "currentDay": 150,
      "inventory": [
        {
          "id": 1,
          "category": "Weapons",
          "item": "Longsword",
          "description": "A finely crafted blade",
          "quantity": 1,
          "priceInCopper": 50000,
          "weight": 1.5,
          "removed": false,
          "createdAt": "2024-01-15T11:15:00",
          "updatedAt": "2024-01-15T11:15:00"
        }
      ]
    }
  ],
  "backupDate": "2024-01-20T14:30:00"
}
```

### Features
- ✅ User can only access their own data
- ✅ Includes all characters and inventory items
- ✅ Preserves soft-deleted items with removal history
- ✅ Human-readable JSON format
- ✅ No server access required
- ✅ GDPR compliant (data portability)

---

## 2. System-Level Backup (Full Database Backup)

Creates complete PostgreSQL database backups using `pg_dump`. Requires special system token.

### Endpoints

#### Create Backup
```
POST /api/system/backup
Header: X-System-Token: <your-system-token>
```

#### List Backups
```
GET /api/system/backup
Header: X-System-Token: <your-system-token>
```

#### Download Backup
```
GET /api/system/backup/download/{filename}
Header: X-System-Token: <your-system-token>
```

#### Cleanup Old Backups
```
DELETE /api/system/backup/cleanup?keep=5
Header: X-System-Token: <your-system-token>
```

### Setup

1. **Set System Backup Token** (required to enable system backups):

   ```bash
   # In docker-compose.yml or .env file
   export SYSTEM_BACKUP_TOKEN="your-secret-token-here"
   ```

2. **Configure Backup Directory** (optional, defaults to `/tmp/backups`):

   Add to `application.properties`:
   ```properties
   backup.directory=/var/backups/inventory
   ```

3. **Mount Backup Volume** (recommended):

   In `docker-compose.yml`:
   ```yaml
   backend:
     volumes:
       - backup-data:/var/backups/inventory
   
   volumes:
     backup-data:
   ```

### Usage Examples

#### Create a Database Backup
```bash
curl -X POST http://localhost:8080/api/system/backup \
  -H "X-System-Token: your-secret-token-here"

# Response:
# {
#   "status": "success",
#   "backupFile": "inventory_backup_2024-01-20_14-30-00.sql",
#   "backupPath": "/tmp/backups/inventory_backup_2024-01-20_14-30-00.sql"
# }
```

#### List All Backups
```bash
curl http://localhost:8080/api/system/backup \
  -H "X-System-Token: your-secret-token-here"

# Response:
# {
#   "status": "success",
#   "count": 3,
#   "backups": [
#     "inventory_backup_2024-01-20_14-30-00.sql",
#     "inventory_backup_2024-01-19_10-15-00.sql",
#     "inventory_backup_2024-01-18_09-00-00.sql"
#   ]
# }
```

#### Download a Backup
```bash
curl http://localhost:8080/api/system/backup/download/inventory_backup_2024-01-20_14-30-00.sql \
  -H "X-System-Token: your-secret-token-here" \
  -o backup.sql
```

#### Cleanup Old Backups (Keep 5 Most Recent)
```bash
curl -X DELETE "http://localhost:8080/api/system/backup/cleanup?keep=5" \
  -H "X-System-Token: your-secret-token-here"
```

### Manual Backup via Docker

You can also create backups manually using Docker commands:

```bash
# Create backup
docker exec inventory-postgres pg_dump -U inventory -d inventory -F c -f /tmp/backup.sql

# Copy backup out of container
docker cp inventory-postgres:/tmp/backup.sql ./backup.sql

# Restore from backup
docker exec -i inventory-postgres pg_restore -U inventory -d inventory -c /tmp/backup.sql
```

### Automated Backups

For production environments, consider setting up automated backups:

#### Option 1: Cron Job (Linux/macOS)
```bash
# Add to crontab (daily backup at 2 AM)
0 2 * * * curl -X POST http://localhost:8080/api/system/backup \
  -H "X-System-Token: your-secret-token-here" >> /var/log/backup.log 2>&1
```

#### Option 2: Docker Volume Backup
```bash
# Backup the entire PostgreSQL volume
docker run --rm \
  -v inventory_postgres-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres-volume-backup.tar.gz /data
```

### Security Considerations

1. **System Token**: Keep your `SYSTEM_BACKUP_TOKEN` secret. Do not commit it to version control.
2. **Access Control**: System backup endpoints are only accessible with the correct token.
3. **Network Security**: In production, ensure these endpoints are only accessible from trusted networks.
4. **Encryption**: Consider encrypting backup files at rest, especially if they contain sensitive data.

### Backup File Format

System backups are created in PostgreSQL custom format (`.sql` files using `pg_dump -F c`):
- ✅ Compressed for smaller file size
- ✅ Can be restored selectively
- ✅ Includes full schema and data
- ✅ Platform-independent

### Restore from Backup

To restore from a system backup:

```bash
# Using pg_restore
docker exec -i inventory-postgres pg_restore \
  -U inventory -d inventory -c /path/to/backup.sql

# Or via the container
docker cp backup.sql inventory-postgres:/tmp/
docker exec inventory-postgres pg_restore \
  -U inventory -d inventory -c /tmp/backup.sql
```

---

## Comparison: User-Level vs System-Level

| Feature | User-Level | System-Level |
|---------|------------|--------------|
| **Purpose** | Individual data export | Full database backup |
| **Format** | JSON | PostgreSQL dump |
| **Authentication** | JWT token | System token |
| **Scope** | Single user's data | Entire database |
| **Size** | Small (KB-MB) | Large (MB-GB) |
| **Portability** | Very portable | Platform-specific |
| **Restore** | Manual import | `pg_restore` |
| **Use Case** | GDPR, data portability | Disaster recovery |
| **Access** | All users | Administrators only |

---

## Best Practices

1. **Regular Backups**: Schedule system-level backups daily or more frequently based on data change rate.
2. **Retention Policy**: Keep multiple backup versions (e.g., last 7 days, last 4 weeks, last 12 months).
3. **Off-site Storage**: Store backups in a different location than the primary database.
4. **Test Restores**: Regularly test backup restoration to ensure backups are valid.
5. **Monitor Backup Size**: Track backup file sizes to detect issues early.
6. **Secure Storage**: Protect backup files with appropriate permissions and encryption.

---

## Troubleshooting

### System Backup Not Working

**Problem**: Getting 403 Forbidden on system backup endpoints

**Solution**: Ensure `SYSTEM_BACKUP_TOKEN` environment variable is set:
```bash
docker-compose exec backend env | grep SYSTEM_BACKUP_TOKEN
```

### pg_dump Command Not Found

**Problem**: Error "pg_dump failed" or command not found

**Solution**: Install PostgreSQL client tools in the backend container. Update `backend/Dockerfile`:
```dockerfile
RUN apt-get update && apt-get install -y postgresql-client
```

### Backup Directory Not Writable

**Problem**: Error creating backup file

**Solution**: Ensure backup directory has write permissions:
```bash
docker-compose exec backend mkdir -p /tmp/backups
docker-compose exec backend chmod 777 /tmp/backups
```

### Large Backup Files

**Problem**: Backup files are too large

**Solution**: 
- Use compression (already enabled with `-F c` flag)
- Implement backup rotation to delete old backups
- Consider incremental backups for very large databases
