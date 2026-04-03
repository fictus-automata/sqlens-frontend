import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '../../styles/graph.css';
import ColumnNode from './ColumnNode';
import TableNode from './TableNode';
import { transformGraphData, getLayoutedElements } from './graphUtils';

const nodeTypes = {
  columnNode: ColumnNode,
  tableNode: TableNode,
};

export function LineageGraph({ graphData }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const [viewMode, setViewMode] = useState('column'); // 'column' | 'table'
  const [activeColumn, setActiveColumn] = useState(null);

  const onColumnClick = useCallback((colId) => {
    // Toggle active column highlighting
    setActiveColumn((prev) => (prev === colId ? null : colId));
  }, []);

  // Sync data whenever graphData, viewMode, or activeColumn changes
  useEffect(() => {
    if (!graphData) return;

    // 1. Transform raw API data into raw nodes/edges based on mode & selection
    const { initialNodes, initialEdges } = transformGraphData(
      graphData,
      viewMode,
      onColumnClick,
      activeColumn
    );

    // 2. Apply Dagre layout to calculate positions
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges,
      viewMode
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [graphData, viewMode, activeColumn, onColumnClick, setNodes, setEdges]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Panel position="top-left" className="graph-toolbar">
        <select 
          className="input" 
          value={viewMode}
          onChange={(e) => {
            setViewMode(e.target.value);
            setActiveColumn(null); // Reset highlights on mode switch
          }}
          style={{ width: 'auto', padding: '4px 8px' }}
        >
          <option value="column">Column-level View</option>
          <option value="table">Table-level View</option>
        </select>
        
        {activeColumn && (
          <button 
            className="btn btn-outline" 
            onClick={() => setActiveColumn(null)}
            style={{ padding: '4px 8px' }}
          >
            Clear Highlight
          </button>
        )}
      </Panel>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={1.5}
      >
        <Background color="#ccc" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
