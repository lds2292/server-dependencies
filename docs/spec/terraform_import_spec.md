# Terraform State Import 구현 기획서

## 개요

Terraform state 파일(tfstate JSON)을 업로드하여 리소스를 노드/의존성으로 자동 변환하고, 미리보기 확인 후 그래프에 반영하는 클라이언트 전용 기능.

---

## 1단계: 현황 분석

### 사용 가능한 데이터

**그래프 Store actions (graph.ts)**
- `addServer(data)` / `addL7Node(data)` / `addInfraNode(data)` / `addExternalNode(data)` / `addDnsNode(data)` -- 개별 노드 추가
- `addDependency(data)` -- 의존성 추가 (중복/L7 멤버/인프라 source 검증 포함)
- `beginBatch()` / `endBatch()` -- 일괄 작업 시 undo 스냅샷 1회만 저장
- `loadData(data: GraphData)` -- 전체 그래프 데이터 교체 (snapshot 저장 후)
- `saveGraph()` -- 서버에 저장

**노드 타입 (types/index.ts)**
- `Server`: id, nodeKind('server'), name, team, internalIps[], natIps[], description
- `L7Node`: id, nodeKind('l7'), name, ip?, natIp?, memberServerIds[], description?
- `InfraNode`: id, nodeKind('infra'), name, infraType?, host?, port?, description?
- `DnsNode`: id, nodeKind('dns'), name, dnsType, recordValue?, ttl?, provider?, description?
- `ExternalServiceNode`: id, nodeKind('external'), name, hasFirewall?, contacts[], description?
- `Dependency`: id, source, target, type('http'|'tcp'|'websocket'|'dns'|'other'), description?

**기존 import 패턴 (graph.ts importJSON)**
- FileReader로 JSON 읽기 -> 파싱 -> `saveSnapshot()` -> 각 배열 교체
- 현재 그래프를 **완전히 교체**하는 방식

### Terraform State JSON 구조 (v4)

```json
{
  "version": 4,
  "terraform_version": "1.5.0",
  "resources": [
    {
      "mode": "managed",
      "type": "aws_instance",
      "name": "web_server",
      "provider": "provider[\"registry.terraform.io/hashicorp/aws\"]",
      "instances": [
        {
          "attributes": {
            "id": "i-0abcdef1234567890",
            "private_ip": "10.0.1.50",
            "public_ip": "54.123.45.67",
            "tags": { "Name": "web-server", "Team": "platform" },
            "vpc_security_group_ids": ["sg-12345"],
            "subnet_id": "subnet-abc123"
          },
          "dependencies": [
            "aws_security_group.web_sg",
            "aws_subnet.private"
          ]
        }
      ]
    }
  ]
}
```

핵심 필드:
- `resources[].type` -- 리소스 타입 (매핑 키)
- `resources[].name` -- Terraform 리소스 이름
- `resources[].instances[].attributes` -- 리소스 속성 (IP, 태그 등)
- `resources[].instances[].dependencies` -- 명시적 의존성 참조

---

## 2단계: 데이터 모델 & 로직 설계

### 2.1 TypeScript 인터페이스

