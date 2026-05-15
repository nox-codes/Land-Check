import { PubSub } from 'graphql-subscriptions';

export const pubsub = new PubSub();

export function publishVerificationUpdate(verification: { id: string; [key: string]: unknown }): Promise<void> {
  return pubsub.publish(`VERIFICATION_UPDATED_${verification.id}`, { verificationUpdated: verification });
}
