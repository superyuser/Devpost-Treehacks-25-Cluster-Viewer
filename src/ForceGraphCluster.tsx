import { useEffect, useRef } from "react";
import { getRandomProjectCluster } from "./clusterUtils";
import { GraphData, GraphLink, GraphNode } from "./types";
import * as d3 from "d3";

const width = window.innerWidth;
const height = window.innerHeight;

export default function ForceGraphCluster() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    fetch('/nodesAndEdges.json')
      .then(res => res.json())
      .then((fullGraph: GraphData) => {
        const selectedProjects: GraphNode[] = [];
        const combinedCluster: GraphData = { nodes: [], links: [] };

        let clusterId = 1;
        while (selectedProjects.length < 3) {
          const cluster = getRandomProjectCluster(fullGraph);
          const centerNode = cluster.nodes[0];

          if (!selectedProjects.find(n => n.id === centerNode.id)) {
            selectedProjects.push(centerNode);
            cluster.nodes.forEach(n => (n as any).clusterId = clusterId);
            combinedCluster.nodes.push(...cluster.nodes);
            combinedCluster.links.push(...cluster.links);
            clusterId++;
          }
        }

        if (svgRef.current) {
          renderClusterGraph(combinedCluster, svgRef.current, selectedProjects.map(n => n.id));
        }
      });
  }, []);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ background: '#222' }}
    />
  );
}

// ------------------ Helpers ------------------ //

function renderClusterGraph(cluster: GraphData, svgElem: SVGSVGElement, projectIds: string[]) {
  const svg = d3.select(svgElem);
  svg.selectAll('*').remove();

  const resolvedLinks = resolveLinkNodes(cluster);

  const simulation = d3.forceSimulation(cluster.nodes)
    .force("charge", d3.forceManyBody<GraphNode>().strength(d => (d as any).clusterId ? -3000 : -1200))
    .force("collide", d3.forceCollide<GraphNode>().radius(d => projectIds.includes(d.id) ? 100 : 60).strength(1))
    .force("link", d3.forceLink(resolvedLinks).id(d => d.id).distance(200))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX(width / 2))
    .force("y", d3.forceY(height / 2))
    .alpha(0.2)
    .alphaDecay(0.02)
    .velocityDecay(0.6)
    .on("tick", () => {
      svg.selectAll(".node")
        .attr("cx", d => d.x = Math.max(60, Math.min(width - 60, d.x!)))
        .attr("cy", d => d.y = Math.max(60, Math.min(height - 60, d.y!)));

      svg.selectAll(".link")
        .attr("x1", d => (d.source as GraphNode).x!)
        .attr("y1", d => (d.source as GraphNode).y!)
        .attr("x2", d => (d.target as GraphNode).x!)
        .attr("y2", d => (d.target as GraphNode).y!);

      svg.selectAll(".label")
        .attr("x", d => d.x = Math.max(60, Math.min(width - 60, d.x!)))
        .attr("y", d => d.y = Math.max(60, Math.min(height - 60, d.y!)));
    });

  svg.append('g')
    .selectAll('line')
    .data(resolvedLinks)
    .enter()
    .append('line')
    .attr('class', 'link')
    .attr('stroke', '#999')
    .attr('stroke-width', 1);

  svg.append('g')
    .selectAll('circle')
    .data(cluster.nodes)
    .enter()
    .append('circle')
    .attr('class', 'node')
    .attr('r', d => projectIds.includes(d.id) ? 100 : 60)
    .attr('fill', d => projectIds.includes(d.id) ? '#CB1DCD' : '#440BD4')
    .style('filter', d => projectIds.includes(d.id) ? 'drop-shadow(0 0 10px #FF10F0)' : 'drop-shadow(0 0 6px rgba(30,144,255, 0.8))')
    .call(applyDrag(simulation))
    .on('click', (event, d) => {
      if (projectIds.includes(d.id) && d.url) {
        window.open(d.url, '_blank');
      }
    });

  svg.append('g')
    .selectAll('text')
    .data(cluster.nodes)
    .enter()
    .append('text')
    .attr('class', 'label')
    .attr('text-anchor', 'middle')
    .attr('dy', 4)
    .style('font-weight', d => projectIds.includes(d.id) ? 'bold' : 'normal')
    .style('font-family', 'Playfair Display, serif')
    .style('font-size', d => projectIds.includes(d.id) ? '22px' : '20px')
    .attr('fill', 'white')
    .text(d => d.id);
}

function resolveLinkNodes(cluster: GraphData): GraphLink[] {
  return cluster.links.map(link => ({
    source: cluster.nodes.find(n => n.id === (link.source as string))!,
    target: cluster.nodes.find(n => n.id === (link.target as string))!
  }));
}

function applyDrag(simulation: d3.Simulation<GraphNode, GraphLink>) {
  return d3.drag<SVGCircleElement, GraphNode>()
    .on('start', (event, d) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    })
    .on('drag', (event, d) => {
      d.fx = event.x;
      d.fy = event.y;
    })
    .on('end', (event, d) => {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    });
}
