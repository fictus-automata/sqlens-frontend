import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { api } from '../api/client';
import { QueryList } from '../components/queries/QueryList';
import { QueryForm } from '../components/queries/QueryForm';

export function QueryListPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['queries'],
    queryFn: () => api.getQueries({ limit: 100 }),
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Queries</h1>
        <div className="page-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setIsFormOpen(true)}
          >
            <Plus size={16} /> New Query
          </button>
        </div>
      </div>

      {isLoading && <p>Loading queries...</p>}
      {isError && <p style={{ color: 'var(--color-error)' }}>Error: {error.message}</p>}
      
      {!isLoading && !isError && data && (
        <QueryList queries={data.items} />
      )}

      {isFormOpen && (
        <QueryForm onClose={() => setIsFormOpen(false)} />
      )}
    </div>
  );
}