```typescript
// client/src/utils/terraformParser.ts

/** tfstate v4 최소 타입 정의 */
interface TfStateV4 {
  version: number
  terraform_version: string
  resources: TfResource[]
}

interface TfResource {
  mode: string          // "managed" | "data"
  type: string          // "aws_instance" 등
  name: string          // Terraform 리소스 이름
  provider: string
  instances: TfInstance[]
}

interface TfInstance {
  attributes: Record<string, unknown>
  dependencies?: string[]  // "aws_security_group.web_sg" 형태
}

/** 파싱 결과 */
interface TfParseResult {
  nodes: TfParsedNode[]
  dependencies: TfParsedDependency[]
  warnings: TfParseWarning[]
  skippedResources: TfSkippedResource[]
}

interface TfParsedNode {
  tempId: string               // 임시 ID (crypto.randomUUID)
  tfResourceKey: string        // "aws_instance.web_server" (원본 참조키)
  nodeKind: 'server' | 'l7' | 'infra' | 'dns' | 'external'
  name: string                 // tags.Name 또는 리소스 이름
  description: string          // 자동 생성 설명
  // 타입별 추가 필드
  team?: string                // tags.Team
  internalIps?: string[]
  natIps?: string[]
  infraType?: string           // "RDS", "ElastiCache", "DynamoDB"
  host?: string
  port?: string
  dnsType?: string
  recordValue?: string
  selected: boolean            // 미리보기에서 체크/언체크 (기본 true)
}

interface TfParsedDependency {
  tempId: string
  sourceKey: string            // TfParsedNode.tfResourceKey
  targetKey: string
  type: 'http' | 'tcp' | 'dns' | 'other'
  description: string
  selected: boolean
}

interface TfParseWarning {
  level: 'info' | 'warn'
  message: string
}

interface TfSkippedResource {
  type: string
  name: string
  reason: string
}
```

### 2.2 리소스 타입 매핑 규칙

```typescript
const RESOURCE_TYPE_MAP: Record<string, {
  nodeKind: TfParsedNode['nodeKind']
  infraType?: string
  depType?: TfParsedDependency['type']
}> = {
  // Server
  'aws_instance':              { nodeKind: 'server' },
  'aws_ecs_service':           { nodeKind: 'server' },
  'aws_ecs_task_definition':   { nodeKind: 'server' },
  'aws_lambda_function':       { nodeKind: 'server' },
  // L7
  'aws_lb':                    { nodeKind: 'l7' },
  'aws_alb':                   { nodeKind: 'l7' },
  'aws_elb':                   { nodeKind: 'l7' },
  'aws_lb_target_group':       { nodeKind: 'l7' },
  // Infra
  'aws_rds_cluster':           { nodeKind: 'infra', infraType: 'RDS',          depType: 'tcp' },
  'aws_rds_instance':          { nodeKind: 'infra', infraType: 'RDS',          depType: 'tcp' },
  'aws_db_instance':           { nodeKind: 'infra', infraType: 'RDS',          depType: 'tcp' },
  'aws_elasticache_cluster':   { nodeKind: 'infra', infraType: 'ElastiCache',  depType: 'tcp' },
  'aws_elasticache_replication_group': { nodeKind: 'infra', infraType: 'ElastiCache', depType: 'tcp' },
  'aws_dynamodb_table':        { nodeKind: 'infra', infraType: 'DynamoDB',     depType: 'tcp' },
  'aws_sqs_queue':             { nodeKind: 'infra', infraType: 'SQS',          depType: 'other' },
  'aws_sns_topic':             { nodeKind: 'infra', infraType: 'SNS',          depType: 'other' },
  'aws_s3_bucket':             { nodeKind: 'infra', infraType: 'S3',           depType: 'other' },
  // DNS
  'aws_route53_record':        { nodeKind: 'dns' },
  // External (기본 폴백)
}
```

매핑되지 않는 리소스 타입은 `skippedResources`에 추가하고 경고를 표시한다.

### 2.3 노드 이름 추출 로직

```typescript
function extractNodeName(resource: TfResource, instance: TfInstance): string {
  const attrs = instance.attributes
  // 우선순위: tags.Name > 리소스 name > type.name
  const tagName = (attrs.tags as Record<string, string>)?.Name
  if (tagName) return tagName
  return resource.name.replace(/_/g, '-')
}
```

### 2.4 의존성 추론 로직

1. **명시적 depends_on**: `instances[].dependencies` 배열에서 `"type.name"` 형태 참조 추출
2. **Security Group 기반**: `aws_security_group_rule`의 `source_security_group_id` / `security_group_id`로 네트워크 연결 추론
3. **LB Target Group**: `aws_lb_target_group_attachment`로 L7 -> Server 멤버십 추론

