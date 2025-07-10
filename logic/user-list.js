console.log('user-list.js executing');

// Sample user data
const sampleUsers = [
  {
    id: '1',
    name: 'Alice Johnson',
    title: 'Frontend Developer',
    email: 'alice@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616c51df1a9?w=150&h=150&fit=crop&crop=face',
    isOnline: true
  },
  {
    id: '2',
    name: 'Bob Smith',
    title: 'Backend Developer',
    email: 'bob@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    isOnline: false
  },
  {
    id: '3',
    name: 'Carol Davis',
    title: 'UX Designer',
    email: 'carol@example.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    isOnline: true
  },
  {
    id: '4',
    name: 'David Wilson',
    title: 'DevOps Engineer',
    email: 'david@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    isOnline: true
  },
  {
    id: '5',
    name: 'Emma Brown',
    title: 'Product Manager',
    email: 'emma@example.com',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    isOnline: false
  },
  {
    id: '6',
    name: 'Frank Miller',
    title: 'QA Engineer',
    email: 'frank@example.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    isOnline: true
  }
];

// Initialize output
output = {
  title: 'User Directory',
  subtitle: 'Manage and view all users in your organization',
  users: sampleUsers,
  totalUsers: sampleUsers.length,
  onlineUsers: sampleUsers.filter(u => u.isOnline).length,
  newToday: Math.floor(Math.random() * 5) + 1,
  appName: 'MiniLive',
  navItems: [
    { url: '/pages/dashboard', label: 'Dashboard', active: false },
    { url: '/pages/user-list', label: 'Users', active: true },
    { url: '/pages/notification-center', label: 'Notifications', active: false }
  ],
  user: {
    name: 'Admin User'
  }
};

// Handle different events
if (input.event === 'onLoad') {
  console.log('User list loaded');
  
} else if (input.event === 'viewProfile') {
  console.log('View profile for user:', input.payload.userId);
  const user = sampleUsers.find(u => u.id === input.payload.userId);
  if (user) {
    // In a real app, you might redirect to a profile page
    console.log('Viewing profile for:', user.name);
  }
  
} else if (input.event === 'sendMessage') {
  console.log('Send message to user:', input.payload.userId);
  const user = sampleUsers.find(u => u.id === input.payload.userId);
  if (user) {
    // In a real app, you might open a message composer
    console.log('Sending message to:', user.name);
  }
  
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