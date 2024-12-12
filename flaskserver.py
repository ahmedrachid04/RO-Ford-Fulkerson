from flask import Flask, request, jsonify
import networkx as nx
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import io
import base64
from flask_cors import CORS

# defini l'application de flask pour etre appellee par CORS
app = Flask(__name__)
# cette ligne permet seulment les requetes arrivant du port 3000 de passer sans etre blocker par CORS
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

def construire_graphe(data):
    """
    Construct the graph from the provided data.
    """
    G = nx.DiGraph()
    nodes = data.get("nodes", [])
    edges = data.get("edges", [])

    # Add nodes
    G.add_nodes_from(nodes)

    # Add edges with capacities
    for edge in edges:
        G.add_edge(edge['source'], edge['target'], capacity=edge['capacity'], flow=0)

    return G

def trouver_chemin_ameliore(G, source, puits, visited):
    """
    Improved function to find an augmenting path using DFS.
    Returns the path and the minimum residual capacity.
    """
    if source == puits:
        return [], float('inf')  # Base case: reached the sink

    visited.add(source)

    for neighbor in G[source]:
        # Calculate residual capacity
        residual_capacity = G[source][neighbor]['capacity'] - G[source][neighbor]['flow']

        if neighbor not in visited and residual_capacity > 0:
            # Recurse to find the path from the neighbor to the sink
            path, min_capacity = trouver_chemin_ameliore(G, neighbor, puits, visited)
            if path is not None:
                return [(source, neighbor)] + path, min(residual_capacity, min_capacity)

    return None, 0  


def ford_fulkerson(G, source, sink):
    """
    Ford-Fulkerson algorithm to calculate max flow. Handles backward edges dynamically.
    """
    flow_total = 0
    graph_states = []  # To store graph states
    original_edges = list(G.edges)

    while True:
        visited = set()  # Track visited nodes
        path, flow = trouver_chemin_ameliore(G, source, sink, visited)

        if flow == 0:  # No augmenting path found
            break

        flow_total += flow

        # Update flows along the path
        for u, v in path:
            # Forward edge: Increase flow
            G[u][v]['flow'] += flow

            # Backward edge: Decrease flow
            if G.has_edge(v, u):  # If backward edge exists
                G[v][u]['flow'] -= flow
            else:  # Create the backward edge dynamically if not present
                G.add_edge(v, u, capacity=0, flow=-flow)

        # Save the current state of the graph
        graph_image = afficher_graphe(G, original_edges)
        graph_states.append(graph_image)

    return flow_total, graph_states




def afficher_graphe(G, original_edges):
    import matplotlib.pyplot as plt

    """
    Generate a graph visualization showing only the original edges with updated flow and capacity.
    Returns the graph as a base64-encoded PNG image.
    """
    plt.figure(figsize=(8, 6))
    pos = nx.spring_layout(G)  # Positions for the nodes

    # Draw nodes
    nx.draw_networkx_nodes(G, pos, node_size=700, node_color='lightblue')

    # Filter edges to include only the original edges
    edges_to_draw = [(u, v) for u, v in original_edges if G.has_edge(u, v)]

    # Draw edges
    nx.draw_networkx_edges(
        G,
        pos,
        edgelist=edges_to_draw,
        arrowstyle='->',
        arrowsize=20,
        edge_color='blue',
        connectionstyle="arc3"
    )

    # Add labels for nodes and edges
    nx.draw_networkx_labels(G, pos, font_size=12, font_color='black')
    edge_labels = {(u, v): f"{G[u][v]['flow']}/{G[u][v]['capacity']}" for u, v in edges_to_draw}
    nx.draw_networkx_edge_labels(G, pos, edge_labels=edge_labels, font_size=10)

    # Save the graph to a BytesIO buffer
    buf = io.BytesIO()
    plt.savefig(buf, format="png")
    buf.seek(0)
    graph_image = base64.b64encode(buf.read()).decode('utf-8')
    buf.close()
    plt.close()
    return graph_image



@app.route('/calculate-max-flow', methods=['POST'])
def calculate_max_flow():
    """
    API endpoint to calculate max flow and return results.
    """
    data = request.json
    nodes = data.get("nodes", [])
    edges = data.get("edges", [])
    source = data.get("source")
    sink = data.get("sink")

    if not nodes or not edges or not source or not sink:
        return jsonify({'error': 'Invalid input data'}), 400

    G = construire_graphe(data)

    # Run Ford-Fulkerson algorithm
    max_flow, graph_states = ford_fulkerson(G, source, sink)

    return jsonify({'maxFlow': max_flow, 'graphImages': graph_states})


if __name__ == '__main__':
    app.run(debug=True)
