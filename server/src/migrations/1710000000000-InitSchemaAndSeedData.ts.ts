import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchemaAndSeedData1710000000000 implements MigrationInterface {
  name = 'InitSchemaAndSeedData1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create StatusType enum
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
      'OFFICER',
      'LEAD',
      'EXTERNAL'
    )`);

  await queryRunner.query(`CREATE TYPE "chat_type_enum" AS ENUM(
      'OFFICER_USER',
      'LEAD_EXTERNAL'
    )`);

    // 2. Base tables
    await queryRunner.query(`CREATE TABLE "role" (
      "id" SERIAL PRIMARY KEY,
      "title" VARCHAR NOT NULL UNIQUE,
      "label" VARCHAR NOT NULL UNIQUE
    )`);

    await queryRunner.query(`CREATE TABLE "municipality_officer" (
      "id" SERIAL PRIMARY KEY,
      "username" VARCHAR NOT NULL UNIQUE,
      "email" VARCHAR NOT NULL UNIQUE,
      "password" VARCHAR NOT NULL,
      "first_name" VARCHAR NOT NULL,
      "last_name" VARCHAR NOT NULL,
      "external" BOOLEAN NOT NULL,
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
      "lead_officer_id" INT,
      "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "FK_report_officer"
        FOREIGN KEY ("officerId") REFERENCES "municipality_officer"("id"),
      CONSTRAINT "FK_report_user"
        FOREIGN KEY ("userId") REFERENCES "app_user"("id"),
      CONSTRAINT "FK_report_category"
        FOREIGN KEY ("categoryId") REFERENCES "category"("id"),
      CONSTRAINT "FK_report_lead_officer"
        FOREIGN KEY ("lead_officer_id") REFERENCES "municipality_officer"("id")
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

    await queryRunner.query(`CREATE TABLE "chat" (
      "id" SERIAL PRIMARY KEY,
      "report_id" INT NOT NULL,
      "type" "chat_type_enum" NOT NULL,
      CONSTRAINT "FK_chat_report"
        FOREIGN KEY ("report_id") REFERENCES "report"("id") ON DELETE CASCADE
    )`);

    // 4. Message table
    await queryRunner.query(`CREATE TABLE "message" (
      "id" SERIAL PRIMARY KEY,
      "content" TEXT NOT NULL,
      "sender" "sender_enum" NOT NULL,
      "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      "chat_id" INT NOT NULL,
      CONSTRAINT "FK_chat_message"
        FOREIGN KEY ("chat_id") REFERENCES "chat"("id") ON DELETE CASCADE
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
    // ORGANIZATION_OFFICER → ALL
    await queryRunner.query(`INSERT INTO role_categories SELECT 2, id FROM category`);
    // TECH_LEAD_INFRASTRUCTURE → Roads and Urban Furnishings | Sewer System | Water Supply – Drinking Water
    await queryRunner.query(`INSERT INTO role_categories VALUES (3,7),(3,3),(3,1)`);
    // TECH_AGENT_INFRASTRUCTURE → Roads and Urban Furnishings | Architectural Barriers | Sewer System | Water Supply – Drinking Water
    await queryRunner.query(`INSERT INTO role_categories VALUES (4,7),(4,2),(4,3),(4,1)`);
    // TECH_LEAD_MOBILITY → Road Signs and Traffic Lights
    await queryRunner.query(`INSERT INTO role_categories VALUES (5,6)`);
    // TECH_AGENT_MOBILITY → Road Signs and Traffic Lights | Roads and Urban Furnishings
    await queryRunner.query(`INSERT INTO role_categories VALUES (6,6),(6,7)`);
    // TECH_LEAD_GREEN_AREAS → Public Green Areas and Playgrounds
    await queryRunner.query(`INSERT INTO role_categories VALUES (7,8)`);
    // TECH_AGENT_GREEN_AREAS → Public Green Areas and Playgrounds
    await queryRunner.query(`INSERT INTO role_categories VALUES (8,8)`);
    // TECH_LEAD_WASTE_MANAGEMENT → Waste
    await queryRunner.query(`INSERT INTO role_categories VALUES (9,5)`);
    // TECH_AGENT_WASTE_MANAGEMENT → Waste | Sewer System
    await queryRunner.query(`INSERT INTO role_categories VALUES (10,5),(10,3)`);
    // TECH_LEAD_ENERGY_LIGHTING → Public Lighting
    await queryRunner.query(`INSERT INTO role_categories VALUES (11,4)`);
    // TECH_AGENT_ENERGY_LIGHTING → Public Lighting
    await queryRunner.query(`INSERT INTO role_categories VALUES (12,4)`);
    // TECH_LEAD_PUBLIC_BUILDINGS → Architectural Barriers | Other
    await queryRunner.query(`INSERT INTO role_categories VALUES (13,2),(13,9)`);
    // TECH_AGENT_PUBLIC_BUILDINGS → Architectural Barriers | Other
    await queryRunner.query(`INSERT INTO role_categories VALUES (14,2),(14,9)`);

    // 9. Admin officer
    await queryRunner.query(`
      INSERT INTO "municipality_officer"
        ("id","username","email","password","first_name","last_name","external","role")
      VALUES
        (1,'admin','admin@participium.local',
        '$argon2id$v=19$m=65536,t=3,p=1$6FOS86yBc3WowYzkpdqonQ$fuBmKGHx8IRs15LrImF8/baI15mxyfvGnTkUNyVDd6g',
        'System','Admin',false,1)
      ON CONFLICT ("id") DO NOTHING
    `);

    // 10 . Users (10) – password diverse ma stesso schema Argon2id
    await queryRunner.query(`
      -- mariorossi password in chiaro: MarioRossi
      -- luigibianchi password in chiaro: LuigiBianchi
      -- annaverdi password in chiaro: AnnaVerdi
      -- giulianeri password in chiaro: GiuliaNeri
      -- paolorussi password in chiaro: PaoloRussi
      -- saraferrari password in chiaro: SaraFerrari
      -- lucagalli password in chiaro: LucaGalli
      -- francescacosta password in chiaro: FrancescaCosta
      -- elenamarino password in chiaro: ElenaMarino
      -- giorgiotesta password in chiaro: GiorgioTesta
      INSERT INTO "app_user"
        ("id","username","email","password","first_name","last_name","photo","telegram_id","flag_email")
      VALUES
        (1,'mariorossi','mariorossi@gmail.com',
         '$argon2id$v=19$m=4096,t=3,p=1$ZDhqdjZ2ZGNrNncwMDAwMA$hryoiCqybaoJH7lBn8Me3NOYwCtbZNkvbFURyX4Upj8',
         'Mario','Rossi',NULL,NULL,true),
        (2,'luigibianchi','luigibianchi2@gmail.com',
         '$argon2id$v=19$m=4096,t=3,p=1$dHp0bno3dWZ5czkwMDAwMA$XuFcn2bP7v/PNr6Mg/23muTkC+lTpio39VjQCnVlWI0',
         'Luigi','Bianchi',NULL,NULL,true),
        (3,'annaverdi','annaverdi@gmail.com',
         '$argon2id$v=19$m=4096,t=3,p=1$ZzliNjB0eWF3MXMwMDAwMA$ckibuxO0qbyXtn3p7euk8viYtCKs4ickpYEawrAwKN0',
         'Anna','Verdi',NULL,NULL,false),
        (4,'giulianeri','giulianeri@gmail.com',
         '$argon2id$v=19$m=4096,t=3,p=1$cHE5ZW0xZXE2MTAwMDAwMA$+VdJJzTZKk0DiynxmEsy/N2nLnyBCHRk7i9Q2uJ/caM',
         'Giulia','Neri',NULL,NULL,true),
        (5,'paolorussi','paolorussi@gmail.com',
         '$argon2id$v=19$m=4096,t=3,p=1$Zjh5OWZpdWwwYXUwMDAwMA$rUBx/pvOHl64d1CaWPcHt4+sbVLGEnfc6t2RwIk4c20',
         'Paolo','Russi',NULL,NULL,false),
        (6,'saraferrari','saraferrari@gmail.com',
         '$argon2id$v=19$m=4096,t=3,p=1$YmpzemZ0cTE5ZWYwMDAwMA$SKIz5ScbpnSBjDzeSk5e17V5PhyjOabKkzHtWi60Hkw',
         'Sara','Ferrari',NULL,NULL,true),
        (7,'lucagalli','lucagalli@gmail.com',
         '$argon2id$v=19$m=4096,t=3,p=1$eXhlaWRtejJhZjAwMDAwMA$5dlb94BGI0MNMVfl/FbmH1BIjmxGVvVR+we2O41r6s8',
         'Luca','Galli',NULL,NULL,true),
        (8,'francescacosta','francescacosta@gmail.com',
         '$argon2id$v=19$m=4096,t=3,p=1$ZGMwMTJybmJyc28wMDAwMA$Bpdq9YibGVAxvZZ80uGZn5bb212uQgsosPqxC9zlWAA',
         'Francesca','Costa',NULL,NULL,false),
        (9,'elenamarino','elenamarino@gmail.com',
         '$argon2id$v=19$m=4096,t=3,p=1$ejlpdDd6NjA3cmQwMDAwMA$NvLaY9gWHsR5RGGt6DBnzNKJ6acWPVvBuCNZrcsP4PY',
         'Elena','Marino',NULL,NULL,true),
        (10,'giorgiotesta','giorgiotesta@gmail.com',
         '$argon2id$v=19$m=4096,t=3,p=1$ZW1zZWRtdDV1OTgwMDAwMA$hpejmY8uq7zW1cuots4LJr6JxPBQCu/lDcDIvaD3K3k',
         'Giorgio','Testa',NULL,NULL,true)
    `);

    // 9. Municipality officers per ogni ruolo (tranne admin già inserito)
    await queryRunner.query(`
      -- org_officer password in chiaro: OrgOfficer1!
      -- lead_infra password in chiaro: LeadInfra1!
      -- agent_infra password in chiaro: AgentInfra1!
      -- lead_mobility password in chiaro: LeadMobility1!
      -- agent_mobility password in chiaro: AgentMobility1!
      -- lead_green password in chiaro: LeadGreen1!
      -- agent_green password in chiaro: AgentGreen1!
      -- lead_waste password in chiaro: LeadWaste1!
      -- agent_waste password in chiaro: AgentWaste1!
      -- lead_energy password in chiaro: LeadEnergy1!
      -- agent_energy password in chiaro: AgentEnergy1!
      -- lead_buildings password in chiaro: LeadBuildings1!
      -- agent_buildings password in chiaro: AgentBuildings1!
      INSERT INTO "municipality_officer"
        ("id","username","email","password","first_name","last_name","external","role")
      VALUES
        (2,'org_officer','maria.rossi@participium.local',
         '$argon2id$v=19$m=4096,t=3,p=1$MXQ5aHF2aG5vNmYwMDAwMA$xwEPRsmhAk4323jDh9Jf1laD9BxtD6wKee06uEAhPC8',
         'Maria','Rossi',false,2),
        (3,'lead_infra','giovanni.bianchi@participium.local',
         '$argon2id$v=19$m=4096,t=3,p=1$d3l4eXJhczNjazAwMDAwMA$BoCWTDKLvtbZ+kzeyMeqyTyioSpGeZsSiaMnuwL9Chs',
         'Giovanni','Bianchi',false,3),
        (4,'agent_infra','anna.verdi@participium.local',
         '$argon2id$v=19$m=4096,t=3,p=1$cWF0b25kYjh2eDAwMDAwMA$apQMX9qx9rlc7O3aApOmkZHOG5iU0fTGDnn5K8A4f7k',
         'Anna','Verdi',false,4),
        (5,'lead_mobility','paolo.galli@participium.local',
         '$argon2id$v=19$m=4096,t=3,p=1$NWx6N2U5MWwyMjcwMDAwMA$WKvR9cEs92cFuEAa4shZQVEWLIQWbAHGq9PFQaB3McY',
         'Paolo','Galli',false,5),
        (6,'agent_mobility','elena.ferrari@participium.local',
         '$argon2id$v=19$m=4096,t=3,p=1$NjB3dTduY2IxdjIwMDAwMA$DKTu4q1d9uih9KSTYjwfOydPWdhi2/svvde0dZFgv6Q',
         'Elena','Ferrari',false,6),
        (7,'lead_green','marco.russo@participium.local',
         '$argon2id$v=19$m=4096,t=3,p=1$dmdxY2FzdXJhYTgwMDAwMA$STgY4pc4dSUaVeMpkhqizIMIY19+h1+L8Jy91sSMAiU',
         'Marco','Russo',false,7),
        (8,'agent_green','sara.esposito@participium.local',
         '$argon2id$v=19$m=4096,t=3,p=1$eml3cjV4cWwwemYwMDAwMA$zMrriiNvqXPn3c1OjuvDJqW40NKil2HO7HC28SZON30',
         'Sara','Esposito',false,8),
        (9,'lead_waste','luca.martini@participium.local',
         '$argon2id$v=19$m=4096,t=3,p=1$dnJuajAybGVscWUwMDAwMA$bDRZDRurlvGmVoEHgmi1gnqHk3YazVMe0s75HWNfRrU',
         'Luca','Martini',false,9),
        (10,'agent_waste','francesca.romano@participium.local',
         '$argon2id$v=19$m=4096,t=3,p=1$NXljMmRpOG81bnQwMDAwMA$b2ARlYEp0fEqCaV075vNunWZjnpGYbnnsScHc+ydppk',
         'Francesca','Romano',false,10),
        (11,'lead_energy','davide.conti@participium.local',
         '$argon2id$v=19$m=4096,t=3,p=1$aWl4NDJkM3pqZjkwMDAwMA$Ju94deagaCHPsEJmgRXmG9tAFYFx0mBbLWh/NV5myYs',
         'Davide','Conti',false,11),
        (12,'agent_energy','chiara.ricci@participium.local',
         '$argon2id$v=19$m=4096,t=3,p=1$emNzdnV3ZDR5Y2UwMDAwMA$gY6E0cr/UnIOEzGc9p7Shz75hO7lnketKTzc9LEEDTg',
         'Chiara','Ricci',false,12),
        (13,'lead_buildings','alessandro.gallo@participium.local',
         '$argon2id$v=19$m=4096,t=3,p=1$aWl3bTU4MHJxdGwwMDAwMA$/lpZZnQnbgU0UpPcGV8vg2bTsyZeIaqN+uEuB/nuDQg',
         'Alessandro','Gallo',false,13),
        (14,'agent_buildings','federica.moretti@participium.local',
         '$argon2id$v=19$m=4096,t=3,p=1$cTNpaGhscjN4dnQwMDAwMA$EawaCPGuYrZKzo0ftbnaBMrq1D4ymmSp4TUsUK63Nec',
         'Federica','Moretti',false,14)
      ON CONFLICT ("id") DO NOTHING
    `);

    // Allineamento sequence municipality_officer
    await queryRunner.query(`SELECT setval(
      pg_get_serial_sequence('"municipality_officer"','id'),
      GREATEST((SELECT COALESCE(MAX(id),0) FROM "municipality_officer"), 1),
      true
    );`);

    // 10. Report Torino (25) – status vari ma mai "Rejected", explanation = ''
    await queryRunner.query(`INSERT INTO "report"
      ("id","longitude","latitude","title","description","status","explanation","officerId","userId","categoryId","lead_officer_id") VALUES
  (1,7.6869,45.0703,'Sewer Blockage in City Center','Sewer drain blocked in the city center.','In Progress','',9,1,3,null),
  (2,7.6780,45.0710,'Damaged Bench in Piazza Statuto','Broken bench in Piazza Statuto.','Pending Approval','',7,2,8,null),
  (3,7.6820,45.0740,'Non-Working Streetlight on Via Garibaldi','Streetlight not working on Via Garibaldi.','Assigned','',null,3,4,null),
  (4,7.6905,45.0665,'Faulty Public Lighting in San Salvario','Faulty public lighting in the San Salvario area.','In Progress','',11,4,4,null),
  (5,7.7000,45.0675,'Broken Traffic Light on Corso Vittorio','Broken traffic light at the Corso Vittorio intersection.','Pending Approval','',5,5,6,null),
  (6,7.7020,45.0730,'Broken Fire Hydrant in Vanchiglia','Fire hydrant broken in the Vanchiglia area.','Assigned','',null,6,1,null),
  (7,7.6815,45.0650,'Uneven Pavement on Crocetta Sidewalk','Uneven pavement on the sidewalk in Crocetta.','In Progress','',3,7,7,null),
  (8,7.6880,45.0750,'Damaged Pedestrian Crossing Sign','Damaged pedestrian crossing sign.','Pending Approval','',5,7,6,null),
  (9,7.6750,45.0680,'Broken Slide in Mirafiori Nord Playground','Slide in the playground damaged in Mirafiori Nord.','Assigned','',null,9,8,null),
  (10,7.6920,45.0690,'Damaged Road Barrier in Borgo Po','Road barrier damaged in Borgo Po.','In Progress','',3,10,7,null),
  (11,7.6840,45.0725,'Illegible Road Sign in Dora Riparia','Road sign unreadable in Dora Riparia.','Assigned','',null,1,6,null),
  (12,7.6800,45.0770,'Debris on the Roadway in Cit Turin','Debris on the roadway in Cit Turin.','Pending Approval','',4,2,7,null),
  (13,7.6990,45.0720,'Fallen Road Sign in Aurora','Road sign fallen in Aurora.','In Progress','',5,3,6,null),
  (18,7.6980,45.0660,'Overflowing Street Bin in Santa Rita','Street bin overflowing in Santa Rita.','In Progress','',9,8,5,null),
  (19,7.6830,45.0698,'Broken Swing in Pozzo Strada Playground','Swing broken in the playground in Pozzo Strada.','Assigned','',7,9,8,null),
  (20,7.6890,45.0715,'Poor Road Conditions in Barriera di Milano','Poor road conditions in Barriera di Milano.','In Progress','',3,10,7,null),
  (21,7.6910,45.0760,'Large Pothole on Road in Rebaudengo','Large pothole on the road in Rebaudengo.','Pending Approval','',3,1,7,null),
  (22,7.6775,45.0708,'Flooded Street After Rain in Parella','Street flooded after heavy rain in Parella.','In Progress','',9,2,3,null),
  (23,7.6955,45.0685,'Lighting Outage in Crocetta','Several streetlights out in Crocetta.','Assigned','',11,3,4,null),
  (14,7.6765,45.0735,'Fallen Tree Branch in Valentino Park','A tree branch has fallen in Valentino Park.','Assigned','',7,4,8,null),
  (15,7.6875,45.0670,'Flooding Due to Clogged Sewer in Porta Nuova','Flooding caused by a clogged sewer in Porta Nuova.','In Progress','',9,5,3,null),
  (16,7.6935,45.0745,'Graffiti on Public Wall in Vanchiglietta','Graffiti on a public wall in Vanchiglietta.','Pending Approval','',13,6,9,null),
  (17,7.7040,45.0695,'Low Water Pressure in Madonna del Pilone','Low water pressure in the Madonna del Pilone area.','Assigned','',null,7,1,null),
  (24,7.7060,45.0718,'Trash Scattered in Public Area in Cavoretto','Trash scattered in a public area in Cavoretto.','In Progress','',9,4,5,null),
  (25,7.6855,45.0738,'Water Leak on Roadway in Lingotto','Water leaking onto the roadway in Lingotto.','Resolved','',3,5,1,null)
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

    await queryRunner.query(`INSERT INTO "chat" ("id","report_id","type") VALUES
      (1,1,'OFFICER_USER'),
      (2,3,'OFFICER_USER'),
      (3,4,'OFFICER_USER'),
      (4,6,'OFFICER_USER'),
      (5,7,'OFFICER_USER'),
      (6,9,'OFFICER_USER'),
      (7,10,'OFFICER_USER'),
      (8,11,'OFFICER_USER'),
      (9,13,'OFFICER_USER'),
      (10,18,'OFFICER_USER'),
      (11,19,'OFFICER_USER'),
      (12,20,'OFFICER_USER'),
      (13,22,'OFFICER_USER'),
      (14,23,'OFFICER_USER'),
      (15,14,'OFFICER_USER'),
      (16,15,'OFFICER_USER'),
      (17,17,'OFFICER_USER'),
      (18,24,'OFFICER_USER'),
      (19,25,'OFFICER_USER')
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

    // Allineamento sequence chat
    await queryRunner.query(`
      SELECT setval(
        pg_get_serial_sequence('"chat"','id'),
        GREATEST((SELECT COALESCE(MAX(id),0) FROM "chat"), 1),
        true
      );
    `);
  }


  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "notification"`);
    await queryRunner.query(`DROP TABLE "message"`);
    await queryRunner.query(`DROP TABLE "report_photo"`);
    await queryRunner.query(`DROP TABLE "report"`);
    await queryRunner.query(`DROP TABLE "role_categories"`);
    await queryRunner.query(`DROP TABLE "category"`);
    await queryRunner.query(`DROP TABLE "app_user"`);
    await queryRunner.query(`DROP TABLE "municipality_officer"`);
    await queryRunner.query(`DROP TABLE "role"`);
    await queryRunner.query(`DROP TABLE "chat"`);
    await queryRunner.query(`DROP TYPE "status_type_enum"`);
    await queryRunner.query(`DROP TYPE "sender_enum"`);
    await queryRunner.query(`DROP TYPE "notification_type_enum"`);
    await queryRunner.query(`DROP TYPE "chat_type_enum"`);
  }
}