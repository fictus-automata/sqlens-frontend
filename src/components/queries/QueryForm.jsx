import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';

export function QueryForm({ onClose }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    query_name: '',
    query_text: '',
    user_id: 'default_user',
    source_name: '',
  });

  const mutation = useMutation({
    mutationFn: (data) => api.createQuery(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['queries']);
      queryClient.invalidateQueries(['globalGraph']);
      if (onClose) onClose();
      navigate(`/queries/${data.id}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.query_name || !formData.query_text) return;
    
    mutation.mutate({
      ...formData,
      source_name: formData.source_name || undefined,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>New Query</h2>
          <button className="btn btn-outline" style={{ padding: '2px 8px' }} onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div>
              <label>Query Name (required)</label>
              <input 
                className="input"
                autoFocus
                required
                value={formData.query_name}
                onChange={(e) => setFormData({...formData, query_name: e.target.value})}
                placeholder="e.g. active_users_summary"
              />
            </div>
            
            <div>
              <label>Source Name (optional)</label>
              <input 
                className="input"
                value={formData.source_name}
                onChange={(e) => setFormData({...formData, source_name: e.target.value})}
                placeholder="Matches a schema registry source for disambiguation"
              />
            </div>
            
            <div>
              <label>SQL Query Text (required)</label>
              <textarea 
                className="input"
                required
                value={formData.query_text}
                onChange={(e) => setFormData({...formData, query_text: e.target.value})}
                placeholder="SELECT * FROM table..."
                style={{ height: '150px' }}
              />
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={mutation.isPending || !formData.query_name || !formData.query_text}
            >
              {mutation.isPending ? 'Submitting...' : 'Analyze Lineage'}
            </button>
          </div>
        </form>
        
        {mutation.isError && (
          <div style={{ padding: 'var(--space-md)', color: 'var(--color-error)' }}>
            Error: {mutation.error?.message}
          </div>
        )}
      </div>
    </div>
  );
}
