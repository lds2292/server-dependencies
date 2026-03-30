# Terraform Import 디자인 가이드

## 개요

Terraform state 파일을 업로드하여 그래프로 변환하는 2단계 모달(업로드 -> 미리보기)의 디자인 스펙.

---

## 1. 모달 컨테이너

기존 모달 패턴(ServerModal.vue 등)과 동일한 구조를 따른다.

```css
.tf-modal-backdrop {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.tf-modal {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 10px;
  padding: 0;
  width: 580px;
  max-width: 90vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
```

### 모달 헤더

```css
.tf-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
}

.tf-modal-title {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.tf-modal-close {
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.15s;
}

.tf-modal-close:hover {
  color: var(--text-secondary);
}
```

### 모달 본문 (스크롤 영역)

```css
.tf-modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}
```

### 모달 푸터

```css
.tf-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-subtle);
}
```

---

## 2. Step 1: 파일 업로드 화면

### 드래그앤드롭 영역

```html
<div :class="['tf-dropzone', { 'tf-dropzone-active': dragOver }]">
  <div class="tf-dropzone-icon">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <polyline points="17 8 12 3 7 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  </div>
  <div class="tf-dropzone-text">.tfstate 파일을 드래그하거나 클릭하여 선택</div>
  <div class="tf-dropzone-hint">JSON 형식, 최대 10MB</div>
  <input type="file" accept=".tfstate,.json" class="tf-dropzone-input" />
</div>
```

```css
.tf-dropzone {
  border: 2px dashed var(--border-default);
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s;
  background: var(--bg-base);
}

.tf-dropzone:hover {
  border-color: var(--border-strong);
}

.tf-dropzone-active {
  border-color: var(--accent-focus);
  background: var(--accent-bg-subtle);
}

.tf-dropzone-icon {
  color: var(--text-disabled);
  margin-bottom: 12px;
}

.tf-dropzone-active .tf-dropzone-icon {
  color: var(--accent-soft);
}

.tf-dropzone-text {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin-bottom: 6px;
}

.tf-dropzone-hint {
  font-size: var(--text-xs);
  color: var(--text-disabled);
}

.tf-dropzone-input {
  display: none;
}
```

### 에러 메시지

```css
.tf-error {
  margin-top: 12px;
  padding: 10px 12px;
  background: var(--color-danger-surface);
  border: 1px solid var(--color-danger-border);
  border-radius: 6px;
  color: var(--color-danger-muted);
  font-size: var(--text-sm);
}
```

---

## 3. Step 2: 미리보기 화면

### 요약 바

```css
.tf-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--accent-bg-subtle);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-bottom: 16px;
}

.tf-summary-divider {
  width: 1px;
  height: 12px;
  background: var(--border-default);
}
```

### 경고 영역

경고가 있을 때만 표시.

```css
.tf-warnings {
  margin-bottom: 16px;
}

.tf-warnings-header {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-warning);
  margin-bottom: 6px;
  padding-left: 10px;
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tf-warnings-header::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  border-radius: 1px;
  background: var(--color-warning);
}

.tf-warning-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tf-warning-item {
  padding: 6px 10px;
  background: var(--bg-base);
  border-radius: 4px;
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.tf-warning-item.warn {
  color: var(--color-warning-light);
}
```

### 노드 목록 섹션

```css
.tf-section {
  margin-bottom: 16px;
}

.tf-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.tf-section-title {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--text-primary);
}

.tf-section-count {
  font-weight: 400;
  color: var(--text-tertiary);
  margin-left: 4px;
}

.tf-select-all {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: color 0.15s;
}

.tf-select-all:hover {
  color: var(--text-secondary);
}
```

### 노드 리스트 아이템

```html
<label class="tf-node-item">
  <input type="checkbox" v-model="node.selected" />
  <span :class="['tf-node-badge', `tf-badge-${node.nodeKind}`]">{{ badgeLabel }}</span>
  <span class="tf-node-name">{{ node.name }}</span>
  <span class="tf-node-meta">{{ node.tfResourceKey.split('.')[0] }}</span>
  <span v-if="node.internalIps?.length" class="tf-node-ip">{{ node.internalIps[0] }}</span>
</label>
```

