import React from 'react';

const Home = () => {
    return(
        <div>
            <p>
                <input placeholder="Enter user ID to start chatting with your connected peers"/>
                <h4 style={{textAlign: "center"}}>OR</h4>
                <a href="/chat">Click to Create New User ID</a>
            </p>
        </div>
    )
}


export default Home;