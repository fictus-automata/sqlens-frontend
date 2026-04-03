import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Trash2, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '../../api/client';

function SchemaRow({ table, deleteMutation }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch full details (including columns) using api.getSchema when expanded
  const { data: fullSchema, isLoading, isError } = useQuery({
    queryKey: ['schema', table.id],
    queryFn: () => api.getSchema(table.id),
    enabled: isExpanded,
  });

  return (
    <div style={{ borderBottom: '1px solid var(--border-light)' }}>
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
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span style={{ fontWeight: 600 }}>{table.table_name}</span>
          <span className="badge badge-source">{table.column_count || 0} cols</span>
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
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading columns...
            </div>
          ) : isError ? (
            <div style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>Failed to load schema details.</div>
          ) : (
            <table className="data-table" style={{ fontSize: '0.75rem' }}>
              <thead>
                <tr>
                  <th>Column Name</th>
                  <th>Data Type</th>
                  <th>Nullable</th>
                </tr>
              </thead>
              <tbody>
                {fullSchema?.columns?.map(col => (
                  <tr key={col.column_name}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{col.column_name}</td>
                    <td>{col.data_type || '-'}</td>
                    <td>{col.is_nullable ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
                {(!fullSchema?.columns || fullSchema.columns.length === 0) && (
                  <tr><td colSpan="3" style={{ textAlign: 'center' }}>No columns</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export function SchemaList({ schemas }) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteSchema(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['schemas']);
      queryClient.invalidateQueries(['sources']);
    },
  });

  const schemaItems = Array.isArray(schemas) ? schemas : (schemas?.items || []);

  if (!schemaItems || schemaItems.length === 0) {
    return (
      <div className="card" style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
        No schemas registered. Add one to disambiguate column lineage!
      </div>
    );
  }

  // Group by source_name
  const grouped = schemaItems.reduce((acc, schema) => {
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
            {tables.map((table) => (
              <SchemaRow key={table.id} table={table} deleteMutation={deleteMutation} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
