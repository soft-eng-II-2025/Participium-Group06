import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchemaAndSeedData1710000000000 implements MigrationInterface {
  name = 'InitSchemaAndSeedData1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {

    // 1. Create StatusType enum
    await queryRunner.query(`
      CREATE TYPE "status_type_enum" AS ENUM(
          'Pending Approval',
          'Assigned',
          'In Progress',
          'Suspended',
          'Rejected',
          'Resolved'
      )
    `);

    // 2. Base tables
    await queryRunner.query(`
      CREATE TABLE "role" (
          "id" SERIAL PRIMARY KEY,
          "title" VARCHAR NOT NULL UNIQUE,
          "label" VARCHAR NOT NULL UNIQUE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "municipality_officer" (
          "id" SERIAL PRIMARY KEY,
          "username" VARCHAR NOT NULL UNIQUE,
          "email" VARCHAR NOT NULL UNIQUE,
          "password" VARCHAR NOT NULL,
          "first_name" VARCHAR NOT NULL,
          "last_name" VARCHAR NOT NULL,
          "role" INT,
          CONSTRAINT "FK_municipality_officer_role"
            FOREIGN KEY ("role") REFERENCES "role"("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user" (
          "id" SERIAL PRIMARY KEY,
          "username" VARCHAR NOT NULL UNIQUE,
          "email" VARCHAR NOT NULL UNIQUE,
          "password" VARCHAR NOT NULL,
          "first_name" VARCHAR NOT NULL,
          "last_name" VARCHAR NOT NULL,
          "photo" VARCHAR NOT NULL,
          "telegram_id" VARCHAR NOT NULL,
          "flag_email" BOOLEAN NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "category" (
          "id" SERIAL PRIMARY KEY,
          "name" VARCHAR NOT NULL UNIQUE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "report" (
          "id" SERIAL PRIMARY KEY,
          "longitude" REAL NOT NULL,
          "latitude" REAL NOT NULL,
          "title" VARCHAR NOT NULL,
          "description" VARCHAR NOT NULL,
          "status" "status_type_enum" NOT NULL,
          "explanation" VARCHAR NOT NULL,
          "officerId" INT,
          "userId" INT,
          "categoryId" INT,
          CONSTRAINT "FK_report_officer"
            FOREIGN KEY ("officerId") REFERENCES "municipality_officer"("id"),
          CONSTRAINT "FK_report_user"
            FOREIGN KEY ("userId") REFERENCES "user"("id"),
          CONSTRAINT "FK_report_category"
            FOREIGN KEY ("categoryId") REFERENCES "category"("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "report_photo" (
          "id" SERIAL PRIMARY KEY,
          "photo" VARCHAR NOT NULL,
          "reportId" INT,
          CONSTRAINT "FK_report_photo_report"
            FOREIGN KEY ("reportId") REFERENCES "report"("id") ON DELETE CASCADE
      )
    `);

    // 3. NEW: M2M join table for roles ←→ categories
    await queryRunner.query(`
      CREATE TABLE "role_categories" (
        "role_id" INT NOT NULL,
        "category_id" INT NOT NULL,
        PRIMARY KEY ("role_id","category_id"),
        CONSTRAINT "FK_role_categories_role"
            FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_role_categories_category"
            FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE
      )
    `);

    // 4. Seed roles
    await queryRunner.query(`
      INSERT INTO "role" ("id", "title", "label") VALUES
      (1,'ADMIN', 'Administrator'),
      (2,'ORGANIZATION_OFFICER', 'Organization Officer'),
      (3,'TECH_LEAD_INFRASTRUCTURE', 'Tech Lead, Infrastructure'),
      (4,'TECH_AGENT_INFRASTRUCTURE', 'Tech Agent, Infrastructure'),
      (5,'TECH_LEAD_MOBILITY', 'Tech Lead, Mobility'),
      (6,'TECH_AGENT_MOBILITY', 'Tech Agent, Mobility'),
      (7,'TECH_LEAD_GREEN_AREAS', 'Tech Lead, Green Areas'),
      (8,'TECH_AGENT_GREEN_AREAS', 'Tech Agent, Green Areas'),
      (9,'TECH_LEAD_WASTE_MANAGEMENT', 'Tech Lead, Waste Management'),
      (10,'TECH_AGENT_WASTE_MANAGEMENT', 'Tech Agent, Waste Management'),
      (11,'TECH_LEAD_ENERGY_LIGHTING', 'Tech Lead, Energy & Lighting'),
      (12,'TECH_AGENT_ENERGY_LIGHTING', 'Tech Agent, Energy & Lighting'),
      (13,'TECH_LEAD_PUBLIC_BUILDINGS', 'Tech Lead, Public Buildings'),
      (14,'TECH_AGENT_PUBLIC_BUILDINGS', 'Tech Agent, Public Buildings')
      ON CONFLICT ("id") DO NOTHING
    `);

    // 5. Seed categories
    await queryRunner.query(`
      INSERT INTO "category" ("id", "name") VALUES
      (1,'Water Supply – Drinking Water'),
      (2,'Architectural Barriers'),
      (3,'Sewer System'),
      (4,'Public Lighting'),
      (5,'Waste'),
      (6,'Road Signs and Traffic Lights'),
      (7,'Roads and Urban Furnishings'),
      (8,'Public Green Areas and Playgrounds'),
      (9,'Other')
      ON CONFLICT ("id") DO NOTHING
    `);

    // 6. Seed role-category assignments
    // ADMIN → ALL categories
    await queryRunner.query(`INSERT INTO role_categories SELECT 1, id FROM category`);
    // ORGANIZATION_OFFICER → ALL
    await queryRunner.query(`INSERT INTO role_categories SELECT 2, id FROM category`);

    // TECH_INFRA roles → [7, 2, 3, 1]
    await queryRunner.query(`INSERT INTO role_categories VALUES
      (3,7),(3,2),(3,3),(3,1),
      (4,7),(4,2),(4,3),(4,1)
    `);

    // TECH_MOBILITY → [6,7]
    await queryRunner.query(`INSERT INTO role_categories VALUES
      (5,6),(5,7),
      (6,6),(6,7)
    `);

    // TECH_GREEN_AREAS → [8]
    await queryRunner.query(`INSERT INTO role_categories VALUES
      (7,8),
      (8,8)
    `);

    // TECH_WASTE → [5,3]
    await queryRunner.query(`INSERT INTO role_categories VALUES
      (9,5),(9,3),
      (10,5),(10,3)
    `);

    // TECH_ENERGY_LIGHTING → [4]
    await queryRunner.query(`INSERT INTO role_categories VALUES
      (11,4),
      (12,4)
    `);

    // TECH_PUBLIC_BUILDINGS → [2,9]
    await queryRunner.query(`INSERT INTO role_categories VALUES
      (13,2),(13,9),
      (14,2),(14,9)
    `);

    // Admin officer
    await queryRunner.query(`
      INSERT INTO "municipality_officer"
        ("id","username","email","password","first_name","last_name","role")
      VALUES
        (1,'admin','admin@participium.local',
        '$argon2id$v=19$m=65536,t=3,p=1$6FOS86yBc3WowYzkpdqonQ$fuBmKGHx8IRs15LrImF8/baI15mxyfvGnTkUNyVDd6g',
        'System','Admin',1)
      ON CONFLICT ("id") DO NOTHING
    `);

    await queryRunner.query(`
      SELECT setval(pg_get_serial_sequence('"municipality_officer"','id'),
        GREATEST((SELECT COALESCE(MAX(id),0) FROM "municipality_officer"), 1), true);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "role_categories"`);
    await queryRunner.query(`DROP TABLE "report_photo"`);
    await queryRunner.query(`DROP TABLE "report"`);
    await queryRunner.query(`DROP TABLE "category"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "municipality_officer"`);
    await queryRunner.query(`DROP TABLE "role"`);
    await queryRunner.query(`DROP TYPE "status_type_enum"`);
  }
}
