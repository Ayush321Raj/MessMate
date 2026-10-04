import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const initialForm = { type: 'menu', title: '', message: '' };

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/announcements')
      .then(({ data }) => setAnnouncements(data.announcements || []))
      .catch(() => toast.error('Could not load announcements'));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/announcements', form);
      setAnnouncements((current) => [data.announcement, ...current]);
      setForm(initialForm);
      toast.success('Announcement published');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not publish announcement');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = (announcement) => {
    downloadAnnouncementCard(announcement);
    toast.success('Share graphic downloaded');
  };

  const handleCopy = async (announcement) => {
    try {
      await navigator.clipboard.writeText(`${announcement.title}\n${announcement.message}\n#MessMate`);
      toast.success('Caption copied');
    } catch {
      toast.error('Clipboard access is unavailable');
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-bold text-gray-900">Social Announcements</h1>
        <p className="text-sm text-gray-500">Publish updates to students and prepare a shareable post.</p>
      </header>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <label>
          <span className="label">Announcement type</span>
          <select className="input" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
            <option value="menu">Menu</option>
            <option value="event">Event</option>
            <option value="impact">Sustainability achievement</option>
          </select>
        </label>
        <label>
          <span className="label">Title</span>
          <input className="input" value={form.title} maxLength={100} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
        </label>
        <label>
          <span className="label">Message</span>
          <textarea className="input min-h-24 resize-y" value={form.message} maxLength={500} onChange={(event) => setForm({ ...form, message: event.target.value })} required />
        </label>
        <button className="btn-primary w-full" type="submit" disabled={saving}>
          {saving ? 'Publishing…' : 'Publish announcement'}
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="font-semibold text-gray-800">Published updates</h2>
        {announcements.length === 0 ? <div className="card text-sm text-gray-500">No announcements yet.</div> : announcements.map((announcement) => (
          <article className="card" key={announcement._id}>
            <p className="text-xs font-semibold uppercase text-brand-700">{announcement.type}</p>
            <h3 className="mt-1 font-semibold text-gray-900">{announcement.title}</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{announcement.message}</p>
            <p className="mt-2 text-xs text-gray-400">{new Date(announcement.publishedAt).toLocaleString()}</p>
            <div className="mt-3 flex gap-2">
              <button className="btn-secondary flex-1 text-sm" onClick={() => handleDownload(announcement)} type="button">Download graphic</button>
              <button className="btn-secondary flex-1 text-sm" onClick={() => handleCopy(announcement)} type="button">Copy caption</button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function downloadAnnouncementCard(announcement) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const context = canvas.getContext('2d');
  context.fillStyle = '#f2f5ed';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#176b43';
  context.fillRect(0, 0, canvas.width, 270);
  context.fillStyle = '#ffffff';
  context.font = '600 32px sans-serif';
  context.fillText('MESSMATE  /  ' + announcement.type.toUpperCase(), 76, 92);
  context.font = '700 64px sans-serif';
  drawWrappedText(context, announcement.title, 76, 170, 900, 76, 2);
  context.fillStyle = '#1f2933';
  context.font = '400 42px sans-serif';
  drawWrappedText(context, announcement.message, 76, 390, 900, 62, 8);
  context.fillStyle = '#176b43';
  context.font = '600 28px sans-serif';
  context.fillText('#MessMate', 76, 995);

  const link = document.createElement('a');
  link.download = 'messmate-announcement.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function drawWrappedText(context, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = text.split(/\s+/);
  let line = '';
  let lineCount = 0;
  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      if (lineCount < maxLines) context.fillText(line, x, y + lineCount * lineHeight);
      lineCount += 1;
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line && lineCount < maxLines) context.fillText(line, x, y + lineCount * lineHeight);
}