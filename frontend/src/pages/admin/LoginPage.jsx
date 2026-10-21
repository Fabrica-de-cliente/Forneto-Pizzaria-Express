import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, apiError } from "@/lib/api";
import { toast } from "sonner";
import { Flame } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("forneto_token", data.access_token);
      navigate("/admin");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6" data-testid="login-page">
      <div className="w-full max-w-sm bg-surface2 border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-ember flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-display font-extrabold text-lg text-white block leading-none">FORNETO</span>
            <span className="mono-badge text-[9px] uppercase tracking-widest text-ember font-bold">Dashboard</span>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="text-[11px] font-bold uppercase tracking-widest text-smoke block mb-1.5">
              E-mail
            </label>
            <input
              id="login-email"
              data-testid="login-email-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-card2 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-ember"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="text-[11px] font-bold uppercase tracking-widest text-smoke block mb-1.5">
              Senha
            </label>
            <input
              id="login-password"
              data-testid="login-password-input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-card2 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-ember"
            />
          </div>
          <button
            type="submit"
            data-testid="login-submit-button"
            disabled={loading}
            className="w-full bg-ember hover:bg-ember-dark disabled:opacity-50 text-white py-3 rounded-xl font-bold uppercase text-xs tracking-wider transition-colors"
          >
            {loading ? "Entrando..." : "Entrar no Dashboard"}
          </button>
        </form>

        <a href="/" className="block text-center text-[11px] text-smoke hover:text-white mt-6 transition-colors">
          ← Voltar ao cardápio
        </a>
      </div>
    </div>
  );
}
