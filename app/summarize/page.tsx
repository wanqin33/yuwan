'use client';

import { useEffect, useState } from 'react';

type Summary = {
  id: string;
  title: string;
  url?: string;
  summary: string;
  tags: string[];
  createdAt: string;
};

export default function SummarizePage() {
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [latest, setLatest] = useState<Summary | null>(null);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [query, setQuery] = useState('');

  const fetchSummaries = async (q = '') => {
    const res = await fetch('/api/summaries' + (q ? `?q=${encodeURIComponent(q)}` : ''));
    const data = await res.json();
    setSummaries(data);
  };

  useEffect(() => {
    fetchSummaries();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, content }),
    });
    const data = await res.json();
    setLoading(false);
    setLatest(data);
    setUrl('');
    setContent('');
    fetchSummaries();
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    fetchSummaries(query);
  };

  return (
    <div className="p-4 space-y-6">
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="公众号文章链接"
          className="w-full p-2 border"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="或粘贴文章内容"
          rows={6}
          className="w-full p-2 border"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white"
        >
          {loading ? '总结中...' : '总结'}
        </button>
      </form>

      {latest && (
        <div className="border p-4">
          <h2 className="font-bold">最新摘要</h2>
          {latest.title && <h3 className="text-lg">{latest.title}</h3>}
          <p>{latest.summary}</p>
          {latest.tags.length > 0 && (
            <p className="text-sm text-gray-600">标签：{latest.tags.join(', ')}</p>
          )}
        </div>
      )}

      <form onSubmit={handleSearch} className="space-y-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索摘要/标签"
          className="w-full p-2 border"
        />
      </form>

      <ul className="space-y-4">
        {summaries.map((s) => (
          <li key={s.id} className="border p-4">
            {s.title && <h3 className="font-bold">{s.title}</h3>}
            <p>{s.summary}</p>
            {s.tags.length > 0 && (
              <p className="text-sm text-gray-600">标签：{s.tags.join(', ')}</p>
            )}
            {s.url && (
              <a href={s.url} className="text-blue-600" target="_blank" rel="noreferrer">
                原文链接
              </a>
            )}
            <div className="text-xs text-gray-500">
              {new Date(s.createdAt).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
