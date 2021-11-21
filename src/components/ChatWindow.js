import React, { useState, useEffect } from "react";
import axios from 'axios';
import {createUseStyles} from 'react-jss'
const userId = 1; 

const cIdMap = {
    /* */
    'cid-123' : {
        users: [1,2],
        isGroup: false
    },
    'cid-1234' : {
        users: [1,3],
        isGroup: false
    },
    'cid-121' : {
        users: [1,3,5],
        isGroup: true
    },
}

const useStyles = createUseStyles({

    leftUsersWindow : {
        padding: 20,
        width: 300,
        height: '100%',
        position: 'fixed',
        borderRight: '3px solid #ddd',
        zIndex: 1,
        top: 0,
        left: 0,
        overflow: 'hidden',
        '& ul': {
            listStyleType: 'none',
            paddingLeft: 0,
            textAlign: 'left',
            '& li' : {
                cursor: 'pointer',
                '&:hover': {
                    color: 'blue'
                }
            }
        },
        '& h4': {
            textAlign: 'left',
            fontSize: 20,
            fontWeight: 500
        }
    },
    usersChatList: {

    },
    windowSubTitle: {

    },
    rightChatWindow: {
        position: 'fixed',
        height: '100%',
        top: 0,
        right: 0,
        width: 'calc(100% - 340px)'
    },
    chatWindowUserName: {
        padding: '0 20px',
        height: 50,
        color: 'white',
        background: '#008080',
        '& p': {
            fontSize: 18,
            height: 18,
            padding: 14,
            textAlign: 'left',
            textTransform: 'capitalize'
        }
    },
    messageForm: {
       height: 100,
       position: 'absolute',
       bottom: 0,
       width: '100%',
       '& input': {
           width: '85%',
           padding: 30,
           fontSize: 18,
       }
    },
    messages: {
        // position
        height: 'calc(100% - 150px)'
    }
  })

const ChatWindow = ({socket, socketId, ENDPOINT }) => {

    const [conversationList, setConversationIdList] = useState([]);
    const [currentMessage, setCurrentMessage] = useState("");
    const [usersList, setUsersList] = useState([]);
    
    const [currentChattingUser, setCurrentChattingUser] = useState('');
    /* 
        id : cid 
        id is of user to whom user is sending message
    */
    const [currentOpenConvIdMapForOneToOne, setCurrentOpenConvIdMapForOneToOne] = useState({});

    const getAllUsers = axios.get(`${ENDPOINT}/user`);
    const getConversationIdsByUserId = axios.get(`${ENDPOINT}/conversation/${userId}`);

    const sendMessage = (event, toSendUserId) => { 
        event.preventDefault();
        console.log("sending message", currentOpenConvIdMapForOneToOne[toSendUserId])
        socket.emit('IncomingMessage', {
            senderId: userId, 
            message: currentMessage, 
            convId: currentOpenConvIdMapForOneToOne[toSendUserId]
        });
    };

    const getConvIdForUserToStartConv = (event, uid) => {
        event.preventDefault();
        conversationList.forEach(obj => {
            if(obj.user_id.length == 2 && obj.user_id.indexOf(uid) >= 0 && obj.user_id.indexOf(userId) >= 0) {
                const map = {...currentOpenConvIdMapForOneToOne}
                map[uid] = obj.cid;
                setCurrentOpenConvIdMapForOneToOne(map);
                setCurrentChattingUser(uid);
                /* Fetch messages for the conversation ID */
                return;
            }
        });
    }

    useEffect(() => {
        /* When user is online */
        if(socket) {
            socket.emit('UserIsOnline', { userId, socketId : socketId });
        }

        /* Get all users */
        /* Get Conversation ID's for previous conversations with uers */
        Promise.all([getAllUsers, getConversationIdsByUserId]).then(res => {
            setUsersList(res[0].data.result.filter(user => user.user_id != userId));
            setConversationIdList(res[1].data.userids);
        });
        
    }, [socket]);

    /* Listener for updating online users list */
    if(socket) {
        socket.on("OnlineUserListUpdate", list => {
            // setConversationList(JSON.parse(list));
        });

        /* Listener for getting sent messages */
        socket.on("SendingMessage", data => {
            const {
            from,
            to,
            message
            } = data;
            console.log("I am :", userId);
            console.log("from", from);
            console.log("conv", to);
            console.log("message", message);
        });
    }
    
    const classes = useStyles();

    console.log("usersList", usersList);
    console.log("current", usersList.find((user) => user.user_id == currentChattingUser))
    console.log("currentChattingUser", currentChattingUser)

    return(
        <div style={{position: 'relative'}}>
            <div className={classes.leftUsersWindow}>
                <div>
                    <h4> Contact List </h4>
                    <ul>
                        {
                            usersList.map(user => {
                            return(
                                <li    
                                    onClick={(event) => getConvIdForUserToStartConv(event, user.user_id)}
                                    key={`${user.username}-${user.user_id}`}>
                                        {user.username}
                                </li>
                            )  
                            })
                        }
                    </ul> 
                </div>
                <div className={classes.usersChatList}>

                </div>
                
            </div>
            <div className={classes.rightChatWindow}>
                <div style={{position: 'relative', height: '100%'}}>
                    <div className={classes.chatWindowUserName}>
                        <p>
                            {
                                currentChattingUser !== '' && usersList.find((user) => user.user_id == currentChattingUser).username
                            }
                        </p>
                            
                    </div>
                    <ul className={classes.messages}>


                    </ul>
                    <form 
                        className={classes.messageForm}
                        onSubmit={(event) => sendMessage(event, currentChattingUser)} >
                        {
                            currentChattingUser !== '' && (
                                <input
                                    placeholder="Enter message"  
                                    onChange={(event) => setCurrentMessage(event.target.value)}
                                />
                            )
                        }
                        
                    </form>
                </div>
                
                
            </div>
        </div>
    );
}

export default ChatWindow;