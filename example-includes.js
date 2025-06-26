// Example: Using page-specific includes with MiniLive

const minilive = require('./minilive-package');

const server = minilive({
  port: 3000,
  
  // Define includes per page
  includes: (page) => {
    // Global includes for all pages
    const globalIncludes = [
      // External CSS
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap',
      
      // Local CSS
      '/css/global.css',
      
      // Inline global styles
      {
        type: 'inline-css',
        content: `
          :root {
            --primary-color: #3b82f6;
            --background: #f9fafb;
          }
          body {
            font-family: 'Inter', sans-serif;
            background: var(--background);
          }
        `
      }
    ];
    
    // Page-specific includes
    switch (page) {
      case 'dashboard':
        return [
          ...globalIncludes,
          // Dashboard-specific CSS
          '/css/dashboard.css',
          
          // Chart library
          'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
          
          // Dashboard initialization script
          {
            type: 'inline-js',
            content: `
              window.addEventListener('DOMContentLoaded', function() {
                console.log('Dashboard loaded with Chart.js available:', typeof Chart !== 'undefined');
              });
            `
          }
        ];
      
      case 'editor':
        return [
          ...globalIncludes,
          // Rich text editor
          { type: 'css', src: 'https://cdn.quilljs.com/1.3.6/quill.snow.css' },
          { type: 'js', src: 'https://cdn.quilljs.com/1.3.6/quill.js' },
          
          // Editor configuration
          {
            type: 'inline-js',
            content: `
              window.QUILL_CONFIG = {
                theme: 'snow',
                modules: {
                  toolbar: [
                    ['bold', 'italic', 'underline'],
                    ['link', 'image'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }]
                  ]
                }
              };
            `
          },
          
          // Editor initialization (deferred)
          { type: 'js', src: '/js/editor-init.js', defer: true }
        ];
      
      case 'analytics':
        return [
          ...globalIncludes,
          // Analytics libraries
          'https://cdn.jsdelivr.net/npm/apexcharts@latest/dist/apexcharts.min.css',
          { type: 'js', src: 'https://cdn.jsdelivr.net/npm/apexcharts@latest/dist/apexcharts.min.js', defer: true },
          
          // Date picker
          'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css',
          'https://cdn.jsdelivr.net/npm/flatpickr',
          
          // Page-specific styles
          '/css/analytics.css'
        ];
      
      default:
        // Just global includes for other pages
        return globalIncludes;
    }
  }
});

server.serve(() => {
  console.log('Server running with page-specific includes!');
});

// Usage notes:
// 1. Includes are only added on initial page load (not SPA navigation)
// 2. String includes are auto-detected by extension (.css → stylesheet, .js → script)
// 3. Object format allows fine control (defer, async, inline content)
// 4. Includes are injected before MiniLive's required scripts
// 5. Order matters - includes are added in array order