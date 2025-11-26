// src/tests/integration/mapperService.test.ts
import {
  mapCategoryDAOToDTO,
  mapMunicipalityOfficerDAOToDTO,
  mapReportDAOToDTO,
  mapRoleDAOToDTO,
  mapUserDAOToDTO,
  mapCreateReportRequestToDAO,
} from '../../../services/mapperService';

import { User } from '../../../models/User';
import { Category } from '../../../models/Category';
import { Report } from '../../../models/Report';
import { ReportPhoto } from '../../../models/ReportPhoto';
import { Role } from '../../../models/Role';
import { MunicipalityOfficer } from '../../../models/MunicipalityOfficer';

import type { CreateReportRequestDTO } from '../../../models/DTOs/CreateReportRequestDTO';


describe('mapperService (Integration Tests)', () => {

  // ------------- Test DAO -> DTO Mappers -------------

  describe('mapCategoryDAOToDTO', () => {
    it('dovrebbe mappare correttamente Category DAO a CategoryResponseDTO', () => {
      const categoryDAO = new Category();
      categoryDAO.id = 1;
      categoryDAO.name = 'Dissesto Idrogeologico';

      const dto = mapCategoryDAOToDTO(categoryDAO);

      expect(dto).toEqual({
        id: 1,
        name: 'Dissesto Idrogeologico',
      });
    });
  });

  describe('mapMunicipalityOfficerDAOToDTO', () => {
    it('dovrebbe mappare correttamente MunicipalityOfficer DAO a MunicipalityOfficerResponseDTO con ruolo', () => {
      const roleDAO = new Role();
      roleDAO.id = 10;
      roleDAO.title = 'Officer';

      const officerDAO = new MunicipalityOfficer();
      officerDAO.id = 1;
      officerDAO.username = 'officer1';
      officerDAO.email = 'officer1@example.com';
      officerDAO.first_name = 'Primo';
      officerDAO.last_name = 'Ufficiale';
      officerDAO.role = roleDAO;

      const dto = mapMunicipalityOfficerDAOToDTO(officerDAO);

      expect(dto).toEqual({
        username: 'officer1',
        email: 'officer1@example.com',
        // password: null è rimosso da removeNullAttributes perché opzionale
        first_name: 'Primo',
        last_name: 'Ufficiale',
        role: { title: 'Officer' },
      });
    });

    it('dovrebbe mappare correttamente MunicipalityOfficer DAO a MunicipalityOfficerResponseDTO senza ruolo', () => {
      const officerDAO = new MunicipalityOfficer();
      officerDAO.id = 1;
      officerDAO.username = 'officer2';
      officerDAO.email = 'officer2@example.com';
      officerDAO.first_name = 'Secondo';
      officerDAO.last_name = 'Ufficiale';
      // officerDAO.role è undefined

      const dto = mapMunicipalityOfficerDAOToDTO(officerDAO);

      expect(dto).toEqual({
        username: 'officer2',
        email: 'officer2@example.com',
        // password: null è rimosso da removeNullAttributes perché opzionale
        first_name: 'Secondo',
        last_name: 'Ufficiale',
      });
    });
  });

  describe('mapReportDAOToDTO', () => {
    it('dovrebbe mappare correttamente Report DAO a ReportResponseDTO con user, category e photos', () => {
      const userDAO = new User();
      userDAO.id = 100;
      userDAO.username = 'testuser';

      const categoryDAO = new Category();
      categoryDAO.id = 200;
      categoryDAO.name = 'Danno';

      const photo1 = new ReportPhoto();
      photo1.id = 1;
      photo1.photo = 'path/to/photo1.jpg';

      const photo2 = new ReportPhoto();
      photo2.id = 2;
      photo2.photo = 'path/to/photo2.jpg';

      const reportDAO = new Report();
      reportDAO.id = 50;
      reportDAO.longitude = 10.1;
      reportDAO.latitude = 20.2;
      reportDAO.title = 'Buca';
      reportDAO.description = 'Profonda';
      reportDAO.user = userDAO;
      reportDAO.category = categoryDAO;
      reportDAO.photos = [photo1, photo2];

      const dto = mapReportDAOToDTO(reportDAO);

      expect(dto).toEqual({
        longitude: 10.1,
        latitude: 20.2,
        title: 'Buca',
        description: 'Profonda',
        userId: 100,
        categoryId: 200,
        photos: ['path/to/photo1.jpg', 'path/to/photo2.jpg'],
      });
    });

    it('dovrebbe mappare correttamente Report DAO a ReportResponseDTO senza user, category e photos', () => {
      const reportDAO = new Report();
      reportDAO.id = 51;
      reportDAO.longitude = 11.1;
      reportDAO.latitude = 21.2;
      reportDAO.title = 'Altro';
      reportDAO.description = 'Report';
      // user, category, photos sono undefined nel DAO

      const dto = mapReportDAOToDTO(reportDAO);

      expect(dto).toEqual({
        longitude: 11.1,
        latitude: 21.2,
        title: 'Altro',
        description: 'Report',
      });
    });
  });

  describe('mapRoleDAOToDTO', () => {
    it('dovrebbe mappare correttamente Role DAO a RoleResponseDTO con ufficiali', () => {
      const officer1 = new MunicipalityOfficer();
      officer1.id = 1;
      officer1.username = 'off1';
      officer1.email = 'off1@mail.com';
      officer1.first_name = 'Off1';
      officer1.last_name = 'Icial1';

      const officer2 = new MunicipalityOfficer();
      officer2.id = 2;
      officer2.username = 'off2';
      officer2.email = 'off2@mail.com';
      officer2.first_name = 'Off2';
      officer2.last_name = 'Icial2';

      const roleDAO = new Role();
      roleDAO.id = 1;
      roleDAO.title = 'SuperUser';
      roleDAO.municipalityOfficer = [officer1, officer2];

      const dto = mapRoleDAOToDTO(roleDAO);

      expect(dto).toEqual({
        title: 'SuperUser',
        officers: [
          { username: 'off1', email: 'off1@mail.com', first_name: 'Off1', last_name: 'Icial1' },
          { username: 'off2', email: 'off2@mail.com', first_name: 'Off2', last_name: 'Icial2' },
        ],
      });
    });

    it('dovrebbe mappare correttamente Role DAO a RoleResponseDTO senza ufficiali', () => {
      const roleDAO = new Role();
      roleDAO.id = 2;
      roleDAO.title = 'Guest';

      const dto = mapRoleDAOToDTO(roleDAO);

      expect(dto).toEqual({
        title: 'Guest',
      });
    });
  });

  describe('mapUserDAOToDTO', () => {
    it('dovrebbe mappare correttamente User DAO a UserResponseDTO con reports', () => {
      const report1 = new Report();
      report1.id = 1;
      report1.title = 'Report Utente 1';
      report1.longitude = 1.0;
      report1.latitude = 1.0;
      report1.description = 'Desc1';
      report1.photos = [
        Object.assign(new ReportPhoto(), { id: 1, photo: 'p1.jpg' })
      ];
      report1.user = Object.assign(new User(), { id: 1000 });
      report1.category = Object.assign(new Category(), { id: 2000 });


      const report2 = new Report();
      report2.id = 2;
      report2.title = 'Report Utente 2';
      report2.longitude = 2.0;
      report2.latitude = 2.0;
      report2.description = 'Desc2';
      report2.photos = [
        Object.assign(new ReportPhoto(), { id: 2, photo: 'p2.jpg' })
      ];
      report2.user = Object.assign(new User(), { id: 1000 });
      report2.category = Object.assign(new Category(), { id: 2000 });


      const userDAO = new User();
      userDAO.id = 1; // ID del userDAO
      userDAO.username = 'usermapper';
      userDAO.email = 'user@example.com';
      userDAO.first_name = 'Nome';
      userDAO.last_name = 'Cognome';
      userDAO.reports = [report1, report2];

      const dto = mapUserDAOToDTO(userDAO);

      expect(dto).toEqual({
        // userId non viene mappato dal codice di produzione, quindi non deve essere qui
        username: 'usermapper',
        email: 'user@example.com',
        // password: null è rimosso da removeNullAttributes perché opzionale
        first_name: 'Nome',
        last_name: 'Cognome',
        reports: [
          {
            longitude: 1.0,
            latitude: 1.0,
            title: 'Report Utente 1',
            description: 'Desc1',
            userId: 1000,
            categoryId: 2000,
            photos: ['p1.jpg']
          },
          {
            longitude: 2.0,
            latitude: 2.0,
            title: 'Report Utente 2',
            description: 'Desc2',
            userId: 1000,
            categoryId: 2000,
            photos: ['p2.jpg']
          },
        ],
      });
    });

    it('dovrebbe mappare correttamente User DAO a UserResponseDTO senza reports', () => {
      const userDAO = new User();
      userDAO.id = 2; // ID del userDAO
      userDAO.username = 'nousermapper';
      userDAO.email = 'nouser@example.com';
      userDAO.first_name = 'Senza';
      userDAO.last_name = 'Report';

      const dto = mapUserDAOToDTO(userDAO);

      expect(dto).toEqual({
        // userId non viene mappato dal codice di produzione, quindi non deve essere qui
        username: 'nousermapper',
        email: 'nouser@example.com',
        // password: null è rimosso da removeNullAttributes perché opzionale
        first_name: 'Senza',
        last_name: 'Report',
      });
    });
  });

  // ------------- Test Request -> DAO Mappers -------------

  describe('mapCreateReportRequestToDAO', () => {
    it('dovrebbe mappare correttamente CreateReportRequestDTO a Report DAO completo', () => {
      const requestDTO: CreateReportRequestDTO = {
        longitude: 10.5,
        latitude: 20.5,
        title: 'Nuovo Report',
        description: 'Descrizione del nuovo report',
        userId: 10,
        categoryId: 20,
        photos: ['url1.jpg', 'url2.jpg'],
      };

      const dao = mapCreateReportRequestToDAO(requestDTO);

      expect(dao).toBeInstanceOf(Report);
      expect(dao.longitude).toBe(10.5);
      expect(dao.latitude).toBe(20.5);
      expect(dao.title).toBe('Nuovo Report');
      expect(dao.description).toBe('Descrizione del nuovo report');
      expect(dao.user).toBeInstanceOf(User);
      expect(dao.user.id).toBe(10);
      expect(dao.category).toBeInstanceOf(Category);
      expect(dao.category.id).toBe(20);
      expect(dao.photos).toBeUndefined();
    });
  });
});