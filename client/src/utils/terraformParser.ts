/** Terraform State (v4) Parser
 *  tfstate JSON -> nodes + dependencies 변환
 */

// --- tfstate 타입 정의 ---

interface TfStateV4 {
  version: number
  terraform_version: string
  resources: TfResource[]
}

interface TfResource {
  mode: string
  type: string
  name: string
  provider: string
  instances: TfInstance[]
}

interface TfInstance {
  attributes: Record<string, unknown>
  dependencies?: string[]
}

// --- 파싱 결과 타입 ---

export interface TfParsedNode {
  tempId: string
  tfResourceKey: string
  nodeKind: 'server' | 'l7' | 'infra' | 'dns' | 'external'
  name: string
  description: string
  team?: string
  internalIps?: string[]
  natIps?: string[]
  infraType?: string
  host?: string
  port?: string
  dnsType?: string
  recordValue?: string
  selected: boolean
}

export interface TfParsedDependency {
  tempId: string
  sourceKey: string
  targetKey: string
  sourceName: string
  targetName: string
  type: 'http' | 'tcp' | 'dns' | 'other'
  description: string
  selected: boolean
}

export interface TfParseWarning {
  level: 'info' | 'warn'
  message: string
}

export interface TfSkippedResource {
  type: string
  name: string
  reason: string
}

export interface TfParseResult {
  nodes: TfParsedNode[]
  dependencies: TfParsedDependency[]
  warnings: TfParseWarning[]
  skippedResources: TfSkippedResource[]
  terraformVersion: string
  totalResourceCount: number
}

// --- 리소스 타입 매핑 ---

type NodeKind = TfParsedNode['nodeKind']
type DepType = TfParsedDependency['type']

const RESOURCE_TYPE_MAP: Record<string, {
  nodeKind: NodeKind
  infraType?: string
  depType?: DepType
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
}

// --- 민감 정보 필터 ---

const SENSITIVE_KEYS = [
  'password', 'secret', 'token', 'key', 'private_key', 'certificate',
  'credentials', 'auth', 'access_key', 'secret_key', 'master_password',
  'db_password', 'admin_password',
]

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase()
  return SENSITIVE_KEYS.some(s => lower.includes(s))
}

// --- 헬퍼 ---

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

function extractNodeName(resource: TfResource, instance: TfInstance): string {
  const attrs = instance.attributes
  const tags = attrs.tags as Record<string, string> | undefined
  if (tags?.Name) return tags.Name
  return resource.name.replace(/_/g, '-')
}

function extractTeam(instance: TfInstance): string | undefined {
  const tags = instance.attributes.tags as Record<string, string> | undefined
  return tags?.Team || tags?.team || undefined
}

function deduplicateNames(nodes: TfParsedNode[]): void {
  const nameCount = new Map<string, number>()
  for (const node of nodes) {
    const count = nameCount.get(node.name) ?? 0
    nameCount.set(node.name, count + 1)
  }
  const nameSeen = new Map<string, number>()
  for (const node of nodes) {
    if ((nameCount.get(node.name) ?? 0) > 1) {
      const seen = nameSeen.get(node.name) ?? 0
      if (seen > 0) {
        node.name = `${node.name}-${seen}`
      }
      nameSeen.set(node.name, seen + 1)
    }
  }
}

function inferDepType(targetNode: TfParsedNode | undefined, resourceType: string): DepType {
  if (!targetNode) return 'other'
  if (targetNode.nodeKind === 'dns') return 'dns'
  if (targetNode.nodeKind === 'external') return 'http'
  if (targetNode.nodeKind === 'infra') {
    const mapping = RESOURCE_TYPE_MAP[resourceType]
    return mapping?.depType ?? 'tcp'
  }
  return 'http'
}

// --- 메인 파서 ---

