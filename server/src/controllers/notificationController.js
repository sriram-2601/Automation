import * as notificationService from '../services/notificationService.js';

export async function listNotifications(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const list = await notificationService.getNotifications(userId);
    return res.status(200).json(list);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function markRead(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const notificationId = req.params.id;
    const updated = await notificationService.markAsRead(userId, notificationId);
    
    if (!updated) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function markAllRead(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    await notificationService.markAllAsRead(userId);
    return res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
