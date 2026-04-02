/** CSV Import Parser
 *  섹션별 CSV 파일 -> nodes + dependencies 변환
 *
 *  섹션 구분: # Servers, # L7, # Infra, # DNS, # External, # Dependencies
 *  각 섹션은 자체 헤더를 가짐 (해당 노드 타입에 필요한 컬럼만)
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
  memberNames?: string[]
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

const VALID_DEP_TYPES = new Set<string>(['http', 'tcp', 'websocket', 'dns', 'other'])

type Section = 'servers' | 'l7' | 'infra' | 'dns' | 'external' | 'dependencies' | null

const SECTION_MAP: Record<string, Section> = {
  'servers': 'servers',
  'server': 'servers',
  'l7': 'l7',
  'infra': 'infra',
  'dns': 'dns',
  'external': 'external',
  'dependencies': 'dependencies',
}

const SECTION_NODE_KIND: Record<string, NodeKind> = {
  'servers': 'server',
  'l7': 'l7',
  'infra': 'infra',
  'dns': 'dns',
  'external': 'external',
}

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

function detectSection(line: string): Section | false {
  if (!line.startsWith('#')) return false
  const key = line.replace(/^#\s*/, '').trim().toLowerCase()
  return SECTION_MAP[key] ?? false
}

export function parseCSV(text: string): CsvParseResult {
  const nodes: CsvParsedNode[] = []
  const dependencies: CsvParsedDependency[] = []
  const warnings: CsvParseWarning[] = []

  const lines = text.split(/\r?\n/)

  let currentSection: Section = null
  let headerParsed = false
  let colMap: Record<string, number> = {}

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const raw = lines[lineIdx].trim()

    // 섹션 전환 감지
    const detected = detectSection(raw)
    if (detected !== false) {
      currentSection = detected
      headerParsed = false
      colMap = {}
      continue
    }

    // 빈 줄, 주석 건너뛰기
    if (!raw || raw.startsWith('#')) continue

    // 섹션이 아직 없으면 무시
    if (!currentSection) continue

    const fields = parseCSVLine(raw)

    // 헤더 파싱
    if (!headerParsed) {
      fields.forEach((col, i) => { colMap[col.toLowerCase()] = i })

      if (currentSection === 'dependencies') {
        if (!('source' in colMap) || !('target' in colMap)) {
          throw new Error('Dependencies 헤더에 source, target 컬럼이 필요합니다')
        }
      } else {
        if (!('name' in colMap)) {
          throw new Error(`${currentSection} 헤더에 name 컬럼이 필요합니다`)
        }
      }
      headerParsed = true
      continue
    }

    const col = (key: string) => (colMap[key] !== undefined ? fields[colMap[key]] : '') || ''

    // 의존성 섹션
    if (currentSection === 'dependencies') {
      const source = col('source')
      const target = col('target')

      if (!source || !target) {
        warnings.push({ level: 'warn', message: `${lineIdx + 1}행: source 또는 target이 비어있어 건너뜁니다` })
        continue
      }

      const depTypeRaw = (col('type') || 'http').toLowerCase()
      const depType = VALID_DEP_TYPES.has(depTypeRaw) ? depTypeRaw as DepType : 'http'

      if (!VALID_DEP_TYPES.has(depTypeRaw)) {
        warnings.push({ level: 'info', message: `${lineIdx + 1}행: 알 수 없는 의존성 타입 "${depTypeRaw}", http로 대체합니다` })
      }

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
        description: col('description'),
        selected: true,
      })
      continue
    }

    // 노드 섹션
    const nodeKind = SECTION_NODE_KIND[currentSection]
    const name = col('name')

    if (!name) {
      warnings.push({ level: 'warn', message: `${lineIdx + 1}행: name이 비어있어 건너뜁니다` })
      continue
    }

    const node: CsvParsedNode = {
      tempId: generateId(),
      nodeKind,
      name,
      description: col('description'),
      selected: true,
    }

    switch (nodeKind) {
      case 'server':
        node.team = col('team')
        node.internalIps = parseIpList(col('internal_ips'))
        node.natIps = parseIpList(col('nat_ips'))
        break
      case 'l7':
        node.memberNames = col('members') ? col('members').split(';').map(s => s.trim()).filter(Boolean) : []
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
