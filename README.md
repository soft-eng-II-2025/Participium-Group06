# Participium-Group06

## Team members:
Francesco Servente s328852 \
Alessandro Aldo Raoul Bonciani s345411 \
Adrien Lacroix s350731 \
Erestina Vreto s345027 \
Flavia Calabrese s334080 \
Livio Galanti s340475 



Participium is a civic reporting platform that connects citizens and municipalities for efficient issue management and resolution.  
The project is composed of:
- **Backend** (`server/`): Node.js + TypeORM + PostgreSQL
- **Frontend** (`frontend/`): React
- **Database**: PostgreSQL (Dockerized)
- **Migrations**: Managed via TypeORM and automatically executed in Docker

---

## 1) 🐳 Docker Setup

```bash
# Stop all containers
docker compose down

# Start the environment (Postgres + Migration)
docker compose up --build migrator

This command both initializes the schema and seeds the database with roles, categories, and an admin user.
Once completed, the migrator container will stop automatically.


```

Builds and starts the Postgres container on port 5434.

Automatically runs the TypeORM migrations to create and seed the database (roles, categories, admin user).


## 2) Backend Setup 
```
# Install backend dependencies
cd server
npm install

# Start the backend
npm run dev
```

The backend will run on http://localhost:3000



## 3) Frontend Setup
```
cd frontend
npm install
npm start
```
The frontend will run on http://localhost:8080


### **Municipality Officer Admin credentials:**

- Username: admin
- Password: Admin#2025!


## Ports Configuration
| Service     | Host Port | Container Port | Description    |
| ----------- |-----------|----------------| -------------- |
| PostgreSQL  | 5434      | 5432           | Database       |
| Backend API | 3000      | -              | Node.js server |
| Frontend    | 8080      | -              | React app      |





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

- POST `/api/users/reports/images/upload`
    - Description: Uploads up to 3 images for a report and returns their URLs.
    - Success: Returns an object containing the list of uploaded image URLs.
    - Error: Returns an error response if upload fails or no files are provided.

- GET `/api/users/reports/categories`
    - Description: Returns the full list of available report categories.
    - Success: Returns the full list of available report categories.
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


### **User Routes - Municipality Officer**

- PUT `/api/reports/:id/status`
    - Description: Updates the status of an existing report.
    - Success: Returns the updated report object.
    - Error: Returns an error response.

- GET `/api/reports/list`
    - Description: Retrieves the list of all reports.
    - Success: Returns an array of report objects.
    - Error: Returns an error response.



## Frontend API 


### **Overview**

**User API**
```ts
import {UserResponseDTO} from "./UserResponseDTO";
import {LoginDTO} from "./LoginDTO";

function registerUser(user: UserResponseDTO);    // POST /api/register  registers a new user account into the system
function login(credentials: LoginDTO);            // POST /api/login                       
function addReport(report: ReportResponseDTO);   // POST /api/users/reports
```

**Admin API**

```ts
import {MunicipalityOfficerResponseDTO} from "./MunicipalityOfficerResponseDTO";

function registerMunicipalityOfficer(body: MunicipalityOfficerResponseDTO);  // POST /api/admin/accounts/register  registers a new municipality officer account into the system
function getAllMunicipalityUsers(): Promise<MunicipalityOfficerResponseDTO[]>;                       // GET /api/admin/accounts/list       retrieves all municipality users in the system
function setRole(body: MunicipalityOfficerResponseDTO);                      // PUT /api/admin/accounts/assign     assigns a role to a specific municipality user
function getRoles(): Promise<RoleResponseDTO[]>;                                              // GET /api/admin/roles/list   retrieves all available roles in the system
```

### 👥 Municipality Officer Roles

| Role Name | Assigned Categories |
| :--- | :--- |
| `ADMIN` | ALL |
| `ORGANIZATION_OFFICER` | ALL |
| `TECH_LEAD_INFRASTRUCTURE` | Roads and Urban Furnishings \| Sewer System \| Water Supply – Drinking Water |
| `TECH_AGENT_INFRASTRUCTURE` | Roads and Urban Furnishings \| Architectural Barriers \| Sewer System \| Water Supply – Drinking Water |
| `TECH_LEAD_MOBILITY` | Road Signs and Traffic Lights |
| `TECH_AGENT_MOBILITY` | Road Signs and Traffic Lights \| Roads and Urban Furnishings |
| `TECH_LEAD_GREEN_AREAS` | Public Green Areas and Playgrounds |
| `TECH_AGENT_GREEN_AREAS` | Public Green Areas and Playgrounds |
| `TECH_LEAD_WASTE_MANAGEMENT` | Waste |
| `TECH_AGENT_WASTE_MANAGEMENT` | Waste \| Sewer System |
| `TECH_LEAD_ENERGY_LIGHTING` | Public Lighting |
| `TECH_AGENT_ENERGY_LIGHTING` | Public Lighting |
| `TECH_LEAD_PUBLIC_BUILDINGS` | Architectural Barriers \| Other |
| `TECH_AGENT_PUBLIC_BUILDINGS` | Architectural Barriers \| Other |
