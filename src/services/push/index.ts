import mongoose from 'mongoose';
import webpush from 'web-push';
import { PushSubscriptionModel } from '@/models/pushSubscription.model';

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  data?: Record<string, unknown>;
};

const getPushConfig = () => {
  const publicKey = process.env.VAPID_PUBLIC_KEY ?? '';
  const privateKey = process.env.VAPID_PRIVATE_KEY ?? '';
  const subject = process.env.VAPID_SUBJECT ?? '';

  return {
    configured: Boolean(publicKey && privateKey && subject),
    publicKey,
    privateKey,
    subject,
  };
};

const ensureWebPushConfigured = () => {
  const cfg = getPushConfig();
  if (!cfg.configured) return false;

  webpush.setVapidDetails(cfg.subject, cfg.publicKey, cfg.privateKey);
  return true;
};

export const getVapidPublicKey = (): string | null => {
  const cfg = getPushConfig();
  return cfg.publicKey ? cfg.publicKey : null;
};

export const sendPushToUser = async (userId: string | mongoose.Types.ObjectId, payload: PushPayload): Promise<void> => {
  console.log('[Push] sendPushToUser called — userId:', String(userId), '| title:', payload.title);
  if (!ensureWebPushConfigured()) {
    console.log('[Push] ❌ VAPID NOT configured — check VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT in env');
    return;
  }
  console.log('[Push] ✅ VAPID configured');

  const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

  const subs = await PushSubscriptionModel.find({ user: userObjectId })
    .select('endpoint keys')
    .lean();

  console.log('[Push] Subscriptions found for user:', subs.length);
  if (!subs.length) {
    console.log('[Push] ❌ No subscriptions — user needs to enable push on /notifications page first');
    return;
  }

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url,
    data: payload.data ?? null,
  });

  await Promise.all(
    subs.map(async (s, i) => {
      try {
        console.log(`[Push] Sending to sub #${i + 1}:`, s.endpoint?.slice(0, 80));
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: {
              p256dh: s.keys?.p256dh,
              auth: s.keys?.auth,
            },
          },
          body
        );
        console.log(`[Push] ✅ Sent OK to sub #${i + 1}`);
      } catch (err: any) {
        console.log(`[Push] ❌ Failed sub #${i + 1}:`, err?.statusCode, err?.message);
        const statusCode = err?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await PushSubscriptionModel.deleteOne({ endpoint: s.endpoint });
          console.log(`[Push] Removed stale sub (${statusCode})`);
        }
      }
    })
  );
};
