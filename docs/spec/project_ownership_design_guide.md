# 프로젝트 소유/공유 구분 - 디자인 가이드

> UX 기획서(`docs/project_ownership_ux_spec.md`)에 대한 디자인 결정 문서.
> 개발 에이전트는 이 문서의 스펙을 그대로 따라 구현할 것.

---

## 제약 조건 (필수)

- 모든 색상은 `style.css`의 CSS 변수 사용 (하드코딩 금지)
- 이모지 사용 금지
- 기존 카드 레이아웃(좌측 그래프 88px + 우측 콘텐츠)의 기본 구조 유지
- role-badge 디자인 시스템은 기존 것을 그대로 사용
- 수정 파일: `client/src/views/ProjectsView.vue` (프론트엔드만)

---

## 1. 섹션 헤더 스타일

### 확정 스펙

```
프로젝트                              [+ 새 프로젝트]
                                                      ← 20px gap
내 프로젝트 (3)
                                                      ← 12px gap
┌─────────┐ ┌─────────┐ ┌─────────┐
│  카드    │ │  카드    │ │  카드    │
└─────────┘ └─────────┘ └─────────┘
                                                      ← 32px gap
공유받은 프로젝트 (2)
                                                      ← 12px gap
┌─────────┐ ┌─────────┐
│  카드    │ │  카드    │
└─────────┘ └─────────┘
```

### 섹션 헤더 CSS

```css
.section-header {
  font-size: var(--text-sm);    /* 13px */
  font-weight: 600;
  color: var(--text-tertiary);  /* #787878 */
  margin: 0 0 12px 0;
  padding: 0;
  /* 좌측 2px 앰버 바 추가 — 기존 앱의 섹션 타이틀 패턴과 통일 */
  padding-left: 10px;
  border-left: 2px solid var(--accent-primary);  /* #d97706 */
}
```

### 위계 근거

- 페이지 제목 "프로젝트": `--text-xl`(20px), weight 700, `--text-primary`
- 섹션 헤더 "내 프로젝트 (3)": `--text-sm`(13px), weight 600, `--text-tertiary`
- 충분한 사이즈 차이(20px vs 13px)와 색상 차이(`#f0f0f0` vs `#787878`)로 위계가 명확
- 좌측 2px 앰버 바는 프로젝트 설정 페이지의 섹션 구분 패턴과 동일하여 앱 전체 일관성 유지

### 간격

```css
.section-group {
  margin-bottom: 32px;  /* 섹션 간 간격 */
}
.section-group:last-child {
  margin-bottom: 0;
}
```

- `projects-top`(제목 + 버튼)과 첫 번째 섹션 헤더 사이: 기존 `margin-bottom: 28px` 유지 (이미 적절)

---

## 2. 공유 아이콘: 옵션 C 선택 (아이콘 없음)

### 결정: 섹션 분리만으로 충분, 공유 아이콘 불필요

이유:
- 섹션 헤더("내 프로젝트" / "공유받은 프로젝트")가 이미 명확한 구분을 제공
- 12x12 아이콘은 88px 그래프 패널 안에서 너무 작아 인지 효과가 미미
- 아이콘 추가 시 그래프 SVG 위에 겹쳐 시각적 노이즈만 증가
- "소유자명" 표시(아래 3번)가 카드 레벨에서의 추가 힌트 역할을 이미 수행

따라서 `project-card-graph` 영역은 내 프로젝트/공유 프로젝트 모두 동일하게 유지한다.

---

## 3. 공유 프로젝트 카드 - 소유자 표시

### 변경 전 (모든 카드 동일)

```
[편집자]                    멤버 3명  2024. 3. 15.
```

### 변경 후 (공유 프로젝트 카드만)

```
[편집자]  홍길동              멤버 3명  2024. 3. 15.
```

### 소유자명 표시 형식: `홍길동` (이름만)

- "님" 접미사 불필요 — 카드 UI에서 경어는 과도하며 공간 낭비
- "@" 접두사 불필요 — SNS 멘션 컨텍스트가 아님
- 단순히 username만 표시하는 것이 가장 깔끔

### CSS