의존성 타입 자동 결정:
- target이 Infra 노드 -> 해당 infraType의 depType 사용 (기본 'tcp')
- target이 DNS -> 'dns'
- target이 External -> 'http'
- 그 외 -> 'http'

### 2.5 민감 정보 필터링

```typescript
const SENSITIVE_KEYS = [
  'password', 'secret', 'token', 'key', 'private_key', 'certificate',
  'credentials', 'auth', 'access_key', 'secret_key', 'master_password',
  'db_password', 'admin_password'
]

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase()
  return SENSITIVE_KEYS.some(s => lower.includes(s))
}
```

파싱 시 민감 키의 값은 읽지 않고, 해당 키가 존재했다는 경고만 warnings에 추가한다.

### 2.6 파싱 함수

```typescript
function parseTerraformState(json: TfStateV4): TfParseResult {
  // 1. version 검증 (v4만 지원)
  // 2. resources를 순회하며 mode === 'managed'만 처리
  // 3. 리소스 타입 매핑 -> TfParsedNode 생성
  // 4. dependencies 배열에서 의존성 추출
  // 5. 이름 중복 시 접미사 추가 (-1, -2, ...)
  // 6. 민감 정보 경고 수집
  // 7. skipped 리소스 수집
  return { nodes, dependencies, warnings, skippedResources }
}
```

### 2.7 그래프 반영 방식

**병합(merge) 방식** -- 기존 노드를 유지하고 새 노드/의존성을 추가.

```typescript
function applyTerraformImport(result: TfParseResult, store: ReturnType<typeof useGraphStore>): void {
  const selectedNodes = result.nodes.filter(n => n.selected)
  const selectedDeps = result.dependencies.filter(d => d.selected)

  // tempId -> 실제 생성된 id 매핑
  const idMap = new Map<string, string>()

  store.beginBatch()

  for (const node of selectedNodes) {
    let created: { id: string }
    switch (node.nodeKind) {
      case 'server':
        created = store.addServer({ ... })
        break
      case 'l7':
        created = store.addL7Node({ ... })
        break
      // ... 타입별 처리
    }
    idMap.set(node.tempId, created.id)
  }

  for (const dep of selectedDeps) {
    const sourceId = idMap.get(dep.sourceKey) // sourceKey -> tempId로 변환 필요
    const targetId = idMap.get(dep.targetKey)
    if (sourceId && targetId) {
      store.addDependency({ source: sourceId, target: targetId, type: dep.type, description: dep.description })
    }
  }

  store.endBatch()
  store.saveGraph()
}
```

---

## 3단계: UI/UX 스펙

### 3.1 진입점

설정 드롭다운(`toolbar-dropdown`)에 "Terraform Import" 항목 추가.

```
┌────────────────────────────────────────────────────────────────┐
│ <- 목록  프로젝트명  ?  [저장] [자동저장]     [편집] [⚙] [프로필] │
│                                              │감사 로그      │ │
│                                              │멤버 관리      │ │
│                                              │───────────── │ │
│                                              │Terraform Import│ │
│                                              └───────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

### 3.2 Import 모달 UI

모달은 3단계로 구성: 업로드 -> 미리보기 -> 완료

```
┌──────────────────────────── Terraform Import ───────────────────────────────┐
│                                                                     [X]     │
│  ┌─── Step 1: 파일 업로드 ──────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │   ┌──────────────────────────────────────────────────────────┐       │   │
│  │   │                                                          │       │   │
│  │   │      .tfstate 파일을 드래그하거나 클릭하여 선택           │       │   │
│  │   │      JSON 형식, 최대 10MB                                │       │   │
│  │   │                                                          │       │   │
│  │   └──────────────────────────────────────────────────────────┘       │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                                               [취소]                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

파싱 성공 후 Step 2:

