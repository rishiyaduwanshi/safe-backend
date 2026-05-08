import UserModel from '@/models/user.model';
import { UserRole } from '@/types/common.types';
import { config } from '@config/index';

/**
 * Ensures the super-admin user exists in the DB.
 * Called once on server startup after DB connects.
 * Credentials are read from ADMIN_EMAIL / ADMIN_PASSWORD env vars.
 *
 * - If admin already exists  → skips silently
 * - If password changed in .env → updates the hash (re-seeds)
 */
export async function seedAdmin(): Promise<void> {
  try {
    const existing = await UserModel.findOne({ email: config.ADMIN_EMAIL }).select('+password');

    if (!existing) {
      await UserModel.create({
        name: 'Admin',
        email: config.ADMIN_EMAIL,
        password: config.ADMIN_PASSWORD, // pre-save hook will hash it
        role: UserRole.ADMIN,
      });

      console.log(`✅ Admin seeded: ${config.ADMIN_EMAIL}`);
      return;
    }

    // Ensure role stays admin (helps if DB was reset/modified manually)
    let didUpdate = false;
    if (existing.role !== UserRole.ADMIN) {
      existing.role = UserRole.ADMIN;
      didUpdate = true;
    }

    // If password changed in env, update stored hash.
    const matches = await existing.comparePassword(config.ADMIN_PASSWORD);
    if (!matches) {
      existing.password = config.ADMIN_PASSWORD;
      didUpdate = true;
    }

    if (didUpdate) {
      await existing.save();
      console.log(`✅ Admin updated: ${config.ADMIN_EMAIL}`);
    }
  } catch (error) {
    console.error('❌ Failed to seed admin:', error);
    throw error;
  }
}
