const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {
        userJoin, 
        getCurrentUser, 
        userLeave, 
        getRoomUsers
} = require('./utils/users');


const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'ChatCord Bot';

// Run when client connects
io.on('connection', socket => {
    //console.log('New ws connection...');

    socket.on('joinRoom', ({ username, room }) => {
      const user = userJoin(socket.id, username, room);

      socket.join(user.room);
    
      // welcome current user
      socket.emit('message', formatMessage(botName, 'welcome to chatChord'));

      // Broadcast when a user connects
      socket.broadcast
        .to(user.room)
        .emit(
            'message', 
            formatMessage(botName, `${user.username} has joined the chat`));

       // Send users and room info
       io.to(user.room).emit('roomUsers', {
           room: user.room,
           users: getRoomUsers(user.room)
       });     
    });

    // Listen for chatMessage
    socket.on('chatMessage', msg => {
        //console.log(msg);
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

    // Runs when a client disconnets
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        const room = getRoomUsers(socket.room);

        if(user) {
          io.to(user.room).emit(
              'message', 
              formatMessage(botName, `${user.username} has left the chat`));

          // Send users and room info
          io.to(user.room).emit('roomUsers', {
          room: user.room,
          users: getRoomUsers(user.room)
        });   
     }
    });
});

const PORT = 5000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));