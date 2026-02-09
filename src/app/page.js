"use client";
import { useState } from "react";

export default function HomePage() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState("");

  async function createPage() {
    if (!content.trim()) return;

    setLoading(true);
    setLink("");

    const res = await fetch("/api/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    const data = await res.json();
    setLink(window.location.origin + data.url);
    setLoading(false);
  }

  return (
  <div className="min-h-screen bg-gray-100 flex justify-center px-4 py-12">
    <div className="w-full max-w-3xl">
      {/* label trên card */}
      <div className="mb-2 text-5xl font-bold tracking-widest text-gray-500">
        BuiTu
      </div>
      <div className="text-2xl font-medium mb-6">
        <p>• Khi vừa tạo phải có thể phải đợi để tạo liên kết</p>
        <p>• Link sẽ tự bị xoá sau 31 ngày</p>
        <p>• Web đang trong quá trình thử nghiệm</p>
      </div>
      {/* card */}
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">
          Tạo link nội dung
        </h1>

        <textarea
          className="w-full min-h-75 border rounded p-3 font-mono text-sm focus:outline-none focus:ring"
          placeholder="Dán nội dung của bạn vào đây..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <button
          onClick={createPage}
          disabled={loading}
          className="bg-black text-white px-6 py-2 rounded disabled:opacity-50 transition hover:bg-blue-600 active:bg-blue-700"
        >
          {loading ? "Đang tạo..." : "Tạo link"}
        </button>

        {link && (
          <div className="border rounded p-3 bg-gray-50 space-y-2">
            <div className="text-sm font-medium">Link của bạn:</div>
            <div className="flex gap-2">
              <input
                readOnly
                value={link}
                className="flex-1 border rounded px-2 py-1 text-sm"
              />
              <button
                onClick={() => navigator.clipboard.writeText(link)}
                className="bg-gray-800 text-white px-3 rounded transition hover:bg-blue-600 active:bg-blue-700"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
