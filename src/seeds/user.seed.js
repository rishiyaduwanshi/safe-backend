/**
 * User + Profile + Reports + CSS History Seed Script
 *
 * Creates citizen users for testing with fully linked data:
 * - Users (password: Firstname@1234)
 * - Profiles (linked to user.profileId)
 * - Reports (mixed statuses)
 * - Comments (system/moderator style)
 * - CSS history events (approved/rejected reports only)
 *
 * Required env vars:
 *   MONGO_URI
 *
 * Optional env vars:
 *   SEED_RESET=true   -> clears seeded collections first
 *   SEED_USERS=6      -> number of users to create
 *   SEED_REPORTS_PER_USER=8 -> number of reports per user
 *   SEED_FAKER_SEED=420     -> deterministic faker seed
 *
 * Run:
 *   bun run --env-file=.env.dev src/seeds/user.seed.js
 */

import mongoose from 'mongoose';
import { Faker, en, en_IN } from '@faker-js/faker';
import UserModel from '../models/user.model.ts';
import Profile from '../models/profile.model.ts';
import { ReportModel } from '../models/report.model.ts';
import { CommentModel } from '../models/comment.model.ts';
import { CssEventModel } from '../models/cssEvent.model.ts';
import { flatCategory } from '../data/category.ts';
import { CSS_BASELINE, CSS_LIMITS, getCssDeltaForDecision } from '../services/css/index.ts';

const faker = new Faker({ locale: [en_IN, en] });

const {
  MONGO_URI,
  SEED_RESET,
  SEED_USERS,
  SEED_REPORTS_PER_USER,
  SEED_FAKER_SEED,
} = process.env;

if (!MONGO_URI) {
  console.error('❌ Missing required env var: MONGO_URI');
  process.exit(1);
}

// Fixed, predictable citizen accounts for easy login/testing
// Email pattern remains: firstname@mail.com (or firstname<number>@mail.com if needed)
const FIXED_USER_FULL_NAMES = [
  'Naitik Kumar',
  'Atulya Saurabh',
  'Saksham Agarwal',
  'Shanaya Chaudhary',
  'Rishi Ranjan',
  'Rishav Kumar',
  'Muskan Kumai',
  'Utkarshi Singh',
];

const CATEGORY_KEYS = [
  'pothole',
  'road_crack',
  'water_logging',
  'streetlight_not_working',
  'no_helmet',
  'overspeeding',
  'illegal_parking',
];

const pickCategory = (key) => flatCategory.find((c) => c.key === key) ?? null;

const clampCss = (value) => Math.min(CSS_LIMITS.MAX, Math.max(CSS_LIMITS.MIN, value));

const normalizeFirstNameForEmail = (value) =>
  String(value || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim() || 'user';

const capitalizeFirst = (value) => {
  const v = String(value || '');
  if (!v) return v;
  return v.charAt(0).toUpperCase() + v.slice(1);
};

const buildSeedPassword = (firstName) => `${capitalizeFirst(normalizeFirstNameForEmail(firstName))}@1234`;

const ensureUniqueEmail = async (firstName) => {
  const base = normalizeFirstNameForEmail(firstName);

  // requirement: firstname@mail.com
  const plain = `${base}@mail.com`;
  const existingPlain = await UserModel.findOne({ email: plain }).select('_id').lean();
  if (!existingPlain) return plain;

  // fallback uniqueness (still matches pattern: firstname<number>@mail.com)
  for (let suffix = 2; suffix < 9999; suffix++) {
    const candidate = `${base}${suffix}@mail.com`;
    const exists = await UserModel.findOne({ email: candidate }).select('_id').lean();
    if (!exists) return candidate;
  }

  throw new Error(`Failed to generate unique email for firstName=${base}`);
};

const formatISODate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 10);
};

