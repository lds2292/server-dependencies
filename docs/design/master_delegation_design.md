# Master 권한 위임 디자인 가이드

## 개요

프로젝트 설정 페이지의 위험 영역 섹션에 "마스터 권한 위임" 항목과 확인 모달을 추가한다.
기존 위험 영역(`.danger-zone`, `.danger-item`)과 삭제 확인 모달(`.delete-overlay`, `.delete-dialog`) 패턴을 그대로 재사용한다.

---

## 1. 위험 영역 내 위임 항목

프로젝트 삭제 항목 **위**에 권한 위임 항목을 추가한다.
기존 `.danger-item` 패턴을 동일하게 사용하며, 두 항목 사이에 구분선을 추가한다.

### HTML 구조

```html
<!-- 위험 영역 섹션 내부 -->
<div class="danger-item">
  <div class="danger-desc">
    <span class="danger-label">마스터 권한 위임</span>
    <span class="danger-hint">다른 멤버에게 마스터 권한을 이전합니다. 기존 마스터는 Admin으로 변경됩니다.</span>
  </div>
  <button class="btn-danger" @click="showTransferConfirm = true"
    :disabled="transferableMembers.length === 0"
    :title="transferableMembers.length === 0 ? '위임할 멤버가 없습니다.' : ''">
    권한 위임
  </button>
</div>
<div class="danger-divider"></div>
<div class="danger-item">
  <!-- 기존 프로젝트 삭제 항목 -->
</div>
```

### CSS: 구분선

```css
.danger-divider {
  height: 1px;
  background: rgba(239, 68, 68, 0.15);
  margin: 16px 0;
}
```

### 비활성 버튼

`.btn-danger:disabled` 스타일은 기존 `.btn-save:disabled`와 동일한 패턴을 따른다.

```css
.btn-danger:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

---

## 2. 권한 위임 확인 모달

기존 삭제 확인 모달(`.delete-overlay`, `.delete-dialog`)의 구조를 그대로 재사용한다.
클래스명만 `transfer-` 접두어로 변경하여 구분한다.

### HTML 구조

```html
<transition name="toast-fade">
  <div v-if="showTransferConfirm" class="delete-overlay" @click.self="closeTransferModal">
    <div class="delete-dialog" style="width: 380px">
      <!-- 경고 아이콘 -->
      <div class="delete-dialog-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 9v4M12 17h.01" stroke="var(--color-warning)" stroke-width="2" stroke-linecap="round"/>
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            stroke="var(--color-warning)" stroke-width="1.5" fill="none"/>
        </svg>
      </div>

      <!-- 본문 -->
      <div class="delete-dialog-body">
        <div class="delete-dialog-title">마스터 권한 위임</div>
        <div class="delete-dialog-desc">
          선택한 멤버에게 마스터 권한이 이전됩니다.<br/>
          현재 권한은 Admin으로 변경됩니다.
        </div>
      </div>

      <!-- 위임 대상 선택 -->
      <div class="transfer-field">
        <label class="transfer-field-label">위임 대상</label>
        <select v-model="transferTargetUserId" class="form-input">
          <option value="" disabled>멤버 선택</option>
          <option v-for="m in transferableMembers" :key="m.userId" :value="m.userId">
            {{ m.user.username }} ({{ m.user.email }})
          </option>
        </select>
      </div>

      <!-- 비밀번호 -->
      <div class="transfer-field">
        <label class="transfer-field-label">비밀번호 확인</label>
        <input v-model="transferPassword" type="password" class="form-input"
          placeholder="비밀번호 입력"
          @keydown.enter="onTransferOwnership" />
      </div>

      <!-- 에러 메시지 -->
      <div v-if="transferError" class="transfer-error">{{ transferError }}</div>

      <!-- 버튼 -->
      <div class="delete-dialog-actions">
        <button class="delete-btn-cancel" @click="closeTransferModal">취소</button>
        <button class="transfer-btn-confirm" @click="onTransferOwnership"
          :disabled="transferring || !transferTargetUserId || !transferPassword">
          {{ transferring ? '위임 중...' : '위임 확인' }}
        </button>
      </div>
    </div>
  </div>
</transition>
```

### CSS: 모달 내 추가 스타일

```css
/* 위임 모달 필드 */
.transfer-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.transfer-field-label {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-disabled);
}

.transfer-field .form-input {
  /* 기존 form-input 스타일 재사용 -- 추가 스타일 불필요 */
}

/* 위임 확인 버튼 (경고 색상: amber 계열) */
.transfer-btn-confirm {
  flex: 1;
  padding: 8px;
  border-radius: 7px;
  background: var(--accent-bg-deep);
  border: 1px solid var(--accent-primary);
  color: var(--accent-soft);
  font-size: var(--text-sm);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}

.transfer-btn-confirm:hover:not(:disabled) {
  background: var(--accent-hover);
  color: var(--accent-light);
}

.transfer-btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 에러 메시지 */
.transfer-error {
  font-size: var(--text-xs);
  color: #f87171;
  text-align: center;
}
```

---

## 3. 디자인 결정 사항

### 경고 아이콘 색상
- 삭제 모달: `var(--color-danger)` (#ef4444, 빨강)
- 위임 모달: `var(--color-warning)` (#f59e0b, 앰버)
- 위임은 파괴적이지만 "삭제"와 다른 성격이므로 앰버 경고색 사용

### 위임 확인 버튼 색상
- 삭제 확인 버튼: danger 색상 (#450a0a bg + #ef4444 border)
- 위임 확인 버튼: amber 액센트 색상 (--accent-bg-deep bg + --accent-primary border)
- 위임은 "경고"이지 "위험"이 아니므로 앰버로 차별화

### 모달 너비
- 삭제 모달: 340px
- 위임 모달: 380px (select 드롭다운을 위해 약간 넓게)

### select 요소
- 기존 `.form-input` 클래스를 재사용하여 통일감 유지
- 폼 컴포넌트 통일 규격 준수: font-size var(--text-sm), padding 9px 12px, border-radius 7px

---

## 4. 수정 대상 파일

| 파일 | 작업 |
|------|------|
| `client/src/views/ProjectSettingsView.vue` | 위임 항목 + 확인 모달 template/script/style 추가 |

서버 측 파일은 기획서에 정의된 코드를 그대로 사용하므로 별도 디자인 가이드 불필요.
