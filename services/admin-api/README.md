# 📊 admin-api — 관리 서비스 (마트/지점/가맹점 CRUD)

> **담당**: 백엔드 개발자
> **WAS**: Nest.js 10
> **포트**: 4000
> **DB 통신**: TypeORM → PostgreSQL

## 📡 DB 통신 방식 — 실제 코드로 설명

### TypeORM이 JS 객체를 SQL로 변환하는 과정
```
[Controller] → [Service] → [Repository] → [PostgreSQL]
  요청 받음      비즈니스 로직   ORM 변환       실제 저장
```

### 실제 코드: `src/mart/mart.service.ts`
```typescript
// 마트 목록 조회 — JS 코드가 SQL로 자동 변환됨
async findAll(query) {
  const [items, total] = await this.martRepo.findAndCount({
    where: search ? { name: Like(`%${search}%`) } : {},
    order: { [sortBy]: sortOrder },
    skip: (page - 1) * limit,
    take: limit,
  });
  // ↑ TypeORM이 아래 SQL로 자동 변환:
  // SELECT * FROM marts
  // WHERE name LIKE '%검색어%'
  // ORDER BY created_at DESC
  // LIMIT 20 OFFSET 0
}
```

### 실제 코드: `src/mart/mart.controller.ts`
```typescript
@Get()                           // GET /api/marts
@Roles('bank', 'admin')         // 은행/관리자만 접근 가능
async findAll(@Query() query) {  // ?page=1&limit=20&search=이타
  const result = await this.martService.findAll(query);
  return createPaginatedResponse(result.items, result.total, ...);
  // → { success: true, data: [...], meta: { page: 1, total: 50 } }
}
```

### 다른 서비스와의 통신 (MSA 규칙)
```
❌ 금지: admin-api가 receivings 테이블 직접 SELECT
✅ 올바른 방법: HTTP로 erp-api에 요청
   const { data } = await axios.get('http://erp-api:4002/api/receivings?martId=xxx');
```

## 📁 실제 코드 파일 위치
```
src/mart/mart.controller.ts    ← GET/POST/PATCH/DELETE /api/marts
src/mart/mart.service.ts       ← DB 조회/저장 로직 (TypeORM)
src/mart/dto/create-mart.dto.ts ← 사업자번호 형식 검증 (123-45-67890)
src/branch/branch.controller.ts ← GET/POST /api/branches
src/merchant/merchant.service.ts ← 가맹점 CRUD + 중복 사업자번호 체크
src/dashboard/dashboard.service.ts ← KPI 집계 (COUNT, SUM 쿼리)
src/user/user.service.ts       ← 사용자 생성 (bcrypt 해싱)
```
