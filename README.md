# Participium-Group06

## Backend API
### **User Routes - Citizen**

- POST `/api/register`
  - Description: Creates a new user in the database.
  - Success: Returns the newly created user object.
  - Error: Returns an error response.

- POST `/api/login`
  - Description: Logs in a user using the provided username and password.
  - Success: Returns the logged-in user object.
  - Error: Returns an "Unauthorized" response (e.g., status 401).

- POST `/api/report/new`
  - Description: Adds a new report to the database.
  - Success: Returns the newly created report object.
  - Error: Returns an error response.

### **User Routes - Admin**
- POST `/api/admin/accounts/register`
  - Description: Creates a new municipality user in the database.
  - Success: Returns the newly created user object.
  - Error: Returns an error response.

- GET `/api/admin/accounts/list`
  - Description: Retrieves a list of all municipality users currently in the database.
  - Success: Returns an array of municipality user objects.

- PATCH `/api/admin/accounts/assign`
  - Description: Assigns a specific role to a municipality user.
  - Success: Returns the user object with the updated role information.
  - Error: Returns an error response.



## 📄 Frontend API 


### **Overview**

**User API**
```js
registerUser(user: User);       // POST /register  registers a new user account into the system
login(credentials: { username: string, password: string });  // POST /login                       
addReport(report: Report);      //POST /report/new
```

**Admin API**
```js
registerMunicipalityUser(user: User);    //POST /admin/accounts/register  registers a new municipality user account into the system
getAllMunicipalityUsers(): User[];       //GET /admin/accounts/list       retrieves all municipality users in the system
setRole(roleInfo: {roleId: number, userId: number});  //PATCH /admin/accounts/assign assigns a role to a specific municipality user
```
