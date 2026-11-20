#!/usr/bin/env node
// Loads demo data (5 schools, 8 teachers, 20 students, guardians, attendance)
// into the database configured in .env - the same data the dashboard's demo
// mode uses. Also creates two Teacher logins for testing the teacher pages.
//
// Usage:   npm run db:seed-demo
//          (teacher password defaults to Teacher123; override with
//           DEMO_TEACHER_PASSWORD=YourPass1 npm run db:seed-demo)
//
// Safe to run more than once: rows that already exist are skipped, never
// overwritten. Do NOT run this on a production database with real data.

require("dotenv").config();
const mysql = require("mysql2/promise");
const { connectionOptions } = require("../src/config/db");
const { hashPassword } = require("../src/utils/password");

// ---- demo data (the same data the dashboard's demo mode uses) ----
const DATA = {
  "schools": [
    {
      "schoolCode": "SCH-001",
      "name": "NEF Primary School Rawal",
      "region": "Islamabad capital Territory",
      "district": "Islamabad",
      "tehsil": "Islamabad",
      "uc": "UC-12 Rawal",
      "completeAddress": "Street 4, Sector G-7/1, Islamabad",
      "totalStudents": 5,
      "totalTeachers": 2,
      "contactNo": "+92 51 9201122",
      "headTeacherName": "Muhammad Asif",
      "headTeacherContactNo": "+92 300 1234567",
      "coordinates": {
        "lat": 33.7294,
        "long": 73.0931
      },
      "buildingId": "BLD-001",
      "schoolLevel": "Primary",
      "schoolType": "Community School",
      "schoolGender": "Co-Education",
      "schoolStatus": "Functional",
      "schoolSignBoard": "Yes",
      "dateOfEstablishment": "2015-04-12"
    },
    {
      "schoolCode": "SCH-002",
      "name": "GB Model Middle School Hunza",
      "region": "GB",
      "district": "Hunza",
      "tehsil": "Aliabad",
      "uc": "UC-02 Karimabad",
      "completeAddress": "Main Bazar Karimabad, Hunza",
      "totalStudents": 4,
      "totalTeachers": 2,
      "contactNo": "+92 581 1455201",
      "headTeacherName": "Zahida Parveen",
      "headTeacherContactNo": "+92 333 5556677",
      "coordinates": {
        "lat": 36.3167,
        "long": 74.65
      },
      "buildingId": "BLD-002",
      "schoolLevel": "Middle",
      "schoolType": "Non-Formal (Accelerated Learning Center)",
      "schoolGender": "Co-Education",
      "schoolStatus": "Functional",
      "schoolSignBoard": "Yes",
      "dateOfEstablishment": "2018-09-01"
    },
    {
      "schoolCode": "SCH-003",
      "name": "AJK Girls Secondary School Bagh",
      "region": "AJK",
      "district": "Bagh",
      "tehsil": "Bagh",
      "uc": "UC-08 Dhirkot",
      "completeAddress": "Near Post Office, Bagh",
      "totalStudents": 4,
      "totalTeachers": 2,
      "contactNo": "+92 582 3920102",
      "headTeacherName": "Farzana Bibi",
      "headTeacherContactNo": "+92 345 9876543",
      "coordinates": {
        "lat": 33.975,
        "long": 73.7917
      },
      "buildingId": "BLD-003",
      "schoolLevel": "Secondary",
      "schoolType": "Non-Formal",
      "schoolGender": "Female",
      "schoolStatus": "Functional",
      "schoolSignBoard": "Yes",
      "dateOfEstablishment": "2012-05-15"
    },
    {
      "schoolCode": "SCH-004",
      "name": "NEF Adult Literacy Center Gilgit",
      "region": "GB",
      "district": "Gilgit",
      "tehsil": "Gilgit",
      "uc": "UC-01 Jutial",
      "completeAddress": "Jutial, near High Court, Gilgit",
      "totalStudents": 4,
      "totalTeachers": 1,
      "contactNo": "+92 581 1234567",
      "headTeacherName": "Ali Raza",
      "headTeacherContactNo": "+92 312 9988776",
      "coordinates": {
        "lat": 35.9208,
        "long": 74.3089
      },
      "buildingId": "BLD-004",
      "schoolLevel": "Primary",
      "schoolType": "Adult Literacy",
      "schoolGender": "Male",
      "schoolStatus": "Functional",
      "schoolSignBoard": "No",
      "dateOfEstablishment": "2020-11-20"
    },
    {
      "schoolCode": "SCH-005",
      "name": "Kashmir Community School Muzaffarabad",
      "region": "AJK",
      "district": "Muzaffarabad",
      "tehsil": "Muzaffarabad",
      "uc": "UC-15 Shaheed Gali",
      "completeAddress": "Shaheed Gali Road, Muzaffarabad",
      "totalStudents": 3,
      "totalTeachers": 1,
      "contactNo": "+92 582 2445566",
      "headTeacherName": "Sajid Mahmood",
      "headTeacherContactNo": "+92 321 4455667",
      "coordinates": {
        "lat": 34.37,
        "long": 73.4711
      },
      "buildingId": "BLD-005",
      "schoolLevel": "Primary",
      "schoolType": "Community School",
      "schoolGender": "Co-Education",
      "schoolStatus": "Non functional",
      "schoolSignBoard": "No",
      "dateOfEstablishment": "2010-03-10"
    }
  ],
  "buildings": [
    {
      "buildingId": "BLD-001",
      "type": "NEF Building",
      "noOfRooms": 4,
      "noOfWashrooms": 2,
      "drinkingWater": "Yes",
      "electricity": "Yes",
      "condition": "Satisfactory",
      "specify": "Standard school premises with basic amenities",
      "schoolId": "SCH-001"
    },
    {
      "buildingId": "BLD-002",
      "type": "Rented",
      "noOfRooms": 5,
      "noOfWashrooms": 2,
      "drinkingWater": "Yes",
      "electricity": "Yes",
      "condition": "Required white wash",
      "specify": "Needs paint job inside classrooms",
      "schoolId": "SCH-002"
    },
    {
      "buildingId": "BLD-003",
      "type": "Own House",
      "noOfRooms": 6,
      "noOfWashrooms": 3,
      "drinkingWater": "Yes",
      "electricity": "Yes",
      "condition": "Satisfactory",
      "specify": "Well-maintained custom residential structure",
      "schoolId": "SCH-003"
    },
    {
      "buildingId": "BLD-004",
      "type": "Community",
      "noOfRooms": 2,
      "noOfWashrooms": 1,
      "drinkingWater": "Yes",
      "electricity": "No",
      "condition": "Required renovation",
      "specify": "Solar panel connection required, roof leak",
      "schoolId": "SCH-004"
    },
    {
      "buildingId": "BLD-005",
      "type": "Rented",
      "noOfRooms": 3,
      "noOfWashrooms": 1,
      "drinkingWater": "No",
      "electricity": "No",
      "condition": "Required renovation",
      "specify": "Closed building, currently locked down",
      "schoolId": "SCH-005"
    }
  ],
  "classes": [
    {
      "schoolId": "SCH-001",
      "noOfClasses": 3,
      "classType": "Grade 1, 2, 3",
      "maleStudents": 3,
      "femaleStudents": 2
    },
    {
      "schoolId": "SCH-002",
      "noOfClasses": 4,
      "classType": "Grade 6, 7, 8",
      "maleStudents": 2,
      "femaleStudents": 2
    },
    {
      "schoolId": "SCH-003",
      "noOfClasses": 5,
      "classType": "Grade 9, 10",
      "maleStudents": 0,
      "femaleStudents": 4
    },
    {
      "schoolId": "SCH-004",
      "noOfClasses": 2,
      "classType": "ALC Level 1",
      "maleStudents": 4,
      "femaleStudents": 0
    },
    {
      "schoolId": "SCH-005",
      "noOfClasses": 1,
      "classType": "Grade 1",
      "maleStudents": 2,
      "femaleStudents": 1
    }
  ],
  "teachers": [
    {
      "teacherId": "TCH-001",
      "name": "Amara Khan",
      "cnic": "3740512345678",
      "contactNo": "+92 333 1122334",
      "schoolId": "SCH-001",
      "qualification": "16 years masters in science",
      "professionalQualification": "B.Ed",
      "dateOfJoining": "2022-03-15",
      "lastTrainingTaken": "2025-11-20",
      "noOfTrainingsAttended": 4,
      "employmentStatus": "Employed",
      "androidPhone": "Yes",
      "internetAccess": "Yes",
      "bankAccountNo": "1234567890123",
      "bankName": "Habib Bank Limited",
      "iban": "PK73HABB001234567890123"
    },
    {
      "teacherId": "TCH-002",
      "name": "Zahida Parveen",
      "cnic": "3740523456789",
      "contactNo": "+92 333 5556677",
      "schoolId": "SCH-002",
      "qualification": "16 years masters in other subject",
      "professionalQualification": "M.Ed",
      "dateOfJoining": "2020-01-10",
      "lastTrainingTaken": "2026-02-18",
      "noOfTrainingsAttended": 6,
      "employmentStatus": "Employed",
      "androidPhone": "Yes",
      "internetAccess": "Yes",
      "bankAccountNo": "9876543210987",
      "bankName": "National Bank of Pakistan",
      "iban": "PK45NBPK009876543210987"
    },
    {
      "teacherId": "TCH-003",
      "name": "Farzana Bibi",
      "cnic": "3740534567890",
      "contactNo": "+92 345 9876543",
      "schoolId": "SCH-003",
      "qualification": "14 years graduation",
      "professionalQualification": "Certificate in ECE",
      "dateOfJoining": "2021-08-01",
      "lastTrainingTaken": "2025-05-12",
      "noOfTrainingsAttended": 3,
      "employmentStatus": "Employed",
      "androidPhone": "Yes",
      "internetAccess": "No",
      "bankAccountNo": "5544332211009",
      "bankName": "Allied Bank Limited",
      "iban": "PK22ABPA005544332211009"
    },
    {
      "teacherId": "TCH-004",
      "name": "Ali Raza",
      "cnic": "3740545678901",
      "contactNo": "+92 312 9988776",
      "schoolId": "SCH-004",
      "qualification": "Intermediate Science",
      "professionalQualification": "None",
      "dateOfJoining": "2023-05-20",
      "lastTrainingTaken": "2024-10-10",
      "noOfTrainingsAttended": 1,
      "employmentStatus": "Employed",
      "androidPhone": "No",
      "internetAccess": "No",
      "bankAccountNo": "6677889900112",
      "bankName": "United Bank Limited",
      "iban": "PK99UNIL006677889900112"
    },
    {
      "teacherId": "TCH-005",
      "name": "Sajid Mahmood",
      "cnic": "3740556789012",
      "contactNo": "+92 321 4455667",
      "schoolId": "SCH-005",
      "qualification": "Matric Science",
      "professionalQualification": "None",
      "dateOfJoining": "2019-11-01",
      "lastTrainingTaken": "2023-06-15",
      "noOfTrainingsAttended": 2,
      "employmentStatus": "Resigned",
      "androidPhone": "Yes",
      "internetAccess": "No",
      "bankAccountNo": "2233445566778",
      "bankName": "Meezan Bank Limited",
      "iban": "PK08MEZN002233445566778"
    },
    {
      "teacherId": "TCH-006",
      "name": "Tayyaba Kausar",
      "cnic": "3740567890123",
      "contactNo": "+92 300 9988112",
      "schoolId": "SCH-001",
      "qualification": "MPhil",
      "professionalQualification": "other teaching certification",
      "dateOfJoining": "2024-02-01",
      "lastTrainingTaken": "2026-01-22",
      "noOfTrainingsAttended": 5,
      "employmentStatus": "Employed",
      "androidPhone": "Yes",
      "internetAccess": "Yes",
      "bankAccountNo": "8899001122334",
      "bankName": "Habib Bank Limited",
      "iban": "PK73HABB008899001122334"
    },
    {
      "teacherId": "TCH-007",
      "name": "Nabila Rehman",
      "cnic": "3740578901234",
      "contactNo": "+92 344 5566778",
      "schoolId": "SCH-002",
      "qualification": "PhD",
      "professionalQualification": "M.Ed",
      "dateOfJoining": "2023-09-01",
      "lastTrainingTaken": "2025-08-14",
      "noOfTrainingsAttended": 7,
      "employmentStatus": "Employed",
      "androidPhone": "Yes",
      "internetAccess": "Yes",
      "bankAccountNo": "1122334455667",
      "bankName": "Bank Alfalah",
      "iban": "PK56ALFH001122334455667"
    },
    {
      "teacherId": "TCH-008",
      "name": "Sadia Malik",
      "cnic": "3740589012345",
      "contactNo": "+92 315 2233445",
      "schoolId": "SCH-003",
      "qualification": "Intermediate Humanities",
      "professionalQualification": "None",
      "dateOfJoining": "2024-06-15",
      "lastTrainingTaken": "2025-12-05",
      "noOfTrainingsAttended": 2,
      "employmentStatus": "Employed",
      "androidPhone": "Yes",
      "internetAccess": "Yes",
      "bankAccountNo": "4455667788990",
      "bankName": "MCB Bank Limited",
      "iban": "PK82MUCB004455667788990"
    }
  ],
  "guardians": [
    {
      "guardianId": "GRD-001",
      "name": "Muhammad Tariq",
      "cnic": "3740511111111",
      "contactNo": "+92 333 1111111",
      "occupation": "Shopkeeper"
    },
    {
      "guardianId": "GRD-002",
      "name": "Sher Wali",
      "cnic": "3740522222222",
      "contactNo": "+92 333 2222222",
      "occupation": "Farmer"
    },
    {
      "guardianId": "GRD-003",
      "name": "Zafar Iqbal",
      "cnic": "3740533333333",
      "contactNo": "+92 333 3333333",
      "occupation": "Driver"
    },
    {
      "guardianId": "GRD-004",
      "name": "Bashir Ahmed",
      "cnic": "3740544444444",
      "contactNo": "+92 333 4444444",
      "occupation": "Laborer"
    },
    {
      "guardianId": "GRD-005",
      "name": "Ghulam Nabi",
      "cnic": "3740555555555",
      "contactNo": "+92 333 5555555",
      "occupation": "Government Servant"
    },
    {
      "guardianId": "GRD-006",
      "name": "Irshad Ali",
      "cnic": "3740566666666",
      "contactNo": "+92 333 6666666",
      "occupation": "Electrician"
    },
    {
      "guardianId": "GRD-007",
      "name": "Sikandar Hayat",
      "cnic": "3740577777777",
      "contactNo": "+92 333 7777777",
      "occupation": "Private Job"
    },
    {
      "guardianId": "GRD-008",
      "name": "Niaz Mohammad",
      "cnic": "3740588888888",
      "contactNo": "+92 333 8888888",
      "occupation": "Merchant"
    },
    {
      "guardianId": "GRD-009",
      "name": "Raja Pervez",
      "cnic": "3740599999999",
      "contactNo": "+92 333 9999999",
      "occupation": "Ex-Serviceman"
    },
    {
      "guardianId": "GRD-010",
      "name": "Shakir Khan",
      "cnic": "3740500000000",
      "contactNo": "+92 333 0000000",
      "occupation": "Tailor"
    },
    {
      "guardianId": "GRD-011",
      "name": "Mushtaq Ahmed",
      "cnic": "3740512121212",
      "contactNo": "+92 344 1122334",
      "occupation": "Carpenter"
    },
    {
      "guardianId": "GRD-012",
      "name": "Sultan Khan",
      "cnic": "3740523232323",
      "contactNo": "+92 344 2233445",
      "occupation": "Tourist Guide"
    },
    {
      "guardianId": "GRD-013",
      "name": "Qasim Jan",
      "cnic": "3740534343434",
      "contactNo": "+92 344 3344556",
      "occupation": "Pesh Imam"
    },
    {
      "guardianId": "GRD-014",
      "name": "Farooq Shah",
      "cnic": "3740545454545",
      "contactNo": "+92 344 4455667",
      "occupation": "Blacksmith"
    },
    {
      "guardianId": "GRD-015",
      "name": "Abdul Hameed",
      "cnic": "3740556565656",
      "contactNo": "+92 344 5566778",
      "occupation": "Teacher"
    },
    {
      "guardianId": "GRD-016",
      "name": "Kareem Dad",
      "cnic": "3740567676767",
      "contactNo": "+92 344 6677889",
      "occupation": "Farmer"
    },
    {
      "guardianId": "GRD-017",
      "name": "Nazir Ahmed",
      "cnic": "3740578787878",
      "contactNo": "+92 344 7788990",
      "occupation": "Mason"
    },
    {
      "guardianId": "GRD-018",
      "name": "Rehmat Ali",
      "cnic": "3740589898989",
      "contactNo": "+92 344 8899001",
      "occupation": "Security Guard"
    },
    {
      "guardianId": "GRD-019",
      "name": "Imran Siddiqui",
      "cnic": "3740590909090",
      "contactNo": "+92 344 9900112",
      "occupation": "Journalist"
    },
    {
      "guardianId": "GRD-020",
      "name": "Aslam Khan",
      "cnic": "3740501010101",
      "contactNo": "+92 344 0011223",
      "occupation": "Contractor"
    }
  ],
  "students": [
    {
      "studentId": "STD-001",
      "name": "Ahmed Tariq",
      "bFormNumber": "3740511111111",
      "dateOfBirth": "2018-05-10",
      "age": 8,
      "teacherId": "TCH-001",
      "schoolName": "NEF Primary School Rawal",
      "class": "Grade 2",
      "dateOfAdmission": "2024-04-10",
      "gender": "Male",
      "orphan": "No",
      "disability": "No",
      "specify": "None",
      "passOutDate": "",
      "result": "Pass",
      "refugee": "No",
      "childInLabor": "None",
      "motherTongue": "Punjabi",
      "canUnderstandUrdu": "Yes",
      "citizenship": "Pakistani",
      "residencyStatus": "Permanent",
      "house": "Owned",
      "guardianId": "GRD-001"
    },
    {
      "studentId": "STD-002",
      "name": "Sana Wali",
      "bFormNumber": "3740522222222",
      "dateOfBirth": "2017-08-15",
      "age": 9,
      "teacherId": "TCH-001",
      "schoolName": "NEF Primary School Rawal",
      "class": "Grade 3",
      "dateOfAdmission": "2023-04-12",
      "gender": "Female",
      "orphan": "No",
      "disability": "No",
      "specify": "None",
      "passOutDate": "",
      "result": "Pass",
      "refugee": "No",
      "childInLabor": "None",
      "motherTongue": "Urdu",
      "canUnderstandUrdu": "Yes",
      "citizenship": "Pakistani",
      "residencyStatus": "Permanent",
      "house": "Owned",
      "guardianId": "GRD-002"
    },
    {
      "studentId": "STD-003",
      "name": "Zain Zafar",
      "bFormNumber": "3740533333333",
      "dateOfBirth": "2019-12-01",
      "age": 6,
      "teacherId": "TCH-006",
      "schoolName": "NEF Primary School Rawal",
      "class": "Grade 1",
      "dateOfAdmission": "2025-04-05",
      "gender": "Male",
      "orphan": "Yes",
      "disability": "No",
      "specify": "None",
      "passOutDate": "",
      "result": "Pass",
      "refugee": "No",
      "childInLabor": "None",
      "motherTongue": "Hindko",
      "canUnderstandUrdu": "Yes",
      "citizenship": "Pakistani",
      "residencyStatus": "Permanent",
      "house": "Rented",
      "guardianId": "GRD-003"
    },
    {
      "studentId": "STD-004",
      "name": "Ayesha Bashir",
      "bFormNumber": "3740544444444",
      "dateOfBirth": "2018-02-18",
      "age": 8,
      "teacherId": "TCH-006",
      "schoolName": "NEF Primary School Rawal",
      "class": "Grade 2",
      "dateOfAdmission": "2024-04-08",
      "gender": "Female",
      "orphan": "No",
      "disability": "Yes",
      "specify": "Physical",
      "passOutDate": "",
      "result": "Pass",
      "refugee": "No",
      "childInLabor": "None",
      "motherTongue": "Punjabi",
      "canUnderstandUrdu": "Yes",
      "citizenship": "Pakistani",
      "residencyStatus": "Permanent",
      "house": "Owned",
      "guardianId": "GRD-004"
    },
    {
      "studentId": "STD-005",
      "name": "Bilal Nabi",
      "bFormNumber": "3740555555555",
      "dateOfBirth": "2019-01-20",
      "age": 7,
      "teacherId": "TCH-001",
      "schoolName": "NEF Primary School Rawal",
      "class": "Grade 1",
      "dateOfAdmission": "2025-04-02",
      "gender": "Male",
      "orphan": "No",
      "disability": "No",
      "specify": "None",
      "passOutDate": "",
      "result": "Pass",
      "refugee": "Yes",
      "childInLabor": "None",
      "motherTongue": "Pashto",
      "canUnderstandUrdu": "Yes",
      "citizenship": "Refugee",
      "residencyStatus": "Temporary",
      "house": "Rented",
      "guardianId": "GRD-005"
    },
    {
      "studentId": "STD-006",
      "name": "Zoya Karim",
      "bFormNumber": "3740566666666",
      "dateOfBirth": "2013-05-14",
      "age": 13,
      "teacherId": "TCH-002",
      "schoolName": "GB Model Middle School Hunza",
      "class": "Grade 7",
      "dateOfAdmission": "2022-04-10",
      "gender": "Female",
      "orphan": "No",
      "disability": "No",
      "specify": "None",
      "passOutDate": "",
      "result": "Pass",
      "refugee": "No",
      "childInLabor": "None",
      "motherTongue": "Shina",
      "canUnderstandUrdu": "Yes",
      "citizenship": "Pakistani",
      "residencyStatus": "Permanent",
      "house": "Owned",
      "guardianId": "GRD-006"
    },
    {
      "studentId": "STD-007",
      "name": "Ali Sher",
      "bFormNumber": "3740577777777",
      "dateOfBirth": "2012-10-09",
      "age": 13,
      "teacherId": "TCH-002",
      "schoolName": "GB Model Middle School Hunza",
      "class": "Grade 8",
      "dateOfAdmission": "2021-04-15",
      "gender": "Male",
      "orphan": "Yes",
      "disability": "No",
      "specify": "None",
      "passOutDate": "",
      "result": "Pass",
      "refugee": "No",
      "childInLabor": "None",
      "motherTongue": "Shina",
      "canUnderstandUrdu": "Yes",
      "citizenship": "Pakistani",
      "residencyStatus": "Permanent",
      "house": "Owned",
      "guardianId": "GRD-007"
    },
    {
      "studentId": "STD-008",
      "name": "Yasmin Niaz",
      "bFormNumber": "3740588888888",
      "dateOfBirth": "2014-03-25",
      "age": 12,
      "teacherId": "TCH-007",
      "schoolName": "GB Model Middle School Hunza",
      "class": "Grade 6",
      "dateOfAdmission": "2023-04-20",
      "gender": "Female",
      "orphan": "No",
      "disability": "No",
      "specify": "None",
      "passOutDate": "",
      "result": "Pass",
      "refugee": "No",
      "childInLabor": "None",
      "motherTongue": "Other",
      "canUnderstandUrdu": "Yes",
      "citizenship": "Pakistani",
      "residencyStatus": "Permanent",
      "house": "Owned",
      "guardianId": "GRD-008"
    },
    {
      "studentId": "STD-009",
      "name": "Kamran Raja",
      "bFormNumber": "3740599999999",
      "dateOfBirth": "2013-09-02",
      "age": 12,
      "teacherId": "TCH-007",
      "schoolName": "GB Model Middle School Hunza",
      "class": "Grade 7",
      "dateOfAdmission": "2022-04-12",
      "gender": "Male",
      "orphan": "No",
      "disability": "No",
      "specify": "None",
      "passOutDate": "",
      "result": "Pass",
      "refugee": "No",
      "childInLabor": "None",
      "motherTongue": "Urdu",
      "canUnderstandUrdu": "Yes",
      "citizenship": "Pakistani",
      "residencyStatus": "Permanent",
      "house": "Owned",
      "guardianId": "GRD-009"
    },
    {
      "studentId": "STD-010",
      "name": "Farhan Shakir",
      "bFormNumber": "3740500000000",
      "dateOfBirth": "2010-06-11",
      "age": 16,
      "teacherId": "TCH-003",
      "schoolName": "AJK Girls Secondary School Bagh",
      "class": "Grade 9",
      "dateOfAdmission": "2022-04-05",
      "gender": "Female",
      "orphan": "No",
      "disability": "No",
      "specify": "None",
      "passOutDate": "",
      "result": "Pass",
      "refugee": "No",
      "childInLabor": "None",
      "motherTongue": "Kashmiri",
      "canUnderstandUrdu": "Yes",
      "citizenship": "Pakistani",
      "residencyStatus": "Permanent",
      "house": "Owned",
      "guardianId": "GRD-010"
    },
    {
      "studentId": "STD-011",
      "name": "Saba Mushtaq",
      "bFormNumber": "3740512121212",
      "dateOfBirth": "2009-12-30",
      "age": 16,
      "teacherId": "TCH-003",
      "schoolName": "AJK Girls Secondary School Bagh",
      "class": "Grade 10",
      "dateOfAdmission": "2021-04-10",
      "gender": "Female",
      "orphan": "No",
      "disability": "Yes",
      "specify": "Hearing",
      "passOutDate": "",
      "result": "Pass",
      "refugee": "No",
      "childInLabor": "None",
      "motherTongue": "Kashmiri",
      "canUnderstandUrdu": "Yes",
      "citizenship": "Pakistani",
      "residencyStatus": "Permanent",
      "house": "Owned",
      "guardianId": "GRD-011"
    },
    {
      "studentId": "STD-012",
      "name": "Nida Sultan",
      "bFormNumber": "3740523232323",
      "dateOfBirth": "2010-03-24",
      "age": 16,
      "teacherId": "TCH-008",
      "schoolName": "AJK Girls Secondary School Bagh",
      "class": "Grade 9",
      "dateOfAdmission": "2022-04-15",
      "gender": "Female",
      "orphan": "No",
      "disability": "No",
      "specify": "None",
      "passOutDate": "",
      "result": "Pass",
      "refugee": "No",
      "childInLabor": "None",
      "motherTongue": "Kashmiri",
      "canUnderstandUrdu": "Yes",
      "citizenship": "Pakistani",
      "residencyStatus": "Permanent",
      "house": "Owned",
      "guardianId": "GRD-012"
    },
    {
      "studentId": "STD-013",
      "name": "Mariam Qasim",
      "bFormNumber": "3740534343434",
      "dateOfBirth": "2009-08-05",
      "age": 16,
      "teacherId": "TCH-008",
      "schoolName": "AJK Girls Secondary School Bagh",
      "class": "Grade 10",
      "dateOfAdmission": "2021-04-12",
      "gender": "Female",
      "orphan": "No",
      "disability": "No",
      "specify": "None",
      "passOutDate": "2025-06-30",
      "result": "Pass",
      "refugee": "No",
      "childInLabor": "None",
      "motherTongue": "Urdu",
      "canUnderstandUrdu": "Yes",
      "citizenship": "Pakistani",
      "residencyStatus": "Permanent",
      "house": "Owned",
      "guardianId": "GRD-013"
    },
    {
      "studentId": "STD-014",
      "name": "Danish Farooq",
      "bFormNumber": "3740545454545",
      "dateOfBirth": "2015-05-22",
      "age": 11,
      "teacherId": "TCH-004",
      "schoolName": "NEF Adult Literacy Center Gilgit",
      "class": "ALC Level 1",
      "dateOfAdmission": "2024-05-15",
      "gender": "Male",
      "orphan": "Yes",
      "disability": "No",
      "specify": "None",
      "passOutDate": "",
      "result": "Fail",
      "refugee": "No",
      "childInLabor": "Automobile workshop helper",
      "motherTongue": "Shina",
      "canUnderstandUrdu": "Yes",
      "citizenship": "Pakistani",
      "residencyStatus": "Temporary",
      "house": "Rented",
      "guardianId": "GRD-014"
    },
    {
      "studentId": "STD-015",
      "name": "Hamza Hameed",
      "bFormNumber": "3740556565656",
      "dateOfBirth": "2014-09-12",
      "age": 11,
      "teacherId": "TCH-004",
      "schoolName": "NEF Adult Literacy Center Gilgit",
      "class": "ALC Level 1",
      "dateOfAdmission": "2024-05-15",
      "gender": "Male",
      "orphan": "No",
      "disability": "No",
      "specify": "None",
      "passOutDate": "",
      "result": "Pass",
      "refugee": "Yes",
      "childInLabor": "None",
      "motherTongue": "Pashto",
      "canUnderstandUrdu": "No",
      "citizenship": "Refugee",
      "residencyStatus": "Temporary",
      "house": "Rented",
      "guardianId": "GRD-015"
    },
    {
      "studentId": "STD-016",
      "name": "Kashif Dad",
      "bFormNumber": "3740567676767",
      "dateOfBirth": "2013-11-01",
      "age": 12,
      "teacherId": "TCH-004",
      "schoolName": "NEF Adult Literacy Center Gilgit",
      "class": "ALC Level 2",
      "dateOfAdmission": "2023-05-10",
      "gender": "Male",
      "orphan": "No",
      "disability": "Yes",
      "specify": "Visual",
      "passOutDate": "",
      "result": "Dropout",
      "refugee": "No",
      "childInLabor": "Carpet weaving helper",
      "motherTongue": "Shina",
      "canUnderstandUrdu": "Yes",
      "citizenship": "Pakistani",
      "residencyStatus": "Permanent",
      "house": "Rented",
      "guardianId": "GRD-016"
    },
    {
      "studentId": "STD-017",
      "name": "Naveed Nazir",
      "bFormNumber": "3740578787878",
      "dateOfBirth": "2015-01-15",
      "age": 11,
      "teacherId": "TCH-004",
      "schoolName": "NEF Adult Literacy Center Gilgit",
      "class": "ALC Level 1",
      "dateOfAdmission": "2024-05-20",
      "gender": "Male",
      "orphan": "No",
      "disability": "No",
      "specify": "None",
      "passOutDate": "",
      "result": "Pass",
      "refugee": "No",
      "childInLabor": "None",
      "motherTongue": "Shina",
      "canUnderstandUrdu": "Yes",
      "citizenship": "Pakistani",
      "residencyStatus": "Permanent",
      "house": "Owned",
      "guardianId": "GRD-017"
    },
    {
      "studentId": "STD-018",
      "name": "Sajida Rehmat",
      "bFormNumber": "3740589898989",
      "dateOfBirth": "2018-04-20",
      "age": 8,
      "teacherId": "TCH-005",
      "schoolName": "Kashmir Community School Muzaffarabad",
      "class": "Grade 1",
      "dateOfAdmission": "2024-04-10",
      "gender": "Female",
      "orphan": "No",
      "disability": "No",
      "specify": "None",
      "passOutDate": "",
      "result": "Pass",
      "refugee": "No",
      "childInLabor": "None",
      "motherTongue": "Kashmiri",
      "canUnderstandUrdu": "Yes",
      "citizenship": "Pakistani",
      "residencyStatus": "Permanent",
      "house": "Owned",
      "guardianId": "GRD-018"
    },
    {
      "studentId": "STD-019",
      "name": "Fawad Siddiqui",
      "bFormNumber": "3740590909090",
      "dateOfBirth": "2019-03-05",
      "age": 7,
      "teacherId": "TCH-005",
      "schoolName": "Kashmir Community School Muzaffarabad",
      "class": "Grade 1",
      "dateOfAdmission": "2025-04-10",
      "gender": "Male",
      "orphan": "No",
      "disability": "No",
      "specify": "None",
      "passOutDate": "",
      "result": "Pass",
      "refugee": "No",
      "childInLabor": "None",
      "motherTongue": "Urdu",
      "canUnderstandUrdu": "Yes",
      "citizenship": "Pakistani",
      "residencyStatus": "Permanent",
      "house": "Owned",
      "guardianId": "GRD-019"
    },
    {
      "studentId": "STD-020",
      "name": "Junaid Aslam",
      "bFormNumber": "3740501010101",
      "dateOfBirth": "2018-08-30",
      "age": 7,
      "teacherId": "TCH-005",
      "schoolName": "Kashmir Community School Muzaffarabad",
      "class": "Grade 1",
      "dateOfAdmission": "2024-04-12",
      "gender": "Male",
      "orphan": "Yes",
      "disability": "No",
      "specify": "None",
      "passOutDate": "",
      "result": "Fail",
      "refugee": "No",
      "childInLabor": "None",
      "motherTongue": "Kashmiri",
      "canUnderstandUrdu": "Yes",
      "citizenship": "Pakistani",
      "residencyStatus": "Permanent",
      "house": "Owned",
      "guardianId": "GRD-020"
    }
  ],
  "attendance": [
    {
      "studentId": "STD-001",
      "date": "2026-07-07",
      "status": "Present"
    },
    {
      "studentId": "STD-001",
      "date": "2026-07-08",
      "status": "Present"
    },
    {
      "studentId": "STD-001",
      "date": "2026-07-09",
      "status": "Present"
    },
    {
      "studentId": "STD-001",
      "date": "2026-07-10",
      "status": "Present"
    },
    {
      "studentId": "STD-001",
      "date": "2026-07-11",
      "status": "Present"
    },
    {
      "studentId": "STD-002",
      "date": "2026-07-07",
      "status": "Present"
    },
    {
      "studentId": "STD-002",
      "date": "2026-07-08",
      "status": "Absent"
    },
    {
      "studentId": "STD-002",
      "date": "2026-07-09",
      "status": "Present"
    },
    {
      "studentId": "STD-002",
      "date": "2026-07-10",
      "status": "Present"
    },
    {
      "studentId": "STD-002",
      "date": "2026-07-11",
      "status": "Present"
    },
    {
      "studentId": "STD-005",
      "date": "2026-07-07",
      "status": "Absent"
    },
    {
      "studentId": "STD-005",
      "date": "2026-07-08",
      "status": "Absent"
    },
    {
      "studentId": "STD-005",
      "date": "2026-07-09",
      "status": "Present"
    },
    {
      "studentId": "STD-005",
      "date": "2026-07-10",
      "status": "Absent"
    },
    {
      "studentId": "STD-005",
      "date": "2026-07-11",
      "status": "Present"
    }
  ],
  "teacherAccounts": [
    {
      "name": "Amara Khan",
      "email": "amara@nef.gov.pk",
      "teacherId": "TCH-001"
    },
    {
      "name": "Zahida Parveen",
      "email": "zahida@nef.gov.pk",
      "teacherId": "TCH-002"
    }
  ]
};

