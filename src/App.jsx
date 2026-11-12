import { Outlet } from "react-router-dom";

export default function App() {
  return (
    <div className="min-h-screen bg-[#F5F7FB] text-slate-900 antialiased">
      <Outlet />
    </div>
  );
}