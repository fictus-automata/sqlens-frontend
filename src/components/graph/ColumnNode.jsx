import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

function ColumnNode({ data }) {
  const { node_name, node_type, columns, onColumnClick, activeColumn, highlightedKeys } = data;

  return (
    <div className="custom-node" style={{ minWidth: '200px' }}>
      <div className="node-header">
        <span className="node-title">{node_name}</span>
        <span className={`badge badge-${node_type}`}>{node_type}</span>
      </div>
      
      {columns && columns.length > 0 && (
        <div className="node-columns">
          {columns.map((col) => {
            const colKey = `${node_name}.${col.name}`;
            const isHighlighted = activeColumn ? (highlightedKeys && highlightedKeys.has(colKey)) : false;
            
            return (
              <div 
                key={col.name} 
                className="node-column"
                style={{ 
                  backgroundColor: isHighlighted ? 'var(--bg-hover)' : 'transparent',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onColumnClick && onColumnClick(`${node_name}.${col.name}`);
                }}
              >
                {/* Left Handle (Input) */}
                <Handle
                  type="target"
                  position={Position.Left}
                  id={col.name}
                  className="column-handle"
                />
                
                <span className="node-column-name">{col.name}</span>
                {col.data_type && (
                  <span className="node-column-type">{col.data_type}</span>
                )}
                
                {/* Right Handle (Output) */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id={col.name}
                  className="column-handle"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default memo(ColumnNode);
