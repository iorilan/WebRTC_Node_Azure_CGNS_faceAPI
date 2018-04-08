'use strict';

var roomUrl;

$(document).ready(function () {
    var roomid = generateRoomUrl();
    handleSMSInvite(roomid);
    loadUsersToCall(roomid);
    answerCall();
}); // end of document.ready

/**
 * Generates a random string of length 6. Example: qyvf2x 
 *
 * We need this for the room URL (e.g. http://www.foobubble.com/room/qyvf2x)
 *
 */
function shortUrl() {
    return ("000000" + (Math.random() * Math.pow(36, 6) << 0).toString(36)).slice(-6)
}

/**
 * Set the href for the room
 *
 *
 */
function generateRoomUrl() {
    var room = shortUrl();
    var link = document.getElementById("room-url");
    roomUrl = 'https://' + window.location.host + '/' + room;
    link.href = roomUrl;
    link.innerHTML = room;
    return room;
}

function handleSMSInvite(roomid) {
    $("#btnInvite").click(function () {
        var smsurl = 'https://' + window.location.host + '/' +"sms";
        var phone = $("#txtPhone").val();
        if (phone == null || phone == "") {
            return;
        }
        var self = $(this);
        self.prop({disabled:true});


        $.ajax({
            url: smsurl,
            type: 'post',
            data: JSON.stringify({
                roomid: roomid,
                text: "please join video call to verify your account.",
                to: phone
            }),
            headers: {
                "Accept": "application/json",
                "Content-Type": 'application/json'
            },
            dataType: 'text',
            success: function (data) {
                self.prop({ disabled: false});
                if (data == "ok") {
                    alert("invite sent.");
                } else {
                    alert(data);
                }
            }, fail: function (data) {
                self.prop({ disabled: false });
                alert(data);
            }
        });
    });
}

function loadUsersToCall(roomid) {
    var url = 'https://' + window.location.host + '/' +"alltoken";
    
    $.ajax({
        url: url,
        type: 'get',
        data: "",
        headers: {
            "Accept": "application/json",
            "Content-Type": 'application/json'
        },
        dataType: 'text',
        success: function (data) {
            var objs = JSON.parse(data);
           
            for (var i = 0; i < objs.length; i++) {
                var o = objs[i];
                var html = $("#ddlUser").html();
                html += "<option value='" + o.FcmToken + "' >" + o.UserName + "</option>";
                $("#ddlUser").html(html);
            }
        }, fail: function (data) {
            alert(data);
        }

        
    });

    $("#btnCall").click(function() {
        var fcmUrl = 'https://' + window.location.host + '/' +"call";
        var token = $("#ddlUser").val();
        console.log("token : " + token);
        if (token == "") {
            alert("please select a user to call.");
            return;
        }
        var self = $(this);
        self.prop({ disabled: true });

        $.ajax({
            url: fcmUrl,
            type: 'post',
            data: JSON.stringify({
                roomid: roomid,
                body: "Sinpool customer service is calling you.",
                title: "Video Call",
                registration_token: token
            }),
            headers: {
                "Accept": "application/json",
                "Content-Type": 'application/json'
            },
            dataType: 'text',
            success: function (data) {
                console.log("[calling response] data:" + data);
                self.prop({ disabled: false });
                if (data == "ok") {
                    // goto room
                    window.location = 'https://' + window.location.host + '/' + roomid;
                } else {
                    alert(data);
                }
            }, fail: function (data) {
                self.prop({ disabled: false });
                alert(data);
            }
        });


        
    });

    
}

function answerCall() {
    var setup = function () {
        var url = 'https://' + window.location.host + '/' +"rooms";
        $.ajax({
            url: url,
            type: 'get',
            data: "",
            headers: {
                "Accept": "application/json",
                "Content-Type": 'application/json'
            },
            dataType: 'text',
            success: function (data) {
                data = JSON.parse(data);
                console.log("[rooms response] data:" + data);
                if (data.length > 0) {

                    // populate the callers
                    $("#callingUsers").html("");
                    for (var i = 0; i < data.length; i++) {
                        var html = "<option>" + data[i] + "</option>";
                        var existinghtml = $("#callingUsers").html();
                        $("#callingUsers").html(existinghtml + html);
                    }

                    // show the panel
                    $("#divCalling").show(); 


                    // answer call for selected caller (channel id)
                    $("#btnAnswerCall").click(function () {
                        var roomid = $("#callingUsers").val();
                        var videoUrl = 'https://' + window.location.host + '/' + roomid;


                        var answerUrl = 'https://' + window.location.host + '/' +"answer";
                        $.ajax({
                            url: answerUrl,
                            type: 'post',
                            data: JSON.stringify({
                                roomid: roomid,
                            }),
                            headers: {
                                "Accept": "application/json",
                                "Content-Type": 'application/json'
                            },
                            dataType: 'text',
                            success: function (data) {
                               if (data == "ok") {
                                   window.location = videoUrl;
                               } else {
                                   alert(data);
                                }

                            }, fail: function (data) {
                                alert(data);
                            }
                        });


                       
                    });
                } else {
                    $("#divCalling").hide();
                }
            },
            fail: function (data) {
                console.error(data);
            }
        });
    };

    // TODO add refresh button
    setup();
}
