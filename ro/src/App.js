import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";

function FordFulkersonApp() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [newNode, setNewNode] = useState("");
  const [sourceNode, setSourceNode] = useState("");
  const [targetNode, setTargetNode] = useState("");
  const [capacity, setCapacity] = useState("");
  const [startNode, setStartNode] = useState("");
  const [endNode, setEndNode] = useState("");
  const [maxFlow, setMaxFlow] = useState(null);
  const [graphImages, setGraphImages] = useState([]); // Store all graph images
  const [currentGraph, setCurrentGraph] = useState(null); // Current graph image
  const [currentIteration, setCurrentIteration] = useState(0);
  let i=0

  const addNode = () => {
    if (newNode && !nodes.includes(newNode)) {
      setNodes([...nodes, newNode]);
      setNewNode("");
    }
    console.log(`Node ${newNode} added`)
  };

  const addEdge = () => {
    if (sourceNode && targetNode && capacity) {
      setEdges([...edges, { source: sourceNode, target: targetNode, capacity: parseInt(capacity) }]);
      setSourceNode("");
      setTargetNode("");
      setCapacity("");
      console.log(`Arc ${sourceNode}-(${capacity})->${targetNode} added`)
    }
  };

  const calculateMaxFlow = async () => {
    if (!startNode || !endNode) {
      alert("Veuillez sélectionner un nœud source et un nœud de fin.");
      return;
    }
  
    const payload = {
      nodes,
      edges,
      source: startNode,
      sink: endNode,
    };
  
    try {
      const response = await axios.post("http://127.0.0.1:5000/calculate-max-flow", payload);
      const { maxFlow, graphImages } = response.data;
  
      setMaxFlow(maxFlow); // Set the max flow value
      setGraphImages(graphImages);
      setCurrentGraph(graphImages[0]);
      setCurrentIteration(0);
    } catch (error) {
      console.error("Erreur lors du calcul du flot maximal :", error);
      alert("Une erreur s'est produite lors de l'appel au serveur.");
    }
  };

  const nextIteration=()=>{
    if(currentIteration+1<graphImages.length){
      const nextIndex=currentIteration+1;
      setCurrentIteration(nextIndex);
      setCurrentGraph(graphImages[nextIndex])
    }else alert("Toutes les itérations ont été affichées!")
  }

  const prevIteration=()=>{
    if(currentIteration-1>=0){
      const prevIndex=currentIteration-1
      setCurrentIteration(prevIndex)
      setCurrentGraph(graphImages[prevIndex])
    }else alert("C'est la premiere itération!")
  }
  
  

  const reset = () => {
    setNodes([]);
    setEdges([]);
    setStartNode("");
    setEndNode("");
    setMaxFlow(null);
    setGraphImages([]);
    setCurrentGraph(null);
    setCurrentIteration(0);
    console.log("Graph reset.");
  };

  return (
    <div className="container mt-5">
      <div className="card p-5 shadow-lg">
        <h3 className="text-center mb-4">Flot Maximal - Ford-Fulkerson</h3>

        <div className="mb-4">
          <h5>Ajouter un Nœud</h5>
          <div className="input-group mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Nom du nœud"
              value={newNode}
              onChange={(e) => setNewNode(e.target.value)}
            />
            <button className="btn btn-primary" onClick={addNode}>
              + Ajouter Nœud
            </button>
          </div>
          <div>
            {nodes.map((node, index) => (
              <span key={index} className="badge bg-secondary me-2">
                {node}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h5>Ajouter un Arc</h5>
          <div className="row gx-2 align-items-center">
            <div className="col-md-4">
              <select
                className="form-select"
                value={sourceNode}
                onChange={(e) => setSourceNode(e.target.value)}
              >
                <option value="">Source</option>
                {nodes.map((node, index) => (
                  <option key={index} value={node}>
                    {node}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                value={targetNode}
                onChange={(e) => setTargetNode(e.target.value)}
              >
                <option value="">Destination</option>
                {nodes.map((node, index) => (
                  <option key={index} value={node}>
                    {node}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <input
                type="number"
                className="form-control"
                placeholder="Capacité"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
          </div>
          <button className="btn btn-primary mt-3" onClick={addEdge}>
            Ajouter Arc
          </button>
        </div>

        <div className="mb-4">
          <h5>Arcs Ajoutés</h5>
          <ul className="list-group">
            {edges.map((edge, index) => (
              <li key={index} className="list-group-item">
                {`${edge.source} → ${edge.target} (Capacité: ${edge.capacity})`}
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-4">
          <h5>Définir Source et Sink</h5>
          <div className="row gx-2">
            <div className="col-md-6">
              <select
                className="form-select"
                value={startNode}
                onChange={(e) => setStartNode(e.target.value)}
              >
                <option value="">Source</option>
                {nodes.map((node, index) => (
                  <option key={index} value={node}>
                    {node}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <select
                className="form-select"
                value={endNode}
                onChange={(e) => setEndNode(e.target.value)}
              >
                <option value="">Sink</option>
                {nodes.map((node, index) => (
                  <option key={index} value={node}>
                    {node}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button className="btn btn-success me-3" onClick={calculateMaxFlow}>
            Calculer le Flot Maximal
          </button>
          <button className="btn btn-danger" onClick={reset}>
            Réinitialiser
          </button>
        </div>

        {maxFlow !== null && (
          <div className="mt-4 text-center">
            <h4>Flot Maximal: {maxFlow}</h4>
            {currentGraph && (
              <>
              <img
                src={`data:image/png;base64,${currentGraph}`}
                alt="Graph Visualization"
                style={{ maxWidth: "100%", marginTop: "20px" }}
              />
              <button className="btn btn-danger" onClick={nextIteration}>Next Iteration</button>
              <button className="btn btn-danger" onClick={prevIteration}>Derniere Iteration</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default FordFulkersonApp;
