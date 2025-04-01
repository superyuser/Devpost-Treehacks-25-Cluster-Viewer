import { GraphData, GraphLink, GraphNode } from "./types";

export function getRandomProjectCluster(graph: GraphData) {
    const project = getRandomProjectNode(graph);
    const cluster = getClusterSubgraph(project, graph);
    // console.log("Cluster nodes", cluster.nodes, "nodes,", cluster.links.length, "links");
    console.log("Tick node positions:", cluster.nodes.map(n => [n.id, n.x, n.y]));

    return cluster;
}


export function getRandomProjectNode(graph: GraphData) {
    const validNodes = graph.nodes.filter(node => node.url !== null);
    const randIndex = Math.floor(Math.random() * validNodes.length);
    
    return validNodes[randIndex];
}


export function getClusterSubgraph(project: GraphNode, graph: GraphData) {
    const subgraph = {
        nodes: [project],
        links: [] as GraphLink[]
    };

    graph.links.forEach(link => {
        if (link.source === project.id && link.target !== project.id) {
            subgraph.links.push(link);
            subgraph.nodes.push(graph.nodes.find(node => node.id === link.target) as GraphNode)
        }
    });

    return subgraph;

}