```
┌──────────────────────────── Terraform Import ───────────────────────────────┐
│                                                                     [X]     │
│  ┌─── 요약 ─────────────────────────────────────────────────────────────┐   │
│  │  Terraform v1.5.0 | 리소스 24개 중 18개 매핑 | 의존성 12개 추론      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─── 경고 (2) ─────────────────────────────────────────────────────────┐   │
│  │  ! 민감 정보 필터링: aws_rds_cluster.main (password 필드 무시)       │   │
│  │  ! 매핑 불가: aws_cloudwatch_log_group.app (건너뜀)                  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─── 노드 (18) ───────────────────────────────── [전체 선택/해제] ──┐     │
│  │  [v] [SRV] web-server        aws_instance      10.0.1.50         │     │
│  │  [v] [SRV] api-service       aws_ecs_service                     │     │
│  │  [v] [L7]  main-alb          aws_lb            internal          │     │
│  │  [v] [DB]  main-db           aws_rds_cluster   mysql             │     │
│  │  [v] [DNS] api.example.com   aws_route53_record A                │     │
│  │  [ ] [EXT] stripe-webhook    (unmapped)                          │     │
│  │  ...                                                              │     │
│  └──────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  ┌─── 의존성 (12) ──────────────────────────────── [전체 선택/해제] ──┐     │
│  │  [v] web-server  -->  main-db      tcp    (depends_on)            │     │
│  │  [v] api-service -->  main-alb     http   (sg rule)               │     │
│  │  ...                                                              │     │
│  └──────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│                                        [취소]  [가져오기 (18노드, 12의존성)] │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 컴포넌트 구조

**TerraformImportModal.vue** (신규)

| Props | 타입 | 설명 |
|-------|------|------|
| -- | -- | 단독 모달, props 없음 |

| Emit | Payload | 설명 |
|------|---------|------|
| close | -- | 모달 닫기 |
| import | `TfParseResult` | 확인 시 파싱 결과 전달 |

내부 상태:
- `step: 'upload' | 'preview'`
- `parseResult: TfParseResult | null`
- `error: string | null`
- `dragOver: boolean`

### 3.4 빈 상태 / 에러 상태

| 상태 | 표시 |
|------|------|
| 파일 없음 | 드래그앤드롭 영역 (기본 상태) |
| 파일 형식 오류 | "유효한 Terraform state 파일이 아닙니다 (JSON v4 형식 필요)" |
| 파싱 실패 | "파일 파싱 중 오류가 발생했습니다: [에러 메시지]" |
| 매핑 노드 0개 | "매핑 가능한 리소스가 없습니다. 지원하는 리소스 타입을 확인하세요." |
| 파일 크기 초과 | "파일 크기가 10MB를 초과합니다" |

---

## 4단계: 수정 파일 체크리스트

| 파일 경로 | 작업 내용 |
|----------|----------|
| **`client/src/utils/terraformParser.ts`** | **[신규]** tfstate 파싱 로직, 타입 매핑, 의존성 추론, 민감 정보 필터링 |
| **`client/src/components/TerraformImportModal.vue`** | **[신규]** Import 모달 UI (업로드 + 미리보기 + 확인) |
| `client/src/views/ProjectView.vue` | 설정 드롭다운에 "Terraform Import" 항목 추가, 모달 연동 |
| `client/src/stores/graph.ts` | 변경 없음 -- 기존 `addServer`, `addDependency`, `beginBatch/endBatch` 활용 |

---

## 제약 조건

1. 서버 변경 없이 클라이언트만으로 구현 (1단계 MVP)
2. tfstate v4 형식만 지원
3. AWS 리소스 타입만 매핑 (GCP/Azure는 추후 확장)
4. 파일 크기 상한 10MB
5. 기존 그래프에 병합(merge) 방식 -- 기존 노드를 삭제하지 않음
6. 이름 중복 시 자동으로 접미사 추가 (-1, -2, ...)
7. 색상 하드코딩 금지, CSS 변수 사용
8. 이모지 사용 금지