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
  
  // Transform Nodes
  const initialNodes = apiData.nodes.map((node) => {
    // Strip type prefix if present
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
        isHighlighted: activeColumn && activeColumn.startsWith(`${rawName}.`)
      },
      position: { x: 0, y: 0 }, // Will be set by layout
    };
  });

  // Transform Edges
  let initialEdges = [];
  
  if (isColumnMode) {
    initialEdges = apiData.edges.map((edge) => {
      // Determine if this edge is active based on clicked column
      const sourceKey = edge.source_column ? `${edge.source_node_id.split('::').pop()}.${edge.source_column}` : null;
      const targetKey = edge.target_column ? `${edge.target_node_id.split('::').pop()}.${edge.target_column}` : null;
      
      let isDimmed = false;
      let isHighlighted = false;
      
      if (activeColumn) {
        if (sourceKey === activeColumn || targetKey === activeColumn) {
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
        initialEdges.push({
          id: simpleId,
          source: edge.source_node_id,
          target: edge.target_node_id,
          type: 'default',
          animated: false,
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
