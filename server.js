'use strict';

const express = require('express');
const socketIO = require('socket.io');
const path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var index = require('./routes/index');
var http = require('http');
var socke = require('./config/sock');
var api = require('./config/api');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'public');

const app = express();
var server = http.createServer(app);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')))
app.use('/', index);

const io = socketIO.listen(server);

io.on('connection', (socket) => {
  console.log('Client connected');
  socke.fromClient(socket);

  });
server.listen(PORT, () => console.log(`Listening on ${ PORT }`));
