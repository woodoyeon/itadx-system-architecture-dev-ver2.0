'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setTokens(data.data.accessToken, data.data.refreshToken);
      const profile = await api.get('/auth/profile');
      setUser(profile.data.data);
      const home = profile.data.data.role === 'bank' ? '/bank/dashboard' : profile.data.data.role === 'mart' ? '/mart/receiving' : '/admin/dashboard';
      router.push(home);
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { message?: string | string[] } }; code?: string };
      if (ax.code === 'ERR_NETWORK' || ax.code === 'ECONNREFUSED' || !ax.response) {
        setError('서버에 연결할 수 없습니다. gateway(4003)·auth-api(4001)가 실행 중인지 확인하세요.');
      } else if (ax.response?.status === 401) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else if (ax.response?.status === 400) {
        const msg = ax.response?.data?.message;
        const detail = Array.isArray(msg) ? msg.join(', ') : msg;
        setError(detail || '비밀번호는 8자 이상이어야 합니다. (test@test.com → password123)');
      } else {
        setError(`로그인 실패 (${ax.response?.status || '오류'}). 서버 로그를 확인하세요.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={onSubmit} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6">ItaDX</h1>
        <div className="space-y-4">
          <Input label="이메일" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="bank@itadx.com" autoComplete="email" />
          <div>
            <Input
              label="비밀번호"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              autoComplete="current-password"
            />
            <label className="flex items-center gap-2 mt-1.5 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} className="rounded border-gray-300" />
              비밀번호 표시
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="w-full px-4 py-3 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </div>
      </form>
    </div>
  );
}
