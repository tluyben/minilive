// dashboard.js - Logic for the dashboard page
console.log('dashboard.js executing');

// Initialize output
output = {
  title: 'Dashboard',
  message: 'Welcome to your dashboard!',
  timestamp: new Date().toLocaleString()
};

// Handle different events
if (input.event === 'onLoad') {
  console.log('onLoad event received');
  // Initial page load
  output.message = 'Successfully logged in!';
  
} else if (input.event === 'logout') {
  console.log('logout event received');
  // Handle logout
  output.commands = [{
    type: 'redirect',
    location: '/pages/login'
  }];
  
} else if (input.event === 'refresh') {
  console.log('refresh event received');
  // Refresh timestamp
  output.timestamp = new Date().toLocaleString();
  output.message = 'Dashboard refreshed!';
  // Update title to show refresh count
  if (!global.refreshCount) global.refreshCount = 0;
  global.refreshCount++;
  output.title = `Dashboard (Refreshed ${global.refreshCount}x)`;
}