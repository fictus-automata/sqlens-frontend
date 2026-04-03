import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { LineageGraph } from '../components/graph/LineageGraph';

export function LineagePage() {
  const [sourceName, setSourceName] = useState('');

  // Fetch distinct sources for filter
  const { data: sourcesData } = useQuery({
    queryKey: ['sources'],
    queryFn: api.getSchemaSources,
  });

  // Fetch graph data
  const { 
    data: graphData, 
    isLoading, 
    isError,
    error 
  } = useQuery({
    queryKey: ['globalGraph', sourceName],
    queryFn: () => api.getGlobalGraph(sourceName || undefined),
  });

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header bar */}
      <div style={{ padding: 'var(--space-md) var(--space-xl)', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title" style={{ fontSize: '1.25rem', margin: 0 }}>Global Lineage Graph</h1>
        
        <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
          <label style={{ margin: 0 }}>Filter Source:</label>
          <select 
            className="input" 
            style={{ width: '200px', padding: '4px 8px' }}
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
          >
            <option value="">All Sources</option>
            {sourcesData?.sources?.map((src) => (
              <option key={src} value={src}>{src}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Graph Area */}
      <div style={{ flex: 1, position: 'relative' }}>
        {isLoading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p>Loading graph...</p>
          </div>
        )}
        
        {isError && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-error)' }}>
            <p>Error loading graph: {error?.message}</p>
          </div>
        )}
        
        {!isLoading && !isError && graphData && (
          graphData.nodes.length === 0 ? (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <p>No lineage graph data available yet.</p>
            </div>
          ) : (
            <LineageGraph graphData={graphData} />
          )
        )}
      </div>
    </div>
  );
}

