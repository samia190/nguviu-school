import { useState, useEffect } from 'react';
import { get, post, patch, del } from '../../utils/api';
import EditableText from '../EditableText';
import OptimizedImage from '../OptimizedImage';

export default function EventsManagement({ user }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formevent, setFormEvent] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    imageUrl: '',
    imageAlt: '',
    featured: false,
    displayOrder: 0
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      setLoading(true);
      const data = await get('/api/events?active=true');
      setEvents(Array.isArray(data) ? data : data.events || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch events');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      // Validation
      if (!formevent.title || !formevent.title.trim()) {
        setError('Title is required');
        return;
      }
      if (formevent.title.length > 255) {
        setError('Title must be 255 characters or less');
        return;
      }

      if (!formevent.imageUrl || !formevent.imageUrl.trim()) {
        setError('Image URL is required');
        return;
      }

      // Validate image URL format
      try {
        new URL(formevent.imageUrl);
      } catch {
        setError('Image URL must be a valid URL (e.g., https://example.com/image.jpg)');
        return;
      }

      if (formevent.description.length > 2000) {
        setError('Description must be 2000 characters or less');
        return;
      }

      if (formevent.location.length > 500) {
        setError('Location must be 500 characters or less');
        return;
      }

      if (formevent.imageAlt.length > 255) {
        setError('Image alt text must be 255 characters or less');
        return;
      }

      if (formevent.displayOrder < 0 || formevent.displayOrder > 9999) {
        setError('Display order must be between 0 and 9999');
        return;
      }

      // Validate date if provided
      if (formevent.date) {
        const eventDate = new Date(formevent.date);
        if (isNaN(eventDate.getTime())) {
          setError('Invalid date format');
          return;
        }
      }

      if (editingId) {
        await patch(`/api/events/${editingId}`, formevent);
        setEvents(events.map(e => e._id === editingId ? { ...e, ...formevent } : e));
      } else {
        const newEvent = await post('/api/events', formevent);
        setEvents([...events, newEvent]);
      }

      setFormEvent({
        title: '',
        description: '',
        date: '',
        location: '',
        imageUrl: '',
        imageAlt: '',
        featured: false,
        displayOrder: 0
      });
      setEditingId(null);
      setError('');
    } catch (err) {
      setError('Failed to save event: ' + (err?.message || 'Unknown error'));
      console.error(err);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this event?')) return;
    try {
      await del(`/api/events/${id}`);
      setEvents(events.filter(e => e._id !== id));
    } catch (err) {
      setError('Failed to delete event');
    }
  }

  function handleEdit(event) {
    setFormEvent(event);
    setEditingId(event._id);
  }

  if (loading) return <div style={{ padding: '20px' }}>Loading events...</div>;

  return (
    <div style={{ padding: '20px', background: '#fafafa', borderRadius: '8px' }}>
      <h2>📅 Events Management</h2>

      {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ background: 'white', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e0e0e0' }}>
        <div style={{ marginBottom: '12px' }}>
          <label>Event Title *</label>
          <input
            type="text"
            value={formevent.title}
            onChange={(e) => setFormEvent({ ...formevent, title: e.target.value })}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            placeholder="e.g., Science Fair 2026"
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Description</label>
          <textarea
            value={formevent.description}
            onChange={(e) => setFormEvent({ ...formevent, description: e.target.value })}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '80px' }}
            placeholder="Event details..."
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label>Date</label>
            <input
              type="datetime-local"
              value={formevent.date}
              onChange={(e) => setFormEvent({ ...formevent, date: e.target.value })}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <div>
            <label>Location</label>
            <input
              type="text"
              value={formevent.location}
              onChange={(e) => setFormEvent({ ...formevent, location: e.target.value })}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              placeholder="Event location"
            />
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Image URL *</label>
          <input
            type="text"
            value={formevent.imageUrl}
            onChange={(e) => setFormEvent({ ...formevent, imageUrl: e.target.value })}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            placeholder="/images/event.jpg"
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Image Alt Text</label>
          <input
            type="text"
            value={formevent.imageAlt}
            onChange={(e) => setFormEvent({ ...formevent, imageAlt: e.target.value })}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            placeholder="Image description"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={formevent.featured}
              onChange={(e) => setFormEvent({ ...formevent, featured: e.target.checked })}
            />
            Featured Event
          </label>
          <div>
            <label>Display Order</label>
            <input
              type="number"
              value={formevent.displayOrder}
              onChange={(e) => setFormEvent({ ...formevent, displayOrder: parseInt(e.target.value) })}
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
          {editingId ? '✏️ Update Event' : '➕ Add Event'}
        </button>

        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setFormEvent({
                title: '',
                description: '',
                date: '',
                location: '',
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
        {events.map((event) => (
          <div key={event._id} style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {event.imageUrl && (
              <div style={{ width: '100%', height: '160px', overflow: 'hidden', background: '#f0f0f0' }}>
                <OptimizedImage
                  src={event.imageUrl}
                  alt={event.imageAlt}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}
            <div style={{ padding: '12px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{event.title}</h3>
              {event.date && <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>📅 {new Date(event.date).toLocaleDateString()}</p>}
              {event.location && <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>📍 {event.location}</p>}
              {event.featured && <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#667eea', fontWeight: 'bold' }}>⭐ Featured</p>}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleEdit(event)}
                  style={{ flex: 1, background: '#ffa500', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(event._id)}
                  style={{ flex: 1, background: '#e74c3c', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>No events yet. Create one above!</p>}
    </div>
  );
}
