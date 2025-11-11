import { MigrationInterface, QueryRunner } from "typeorm";

export class 1700000000000InitSchema1762858421895 implements MigrationInterface {
    name = '1700000000000InitSchema1762858421895'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "category" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "report_photo" ("id" SERIAL NOT NULL, "photo" character varying NOT NULL, "reportId" integer, CONSTRAINT "PK_ed946b1caca96d0b0eb01bf97ed" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "report" ("id" SERIAL NOT NULL, "longitude" real NOT NULL, "latitude" real NOT NULL, "title" character varying NOT NULL, "description" character varying NOT NULL, "userId" integer, "categoryId" integer, CONSTRAINT "PK_99e4d0bea58cba73c57f935a546" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "username" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "municipality_officer" ("id" SERIAL NOT NULL, "username" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "role" integer, CONSTRAINT "UQ_0468dec752507a6b9129a03d4c3" UNIQUE ("username"), CONSTRAINT "UQ_f99c11f673a61c780163e537d8f" UNIQUE ("email"), CONSTRAINT "PK_2c9d1d274871b17766942280a20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "role" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "report_photo" ADD CONSTRAINT "FK_df8ec12912da002b6d318fded2b" FOREIGN KEY ("reportId") REFERENCES "report"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "report" ADD CONSTRAINT "FK_e347c56b008c2057c9887e230aa" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "report" ADD CONSTRAINT "FK_230652e48daa99c50c000fc5d10" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "municipality_officer" ADD CONSTRAINT "FK_d8980693bc28922dcc4b4dae7d7" FOREIGN KEY ("role") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "municipality_officer" DROP CONSTRAINT "FK_d8980693bc28922dcc4b4dae7d7"`);
        await queryRunner.query(`ALTER TABLE "report" DROP CONSTRAINT "FK_230652e48daa99c50c000fc5d10"`);
        await queryRunner.query(`ALTER TABLE "report" DROP CONSTRAINT "FK_e347c56b008c2057c9887e230aa"`);
        await queryRunner.query(`ALTER TABLE "report_photo" DROP CONSTRAINT "FK_df8ec12912da002b6d318fded2b"`);
        await queryRunner.query(`DROP TABLE "role"`);
        await queryRunner.query(`DROP TABLE "municipality_officer"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "report"`);
        await queryRunner.query(`DROP TABLE "report_photo"`);
        await queryRunner.query(`DROP TABLE "category"`);
    }

}
