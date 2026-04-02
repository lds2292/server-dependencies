# 계정 비활성화 시 MASTER 프로젝트 처리 정책

## 배경
현재는 MASTER 역할인 프로젝트가 있으면 계정 비활성화가 차단된다.
사용자 경험을 개선하기 위해, 비활성화 시 자동으로 MASTER를 위임하거나 프로젝트를 보관 처리한다.

## 정책

### 케이스 1: 다른 멤버가 있는 프로젝트
- ADMIN > WRITER > READONLY 순으로 가장 높은 역할의 멤버에게 MASTER를 자동 위임
- 같은 역할이 여러 명이면 `joinedAt`이 가장 빠른 멤버에게 위임

### 케이스 2: 본인만 남은 프로젝트 (솔로 프로젝트)
- `Project.status`를 `ARCHIVED`로 전환하여 보관 처리
- 계정 유예 기간(30일) 내 재활성화 시 프로젝트도 함께 `ACTIVE`로 복구
- 유예 기간 만료 후 하드 딜리트 시 보관 프로젝트도 함께 삭제

## 구현 범위

### DB 스키마 변경
- `ProjectStatus` enum 추가: `ACTIVE`, `ARCHIVED`
- `Project.status` 필드 추가 (default: `ACTIVE`)
- 마이그레이션 생성

### Server 변경

**`authService.ts` — `deactivateAccount()`**
1. MASTER인 프로젝트 목록 조회
2. 각 프로젝트에 대해:
   - 다른 멤버 존재 → MASTER 위임 (역할 순위 → joinedAt 순) + 탈퇴 유저의 멤버십 삭제
   - 본인만 존재 → `project.status = ARCHIVED` + 멤버십 유지
3. 기존 비활성화 로직 진행 (status DEACTIVATED, 세션 삭제)

**`authService.ts` — `reactivateAccount()` / `reactivateAccountWithOAuth()`**
- 재활성화 시 `ARCHIVED` 프로젝트 중 해당 유저가 MASTER인 것을 `ACTIVE`로 복구

**`projectService.ts`**
- 프로젝트 목록 조회 시 `ARCHIVED` 프로젝트 제외 (기존 쿼리에 `status: ACTIVE` 조건 추가)

### Client 변경

**`AccountView.vue`**
- MASTER_ROLE_EXISTS 에러 핸들링 제거 (더 이상 발생하지 않음)
- 비활성화 확인 다이얼로그에 자동 위임/보관 안내 문구 추가
