var botui = new BotUI('api-bot');

var socket = io.connect();

// socket.removeAllListeners();
botui.message.add({
    content: 'Lets Start Talking...'
  }).then(init);


// recieveing a reply from server.
socket.on('fromServer', function (data) {
  botui.message.add({
      content: data.server,
      delay: 500,
    });
});

function init(){
  console.log('6');
      botui.action.text({
        action: {
          placeholder: 'Say Hello'
        }
      }).then(function (res) {
        socket.emit('fromClient', { client : res.value }); // sends the message typed to server
      }).then(init);
    };
