import { Schema, Document } from 'mongoose';
import { AdminNotificationModel } from '../models/AdminNotification';

export const adminAuditPlugin = (schema: Schema) => {
  schema.post('save', async function (doc: any) {
    try {
      const modelName = (doc.constructor as any).modelName;
      const identifier = doc.title || doc.name || doc.email || doc.phone || doc._id?.toString();
      
      let type: 'user_registered' | 'content_created' = 'content_created';
      let title = `New ${modelName} Created`;
      
      if (modelName === 'User' || modelName === 'AdminUser') {
        type = 'user_registered';
        title = `New ${modelName === 'User' ? 'App User' : 'Admin'} Registered`;
      }

      await AdminNotificationModel.create({
        title,
        message: `${modelName} "${identifier}" was created.`,
        type,
        modelName,
        action: 'created',
      });
    } catch (err) {
      console.error('Audit plugin error on save:', err);
    }
  });

  schema.post('findOneAndUpdate', async function (doc: any) {
    if (!doc) return;
    try {
      const modelName = (doc.constructor as any).modelName;
      // We only care about major updates, but since we hook into all findOneAndUpdate, we will log it.
      // E.g., WatchProgress is spammy, so we shouldn't attach this plugin to WatchProgress!
      const identifier = doc.title || doc.name || doc.email || doc.phone || doc._id?.toString();
      
      await AdminNotificationModel.create({
        title: `${modelName} Updated`,
        message: `${modelName} "${identifier}" was updated.`,
        type: 'content_updated',
        modelName,
        action: 'updated',
      });
    } catch (err) {
      console.error('Audit plugin error on findOneAndUpdate:', err);
    }
  });

  schema.post('findOneAndDelete', async function (doc: any) {
    if (!doc) return;
    try {
      const modelName = (doc.constructor as any).modelName;
      const identifier = doc.title || doc.name || doc.email || doc.phone || doc._id?.toString();
      
      await AdminNotificationModel.create({
        title: `${modelName} Deleted`,
        message: `${modelName} "${identifier}" was deleted.`,
        type: 'content_deleted',
        modelName,
        action: 'deleted',
      });
    } catch (err) {
      console.error('Audit plugin error on findOneAndDelete:', err);
    }
  });
};
