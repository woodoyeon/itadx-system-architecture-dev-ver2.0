# 🖥 admin-web — 프론트엔드 (Next.js 14)

> **담당**: 프론트엔드 개발자
> **WAS**: Next.js 14 (React 서버)
> **포트**: 3000

## 📡 백엔드와 통신하는 3가지 방법

### 1) REST API — 실제 코드: `src/lib/api.ts`
```typescript
// axios로 백엔드 API 호출. JWT 토큰 자동 첨부
const api = axios.create({ baseURL: '/api', timeout: 10000 });

// 모든 요청에 JWT 토큰 자동 첨부
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 사용 예: const { data } = await api.get('/marts');
```

### 2) WebSocket — 실제 코드: `src/lib/socket.ts`
```typescript
// 서버 → 클라이언트 실시간 알림 (입고확인 시 즉시 화면 갱신)
const socket = io(window.location.origin, {
  auth: { token },              // JWT 토큰으로 인증
  transports: ['websocket'],    // WebSocket만 사용
});
socket.on('receiving:confirmed', (data) => {
  // → React Query 캐시 무효화 → 화면 자동 갱신
});
```

### 3) Optimistic Update — 실제 코드: `src/hooks/use-receivings.ts`
```typescript
// 입고확인 버튼 클릭 → UI를 먼저 바꾸고 → 서버 응답 기다림
const confirmMutation = useMutation({
  mutationFn: (id) => api.patch(`/receivings/${id}/confirm`),
  onMutate: async (id) => {
    // 서버 응답 전에 UI를 즉시 '확인됨'으로 변경 (UX 개선)
    queryClient.setQueriesData(['receivings'], (old) => ({
      ...old, data: old.data.map(r =>
        r.id === id ? { ...r, status: 'confirmed' } : r
      ),
    }));
  },
});
```

## 📁 실제 코드 파일 위치
```
src/lib/api.ts              ← API 클라이언트 (axios + JWT 인터셉터)
src/lib/socket.ts           ← WebSocket 연결
src/stores/auth-store.ts    ← 로그인 상태 관리 (Zustand)
src/hooks/use-receivings.ts ← ★ 입고 API + Optimistic Update
src/hooks/use-marts.ts      ← 마트 API
src/hooks/use-dashboard.ts  ← 대시보드 KPI API
src/hooks/use-socket.ts     ← WebSocket 이벤트 → React Query 연동
src/app/login/page.tsx      ← 로그인 화면 (실제 코드)
src/app/mart/receiving/page.tsx  ← ★ 입고확인 화면 (실제 코드)
src/app/bank/dashboard/page.tsx  ← 은행 대시보드 (실제 코드)
src/components/ui/           ← Button, Card, Table 등 UI 컴포넌트
```

## 🚀 실행
```bash
cd apps/admin-web && pnpm install && pnpm dev
# → http://localhost:3000
```
