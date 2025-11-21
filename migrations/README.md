# Database Migrations

This directory contains all database schema migrations for CollisionPro.

## Quick Start

To set up Sprint 3 & 4 features (Technicians, DRP, Jobs, Accounting):

```bash
node scripts/run-sprints-3-4-migrations.js
```

## Migration Organization

Migrations are organized by development phase/sprint:

### Phase 5: Workflow & Operations (Sprint 3)
- `5.1-technician-management.sql` - Technician tracking with certifications
- `5.2-drp-integration.sql` - DRP partner compliance
- `5.3-job-tracking.sql` - Kanban workflow & bottleneck detection

### Phase 6: Integrated Accounting (Sprint 4)
- `6.1-integrated-accounting.sql` - Full double-entry accounting system

## Running Migrations

```bash
# Run all Sprint 3 & 4 migrations
node scripts/run-sprints-3-4-migrations.js

# Or individually:
node scripts/run-phase5-migrations.js
node scripts/run-accounting-migration.js
```

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Next Steps

After migration, visit:
- `/dashboard/technicians` - Technician management
- `/dashboard/drp` - DRP programs
- `/dashboard/jobs` - Job tracking
- `/dashboard/accounting` - Accounting system
