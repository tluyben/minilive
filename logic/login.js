// login.js - Logic for the login page
console.log('login.js executing');
console.log('Input received:', JSON.stringify(input, null, 2));

// Initialize output
output = {
  title: 'Login Page',
  email: '',
  error: null,
  successMessage: null
};

// Handle different events
if (input.event === 'onLoad') {
  // Initial page load
  output.email = input.request.query.email || '';
  
} else if (input.event === 'login') {
  // Handle login submission
  const { email, password } = input.payload;
  
  // Simple validation
  if (!email || !password) {
    output.error = 'Please provide both email and password';
    output.email = email || '';
  } else if (email === 'test@example.com' && password === 'password') {
    // Successful login - redirect to dashboard
    output.commands = [{
      type: 'redirect',
      location: '/pages/dashboard'
    }];
  } else {
    // Failed login
    output.error = 'Invalid email or password';
    output.email = email;
  }
  
} else if (input.event === 'clearError') {
  // Clear error message
  output.email = input.payload.email || '';
  output.error = null;
}