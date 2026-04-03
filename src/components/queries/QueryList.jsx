import { useNavigate } from 'react-router-dom';

export function QueryList({ queries }) {
  const navigate = useNavigate();

  if (!queries || queries.length === 0) {
    return (
      <div className="card" style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
        No queries found. Submit a new query to get started!
      </div>
    );
  }

  return (
    <div className="card">
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Source</th>
            <th>Status</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {queries.map((q) => (
            <tr 
              key={q.id} 
              onClick={() => navigate(`/queries/${q.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <td>
                <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                  {q.query_name || 'Unnamed Query'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {q.id.split('-')[0]}...
                </div>
              </td>
              <td>{q.source_name || '-'}</td>
              <td>
                <span className={`badge badge-${q.lineage_status || 'default'}`}>
                  {q.lineage_status}
                </span>
              </td>
              <td>{new Date(q.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
