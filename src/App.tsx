import React, { useState, useEffect } from "react";
import ForceGraph3D from "react-force-graph-3d";
import './App.css';

const networkJSON = require("./data/networkKinasesSmall.json");
// const networkJSON = require("./data/example2.json");

const DynamicGraph = () => {
  const [data, setData] = useState(networkJSON);
  
  return <ForceGraph3D
    graphData={data}
    linkCurvature={0.4}
  />;
};


function App() {
  return (
    <div className="App">
      <header className="App-header">
      </header>
      <div className="main">
        <div className="maingraph">
          <DynamicGraph />
        </div>
      </div>
    </div>
  );
}

export default App;
