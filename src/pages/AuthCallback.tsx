import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

function parseHashParams(hash: string): Record<string, string> {
  const h = hash.startsWith("#") ? hash.slice(1) : hash;
  const out: Record<string, string> = {};
  for (const part of h.split("&")) {
    const [k, v] = part.split("=");
    if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || "");
  }
  return out;
}

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState<string>("Finalizing sign-in…");

  const hashParams = useMemo(() => parseHashParams(location.hash || ""), [location.hash]);
  const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  useEffect(() => {
    async function run() {
      try {
        // 1) PKCE style: ?code=… from Supabase
        const code = urlParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          navigate("/faculty-dashboard", { replace: true });
          return;
        }

        // 2) Hash style: #access_token=…&refresh_token=…
        const access_token = hashParams["access_token"]; // eslint-disable-line @typescript-eslint/naming-convention
        const refresh_token = hashParams["refresh_token"]; // eslint-disable-line @typescript-eslint/naming-convention
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;
          navigate("/faculty-dashboard", { replace: true });
          return;
        }

        // 3) If neither present, try existing session
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          navigate("/faculty-dashboard", { replace: true });
          return;
        }

        // No session; send to login
        setMessage("Redirecting to login…");
        navigate("/faculty-login", { replace: true });
      } catch (e: any) {
        console.error("Auth callback error", e);
        setMessage(e?.message || "Sign-in failed");
        setTimeout(() => navigate("/faculty-login", { replace: true }), 1200);
      }
    }
    run();
  }, [hashParams, urlParams, navigate]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black text-white">
      <div className="text-center opacity-90">
        <div className="animate-pulse mb-2">Attendo</div>
        <div className="text-sm text-neutral-300">{message}</div>
      </div>
    </div>
  );
};

export default AuthCallback;
