import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchemaUpdated1710000000000 implements MigrationInterface {
    name = "InitSchemaUpdated1710000000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // CATEGORY
        await queryRunner.query(`
            CREATE TABLE "category" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL UNIQUE,
                CONSTRAINT "PK_category_id" PRIMARY KEY ("id")
            )
        `);

        // ROLE
        await queryRunner.query(`
            CREATE TABLE "role" (
                "id" SERIAL NOT NULL,
                "title" character varying NOT NULL UNIQUE,
                CONSTRAINT "PK_role_id" PRIMARY KEY ("id")
            )
        `);

        // USER
        await queryRunner.query(`
            CREATE TABLE "user" (
                "id" SERIAL NOT NULL,
                "username" character varying NOT NULL UNIQUE,
                "email" character varying NOT NULL UNIQUE,
                "password" character varying NOT NULL,
                "first_name" character varying NOT NULL,
                "last_name" character varying NOT NULL,
                "photo" character varying NOT NULL,
                "telegram_id" character varying NOT NULL,
                "flag_email" boolean NOT NULL,
                CONSTRAINT "PK_user_id" PRIMARY KEY ("id")
            )
        `);

        // MUNICIPALITY_OFFICER
        await queryRunner.query(`
            CREATE TABLE "municipality_officer" (
                "id" SERIAL NOT NULL,
                "username" character varying NOT NULL UNIQUE,
                "email" character varying NOT NULL UNIQUE,
                "password" character varying NOT NULL,
                "first_name" character varying NOT NULL,
                "last_name" character varying NOT NULL,
                "role" integer,
                CONSTRAINT "PK_municipality_officer_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_municipality_role" FOREIGN KEY ("role")
                    REFERENCES "role"("id") ON DELETE SET NULL ON UPDATE NO ACTION
            )
        `);

        // REPORT
        await queryRunner.query(`
            CREATE TABLE "report" (
                "id" SERIAL NOT NULL,
                "longitude" real NOT NULL,
                "latitude" real NOT NULL,
                "title" character varying NOT NULL,
                "description" character varying NOT NULL,
                "status" character varying NOT NULL,
                "explanation" character varying NOT NULL,
                "officerId" integer,
                "userId" integer,
                "categoryId" integer,
                CONSTRAINT "PK_report_id" PRIMARY KEY ("id")
            )
        `);

        // REPORT_PHOTO
        await queryRunner.query(`
            CREATE TABLE "report_photo" (
                "id" SERIAL NOT NULL,
                "photo" character varying NOT NULL,
                "reportId" integer,
                CONSTRAINT "PK_report_photo_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_report_photo_report"
                    FOREIGN KEY ("reportId") REFERENCES "report"("id")
                    ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);

        // REPORT → USER
        await queryRunner.query(`
            ALTER TABLE "report"
            ADD CONSTRAINT "FK_report_user"
            FOREIGN KEY ("userId") REFERENCES "user"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        // REPORT → CATEGORY
        await queryRunner.query(`
            ALTER TABLE "report"
            ADD CONSTRAINT "FK_report_category"
            FOREIGN KEY ("categoryId") REFERENCES "category"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        // REPORT → MUNICIPALITY_OFFICER
        await queryRunner.query(`
            ALTER TABLE "report"
            ADD CONSTRAINT "FK_report_officer"
            FOREIGN KEY ("officerId") REFERENCES "municipality_officer"("id")
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "report" DROP CONSTRAINT "FK_report_officer"`);
        await queryRunner.query(`ALTER TABLE "report" DROP CONSTRAINT "FK_report_category"`);
        await queryRunner.query(`ALTER TABLE "report" DROP CONSTRAINT "FK_report_user"`);

        await queryRunner.query(`ALTER TABLE "report_photo" DROP CONSTRAINT "FK_report_photo_report"`);

        await queryRunner.query(`ALTER TABLE "municipality_officer" DROP CONSTRAINT "FK_municipality_role"`);

        await queryRunner.query(`DROP TABLE "report_photo"`);
        await queryRunner.query(`DROP TABLE "report"`);
        await queryRunner.query(`DROP TABLE "municipality_officer"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "role"`);
        await queryRunner.query(`DROP TABLE "category"`);
    }
}
