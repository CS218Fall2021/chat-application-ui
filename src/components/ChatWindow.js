import React, { useState, useEffect } from "react";
import axios from 'axios';
import {createUseStyles} from 'react-jss'
const userId = 1; 

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
        overflowY: 'scroll',
        height: 'calc(100% - 150px)',
        padding: '0 20px',
        '& li': {
            border: '2px solid #dedede',
            backgroundColor: '#f1f1f1',
            borderRadius: '5px',
            padding: '10px',
            margin: '10px 0',
            '& img': {
                float: 'left',
                maxWidth: '60px',
                width: '100%',
                marginRight: '20px',
                borderRadius: '50%'
            }
        },
    },
    darker: {
        borderColor: '#ccc !important',
        backgroundColor: '#ddd !important'
    },
    image: {
        float: 'right',
        marginLeft: '20px',
        marginRight: 0
    },
    timeRight : {
        float: 'right',
        color: '#aaa'
    },
    timeLeft : {
        float: 'left',
        color: '#999'
      }
  })

const ChatWindow = ({socket, socketId, ENDPOINT }) => {

    const [conversationList, setConversationIdList] = useState([]);
    const [currentMessage, setCurrentMessage] = useState("");
    const [usersList, setUsersList] = useState([]);
    const [messageListByConvId, setMssageListByConvId] = useState({});
    
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
        const convId = currentOpenConvIdMapForOneToOne[toSendUserId]
        socket.emit('IncomingMessage', {
            senderId: userId, 
            message: currentMessage, 
            convId: convId
        });

        const messagesListMap = {...messageListByConvId};
        if(!messagesListMap[convId]) {
            messagesListMap[convId] = [];
        }
        messagesListMap[convId].push({ sender : userId, message: currentMessage, timestamp: Math.floor(+ new Date()/1000) });
        setMssageListByConvId(messagesListMap);
        setCurrentMessage('');
    };

    const getAllConversationsByConvId = (convId) => {
        const current = Math.floor(+ new Date()/1000);
        const previous = current - 864000000;
        return axios.get(`${ENDPOINT}/message/${convId}/${previous}/${current}`);
    }

    const getConvIdForUserToStartConv = async (event, uid) => {
        event.preventDefault();
        /* Create Conversation ID if doesn't exists */
        for(let obj of conversationList) {
            if(obj.user_id.length == 2 && obj.user_id.indexOf(uid) >= 0 && obj.user_id.indexOf(userId) >= 0) {
                const map = {...currentOpenConvIdMapForOneToOne}
                map[uid] = obj.cid;
                setCurrentOpenConvIdMapForOneToOne(map);
                setCurrentChattingUser(uid);
            
                /* Fetch messages for the conversation ID */
                const result = await getAllConversationsByConvId(obj.cid);
                const messagesListMap = {...messageListByConvId};
                messagesListMap[ obj.cid] = [...result.data.result].map((data) => {
                    return {
                        message: data.data,
                        sender: data.sender_id,
                        timestamp: data.timestamp
                    }
                });
                setMssageListByConvId(messagesListMap);
                return;
            }
        }
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
                from: senderId,
                to: convId,
                message
            } = data;

            const messagesListMap = {...messageListByConvId};
            if(!messagesListMap[convId]) {
                messagesListMap[convId] = [];
            }
            messagesListMap[convId].push({ sender : senderId, message });
            setMssageListByConvId(messagesListMap);
            // window.scrollTo({ left: 0, top: document.body.scrollHeight, behavior: "smooth" });
            
            console.log("I am :", userId);
            console.log("from", senderId);
            console.log("messagesListMap", messagesListMap)
        });
    }
    
    const classes = useStyles();
    console.log("current", usersList.find((user) => user.user_id == currentChattingUser))
    console.log("currentChattingUser", currentChattingUser);
    console.log("currentOpenConvIdMapForOneToOne", currentOpenConvIdMapForOneToOne);
    const currentConvId = currentOpenConvIdMapForOneToOne[currentChattingUser];
    const messages = currentChattingUser !== '' && messageListByConvId[currentConvId] ? messageListByConvId[currentConvId] : [];
    console.log("messages", messages)
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
                            {
                                messages.map(data => {
                                    return (
                                        <li className={data.sender == userId ? classes.darker : null}>
                                            <h6 style={{textAlign: 'right', marginBottom: 5, textTransform: 'capitalize', fontWeight: 700, fontStyle: 'italic'}}>
                                                {
                                                    data.sender !== userId && currentChattingUser !== '' && usersList.find((user) => user.user_id == currentChattingUser).username
                                                }
                                            </h6>
                                            <p style={{textAlign: data.sender == userId ? 'left' : 'right'}}>{data.message}</p> 
                                            <span style={{textAlign: data.sender == userId ? 'left' : 'right', display: 'block', marginTop: '5px'}}>{new Date(data.timestamp).toLocaleTimeString("en-US")}</span>  
                                            <span style={{clear: 'both'}}></span>    
                                        </li>
                                    )
                                })
                            }
                    </ul>
                    <form 
                        className={classes.messageForm}
                        onSubmit={(event) => sendMessage(event, currentChattingUser)} >
                        {
                            currentChattingUser !== '' && (
                                <input
                                    value={currentMessage}
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