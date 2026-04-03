import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

function TableNode({ data }) {
  const { node_name, node_type, isHighlighted } = data;

  return (
    <div 
      className={`custom-node ${isHighlighted ? 'selected' : ''}`}
      style={{ minWidth: '150px' }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      
      <div className="node-header" style={{ borderBottom: 'none' }}>
        <span className="node-title">{node_name}</span>
        <span className={`badge badge-${node_type}`}>{node_type}</span>
      </div>
      
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}

export default memo(TableNode);
