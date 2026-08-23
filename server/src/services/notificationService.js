import { Notification } from '../models/Notification.js';
import { emitNotificationEvent } from '../config/socket.js';
import { dbStatus } from '../config/db.js';

// Fallback storage in memory when MongoDB is disconnected
const inMemoryNotifications = [];

export async function createNotification({ owner, workflowId, executionId, type = 'info', title, message }) {
  let doc = null;

  if (dbStatus.connected) {
    doc = await Notification.create({
      owner,
      workflowId: workflowId || null,
      executionId: executionId || null,
      type,
      title,
      message,
    });
  } else {
    doc = {
      _id: `mock-notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      owner,
      workflowId: workflowId || null,
      executionId: executionId || null,
      type,
      title,
      message,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    inMemoryNotifications.unshift(doc);
  }

  // Stream via Socket.IO
  emitNotificationEvent(owner.toString(), doc);

  return doc;
}

export async function getNotifications(userId) {
  if (dbStatus.connected) {
    return await Notification.find({ owner: userId }).sort({ createdAt: -1 }).limit(100);
  } else {
    return inMemoryNotifications.filter(n => n.owner.toString() === userId.toString());
  }
}

export async function markAsRead(userId, notificationId) {
  if (dbStatus.connected) {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, owner: userId },
      { isRead: true },
      { new: true }
    );
  } else {
    const notif = inMemoryNotifications.find(n => n._id === notificationId && n.owner.toString() === userId.toString());
    if (notif) {
      notif.isRead = true;
      notif.updatedAt = new Date();
    }
    return notif;
  }
}

export async function markAllAsRead(userId) {
  if (dbStatus.connected) {
    await Notification.updateMany({ owner: userId, isRead: false }, { isRead: true });
    return { success: true };
  } else {
    inMemoryNotifications.forEach(n => {
      if (n.owner.toString() === userId.toString()) {
        n.isRead = true;
        n.updatedAt = new Date();
      }
    });
    return { success: true };
  }
}
