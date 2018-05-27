var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var db = require('./connection');
var api = require('./api');
var mongoose = require('mongoose');
var preco
//return from server and pass to botui
var fromClient = function(socket) {
    socket.on('fromClient', function (data) {
      api.getRes(data.client).then(function(res){
        var cond;
        mongoose.connection.readyState == 1 ?  cond = true :  cond = false;
          //Get all papers
          if(res.result.parameters.Course){
            if(cond) {
              var x = "<br>";
              db.find({})
              .exec()
              .then(docs => {
                for (var i in docs) {
                  x += docs[i].name + "<br>";
                }
                var result = res.result.fulfillment.speech + x;
                socket.emit('fromServer', { server: result });
                return docs;
              })//end then
              .catch(err => {console.log(err);});
            } else {
              console.log('error');
            }//end if
          }else if (res.result.parameters.Requisites == 'pre') { //Get Pre
            preco = true;
            getRequisite(res,socket);
          }else if (res.result.parameters.Requisites == 'co') { //Get Co
            preco = false
            getRequisite(res,socket);
          }else if (res.result.parameters.Year || res.result.parameters.Semester || res.result.parameters.Location) {
            getYearSemesterLocation(res, socket);
          }else if (res.result.parameters.YearStudy && res.result.contexts[0].parameters.Paper) {
            var paper = res.result.contexts[0].parameters.Paper;
            var yearstudy = res.result.contexts[0].parameters.YearStudy;
            console.log(res.result);
            getFailPaper(res, socket, paper, yearstudy);
          }else {
            socket.emit('fromServer', { server: res.result.fulfillment.speech });
          }
          // end if
      });//end api.getRes()
    });//end socket.on
};//end function

//get Requisites
var getRequisite = function (res,socket) {
  var bln =true;
  //loop through the file
  db.find({})
  .exec()
  .then(docs => {
    for(let i in docs){
      //check if the paper is in the system or not
      if(res.result.parameters.Paper === docs[i].name) {
        if(preco) {
          var result = res.result.fulfillment.speech + " " + docs[i].pre;
        }else {
          var result = res.result.fulfillment.speech + " " + docs[i].co;
        }
        socket.emit('fromServer', { server: result });
        bln = true;
        break;
      }else {
        bln = false;
      }//end if
    }// end for
    if(!bln) {
      var fault = "The paper you are looking for is not in the system";
      socket.emit('fromServer', { server: fault });
    }
  })//end then
  .catch(err => {console.log(err);});
};

var getYearSemesterLocation = function (res, socket) {
  var bln = true;
  db.find({})
  .exec()
  .then(docs => {
    for(let i in docs) {
      if(res.result.parameters.Paper === docs[i].name) {
        if(res.result.parameters.Year){
          var result = res.result.fulfillment.speech + " " + docs[i].year;
        }else if (res.result.parameters.Semester) {
          var result = res.result.fulfillment.speech + " " + docs[i].semester;
        }else if (res.result.parameters.Location) {
          var result = res.result.fulfillment.speech + " " + docs[i].location;
        }
        socket.emit('fromServer', { server: result });
        bln = true;
        break;
      }else {
        bln = false;
      }
    }//end for
    if(!bln) {
      var fault = "The paper you are looking for is not in the system";
      socket.emit('fromServer', { server: fault });
    }//end if
  }).catch(err => {console.log(err);});
};

/*
Get paper that can't take when fail <a specific paper>
@params
bln : if the paper is not in the system
code : paper code of the failed paper
pre : get pre-requisites of the current paper in the for loop
resultyes : paper can take
resultno : paper cannot take
*/
var getFailPaper = function(res, socket, paper, yearstudy) {
  var bln = true;
  var code, pre, isCore;
  var result = " ";
  var j = 0;
  db.find({})
  .exec()
  .then(docs => {
    for(let i in docs){
      /* Check if the paper is in the system or not
      ---------------------------------------------------*/
      if(paper === docs[i].name) {
        console.log('2');
        //check paper isCore
        if(docs[i].core == 'core') {
          console.log('1');
          isCore = true;
          result = " You have to redo " + paper + " because it's a core paper ";
        }else {
          isCore = false;
          result = " ";
        }
        code = docs[i].code;
        bln = true;
      }
      /* If pre-req of current paper contain paper failed
      ---------------------------------------------------*/
      pre = docs[i].pre;
      if(pre.includes(code)) {
          result += "You can't take these paper: [" +docs[i].code + " " + docs[i].name + "], ";
      }else {
        j++;
      }
      //Paper that is not pre-req of any papers
      if(isCore == false) {
        if(j == docs.length) {
          result = " Other 15 points from elective paper from the current year of study ";
        }
      }
    }// end for

    // Print out result
    socket.emit('fromServer', { server: res.result.fulfillment.speech + result });
    if(!bln) {
      var fault = "The paper you are looking for is not in the system";
      socket.emit('fromServer', { server: fault });
    }//end if
  })//end then
  .catch(err => {console.log(err);});
}
module.exports = {fromClient}
