$(document).ready(function() {
  var flow = new Flow(
    'PUT ORGANISATION/FLOW HERE',
    'PUT API_TOKEN_HERE');
  flow.init();
});

function Flow(flowId, apiToken) {
  var REST_API_URL = 'https://api.flowdock.com/flows/' + flowId;
  var USERS_URI = REST_API_URL +'/users';
  var POST_URI = REST_API_URL + '/messages';
  var EVENT_URI = 'https://stream.flowdock.com/flows'
            + '?filter=' + flowId + '&token=' + apiToken;

  function init() {
    getUserList(function(users) {
      startFlow(users);
    });
  }

  function startFlow(users) {
    subscribeToEvents(users);
    bindUIEvents();
    $('#chatInput').prop('disabled', false);
  }

  function subscribeToEvents(users) {
    var source = new EventSource(EVENT_URI);
    source.onmessage = function (event) {
      var data = JSON.parse(event.data);
      var content;
      if (data.event === 'message') {
        content = data.content;
      } else if (data.event === 'comment') {
        content = data.content.text;
      }
      if (content)
        printMessage(users[data.user].nick, content);
    };
  }

  function bindUIEvents() {
    $('#chatForm').submit(function(event) {
      sendMessage($('#chatInput').val());
      $('#chatInput').val('');
      event.preventDefault();
    });
  }

  function getUserList(callback) {
    sendAjax({
      url : USERS_URI,
      dataType: 'json',
      success: function(data){       
        callback(getUsersObjectFromUserList(data));
      }
    });
  }

  function getUsersObjectFromUserList(usersList) {
    var userListObj = {};
    for (var i=0; i<usersList.length; i++) {
      userListObj[usersList[i].id] = usersList[i];
    }
    return userListObj;
  }

  function printMessage(name, content) {
    var listElement = $('<li/>');
    listElement.append($('<span class="name"/>').text(name));
    listElement.append(': ');
    listElement.append($('<span class="content"/>').text(content));
    $('#chatBox').append(listElement);
  }

  function sendMessage(content) {
    sendAjax({
      url : POST_URI,
      type: 'POST',
      dataType: 'json',
      data: {event: 'message', content: content}
    });
  }

  function sendAjax(opts) {
    var options = $.extend({}, opts);
    options.beforeSend = function(xhr){
      xhr.setRequestHeader ("Authorization", "Basic " + btoa(apiToken));
    };
    $.ajax(options);
  }

  return {
    init: init
  }
}


