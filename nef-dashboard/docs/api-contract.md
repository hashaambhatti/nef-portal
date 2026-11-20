> **Note (v2.2.0):** this was the original contract. The implemented API (new endpoints such as
> `/users/me`, `/teachers/me`, `/schools/public`, `/guardians/:id`, and the Teacher-only signup)
> is documented in `nef-backend/README.md` section 4.

# API Endpoint Integration Contract

This contract defines the communication protocols, endpoint names, input shapes, query arguments, and success outputs for migrating the NEF School Portal frontend to a real backend server database.

To redirect all frontend requests from the local `localStorage` mock DB to your live server API:
1. Open `config.js` at the root of the project.
2. Toggle the flag `USE_MOCK_API` to `false`.
3. Set `API_BASE_URL` to your backend service endpoint URL (e.g., `http://your-server-ip/api`).

---

## Global Request Configurations
* **Base URL**: `http://<server-ip>:<port>/api`
* **Headers**:
  * `Content-Type: application/json`
  * `Authorization: Bearer <jwt-auth-token>` (injected automatically from local memory by `httpClient.js` upon sign in)

---

## 1. Authentication Services (`authService.js`)

### Login User
* **Method & Endpoint**: `POST /auth/login`
* **Payload**:
  ```json
  {
    "username": "admin",
    "password": "password123"
  }
  ```
* **Success Output (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "username": "admin",
      "name": "Super Administrator",
      "email": "admin@nef.gov.pk",
      "role": "Admin"
    }
  }
  ```

### Register User
* **Method & Endpoint**: `POST /auth/signup`
* **Payload**:
  ```json
  {
    "username": "t_asif",
    "name": "Asif Mahmood",
    "email": "asif@nef.gov.pk",
    "password": "securePass123",
    "role": "Teacher",
    "teacherId": "TCH-001"
  }
  ```
* **Success Output (201 Created)**:
  ```json
  {
    "message": "User registered successfully."
  }
  ```

### Users (sub-resource, used by profile editing)
* **Fetch Users**: `GET /users`
* **Save Users**: `PUT /users` (bulk replace — used when a user edits their own name/email/password from the Profile page)
* **Note**: Once a real backend exists, prefer scoping this to a single-user update endpoint (e.g. `PATCH /users/:id`) rather than the bulk-replace pattern the mock layer uses — the bulk pattern is a localStorage-era shortcut, not a recommendation for the real API shape.

---

## 2. Student Registry (`studentService.js`)

### Get Students list
* **Method & Endpoint**: `GET /students`
* **Success Output (200 OK)**:
  ```json
  [
    {
      "studentId": "STD-001",
      "name": "Hamza Ali",
      "gender": "Male",
      "class": "Prep",
      "teacherId": "TCH-001",
      "teacherName": "Asif Mahmood",
      "schoolName": "NEF Primary School Rawal",
      "guardianContact": "+92 300 9876543",
      "residencyStatus": "Permanent",
      "citizenship": "Pakistani",
      "disability": "No",
      "orphan": "No",
      "refugee": "No"
    }
  ]
  ```

### Enroll Student
* **Method & Endpoint**: `POST /students`
* **Payload**:
  ```json
  {
    "studentId": "STD-021",
    "name": "Zainab Bibi",
    "gender": "Female",
    "class": "Grade 1",
    "teacherId": "TCH-002",
    "teacherName": "Zahida Parveen",
    "schoolName": "GB Model Middle School Hunza",
    "residencyStatus": "Temporary",
    "citizenship": "Refugee",
    "disability": "Yes",
    "specify": "Visually Impaired",
    "guardianContact": "+92 312 4567890",
    "orphan": "Yes",
    "refugee": "Yes"
  }
  ```
* **Success Output (201 Created)**: Returns the complete created student record.

### Update Student Profile
* **Method & Endpoint**: `PUT /students/:studentId`
* **Success Output (200 OK)**: Returns the updated student record.

### Remove Student Profile
* **Method & Endpoint**: `DELETE /students/:studentId`
* **Success Output (200 OK)**: `{"message": "Student record deleted successfully."}`
* **Note**: In the mock layer this cascades to delete the student's linked guardian record and their attendance history. Recommend enforcing this cascade server-side (e.g. via a DB transaction or ON DELETE CASCADE) rather than relying on the frontend to make three separate calls.

### Guardians (sub-resource of Students)
* **Fetch Guardians**: `GET /guardians`
* **Save Guardians**: `PUT /guardians` (bulk replace — used when enrolling a student, whose form also creates a guardian record)

---

## 3. Teacher Profiles (`teacherService.js`)

### Fetch Teachers
* **Method & Endpoint**: `GET /teachers`

### Create Teacher
* **Method & Endpoint**: `POST /teachers`

### Update Teacher
* **Method & Endpoint**: `PUT /teachers/:teacherId`

### Delete Teacher
* **Method & Endpoint**: `DELETE /teachers/:teacherId`

---

## 4. Schools Database (`schoolService.js`)

### Fetch Schools
* **Method & Endpoint**: `GET /schools`

### Create School
* **Method & Endpoint**: `POST /schools`

### Update School
* **Method & Endpoint**: `PUT /schools/:schoolCode`

### Delete School
* **Method & Endpoint**: `DELETE /schools/:schoolCode`
* **Note**: In the mock layer this cascades to delete the school's linked building record and any classes tied to it. Recommend enforcing this cascade server-side rather than relying on three separate frontend calls.

### Buildings & Classes (sub-resources of Schools)
* **Fetch Buildings**: `GET /buildings`
* **Save Buildings**: `PUT /buildings` (bulk replace)
* **Fetch Classes**: `GET /classes`
* **Save Classes**: `PUT /classes` (bulk replace)

---

## 5. Student Attendance Sheets (`attendanceService.js`)

### Retrieve Logs
* **Method & Endpoint**: `GET /attendance`

### Save Attendance Log
* **Method & Endpoint**: `PUT /attendance`
* **Payload**:
  ```json
  [
    {
      "studentId": "STD-001",
      "date": "2026-07-24",
      "status": "Present"
    },
    {
      "studentId": "STD-002",
      "date": "2026-07-24",
      "status": "Absent"
    }
  ]
  ```
* **Success Output (200 OK)**: Returns success verification.
