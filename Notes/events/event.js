const EventEmitter = require('events');
const http = require('http');

//Its always a better practice to create a class for using events.
class Sales extends EventEmitter {
  // super in the constructor calls the parent class .
  constructor() {
    super();
  }
}

const myEmitter = new Sales();

myEmitter.on('newSale', () => {
  console.log('There was a new sale');
});

myEmitter.on('newSale', (value) => {
  console.log(`There are now ${value} left in the stock `);
});

myEmitter.emit('newSale', 9);

//HTTP
const server = http.createServer();
server.on('request', (req, res) => {
  res.end('Request Received');
});

server.on('request', () => {
  console.log('another request');
});

server.on('close', () => {
  console.log('Server Closed');
});

server.listen(4500, '127.0.0.1', () => {
  console.log('Waiting for the request....');
});
