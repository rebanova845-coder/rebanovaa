import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { AdminShell } from "../components/AdminShell";
import { uploadSingleFileWithProgress } from "../components/admin-upload";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://erlodtwgrvzugzjdakfq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_GBQqAF7dV4FukTFqKzkXdA_x3QX93sy";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface StagedFile {
  name: string;
  file: File;
  status: "pending" | "uploading" | "completed" | "error";
  progressText: string;
  progressPercent: number;
}

interface MediaItem {
  id: string;
  title: string;
  type: "movie" | "series";
  folder_category: string;
  translator: string;
  downloads_count: number;
  episodes_data: { name: string; url: string }[];
  created_at: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Isuzuma ry'uburenganzira binyuze muri localStorage
  useEffect(() => {
    const isAuth = localStorage.getItem("rebanova_admin_auth");
    if (isAuth !== "true") {
      navigate("/admin");
    } else {
      fetchMediaList();
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("rebanova_admin_auth");
    navigate("/admin");
  };

  const [categories, setCategories] = useState<string[]>([
    "Action", "Sci-Fi", "Chinese", "Korea", "Drama", "Romance", "Animation"
  ]);
  const [newCat, setNewCat] = useState("");

  const [translators, setTranslators] = useState<string[]>([
    "Agasobanuye by Rocky Kirabiranya",
    "Agasobanuye by Gaheza Yacu",
    "Agasobanuye by Junior Giti",
    "Agasobanuye by B the Great"
  ]);
  const [newTranslator, setNewTranslator] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    type: "movie" as "movie" | "series",
    folderCategory: "Action",
    translator: "Agasobanuye by Rocky Kirabiranya",
    rating: "8.5",
    year: new Date().getFullYear().toString(),
    posterUrl: "",
    trailerUrl: "",
    synopsis: "",
  });

  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState("");
  const [notification, setNotification] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const fetchMediaList = async () => {
    const { data, error } = await supabase
      .from("media")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMediaList(data);
    }
  };

  const handleTitleChange = (val: string) => {
    setFormData({ ...formData, title: val });

    if (!val.trim()) {
      setDuplicateWarning(null);
      return;
    }

    const found = mediaList.find(
      (m) => m.title.toLowerCase().trim() === val.toLowerCase().trim()
    );

    if (found) {
      setDuplicateWarning(
        `⚠️ Iyi "${found.title}" (${found.type.toUpperCase()}) isanzweho! Jya muri ${found.type === 'series' ? 'Series Manager (/admin/series)' : 'Movies Manager (/admin/movies)'} kugira ngo wongeremo amavidiyo.`
      );
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleAddCategory = () => {
    if (!newCat.trim()) return;
    const formatted = newCat.trim();
    if (!categories.includes(formatted)) {
      setCategories([...categories, formatted]);
      setFormData({ ...formData, folderCategory: formatted });
      setNotification(`✅ Folder "${formatted}" yaremwe neza!`);
    }
    setNewCat("");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddTranslator = () => {
    if (!newTranslator.trim()) return;
    const formatted = newTranslator.trim();
    if (!translators.includes(formatted)) {
      setTranslators([...translators, formatted]);
      setFormData({ ...formData, translator: formatted });
      setNotification(`✅ Umusobanuzi "${formatted}" yongewemo neza!`);
    }
    setNewTranslator("");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleBatchFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newStaged: StagedFile[] = [];
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];

    Array.from(files).forEach((file, index) => {
      let defaultName = "";
      if (formData.type === "movie") {
        const letter = letters[stagedFiles.length + index] || `Part ${stagedFiles.length + index + 1}`;
        defaultName = `Part ${letter}`;
      } else {
        const nextEpNum = stagedFiles.length + index + 1;
        defaultName = `EP ${nextEpNum}`;
      }

      newStaged.push({
        name: defaultName,
        file: file,
        status: "pending",
        progressText: `0 MB / ${(file.size / (1024 * 1024)).toFixed(1)} MB (0%)`,
        progressPercent: 0,
      });
    });

    setStagedFiles([...stagedFiles, ...newStaged]);
    e.target.value = "";
  };

  const handleUpdateFileName = (index: number, newName: string) => {
    const updated = [...stagedFiles];
    updated[index].name = newName;
    setStagedFiles(updated);
  };

  const handleRemoveStagedFile = (index: number) => {
    setStagedFiles(stagedFiles.filter((_, i) => i !== index));
  };

  const handleDeleteMedia = async (id: string, title: string) => {
    if (!confirm(`Wifuza koko gusiba "${title}" burundu muri Database?`)) return;

    const { error } = await supabase.from("media").delete().eq("id", id);
    if (error) {
      alert("❌ Habaye ikibazo mu gusiba: " + error.message);
    } else {
      setNotification(`🗑️ "${title}" yasibwe neza!`);
      fetchMediaList();
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || stagedFiles.length === 0) {
      alert("Nyamuneka uzuze izina rya filime cyangwa series kandi uhitemo amavidiyo!");
      return;
    }

    setUploading(true);
    setOverallProgress(`Tegereza gato: Amavidiyo ${stagedFiles.length} agiye koherezwa ukurikije umurongo (Sequential)...`);

    setStagedFiles(prev => prev.map(f => ({ ...f, status: "uploading", progressPercent: 0, progressText: "Gutangira kohereza..." })));

    try {
      const uploadedParts: { name: string; url: string }[] = [];

      for (let i = 0; i < stagedFiles.length; i++) {
        const item = stagedFiles[i];
        
        setOverallProgress(`Kohereza vidiyo ${i + 1} kuri ${stagedFiles.length}: ${item.name}`);

        const cleanName = item.file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
        const uniqueFileName = `${Date.now()}_${i}_${cleanName}`;

        const url = await uploadSingleFileWithProgress(
          item.file,
          uniqueFileName,
          (percent: number, progressText: string) => {
            setStagedFiles(prev => prev.map((f, idx) => idx === i ? {
              ...f,
              progressPercent: percent,
              progressText: progressText
            } : f));
          }
        );

        setStagedFiles(prev => prev.map((f, idx) => idx === i ? {
          ...f,
          status: "completed",
          progressPercent: 100,
          progressText: "Complete ✅ (100%)"
        } : f));

        uploadedParts.push({ name: item.name, url });
      }

      setOverallProgress("Amavidiyo yose yoherejwe neza! Kubika amakuru muri Supabase Database...");

      const { error } = await supabase.from("media").insert([
        {
          title: formData.title,
          type: formData.type,
          folder_category: formData.folderCategory,
          translator: formData.translator,
          rating: formData.rating,
          year: formData.year,
          download_url: uploadedParts[0]?.url || "",
          episodes_data: uploadedParts,
          poster_url: formData.posterUrl,
          trailer_url: formData.trailerUrl,
          synopsis: formData.synopsis,
          is_latest: true,
          downloads_count: 0,
        },
      ]);

      if (error) throw error;

      setNotification(`🎉 "${formData.title}" hamwe n'amavidiyo yayo yose byoherejwe kandi byabitswe neza!`);
      
      setFormData({
        title: "",
        type: "movie",
        folderCategory: categories[0] || "Action",
        translator: translators[0],
        rating: "8.5",
        year: new Date().getFullYear().toString(),
        posterUrl: "",
        trailerUrl: "",
        synopsis: "",
      });
      setStagedFiles([]);
      setUploading(false);
      setOverallProgress("");
      setDuplicateWarning(null);
      fetchMediaList();

      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      console.error(err);
      alert("❌ Habaye ikibazo: " + (err.message || "Unknown error"));
      setStagedFiles(prev => prev.map(f => f.status === "uploading" ? { ...f, status: "error", progressText: "Byanze" } : f));
      setUploading(false);
      setOverallProgress("");
    }
  };

  return (
    <AdminShell active="dashboard">
      <div className="space-y-7">
        
        {/* Header */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-[0_8px_28px_rgba(15,23,42,0.045)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md">
              R
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">RebaNova Admin Control Center</h1>
              <p className="text-xs text-slate-500 font-semibold">Smart Duplicate Detection & CMS ⚡</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate("/admin/series")}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer shadow-[0_8px_28px_rgba(15,23,42,0.045)]"
            >
              📁 Series Manager ↗
            </button>
            <button
              onClick={() => navigate("/admin/movies")}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer shadow-[0_8px_28px_rgba(15,23,42,0.045)]"
            >
              🎥 Movies Manager ↗
            </button>
            <button
              onClick={handleLogout}
              className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer shadow-[0_8px_28px_rgba(15,23,42,0.045)]"
            >
              Logout ⎋
            </button>
          </div>
        </div>

        {notification && (
          <div role="status" className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm p-4 rounded-2xl text-center font-bold shadow-[0_8px_28px_rgba(15,23,42,0.045)]">
            {notification}
          </div>
        )}

        {/* Overview Stats */}
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Library overview">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.045)] sm:p-5">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Total library</p>
            <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{mediaList.length}</p>
            <p className="mt-1 text-[10px] font-medium text-slate-400">All media items</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.045)] sm:p-5">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Movies</p>
            <p className="mt-2 text-2xl font-black tracking-tight text-indigo-600">{mediaList.filter((item) => item.type === "movie").length}</p>
            <p className="mt-1 text-[10px] font-medium text-slate-400">Film folders</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.045)] sm:p-5">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Series</p>
            <p className="mt-2 text-2xl font-black tracking-tight text-violet-600">{mediaList.filter((item) => item.type === "series").length}</p>
            <p className="mt-1 text-[10px] font-medium text-slate-400">Series folders</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.045)] sm:p-5">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Downloads</p>
            <p className="mt-2 text-2xl font-black tracking-tight text-emerald-600">{mediaList.reduce((sum, item) => sum + (Number(item.downloads_count) || 0), 0).toLocaleString()}</p>
            <p className="mt-1 text-[10px] font-medium text-slate-400">Total recorded downloads</p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form Section */}
          <div className="lg:col-span-2 bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl space-y-6 shadow-[0_8px_28px_rgba(15,23,42,0.045)]">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>🚀</span> Shyiramo Filime cyangwa Series Nshya
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => { setFormData({ ...formData, type: "movie" }); setStagedFiles([]); }}
                  className={`p-3.5 rounded-2xl font-black text-xs border cursor-pointer transition shadow-[0_8px_28px_rgba(15,23,42,0.045)] ${formData.type === "movie" ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}
                >
                  🎥 Movie (Parts: A, B, C...)
                </button>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => { setFormData({ ...formData, type: "series" }); setStagedFiles([]); }}
                  className={`p-3.5 rounded-2xl font-black text-xs border cursor-pointer transition shadow-[0_8px_28px_rgba(15,23,42,0.045)] ${formData.type === "series" ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}
                >
                  📺 Series (Episodes: EP 1, 2...)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Izina rya Filime cyangwa Series</label>
                  <input
                    type="text"
                    required
                    disabled={uploading}
                    placeholder="Urugero: Prison Break cyangwa Avatar 3"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 shadow-[0_8px_28px_rgba(15,23,42,0.045)] transition"
                  />
                  {duplicateWarning && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl font-bold mt-2 shadow-[0_8px_28px_rgba(15,23,42,0.045)]">
                      {duplicateWarning}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Umwaka</label>
                  <input
                    type="text"
                    disabled={uploading}
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 shadow-[0_8px_28px_rgba(15,23,42,0.045)] transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">📁 Folder / Category</label>
                  <select
                    value={formData.folderCategory}
                    disabled={uploading}
                    onChange={(e) => setFormData({ ...formData, folderCategory: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 shadow-[0_8px_28px_rgba(15,23,42,0.045)] transition"
                  >
                    {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">🎙️ Umusobanuzi</label>
                  <select
                    value={formData.translator}
                    disabled={uploading}
                    onChange={(e) => setFormData({ ...formData, translator: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 shadow-[0_8px_28px_rgba(15,23,42,0.045)] transition"
                  >
                    {translators.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* INDIVIDUAL LIVE PROGRESS BARS */}
              <div className="bg-[#F8FAFC] border border-slate-200/80 p-5 rounded-2xl space-y-4 shadow-[0_8px_28px_rgba(15,23,42,0.045)]">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                    📂 Hitamo Amavidiyo ({formData.type === "movie" ? "Parts" : "Episodes"})
                  </label>
                  {!uploading && (
                    <label className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-4 py-2.5 rounded-xl cursor-pointer transition shadow-[0_8px_28px_rgba(15,23,42,0.045)]">
                      + Select Videos (Multi-select)
                      <input
                        type="file"
                        accept="video/*"
                        multiple
                        onChange={handleBatchFilesSelected}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {stagedFiles.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs bg-white font-semibold">
                    Nta vidiyo iratoranywa. Kanda kuri "+ Select Videos" kugira ngo uhitemo izose icyarimwe.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {stagedFiles.map((item, index) => (
                      <div key={index} className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 shadow-[0_8px_28px_rgba(15,23,42,0.045)]">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={item.name}
                            disabled={uploading}
                            onChange={(e) => handleUpdateFileName(index, e.target.value)}
                            className="w-28 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 shadow-[0_8px_28px_rgba(15,23,42,0.045)]"
                          />
                          <span className="text-xs text-slate-600 truncate flex-1 font-medium">
                            📄 {item.file.name}
                          </span>
                          {!uploading && (
                            <button
                              type="button"
                              onClick={() => handleRemoveStagedFile(index)}
                              className="text-rose-500 hover:text-rose-700 text-xs font-bold px-2 py-1"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        <div className="flex justify-between items-center text-[11px] font-bold">
                          <span className={item.status === "completed" ? "text-emerald-600 font-black" : "text-indigo-600"}>
                            {item.progressText}
                          </span>
                          <span className="text-slate-500 uppercase text-[9px] bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200 font-bold">
                            {item.status}
                          </span>
                        </div>

                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className={`h-full transition-all duration-300 ${item.status === "completed" ? "bg-emerald-500" : "bg-indigo-600 animate-pulse"}`}
                            style={{ width: `${item.progressPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">🖼️ Poster Image URL</label>
                  <input
                    type="url"
                    disabled={uploading}
                    placeholder="https://..."
                    value={formData.posterUrl}
                    onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 shadow-[0_8px_28px_rgba(15,23,42,0.045)] transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">🎥 YouTube Trailer URL</label>
                  <input
                    type="url"
                    disabled={uploading}
                    placeholder="https://youtube.com/watch?v=..."
                    value={formData.trailerUrl}
                    onChange={(e) => setFormData({ ...formData, trailerUrl: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 shadow-[0_8px_28px_rgba(15,23,42,0.045)] transition"
                  />
                </div>
              </div>

              {uploading && (
                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl text-center space-y-1 shadow-[0_8px_28px_rgba(15,23,42,0.045)]">
                  <p className="text-xs font-black text-indigo-700 animate-pulse">{overallProgress}</p>
                  <p className="text-[10px] text-slate-500 font-semibold">Ntugafunge urubuga kugeza igihe byose birangiriye!</p>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading || stagedFiles.length === 0}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm py-4 rounded-2xl shadow-md transition cursor-pointer mt-2 disabled:opacity-50"
              >
                {uploading ? "Biri koherezwa..." : `💾 OHEREZA ${stagedFiles.length} VIDEOS`}
              </button>
            </form>
          </div>

          {/* Sidebar Tools */}
          <div className="space-y-6">
            
            <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-[0_8px_28px_rgba(15,23,42,0.045)]">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <span>📁</span> Kora Folder Nshya
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Izina rya folder..."
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 shadow-[0_8px_28px_rgba(15,23,42,0.045)] focus:outline-none focus:border-indigo-600"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer shrink-0 shadow-[0_8px_28px_rgba(15,23,42,0.045)]"
                >
                  + Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {categories.map((c) => (
                  <span key={c} className="text-[11px] font-bold bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl shadow-[0_8px_28px_rgba(15,23,42,0.045)]">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-[0_8px_28px_rgba(15,23,42,0.045)]">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <span>🎙️</span> Ongeraho Umusobanuzi
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Izina ry'umusobanuzi..."
                  value={newTranslator}
                  onChange={(e) => setNewTranslator(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 shadow-[0_8px_28px_rgba(15,23,42,0.045)] focus:outline-none focus:border-indigo-600"
                />
                <button
                  type="button"
                  onClick={handleAddTranslator}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer shrink-0 shadow-[0_8px_28px_rgba(15,23,42,0.045)]"
                >
                  + Add
                </button>
              </div>
              <div className="flex flex-col gap-2 pt-1">
                {translators.map((t) => (
                  <span key={t} className="text-[11px] font-semibold bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-xl shadow-[0_8px_28px_rgba(15,23,42,0.045)] truncate">
                    {t}
                  </span>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Analytics & Delete Table Section */}
        <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl space-y-4 shadow-[0_8px_28px_rgba(15,23,42,0.045)]">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <span>📊</span> Urutonde rw'Amavidiyo n'Abakoze Download (Analytics Dashboard)
            </h3>
            <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-3.5 py-1.5 rounded-full border border-indigo-200">
              Total: {mediaList.length} Items
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 uppercase font-black text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5 rounded-l-xl">Izina rya Filime / Series</th>
                  <th className="p-3.5">Ubwoko</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Umusobanuzi</th>
                  <th className="p-3.5 text-center">Episodes Zihari</th>
                  <th className="p-3.5 text-center">Downloads 📥</th>
                  <th className="p-3.5 rounded-r-xl text-center">Ibikorwa (Action)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {mediaList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 font-semibold">
                      Nta filime cyangwa series irashyirwa muri database.
                    </td>
                  </tr>
                ) : (
                  mediaList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-bold text-slate-900">{item.title}</td>
                      <td className="p-3.5 uppercase font-bold text-[10px]">
                        <span className={`px-2.5 py-1 rounded-md ${item.type === 'movie' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold">{item.folder_category}</td>
                      <td className="p-3.5 text-slate-500 font-semibold">{item.translator}</td>
                      <td className="p-3.5 text-center font-bold text-indigo-600">{item.episodes_data?.length || 1} EPs</td>
                      <td className="p-3.5 text-center font-black text-emerald-600 text-sm">{item.downloads_count || 0}</td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleDeleteMedia(item.id, item.title)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-3 py-1.5 rounded-xl border border-rose-200 transition cursor-pointer text-[11px] shadow-[0_8px_28px_rgba(15,23,42,0.045)]"
                        >
                          Delete 🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AdminShell>
  );
}