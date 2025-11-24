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

### **Auth Routes**
- POST `/api/register`
  - Description: Creates a new user in the database.
  - Success: Returns the newly created user object.
  - Error: Returns an error response.

- POST `/api/login`
  - Description: Logs in a user using the provided username and password.
  - Success: Returns the logged-in user object.
  - Error: Returns an error.

- GET `/api/logout`
  - Description: Logs out the currently logged-in user.
  - Success: Returns a success message.

- GET `/api/session`
  - Description: Retrieves the currently logged-in user object.
  - Success: Returns the logged-in user object.
  - Error: Returns an error.

### **User Routes - Citizen**
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

### **User Routes - Tech-Lead**
- PUT `/api/tech-lead/:officerId/report/:reportId`
  - Description: Assigns a report to an Officer. 
  - Success: Returns the updated report
  - Error: Returns an error response

- GET `/api/tech-lead/:id/agents`
  - Desciption: Returns the list of all the tech agents of the tech lead.
  - Success: Returns a list of municipality users.
  - Error: Returns an error response

- GET `/api/tech-lead/:id/reports/list`
  - Description: Returns the list of all the reports of the category managed by a tech lead, except the one in pending approval
  - Success: Returns a list of report
  - Error: Returns an error response

### **User Routes - Tech agents**
- GET `/api/tech/:id/reports/list`
  - Description: Returns the list of all the reports assign to a tech agent
  - Sucess: Returns a list of report
  - Error: Returns an error response

### **Report Routes**
- POST `/api/reports/:id/status`
  - Description: Modify the status of a report given its id
  - Success: Returns the updated report
  - Error: Returns an error response

- GET `/api/reports/list`
  - Desciption: Retrieves all the reports 
  - Sucess: Return a list of reports
  - Error: Returns an error response

### **Message Routes**
- POST `/api/messages/:reportId`
  - Description: Sends a new message linked to a specific report. The sender is inferred from the authenticated user (regular user or municipality officer), while recipientId identifies the other party.
  - Success: Returns the created message object
  - Error: Returns an error response

- GET `/api/messages/:reportId`
    - Description: Retrieves all the messages associated with a specific report.
    - Success: Returns a list of message objects.
    - Error: Returns an error response


### **Notification Routes**

- GET `/api/notifications`
    - Description: Retrieves all notifications for the currently authenticated user, ordered by creation date.
    - Success: Returns a list of notification objects.
    - Error: Returns an error response

- DELETE `/api/notifications/:id`
    - Description: Deletes a specific notification belonging to the authenticated user (used to mark it as read/handled).
    - Success: Returns a confirmation object.
    - Error: Returns an error response

## Frontend API 


### **Overview**

**Auth API**
```ts
function registerUser(params: CreateUserRequestDTO);   // POST /api/register  registers a new user account into the system
function login(params: LoginRequestDTO);              // POST /api/login    
function logout();                                   // GET /api/logout
function getSession();                              // GET /api/session

```
**User API**
```ts
function addReport(report: ReportResponseDTO);                   // POST /api/users/reports
function uploadReportImages(images: File[]): Promise<string[]>  // POST /api/users/reports/images/upload
function getAllCategories(): Promise<CategoryResponseDTO[]>    // GET /api/users/reports/categories
function updateUserProfile(userId: number, payload: UpdateUserRequestDTO): Promise<UserResponseDTO>  // PUT /api/users/:id
```

**Admin API**

```ts
import {MunicipalityOfficerResponseDTO} from "./MunicipalityOfficerResponseDTO";

function registerMunicipalityOfficer(body: MunicipalityOfficerResponseDTO);  // POST /api/admin/accounts/register  registers a new municipality officer account into the system
function getAllMunicipalityUsers(): Promise<MunicipalityOfficerResponseDTO[]>;                       // GET /api/admin/accounts/list       retrieves all municipality users in the system
function setRole(body: MunicipalityOfficerResponseDTO);                      // PUT /api/admin/accounts/assign     assigns a role to a specific municipality user
function getRoles(): Promise<RoleResponseDTO[]>;                                              // GET /api/admin/roles/list   retrieves all available roles in the system
```

**Report API**
```ts
function getAllReports(): Promise<ReportResponseDTO[]>;  // GET /api/reports/list
function updateReportStatus(reportId: number, payload: UpdateStatusReportDTO): Promise<ReportResponseDTO>;  // PUT /api/reports/:id/status
```

**Tech Lead API**
```ts
function assignTechAgent(officerId: number, reportId: number): Promise<ReportResponseDTO>;  // PUT /api/tech-lead/:officerId/report/:reportId
function getAgentsByTechLeadId(techLeadId: number): Promise<MunicipalityOfficerResponseDTO[]>;  // GET /api/tech-lead/:id/agents
function getTechLeadReports(techLeadId: number): Promise<ReportResponseDTO[]>;  // GET /api/tech-lead/:id/reports/list
```

**Tech API**
```ts
function getTechReports(techAgentId: number): Promise<ReportResponseDTO[]>;  // GET /api/tech/:id/reports/list
```

**Message API**
```ts
function sendMessage(payload: SendMessageRequestDTO, reportId: number): Promise<MessageResponseDTO> // POST /api/messages
function getMessagesByReport(reportId: number): Promise<MessageResponseDTO[]>;  // GET /api/messages/:reportId
```

**Notification API**
```ts
function getMyNotifications(): Promise<NotificationDTO[]>;  // GET /api/notifications
function deleteNotification(notificationId: number): Promise<void>;  // DELETE /api/notifications/:id
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


### Username e Password Users

    -- luigibianchi password in chiaro: LuigiBianchi
    -- annaverdi password in chiaro: AnnaVerdi
    -- giulianeri password in chiaro: GiuliaNeri
    -- paolorussi password in chiaro: PaoloRussi
    -- saraferrari password in chiaro: SaraFerrari
    -- lucagalli password in chiaro: LucaGalli
    -- francescacosta password in chiaro: FrancescaCosta
    -- elenamarino password in chiaro: ElenaMarino
    -- giorgiotesta password in chiaro: GiorgioTesta


### Username e Password Officers

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
