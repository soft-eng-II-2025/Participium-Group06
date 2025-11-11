import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * SeedInitialData
 *
 * What this migration does:
 *  - Inserts 20 roles (id + title).
 *  - Inserts categories using the exact names from the project spec/PDF.
 *  - Inserts an initial admin (MunicipalityOfficer) with a bcrypt hashed password.
 *  - Idempotent (ON CONFLICT DO NOTHING) + sequences realignment.
 *
 * IMPORTANT:
 *  - TypeORM entity hooks do NOT run in raw SQL migrations -> the admin row must already contain a bcrypt hash.
 *  - You can change the seeded admin email/username if needed.
 */
export class SeedInitialData1710000000000 implements MigrationInterface {
    name = 'SeedInitialData1710000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // -------------------- ROLES --------------------
        await queryRunner.query(`
      INSERT INTO "role" ("id","title") VALUES
        (1,'ADMIN'),
        (2,'ORGANIZATION_OFFICER'),
        (3,'TECH_LEAD_INFRASTRUCTURE'),
        (4,'TECH_AGENT_INFRASTRUCTURE'),
        (5,'TECH_LEAD_GREEN_AREAS'),
        (6,'TECH_AGENT_GREEN_AREAS'),
        (7,'TECH_LEAD_ENVIRONMENTAL_QUALITY'),
        (8,'TECH_AGENT_ENVIRONMENTAL_QUALITY'),
        (9,'TECH_LEAD_URBAN_PLANNING'),
        (10,'TECH_AGENT_URBAN_PLANNING'),
        (11,'TECH_LEAD_PRIVATE_BUILDINGS'),
        (12,'TECH_AGENT_PRIVATE_BUILDINGS'),
        (13,'TECH_LEAD_PUBLIC_BUILDINGS'),
        (14,'TECH_AGENT_PUBLIC_BUILDINGS'),
        (15,'TECH_LEAD_ENERGY_LIGHTING'),
        (16,'TECH_AGENT_ENERGY_LIGHTING'),
        (17,'TECH_LEAD_MOBILITY_TRANSPORT'),
        (18,'TECH_AGENT_MOBILITY_TRANSPORT'),
        (19,'TECH_LEAD_WASTE_MANAGEMENT'),
        (20,'TECH_AGENT_WASTE_MANAGEMENT')
      ON CONFLICT ("id") DO NOTHING;
    `);

        await queryRunner.query(`
      SELECT setval(pg_get_serial_sequence('"role"','id'),
                    GREATEST((SELECT COALESCE(MAX(id),0) FROM "role"), 1),
                    true);
    `);

        // -------------------- CATEGORIES (from PDF) --------------------
        await queryRunner.query(`
      INSERT INTO "category" ("id","name") VALUES
        (1,'Water Supply – Drinking Water'),
        (2,'Architectural Barriers'),
        (3,'Sewer System'),
        (4,'Public Lighting'),
        (5,'Waste'),
        (6,'Road Signs and Traffic Lights'),
        (7,'Roads and Urban Furnishings'),
        (8,'Public Green Areas and Playgrounds'),
        (9,'Other')
      ON CONFLICT ("id") DO NOTHING;
    `);

        await queryRunner.query(`
      SELECT setval(pg_get_serial_sequence('"category"','id'),
                    GREATEST((SELECT COALESCE(MAX(id),0) FROM "category"), 1),
                    true);
    `);

        // -------------------- INITIAL ADMIN --------------------
        /**
         * The password below is the bcrypt hash you generated for 'Admin#2025!'
         */
        await queryRunner.query(`
      INSERT INTO "municipality_officer"
        ("id","username","email","password","first_name","last_name","role")
      VALUES
        (1,'admin','admin@participium.local',
         '$argon2id$v=19$m=65536,t=3,p=1$6FOS86yBc3WowYzkpdqonQ$fuBmKGHx8IRs15LrImF8/baI15mxyfvGnTkUNyVDd6g',
         'System','Admin',1)
      ON CONFLICT ("id") DO NOTHING;
    `);

        await queryRunner.query(`
      SELECT setval(pg_get_serial_sequence('"municipality_officer"','id'),
                    GREATEST((SELECT COALESCE(MAX(id),0) FROM "municipality_officer"), 1),
                    true);
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "municipality_officer" WHERE id = 1;`);
        await queryRunner.query(`DELETE FROM "category" WHERE id IN (1,2,3,4,5,6,7,8,9);`);
        await queryRunner.query(`DELETE FROM "role" WHERE id BETWEEN 1 AND 20;`);
    }
}