```css
.tf-node-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 200px;
  overflow-y: auto;
}

.tf-node-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.1s;
  font-size: var(--text-sm);
}

.tf-node-item:hover {
  background: var(--bg-elevated);
}

.tf-node-item input[type="checkbox"] {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  cursor: pointer;
  accent-color: var(--accent-focus);
}

.tf-node-badge {
  font-size: var(--text-xs);
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 999px;
  flex-shrink: 0;
  letter-spacing: 0.3px;
}

/* 노드 타입별 뱃지 */
.tf-badge-server {
  color: var(--node-srv-color);
  background: var(--node-srv-bg);
}

.tf-badge-l7 {
  color: var(--node-l7-text);
  background: var(--node-l7-bg);
}

.tf-badge-infra {
  color: var(--node-infra-text);
  background: var(--node-infra-bg);
}

.tf-badge-dns {
  color: var(--node-dns-text);
  background: var(--node-dns-bg);
}

.tf-badge-external {
  color: var(--node-ext-text);
  background: var(--node-ext-bg);
}

.tf-node-name {
  color: var(--text-secondary);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.tf-node-meta {
  color: var(--text-disabled);
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  white-space: nowrap;
}

.tf-node-ip {
  color: var(--color-ip-text);
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  margin-left: auto;
  flex-shrink: 0;
}
```

### 의존성 리스트 아이템

```css
.tf-dep-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.1s;
  font-size: var(--text-sm);
}

.tf-dep-item:hover {
  background: var(--bg-elevated);
}

.tf-dep-source,
.tf-dep-target {
  color: var(--text-secondary);
  font-weight: 600;
}

.tf-dep-arrow {
  color: var(--text-disabled);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
}

.tf-dep-type {
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--text-tertiary);
  padding: 1px 6px;
  background: var(--bg-base);
  border-radius: 999px;
}

.tf-dep-reason {
  color: var(--text-disabled);
  font-size: var(--text-xs);
  margin-left: auto;
}
```

---

## 4. 가져오기 버튼 상태

푸터의 "가져오기" 버튼은 선택된 노드/의존성 수를 표시한다.

```html
<button class="btn-primary" :disabled="selectedCount === 0" @click="onImport">
  가져오기 ({{ selectedNodeCount }}노드, {{ selectedDepCount }}의존성)
</button>
```

선택 항목이 0개이면 disabled 상태.

---

## 5. 인터랙션 상세

### 파일 업로드 플로우
1. 드래그앤드롭 또는 클릭 -> 파일 선택
2. 파일 크기 검증 (10MB 초과 시 에러)
3. JSON 파싱 -> version 4 검증
4. parseTerraformState 호출
5. 성공 시 step = 'preview'로 전환
6. 실패 시 에러 메시지 표시

### 미리보기 플로우
1. 전체 선택/해제 토글
2. 개별 체크박스 토글
3. "가져오기" 클릭 -> 선택된 항목만 graph store에 반영
4. 반영 후 모달 닫힘

### 드래그 상태 변화
- dragenter/dragover: `tf-dropzone-active` 클래스 추가
- dragleave/drop: 클래스 제거
- drop 시 파일 처리

---

## 6. 빈 상태 / 에러 상태 디자인

에러 메시지는 `.tf-error` 클래스 사용 (위 CSS 참조).
경고는 `.tf-warning-item` 사용.

매핑 가능 노드가 0개인 경우:
```html
<div class="tf-empty">
  매핑 가능한 리소스가 없습니다. 지원하는 AWS 리소스 타입을 확인하세요.
</div>
```

```css
.tf-empty {
  text-align: center;
  padding: 32px 20px;
  color: var(--text-disabled);
  font-size: var(--text-sm);
}
```

---

## 7. 수정 대상 파일 목록

| 파일 | 작업 |
|------|------|
| **client/src/utils/terraformParser.ts** | 신규 -- 파싱 로직 |
| **client/src/components/TerraformImportModal.vue** | 신규 -- 모달 UI |
| client/src/views/ProjectView.vue | 드롭다운에 메뉴 추가, 모달 연동 |

---

## 8. 디자인 결정 요약

1. 모달 너비 580px -- 노드 목록 열이 4개(뱃지+이름+타입+IP)이므로 충분한 가로폭 필요
2. 드래그앤드롭 영역은 dashed border + bg-base 배경으로 입력 필드와 구분
3. 노드 타입 뱃지는 기존 노드 타입 색상 변수(--node-srv-*, --node-l7-* 등)를 재사용
4. 경고 영역은 섹션 타이틀 2px 세로선 패턴(color-warning) 적용
5. 리스트 max-height 200px + overflow-y auto로 스크롤 처리
6. 글로벌 버튼 클래스(btn-primary, btn-ghost) 사용, 커스텀 버튼 스타일 없음
