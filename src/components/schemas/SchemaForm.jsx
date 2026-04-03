import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../../api/client';

export function SchemaForm({ onClose }) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    table_name: '',
    source_name: '',
    columns: [{ column_name: '', data_type: 'VARCHAR', ordinal_position: 1, is_nullable: true }]
  });

  const mutation = useMutation({
    mutationFn: (data) => api.createSchema(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['schemas']);
      queryClient.invalidateQueries(['sources']);
      if (onClose) onClose();
    },
  });

  const addColumn = () => {
    setFormData(prev => ({
      ...prev,
      columns: [
        ...prev.columns,
        { 
          column_name: '', 
          data_type: 'VARCHAR', 
          ordinal_position: prev.columns.length + 1, 
          is_nullable: true 
        }
      ]
    }));
  };

  const updateColumn = (index, field, value) => {
    const newCols = [...formData.columns];
    newCols[index][field] = value;
    setFormData({ ...formData, columns: newCols });
  };

  const removeColumn = (index) => {
    const newCols = formData.columns.filter((_, i) => i !== index);
    // Re-adjust ordinals
    newCols.forEach((col, i) => { col.ordinal_position = i + 1; });
    setFormData({ ...formData, columns: newCols });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.table_name) return;
    
    mutation.mutate({
      ...formData,
      source_name: formData.source_name || null,
      columns: formData.columns.filter(c => c.column_name.trim() !== '')
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Register Schema</h2>
          <button className="btn btn-outline" style={{ padding: '2px 8px' }} onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <div style={{ flex: 1 }}>
                <label>Table Name (required)</label>
                <input 
                  className="input"
                  required
                  autoFocus
                  value={formData.table_name}
                  onChange={(e) => setFormData({...formData, table_name: e.target.value})}
                  placeholder="e.g. orders"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label>Source Name (recommended)</label>
                <input 
                  className="input"
                  value={formData.source_name}
                  onChange={(e) => setFormData({...formData, source_name: e.target.value})}
                  placeholder="e.g. postgres_prod"
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                <label style={{ margin: 0 }}>Columns</label>
                <button type="button" className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={addColumn}>
                  <Plus size={14} /> Add
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {formData.columns.map((col, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                    <span style={{ width: '20px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{col.ordinal_position}.</span>
                    <input 
                      className="input"
                      placeholder="Column name"
                      value={col.column_name}
                      onChange={(e) => updateColumn(idx, 'column_name', e.target.value)}
                      style={{ flex: 2 }}
                      required
                    />
                    <input 
                      className="input"
                      placeholder="Type (e.g. VARCHAR)"
                      value={col.data_type}
                      onChange={(e) => updateColumn(idx, 'data_type', e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: 0, fontSize: '0.75rem' }}>
                      <input 
                        type="checkbox"
                        checked={col.is_nullable}
                        onChange={(e) => updateColumn(idx, 'is_nullable', e.target.checked)}
                      /> Null
                    </label>
                    <button 
                      type="button" 
                      className="btn btn-outline" 
                      style={{ padding: '4px', color: 'var(--color-error)', border: 'none' }}
                      onClick={() => removeColumn(idx)}
                      disabled={formData.columns.length === 1}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={mutation.isPending || !formData.table_name || formData.columns.every(c => !c.column_name)}
            >
              {mutation.isPending ? 'Saving...' : 'Save Schema'}
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