const makeProfilePayload = ({ userId, fullName, email, index }) => {
  const dl = `DL${faker.string.numeric({ length: 10, allowLeadingZeros: false })}${String(index).padStart(2, '0')}`
    .slice(0, 12)
    .toUpperCase();
  const driverId = `DRV${faker.string.alphanumeric({ length: 10, casing: 'upper' })}`;

  const issueDate = faker.date.past({ years: 3 });
  const expiryDate = faker.date.future({ years: 8 });

  const statusRoll = index % 10;
  const status = statusRoll === 0 ? 'Expired' : statusRoll === 1 ? 'Suspended' : 'Valid';

  const vehicleType = faker.helpers.arrayElement([
    'Two Wheeler',
    'Four Wheeler',
    'Commercial',
  ]);

  const state = faker.helpers.arrayElement(['Punjab', 'Haryana', 'Delhi']);
  const city = state === 'Punjab'
    ? faker.helpers.arrayElement(['Jalandhar', 'Ludhiana', 'Amritsar'])
    : state === 'Haryana'
      ? faker.helpers.arrayElement(['Gurugram', 'Faridabad'])
      : faker.helpers.arrayElement(['New Delhi', 'Dwarka']);

  return {
    userId,
    name: String(fullName).toUpperCase(),
    licenseNumber: dl,
    driverId,
    phone: faker.phone.number('9#########'),
    email,
    address: faker.location.streetAddress({ useFullAddress: true }),
    vehicleType,
    emergencyContact: {
      name: faker.person.fullName().toUpperCase(),
      phone: faker.phone.number('8#########'),
    },
    issueDate: formatISODate(issueDate),
    expiryDate: formatISODate(expiryDate),
    status,
    state,
    city,
    pincode: faker.location.zipCode('######'),
  };
};

const makeReportPayload = ({ userId, categoryKey, status, index }) => {
  const category = pickCategory(categoryKey);
  if (!category) {
    throw new Error(`Unknown category key: ${categoryKey}`);
  }

  const confidenceByStatus = {
    approved: 0.92,
    rejected: 0.85,
    pending: 0.75,
    review: 0.55,
  };

  const severity = category.severity;

  return {
    submittedBy: userId,
    reportText: `${faker.lorem.sentences({ min: 2, max: 3 })} (category: ${category.key}, seed #${index})`,
    category: {
      id: category.id,
      key: category.key,
      type: category.type,
    },
    severity,
    confidence: confidenceByStatus[status] ?? faker.number.float({ min: 0.6, max: 0.95, fractionDigits: 2 }),
    needsReview: status === 'review',
    location: {
      lat: faker.number.float({ min: 28.55, max: 31.6, fractionDigits: 6 }),
      lng: faker.number.float({ min: 74.8, max: 77.3, fractionDigits: 6 }),
      address: faker.location.streetAddress({ useFullAddress: true }),
    },
    status,
    rejectionReason: status === 'rejected' ? 'Rejected (seed): insufficient evidence / false report' : undefined,
  };
};

const maybeReset = async () => {
  if (String(SEED_RESET).toLowerCase() !== 'true') return;

  console.log('⚠️  SEED_RESET=true — clearing collections (users, profiles, reports, comments, css events)');
  await Promise.all([
    CssEventModel.deleteMany({}),
    CommentModel.deleteMany({}),
    ReportModel.deleteMany({}),
    Profile.deleteMany({}),
    // Keep admin/moderator accounts if present. Only remove citizen users.
    UserModel.deleteMany({ role: 'user' }),
  ]);
};

