/**
 * Database Seed Script
 * 
 * Seeds the database with initial data:
 * - Admin user account
 * - Sample data for development
 * 
 * Usage: node src/database/seed.js
 */

const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seed() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'healthdesk'
    });

    console.log('\n🌱 Seeding database...\n');

    // ============================================
    // SEED 1: Admin User
    // ============================================
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@healthdesk.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    // Check if admin already exists
    const [existingAdmin] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [adminEmail]
    );

    if (existingAdmin.length === 0) {
      await connection.execute(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, is_email_verified, is_active, created_at, updated_at)
         VALUES (?, ?, 'Admin', 'HealthDesk', 'admin', 1, 1, NOW(), NOW())`,
        [adminEmail, passwordHash]
      );
      console.log(`  ✅ Admin user created: ${adminEmail}`);
    } else {
      console.log(`  ℹ️  Admin user already exists: ${adminEmail}`);
    }

    // ============================================
    // SEED 2: Sample Patient User (Development only)
    // ============================================
    if (process.env.NODE_ENV !== 'production') {
      const patientEmail = 'patient@test.com';
      const [existingPatient] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [patientEmail]
      );

      if (existingPatient.length === 0) {
        const patientHash = await bcrypt.hash('Patient@123', 12);
        const [patientResult] = await connection.execute(
          `INSERT INTO users (email, password_hash, first_name, last_name, role, phone, is_email_verified, is_active, created_at, updated_at)
           VALUES (?, ?, 'John', 'Doe', 'patient', '+919876543210', 1, 1, NOW(), NOW())`,
          [patientEmail, patientHash]
        );

        // Create patient profile
        await connection.execute(
          `INSERT INTO patient_profiles (user_id, date_of_birth, gender, blood_group, address, city, state, pincode, emergency_contact_name, emergency_contact_phone, created_at, updated_at)
           VALUES (?, '1990-05-15', 'male', 'O+', '123 Main Street', 'Mumbai', 'Maharashtra', '400001', 'Jane Doe', '+919876543211', NOW(), NOW())`,
          [patientResult.insertId]
        );

        console.log(`  ✅ Sample patient created: ${patientEmail} (password: Patient@123)`);
      } else {
        console.log(`  ℹ️  Sample patient already exists: ${patientEmail}`);
      }

      // ============================================
      // SEED 3: Sample Doctor User (Development only)
      // ============================================
      const doctorEmail = 'doctor@test.com';
      const [existingDoctor] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [doctorEmail]
      );

      if (existingDoctor.length === 0) {
        const doctorHash = await bcrypt.hash('Doctor@123', 12);
        const [doctorResult] = await connection.execute(
          `INSERT INTO users (email, password_hash, first_name, last_name, role, phone, is_email_verified, is_active, created_at, updated_at)
           VALUES (?, ?, 'Sarah', 'Smith', 'doctor', '+919876543212', 1, 1, NOW(), NOW())`,
          [doctorEmail, doctorHash]
        );

        // Create doctor profile (verified)
        const [profileResult] = await connection.execute(
          `INSERT INTO doctor_profiles (user_id, specialization, qualification, experience_years, hospital_name, hospital_address, consultation_fee, biography, license_number, is_available, verification_status, created_at, updated_at)
           VALUES (?, 'Cardiology', 'MBBS, MD (Cardiology)', 10, 'City Hospital', '456 Hospital Road, Mumbai', 500.00, 'Experienced cardiologist with 10+ years of practice.', 'MED-12345', 1, 'approved', NOW(), NOW())`,
          [doctorResult.insertId]
        );

        // Create availability slots
        const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        for (const day of daysOfWeek) {
          await connection.execute(
            `INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, max_patients, is_active)
             VALUES (?, ?, '09:00:00', '17:00:00', 15, 1)`,
            [profileResult.insertId, day]
          );
        }

        console.log(`  ✅ Sample doctor created: ${doctorEmail} (password: Doctor@123, verified)`);
      } else {
        console.log(`  ℹ️  Sample doctor already exists: ${doctorEmail}`);
      }
    }

    console.log('\n✅ Database seeding complete!\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run seeder
seed();
