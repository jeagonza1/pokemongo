const express = require('express');
const index = require('./routes/index');
const services = require('./services');
const bodyParser = require('body-parser');
const debug = require('debug')('express-react:server');
const http = require('http');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set('port', 3001);
app.use('/api', index);

const server = http.createServer(app);

server.listen(3001);
server.on('listening', onListening);

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    debug('Listening on ' + bind);
}

services.setupDatabase;

module.exports = app;
