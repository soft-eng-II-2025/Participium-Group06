import { TestDataSource } from '../../test-data-source';
import { DataSource, Repository } from 'typeorm';

import * as userController from '../../../controllers/userController';
import { UserRepository } from '../../../repositories/UserRepository';

import { CreateUserRequestDTO } from '../../../models/DTOs/CreateUserRequestDTO';
import { UpdateUserRequestDTO } from '../../../models/DTOs/UpdateUserRequestDTO';




describe('userController - unit test', () => {
    let dataSource: DataSource;
    let userRepository: UserRepository;

    beforeAll(async () => {
        dataSource = await TestDataSource.initialize();
        userRepository = new UserRepository(dataSource);
        userController.initializeUserRepositories(dataSource);
    });

    afterAll(async () => {
        await dataSource.destroy();
    });
    
    beforeEach(async () => {
        // Pulire i dati prima di ogni test
        await dataSource.synchronize(true);
    });

    describe('createUser', () => {
        it('should create a new user successfully', async () => {
            const userData :CreateUserRequestDTO = {
                username: 'testuser',
                email: 'test@test.com',
                password: 'test_password',
                first_name: 'Test',
                last_name: 'User',
            };

            //Use of the function createUser
            const newUser = await userController.createUser(userData);

            expect(newUser).toBeDefined();
            expect(newUser.username).toBe(userData.username);
            expect(newUser.email).toBe(userData.email);
            expect(newUser.first_name).toBe(userData.first_name);
            expect(newUser.last_name).toBe(userData.last_name);
        });
    });

    //Add update User

});
