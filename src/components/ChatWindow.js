import React, { useState, useEffect } from "react";
import axios from 'axios';
import {createUseStyles} from 'react-jss'

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
    },
    listBlock: {
        marginBottom: 20,
        padding: '20px 0',
        borderBottom: '1px solid #aaa',
        '& h4': {
            marginBottom: 20,
            fontWeight: 700
        },
        '& li': {
            marginBottom: 5
        }
    }
  })

const ChatWindow = ({socket, socketId, ENDPOINT }) => {

    const [userId, setUserId] = useState(localStorage.getItem('userId'));
    const [conversationList, setConversationIdList] = useState([]);
    const [currentMessage, setCurrentMessage] = useState("");
    const [usersList, setUsersList] = useState([]);
    const [messageListByConvId, setMssageListByConvId] = useState({});
    const [userOnlineStatus, setUserOnlineStatus] = useState({});
    const [groupListByConvId, setGroupListByConvId] = useState({});
    
    const [currentChattingUser, setCurrentChattingUser] = useState('');
    const [currentOpenGroup, setCurrentOpenGroup] = useState('');
    /* 
        id : cid 
        id is of user to whom user is sending message
    */
    const [currentOpenConvIdMap, setCurrentOpenConvIdMap] = useState({});

    const getAllUsers = axios.get(`${ENDPOINT}/user`);
    const getConversationIdsByUserId = axios.get(`${ENDPOINT}/conversation/${userId}`);
    const getUserOnlineStatus = (id) => axios.get(`${ENDPOINT}/user/online/status/${id}`);


    useEffect(() => {
        setUserId(localStorage.getItem('userId'));

        return () => {
            socket.emit("UserIsOffline", localStorage.getItem('userId'));
            socket.disconnect();
        }
    }, []);

    useEffect(() => {
        const groupConvIdMap = {...groupListByConvId};
        for(let obj of conversationList) {
            if(obj.isGroup) {
                groupConvIdMap[obj.cid] = {
                    'users' : obj.user_id.map((id) => { return {
                        'userId': id, 
                        'name': usersList.find(u => u.user_id == id) ? usersList.find(u => u.user_id == id).username : ''
                    }}),
                }
            }
        }
        setGroupListByConvId(groupConvIdMap);
    }, [conversationList])

    const sendMessage = (event, toSendUserId) => { 
        event.preventDefault();
        if(currentOpenGroup !== '') {
            const convId = currentOpenGroup;
            socket.emit('IncomingMessage', {
                senderId: userId, 
                message: currentMessage, 
                convId: convId
            });
        } else {
            const convId = currentOpenConvIdMap[toSendUserId]
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
        }
        
    };

    const getAllConversationsByConvId = (convId) => {
        const current = Math.floor(+ new Date()/1000);
        const previous = current - 864000000;
        return axios.get(`${ENDPOINT}/message/${convId}/${previous}/${current}`);
    }

    const openGroupConversationById = (convId) => {
        setCurrentChattingUser('');
        setCurrentOpenGroup(convId);
    }

    const getConvIdForUserToStartConv = async (event, uid) => {
        event.preventDefault();
        setCurrentOpenGroup('');
        const userStatus = await getUserOnlineStatus(uid);
        if(userStatus) {
            const onlineStatusMap = {...userOnlineStatus};
            onlineStatusMap[uid] = userStatus.data.isOnline;
            setUserOnlineStatus(onlineStatusMap);
        }
            
        /* Create Conversation ID if doesn't exists */
        for(let obj of conversationList) {
            if(obj.user_id.length == 2 && obj.user_id.indexOf(uid) >= 0 && obj.user_id.indexOf(userId) >= 0) {
                const map = {...currentOpenConvIdMap}
                map[uid] = obj.cid;
                setCurrentOpenConvIdMap(map);
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
        /* Get Conversation ID's for previous conversations with users */
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
    const currentConvId = currentOpenConvIdMap[currentChattingUser];
    const messages = currentChattingUser !== '' && messageListByConvId[currentConvId] ? messageListByConvId[currentConvId] : [];

    console.log("groupListByConvId", groupListByConvId)
    console.log("currentOpenConvIdMap", currentOpenConvIdMap)
    console.log("currentOpenGroup", currentOpenGroup)
    console.log('groupListByConvId[currentOpenGroup]', groupListByConvId[currentOpenGroup])
    const groupUsers = groupListByConvId[currentOpenGroup] ? groupListByConvId[currentOpenGroup].users : [];
    console.log("groupUsers", groupUsers)
   
    return(
        <div style={{position: 'relative'}}>
            <div className={classes.leftUsersWindow}>
                <div className={classes.listBlock}>
                    <h4> Group Chat </h4>
                    <ul>
                        {
                            Object.keys(groupListByConvId).map((ci, index) => {
                                return <li onClick={event => openGroupConversationById(ci)}>Group-{index+1}</li>
                            })
                        }
                    </ul> 
                </div>
                <div className={classes.listBlock}>
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
            </div>
            <div className={classes.rightChatWindow}>
                <div style={{position: 'relative', height: '100%'}}>
                    <div className={classes.chatWindowUserName}>
                        {
                            currentOpenGroup !== '' && groupListByConvId[currentOpenGroup] ? (
                                <div style={{textAlign: 'left'}}>
                                    <p style={{display: 'inline-block', verticalAlign: 'middle'}}>Group - </p>
                                    <ul style={{display: 'inline-block', verticalAlign: 'middle'}}>
                                        {
                                            groupUsers.map(u => {
                                                return <li style={{display: 'inline-block', verticalAlign: 'middle'}}>{u.name || 'You'}, &nbsp;</li>
                                            })
                                        }
                                    </ul>
                                </div>
                               
                            ) : (
                                <p>
                                    {
                                        currentChattingUser !== '' && usersList.find((user) => user.user_id == currentChattingUser).username
                                    }
                                    <span>{userOnlineStatus[currentChattingUser] ? ' - Online' : ' - Offline'}</span>
                                </p>
                            )
                        }
                        
                        
                            
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
                            (currentChattingUser !== '' || currentOpenGroup !== '') && (
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