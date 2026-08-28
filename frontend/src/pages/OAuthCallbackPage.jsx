import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Landed on after Google OAuth2 login redirects back with ?token=... (see OAuth2AuthenticationSuccessHandler). */
export default function OAuthCallbackPage() {
  const [params] = useSearchParams();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    const token = params.get('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    loginWithToken(token)
      .then(() => navigate('/drive', { replace: true }))
      .catch(() => navigate('/login', { replace: true }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center">
      <p className="text-paper/60 font-mono text-sm">Signing you in…</p>
    </div>
  );
}
