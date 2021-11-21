import logo from './logo.svg';
import './App.css';
import React, { useState, useEffect } from "react";
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';

import socketIOClient from "socket.io-client";
import { io } from "socket.io-client";
import ChatWindow from './components/ChatWindow';
import Home from './components/Home';


const ENDPOINT = "http://localhost:4001";
// const ENDPOINT = "http://172.24.9.112:4001";



function App() {

  const [response, setResponse] = useState("");
  const [socket, setSocket] = useState(null);
  const [socketId, setSocketId] = useState('');

  useEffect(() => {
    const socketIO = io(ENDPOINT);
    socketIO.on("connect", () => {
      setSocketId(socketIO.id);
      setSocket(socketIO);
    });    

    return () => socketIO.disconnect();
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path='/chat' element={<ChatWindow 
                                          socket={socket} 
                                          socketId={socketId}
                                          ENDPOINT={ENDPOINT} 
                                          />} 
                                        />
        </Routes>
      </BrowserRouter> 
    </div>
  );
}

export default App;
