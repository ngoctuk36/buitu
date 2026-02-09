"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PageView() {
  const { id } = useParams();

  const [activeTab, setActiveTab] = useState("content"); // "content" | "files"
  const [content, setContent] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // files: [{ name, url, size }]
  const [files, setFiles] = useState([]);

  // preview state for file preview
  const [preview, setPreview] = useState({ type: null, name: "", data: null, loading: false, error: null });
  // type: "image" | "text" | null

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setErrorMsg("");
    fetch(`/api/page/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setContent(data.content || "");
        setFiles(Array.isArray(data.files) ? data.files : []);
        setLoading(false);
      })
      .catch(() => {
        setContent("");
        setFiles([]);
        setErrorMsg("Không tìm thấy nội dung hoặc link đã hết hạn.");
        setLoading(false);
      });
  }, [id]);

  // Save updated content
  const save = async () => {
    try {
      setLoading(true);
      await fetch(`/api/page/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      setEditing(false);
    } catch (err) {
      console.error("Save failed", err);
      // bạn có thể show toast
    } finally {
      setLoading(false);
    }
  };

  // Helpers
  function extOf(name) {
    const i = name.lastIndexOf(".");
    return i === -1 ? "" : name.slice(i).toLowerCase();
  }
  function isImage(nameOrUrl) {
    const ex = extOf(nameOrUrl);
    return [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].includes(ex);
  }
  function isTextFile(nameOrUrl) {
    const ex = extOf(nameOrUrl);
    return [".js", ".ts", ".jsx", ".tsx", ".py", ".c", ".cpp", ".java", ".json", ".html", ".css", ".txt", ".md", ".sql", ".sh"].includes(ex);
  }

  // preview file: if image -> show img, if text -> fetch text
  async function handlePreviewFile(file) {
    setPreview({ type: null, name: file.name, data: null, loading: true, error: null });

    if (isImage(file.name) || isImage(file.url)) {
      // image preview
      setPreview({ type: "image", name: file.name, data: file.url, loading: false, error: null });
      return;
    }

    if (isTextFile(file.name) || isTextFile(file.url)) {
      try {
        const res = await fetch(file.url);
        if (!res.ok) throw new Error("Không tải được file");
        const text = await res.text();
        setPreview({ type: "text", name: file.name, data: text, loading: false, error: null });
        return;
      } catch (err) {
        setPreview({ type: null, name: file.name, data: null, loading: false, error: err.message || "Lỗi tải preview" });
        return;
      }
    }

    // other types: no preview, offer open in new tab
    setPreview({ type: null, name: file.name, data: null, loading: false, error: null });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Đang tải...
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded shadow text-center">
          <div className="mb-2 text-red-600">{errorMsg}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center bg-gray-100 py-12 px-4">
      <div className="w-full max-w-3xl">
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h1 className="text-2xl font-bold">Xem nội dung</h1>

          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab("content")}
              className={`px-4 py-2 -mb-px ${activeTab === "content" ? "border-b-2 border-black font-semibold" : "border-b-2 border-transparent text-gray-600"}`}
            >
              Nội dung
            </button>
            <button
              onClick={() => setActiveTab("files")}
              className={`px-4 py-2 -mb-px ${activeTab === "files" ? "border-b-2 border-black font-semibold" : "border-b-2 border-transparent text-gray-600"}`}
            >
              File ({files.length})
            </button>
          </div>

          <div className="pt-4">
            {activeTab === "content" && (
              <div>
                {editing ? (
                  <>
                    <textarea
                      className="w-full min-h-[36vh] border p-3 rounded resize-none font-mono"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                    <div className="mt-3 flex gap-2">
                      <button onClick={save} className="px-4 py-2 bg-green-600 text-white rounded">Lưu</button>
                      <button onClick={() => { setEditing(false); }} className="px-4 py-2 bg-gray-200 rounded">Hủy</button>
                    </div>
                  </>
                ) : (
                  <>
                    <pre className="whitespace-pre-wrap break-words text-sm">{content || "(Không có nội dung)"}</pre>
                    <div className="mt-3">
                      <button onClick={() => setEditing(true)} className="px-4 py-2 bg-gray-600 text-white rounded">Sửa nội dung</button>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "files" && (
              <div className="space-y-4">
                {files.length === 0 ? (
                  <div className="text-sm text-gray-500">Không có file đính kèm.</div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-3">
                      {files.map((f, idx) => (
                        <div key={idx} className="flex items-start justify-between border rounded p-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="text-sm font-medium break-all">{f.name}</div>
                              <div className="text-xs text-gray-500">· {(f.size ? (f.size/1024).toFixed(1) + " KB" : "")}</div>
                            </div>
                            <div className="text-sm text-gray-500 mt-1 break-all">{f.url}</div>

                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => handlePreviewFile(f)}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded"
                              >
                                Xem
                              </button>
                              <a
                                href={f.url}
                                download={f.name}
                                className="px-3 py-1 bg-gray-200 text-sm rounded"
                              >
                                Tải
                              </a>
                            </div>
                          </div>

                          {/* if it's an image show small thumb */}
                          <div className="ml-4 w-28">
                            {isImage(f.name) ? (
                              <img src={f.url} alt={f.name} className="w-28 h-20 object-cover rounded" />
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* preview area */}
                    <div className="mt-4 border rounded p-3 bg-gray-50">
                      {preview.loading ? (
                        <div className="text-sm text-gray-600">Đang tải preview...</div>
                      ) : preview.error ? (
                        <div className="text-sm text-red-600">Lỗi preview: {preview.error}</div>
                      ) : preview.type === "image" ? (
                        <div>
                          <div className="text-sm font-medium mb-2">{preview.name}</div>
                          <img src={preview.data} alt={preview.name} className="w-full object-contain rounded" />
                        </div>
                      ) : preview.type === "text" ? (
                        <div>
                          <div className="text-sm font-medium mb-2">{preview.name}</div>
                          <pre className="whitespace-pre-wrap bg-white p-3 rounded text-sm font-mono overflow-x-auto">{preview.data}</pre>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">Chọn 1 file và bấm <b>Xem</b> để preview (ảnh / file text).</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
