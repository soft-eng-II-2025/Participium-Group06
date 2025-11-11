# Participium-Group06

## Team members:
Francesco Servente s328852


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
| Backend API | 3000      | 3000           | Node.js server |
| Frontend    | 8080      | 8080           | React app      |





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

### **Municipality Officers Roles:**

- ADMIN (Manages the entire platform and assigns roles to other municipal officers)

- ORGANIZATION_OFFICER (Reviews citizen reports, approves or rejects them, and assigns them to the correct technical area.)

- TECH_LEAD_INFRASTRUCTURE (Supervises infrastructure and road maintenance.)

- TECH_AGENT_INFRASTRUCTURE (Performs field work and updates report status on roads and infrastructure.)

- TECH_LEAD_GREEN_AREAS (Manages public parks, green areas, and playgrounds.)

- TECH_AGENT_GREEN_AREAS (Carries out maintenance tasks in green and recreational areas.)

- TECH_LEAD_ENVIRONMENTAL_QUALITY (Oversees pollution control and environmental hygiene.)

- TECH_AGENT_ENVIRONMENTAL_QUALITY (Performs environmental inspections and clean-up operations.)

- TECH_LEAD_URBAN_PLANNING (Responsible for urban accessibility and architectural barriers.)

- TECH_AGENT_URBAN_PLANNING (Conducts on-site evaluations of accessibility and urban design issues.)

- TECH_LEAD_PRIVATE_BUILDINGS (Supervises private building safety and code compliance.)

- TECH_AGENT_PRIVATE_BUILDINGS (Handles inspections of private properties and construction issues.)

- TECH_LEAD_PUBLIC_BUILDINGS (Manages maintenance of schools and municipal buildings.)

- TECH_AGENT_PUBLIC_BUILDINGS (Executes maintenance and repair work on public buildings.)

- TECH_LEAD_ENERGY_LIGHTING (Supervises public lighting and energy systems.)

- TECH_AGENT_ENERGY_LIGHTING (Repairs and maintains streetlights and energy installations.)

- TECH_LEAD_MOBILITY_TRANSPORT (Oversees mobility, transport, and parking infrastructure.)

- TECH_AGENT_MOBILITY_TRANSPORT (Handles traffic light, signage, and parking maintenance.)

- TECH_LEAD_WASTE_MANAGEMENT (Manages waste collection, street cleaning, and hygiene services.)

- TECH_AGENT_WASTE_MANAGEMENT (Performs waste removal and street cleaning tasks.)