```css
.project-owner {
  font-size: var(--text-xs);    /* 11px */
  color: var(--text-disabled);  /* #525252 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;              /* 긴 이름 잘림 방지 */
}
```

### HTML 위치

role-badge 바로 오른쪽, `project-members` 왼쪽. 기존 `gap: 8px`으로 자연스럽게 분리.

```html
<div class="project-meta">
  <span class="role-badge ...">편집자</span>
  <span v-if="!isOwnProject(project)" class="project-owner">{{ ownerName(project) }}</span>
  <span class="project-members">멤버 {{ project.members.length }}명</span>
  <span class="project-date">{{ formatDate(project.updatedAt) }}</span>
</div>
```

`project-members`의 `margin-left: auto`는 기존 유지 — 소유자명이 추가되어도 멤버 수/날짜는 우측 정렬 유지.

---

## 4. 공유 프로젝트 카드 hover 색상

### 결정: 내 프로젝트와 동일한 hover 유지

이유:
- 카드는 "클릭하면 프로젝트에 진입한다"는 동일한 행위를 함
- hover 색상으로 소유/공유를 구분하면 "왜 이 카드는 hover가 다르지?"라는 불필요한 인지 부하 발생
- 소유/공유 구분은 섹션 분리와 소유자명 표시로 이미 달성됨
- hover는 인터랙션 피드백이지 분류 수단이 아님

따라서 기존 hover 스타일 그대로 유지:

```css
.project-card:hover {
  border-color: var(--accent-focus);
  background: var(--accent-bg-subtle);
  box-shadow: 0 8px 28px rgba(0,0,0,0.45), 0 0 0 1px rgba(217,119,6,0.08);
}
```

---

## 5. 섹션 접기/펼치기

### 결정: 현 단계에서 미포함

이유:
- 프로젝트 수가 10개 미만인 초기 단계에서 접기/펼치기는 오버엔지니어링
- 접기 상태를 localStorage에 저장해야 하는 등 구현 복잡도 대비 가치가 낮음
- 추후 프로젝트 수가 10개 이상인 사용자가 많아지면 그때 추가 검토

---

## 6. 빈 공유 섹션 처리

### 결정: 공유받은 프로젝트가 0건이면 섹션 자체를 숨김

이유:
- "공유받은 프로젝트가 없습니다"라는 빈 상태 메시지는 정보가 아니라 노이즈
- 사용자가 아직 초대를 받지 않은 상태에서 매번 이 문구를 보는 것은 불필요
- 공유 프로젝트가 생기면 섹션이 자연스럽게 나타남

### 빈 상태 로직 정리

```
if (myProjects.length === 0 && sharedProjects.length === 0)
  → 기존 empty state 표시 ("아직 프로젝트가 없습니다")

if (myProjects.length === 0 && sharedProjects.length > 0)
  → "내 프로젝트" 섹션에 empty state 표시, "공유받은 프로젝트" 섹션은 정상 렌더
  → empty state: "아직 프로젝트가 없습니다 / [첫 번째 프로젝트 만들기]"
  → 기존 큰 SVG 일러스트 대신, 간결한 텍스트 + 버튼만 (섹션 내부이므로)

if (myProjects.length > 0 && sharedProjects.length === 0)
  → "내 프로젝트" 섹션만 표시, "공유받은 프로젝트" 섹션 숨김

if (myProjects.length > 0 && sharedProjects.length > 0)
  → 두 섹션 모두 표시
```

### "내 프로젝트" 섹션 내부 empty state (공유만 있을 때)

```css
.section-empty {
  padding: 24px 0;
  text-align: center;
}
.section-empty-text {
  font-size: var(--text-sm);
  color: var(--text-disabled);
  margin: 0 0 12px 0;
}
```

```html
<div class="section-empty">
  <p class="section-empty-text">아직 직접 만든 프로젝트가 없습니다</p>
  <button class="btn-new" @click="showCreate = true">첫 번째 프로젝트 만들기</button>
</div>
```

---

## 7. 정렬 규칙

각 섹션 내부: `updatedAt` 내림차순 (최근 수정이 위로).

