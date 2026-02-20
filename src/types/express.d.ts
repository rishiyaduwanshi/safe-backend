/**
 * Express type extensions
 */

import { AuthenticatedUser, AuthenticatedModerator } from './common.types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      moderator?: AuthenticatedModerator;
    }
  }
}

export { };
