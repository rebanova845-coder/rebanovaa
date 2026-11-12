import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Reba niba yari yamaze kwinjira mbere
  useEffect(() => {
    const isAuth = localStorage.getItem("rebanova_admin_auth");
    if (isAuth === "true") {
      navigate("/admin/dashboard");
    }
  }, [navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    // Amakuru y'umuyobozi wemewe
    const ADMIN_USERNAME = "admin";
    const ADMIN_PASSWORD = "rebanova2026@admin";

    // Gutinda gato nka loading y'umutekano (0.5s)
    setTimeout(() => {
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        localStorage.setItem("rebanova_admin_auth", "true");
        navigate("/admin/dashboard");
      } else {
        setErrorMsg("Izina cyangwa ijambo ry'ibanga si byo. Ongera ugerageze.");
        setSubmitting(false);
      }
    }, 500);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F5F7FB] px-4 py-10 text-slate-900">
      <div className="relative grid w-full max-w-[920px] overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_28px_90px_rgba(30,41,59,0.12)] md:grid-cols-[1fr_0.9fr]">
        
        {/* Iburyo/Ibumoso: Ibisobanuro bya RebaNova */}
        <section className="hidden flex-col justify-between bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-10 text-white md:flex">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-xl font-black">
              R
            </div>
            <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-100">
              RebaNova workspace
            </p>
            <h1 className="mt-3 max-w-xs text-3xl font-black leading-tight tracking-tight">
              Your content, under control.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-indigo-100">
              Manage your movie library and keep every release in one place.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-100">
            <span className="h-2 w-2 rounded-full bg-emerald-300" /> Admin access portal
          </div>
        </section>

        {/* Urupapuro rwa Form yo kwinjira */}
        <section className="p-7 sm:p-10">
          <div className="mb-8">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Sign in to Admin</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Injiza amakuru yawe kugira ngo ukomeze muri dashboard.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 focus:bg-white"
                placeholder="Enter username"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 focus:bg-white"
                placeholder="Enter password"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? "Signing in..." : "Sign in to dashboard →"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}