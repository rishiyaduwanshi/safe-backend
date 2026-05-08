/**
 * Moderator Seed Script
 *
 * Creates a moderator account seeded by the admin.
 * All details are read from environment variables.
 *
 * Required env vars:
 *   MONGO_URI          - MongoDB connection string
 *   ADMIN_EMAIL        - Admin email (used to find the admin's ObjectId as createdBy)
 *   MOD_NAME           - Moderator's full name
 *   MOD_EMAIL          - Moderator's email
 *   MOD_PASSWORD       - Moderator's password (min 8 chars, 1 upper, 1 number, 1 special)
 *   MOD_PERMISSIONS    - Comma-separated permissions  e.g. "report:view,report:approve,violation:view"
 *
 * Run:
 *   bun run --env-file=.env.dev src/seeds/mod.seed.js
 */

import mongoose from 'mongoose';
import UserModel from '../models/user.model.ts';
import ModeratorModel from '../models/moderator.model.ts';
import { Permission } from '../data/permissions.ts';

// ─── Read env vars ────────────────────────────────────────────────────────────

const {
  MONGO_URI,
  ADMIN_EMAIL,
  MOD_NAME,
  MOD_EMAIL,
  MOD_PASSWORD,
  MOD_PERMISSIONS,
} = process.env;

const missing = ['MONGO_URI', 'ADMIN_EMAIL', 'MOD_NAME', 'MOD_EMAIL', 'MOD_PASSWORD', 'MOD_PERMISSIONS']
  .filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`❌ Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

// ─── Parse permissions ────────────────────────────────────────────────────────

const rawPermissions = MOD_PERMISSIONS.split(',').map((p) => p.trim()).filter(Boolean);
const allowedPermissions = new Set(Object.values(Permission));

const invalidPermissions = rawPermissions.filter((p) => !allowedPermissions.has(p));
if (invalidPermissions.length) {
  console.error(`❌ Invalid permissions in MOD_PERMISSIONS: ${invalidPermissions.join(', ')}`);
  console.error(`✅ Allowed permissions are: ${Object.values(Permission).join(', ')}`);
  process.exit(1);
}

const permissions = Array.from(new Set(rawPermissions));

if (!permissions.length) {
  console.error('❌ MOD_PERMISSIONS is empty. Provide at least one permission.');
  process.exit(1);
}

// ─── Run seed ─────────────────────────────────────────────────────────────────

try {
  await mongoose.connect(MONGO_URI);
  console.log('✅ DB connected');

  // Find the admin user to use as createdBy
  const admin = await UserModel.findOne({ email: ADMIN_EMAIL });
  if (!admin) {
    console.error(`❌ Admin not found for email: ${ADMIN_EMAIL}`);
    console.error('   Run the server once so the admin seed runs first.');
    process.exit(1);
  }

  // Check if moderator already exists
  const existing = await ModeratorModel.findOne({ email: MOD_EMAIL });
  if (existing) {
    console.log(`⚠️  Moderator already exists: ${MOD_EMAIL} — skipping.`);
    process.exit(0);
  }

  // Create the moderator (pre-save hook hashes the password)
  const moderator = await ModeratorModel.create({
    name: MOD_NAME,
    email: MOD_EMAIL,
    password: MOD_PASSWORD,
    permissions,
    createdBy: admin._id,
  });

  console.log('✅ Moderator seeded successfully');
  console.log(`   Name        : ${moderator.name}`);
  console.log(`   Email       : ${moderator.email}`);
  console.log(`   Permissions : ${moderator.permissions.join(', ')}`);
  console.log(`   Created by  : ${admin.email} (${admin._id})`);
} catch (err) {
  console.error('❌ Seed failed:', err);
  process.exit(1);
} finally {
  await mongoose.disconnect();
  console.log('🔌 DB disconnected');
}
