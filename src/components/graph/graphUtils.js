import dagre from 'dagre';
import { NODE_TYPES } from '../../utils/constants';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

// Widths for nodes based on mode
const NODE_WIDTH_REST = 250;
const NODE_WIDTH_COMPACT = 180;
const NODE_HEIGHT_PX_PER_COL = 30;
const NODE_HEADER_HEIGHT = 50;

/**
 * Transforms API response into React Flow elements
 */
export function transformGraphData(apiData, mode = 'column', onColumnClick, activeColumn) {
  if (!apiData || !apiData.nodes) return { initialNodes: [], initialEdges: [] };

  const isColumnMode = mode === 'column';
  
  // Build the set of all highlighted column keys by traversing the full lineage chain
  const highlightedKeys = new Set();
  const highlightedNodes = new Set();

  if (activeColumn) {
    // Build adjacency maps: target→sources (upstream) and source→targets (downstream)
    const upstreamMap = new Map();
    const downstreamMap = new Map();

    for (const edge of apiData.edges) {
      const sKey = edge.source_column ? `${edge.source_node_id.split('::').pop()}.${edge.source_column}` : null;
      const tKey = edge.target_column ? `${edge.target_node_id.split('::').pop()}.${edge.target_column}` : null;
      
      if (!isColumnMode) {
         // In table mode, we just want to highlight the paths between nodes
         const sNode = edge.source_node_id.split('::').pop();
         const tNode = edge.target_node_id.split('::').pop();
         
         if (!upstreamMap.has(tNode)) upstreamMap.set(tNode, []);
         upstreamMap.get(tNode).push(sNode);

         if (!downstreamMap.has(sNode)) downstreamMap.set(sNode, []);
         downstreamMap.get(sNode).push(tNode);
      } else {
         if (!sKey || !tKey) continue;
         if (!upstreamMap.has(tKey)) upstreamMap.set(tKey, []);
         upstreamMap.get(tKey).push(sKey);

         if (!downstreamMap.has(sKey)) downstreamMap.set(sKey, []);
         downstreamMap.get(sKey).push(tKey);
      }
    }

    const startKey = isColumnMode ? activeColumn : activeColumn.split('.')[0];
    const targetSet = isColumnMode ? highlightedKeys : highlightedNodes;

    // BFS upstream 
    const queue = [startKey];
    targetSet.add(startKey);
    // Add the node name itself to highlightedNodes if we're in column mode
    if (isColumnMode) highlightedNodes.add(startKey.split('.')[0]);
    
    while (queue.length > 0) {
      const current = queue.shift();
      for (const upstream of (upstreamMap.get(current) || [])) {
        if (!targetSet.has(upstream)) {
          targetSet.add(upstream);
          queue.push(upstream);
          if (isColumnMode) highlightedNodes.add(upstream.split('.')[0]);
        }
      }
    }

    // BFS downstream
    const downQueue = [startKey];
    while (downQueue.length > 0) {
      const current = downQueue.shift();
      for (const downstream of (downstreamMap.get(current) || [])) {
        if (!targetSet.has(downstream)) {
          targetSet.add(downstream);
          downQueue.push(downstream);
          if (isColumnMode) highlightedNodes.add(downstream.split('.')[0]);
        }
      }
    }
  }

  // Transform Nodes
  const initialNodes = apiData.nodes.map((node) => {
    const rawName = node.id.includes('::') ? node.id.split('::')[1] : node.id;
    
    return {
      id: node.id,
      type: isColumnMode ? 'columnNode' : 'tableNode',
      data: {
        node_name: rawName,
        node_type: node.node_type,
        columns: node.columns,
        onColumnClick,
        activeColumn,
        highlightedKeys,
        isHighlighted: activeColumn ? highlightedNodes.has(rawName) : false
      },
      position: { x: 0, y: 0 },
    };
  });

  // Transform Edges
  let initialEdges = [];
  
  if (isColumnMode) {
    initialEdges = apiData.edges.map((edge) => {
      const sourceKey = edge.source_column ? `${edge.source_node_id.split('::').pop()}.${edge.source_column}` : null;
      const targetKey = edge.target_column ? `${edge.target_node_id.split('::').pop()}.${edge.target_column}` : null;

      let isDimmed = false;
      let isHighlighted = false;

      if (activeColumn) {
        if (sourceKey && targetKey && highlightedKeys.has(sourceKey) && highlightedKeys.has(targetKey)) {
          isHighlighted = true;
        } else {
          isDimmed = true;
        }
      }

      return {
        id: edge.id,
        source: edge.source_node_id,
        target: edge.target_node_id,
        sourceHandle: edge.source_column,
        targetHandle: edge.target_column,
        type: 'default',
        animated: isHighlighted,
        className: isHighlighted ? 'highlighted' : (isDimmed ? 'dimmed' : ''),
      };
    });
  } else {
    // Table mode - aggregate edges
    const edgeSet = new Set();
    apiData.edges.forEach((edge) => {
      const simpleId = `${edge.source_node_id}->${edge.target_node_id}`;
      if (!edgeSet.has(simpleId)) {
        edgeSet.add(simpleId);
        
        // Highlight entire query tree or just dimmed
        let isDimmed = false;
        let isHighlighted = false;
        if (activeColumn) {
           const sNode = edge.source_node_id.split('::').pop();
           const tNode = edge.target_node_id.split('::').pop();
           if (highlightedNodes.has(sNode) && highlightedNodes.has(tNode)) {
               isHighlighted = true;
           } else {
               isDimmed = true;
           }
        }

        initialEdges.push({
          id: simpleId,
          source: edge.source_node_id,
          target: edge.target_node_id,
          type: 'default',
          animated: isHighlighted,
          className: isHighlighted ? 'highlighted' : (isDimmed ? 'dimmed' : ''),
        });
      }
    });
  }

  return { initialNodes, initialEdges };
}

/**
 * Calculates dagre layout and returns positioned nodes
 */
export function getLayoutedElements(nodes, edges, mode = 'column') {
  const isColumnMode = mode === 'column';
  
  dagreGraph.setGraph({ rankdir: 'LR', align: 'UL', ranker: 'longest-path' });

  nodes.forEach((node) => {
    const height = isColumnMode && node.data.columns
      ? NODE_HEADER_HEIGHT + (node.data.columns.length * NODE_HEIGHT_PX_PER_COL)
      : NODE_HEADER_HEIGHT;
      
    dagreGraph.setNode(node.id, { 
      width: isColumnMode ? NODE_WIDTH_REST : NODE_WIDTH_COMPACT, 
      height 
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return {
    nodes: nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - (isColumnMode ? NODE_WIDTH_REST : NODE_WIDTH_COMPACT) / 2,
          y: nodeWithPosition.y - (isColumnMode && node.data.columns ? (NODE_HEADER_HEIGHT + (node.data.columns.length * NODE_HEIGHT_PX_PER_COL)) : NODE_HEADER_HEIGHT) / 2,
        },
      };
    }),
    edges,
  };
}
