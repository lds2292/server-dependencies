/** CSV Import Parser
 *  CSV 파일 -> nodes + dependencies 변환
 *
 *  노드 시트 컬럼: type, name, description, team, internal_ips, nat_ips, infra_type, host, port, dns_type, record_value
 *  의존성 시트 컬럼: source, target, type, description
 *  두 섹션은 빈 줄 + "# Dependencies" 헤더로 구분
 */

export type NodeKind = 'server' | 'l7' | 'infra' | 'dns' | 'external'
export type DepType = 'http' | 'tcp' | 'websocket' | 'dns' | 'other'

export interface CsvParsedNode {
  tempId: string
  nodeKind: NodeKind
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

export interface CsvParsedDependency {
  tempId: string
  sourceName: string
  targetName: string
  type: DepType
  description: string
  selected: boolean
}

export interface CsvParseWarning {
  level: 'info' | 'warn'
  message: string
}

export interface CsvParseResult {
  nodes: CsvParsedNode[]
  dependencies: CsvParsedDependency[]
  warnings: CsvParseWarning[]
}

const VALID_NODE_KINDS = new Set<string>(['server', 'l7', 'infra', 'dns', 'external'])
const VALID_DEP_TYPES = new Set<string>(['http', 'tcp', 'websocket', 'dns', 'other'])

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

/** CSV 한 줄을 파싱 (따옴표 내 쉼표, 이스케이프 지원) */
function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        fields.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
  }
  fields.push(current.trim())
  return fields
}

/** 멀티 IP 파싱 (세미콜론 구분) */
function parseIpList(value: string): string[] {
  if (!value) return []
  return value.split(';').map(ip => ip.trim()).filter(Boolean)
}

export function parseCSV(text: string): CsvParseResult {
  const nodes: CsvParsedNode[] = []
  const dependencies: CsvParsedDependency[] = []
  const warnings: CsvParseWarning[] = []

  const lines = text.split(/\r?\n/)

  // 빈 줄과 주석(#)으로 섹션 분리
  let section: 'nodes' | 'dependencies' = 'nodes'
  let nodeHeaderParsed = false
  let depHeaderParsed = false
  let nodeColMap: Record<string, number> = {}
  let depColMap: Record<string, number> = {}

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const raw = lines[lineIdx].trim()

    // 섹션 전환 감지
    if (raw.toLowerCase().startsWith('# dependencies') || raw.toLowerCase() === '# dependencies') {
      section = 'dependencies'
      depHeaderParsed = false
      continue
    }

    // 빈 줄, 주석 건너뛰기
    if (!raw || raw.startsWith('#')) continue

    const fields = parseCSVLine(raw)

    if (section === 'nodes') {
      if (!nodeHeaderParsed) {
        // 헤더 파싱
        fields.forEach((col, i) => { nodeColMap[col.toLowerCase()] = i })
        if (!('type' in nodeColMap) || !('name' in nodeColMap)) {
          throw new Error('노드 헤더에 type, name 컬럼이 필요합니다')
        }
        nodeHeaderParsed = true
        continue
      }

      const type = fields[nodeColMap['type']]?.toLowerCase()
      const name = fields[nodeColMap['name']]

      if (!name) {
        warnings.push({ level: 'warn', message: `${lineIdx + 1}행: name이 비어있어 건너뜁니다` })
        continue
      }

      if (!VALID_NODE_KINDS.has(type)) {
        warnings.push({ level: 'warn', message: `${lineIdx + 1}행: 알 수 없는 타입 "${type}" 건너뜁니다 (server, l7, infra, dns, external)` })
        continue
      }

      const col = (key: string) => (nodeColMap[key] !== undefined ? fields[nodeColMap[key]] : '') || ''

      const node: CsvParsedNode = {
        tempId: generateId(),
        nodeKind: type as NodeKind,
        name,
        description: col('description'),
        selected: true,
      }

      switch (type) {
        case 'server':
          node.team = col('team')
          node.internalIps = parseIpList(col('internal_ips'))
          node.natIps = parseIpList(col('nat_ips'))
          break
        case 'infra':
          node.infraType = col('infra_type')
          node.host = col('host')
          node.port = col('port')
          break
        case 'dns':
          node.dnsType = col('dns_type') || 'A'
          node.recordValue = col('record_value')
          break
      }

      nodes.push(node)
    } else {
      // dependencies 섹션
      if (!depHeaderParsed) {
        fields.forEach((col, i) => { depColMap[col.toLowerCase()] = i })
        if (!('source' in depColMap) || !('target' in depColMap)) {
          throw new Error('의존성 헤더에 source, target 컬럼이 필요합니다')
        }
        depHeaderParsed = true
        continue
      }

      const source = fields[depColMap['source']]
      const target = fields[depColMap['target']]

      if (!source || !target) {
        warnings.push({ level: 'warn', message: `${lineIdx + 1}행: source 또는 target이 비어있어 건너뜁니다` })
        continue
      }

      const depTypeRaw = (fields[depColMap['type']] || 'http').toLowerCase()
      const depType = VALID_DEP_TYPES.has(depTypeRaw) ? depTypeRaw as DepType : 'http'

      if (!VALID_DEP_TYPES.has(depTypeRaw)) {
        warnings.push({ level: 'info', message: `${lineIdx + 1}행: 알 수 없는 의존성 타입 "${depTypeRaw}", http로 대체합니다` })
      }

      // source/target이 실제 노드에 있는지 확인
      const sourceExists = nodes.some(n => n.name === source)
      const targetExists = nodes.some(n => n.name === target)
      if (!sourceExists) {
        warnings.push({ level: 'warn', message: `${lineIdx + 1}행: source "${source}"에 해당하는 노드가 없습니다` })
        continue
      }
      if (!targetExists) {
        warnings.push({ level: 'warn', message: `${lineIdx + 1}행: target "${target}"에 해당하는 노드가 없습니다` })
        continue
      }

      dependencies.push({
        tempId: generateId(),
        sourceName: source,
        targetName: target,
        type: depType,
        description: fields[depColMap['description']] || '',
        selected: true,
      })
    }
  }

  if (nodes.length === 0) {
    throw new Error('가져올 수 있는 노드가 없습니다. CSV 형식을 확인해 주세요.')
  }

  return { nodes, dependencies, warnings }
}

/** 노드 타입별 뱃지 라벨 */
export function nodeBadgeLabel(kind: NodeKind): string {
  switch (kind) {
    case 'server': return 'SRV'
    case 'l7': return 'L7'
    case 'infra': return 'DB'
    case 'dns': return 'DNS'
    case 'external': return 'EXT'
  }
}
