import React, { useState, useEffect } from "react";
import socketIOClient from "socket.io-client";

const ENDPOINT = "http://localhost:4001";


const userId = "user-1"; 

const ChatWindow = () => {

    const [conversationList, setConversationList] = useState([]);
    const [currentMessage, setCurrentMessage] = useState("");
    
    const socket = socketIOClient(ENDPOINT);
    const socketId = socket.id;


    const sendMessage = () => { 
        const toSendUserId = "user-2"; 
        socket.emit('IncomingMessage', {userId, toSendUserId, message: currentMessage, socketId});
    };

    useEffect(() => {
        /* When user is online */
        console.log("socketId", socket.id);
        socket.emit('UserIsOnline', { userId, socketId});
    }, []);

    /* Listener for updating online users list */
    socket.on("OnlineUserListUpdate", list => {
        console.log("list is updated for user 1", JSON.parse(list));
    });

    /* Listener for getting sent messages */
    socket.on("SendingMessage", data => {
        const {
          from,
          to,
          message
          } = data;
          console.log("I am :", "user-1");
          console.log("from", from);
          console.log("to", to);
          console.log("message", message);
    });

    return(
        <div>
            <div style={{width: "40%", float: 'right'}}>

            </div>
            <div style={{width: "60%", float: 'left'}}>
            <form onSubmit={() => sendMessage()}>
                <input
                  placeholder="Enter message"
                 
                  onChange={(event) => setCurrentMessage(event.target.value)}
                />
              </form>
            </div>
            <div style={{float: 'clear'}}></div>
        </div>
    );
}

export default ChatWindow;