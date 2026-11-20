-- =====================================================================
-- NEF DATABASE SCHEMA  (MySQL 8.0.16+)
-- =====================================================================
-- Create the tables with:   npm run db:setup
-- (or paste this file into MySQL Workbench / the mysql CLI).
-- Safe to run more than once: every statement is CREATE ... IF NOT EXISTS.
-- An existing database created from an older version of this file needs
-- db/migrations/001_token_version.sql instead.
--
-- Design notes:
--   * IDs like "STD-001", "TCH-001" etc. are treated as natural string
--     primary keys (matches what the frontend already generates/sends).
--   * teacherName and guardianContact, which appear in the students
--     example payload in docs/api-contract.md, are NOT stored as columns
--     - they're derived via JOIN in students.service.js so they can
--     never go stale. If the DB team prefers them denormalized instead,
--     tell the backend team so the JOIN can be replaced with plain columns.
--   * Requires MySQL 8.0.16+ (for CHECK constraint support on the
--     users.role column below).
-- =====================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS schools (
  school_code               VARCHAR(20) PRIMARY KEY,
  name                       TEXT NOT NULL,
  region                     TEXT,
  district                   TEXT,
  tehsil                     TEXT,
  uc                         TEXT,
  complete_address           TEXT,
  total_students             INT DEFAULT 0,
  total_teachers             INT DEFAULT 0,
  contact_no                 VARCHAR(50),
  head_teacher_name          TEXT,
  head_teacher_contact_no    VARCHAR(50),
  lat                        DOUBLE,
  lng                        DOUBLE,
  building_id                VARCHAR(20),
  school_level               VARCHAR(100),
  school_type                VARCHAR(100),
  school_gender              VARCHAR(50),
  school_status              VARCHAR(50),
  school_sign_board          VARCHAR(50),
  date_of_establishment      DATE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS buildings (
  building_id      VARCHAR(20) PRIMARY KEY,
  type             VARCHAR(100),
  no_of_rooms      INT,
  no_of_washrooms  INT,
  drinking_water   VARCHAR(10),
  electricity      VARCHAR(10),
  condition_status VARCHAR(50),
  specify          TEXT,
  school_id        VARCHAR(20),
  FOREIGN KEY (school_id) REFERENCES schools(school_code) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One row per school summarizing its class structure (matches the
-- bulk PUT /classes shape - not a per-class roster table).
CREATE TABLE IF NOT EXISTS classes (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  school_id       VARCHAR(20),
  no_of_classes   INT,
  class_type      VARCHAR(100),
  male_students   INT,
  female_students INT,
  FOREIGN KEY (school_id) REFERENCES schools(school_code) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS teachers (
  teacher_id                  VARCHAR(20) PRIMARY KEY,
  name                        TEXT NOT NULL,
  cnic                        VARCHAR(20),
  contact_no                  VARCHAR(50),
  school_id                   VARCHAR(20),
  qualification                VARCHAR(150),
  professional_qualification  VARCHAR(150),
  date_of_joining              DATE,
  last_training_taken          DATE,
  no_of_trainings_attended     INT DEFAULT 0,
  employment_status            VARCHAR(50),
  android_phone                VARCHAR(10),
  internet_access               VARCHAR(10),
  bank_account_no                VARCHAR(50),
  bank_name                      VARCHAR(150),
  iban                            VARCHAR(50),
  FOREIGN KEY (school_id) REFERENCES schools(school_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS guardians (
  guardian_id  VARCHAR(20) PRIMARY KEY,
  name         TEXT NOT NULL,
  cnic         VARCHAR(20),
  contact_no   VARCHAR(50),
  occupation   VARCHAR(150)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS students (
  student_id            VARCHAR(20) PRIMARY KEY,
  name                  TEXT NOT NULL,
  b_form_number         VARCHAR(20),
  date_of_birth         DATE,
  age                   INT,
  teacher_id            VARCHAR(20),
  school_name           TEXT,
  class                 VARCHAR(50),
  date_of_admission     DATE,
  gender                VARCHAR(10),
  orphan                VARCHAR(10),
  disability            VARCHAR(10),
  specify               TEXT,
  pass_out_date         DATE,
  result                VARCHAR(50),
  refugee               VARCHAR(10),
  child_in_labor        VARCHAR(150),
  mother_tongue         VARCHAR(50),
  can_understand_urdu   VARCHAR(10),
  citizenship           VARCHAR(50),
  residency_status      VARCHAR(50),
  house                 VARCHAR(100),
  guardian_id           VARCHAR(20),
  INDEX idx_students_school_name (school_name(100)),
  FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id),
  FOREIGN KEY (guardian_id) REFERENCES guardians(guardian_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS attendance (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  VARCHAR(20),
  date        DATE NOT NULL,
  status      VARCHAR(20) NOT NULL,
  UNIQUE KEY uniq_student_date (student_id, date),
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  name           TEXT NOT NULL,
  email          VARCHAR(191) UNIQUE NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  role           VARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'Teacher')),
  teacher_id     VARCHAR(20),
  -- Incremented on logout and password change; tokens carrying an older
  -- value are rejected (server-side token revocation).
  token_version  INT NOT NULL DEFAULT 0,
  FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
