# Client 개발 가이드

## 기술 스택

| 항목 | 버전 |
|------|------|
| Vue 3 (Composition API) | ^3.4.0 |
| Pinia (상태 관리) | ^2.1.7 |
| Vue Router | ^4.3.0 |
| Vite | ^5.0.0 |
| D3 (그래프 시각화) | ^7.9.0 |
| Axios | ^1.7.0 |
| TypeScript | ^5.5.3 |

## 개발 서버 실행

```bash
# 루트에서
npm run dev:client

# 또는 workspace 직접 지정
npm run dev --workspace=client
```

접속 URL: `http://localhost:5173`

API 요청은 `/api` prefix로 `http://localhost:3001`에 프록시됨 (vite.config.ts)

## 디렉토리 구조

```
client/src/
├── main.ts                        # 엔트리 포인트
├── App.vue                        # 루트 컴포넌트
├── router/
│   └── index.ts                  # 라우트 정의 및 인증 가드
├── views/
│   ├── HeroView.vue              # 랜딩 페이지
│   ├── LoginView.vue             # 로그인
│   ├── RegisterView.vue          # 회원가입
│   ├── ProjectsView.vue          # 프로젝트 목록
│   └── ProjectView.vue           # 프로젝트 상세 (그래프)
├── components/
│   ├── GraphCanvas.vue           # D3 그래프 캔버스 (핵심)
│   ├── ServerPanel.vue           # 좌측 노드 목록 패널
│   ├── ImpactPanel.vue           # 우측 상세/영향도 패널
│   ├── ServerModal.vue           # 서버 추가/수정 모달
│   ├── L7Modal.vue               # L7 로드밸런서 모달
│   ├── InfraModal.vue            # 인프라 노드 모달
│   ├── ExternalServiceModal.vue  # 외부 서비스 모달
│   ├── DependencyModal.vue       # 의존성 추가 모달
│   ├── CustomSelect.vue          # 공용 셀렉트
│   ├── CustomCombobox.vue        # 공용 콤보박스
│   └── IpInput.vue              # IP 입력 컴포넌트
├── stores/
│   ├── graph.ts                  # 그래프 노드/엣지 상태
│   ├── project.ts                # 프로젝트 상태
│   └── auth.ts                   # 인증 상태
├── api/
│   ├── http.ts                   # Axios 인스턴스 (interceptor 포함)
│   ├── authApi.ts                # 인증 API
│   ├── projectApi.ts             # 프로젝트 API
│   └── graphApi.ts               # 그래프 데이터 API
├── composables/
│   └── useApi.ts                 # API 호출 훅
├── types/
│   └── index.ts                  # 공용 타입 정의
└── data/
    └── sampleData.ts             # 샘플 데이터
```

## 라우트

| 경로 | 컴포넌트 | 인증 필요 |
|------|----------|-----------|
| `/` | HeroView | X |
| `/login` | LoginView | X |
| `/register` | RegisterView | X |
| `/projects` | ProjectsView | O |
| `/projects/:id` | ProjectView | O |

- `meta.requiresAuth` 로 인증 가드 적용
- 미인증 접근 시 `/login` 리다이렉트
- 로그인 상태에서 `/login`, `/register` 접근 시 `/projects` 리다이렉트

## 상태 관리 (Pinia)

### graph.ts
그래프의 핵심 상태를 관리한다. 서버/L7/인프라/외부서비스 노드와 의존성 엣지를 저장하며, Undo/Redo 스냅샷 기능을 포함한다.

주요 함수:
- `findPath(sourceId, targetId)` - BFS 경로 탐색 (L7 멤버 확장 포함)
- `getImpactedNodes(nodeId)` - 영향 범위 탐색
- `getCycleNodes()` - 순환 참조 탐지
- `undo()` / `redo()` - 작업 취소/재실행

### project.ts
현재 선택된 프로젝트 정보와 목록을 관리한다.

### auth.ts
로그인 유저 정보와 토큰 상태를 관리한다.

## 노드 타입

```typescript
// types/index.ts 참고
Server       // nodeKind: 'server' - 일반 서버
L7Node       // nodeKind: 'l7'    - L7 로드밸런서 (memberServerIds 보유)
InfraNode    // nodeKind: 'infra' - DB, 캐시 등 인프라
ExternalServiceNode // nodeKind: 'external' - 외부 서비스/API
```

L7 노드는 `memberServerIds`로 하위 서버 목록을 가지며, 경로 탐색 시 멤버 서버까지 자동 확장된다.

## GraphCanvas 주요 기능

- D3 force simulation 기반 레이아웃
- 노드 드래그 이동 / 줌 패닝
- 우클릭 컨텍스트 메뉴 (노드 / 빈 공간 구분)
- 더블클릭 노드 추가 메뉴
- 경로 탐색 모드 (출발 노드 → 도착 노드)
- 영향도 분석 하이라이트
- 미니맵
- PNG / SVG 내보내기 (배경 투명 옵션 포함)
- Undo / Redo (Cmd+Z / Cmd+Shift+Z)

## 빌드

```bash
npm run build --workspace=client
# 결과물: client/dist/
```

타입 체크만 실행:
```bash
cd client && npx vue-tsc --noEmit
```
