# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

서버 인프라의 의존성(서버 간 연결 관계)을 시각화하고 관리하는 웹 애플리케이션.
프로젝트별로 멤버를 초대하고, D3 기반 그래프로 서버 토폴로지를 편집/공유한다.

## Commands

```bash
# 의존성 설치
npm install

# 개발 서버 (프론트엔드 :5173, 백엔드 :3001)
npm run dev:client
npm run dev:server

# 빌드
npm run build                          # 전체 (client + server)
npm run build --workspace=client       # client만
npm run build --workspace=server       # server만

# 타입 체크 (client)
cd client && npx vue-tsc --noEmit

# DB (Docker PostgreSQL)
docker-compose up -d                   # 시작
docker-compose down                    # 중지

# Prisma (server 워크스페이스)
npm run db:migrate --workspace=server  # 마이그레이션 생성/적용
npm run db:generate --workspace=server # Prisma Client 재생성
npm run db:studio --workspace=server   # DB GUI
```

테스트 프레임워크: `@playwright/test` (루트 devDependencies). 테스트 파일은 아직 없음.

## Architecture

npm workspaces 모노레포: `client/` (Vue 3 SPA) + `server/` (Express API).

### Client (`client/`)
- **Vue 3 Composition API** + TypeScript, **Vite** 빌드
- **Pinia** 상태 관리: `graph.ts` (노드/엣지/undo-redo), `project.ts`, `auth.ts`
- **D3.js** force simulation으로 그래프 렌더링 (`GraphCanvas.vue` — 핵심 컴포넌트)
- API 호출: `api/http.ts`의 Axios 인스턴스 (interceptor로 JWT 자동 첨부, 토큰 갱신)
- Vite dev proxy: `/api` -> `http://localhost:3001`

### Server (`server/`)
- **Express** + TypeScript, `ts-node-dev`로 개발 시 자동 재시작
- **Prisma ORM** + PostgreSQL
- 계층: `routes/` -> `controllers/` -> `services/`
- JWT 인증: Access Token(15분) + Refresh Token(30일, Session 테이블)
- `cryptoService.ts`: AES-256-GCM으로 민감 데이터(email, username) 암호화 저장, HMAC-SHA256 해시로 조회
- 로깅: Winston
- 역할 기반 접근 제어: `MASTER > ADMIN > WRITER > READONLY`

### Graph Data Model
노드 4종: `server`, `l7` (로드밸런서), `infra` (DB/캐시), `external` (외부 서비스), `dns`
L7 노드는 `memberServerIds`로 하위 서버를 참조하며, 경로 탐색 시 멤버까지 자동 확장.
그래프 데이터는 `GraphData.data` (JSON)에 암호화되어 저장, `positions`는 별도 JSON 필드.
낙관적 잠금: `GraphData.version` 필드로 동시 편집 충돌 감지.

## 개발 가이드 문서
- [Client 개발 가이드](docs/guide/client.md) — Vue 3, Pinia, D3, 라우트, 상태 관리
- [Server 개발 가이드](docs/guide/server.md) — Express, Prisma, JWT, API 엔드포인트
- [스타일 가이드](docs/guide/style_guide.md) — CSS 변수 시스템, 색상, 폰트, 컴포넌트 패턴

## Code Style Rules

- **스타일 가이드는 필수**. UI 변경 시 `docs/guide/style_guide.md`도 함께 수정할 것
- 이모지 사용 금지
- **UI 색상 하드코딩 금지** — 반드시 `client/src/style.css`의 CSS 변수(`var(--)`) 사용
- JS/TS에서 색상이 필요한 경우 `getComputedStyle(document.documentElement).getPropertyValue(name)` 으로 CSS 변수를 읽을 것
- 버튼은 `style.css`의 글로벌 클래스(`.btn-primary`, `.btn-ghost`, `.btn-danger` 등) 사용. scoped에서 외형 재정의 금지 (레이아웃 속성만 허용)
- SVG 아이콘은 `Icon.vue` 컴포넌트 사용 (반복 사용되는 기능적 아이콘만. 장식용/일회용은 인라인)
- native `<select>` 대신 `CustomSelect` 컴포넌트 사용
