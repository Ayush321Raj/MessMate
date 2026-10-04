import { useState } from 'react';
import api from '../../api/axios';

const STARTERS = [
  'What is on today’s menu?',
  'How much have I been charged this month?',
];

export default function StudentAssistant() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! Ask me about today’s menu or your meal charges.' },
  ]);
  const [prompt, setPrompt] = useState('');
  const [sending, setSending] = useState(false);

  const sendMessage = async (event, suggestedPrompt) => {
    event?.preventDefault();
    const message = (suggestedPrompt || prompt).trim();
    if (!message || sending) return;

    setMessages((current) => [...current, { role: 'user', content: message }]);
    setPrompt('');
    setSending(true);
    try {
      const { data } = await api.post('/assistant/chat', { message });
      setMessages((current) => [...current, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: 'I couldn’t reach the assistant just now. Please try again.' },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="flex min-h-[65vh] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
      <header className="border-b border-gray-100 px-4 py-3">
        <h1 className="font-semibold text-gray-900">MessMate Assistant</h1>
        <p className="text-xs text-gray-500">Menu and billing answers from your MessMate account</p>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`max-w-[88%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
              message.role === 'user'
                ? 'ml-auto bg-brand-600 text-white'
                : 'mr-auto border border-gray-100 bg-gray-50 text-gray-800'
            }`}
          >
            {message.content}
          </div>
        ))}
        {sending && <p className="text-xs text-gray-400">Thinking…</p>}
      </div>

      <div className="border-t border-gray-100 p-3">
        {messages.length === 1 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {STARTERS.map((starter) => (
              <button
                key={starter}
                type="button"
                onClick={(event) => sendMessage(event, starter)}
                disabled={sending}
                className="rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {starter}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            className="input min-w-0 flex-1"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Ask about the menu or your bill"
            maxLength={1000}
            aria-label="Message the MessMate Assistant"
          />
          <button className="btn-primary px-4" type="submit" disabled={sending || !prompt.trim()}>
            Send
          </button>
        </form>
      </div>
    </section>
  );
}