const nul = (v) => (v === "" || v === undefined ? null : v);

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.SEED_FORCE !== "true") {
    throw new Error("NODE_ENV is production. Demo data is for testing only (set SEED_FORCE=true to override).");
  }
  const teacherPassword = process.env.DEMO_TEACHER_PASSWORD || "Teacher123";
  const { waitForConnections, connectionLimit, ...opts } = connectionOptions();
  const conn = await mysql.createConnection(opts);
  const count = {};
  const add = (table, res) => { count[table] = (count[table] || 0) + (res[0].affectedRows || 0); };

  try {
    // Older databases: child_in_labor was VARCHAR(10), too short for the form's free text.
    await conn.query("ALTER TABLE students MODIFY child_in_labor VARCHAR(150)");

    await conn.beginTransaction();

    for (const s of DATA.schools) {
      add("schools", await conn.query(
        `INSERT IGNORE INTO schools (school_code, name, region, district, tehsil, uc, complete_address,
          total_students, total_teachers, contact_no, head_teacher_name, head_teacher_contact_no,
          lat, lng, building_id, school_level, school_type, school_gender, school_status,
          school_sign_board, date_of_establishment)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [s.schoolCode, s.name, nul(s.region), nul(s.district), nul(s.tehsil), nul(s.uc), nul(s.completeAddress),
         s.totalStudents || 0, s.totalTeachers || 0, nul(s.contactNo), nul(s.headTeacherName), nul(s.headTeacherContactNo),
         s.coordinates ? s.coordinates.lat : null, s.coordinates ? s.coordinates.long : null,
         nul(s.buildingId), nul(s.schoolLevel), nul(s.schoolType), nul(s.schoolGender), nul(s.schoolStatus),
         nul(s.schoolSignBoard), nul(s.dateOfEstablishment)]
      ));
    }

    for (const b of DATA.buildings) {
      add("buildings", await conn.query(
        `INSERT IGNORE INTO buildings (building_id, type, no_of_rooms, no_of_washrooms, drinking_water,
          electricity, condition_status, specify, school_id) VALUES (?,?,?,?,?,?,?,?,?)`,
        [b.buildingId, nul(b.type), b.noOfRooms ?? null, b.noOfWashrooms ?? null, nul(b.drinkingWater),
         nul(b.electricity), nul(b.condition), nul(b.specify), nul(b.schoolId)]
      ));
    }

    for (const c of DATA.classes) {
      const [exists] = await conn.query("SELECT id FROM classes WHERE school_id = ? LIMIT 1", [c.schoolId]);
      if (exists.length) continue;
      add("classes", await conn.query(
        `INSERT INTO classes (school_id, no_of_classes, class_type, male_students, female_students) VALUES (?,?,?,?,?)`,
        [c.schoolId, c.noOfClasses || 0, nul(c.classType), c.maleStudents || 0, c.femaleStudents || 0]
      ));
    }

    for (const t of DATA.teachers) {
      add("teachers", await conn.query(
        `INSERT IGNORE INTO teachers (teacher_id, name, cnic, contact_no, school_id, qualification,
          professional_qualification, date_of_joining, last_training_taken, no_of_trainings_attended,
          employment_status, android_phone, internet_access, bank_account_no, bank_name, iban)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [t.teacherId, t.name, nul(t.cnic), nul(t.contactNo), nul(t.schoolId), nul(t.qualification),
         nul(t.professionalQualification), nul(t.dateOfJoining), nul(t.lastTrainingTaken), t.noOfTrainingsAttended || 0,
         nul(t.employmentStatus), nul(t.androidPhone), nul(t.internetAccess), nul(t.bankAccountNo), nul(t.bankName), nul(t.iban)]
      ));
    }

    for (const g of DATA.guardians) {
      add("guardians", await conn.query(
        `INSERT IGNORE INTO guardians (guardian_id, name, cnic, contact_no, occupation) VALUES (?,?,?,?,?)`,
        [g.guardianId, g.name, nul(g.cnic), nul(g.contactNo), nul(g.occupation)]
      ));
    }

    for (const s of DATA.students) {
      add("students", await conn.query(
        `INSERT IGNORE INTO students (student_id, name, b_form_number, date_of_birth, age, teacher_id, school_name,
          class, date_of_admission, gender, orphan, disability, specify, pass_out_date, result, refugee,
          child_in_labor, mother_tongue, can_understand_urdu, citizenship, residency_status, house, guardian_id)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [s.studentId, s.name, nul(s.bFormNumber), nul(s.dateOfBirth), s.age ?? null, nul(s.teacherId), nul(s.schoolName),
         s.class, nul(s.dateOfAdmission), nul(s.gender), nul(s.orphan), nul(s.disability), nul(s.specify),
         nul(s.passOutDate), nul(s.result), nul(s.refugee), nul(s.childInLabor), nul(s.motherTongue),
         nul(s.canUnderstandUrdu), nul(s.citizenship), nul(s.residencyStatus), nul(s.house), nul(s.guardianId)]
      ));
    }

    for (const a of DATA.attendance) {
      add("attendance", await conn.query(
        `INSERT IGNORE INTO attendance (student_id, date, status) VALUES (?,?,?)`,
        [a.studentId, a.date, a.status]
      ));
    }

    const hash = await hashPassword(teacherPassword);
    for (const u of DATA.teacherAccounts) {
      const [exists] = await conn.query("SELECT id FROM users WHERE email = ?", [u.email]);
      if (exists.length) continue;
      add("teacher logins", await conn.query(
        `INSERT INTO users (name, email, password_hash, role, teacher_id) VALUES (?, ?, ?, 'Teacher', ?)`,
        [u.name, u.email, hash, u.teacherId]
      ));
    }

    await conn.commit();
  } catch (err) {
    try { await conn.rollback(); } catch (e) { /* nothing started */ }
    throw err;
  } finally {
    await conn.end();
  }

  console.log("Demo data loaded (rows added; existing rows were skipped):");
  for (const [table, n] of Object.entries(count)) console.log(`  ${table.padEnd(15)} ${n}`);
  console.log("\nTeacher logins for testing:");
  for (const u of DATA.teacherAccounts) console.log(`  ${u.email}  /  ${teacherPassword}   (${u.teacherId})`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seeding failed:", err.message);
    process.exit(1);
  });

