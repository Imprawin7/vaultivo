import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await register({ displayName, email, password });
      navigate('/drive', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create account');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <h1 className="font-display text-xl mb-5">Create your vault</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Full name"
          className="w-full px-3 py-2.5 text-sm bg-paper border border-line rounded-ticket focus:border-vault/50"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full px-3 py-2.5 text-sm bg-paper border border-line rounded-ticket focus:border-vault/50"
        />
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min. 8 characters)"
          className="w-full px-3 py-2.5 text-sm bg-paper border border-line rounded-ticket focus:border-vault/50"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button type="submit" disabled={submitting} className="btn-primary w-full justify-center disabled:opacity-50">
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="text-center text-sm text-ink/50 mt-6">
        Already have an account? <Link to="/login" className="text-vault hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
