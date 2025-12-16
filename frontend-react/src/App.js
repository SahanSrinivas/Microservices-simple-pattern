import React, { useState } from 'react';
import './App.css';

function App() {
  const [springMessage, setSpringMessage] = useState("");
  const [fastApiMessage, setFastApiMessage] = useState("");
  const [loadingSpring, setLoadingSpring] = useState(false);
  const [loadingFast, setLoadingFast] = useState(false);

  // Call Spring Boot Service
  const callSpring = async () => {
    setLoadingSpring(true);
    setSpringMessage(""); // Reset previous message
    try {
      // Relative path handled by Ingress
      const response = await fetch('/api/java/hello');
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      setSpringMessage(data.message);
    } catch (error) {
      console.error("Spring Error:", error);
      setSpringMessage("Failed to connect to Spring Boot.");
    }
    setLoadingSpring(false);
  };

  // Call FastAPI Service
  const callFastAPI = async () => {
    setLoadingFast(true);
    setFastApiMessage(""); // Reset previous message
    try {
      // Relative path handled by Ingress
      const response = await fetch('/api/python/hello');
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      setFastApiMessage(data.message);
    } catch (error) {
      console.error("FastAPI Error:", error);
      setFastApiMessage("Failed to connect to FastAPI.");
    }
    setLoadingFast(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>GCP Study Circle</h1>
        <p>Microservices Pattern Demo</p>

        <div className="container">
          {/* Spring Card */}
          <div className="card java-card">
            <h2>Spring Boot</h2>
            <p>Path: /api/java/hello</p>
            <button onClick={callSpring} disabled={loadingSpring} className="btn-java">
              {loadingSpring ? "Calling..." : "Call Spring"}
            </button>
            <div className="response-area">{springMessage}</div>
          </div>

          {/* FastAPI Card */}
          <div className="card python-card">
            <h2>FastAPI</h2>
            <p>Path: /api/python/hello</p>
            <button onClick={callFastAPI} disabled={loadingFast} className="btn-python">
              {loadingFast ? "Calling..." : "Call FastAPI"}
            </button>
            <div className="response-area">{fastApiMessage}</div>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;