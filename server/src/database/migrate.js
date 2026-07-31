/**
 * Database Migration Script
 * 
 * Creates all tables for the HealthDesk application.
 * Tables are created in dependency order with proper
 * foreign keys, indexes, and constraints.
 * 
 * Usage: node src/database/migrate.js
 */

const dotenv = require('dotenv');
const path = require('path');

// Load env from server root
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const mysql = require('mysql2/promise');

async function migrate() {
  let connection;

  try {
    // Connect without database first to create it if needed
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      multipleStatements: true
    });

    const dbName = process.env.MYSQL_DATABASE || 'healthdesk';

    console.log(`\n🔧 Creating database '${dbName}' if not exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${dbName}\``);

    console.log('📋 Creating tables...\n');

    // ============================================
    // TABLE 1: users
    // ============================================
    console.log('  ✅ Creating table: users');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role ENUM('patient', 'doctor', 'admin') NOT NULL DEFAULT 'patient',
        phone VARCHAR(20) NULL,
        profile_image_url VARCHAR(500) NULL,
        google_id VARCHAR(255) NULL UNIQUE,
        refresh_token TEXT NULL,
        reset_token VARCHAR(255) NULL,
        reset_token_expiry DATETIME NULL,
        is_email_verified TINYINT(1) NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        is_blocked TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_users_email (email),
        INDEX idx_users_role (role),
        INDEX idx_users_google_id (google_id),
        INDEX idx_users_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================
    // TABLE 2: patient_profiles
    // ============================================
    console.log('  ✅ Creating table: patient_profiles');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS patient_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        date_of_birth DATE NULL,
        gender ENUM('male', 'female', 'other') NULL,
        blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NULL,
        address TEXT NULL,
        city VARCHAR(100) NULL,
        state VARCHAR(100) NULL,
        pincode VARCHAR(10) NULL,
        emergency_contact_name VARCHAR(200) NULL,
        emergency_contact_phone VARCHAR(20) NULL,
        allergies TEXT NULL,
        chronic_conditions TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_patient_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================
    // TABLE 3: doctor_profiles
    // ============================================
    console.log('  ✅ Creating table: doctor_profiles');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS doctor_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        specialization VARCHAR(200) NULL,
        qualification VARCHAR(300) NULL,
        experience_years INT NULL DEFAULT 0,
        hospital_name VARCHAR(300) NULL,
        hospital_address TEXT NULL,
        clinic_address TEXT NULL,
        consultation_fee DECIMAL(10,2) NULL DEFAULT 0.00,
        biography TEXT NULL,
        license_number VARCHAR(100) NULL,
        upi_id VARCHAR(100) NULL,
        upi_qr_url VARCHAR(500) NULL,
        is_available TINYINT(1) NOT NULL DEFAULT 1,
        verification_status ENUM('pending', 'approved', 'rejected', 'suspended') NOT NULL DEFAULT 'pending',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_doctor_user (user_id),
        INDEX idx_doctor_specialization (specialization),
        INDEX idx_doctor_verification (verification_status),
        INDEX idx_doctor_available (is_available)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================
    // TABLE 4: doctor_availability
    // ============================================
    console.log('  ✅ Creating table: doctor_availability');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS doctor_availability (
        id INT AUTO_INCREMENT PRIMARY KEY,
        doctor_id INT NOT NULL,
        day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        max_patients INT NOT NULL DEFAULT 10,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        FOREIGN KEY (doctor_id) REFERENCES doctor_profiles(id) ON DELETE CASCADE,
        INDEX idx_avail_doctor (doctor_id),
        INDEX idx_avail_day (day_of_week),
        UNIQUE KEY uk_doctor_day_time (doctor_id, day_of_week, start_time)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================
    // TABLE 5: verification_documents
    // ============================================
    console.log('  ✅ Creating table: verification_documents');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS verification_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        doctor_id INT NOT NULL,
        document_type ENUM('medical_license', 'government_id', 'certificate', 'education', 'other') NOT NULL,
        document_url VARCHAR(500) NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
        admin_notes TEXT NULL,
        verified_by INT NULL,
        verified_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (doctor_id) REFERENCES doctor_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_verdoc_doctor (doctor_id),
        INDEX idx_verdoc_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================
    // TABLE 6: appointments
    // ============================================
    console.log('  ✅ Creating table: appointments');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        doctor_id INT NOT NULL,
        appointment_date DATE NULL,
        appointment_time TIME NULL,
        consultation_type ENUM('online', 'offline') NOT NULL DEFAULT 'offline',
        status ENUM('pending', 'accepted', 'rejected', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
        reason TEXT NULL,
        notes TEXT NULL,
        rejection_reason TEXT NULL,
        consultation_fee DECIMAL(10,2) NULL DEFAULT 0.00,
        is_paid TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_appt_patient (patient_id),
        INDEX idx_appt_doctor (doctor_id),
        INDEX idx_appt_status (status),
        INDEX idx_appt_date (appointment_date),
        INDEX idx_appt_paid (is_paid)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================
    // TABLE 7: prescriptions
    // ============================================
    console.log('  ✅ Creating table: prescriptions');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS prescriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        appointment_id INT NULL,
        doctor_id INT NOT NULL,
        patient_id INT NOT NULL,
        diagnosis TEXT NULL,
        medications TEXT NULL,
        instructions TEXT NULL,
        notes TEXT NULL,
        prescription_file_url VARCHAR(500) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_presc_appointment (appointment_id),
        INDEX idx_presc_doctor (doctor_id),
        INDEX idx_presc_patient (patient_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================
    // TABLE 8: medical_records
    // ============================================
    console.log('  ✅ Creating table: medical_records');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS medical_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        record_type ENUM('report', 'image', 'prescription', 'diagnosis') NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        file_url VARCHAR(500) NULL,
        original_filename VARCHAR(255) NULL,
        file_type VARCHAR(50) NULL,
        file_size INT NULL,
        uploaded_by INT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_medrec_patient (patient_id),
        INDEX idx_medrec_type (record_type),
        INDEX idx_medrec_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================
    // TABLE 9: symptoms
    // ============================================
    console.log('  ✅ Creating table: symptoms');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS symptoms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        description TEXT NOT NULL,
        ai_assessment TEXT NULL,
        severity ENUM('mild', 'moderate', 'severe') NULL DEFAULT 'mild',
        recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_symptoms_patient (patient_id),
        INDEX idx_symptoms_severity (severity),
        INDEX idx_symptoms_recorded (recorded_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================
    // TABLE 10: payments
    // ============================================
    console.log('  ✅ Creating table: payments');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        appointment_id INT NOT NULL,
        patient_id INT NOT NULL,
        doctor_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        razorpay_order_id VARCHAR(255) NULL,
        razorpay_payment_id VARCHAR(255) NULL,
        razorpay_signature VARCHAR(255) NULL,
        status ENUM('created', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'created',
        failure_reason TEXT NULL,
        paid_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
        FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_pay_appointment (appointment_id),
        INDEX idx_pay_patient (patient_id),
        INDEX idx_pay_doctor (doctor_id),
        INDEX idx_pay_status (status),
        INDEX idx_pay_razorpay_order (razorpay_order_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================
    // TABLE 11: notifications
    // ============================================
    console.log('  ✅ Creating table: notifications');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('appointment', 'payment', 'verification', 'system') NOT NULL DEFAULT 'system',
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        reference_id VARCHAR(50) NULL,
        reference_type VARCHAR(50) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_notif_user (user_id),
        INDEX idx_notif_read (is_read),
        INDEX idx_notif_type (type),
        INDEX idx_notif_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============================================
    // TABLE 12: audit_logs
    // ============================================
    console.log('  ✅ Creating table: audit_logs');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INT NULL,
        old_values TEXT NULL,
        new_values TEXT NULL,
        ip_address VARCHAR(45) NULL,
        user_agent VARCHAR(500) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_audit_user (user_id),
        INDEX idx_audit_action (action),
        INDEX idx_audit_entity (entity_type, entity_id),
        INDEX idx_audit_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('\n✅ All 12 tables created successfully!');
    console.log('📊 Database migration complete.\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run migration
migrate();