try {
  await mongoose.connect(MONGO_URI);
  console.log('✅ DB connected');

  await maybeReset();

  const fakerSeed = parseInt(SEED_FAKER_SEED || '420', 10);
  faker.seed(Number.isFinite(fakerSeed) ? fakerSeed : 420);

  const totalUsers = Math.max(1, Math.min(30, parseInt(SEED_USERS || '6', 10) || 6));
  const reportsPerUser = Math.max(3, Math.min(20, parseInt(SEED_REPORTS_PER_USER || '8', 10) || 8));

  const createdUsers = [];

  for (let i = 0; i < totalUsers; i++) {
    const fixedFullName = FIXED_USER_FULL_NAMES[i] ?? null;
    const fullName = fixedFullName ?? faker.person.fullName();

    const firstName = String(fullName).trim().split(/\s+/)[0] || faker.person.firstName();
    const lastName = String(fullName).trim().split(/\s+/).slice(1).join(' ') || faker.person.lastName();

    // Maintain firstname@mail.com pattern (with numeric suffix only if needed)
    const email = await ensureUniqueEmail(firstName);

    const existing = await UserModel.findOne({ email }).select('_id').lean();
    if (existing) {
      console.log(`⚠️  User already exists: ${email} — skipping`);
      createdUsers.push(existing);
      continue;
    }

    const isActive = i % 7 !== 0; // keep some inactive for admin testing

    const password = buildSeedPassword(firstName);

    const user = await UserModel.create({
      name: `${firstName} ${lastName}`.trim(),
      email,
      password,
      isActive,
    });

    createdUsers.push(user);
    console.log(`✅ User seeded: ${email} (${isActive ? 'active' : 'inactive'})`);

    // Create & link profile (leave some users unverified for UI realism)
    const hasProfile = i % 5 !== 0;
    if (hasProfile) {
      const profile = await Profile.create(
        makeProfilePayload({ userId: user._id, fullName: `${firstName} ${lastName}`.trim(), email, index: i + 1 })
      );

      await UserModel.findByIdAndUpdate(user._id, { profileId: profile._id });
    }

    // Create reports
    const statusPool = ['approved', 'approved', 'rejected', 'pending', 'review', 'pending'];

    let currentCss = CSS_BASELINE;
    let cssInitialized = false;

    for (let r = 0; r < reportsPerUser; r++) {
      const status = statusPool[(i + r) % statusPool.length];
      const categoryKey = CATEGORY_KEYS[(i * 3 + r) % CATEGORY_KEYS.length];
      const report = await ReportModel.create(
        makeReportPayload({ userId: user._id, categoryKey, status, index: i * 10 + r + 1 })
      );

      // Add a comment so UI has some timeline
      const commentMessage =
        status === 'approved'
          ? `Approved (seed): ${faker.lorem.sentence()}`
          : status === 'rejected'
            ? `Rejected (seed): ${faker.lorem.sentence()}`
            : status === 'review'
              ? `Under review (seed): ${faker.lorem.sentence()}`
              : `Submitted (seed): ${faker.lorem.sentence()}`;

      await CommentModel.create({
        report: report._id,
        authorRole: status === 'pending' || status === 'review' ? 'system' : 'moderator',
        message: commentMessage,
      });

      // CSS history only for approved/rejected
      if (status === 'approved' || status === 'rejected') {
        const delta = getCssDeltaForDecision(report.category?.id, status);
        const nextCss = clampCss(currentCss + delta);

        await CssEventModel.create({
          user: user._id,
          report: report._id,
          moderator: null,
          decision: status,
          categoryId: report.category?.id ?? null,
          delta,
          previousCss: currentCss,
          nextCss,
          note: commentMessage,
        });

        currentCss = nextCss;
        cssInitialized = true;
      }
    }

    // Store final css on user
    await UserModel.findByIdAndUpdate(user._id, {
      css: cssInitialized ? currentCss : 0,
      cssInitialized,
    });
  }

  console.log(`\n✅ Seed complete: ${createdUsers.length} users processed`);
  console.log('   Password pattern for seeded users: Firstname@1234');
  console.log('   Tip: set SEED_RESET=true to wipe and reseed cleanly');
} catch (err) {
  console.error('❌ Seed failed:', err);
  process.exit(1);
} finally {
  await mongoose.disconnect();
  console.log('🔌 DB disconnected');
}
