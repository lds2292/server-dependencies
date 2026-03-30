# Master 권한 위임 구현 기획서

## 개요

프로젝트 설정 페이지의 멤버 관리 섹션에서 MASTER가 다른 멤버에게 마스터 권한을 위임하는 UI를 추가한다. 서버 측 소유권 이전 로직은 이미 구현되어 있으므로(`projectService.updateMemberRole`에서 `newRole === 'MASTER'`), 서버에는 비밀번호 확인 전용 엔드포인트 추가만 필요하고 클라이언트 UI 구현이 주요 작업이다.

---

## 1단계: 현황 분석

### 서버 측 (이미 구현된 부분)

| 파일 | 내용 |
|------|------|
| `server/src/services/projectService.ts` L148-175 | `updateMemberRole()` -- `newRole === 'MASTER'`일 때 트랜잭션으로 대상을 MASTER로, 요청자를 ADMIN으로, `ownerId`를 대상으로 변경 |
| `server/src/controllers/projectController.ts` L94-106 | `updateMemberRole()` -- `OWNERSHIP_TRANSFERRED` 감사 로그 기록 |
| `server/src/services/auditLogService.ts` L12 | `OWNERSHIP_TRANSFERRED` 액션 타입 정의됨 |
| `server/src/lib/permissions.ts` L13 | `transfer_ownership` 퍼미션이 MASTER에게만 부여됨 |
| `server/src/routes/projects.ts` L22 | `PATCH /:id/members/:userId/role` 엔드포인트 존재 |

### 클라이언트 측 (현재 상태)

| 파일 | 내용 |
|------|------|
| `client/src/views/ProjectSettingsView.vue` L265 | `ALL_ROLES`에 'MASTER'가 포함되지 않음 (`['ADMIN', 'WRITER', 'READONLY']`) |
| `client/src/views/ProjectSettingsView.vue` L271-277 | `canChangeRole()` -- MASTER 대상은 역할 변경 불가 |
| `client/src/stores/project.ts` L71-74 | `updateMemberRole()` -- 이미 role을 서버로 전달하는 기능 존재 |
| `client/src/api/projectApi.ts` L91-92 | `updateMemberRole()` -- `PATCH /projects/:id/members/:userId/role` 호출 |

### 누락 사항

1. **서버**: 마스터 위임 시 비밀번호 확인 과정이 없음. 민감한 작업이므로 비밀번호 확인 후 위임해야 함.
2. **클라이언트**: MASTER 위임 UI(버튼 + 확인 모달)가 없음.

### 비밀번호 확인 참조 패턴

`unmasksContacts` 컨트롤러에서 `authService.verifyUserPassword(userId, password)`를 호출하여 비밀번호 확인 후 민감한 작업을 수행하는 패턴이 이미 존재한다.

---

## 2단계: 데이터 모델 & 로직 설계

### 서버 변경: 마스터 위임 전용 엔드포인트

기존 `PATCH /:id/members/:userId/role`에 비밀번호를 추가하면 기존 역할 변경 API의 인터페이스가 변경되어 하위 호환성 문제가 생긴다. 따라서 **마스터 위임 전용 엔드포인트**를 별도로 추가한다.

#### 새 API 엔드포인트

```
POST /projects/:id/transfer-ownership
Body: { targetUserId: string, password: string }
Response: Project (멤버 목록 포함)
```

#### 컨트롤러 함수: `transferOwnership`

```typescript
// server/src/controllers/projectController.ts
export async function transferOwnership(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  const { targetUserId, password } = req.body
  const userId = req.user!.userId
  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ?? req.socket.remoteAddress
  const userAgent = req.headers['user-agent']

  if (!targetUserId || !password) {
    res.status(400).json({ error: 'targetUserId와 password는 필수입니다.' })
    return
  }

  try {
    // 1. 비밀번호 확인
    await authService.verifyUserPassword(userId, password)

    // 2. 소유권 이전 (기존 updateMemberRole 재사용)
    const project = await projectService.updateMemberRole(id, userId, targetUserId, 'MASTER')

    // 3. 감사 로그
    await auditLogService.createAuditLog({
      userId, projectId: id, action: 'OWNERSHIP_TRANSFERRED', status: 'SUCCESS',
      ipAddress, userAgent,
      detail: JSON.stringify({ targetUserId }),
    }).catch(() => {})

    logger.info('PROJECT ownership transferred', { projectId: id, fromUserId: userId, toUserId: targetUserId })
    res.json(project)
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string }
    if (e.code === 'INVALID_CREDENTIALS') {
      await auditLogService.createAuditLog({
        userId, projectId: id, action: 'OWNERSHIP_TRANSFERRED', status: 'FAILED',
        ipAddress, userAgent, failReason: 'INVALID_CREDENTIALS',
      }).catch(() => {})
      res.status(401).json({ error: '비밀번호가 올바르지 않습니다.', code: e.code })
      return
    }
    handleProjectError(err, res, 'transferOwnership')
  }
}
```

#### 라우트 등록

```typescript
// server/src/routes/projects.ts
router.post('/:id/transfer-ownership', projectController.transferOwnership)
```

### 클라이언트 변경

#### API 함수 추가 (`client/src/api/projectApi.ts`)

```typescript
transferOwnership(id: string, targetUserId: string, password: string) {
  return http.post<Project>(`/projects/${id}/transfer-ownership`, { targetUserId, password })
}
```

