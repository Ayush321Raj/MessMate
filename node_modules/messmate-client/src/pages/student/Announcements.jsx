import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/announcements')
      .then(({ data }) => setAnnouncements(data.announcements || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-lg font-bold text-gray-900">Mess Updates</h1>
        <p className="text-sm text-gray-500">Menus, events, and sustainability updates</p>
      </header>
      {loading ? <div className="card animate-pulse h-24 bg-gray-100" /> : announcements.length === 0 ? (
        <div className="card text-center py-10 text-sm text-gray-500">No updates have been published.</div>
      ) : announcements.map((announcement) => (
        <article className="card" key={announcement._id}>
          <p className="text-xs font-semibold uppercase text-brand-700">{announcement.type}</p>
          <h2 className="mt-1 font-semibold text-gray-900">{announcement.title}</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{announcement.message}</p>
          <p className="mt-3 text-xs text-gray-400">{new Date(announcement.publishedAt).toLocaleDateString()}</p>
        </article>
      ))}
    </div>
  );
}