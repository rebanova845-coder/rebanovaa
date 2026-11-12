import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { AdminShell } from "../components/AdminShell";
import { uploadFileToAdminApi } from "../components/admin-upload";
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

interface MovieItem {
  id: string;
  title: string;
  folder_category: string;
  translator: string;
  episodes_data: { name: string; url: string }[];
  downloads_count: number;
  created_at: string;
}

export default function AdminMoviesManager() {
  const navigate = useNavigate();

  useEffect(() => {
    const isAuth = localStorage.getItem("rebanova_admin_auth");
    if (isAuth !== "true") {
      navigate("/admin");
    } else {
      
      fetchMoviesList(); 
    }
  }, [navigate]);

  const [moviesList, setMoviesList] = useState<MovieItem[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<MovieItem | null>(null);

  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editTranslator, setEditTranslator] = useState("");
  const [editableParts, setEditableParts] = useState<{ name: string; url: string }[]>([]);

  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  const fetchMoviesList = async () => {
    const { data, error } = await supabase
      .from("media")
      .select("*")
      .eq("type", "movie")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMoviesList(data);
      if (selectedMovie) {
        const updatedCurrent = data.find((m) => m.id === selectedMovie.id);
        if (updatedCurrent) {
          setSelectedMovie(updatedCurrent);
          setEditableParts(updatedCurrent.episodes_data || []);
        }
      }
    }
  };

  const handleSelectMovie = (movie: MovieItem) => {
    setSelectedMovie(movie);
    setEditTitle(movie.title);
    setEditCategory(movie.folder_category);
    setEditTranslator(movie.translator);
    setEditableParts(movie.episodes_data || []);
    setIsEditingMeta(false);
    setStagedFiles([]);
  };

  const handleSaveMovieMeta = async () => {
    if (!selectedMovie) return;

    const { error } = await supabase
      .from("media")
      .update({
        title: editTitle,
        folder_category: editCategory,
        translator: editTranslator,
        episodes_data: editableParts,
      })
      .eq("id", selectedMovie.id);

    if (error) {
      alert("❌ Habaye ikibazo mu kuvugurura: " + error.message);
    } else {
      setNotification(`✅ Amakuru ya "${editTitle}" yavuguruwe neza!`);
      setIsEditingMeta(false);
      fetchMoviesList();
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handlePartNameChange = (index: number, newName: string) => {
    const updated = [...editableParts];
    updated[index].name = newName;
    setEditableParts(updated);
  };

  const handleRemovePart = (index: number) => {
    if (!confirm("Wifuza gusiba iki gice (part) burundu?")) return;
    const updated = editableParts.filter((_, i) => i !== index);
    setEditableParts(updated);
  };

  const handleBatchFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedMovie) return;

    const newStaged: StagedFile[] = [];
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];
    const currentCount = editableParts.length + stagedFiles.length;

    Array.from(files).forEach((file, index) => {
      const letterIndex = currentCount + index;
      const partLetter = letters[letterIndex] || `Part ${letterIndex + 1}`;
      
      newStaged.push({
        name: `Part ${partLetter}`,
        file: file,
        status: "pending",
        progressText: `0 MB / ${(file.size / (1024 * 1024)).toFixed(1)} MB (0%)`,
        progressPercent: 0,
      });
    });

    setStagedFiles([...stagedFiles, ...newStaged]);
    e.target.value = "";
  };

  const handleAppendMovieParts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMovie || stagedFiles.length === 0) return;

    setUploading(true);

    try {
      const newUploadedParts: { name: string; url: string }[] = [];

      for (let i = 0; i < stagedFiles.length; i++) {
        const item = stagedFiles[i];
        
        setStagedFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "uploading" } : f));
        setProgressText(`Kohereza ${item.name} (${i + 1} kuri ${stagedFiles.length})...`);

        const cleanName = item.file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
        const fileName = `media/movie_${Date.now()}_${cleanName}`;

        const totalMB = (item.file.size / (1024 * 1024)).toFixed(1);
        setStagedFiles(prev => prev.map((f, idx) => idx === i ? {
          ...f,
          progressPercent: 0,
          progressText: `Kohereza kuri server (${totalMB} MB)...`
        } : f));
        const r2DownloadUrl = await uploadFileToAdminApi(item.file, fileName);

        setStagedFiles(prev => prev.map((f, idx) => idx === i ? {
          ...f,
          status: "completed",
          progressPercent: 100,
          progressText: `${totalMB} MB / ${totalMB} MB (Complete ✅)`
        } : f));

        newUploadedParts.push({ name: item.name, url: r2DownloadUrl });
      }

      setProgressText("Guhuza Parts nshya na Database...");
      
      const mergedParts = [...editableParts, ...newUploadedParts];

      const { error } = await supabase
        .from("media")
        .update({ episodes_data: mergedParts, is_latest: true })
        .eq("id", selectedMovie.id);

      if (error) throw error;

      setNotification(`🎉 Parts nshya zongerewe neza kuri "${selectedMovie.title}"!`);
      
      setEditableParts(mergedParts);
      setStagedFiles([]);
      setUploading(false);
      setProgressText("");
      fetchMoviesList();

      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      console.error(err);
      alert("❌ Habaye ikibazo: " + (err.message || "Unknown error"));
      setUploading(false);
      setProgressText("");
    }
  };

  return (
    <AdminShell active="movies">
      <div className="space-y-7">
        
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl flex justify-between items-center shadow-[0_8px_28px_rgba(15,23,42,0.045)]">
          <div>
            <h1 className="text-xl font-black text-slate-900">RebaNova Movies & Folders Manager</h1>
            <p className="text-xs text-slate-500">Cunga Folders za Movies, Hindura Amakuru ndetse wongeremo Parts ⚡</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/admin/series")}
              className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer hover:bg-indigo-100 transition duration-200"
            >
              📁 Series Manager ↗
            </button>
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer hover:bg-indigo-500 transition shadow-[0_8px_28px_rgba(15,23,42,0.045)]"
            >
              ← Main Dashboard
            </button>
          </div>
        </div>

        {notification && (
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm p-4 rounded-2xl text-center font-semibold animate-pulse">
            {notification}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl space-y-4 shadow-[0_8px_28px_rgba(15,23,42,0.045)] h-fit">
            <h3 className="font-extrabold text-slate-900 text-sm">📁 Folders za Movies Zose ({moviesList.length})</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {moviesList.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Nta movie irabikwa.</p>
              ) : (
                moviesList.map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => handleSelectMovie(movie)}
                    className={`p-3 rounded-2xl border cursor-pointer transition ${selectedMovie?.id === movie.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300'}`}
                  >
                    <div className="font-bold text-sm truncate">{movie.title}</div>
                    <div className={`text-[10px] flex justify-between pt-1 ${selectedMovie?.id === movie.id ? 'text-indigo-100' : 'text-slate-500'}`}>
                      <span>📂 {movie.folder_category}</span>
                      <span className="font-bold">{movie.episodes_data?.length || 0} Parts</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white border border-slate-200/80 p-6 sm:p-8 rounded-2xl space-y-6 shadow-[0_8px_28px_rgba(15,23,42,0.045)]">
            {!selectedMovie ? (
              <div className="text-center py-24 text-slate-400 space-y-2">
                <p className="text-3xl">🎥</p>
                <p className="text-sm font-semibold">Nta Folder ya Movie yatoranyijwe.</p>
                <p className="text-xs">Hitamo movie mu ruhande rw'ibumoso kugira ngo uyihindure cyangwa wongeremo amavidiyo.</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">{selectedMovie.title}</h2>
                    <p className="text-xs text-slate-500 pt-1">
                      Folder: <span className="font-bold text-slate-700">{selectedMovie.folder_category}</span> | Umusobanuzi: <span className="font-bold text-slate-700">{selectedMovie.translator}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditingMeta(!isEditingMeta)}
                    className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs px-3 py-1.5 rounded-xl transition shadow-[0_8px_28px_rgba(15,23,42,0.045)] cursor-pointer"
                  >
                    {isEditingMeta ? "Cancel Edit" : "✏️ Edit Movie Meta"}
                  </button>
                </div>

                {isEditingMeta && (
                  <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl space-y-3">
                    <h3 className="font-extrabold text-indigo-900 text-xs uppercase">Hindura Amakuru y'iyi Movie:</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600">Izina rya Movie</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 shadow-[0_8px_28px_rgba(15,23,42,0.045)]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Folder Category</label>
                          <input
                            type="text"
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 shadow-[0_8px_28px_rgba(15,23,42,0.045)]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Umusobanuzi</label>
                          <input
                            type="text"
                            value={editTranslator}
                            onChange={(e) => setEditTranslator(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 shadow-[0_8px_28px_rgba(15,23,42,0.045)]"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveMovieMeta}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-[0_8px_28px_rgba(15,23,42,0.045)] transition cursor-pointer"
                      >
                        💾 Bika Impinduka (Save Meta)
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase">Urutonde rwa Parts zihari:</h4>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1 bg-white border border-slate-200 p-3 rounded-2xl shadow-[0_8px_28px_rgba(15,23,42,0.045)]">
                    {editableParts.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">Nta part irimo muri iyi folder.</p>
                    ) : (
                      editableParts.map((part, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                          <input
                            type="text"
                            value={part.name}
                            onChange={(e) => handlePartNameChange(idx, e.target.value)}
                            className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 shadow-[0_8px_28px_rgba(15,23,42,0.045)]"
                          />
                          <span className="text-[11px] text-slate-500 truncate flex-1">🔗 {part.url}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePart(idx)}
                            className="text-rose-500 hover:text-rose-700 text-xs font-bold px-2 py-1"
                          >
                            🗑️
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  {editableParts.length > 0 && !isEditingMeta && (
                    <button
                      type="button"
                      onClick={handleSaveMovieMeta}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-[0_8px_28px_rgba(15,23,42,0.045)] cursor-pointer"
                    >
                      💾 Bika Amazina ya Parts Yahinduwe
                    </button>
                  )}
                </div>

                <form onSubmit={handleAppendMovieParts} className="space-y-4 pt-4 border-t border-slate-200">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-800">
                      ➕ Ongeramo Parts Nshya kuri iyi Movie:
                    </label>
                    {!uploading && (
                      <label className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer transition shadow-[0_8px_28px_rgba(15,23,42,0.045)]">
                        + Select New Parts
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

                  {stagedFiles.length > 0 && (
                    <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-[0_8px_28px_rgba(15,23,42,0.045)]">
                      <p className="text-xs font-bold text-indigo-600">Amavidiyo mashya agiye koherezwa:</p>
                      {stagedFiles.map((item, index) => (
                        <div key={index} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span>{item.name} ({item.file.name})</span>
                            {!uploading && (
                              <button type="button" onClick={() => setStagedFiles(stagedFiles.filter((_, i) => i !== index))} className="text-rose-500 text-xs">✕</button>
                            )}
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-600 font-semibold">
                            <span>{item.progressText}</span>
                            <span className="uppercase text-[9px]">{item.status}</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full transition-all" style={{ width: `${item.progressPercent}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {uploading && (
                    <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-2xl text-center space-y-1">
                      <p className="text-xs font-black text-indigo-700 animate-pulse">{progressText}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={uploading || stagedFiles.length === 0}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm py-3.5 rounded-2xl shadow-md transition cursor-pointer disabled:opacity-50"
                  >
                    {uploading ? "Biri koherezwa muri R2..." : `💾 EMEZA KONGERA ${stagedFiles.length} PARTS MURI FOLDER`}
                  </button>
                </form>

              </div>
            )}
          </div>

        </div>

      </div>
    </AdminShell>
  );
}