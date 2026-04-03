import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { api } from '../../api/client';

export function SchemaList({ schemas }) {
  const queryClient = useQueryClient();
  const [expandedTables, setExpandedTables] = useState(new Set());

  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteSchema(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['schemas']);
      queryClient.invalidateQueries(['sources']);
    },
  });

  const toggleTable = (id) => {
    const newSet = new Set(expandedTables);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedTables(newSet);
  };

  if (!schemas || schemas.length === 0) {
    return (
      <div className="card" style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
        No schemas registered. Add one to disambiguate column lineage!
      </div>
    );
  }

  // Group by source_name
  const grouped = schemas.reduce((acc, schema) => {
    const source = schema.source_name || 'No Source';
    if (!acc[source]) acc[source] = [];
    acc[source].push(schema);
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {Object.entries(grouped).map(([source, tables]) => (
        <div key={source} className="card">
          <div className="card-header" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
            <span style={{ color: 'var(--color-source)' }}>Source: {source}</span>
          </div>
          
          <div>
            {tables.map((table) => {
              const isExpanded = expandedTables.has(table.id);
              return (
                <div key={table.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  {/* Table Row */}
                  <div 
                    style={{ 
                      padding: 'var(--space-sm) var(--space-md)', 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      backgroundColor: isExpanded ? 'var(--bg-primary)' : 'transparent'
                    }}
                    onClick={() => toggleTable(table.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <span style={{ fontWeight: 600 }}>{table.table_name}</span>
                      <span className="badge badge-source">{table.columns?.length || 0} cols</span>
                    </div>
                    
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '4px', border: 'none', color: 'var(--color-error)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this schema?')) {
                          deleteMutation.mutate(table.id);
                        }
                      }}
                      title="Delete Schema"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Expanded Columns */}
                  {isExpanded && (
                    <div style={{ padding: 'var(--space-md)', backgroundColor: 'var(--bg-card)' }}>
                      <table className="data-table" style={{ fontSize: '0.75rem' }}>
                        <thead>
                          <tr>
                            <th>Pos</th>
                            <th>Column Name</th>
                            <th>Data Type</th>
                            <th>Nullable</th>
                          </tr>
                        </thead>
                        <tbody>
                          {table.columns?.map(col => (
                            <tr key={col.id}>
                              <td>{col.ordinal_position}</td>
                              <td style={{ fontFamily: 'var(--font-mono)' }}>{col.column_name}</td>
                              <td>{col.data_type || '-'}</td>
                              <td>{col.is_nullable ? 'Yes' : 'No'}</td>
                            </tr>
                          ))}
                          {(!table.columns || table.columns.length === 0) && (
                            <tr><td colSpan="4" style={{ textAlign: 'center' }}>No columns</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
