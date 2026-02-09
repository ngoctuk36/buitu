"use client";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("content"); // "content" | "file"
  const [content, setContent] = useState("");

  // files: array of { name, url, size }
  const [files, setFiles] = useState([]);

  // filePreviews: array of { id, name, size, previewUrl?, text?, uploading?:bool, error?:string, uploadedUrl? }
  const [filePreviews, setFilePreviews] = useState([]);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(null);

  const [loading, setLoading] = useState(false); // create page
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  // revoke any created object URLs on unmount / when previews removed
  useEffect(() => {
    return () => {
      filePreviews.forEach((p) => {
        if (p.previewUrl && p.previewUrl.startsWith("blob:")) {
          try { URL.revokeObjectURL(p.previewUrl); } catch {}
        }
      });
    };
  }, [filePreviews]);

  function rndId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return Math.random().toString(36).slice(2, 9);
  }

  // which extensions considered text for preview
  const textExts = [
    ".js", ".ts", ".jsx", ".tsx", ".py", ".c", ".cpp", ".java",
    ".json", ".html", ".css", ".txt", ".md", ".sql", ".sh"
  ];

  // handle selecting files: create preview entries, read text if applicable, then upload to /api/upload
  async function handleFileChange(e) {
    const chosen = Array.from(e.target.files || []);
    if (chosen.length === 0) return;

    const hadNoPreviews = filePreviews.length === 0;
    // create preview entries first (optimistic)
    const newEntries = await Promise.all(chosen.map(async (file) => {
      const id = rndId();
      const name = file.name;
      const size = file.size;
      const lower = name.toLowerCase();
      const preview = { id, name, size, uploading: true };

      // create image/object preview for images to show immediately
      if (file.type && file.type.startsWith("image/")) {
        preview.previewUrl = URL.createObjectURL(file);
      }

      // read small text files for preview
      if (textExts.some(ext => lower.endsWith(ext)) && file.size < 2_000_000) {
        try {
          preview.text = await file.text();
        } catch (err) {
          preview.text = `Không thể đọc file: ${err.message}`;
        }
      }

      return { preview, file };
    }));

    // append previews to UI
    setFilePreviews(prev => [...prev, ...newEntries.map(p => p.preview)]);
    if (hadNoPreviews) setSelectedPreviewIndex(0);

    // upload files (concurrently)
    await Promise.all(newEntries.map(async ({ preview, file }) => {
      try {
        const form = new FormData();
        form.append("file", file);

        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json();

        if (!res.ok || !data?.url) {
          throw new Error(data?.error || "Upload failed");
        }

        // add to files state (saved URLs)
        setFiles(prev => [...prev, { name: data.name || file.name, url: data.url, size: file.size }]);

        // update preview entry: mark uploaded, set url
        setFilePreviews(prev => prev.map(p => {
          if (p.id === preview.id) {
            // revoke local blob if we will use remote url (to free memory)
            if (p.previewUrl && p.previewUrl.startsWith("blob:")) {
              try { URL.revokeObjectURL(p.previewUrl); } catch {}
            }
            return { ...p, uploading: false, uploadedUrl: data.url };
          }
          return p;
        }));
      } catch (err) {
        console.error("Upload error:", err);
        setFilePreviews(prev => prev.map(p => p.id === preview.id ? { ...p, uploading: false, error: err.message } : p));
      }
    }));

    // reset input value so same file can be selected again if needed
    e.target.value = null;
  }

  // remove preview + corresponding uploaded file (if uploaded)
  function removeFilePreview(id) {
    const idx = filePreviews.findIndex(p => p.id === id);
    if (idx === -1) return;
    const fp = filePreviews[idx];

    // remove from previews
    setFilePreviews(prev => prev.filter(p => p.id !== id));

    // remove from files if uploadedUrl exists
    if (fp.uploadedUrl) {
      setFiles(prev => prev.filter(f => f.url !== fp.uploadedUrl));
      // optional: call API to delete blob from storage if you implement that
    }

    // adjust selected index
    setSelectedPreviewIndex(prev => {
      if (prev === null) return null;
      if (idx < prev) return prev - 1;
      if (idx === prev) return null;
      return prev;
    });

    // revoke blob url if any
    if (fp.previewUrl && fp.previewUrl.startsWith("blob:")) {
      try { URL.revokeObjectURL(fp.previewUrl); } catch {}
    }
  }

  // create page: send JSON (content + files array)
  async function createPage() {
    if (activeTab === "content" && !content.trim()) return;
    if (activeTab === "file" && files.length === 0) return;

    setLoading(true);
    setLink("");
    setCopied(false);

    try {
      const payload = {
        content: activeTab === "content" ? content : "",
        files: activeTab === "file" ? files : [],
      };

      const res = await fetch("/api/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Create failed");
      }

      setLink(window.location.origin + (data.url || "/"));
    } catch (err) {
      console.error("Create failed:", err);
      // you can show a nicer UI message if wanted
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="mb-2 text-5xl font-bold tracking-widest text-gray-500">BuiTu</div>

        <div className="text-2xl font-medium mb-6">
          <p>• Khi vừa tạo có thể phải đợi để tạo liên kết</p>
          <p>• Link sẽ tự bị xoá sau 365 ngày</p>
          <p>• Web đang trong quá trình thử nghiệm</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <h1 className="text-2xl font-bold text-gray-800">Tạo link nội dung</h1>

          {/* Tabs */}
          <div className="mt-2">
            <div className="flex gap-2 border-b">
              <TabButton label="Nội dung" active={activeTab === "content"} onClick={() => setActiveTab("content")} />
              <TabButton label="File" active={activeTab === "file"} onClick={() => setActiveTab("file")} />
            </div>
          </div>

          {/* Content frame */}
          <div className="mt-4">
            <div className="p-4 border rounded-lg bg-white max-h-[65vh] overflow-y-auto">
              {/* CONTENT TAB */}
              {activeTab === "content" && (
                <>
                  <textarea
                    className="w-full min-h-[24rem] border rounded p-3 font-mono text-sm focus:outline-none focus:ring"
                    placeholder="Dán nội dung của bạn vào đây..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />

                  <div className="mt-3 flex items-center gap-3">
                    <button
                      onClick={createPage}
                      disabled={loading}
                      className="bg-black text-white px-6 py-2 rounded disabled:opacity-50 transition hover:bg-blue-600 active:bg-blue-700"
                    >
                      {loading ? "Đang tạo..." : "Tạo link"}
                    </button>

                    {link && (
                      <div className="flex-1 border rounded p-3 bg-gray-50 space-y-2">
                        <div className="text-sm font-medium">Link của bạn:</div>
                        <div className="flex gap-2 items-center">
                          <input readOnly value={link} className="flex-1 border rounded px-2 py-1 text-sm" />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(link);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 1500);
                            }}
                            className={`px-3 rounded text-white transition ${copied ? "bg-green-600" : "bg-gray-800 hover:bg-blue-600 active:bg-blue-700"}`}
                          >
                            {copied ? "Copied!" : "Copy"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* FILE TAB */}
              {activeTab === "file" && (
                <>
                  <div className="mb-3">
                    {/* HIDDEN input + VISIBLE button (label) */}
                    <input
                      id="fileInput"
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <label htmlFor="fileInput" className="inline-flex items-center gap-2 px-4 py-2 border rounded cursor-pointer hover:bg-gray-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                      <span className="text-sm">Chọn file</span>
                    </label>

                    <div className="mt-2 text-sm text-gray-500">Chọn file (code / ảnh / doc ...). File text nhỏ sẽ được preview.</div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-1/3 border rounded p-2 max-h-[40vh] overflow-y-auto">
                      {filePreviews.length === 0 && <div className="text-sm text-gray-500">Chưa có file.</div>}
                      {filePreviews.map((p, i) => (
                        <div
                          key={p.id}
                          className={`p-2 rounded mb-2 cursor-pointer relative ${selectedPreviewIndex === i ? "bg-gray-100" : "hover:bg-gray-50"}`}
                          onClick={() => setSelectedPreviewIndex(i)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="text-sm font-medium break-all">{p.name}</div>
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-gray-500">{(p.size / 1024).toFixed(1)} KB</div>
                              <button
                                onClick={(ev) => { ev.stopPropagation(); removeFilePreview(p.id); }}
                                className="text-xs text-red-500"
                              >
                                X
                              </button>
                            </div>
                          </div>

                          {p.uploading && <div className="text-xs text-yellow-600 mt-1">Đang upload...</div>}
                          {p.error && <div className="text-xs text-red-600 mt-1">Lỗi: {p.error}</div>}
                          {p.text && <div className="text-xs text-gray-500 mt-1 truncate">{p.text.slice(0, 120)}</div>}
                          {!p.text && p.previewUrl && <div className="mt-2"><img src={p.previewUrl} alt={p.name} className="w-full h-20 object-cover rounded" /></div>}
                          {!p.text && p.uploadedUrl && <div className="mt-2"><img src={p.uploadedUrl} alt={p.name} className="w-full h-20 object-cover rounded" /></div>}
                        </div>
                      ))}
                    </div>

                    <div className="flex-1 border rounded p-2 max-h-[40vh] overflow-y-auto bg-gray-50">
                      {selectedPreviewIndex === null ? (
                        <div className="text-sm text-gray-500">Chọn 1 file để xem preview (nếu có).</div>
                      ) : (
                        <>
                          <div className="text-sm font-medium mb-2">{filePreviews[selectedPreviewIndex].name}</div>
                          {filePreviews[selectedPreviewIndex].text ? (
                            <pre className="whitespace-pre-wrap text-sm font-mono bg-white p-3 rounded border overflow-x-auto">
                              {filePreviews[selectedPreviewIndex].text}
                            </pre>
                          ) : (
                            <>
                              {filePreviews[selectedPreviewIndex].uploadedUrl ? (
                                <div>
                                  <div className="mb-2 text-sm text-gray-600">Ảnh / file đã upload:</div>
                                  <a href={filePreviews[selectedPreviewIndex].uploadedUrl} target="_blank" rel="noreferrer" className="text-blue-600 break-all">{filePreviews[selectedPreviewIndex].uploadedUrl}</a>
                                </div>
                              ) : filePreviews[selectedPreviewIndex].previewUrl ? (
                                <img src={filePreviews[selectedPreviewIndex].previewUrl} alt={filePreviews[selectedPreviewIndex].name} className="w-full object-contain rounded" />
                              ) : (
                                <div className="text-sm text-gray-600">Không có preview cho file này.</div>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={createPage}
                      disabled={loading || files.length === 0}
                      className="bg-black text-white px-6 py-2 rounded disabled:opacity-50 transition hover:bg-blue-600 active:bg-blue-700"
                    >
                      {loading ? "Đang tạo..." : "Tạo link (file)"}
                    </button>

                    {link && (
                      <div className="flex-1 border rounded p-3 bg-gray-50 space-y-2">
                        <div className="text-sm font-medium">Link của bạn:</div>
                        <div className="flex gap-2 items-center">
                          <input readOnly value={link} className="flex-1 border rounded px-2 py-1 text-sm" />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(link);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 1500);
                            }}
                            className={`px-3 rounded text-white transition ${copied ? "bg-green-600" : "bg-gray-800 hover:bg-blue-600 active:bg-blue-700"}`}
                          >
                            {copied ? "Copied!" : "Copy"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium -mb-px transition ${active ? "border-b-2 border-blue-500 text-blue-600" : "border-b-2 border-transparent text-gray-500 hover:text-gray-700"}`}
    >
      {label}
    </button>
  );
}
