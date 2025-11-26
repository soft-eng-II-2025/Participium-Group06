import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchemaAndSeedData1710000000000 implements MigrationInterface {
  name = 'InitSchemaAndSeedData1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Enums
    await queryRunner.query(`CREATE TYPE "status_type_enum" AS ENUM(
      'Pending Approval',
      'Assigned',
      'In Progress',
      'Suspended',
      'Rejected',
      'Resolved'
    )`);

    await queryRunner.query(`CREATE TYPE "notification_type_enum" AS ENUM(
      'report_changed',
      'new_message'
    )`);

    await queryRunner.query(`CREATE TYPE "sender_enum" AS ENUM(
      'USER',
      'OFFICER'
    )`);

    // 2. Base tables
    await queryRunner.query(`CREATE TABLE "role" (
      "id" SERIAL PRIMARY KEY,
      "title" VARCHAR NOT NULL UNIQUE,
      "label" VARCHAR NOT NULL
    )`);

    await queryRunner.query(`CREATE TABLE "municipality_officer" (
      "id" SERIAL PRIMARY KEY,
      "username" VARCHAR NOT NULL UNIQUE,
      "email" VARCHAR NOT NULL UNIQUE,
      "password" VARCHAR NOT NULL,
      "first_name" VARCHAR NOT NULL,
      "last_name" VARCHAR NOT NULL,
      "role" INT,
      CONSTRAINT "FK_municipality_officer_role"
        FOREIGN KEY ("role") REFERENCES "role"("id")
    )`);

    await queryRunner.query(`CREATE TABLE "app_user" (
      "id" SERIAL PRIMARY KEY,
      "username" VARCHAR NOT NULL UNIQUE,
      "email" VARCHAR NOT NULL UNIQUE,
      "password" VARCHAR NOT NULL,
      "first_name" VARCHAR NOT NULL,
      "last_name" VARCHAR NOT NULL,
      "photo" VARCHAR,
      "telegram_id" VARCHAR,
      "flag_email" BOOLEAN NOT NULL
    )`);

    await queryRunner.query(`CREATE TABLE "category" (
      "id" SERIAL PRIMARY KEY,
      "name" VARCHAR NOT NULL UNIQUE
    )`);

    await queryRunner.query(`CREATE TABLE "report" (
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
      "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "FK_report_officer"
        FOREIGN KEY ("officerId") REFERENCES "municipality_officer"("id"),
      CONSTRAINT "FK_report_user"
        FOREIGN KEY ("userId") REFERENCES "app_user"("id"),
      CONSTRAINT "FK_report_category"
        FOREIGN KEY ("categoryId") REFERENCES "category"("id")
    )`);

    await queryRunner.query(`CREATE TABLE "report_photo" (
      "id" SERIAL PRIMARY KEY,
      "photo" VARCHAR NOT NULL,
      "reportId" INT,
      CONSTRAINT "FK_report_photo_report"
        FOREIGN KEY ("reportId") REFERENCES "report"("id") ON DELETE CASCADE
    )`);

    // 3. M2M join table role <-> category
    await queryRunner.query(`CREATE TABLE "role_categories" (
      "role_id" INT NOT NULL,
      "category_id" INT NOT NULL,
      PRIMARY KEY ("role_id","category_id"),
      CONSTRAINT "FK_role_categories_role"
        FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE,
      CONSTRAINT "FK_role_categories_category"
        FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE
    )`);

    // 4. Message table
    await queryRunner.query(`CREATE TABLE "message" (
      "id" SERIAL PRIMARY KEY,
      "municipality_officer_id" INT NOT NULL,
      "user_id" INT NOT NULL,
      "report_id" INT NOT NULL,
      "content" TEXT NOT NULL,
      "sender" "sender_enum" NOT NULL,
      "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "FK_message_municipality_officer"
        FOREIGN KEY ("municipality_officer_id") REFERENCES "municipality_officer"("id"),
      CONSTRAINT "FK_message_user"
        FOREIGN KEY ("user_id") REFERENCES "app_user"("id"),
      CONSTRAINT "FK_message_report"
        FOREIGN KEY ("report_id") REFERENCES "report"("id")
    )`);

    // 5. Notification table
    await queryRunner.query(`CREATE TABLE "notification" (
      "id" SERIAL PRIMARY KEY,
      "type" "notification_type_enum" NOT NULL,
      "content" TEXT NOT NULL,
      "is_read" BOOLEAN DEFAULT FALSE,
      "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      "user_id" INT NOT NULL,
      CONSTRAINT "FK_notification_user"
        FOREIGN KEY ("user_id") REFERENCES "app_user"("id")
    )`);

    // 6. Seed roles
    await queryRunner.query(`INSERT INTO "role" ("id","title","label") VALUES
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

    // 7. Seed categories
    await queryRunner.query(`INSERT INTO "category" ("id","name") VALUES
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

    // 8. Seed role_categories
    await queryRunner.query(`INSERT INTO role_categories SELECT 1, id FROM category`);
    await queryRunner.query(`INSERT INTO role_categories SELECT 2, id FROM category`);
    await queryRunner.query(`INSERT INTO role_categories VALUES (3,7),(3,3),(3,1)`);
    await queryRunner.query(`INSERT INTO role_categories VALUES (4,7),(4,2),(4,3),(4,1)`);
    await queryRunner.query(`INSERT INTO role_categories VALUES (5,6)`);
    await queryRunner.query(`INSERT INTO role_categories VALUES (6,6),(6,7)`);
    await queryRunner.query(`INSERT INTO role_categories VALUES (7,8)`);
    await queryRunner.query(`INSERT INTO role_categories VALUES (8,8)`);
    await queryRunner.query(`INSERT INTO role_categories VALUES (9,5)`);
    await queryRunner.query(`INSERT INTO role_categories VALUES (10,5),(10,3)`);
    await queryRunner.query(`INSERT INTO role_categories VALUES (11,4)`);
    await queryRunner.query(`INSERT INTO role_categories VALUES (12,4)`);
    await queryRunner.query(`INSERT INTO role_categories VALUES (13,2),(13,9)`);
    await queryRunner.query(`INSERT INTO role_categories VALUES (14,2),(14,9)`);

    // 9. Seed Municipality officers
    await queryRunner.query(`INSERT INTO "municipality_officer"
      ("id","username","email","password","first_name","last_name","role")
      VALUES
      (1,'admin','admin@participium.local','$argon2id$v=19$m=65536,t=3,p=1$6FOS86yBc3WowYzkpdqonQ$fuBmKGHx8IRs15LrImF8/baI15mxyfvGnTkUNyVDd6g','System','Admin',1),
      (2,'org_officer','maria.rossi@participium.local','$argon2id$v=19$m=4096,t=3,p=1$MXQ5aHF2aG5vNmYwMDAwMA$xwEPRsmhAk4323jDh9Jf1laD9BxtD6wKee06uEAhPC8','Maria','Rossi',2),
      (3,'lead_infra','giovanni.bianchi@participium.local','$argon2id$v=19$m=4096,t=3,p=1$d3l4eXJhczNjazAwMDAwMA$BoCWTDKLvtbZ+kzeyMeqyTyioSpGeZsSiaMnuwL9Chs','Giovanni','Bianchi',3),
      (4,'agent_infra','anna.verdi@participium.local','$argon2id$v=19$m=4096,t=3,p=1$cWF0b25kYjh2eDAwMDAwMA$apQMX9qx9rlc7O3aApOmkZHOG5iU0fTGDnn5K8A4f7k','Anna','Verdi',4),
      (5,'lead_mobility','paolo.galli@participium.local','$argon2id$v=19$m=4096,t=3,p=1$NWx6N2U5MWwyMjcwMDAwMA$WKvR9cEs92cFuEAa4shZQVEWLIQWbAHGq9PFQaB3McY','Paolo','Galli',5),
      (6,'agent_mobility','elena.ferrari@participium.local','$argon2id$v=19$m=4096,t=3,p=1$NjB3dTduY2IxdjIwMDAwMA$DKTu4q1d9uih9KSTYjwfOydPWdhi2/svvde0dZFgv6Q','Elena','Ferrari',6),
      (7,'lead_green','marco.russo@participium.local','$argon2id$v=19$m=4096,t=3,p=1$dmdxY2FzdXJhYTgwMDAwMA$STgY4pc4dSUaVeMpkhqizIMIY19+h1+L8Jy91sSMAiU','Marco','Russo',7),
      (8,'agent_green','sara.esposito@participium.local','$argon2id$v=19$m=4096,t=3,p=1$eml3cjV4cWwwemYwMDAwMA$zMrriiNvqXPn3c1OjuvDJqW40NKil2HO7HC28SZON30','Sara','Esposito',8),
      (9,'lead_waste','luca.martini@participium.local','$argon2id$v=19$m=4096,t=3,p=1$dnJuajAybGVscWUwMDAwMA$bDRZDRurlvGmVoEHgmi1gnqHk3YazVMe0s75HWNfRrU','Luca','Martini',9),
      (10,'agent_waste','francesca.romano@participium.local','$argon2id$v=19$m=4096,t=3,p=1$NXljMmRpOG81bnQwMDAwMA$b2ARlYEp0fEqCaV075vNunWZjnpGYbnnsScHc+ydppk','Francesca','Romano',10),
      (11,'lead_energy','davide.conti@participium.local','$argon2id$v=19$m=4096,t=3,p=1$aWl4NDJkM3pqZjkwMDAwMA$Ju94deagaCHPsEJmgRXmG9tAFYFx0mBbLWh/NV5myYs','Davide','Conti',11),
      (12,'agent_energy','chiara.ricci@participium.local','$argon2id$v=19$m=4096,t=3,p=1$emNzdnV3ZDR5Y2UwMDAwMA$gY6E0cr/UnIOEzGc9p7Shz75hO7lnketKTzc9LEEDTg','Chiara','Ricci',12),
      (13,'lead_buildings','alessandro.gallo@participium.local','$argon2id$v=19$m=4096,t=3,p=1$aWl3bTU4MHJxdGwwMDAwMA$/lpZZnQnbgU0UpPcGV8vg2bTsyZeIaqN+uEuB/nuDQg','Alessandro','Gallo',13),
      (14,'agent_buildings','federica.moretti@participium.local','$argon2id$v=19$m=4096,t=3,p=1$cTNpaGhscjN4dnQwMDAwMA$EawaCPGuYrZKzo0ftbnaBMrq1D4ymmSp4TUsUK63Nec','Federica','Moretti',14)
    `);

    // 10. Seed users
    await queryRunner.query(`
      INSERT INTO "app_user"
        ("id","username","email","password","first_name","last_name","photo","telegram_id","flag_email")
      VALUES
        (1,'mariorossi','mariorossi@gmail.com','$argon2id$v=19$m=4096,t=3,p=1$ZDhqdjZ2ZGNrNncwMDAwMA$hryoiCqybaoJH7lBn8Me3NOYwCtbZNkvbFURyX4Upj8','Mario','Rossi',NULL,NULL,true),
        (2,'luigibianchi','luigibianchi2@gmail.com','$argon2id$v=19$m=4096,t=3,p=1$dHp0bno3dWZ5czkwMDAwMA$XuFcn2bP7v/PNr6Mg/23muTkC+lTpio39VjQCnVlWI0','Luigi','Bianchi',NULL,NULL,true),
        (3,'annaverdi','annaverdi@gmail.com','$argon2id$v=19$m=4096,t=3,p=1$ZzliNjB0eWF3MXMwMDAwMA$ckibuxO0qbyXtn3p7euk8viYtCKs4ickpYEawrAwKN0','Anna','Verdi',NULL,NULL,false),
        (4,'giulianeri','giulianeri@gmail.com','$argon2id$v=19$m=4096,t=3,p=1$cHE5ZW0xZXE2MTAwMDAwMA$+VdJJzTZKk0DiynxmEsy/N2nLnyBCHRk7i9Q2uJ/caM','Giulia','Neri',NULL,NULL,true),
        (5,'paolorussi','paolorussi@gmail.com','$argon2id$v=19$m=4096,t=3,p=1$Zjh5OWZpdWwwYXUwMDAwMA$rUBx/pvOHl64d1CaWPcHt4+sbVLGEnfc6t2RwIk4c20','Paolo','Russi',NULL,NULL,false),
        (6,'saraferrari','saraferrari@gmail.com','$argon2id$v=19$m=4096,t=3,p=1$YmpzemZ0cTE5ZWYwMDAwMA$SKIz5ScbpnSBjDzeSk5e17V5PhyjOabKkzHtWi60Hkw','Sara','Ferrari',NULL,NULL,true),
        (7,'lucagalli','lucagalli@gmail.com','$argon2id$v=19$m=4096,t=3,p=1$eXhlaWRtejJhZjAwMDAwMA$5dlb94BGI0MNMVfl/FbmH1BIjmxGVvVR+we2O41r6s8','Luca','Galli',NULL,NULL,true),
        (8,'francescacosta','francescacosta@gmail.com','$argon2id$v=19$m=4096,t=3,p=1$ZGMwMTJybmJyc28wMDAwMA$Bpdq9YibGVAxvZZ80uGZn5bb212uQgsosPqxC9zlWAA','Francesca','Costa',NULL,NULL,false),
        (9,'elenamarino','elenamarino@gmail.com','$argon2id$v=19$m=4096,t=3,p=1$ejlpdDd6NjA3cmQwMDAwMA$NvLaY9gWHsR5RGGt6DBnzNKJ6acWPVvBuCNZrcsP4PY','Elena','Marino',NULL,NULL,true),
        (10,'giorgiotesta','giorgiotesta@gmail.com','$argon2id$v=19$m=4096,t=3,p=1$ZW1zZWRtdDV1OTgwMDAwMA$hpejmY8uq7zW1cuots4LJr6JxPBQCu/lDcDIvaD3K3k','Giorgio','Testa',NULL,NULL,true)
    `);

    // 11. Seed reports, report photos, sequences
    // (Here you can just copy/paste all your original 25 reports + photos inserts)
       // Allineamento sequence municipality_officer
    await queryRunner.query(`SELECT setval(
      pg_get_serial_sequence('"municipality_officer"','id'),
      GREATEST((SELECT COALESCE(MAX(id),0) FROM "municipality_officer"), 1),
      true
    );`);

    // 10. Report Torino (25) – status vari ma mai "Rejected", explanation = ''
    await queryRunner.query(`INSERT INTO "report"
  ("id","longitude","latitude","title","description","status","explanation","officerId","userId","categoryId") VALUES
  (1,7.6869,45.0703,'Ostruzione Fognaria Centro','Scolo fognario ostruito in zona Centro.','In Progress','',9,1,3),
  (2,7.6780,45.0710,'Panchina Danneggiata Piazza Statuto','Panchina rotta in piazza Statuto.','Pending Approval','',7,2,8),
  (3,7.6820,45.0740,'Lampione Non Funzionante Via Garibaldi','Lampione stradale non funzionante in via Garibaldi.','Assigned','',null,3,4),
  (4,7.6905,45.0665,'Illuminazione Pubblica Difettosa San Salvario','Illuminazione pubblica difettosa in San Salvario.','In Progress','',11,4,4),
  (5,7.7000,45.0675,'Semaforo Guasto Corso Vittorio','Semaforo guasto allo incrocio Corso Vittorio.','Pending Approval','',5,5,6),
  (6,7.7020,45.0730,'Idrante Rotto Zona Vanchiglia','Idrante rotto in zona Vanchiglia.','Assigned','',null,6,1),
  (7,7.6815,45.0650,'Pavimentazione Sconnessa Marciapiede Crocetta','Pavimentazione sconnessa sul marciapiede in Crocetta.','In Progress','',3,7,7),
  (8,7.6880,45.0750,'Segnale Strisce Pedonali Danneggiato','Segnale strisce pedonali danneggiato.','Pending Approval','',5,null,6),
  (9,7.6750,45.0680,'Scivolo Parco Giochi Danneggiato Mirafiori Nord','Scivolo del parco giochi danneggiato in Mirafiori Nord.','Assigned','',null,9,8),
  (10,7.6920,45.0690,'Barriera Stradale Danneggiata Borgo Po','Barriera stradale danneggiata in Borgo Po.','In Progress','',3,10,7),
  (11,7.6840,45.0725,'Segnale Stradale Illeggibile Dora Riparia','Segnale stradale illeggibile in Dora Riparia.','Assigned','',null,1,6),
  (12,7.6800,45.0770,'Detriti Sulla Carreggiata Cit Turin','Detriti sulla carreggiata in Cit Turin.','Pending Approval','',4,2,7),
  (13,7.6990,45.0720,'Segnale Stradale Caduto Aurora','Segnale stradale caduto in Aurora.','In Progress','',5,3,6),
  (18,7.6980,45.0660,'Cestino Stradale Stracolmo Santa Rita','Cestino stradale stracolmo in Santa Rita.','In Progress','',9,8,5),
  (19,7.6830,45.0698,'Altalena Rotta Parco Giochi Pozzo Strada','Altalena rotta nel parco giochi in Pozzo Strada.','Assigned','',7,9,8),
  (20,7.6890,45.0715,'Condizioni Stradali Precarie Barriera di Milano','Condizioni stradali precarie in Barriera di Milano.','In Progress','',3,10,7),
  (21,7.6910,45.0760,'Grossa Buca Sulla Strada Rebaudengo','Grossa buca sulla strada in Rebaudengo.','Pending Approval','',3,1,7),
  (22,7.6775,45.0708,'Strada Allagata Post-Pioggia Parella','Strada allagata dopo forte pioggia in Parella.','In Progress','',9,2,3),
  (23,7.6955,45.0685,'Interruzione Illuminazione Crocetta','Diversi lampioni spenti in Crocetta.','Assigned','',11,3,4),
  (14,7.6765,45.0735,'Ramo d''Albero Caduto Parco del Valentino','Ramo di un albero caduto in Parco del Valentino.','Assigned','',7,4,8),
  (15,7.6875,45.0670,'Allagamento da Fogna Intasata Porta Nuova','Allagamento dovuto a fogna intasata in Porta Nuova.','In Progress','',9,5,3),
  (16,7.6935,45.0745,'Graffiti su Muro Pubblico Vanchiglietta','Graffiti su muro pubblico in Vanchiglietta.','Pending Approval','',13,6,9),
  (17,7.7040,45.0695,'Bassa Pressione dell''Acqua Madonna del Pilone','Bassa pressione della acqua in zona Madonna del Pilone.','Assigned','',null,7,1),
  (24,7.7060,45.0718,'Rifiuti Spazi in Area Pubblica Cavoretto','Rifiuti sparsi in area pubblica in Cavoretto.','In Progress','',9,4,5),
  (25,7.6855,45.0738,'Perdita d''Acqua Sede Stradale Lingotto','Perdita di acqua sulla sede stradale in Lingotto.','Resolved','',3,5,1)
  
`);

    // 11. report_photo (timestamp fisso 1762946249248)
    await queryRunner.query(`INSERT INTO "report_photo" ("id","photo","reportId") VALUES
      (1,'uploads/1762946249248-Blocked-sewer.jpg',1),
      (2,'uploads/1762946249248-Broken-bench.jpg',2),
      (3,'uploads/1762946249248-broken-streetlamp.jpg',3),
      (4,'uploads/1762946249248-broken-street-light-1.jpg',4),
      (5,'uploads/1762946249248-Broken-traffic-light.jpg',5),
      (6,'uploads/1762946249248-Broken-water-hydrant.jpg',6),
      (7,'uploads/1762946249248-Cracked-pavement.jpg',7),
      (8,'uploads/1762946249248-Crosswalk-sign-damaged.jpg',8),
      (9,'uploads/1762946249248-Damaged-playground-slide.jpg',9),
      (10,'uploads/1762946249248-Damaged-road-barrier.jpg',10),
      (11,'uploads/1762946249248-Damaged-road-sign.jpg',11),
      (12,'uploads/1762946249248-Debris-on-the-road.jpg',12),
      (13,'uploads/1762946249248-Fallen-road-sign.jpg',13),
      (14,'uploads/1762946249248-Fallen-tree-branch.jpg',14),
      (15,'uploads/1762946249248-Flooded-sewer.jpg',15),
      (16,'uploads/1762946249248-Graffiti-on-public-wall.jpg',16),
      (17,'uploads/1762946249248-Low-water-pressure.jpg',17),
      (18,'uploads/1762946249248-overflowing-trash-bin.jpg',18),
      (19,'uploads/1762946249248-Playground-swing-broken.jpg',19),
      (20,'uploads/1762946249248-Poor-road-surface.jpg',20),
      (21,'uploads/1762946249248-pothole-on-the-road.jpg',21),
      (22,'uploads/1762946249248-Street-flooding.jpg',22),
      (23,'uploads/1762946249248-Streetlight-outage.jpg',23),
      (24,'uploads/1762946249248-Trash-scattered.jpg',24),
      (25,'uploads/1762946249248-Water-leakage.jpg',25)
    `);

    // Allineamento sequence app_user
    await queryRunner.query(`
      SELECT setval(pg_get_serial_sequence('"app_user"', 'id'),
                    (SELECT COALESCE(MAX(id), 0) FROM "app_user"),
                    true
             );
    `);

    // Allineamento sequence report
    await queryRunner.query(`
      SELECT setval(pg_get_serial_sequence('"report"', 'id'),
                    (SELECT COALESCE(MAX(id), 0) FROM "report"),
                    true
             );
    `);

    // Allineamento sequence report_photo
    await queryRunner.query(`
      SELECT setval(pg_get_serial_sequence('"report_photo"', 'id'),
                    (SELECT COALESCE(MAX(id), 0) FROM "report_photo"),
                    true
             );
    `);
  }


  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "notification"`);
    await queryRunner.query(`DROP TABLE "message"`);
    await queryRunner.query(`DROP TABLE "role_categories"`);
    await queryRunner.query(`DROP TABLE "report_photo"`);
    await queryRunner.query(`DROP TABLE "report"`);
    await queryRunner.query(`DROP TABLE "category"`);
    await queryRunner.query(`DROP TABLE "app_user"`);
    await queryRunner.query(`DROP TABLE "municipality_officer"`);
    await queryRunner.query(`DROP TABLE "role"`);
    await queryRunner.query(`DROP TYPE "sender_enum"`);
    await queryRunner.query(`DROP TYPE "notification_type_enum"`);
    await queryRunner.query(`DROP TYPE "status_type_enum"`);
  }
}