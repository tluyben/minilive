// Using minilive package
const minilive = require('./minilive-package');

const server = minilive({
  port: 3000
});

server.serve();