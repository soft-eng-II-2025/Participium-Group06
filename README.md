# Participium-Group06

## To start Docker - Postgres
```
docker compose up -d 
```
## To stop Docker - Postgres
```
docker compose down
```

## To start backend
```
cd server
npm run dev
```

## To start frontend
```
cd frontend
npm install
npm start
```



## Backend API
### **User Routes - Citizen**

- POST `/api/register`
  - Description: Creates a new user in the database.
  - Success: Returns the newly created user object.
  - Error: Returns an error response.

- POST `/api/login`
  - Description: Logs in a user using the provided username and password.
  - Success: Returns the logged-in user object.
  - Error: Returns an error.

- POST `/api/users/reports`
  - Description: Adds a new report to the database.
  - Success: Returns the newly created report object.
  - Error: Returns an error response.

### **User Routes - Admin**
- POST `/api/admin/accounts/register`
  - Description: Creates a new municipality officer in the database.
  - Success: Returns the newly created user object.
  - Error: Returns an error response.

- GET `/api/admin/accounts/list`
  - Description: Retrieves a list of all municipality officers currently in the database.
  - Success: Returns an array of municipality user objects.

- PUT `/api/admin/accounts/assign`
  - Description: Assigns a specific role to a municipality officer.
  - Success: Returns the user object with the updated role information.
  - Error: Returns an error response.

- GET `/api/admin/roles/list`
  - Description: Retrieves a list of all available roles that can be assigned to municipality officers.
  - Success: Returns an array of role objects.
  - Error: Returns an error response.



## Frontend API 


### **Overview**

**User API**
```ts
import {UserDTO} from "./UserDTO";
import {LoginDTO} from "./LoginDTO";

function registerUser(user: UserDTO);    // POST /api/register  registers a new user account into the system
function login(credentials: LoginDTO);   // POST /api/login                       
function addReport(report: ReportDTO);   // POST /api/users/reports
```

**Admin API**

```ts
import {MunicipalityOfficerDTO} from "./MunicipalityOfficerDTO";

function registerMunicipalityOfficer(body: MunicipalityOfficerDTO);  // POST /api/admin/accounts/register  registers a new municipality officer account into the system
function getAllMunicipalityUsers(): Promise<MunicipalityOfficerDTO[]>;                       // GET /api/admin/accounts/list       retrieves all municipality users in the system
function setRole(body: MunicipalityOfficerDTO);                      // PUT /api/admin/accounts/assign     assigns a role to a specific municipality user
function getRoles(): Promise<RoleDTO[]>;                                              // GET /api/admin/roles/list   retrieves all available roles in the system
```