```typescript
const myProjects = computed(() =>
  projectStore.projects
    .filter(p => p.ownerId === auth.user?.id)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
)

const sharedProjects = computed(() =>
  projectStore.projects
    .filter(p => p.ownerId !== auth.user?.id)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
)
```

---

## 8. 스켈레톤 로딩

기존과 동일. 로딩 중에는 섹션 구분 없이 스켈레톤 4개 표시. 데이터 로드 완료 후 섹션 분리.

---

## 9. 구현 요약

### 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `client/src/views/ProjectsView.vue` | template: 섹션 분리, 소유자명 표시 / script: computed 추가, ownerName 함수 / style: 섹션 헤더, 소유자명 CSS 추가 |

### template 구조 (v-else 분기 교체)

```html
<!-- 기존 단일 projects-grid를 아래로 교체 -->
<template v-else>
  <!-- 내 프로젝트 섹션 -->
  <div class="section-group">
    <h2 class="section-header">내 프로젝트 ({{ myProjects.length }})</h2>
    <div v-if="myProjects.length > 0" class="projects-grid">
      <div
        v-for="project in myProjects"
        :key="project.id"
        class="project-card"
        @click="router.push({ name: 'project', params: { id: project.id } })"
      >
        <!-- 기존 카드 내용 동일 (그래프 패널 + 콘텐츠) -->
        <!-- project-meta에서 소유자명 미표시 -->
      </div>
    </div>
    <div v-else class="section-empty">
      <p class="section-empty-text">아직 직접 만든 프로젝트가 없습니다</p>
      <button class="btn-new" @click="showCreate = true">첫 번째 프로젝트 만들기</button>
    </div>
  </div>

  <!-- 공유받은 프로젝트 섹션 (0건이면 숨김) -->
  <div v-if="sharedProjects.length > 0" class="section-group">
    <h2 class="section-header">공유받은 프로젝트 ({{ sharedProjects.length }})</h2>
    <div class="projects-grid">
      <div
        v-for="project in sharedProjects"
        :key="project.id"
        class="project-card"
        @click="router.push({ name: 'project', params: { id: project.id } })"
      >
        <!-- 기존 카드 내용 동일 -->
        <!-- project-meta에 소유자명 추가 표시 -->
      </div>
    </div>
  </div>
</template>
```

### script 추가

```typescript
const myProjects = computed(() =>
  projectStore.projects
    .filter(p => p.ownerId === auth.user?.id)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
)

const sharedProjects = computed(() =>
  projectStore.projects
    .filter(p => p.ownerId !== auth.user?.id)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
)

function isOwnProject(project: { ownerId: string }): boolean {
  return project.ownerId === auth.user?.id
}

function ownerName(project: { members: { role: string; user: { username: string } }[] }): string {
  const master = project.members.find(m => m.role === 'MASTER')
  return master?.user.username ?? ''
}
```

### style 추가

```css
.section-group {
  margin-bottom: 32px;
}
.section-group:last-child {
  margin-bottom: 0;
}
.section-header {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-tertiary);
  margin: 0 0 12px 0;
  padding-left: 10px;
  border-left: 2px solid var(--accent-primary);
}
.project-owner {
  font-size: var(--text-xs);
  color: var(--text-disabled);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}
.section-empty {
  padding: 24px 0;
  text-align: center;
}
.section-empty-text {
  font-size: var(--text-sm);
  color: var(--text-disabled);
  margin: 0 0 12px 0;
}
```

### 주의사항

- 카드 컴포넌트를 분리하지 말 것. 기존처럼 인라인으로 유지하되, 카드 내부 HTML이 두 번 반복되므로 중복이 생김. 이를 피하려면 `<template>` 내에서 카드 부분을 별도 함수형 슬롯이나 v-for 내 조건부로 처리할 수 있으나, 현재 구조상 단순 복사가 가장 안전. 추후 카드를 별도 컴포넌트로 분리하는 것은 이 작업의 범위 밖.
- `projectStore.projects` 배열에 `ownerId` 필드가 포함되어 있는지 확인 필요. API 응답에 이미 포함되어 있다면 바로 사용, 아니라면 API 타입 정의에 추가.