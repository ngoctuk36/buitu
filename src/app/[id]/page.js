"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PageView() {
  const { id } = useParams();

  const [content, setContent] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load nội dung
  useEffect(() => {
    if (!id) return;

    fetch(`/api/page/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setContent(data.content || "");
        setLoading(false);
      })
      .catch(() => {
        setContent("Không tìm thấy nội dung hoặc link đã hết hạn.");
        setLoading(false);
      });
  }, [id]);

  // Lưu nội dung
  const save = async () => {
    await fetch(`/api/page/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    setEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Đang tải...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <div className="w-full max-w-2xl p-6 bg-white rounded-xl shadow-md space-y-4">
        {editing ? (
          <>
            <textarea
              className="w-full h-48 border p-3 rounded resize-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <button
              onClick={save}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Lưu
            </button>
          </>
        ) : (
          <>
            <pre className="whitespace-pre-wrap wrap-break-word">
              {content}
            </pre>
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded"
            >
              Sửa nội dung
            </button>
          </>
        )}
      </div>
    </div>
  );
}