export function parseTerraformState(json: unknown): TfParseResult {
  const state = json as TfStateV4

  // 버전 검증
  if (!state || state.version !== 4) {
    throw new Error('Terraform state v4 형식만 지원합니다 (version 필드가 4이어야 합니다)')
  }

  if (!Array.isArray(state.resources)) {
    throw new Error('유효하지 않은 Terraform state 파일입니다 (resources 배열 없음)')
  }

  const nodes: TfParsedNode[] = []
  const dependencies: TfParsedDependency[] = []
  const warnings: TfParseWarning[] = []
  const skippedResources: TfSkippedResource[] = []

  // 리소스 키 -> TfParsedNode 매핑 (의존성 해석용)
  const nodeByKey = new Map<string, TfParsedNode>()
  const totalResourceCount = state.resources.filter(r => r.mode === 'managed').length

  // 1단계: 노드 생성
  for (const resource of state.resources) {
    if (resource.mode !== 'managed') continue

    const mapping = RESOURCE_TYPE_MAP[resource.type]
    if (!mapping) {
      skippedResources.push({
        type: resource.type,
        name: resource.name,
        reason: '매핑되지 않는 리소스 타입',
      })
      continue
    }

    // 네트워크 보조 리소스는 노드로 만들지 않음
    if (['aws_lb_target_group'].includes(resource.type)) {
      continue
    }

    for (const instance of resource.instances) {
      const attrs = instance.attributes
      const resourceKey = `${resource.type}.${resource.name}`

      // 민감 정보 체크
      for (const key of Object.keys(attrs)) {
        if (isSensitiveKey(key) && attrs[key]) {
          warnings.push({
            level: 'warn',
            message: `민감 정보 필터링: ${resourceKey} (${key} 필드 무시)`,
          })
        }
      }

      const node: TfParsedNode = {
        tempId: generateId(),
        tfResourceKey: resourceKey,
        nodeKind: mapping.nodeKind,
        name: extractNodeName(resource, instance),
        description: `Terraform import: ${resource.type} (${resource.name})`,
        selected: true,
      }

      // 타입별 추가 필드
      switch (mapping.nodeKind) {
        case 'server': {
          node.team = extractTeam(instance) ?? ''
          node.internalIps = []
          node.natIps = []
          if (typeof attrs.private_ip === 'string' && attrs.private_ip) {
            node.internalIps.push(attrs.private_ip)
          }
          if (typeof attrs.public_ip === 'string' && attrs.public_ip) {
            node.natIps.push(attrs.public_ip)
          }
          break
        }
        case 'l7': {
          const dnsName = attrs.dns_name as string | undefined
          if (dnsName) {
            node.description += ` | ${dnsName}`
          }
          break
        }
        case 'infra': {
          node.infraType = mapping.infraType
          if (typeof attrs.endpoint === 'string') {
            node.host = attrs.endpoint
          } else if (typeof attrs.address === 'string') {
            node.host = attrs.address
          }
          if (typeof attrs.port === 'number') {
            node.port = String(attrs.port)
          }
          break
        }
        case 'dns': {
          node.dnsType = (attrs.type as string) ?? 'A'
          if (Array.isArray(attrs.records) && attrs.records.length > 0) {
            node.recordValue = String(attrs.records[0])
          }
          // DNS 이름은 레코드 name 사용
          if (typeof attrs.name === 'string' && attrs.name) {
            node.name = attrs.name
          }
          break
        }
      }

      nodes.push(node)
      nodeByKey.set(resourceKey, node)
    }
  }

  // 이름 중복 해결
  deduplicateNames(nodes)

  // 2단계: 의존성 추출 (depends_on 기반)
  for (const resource of state.resources) {
    if (resource.mode !== 'managed') continue
    const sourceKey = `${resource.type}.${resource.name}`
    const sourceNode = nodeByKey.get(sourceKey)
    if (!sourceNode) continue

    for (const instance of resource.instances) {
      if (!instance.dependencies) continue

      for (const depRef of instance.dependencies) {
        const targetNode = nodeByKey.get(depRef)
        if (!targetNode) continue
        // 같은 노드 자기참조 건너뛰기
        if (sourceNode.tempId === targetNode.tempId) continue

        // 중복 체크
        const exists = dependencies.some(
          d => d.sourceKey === sourceNode.tfResourceKey && d.targetKey === targetNode.tfResourceKey
        )
        if (exists) continue

        // 타겟 리소스 타입에서 depType 결정
        const targetResourceType = depRef.split('.')[0]

        dependencies.push({
          tempId: generateId(),
          sourceKey: sourceNode.tfResourceKey,
          targetKey: targetNode.tfResourceKey,
          sourceName: sourceNode.name,
          targetName: targetNode.name,
          type: inferDepType(targetNode, targetResourceType),
          description: `depends_on: ${depRef}`,
          selected: true,
        })
      }
    }
  }

  // skipped 리소스 경고
  if (skippedResources.length > 0) {
    warnings.push({
      level: 'info',
      message: `매핑 불가 리소스 ${skippedResources.length}개 건너뜀`,
    })
  }

  return {
    nodes,
    dependencies,
    warnings,
    skippedResources,
    terraformVersion: state.terraform_version ?? 'unknown',
    totalResourceCount,
  }
}

/** 노드 타입별 뱃지 라벨 */
export function nodeBadgeLabel(kind: TfParsedNode['nodeKind']): string {
  switch (kind) {
    case 'server': return 'SRV'
    case 'l7': return 'L7'
    case 'infra': return 'DB'
    case 'dns': return 'DNS'
    case 'external': return 'EXT'
  }
}