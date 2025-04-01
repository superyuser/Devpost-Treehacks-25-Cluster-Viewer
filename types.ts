export interface GraphNode {
    id: string;
    tools?: string[];
}

export interface GraphLink {
    source: string | GraphNode,
    target: string | GraphNode
}

export interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}