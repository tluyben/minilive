// login.js - Logic for the login page
console.log('login.js executing');
console.log('Input received:', JSON.stringify(input, null, 2));

// Initialize output
output = {
  title: 'Login Page',
  subtitle: 'Enter your credentials to access your account',
  email: '',
  error: null,
  successMessage: null,
  // Form partial data
  formId: 'login-form',
  fields: [
    {
      id: 'email',
      name: 'email',
      type: 'email',
      label: 'Email',
      placeholder: 'Enter your email',
      value: '',
      enterSubmit: true
    },
    {
      id: 'password',
      name: 'password',
      type: 'password',
      label: 'Password',
      placeholder: 'Enter your password',
      value: '',
      enterSubmit: true
    }
  ],
  submitButtonId: 'login-btn',
  submitText: 'Login',
  submitAction: "triggerEvent('login', { email: document.getElementById('email').value, password: document.getElementById('password').value })"
};

// Handle different events
if (input.event === 'onLoad') {
  // Initial page load
  output.email = input.request.query.email || '';
  output.fields[0].value = output.email;
  
} else if (input.event === 'login') {
  // Handle login submission
  const { email, password } = input.payload;
  
  // Simple validation
  if (!email || !password) {
    output.error = 'Please provide both email and password';
    output.email = email || '';
    output.fields[0].value = output.email;
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
    output.fields[0].value = email;
  }
  
} else if (input.event === 'clearError') {
  // Clear error message
  output.email = input.payload.email || '';
  output.fields[0].value = output.email;
  output.error = null;
}