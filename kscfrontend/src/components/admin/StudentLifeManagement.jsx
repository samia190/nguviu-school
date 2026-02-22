import { useState, useEffect } from 'react';
import { get, post, patch, del } from '../../utils/api';
import OptimizedImage from '../OptimizedImage';

export default function StudentLifeManagement({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formItem, setFormItem] = useState({
    title: '',
    description: '',
    category: 'activities',
    imageUrl: '',
    imageAlt: '',
    featured: false,
    displayOrder: 0
  });
  const [editingId, setEditingId] = useState(null);

  const categories = ['sports', 'clubs', 'activities', 'traditions'];

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    try {
      setLoading(true);
      const data = await get('/api/student-life');
      setItems(Array.isArray(data) ? data : data.items || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch student life items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (!formItem.title || !formItem.imageUrl) {
        setError('Title and image URL are required');
        return;
      }

      if (editingId) {
        await patch(`/api/student-life/${editingId}`, formItem);
        setItems(items.map(i => i._id === editingId ? { ...i, ...formItem } : i));
      } else {
        const newItem = await post('/api/student-life', formItem);
        setItems([...items, newItem]);
      }

      setFormItem({
        title: '',
        description: '',
        category: 'activities',
        imageUrl: '',
        imageAlt: '',
        featured: false,
        displayOrder: 0
      });
      setEditingId(null);
      setError('');
    } catch (err) {
      setError('Failed to save student life item');
      console.error(err);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this item?')) return;
    try {
      await del(`/api/student-life/${id}`);
      setItems(items.filter(i => i._id !== id));
    } catch (err) {
      setError('Failed to delete item');
    }
  }

  function handleEdit(item) {
    setFormItem(item);
    setEditingId(item._id);
  }

  if (loading) return <div style={{ padding: '20px' }}>Loading student life items...</div>;

  return (
    <div style={{ padding: '20px', background: '#fafafa', borderRadius: '8px' }}>
      <h2>🎓 Student Life Management</h2>

      {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ background: 'white', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e0e0e0' }}>
        <div style={{ marginBottom: '12px' }}>
          <label>Title *</label>
          <input
            type="text"
            value={formItem.title}
            onChange={(e) => setFormItem({ ...formItem, title: e.target.value })}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            placeholder="e.g., Sports Day 2026"
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Description</label>
          <textarea
            value={formItem.description}
            onChange={(e) => setFormItem({ ...formItem, description: e.target.value })}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '80px' }}
            placeholder="Item details..."
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Category</label>
          <select
            value={formItem.category}
            onChange={(e) => setFormItem({ ...formItem, category: e.target.value })}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Image URL *</label>
          <input
            type="text"
            value={formItem.imageUrl}
            onChange={(e) => setFormItem({ ...formItem, imageUrl: e.target.value })}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            placeholder="/images/student-activity.jpg"
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Image Alt Text</label>
          <input
            type="text"
            value={formItem.imageAlt}
            onChange={(e) => setFormItem({ ...formItem, imageAlt: e.target.value })}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            placeholder="Image description"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={formItem.featured}
              onChange={(e) => setFormItem({ ...formItem, featured: e.target.checked })}
            />
            Featured Item
          </label>
          <div>
            <label>Display Order</label>
            <input
              type="number"
              value={formItem.displayOrder}
              onChange={(e) => setFormItem({ ...formItem, displayOrder: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
        </div>

        <button
          type="submit"
          style={{
            background: editingId ? '#ffa500' : '#667eea',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          {editingId ? '✏️ Update Item' : '➕ Add Item'}
        </button>

        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setFormItem({
                title: '',
                description: '',
                category: 'activities',
                imageUrl: '',
                imageAlt: '',
                featured: false,
                displayOrder: 0
              });
            }}
            style={{ background: '#999', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}
          >
            Cancel
          </button>
        )}
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
        {items.map((item) => (
          <div key={item._id} style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {item.imageUrl && (
              <div style={{ width: '100%', height: '160px', overflow: 'hidden', background: '#f0f0f0' }}>
                <OptimizedImage
                  src={item.imageUrl}
                  alt={item.imageAlt}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}
            <div style={{ padding: '12px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{item.title}</h3>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', background: '#f0f0f0', padding: '4px 8px', borderRadius: '3px', display: 'inline-block' }}>
                🏷️ {item.category}
              </p>
              {item.featured && <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#667eea', fontWeight: 'bold' }}>⭐ Featured</p>}
              {item.description && <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666', lineHeight: '1.4' }}>{item.description.substring(0, 60)}...</p>}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleEdit(item)}
                  style={{ flex: 1, background: '#ffa500', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item._id)}
                  style={{ flex: 1, background: '#e74c3c', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>No student life items yet. Create one above!</p>}
    </div>
  );
}
