// src/tests/integration/repositories/ReportRepository.int.test.ts

import { ReportRepository } from "../../../repositories/ReportRepository";
import { TestDataSource } from "../../test-data-source";
import { Report } from "../../../models/Report";
import { User } from "../../../models/User";
import { Category } from "../../../models/Category";
import { MunicipalityOfficer } from "../../../models/MunicipalityOfficer";
import { ReportPhoto } from "../../../models/ReportPhoto";
import { StatusType } from "../../../models/StatusType";
import { Role } from "../../../models/Role";

describe("ReportRepository (Integration Tests)", () => {
  let repository: ReportRepository;
  let user: User;
  let category: Category;
  let officerRole: Role;
  let officer: MunicipalityOfficer;

  beforeAll(async () => {
    if (!TestDataSource.isInitialized) {
      await TestDataSource.initialize();
    }
  });

  afterAll(async () => {
    if (TestDataSource.isInitialized) {
      await TestDataSource.destroy();
    }
  });

  beforeEach(async () => {
    if (!TestDataSource.isInitialized) {
      throw new Error("TestDataSource should be initialized in beforeAll.");
    }

    await TestDataSource.synchronize(true);
    repository = new ReportRepository(TestDataSource);

    // Dati comuni per tutti i test
    user = await TestDataSource.getRepository(User).save({
      username: "testuser",
      email: "test@example.com",
      password: "password",
      first_name: "Test",
      last_name: "User",
      photo: "user.jpg",
      telegram_id: "tg123",
      flag_email: true,
    });

    category = await TestDataSource.getRepository(Category).save({
      name: "Test Category",
    });

    officerRole = await TestDataSource.getRepository(Role).save({
      title: "Officer",
      label: "Municipality Officer",
    });

    officer = await TestDataSource.getRepository(MunicipalityOfficer).save({
      username: "testofficer",
      email: "officer@example.com",
      password: "password",
      first_name: "Officer",
      last_name: "One",
      role: officerRole,
    });
  });

  const createTestReport = async (
    status: StatusType = StatusType.PendingApproval
  ) => {
    const report = new Report();
    report.longitude = 10.123;
    report.latitude = 20.456;
    report.title = "Test Report Title";
    report.description = "This is a test description.";
    report.user = user;
    report.category = category;
    report.status = status;
    report.explanation = "";
    report.officer = officer;
    return TestDataSource.getRepository(Report).save(report);
  };

  describe("findAll", () => {
    it("should return all reports with relations", async () => {
      await createTestReport();
      await createTestReport(StatusType.Assigned);

      const reports = await repository.findAll();

      expect(reports).toHaveLength(2);
      expect(reports[0].user.username).toBe(user.username);
      expect(reports[0].category.name).toBe(category.name);
      expect(reports[0].photos).toBeDefined();
    });

    it("should return an empty array if no reports exist", async () => {
      const reports = await repository.findAll();
      expect(reports).toHaveLength(0);
    });
  });

  describe("findByCategory", () => {
    it("should return reports for a specific category", async () => {
      await createTestReport();

      const otherCategory = await TestDataSource.getRepository(Category).save({
        name: "Other Category",
      });

      await TestDataSource.getRepository(Report).save({
        longitude: 30,
        latitude: 40,
        title: "Other Report",
        description: "Desc",
        user,
        category: otherCategory,
        status: StatusType.PendingApproval,
        explanation: "",
      });

      const reports = await repository.findByCategory(category.id);

      expect(reports).toHaveLength(1);
      expect(reports[0].category.id).toBe(category.id);
    });

    it("should return an empty array if no reports for category exist", async () => {
      const reports = await repository.findByCategory(999);
      expect(reports).toHaveLength(0);
    });
  });

  describe("findById", () => {
    it("should return a report by its ID with relations", async () => {
      const savedReport = await createTestReport();

      const foundReport = await repository.findById(savedReport.id);

      expect(foundReport).toBeDefined();
      expect(foundReport?.id).toBe(savedReport.id);
      expect(foundReport?.user.username).toBe(user.username);
      expect(foundReport?.category.name).toBe(category.name);
      expect(foundReport?.officer?.username).toBe(officer.username);
    });

    it("should return null if report ID does not exist", async () => {
      const foundReport = await repository.findById(999);
      expect(foundReport).toBeNull();
    });
  });

  describe("findByUserId", () => {
    it("should return reports for a specific user", async () => {
      await createTestReport();

      const otherUser = await TestDataSource.getRepository(User).save({
        username: "otheruser",
        email: "other@example.com",
        password: "pass",
        first_name: "Other",
        last_name: "User",
        photo: "p.jpg",
        telegram_id: "tg_o",
        flag_email: false,
      });

      await TestDataSource.getRepository(Report).save({
        longitude: 30,
        latitude: 40,
        title: "Other User Report",
        description: "Desc",
        user: otherUser,
        category,
        status: StatusType.PendingApproval,
        explanation: "",
      });

      const reports = await repository.findByUserId(user.id);

      expect(reports).toHaveLength(1);
      expect(reports[0].user.id).toBe(user.id);
    });

    it("should return an empty array if no reports for user exist", async () => {
      const reports = await repository.findByUserId(999);
      expect(reports).toHaveLength(0);
    });
  });

  describe("findApproved", () => {
    it("should return only reports with 'Assigned' status", async () => {
      await createTestReport(StatusType.PendingApproval);
      await createTestReport(StatusType.Assigned);
      await createTestReport(StatusType.Resolved);

      const approvedReports = await repository.findApproved();

      expect(approvedReports).toHaveLength(1);
      expect(approvedReports[0].status).toBe(StatusType.Assigned);
    });

    it("should return an empty array if no approved reports exist", async () => {
      await createTestReport(StatusType.PendingApproval);
      await createTestReport(StatusType.Resolved);

      const approvedReports = await repository.findApproved();
      expect(approvedReports).toHaveLength(0);
    });
  });

  describe("findByOfficer", () => {
    it("should return reports assigned to a specific officer", async () => {
      await createTestReport(StatusType.Assigned);

      const otherRole = await TestDataSource.getRepository(Role).save({
        title: "Other Officer Role",
        label: "Other Officer",
      });

      const otherOfficer =
        await TestDataSource.getRepository(MunicipalityOfficer).save({
          username: "otherofficer",
          email: "other@example.com",
          password: "pass",
          first_name: "Other",
          last_name: "Officer",
          role: otherRole,
        });

      await TestDataSource.getRepository(Report).save({
        longitude: 30,
        latitude: 40,
        title: "Report for other officer",
        description: "Desc",
        user,
        category,
        status: StatusType.Assigned,
        explanation: "",
        officer: otherOfficer,
      });

      const reports = await repository.findByOfficer(officer);

      expect(reports).toHaveLength(1);
      expect(reports[0].officer?.id).toBe(officer.id);
    });

    it("should return an empty array if no reports for officer exist", async () => {
      const reports = await repository.findByOfficer(officer);
      expect(reports).toHaveLength(0);
    });
  });

  describe("add", () => {
    it("should add a new report", async () => {
      const newReport = new Report();
      newReport.longitude = 100;
      newReport.latitude = 200;
      newReport.title = "New Report";
      newReport.description = "Description for new report";
      newReport.user = user;
      newReport.category = category;
      newReport.status = StatusType.InProgress;
      newReport.explanation = "Initial explanation";
      newReport.officer = officer;

      const added = await repository.add(newReport);

      expect(added.id).toBeDefined();
      expect(added.title).toBe("New Report");
      expect(added.status).toBe(StatusType.InProgress);
      expect(added.user?.id).toBe(user.id);
      expect(added.category?.id).toBe(category.id);
      expect(added.officer?.id).toBe(officer.id);
    });

    it("should default status to PendingApproval when not provided", async () => {
      const newReport = new Report();
      newReport.longitude = 1;
      newReport.latitude = 2;
      newReport.title = "No status report";
      newReport.description = "No status";
      newReport.user = user;
      newReport.category = category;
      // status non impostato

      const added = await repository.add(newReport);

      expect(added.status).toBe(StatusType.PendingApproval);
    });

    it("should throw error if user not found", async () => {
      const invalidUser = { id: 999 } as User;
      const newReport = new Report();
      newReport.longitude = 1;
      newReport.latitude = 1;
      newReport.title = "Invalid User Report";
      newReport.description = "Desc";
      newReport.user = invalidUser;
      newReport.category = category;

      await expect(repository.add(newReport)).rejects.toThrow(
        "User not found for report creation."
      );
    });

    it("should throw error if category not found", async () => {
      const invalidCategory = { id: 999 } as Category;
      const newReport = new Report();
      newReport.longitude = 1;
      newReport.latitude = 1;
      newReport.title = "Invalid Category Report";
      newReport.description = "Desc";
      newReport.user = user;
      newReport.category = invalidCategory;

      await expect(repository.add(newReport)).rejects.toThrow(
        "Category not found for report creation."
      );
    });

    it("should throw error if officer not found", async () => {
      const invalidOfficer = { id: 999 } as MunicipalityOfficer;
      const newReport = new Report();
      newReport.longitude = 1;
      newReport.latitude = 1;
      newReport.title = "Invalid Officer Report";
      newReport.description = "Desc";
      newReport.user = user;
      newReport.category = category;
      newReport.officer = invalidOfficer;

      await expect(repository.add(newReport)).rejects.toThrow(
        "Officer not found for report creation."
      );
    });
  });

  describe("addPhotosToReport", () => {
    it("should add multiple photos to a report", async () => {
      const report = await createTestReport();

      const photos = [
        TestDataSource.getRepository(ReportPhoto).create({
          photo: "photo1.jpg",
        }),
        TestDataSource.getRepository(ReportPhoto).create({
          photo: "photo2.jpg",
        }),
      ];

      const addedPhotos = await repository.addPhotosToReport(report, photos);

      expect(addedPhotos).toHaveLength(2);
      expect(addedPhotos[0].report.id).toBe(report.id);

      const fetched = await repository.findById(report.id);
      expect(fetched?.photos).toHaveLength(2);
    });
  });

  describe("addPhoto", () => {
    it("should add a single photo to a report", async () => {
      const report = await createTestReport();

      const photo = TestDataSource.getRepository(ReportPhoto).create({
        photo: "single_photo.jpg",
        report,
      });

      const added = await repository.addPhoto(photo);

      expect(added.id).toBeDefined();
      expect(added.report.id).toBe(report.id);

      const photos = await repository.findPhotosByReportId(report.id);
      expect(photos).toHaveLength(1);
      expect(photos[0].photo).toBe("single_photo.jpg");
    });
  });

  describe("findPhotosByReportId", () => {
    it("should return all photos for a given report ID", async () => {
      const report = await createTestReport();

      await TestDataSource.getRepository(ReportPhoto).save([
        { photo: "p1.jpg", report },
        { photo: "p2.jpg", report },
      ]);

      const photos = await repository.findPhotosByReportId(report.id);

      expect(photos).toHaveLength(2);
      expect(photos.map((p) => p.photo)).toEqual(
        expect.arrayContaining(["p1.jpg", "p2.jpg"])
      );
    });

    it("should return empty array if report has no photos", async () => {
      const report = await createTestReport();
      const photos = await repository.findPhotosByReportId(report.id);
      expect(photos).toHaveLength(0);
    });

    it("should return empty array if report ID does not exist", async () => {
      const photos = await repository.findPhotosByReportId(999);
      expect(photos).toHaveLength(0);
    });
  });

  describe("remove", () => {
    it("should remove a report", async () => {
      const report = await createTestReport();

      await repository.remove(report);

      const found = await repository.findById(report.id);
      expect(found).toBeNull();
    });
  });

  describe("removePhoto", () => {
    it("should remove a specific photo", async () => {
      const report = await createTestReport();

      const photoToRemove =
        await TestDataSource.getRepository(ReportPhoto).save({
          photo: "toremove.jpg",
          report,
        });

      const photoToKeep = await TestDataSource.getRepository(ReportPhoto).save({
        photo: "tokeep.jpg",
        report,
      });

      await repository.removePhoto(photoToRemove);

      const photos = await repository.findPhotosByReportId(report.id);
      expect(photos).toHaveLength(1);
      expect(photos[0].photo).toBe("tokeep.jpg");
    });
  });

  describe("changeDescription", () => {
    it("should change report description", async () => {
      const report = await createTestReport();

      const updated = await repository.changeDescription(
        report,
        "New description"
      );

      expect(updated.description).toBe("New description");

      const found = await repository.findById(report.id);
      expect(found?.description).toBe("New description");
    });
  });

  describe("changeTitle", () => {
    it("should change report title", async () => {
      const report = await createTestReport();

      const updated = await repository.changeTitle(report, "New title");

      expect(updated.title).toBe("New title");

      const found = await repository.findById(report.id);
      expect(found?.title).toBe("New title");
    });
  });

  describe("update", () => {
    it("should update an existing report", async () => {
      const report = await createTestReport();

      report.title = "Updated title";
      report.status = StatusType.Resolved;

      const updated = await repository.update(report);

      expect(updated.title).toBe("Updated title");
      expect(updated.status).toBe(StatusType.Resolved);

      const found = await repository.findById(report.id);
      expect(found?.title).toBe("Updated title");
      expect(found?.status).toBe(StatusType.Resolved);
    });
  });

  describe("findByCategoryId", () => {
    it("should return reports for a specific category ID", async () => {
      await createTestReport();

      const otherCategory = await TestDataSource.getRepository(Category).save({
        name: "Another Category",
      });

      await TestDataSource.getRepository(Report).save({
        longitude: 50,
        latitude: 60,
        title: "Other cat report",
        description: "Desc",
        user,
        category: otherCategory,
        status: StatusType.PendingApproval,
        explanation: "",
      });

      const reports = await repository.findByCategoryId(category.id);

      expect(reports).toHaveLength(1);
      expect(reports[0].category.id).toBe(category.id);
    });

    it("should return empty array if no reports for category ID", async () => {
      const reports = await repository.findByCategoryId(999);
      expect(reports).toHaveLength(0);
    });
  });
});