-- ═══════════════════════════════════════════════════════
--  Al-Huda Quran Academy — MySQL Schema
--  Run once:  mysql -u root -p < sql/schema.sql
-- ═══════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS alhuda_academy
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE alhuda_academy;

-- ── 1. BOOKINGS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id            INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  student_name  VARCHAR(120)    NOT NULL,
  age           TINYINT UNSIGNED NOT NULL,
  phone         VARCHAR(30)     NOT NULL,
  email         VARCHAR(120)    DEFAULT NULL,
  program       VARCHAR(100)    NOT NULL,
  preferred_dt  DATETIME        NOT NULL,
  message       TEXT            DEFAULT NULL,
  status        ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
  source        ENUM('hero_form','trial_form')          NOT NULL DEFAULT 'trial_form',
  ip_address    VARCHAR(45)     DEFAULT NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status     (status),
  INDEX idx_program    (program),
  INDEX idx_created    (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 2. CONTACT MESSAGES ──────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  email      VARCHAR(120) NOT NULL,
  phone      VARCHAR(30)  DEFAULT NULL,
  subject    VARCHAR(200) DEFAULT NULL,
  message    TEXT         NOT NULL,
  is_read    TINYINT(1)   NOT NULL DEFAULT 0,
  ip_address VARCHAR(45)  DEFAULT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_is_read  (is_read),
  INDEX idx_created  (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 3. EMAIL LOG (audit trail) ────────────────────────
CREATE TABLE IF NOT EXISTS email_logs (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id INT UNSIGNED DEFAULT NULL,
  recipient  VARCHAR(120) NOT NULL,
  subject    VARCHAR(200) NOT NULL,
  type       ENUM('student_confirmation','admin_alert','contact_alert') NOT NULL,
  status     ENUM('sent','failed') NOT NULL,
  error_msg  TEXT         DEFAULT NULL,
  sent_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
  INDEX idx_booking  (booking_id),
  INDEX idx_status   (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Schema created successfully ✅' AS result;
