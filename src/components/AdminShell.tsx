import type { ReactNode } from "react";
import { useNavigate } from "react-router";

type AdminSection = "dashboard" | "movies" | "series";

const navigation: { id: AdminSection; label: string; description: string; href: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", description: "Overview & uploads", href: "/admin/dashboard", icon: "▦" },
  { id: "movies", label: "Movies", description: "Manage films & parts", href: "/admin/movies", icon: "▣" },
  { id: "series", label: "Series", description: "Manage folders & EPs", href: "/admin/series", icon: "▤" },
];

export function AdminShell({ active, children }: { active: AdminSection; children: ReactNode }) {
  const navigate = useNavigate();

  const signOut = () => {
    if (typeof window !== "undefined") localStorage.removeItem("rebanova_admin_auth");
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-slate-900 lg:flex">
      <aside className="hidden lg:flex lg:w-[258px] lg:shrink-0 lg:flex-col lg:border-r lg:border-slate-200/80 lg:bg-white">
        <div className="flex h-[88px] items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-black text-white shadow-lg shadow-indigo-200">R</div>
          <div>
            <p className="text-[15px] font-extrabold tracking-tight text-slate-900">RebaNova</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Admin workspace</p>
          </div>
        </div>

        <div className="px-4 pt-7">
          <p className="px-3 pb-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Workspace</p>
          <nav className="space-y-1.5" aria-label="Admin navigation">
            {navigation.map((item) => {
              const selected = active === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.href)}
                  aria-current={selected ? "page" : undefined}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${selected ? "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${selected ? "bg-white text-indigo-600 shadow-sm" : "bg-slate-100 text-slate-500 group-hover:bg-white"}`}>{item.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-bold">{item.label}</span>
                    <span className={`mt-0.5 block text-[10px] ${selected ? "text-indigo-500" : "text-slate-400"}`}>{item.description}</span>
                  </span>
                  {selected && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-4">
            <div className="flex items-center gap-2 text-indigo-700">
              <span className="text-base">✦</span>
              <span className="text-[11px] font-extrabold">Creator tools</span>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-slate-500">Keep your movie library organized and up to date.</p>
          </div>
          <button type="button" onClick={signOut} className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-bold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">↪</span>
            Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="mx-auto flex min-h-[68px] max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-black text-white">R</div>
              <div>
                <p className="text-sm font-extrabold text-slate-900">RebaNova</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">Admin</p>
              </div>
            </div>
            <div className="hidden lg:block">
              <p className="text-[11px] font-semibold text-slate-400">REBANOVA <span className="px-1 text-slate-300">/</span> MANAGEMENT</p>
              <p className="mt-0.5 text-xs font-bold text-slate-700">Content control center</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700 sm:inline-flex sm:items-center sm:gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Workspace</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 text-xs font-extrabold text-indigo-700">A</div>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2 lg:hidden" aria-label="Admin navigation">
            {navigation.map((item) => (
              <button key={item.id} type="button" onClick={() => navigate(item.href)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition ${active === item.id ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
                {item.icon} <span className="ml-1">{item.label}</span>
              </button>
            ))}
            <button type="button" onClick={signOut} className="ml-auto shrink-0 rounded-lg px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50">Sign out</button>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
