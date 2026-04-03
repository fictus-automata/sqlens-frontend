import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { api } from '../api/client';
import { SchemaList } from '../components/schemas/SchemaList';
import { SchemaForm } from '../components/schemas/SchemaForm';

export function SchemaPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState('');
  
  // Fetch distinct sources for filter
  const { data: sourcesData } = useQuery({
    queryKey: ['sources'],
    queryFn: api.getSchemaSources,
  });

  // Fetch schemas
  const { data: schemas, isLoading, isError, error } = useQuery({
    queryKey: ['schemas', sourceFilter],
    queryFn: () => api.getSchemas(sourceFilter || undefined),
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Schema Registry</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-xs)' }}>
            Register base tables here to improve lineage accuracy.
          </p>
        </div>
        
        <div className="page-actions">
          <select 
            className="input" 
            style={{ width: '150px' }}
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="">All Sources</option>
            {sourcesData?.sources?.map((src) => (
              <option key={src} value={src}>{src}</option>
            ))}
          </select>
          
          <button 
            className="btn btn-primary"
            onClick={() => setIsFormOpen(true)}
          >
            <Plus size={16} /> Register Schema
          </button>
        </div>
      </div>

      {isLoading && <p>Loading schemas...</p>}
      {isError && <p style={{ color: 'var(--color-error)' }}>Error: {error.message}</p>}
      
      {!isLoading && !isError && schemas && (
        <SchemaList schemas={schemas} />
      )}

      {isFormOpen && (
        <SchemaForm onClose={() => setIsFormOpen(false)} />
      )}
    </div>
  );
}

