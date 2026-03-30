# 세션 타임아웃 경고 모달 디자인 가이드

## 개요

30분 유휴 타임아웃 시 표시되는 경고 모달의 디자인 스펙. 기존 모달 패턴(modal-overlay + modal-card)을 따르되, 경고 성격에 맞는 시각적 강조를 추가한다.

---

## 1. 모달 오버레이

기존 패턴 그대로 사용:

```css
.session-timeout-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  z-index: 2000; /* 기존 모달(z-index: 1000)보다 높게 */
  display: flex;
  align-items: center;
  justify-content: center;
}
```

- z-index: 2000 -- 다른 모달 위에 표시되어야 하므로 기존 1000보다 높게 설정
- overlay 클릭 시 아무 동작 없음 (실수 방지)

---

## 2. 모달 카드

```css
.session-timeout-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  padding: 28px 32px;
  width: 360px;
  max-width: 90vw;
  text-align: center;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
```

- 글래스 엣지 패턴 적용 (inset shadow)
- 중앙 정렬 레이아웃
- 폭 360px, 모바일 대응 max-width: 90vw

---

## 3. 경고 아이콘

```css
.session-timeout-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: rgba(245, 158, 11, 0.1); /* --color-warning 기반 */
}
.session-timeout-icon svg {
  color: var(--color-warning);
}
```

- Icon 컴포넌트의 `warning-triangle` 사용, size 24
- 원형 배경으로 아이콘 강조

---

## 4. 텍스트

```css
.session-timeout-title {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.session-timeout-desc {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin: 0 0 24px;
  line-height: 1.5;
}
```

- 제목: "세션 만료 경고" -- var(--text-lg), 700
- 설명: "활동이 없어 곧 자동 로그아웃됩니다." -- var(--text-sm), var(--text-muted)

---

## 5. 카운트다운

```css
.session-timeout-countdown {
  font-family: var(--font-mono);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-warning);
  margin: 0 0 24px;
  letter-spacing: 2px;
  transition: color 0.3s;
}

.session-timeout-countdown.urgent {
  color: var(--color-danger);
}
```

- 모노스페이스 폰트로 카운트다운 표시 (MM:SS)
- 기본: var(--color-warning) 앰버
- 60초 이하: var(--color-danger) 빨간색으로 전환 (.urgent 클래스)
- font-size: var(--text-2xl) = 28px

---

## 6. 버튼 영역

```css
.session-timeout-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.session-timeout-actions .btn-ghost {
  flex: 1;
}

.session-timeout-actions .btn-primary {
  flex: 1;
}
```

- "로그아웃" -- btn-ghost (좌측)
- "세션 연장" -- btn-primary (우측)
- 두 버튼 동일 너비 (flex: 1)

---

## 7. 진입/퇴장 애니메이션

```css
.session-timeout-enter-active {
  transition: opacity 0.2s;
}
.session-timeout-enter-active .session-timeout-card {
  transition: transform 0.2s, opacity 0.2s;
}
.session-timeout-enter-from {
  opacity: 0;
}
.session-timeout-enter-from .session-timeout-card {
  transform: scale(0.95);
  opacity: 0;
}

.session-timeout-leave-active {
  transition: opacity 0.15s;
}
.session-timeout-leave-to {
  opacity: 0;
}
```

- Vue Transition name="session-timeout" 사용
- 진입: 오버레이 fade-in + 카드 scale(0.95) -> scale(1)
- 퇴장: 전체 fade-out

---

## 8. HTML 구조 (template)

```html
<Teleport to="body">
  <Transition name="session-timeout">
    <div v-if="visible" class="session-timeout-overlay">
      <div class="session-timeout-card">
        <div class="session-timeout-icon">
          <Icon name="warning-triangle" :size="24" />
        </div>
        <h3 class="session-timeout-title">세션 만료 경고</h3>
        <p class="session-timeout-desc">
          활동이 없어 곧 자동 로그아웃됩니다.
        </p>
        <div
          class="session-timeout-countdown"
          :class="{ urgent: remainingSeconds <= 60 }"
        >
          {{ formattedTime }}
        </div>
        <div class="session-timeout-actions">
          <button class="btn-ghost" @click="$emit('logout')">
            로그아웃
          </button>
          <button class="btn-primary" @click="$emit('extend')">
            세션 연장
          </button>
        </div>
      </div>
    </div>
  </Transition>
</Teleport>
```

---

## 9. 수정 대상 파일 목록

| 파일 | 작업 |
|------|------|
| **client/src/components/SessionTimeoutWarning.vue** | [신규] 경고 모달 컴포넌트 |
| **client/src/composables/useIdleTimeout.ts** | [신규] 유휴 타이머 composable |
| client/src/App.vue | composable 통합 + 모달 렌더링 |

---

## 10. 디자인 결정 요약

| 항목 | 결정 |
|------|------|
| 아이콘 배경 | 원형, rgba warning 10% 배경 |
| 카운트다운 폰트 | var(--font-mono), var(--text-2xl) |
| 긴급 색상 전환 | 60초 이하에서 warning -> danger |
| z-index | 2000 (기존 모달 1000 위) |
| 버튼 배치 | 좌: 로그아웃(ghost), 우: 연장(primary) |
| overlay 클릭 | 무시 (명시적 선택 강제) |
| 모달 폭 | 360px (max-width: 90vw) |