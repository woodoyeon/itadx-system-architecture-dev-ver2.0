## erp-api — ★ 입고·정산·신용평가 트리거 핵심 서비스

### 1. 이 폴더의 목적

- `services/erp-api`는 ItaDX 비즈니스의 **심장부**입니다.  
- 이 README는 발표자료에서 \"핵심 로직\"을 설명할 때 사용할 요약본입니다.  
- 세부 내용은 `services/erp-api/GUIDE.md`에서 확인할 수 있습니다.

---

### 2. 서비스 역할 (한눈에)

- **포트 4002**, Nest.js 기반 **ERP 서비스**  
- 핵심 책임
  - 입고(Receiving) 등록/조회/확인
  - 정산(Settlement) 처리
  - 입고확인·정산 완료 시 **신용평가 엔진 호출 + WebSocket 알림 트리거**

한 줄로 정리하면:

> \"**입고/정산 상태 변화 → 신용점수 재계산 → 은행 대시보드 실시간 반영**\"까지의 파이프라인을 한 번에 책임지는 서비스입니다.

---

### 3. 입고확인 전체 흐름 (발표용)

1. 마트 사용자가 `admin-web` 입고 화면에서 \"입고확인\" 버튼 클릭  
2. `PATCH /api/receivings/:id/confirm` 요청 → Gateway → `erp-api`  
3. `receiving.service.confirmReceiving()` 에서:
   - SELECT … FOR UPDATE (비관적 잠금)  
   - 상태 `pending → confirmed` 로 변경, 감사 로그 기록  
   - 트랜잭션 커밋 후 Bull Queue에 `rescore` job 생성  
4. Queue Worker(`credit-score.processor.ts`)가 job을 꺼내서  
   - `engine-api:8000/api/v10/score` 로 HTTP 요청  
   - Python 엔진이 점수/등급 계산 후 DB에 저장  
5. `NotificationGateway` 가 WebSocket으로 은행 사용자에게 `receiving:confirmed` 이벤트 전송  
6. 은행 대시보드 화면이 자동 새로고침 없이 최신 상태로 갱신

이 한 로직이 ItaDX 아키텍처의 **DX 가치**를 가장 잘 보여주는 시나리오입니다.

---

### 4. 주요 도메인

- `src/receiving/*` : 입고 엔드포인트/서비스/DTO
  - `GET /receivings` : 필터링·페이지네이션이 적용된 입고 목록
  - `PATCH /receivings/:id/confirm` : ★ 입고확인 트랜잭션
- `src/settlement/*` : 정산 완료 처리 (입고확인과 동일 패턴으로 추후 확장)
- `src/queue/credit-score.processor.ts` : Bull Queue Worker, Python 엔진 호출
- `src/app.module.ts` : TypeORM + Bull + WebSocket 설정

---

### 5. 기술 포인트

- **트랜잭션 + 비관적 잠금**
  - `SERIALIZABLE` 격리 수준 + `SELECT ... FOR UPDATE`  
  - 두 사용자가 동시에 같은 입고건을 확인하는 사례를 원천 차단

- **Bull Queue (Redis)**
  - 신용점수 계산은 2~5초 소요 → API 응답과 분리  
  - 최대 3번 재시도, 지수 백오프(5s → 10s → 20s)

- **WebSocket 알림**
  - `libs/websocket`의 `NotificationGateway` 사용  
  - 은행 전용 room(`bank`)에만 이벤트를 push하여 역할별 실시간 알림 구현

---

### 6. 발표에서 어떻게 설명할지

1. **아키텍처 그림**에서 `erp-api`를 중앙에 두고,  
   - 왼쪽: admin-web (입고확인 버튼)  
   - 오른쪽: engine-api (신용평가), 아래: PostgreSQL/Redis  
2. 위의 \"입고확인 전체 흐름\" 6단계를 단계별로 짚어 주면  
   - 단순 CRUD가 아니라 **트랜잭션·큐·실시간 알림이 결합된 DX 시나리오**임을 강조할 수 있습니다.

