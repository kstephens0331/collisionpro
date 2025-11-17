# Database Migrations

This directory contains all SQL migrations for CollisionPro, organized by phase.

## Migration Rules

1. **One Markdown File Per SQL Migration**
   - Each SQL migration must have a corresponding `.md` documentation file
   - Documentation file must have the same name as SQL file (e.g., `2.6-labor-operations.sql` → `2.6-labor-operations.md`)

2. **Migration Naming Convention**
   - Format: `{phase}.{sub-phase}-{description}.sql`
   - Examples:
     - `2.1-estimate-schema.sql` (Phase 2, Sub-phase 1)
     - `2.6-labor-operations.sql` (Phase 2, Sub-phase 6)
     - `3.2-customer-portal.sql` (Phase 3, Sub-phase 2)

3. **Documentation Requirements**
   Each `.md` file must include:
   - **Phase**: Which phase this belongs to
   - **Sub-Phase**: Specific sub-phase number
   - **Purpose**: What this migration does
   - **Tables Created**: List of tables with brief description
   - **Tables Modified**: Any alterations to existing tables
   - **Indexes Created**: Performance indexes added
   - **Seed Data**: Any initial data inserted
   - **Dependencies**: Other migrations this depends on
   - **Rollback**: How to undo this migration (if needed)

4. **Phase Compilation**
   - At the end of each phase, create a compiled SQL file: `PHASE_{N}_FINAL.sql`
   - This file combines all individual migrations for the phase
   - Include proper ordering based on dependencies
   - This is the file that gets executed when deploying the phase

5. **Execution Order**
   - Migrations within a phase are executed in numerical order
   - Phase final files are executed in phase order (1, 2, 3, etc.)
   - Never skip migrations or execute out of order

## Directory Structure

```
migrations/
├── README.md (this file)
├── phase-1/
│   ├── 1.1-auth-schema.sql
│   ├── 1.1-auth-schema.md
│   ├── 1.2-shop-management.sql
│   ├── 1.2-shop-management.md
│   └── PHASE_1_FINAL.sql
├── phase-2/
│   ├── 2.1-estimate-schema.sql
│   ├── 2.1-estimate-schema.md
│   ├── 2.6-labor-operations.sql
│   ├── 2.6-labor-operations.md
│   ├── 2.7-shop-settings.sql
│   ├── 2.7-shop-settings.md
│   └── PHASE_2_FINAL.sql (created at phase completion)
├── phase-3/
│   └── ... (future)
└── ...
```

## How to Add a New Migration

1. Create the SQL file in the appropriate phase directory
2. Create the corresponding markdown documentation file
3. Fill out all required documentation sections
4. Test the migration locally
5. Add to the phase's tracking document
6. At phase completion, compile into `PHASE_{N}_FINAL.sql`

## Example Documentation File

See `phase-2/2.6-labor-operations.md` for a complete example.

## Running Migrations

### Individual Migration
```bash
# Via Supabase CLI
supabase db push migrations/phase-2/2.6-labor-operations.sql

# Via Node script (if available)
node scripts/run-migration.js migrations/phase-2/2.6-labor-operations.sql
```

### Phase Final
```bash
# At phase completion, run the compiled file
supabase db push migrations/phase-2/PHASE_2_FINAL.sql
```

## Migration Status Tracking

Track migration execution in `migrations/MIGRATION_LOG.md`:
- Which migrations have been run
- When they were run
- Environment (dev/staging/production)
- Who ran them
- Any issues encountered

---

**Last Updated**: January 2025
**Maintained By**: Development Team
