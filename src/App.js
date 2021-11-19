import logo from './logo.svg';
import './App.css';
import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';

import socketIOClient from "socket.io-client";
const ENDPOINT = "http://localhost:4001";

function App() {

  const [response, setResponse] = useState("");

  useEffect(() => {
    const socket = socketIOClient(ENDPOINT);
    socket.on("FromAPI", data => {
      setResponse(data);
    });


    return () => socket.disconnect();
  }, []);

  return (
    <div className="App">
      <p>
        <input placeholder="Enter user ID to start chatting with your connected peers"/>
        <h4 style={{textAlign: "center"}}>OR</h4>
        <Link to="/chat">Click to Create New User ID</Link>
      </p>
    </div>
  );
}

export default App;
