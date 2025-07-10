console.log('notification-center.js executing');

// Sample notification data
const sampleNotifications = [
  {
    id: '1',
    type: 'success',
    title: 'User Registration',
    message: 'New user Alice Johnson has successfully registered for the platform.',
    timestamp: '2 minutes ago'
  },
  {
    id: '2',
    type: 'info',
    title: 'System Update',
    message: 'The system will undergo scheduled maintenance tonight from 2:00 AM to 4:00 AM EST.',
    timestamp: '1 hour ago'
  },
  {
    id: '3',
    type: 'warning',
    title: 'Storage Warning',
    message: 'Your storage usage is at 85%. Consider cleaning up old files or upgrading your plan.',
    timestamp: '3 hours ago'
  },
  {
    id: '4',
    type: 'error',
    title: 'Failed Login Attempt',
    message: 'Multiple failed login attempts detected for user@example.com. Account has been temporarily locked.',
    timestamp: '5 hours ago'
  },
  {
    id: '5',
    type: 'success',
    title: 'Backup Completed',
    message: 'Daily backup has been completed successfully. All data is secure.',
    timestamp: '1 day ago'
  },
  {
    id: '6',
    type: 'info',
    title: 'New Feature',
    message: 'Partial templates are now available! Check out the documentation for more details.',
    timestamp: '2 days ago'
  }
];

// Initialize output
output = {
  title: 'Notification Center',
  subtitle: 'Stay updated with the latest system notifications and alerts',
  notifications: sampleNotifications,
  appName: 'MiniLive',
  navItems: [
    { url: '/pages/dashboard', label: 'Dashboard', active: false },
    { url: '/pages/user-list', label: 'Users', active: false },
    { url: '/pages/notification-center', label: 'Notifications', active: true }
  ],
  user: {
    name: 'Admin User'
  }
};

// Handle different events
if (input.event === 'onLoad') {
  console.log('Notification center loaded');
  
} else if (input.event === 'closeNotification') {
  console.log('Close notification:', input.payload.id);
  // Remove the notification from the list
  output.notifications = output.notifications.filter(n => n.id !== input.payload.id);
  
} else if (input.event === 'markAllRead') {
  console.log('Mark all notifications as read');
  // In a real app, you might update the read status
  output.notifications = [];
  
} else if (input.event === 'refresh') {
  console.log('Refresh notifications');
  // In a real app, you might fetch new notifications
  output.notifications = sampleNotifications;
  
} else if (input.event === 'navigate') {
  console.log('Navigate to:', input.payload.url);
  output.commands = [{
    type: 'redirect',
    location: input.payload.url
  }];
  
} else if (input.event === 'logout') {
  console.log('Logout event received');
  output.commands = [{
    type: 'redirect',
    location: '/pages/login'
  }];
}