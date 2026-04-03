import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { api } from '../api/client';
import { LineageGraph } from '../components/graph/LineageGraph';

export function QueryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: queryData, isLoading: queryLoading } = useQuery({
    queryKey: ['query', id],
    queryFn: () => api.getQuery(id),
  });

  const { data: graphData, isLoading: graphLoading, isError: graphError } = useQuery({
    queryKey: ['queryGraph', id],
    queryFn: () => api.getQueryGraph(id),
  });

  if (queryLoading) {
    return <div className="page-container"><p>Loading query details...</p></div>;
  }

  if (!queryData) {
    return <div className="page-container"><p>Query not found.</p></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: 'var(--space-md) var(--space-xl)', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => navigate('/queries')}>
          <ArrowLeft size={16} /> Back
        </button>
        <h1 style={{ fontSize: '1.25rem', margin: 0 }}>
          {queryData.query_name || 'Unnamed Query'}
        </h1>
        <span className={`badge badge-${queryData.lineage_status}`}>
          {queryData.lineage_status}
        </span>
      </div>

      {/* Split Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Panel: Query Metadata */}
        <div style={{ width: '400px', borderRight: '1px solid var(--border-light)', padding: 'var(--space-md)', overflowY: 'auto', backgroundColor: 'var(--bg-card)' }}>
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <label>Source Name</label>
            <div>{queryData.source_name || 'None'}</div>
          </div>
          
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <label>Created At</label>
            <div>{new Date(queryData.created_at).toLocaleString()}</div>
          </div>

          <div>
            <label>SQL Text</label>
            <pre className="code-block">
              {queryData.query_text}
            </pre>
          </div>
        </div>

        {/* Right Panel: Graph */}
        <div style={{ flex: 1, position: 'relative' }}>
          {graphLoading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p>Loading graph...</p>
            </div>
          )}
          
          {graphError && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-error)' }}>
              <p>Failed to load lineage graph for this query.</p>
            </div>
          )}
          
          {!graphLoading && !graphError && graphData && (
            <LineageGraph graphData={graphData} />
          )}
        </div>
      </div>
    </div>
  );
}

