# 대기 중인 초대 레이아웃 개선 디자인 가이드

## 현황

- 기존 멤버 행(`.member-row`): `bg-base` 배경 + `border-default` 보더 + `8px` 라운딩 -> 개별 카드 형태로 명확히 구분됨
- 대기 초대 행(`.pending-inv-row`): `padding: 6px 0`만 있고 배경/보더 없음 -> 아이템 간 경계가 모호함
- 초대 영역 전체(`.pending-invitations`): `border-top` 하나로 멤버 리스트와 구분

## 디자인 결정

### 핵심 원칙
기존 `.member-row`와 동일한 카드 패턴을 적용하되, "대기 중" 상태를 시각적으로 구분한다.

### 변경 사항

#### 1. `.pending-inv-row` -- 카드 형태로 변경

멤버 행과 동일한 카드 구조를 적용한다.

```css
.pending-inv-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--bg-base);
  border: 1px solid var(--border-default);
  border-radius: 8px;
}
```

#### 2. `.pending-invitations` -- 리스트 컨테이너 gap 추가

멤버 리스트와 동일한 gap 패턴을 적용한다.

```css
.pending-invitations {
  margin-top: 16px;
  border-top: 1px solid var(--border-default);
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
```

변경 포인트:
- `border-top` 색상을 `var(--bg-surface)`에서 `var(--border-default)`로 변경하여 구분선을 더 명확하게 함
- `display: flex; flex-direction: column; gap: 8px` 추가하여 `.members-list`와 동일한 간격 체계 적용

#### 3. `.pending-inv-info` -- 이메일과 역할 뱃지 배치

기존 구조를 유지하되, 이메일에 `member-email` 스타일을 재사용하여 시각적 일관성을 확보한다.

```css
.pending-inv-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}
```

#### 4. 대기 상태 표시

역할 뱃지 옆에 "대기 중" 상태 텍스트를 추가한다. 새 CSS 클래스를 사용한다.

```css
.pending-status {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-disabled);
}
```

#### 5. `.pending-invitations-title` -- 기존 유지

현재 스타일이 적절하다. 변경 없음.

## HTML 구조 (template)

```html
<div v-if="projectStore.canAdmin && projectStore.projectInvitations.length > 0" class="pending-invitations">
  <div class="pending-invitations-title">대기 중인 초대</div>
  <div v-for="inv in projectStore.projectInvitations" :key="inv.id" class="pending-inv-row">
    <div class="pending-inv-info">
      <span class="member-name">{{ inv.invitee.email }}</span>
      <span :class="['role-badge', inv.role.toLowerCase()]">{{ roleLabel(inv.role) }}</span>
      <span class="pending-status">대기 중</span>
    </div>
    <button class="btn-danger-ghost btn-sm" @click="onCancelInvitation(inv.id)" title="초대 취소">취소</button>
  </div>
</div>
```

## 수정 대상 파일

| 파일 | 작업 |
|------|------|
| `client/src/views/ProjectSettingsView.vue` | template + scoped CSS 수정 |

## 규칙 준수 확인

- 색상 하드코딩 없음 -- 모든 색상 CSS 변수 사용
- 기존 `.member-row` 패턴과 시각적 일관성 유지
- 글로벌 버튼 클래스(`.btn-danger-ghost`, `.btn-sm`) 재사용
- 역할 뱃지(`.role-badge`) 재사용
- 이모지 사용 없음