#### Store 액션 추가 (`client/src/stores/project.ts`)

```typescript
async function transferOwnership(projectId: string, targetUserId: string, password: string): Promise<void> {
  const { data } = await projectApi.transferOwnership(projectId, targetUserId, password)
  if (currentProject.value?.id === projectId) currentProject.value = data
}
```

return 객체에 `transferOwnership` 추가.

---

## 3단계: UI/UX 스펙

### 위치: 위험 영역 섹션 내

프로젝트 삭제 위에 "마스터 권한 위임" 항목을 추가한다. 위험 영역 내에 배치하는 이유: 되돌릴 수 없는 중대한 변경이므로.

### ASCII 와이어프레임

```
+-------------------------------------------------------+
| 위험 영역                                              |
+-------------------------------------------------------+
| 마스터 권한 위임                  [ 권한 위임 ] 버튼    |
| 다른 멤버에게 마스터 권한을                             |
| 이전합니다. 기존 마스터는                               |
| Admin으로 변경됩니다.                                   |
+-------------------------------------------------------+
| 프로젝트 삭제                    [ 프로젝트 삭제 ] 버튼 |
| 프로젝트와 모든 그래프 데이터가                         |
| 영구적으로 삭제됩니다.                                  |
+-------------------------------------------------------+
```

### 확인 모달 와이어프레임

```
+----------------------------------------------+
|              [경고 아이콘]                    |
|                                              |
|          마스터 권한 위임                     |
|                                              |
|  선택한 멤버에게 마스터 권한이 이전됩니다.    |
|  현재 권한은 Admin으로 변경됩니다.            |
|                                              |
|  위임 대상                                   |
|  [v 멤버 선택 _______________]               |
|                                              |
|  비밀번호 확인                               |
|  [____________________________]              |
|                                              |
|  [ 취소 ]          [ 위임 확인 ]             |
+----------------------------------------------+
```

### 컴포넌트 스펙

#### ProjectSettingsView.vue 추가 사항

| 항목 | 상세 |
|------|------|
| 상태 변수 | `showTransferConfirm: ref<boolean>`, `transferTargetUserId: ref<string>`, `transferPassword: ref<string>`, `transferring: ref<boolean>`, `transferError: ref<string>` |
| computed | `transferableMembers` -- MASTER가 아닌 멤버 목록 (위임 대상 후보) |
| 메서드 | `onTransferOwnership()` -- store.transferOwnership 호출 |

#### 위임 대상 Select

```
<select v-model="transferTargetUserId" class="form-input">
  <option value="" disabled>멤버 선택</option>
  <option v-for="m in transferableMembers" :key="m.userId" :value="m.userId">
    {{ m.user.username }} ({{ m.user.email }})
  </option>
</select>
```

#### 인터랙션 플로우

1. MASTER가 "권한 위임" 버튼 클릭
2. 확인 모달 열림 (대상 선택 + 비밀번호 입력)
3. "위임 확인" 클릭 -> 서버 API 호출
4. 성공: 모달 닫힘 + 토스트 "마스터 권한이 위임되었습니다." + 페이지 리다이렉트(더 이상 MASTER가 아니므로)
5. 실패(비밀번호 오류): 모달 내 에러 메시지 표시
6. 실패(기타): 토스트 에러

#### 빈 상태

- 위임 가능한 멤버가 없는 경우(본인만 있는 프로젝트): "권한 위임" 버튼 비활성화 + 툴팁 "위임할 멤버가 없습니다."

#### 에러 상태

- 비밀번호 틀림: 모달 내 `transferError`에 "비밀번호가 올바르지 않습니다." 표시
- 네트워크 오류: 토스트로 표시

#### 성공 후 동작

위임 성공 후 현재 사용자는 ADMIN이 되므로:
- 위험 영역이 사라짐 (v-if="projectStore.isMaster")
- 페이지는 자동으로 상태 반영됨 (currentProject가 갱신되면 isMaster가 false로 변경)

---

## 4단계: 수정 파일 체크리스트

| 파일 | 작업 내용 |
|------|-----------|
| `server/src/routes/projects.ts` | `POST /:id/transfer-ownership` 라우트 추가 |
| `server/src/controllers/projectController.ts` | `transferOwnership` 컨트롤러 함수 추가 |
| `client/src/api/projectApi.ts` | `transferOwnership()` API 함수 추가 |
| `client/src/stores/project.ts` | `transferOwnership()` 스토어 액션 추가 |
| `client/src/views/ProjectSettingsView.vue` | 위임 UI 버튼 + 확인 모달 + 관련 상태/로직 추가 |

신규 파일 없음. Prisma 스키마 변경 없음. 마이그레이션 불필요.

---

## 제약 조건

- 프로젝트당 MASTER는 반드시 1명 (서버 트랜잭션으로 보장됨)
- 위임 시 비밀번호 확인 필수
- CSS 변수만 사용 (하드코딩 금지)
- 이모지 사용 금지
- 기존 위험 영역 디자인 패턴 (`.danger-zone`, `.danger-item`) 재사용
- 기존 삭제 확인 모달 패턴 (`.delete-overlay`, `.delete-dialog`) 재사용
- 감사 로그 기록 필수 (`OWNERSHIP_TRANSFERRED`)
- 성공/실패 시 감사 로그 모두 기록
