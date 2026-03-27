/**
 * 기존 DB에 평문으로 저장된 IP/host 필드를 암호화합니다.
 * 실행: ts-node src/scripts/migrateEncryption.ts
 * 주의: ENCRYPTION_KEY 환경변수가 설정된 상태에서만 실행하세요.
 */
import 'dotenv/config'
import prisma from '../prisma'
import { isEncrypted, encrypt, encryptStringArray } from '../services/cryptoService'

interface ServerNode {
  internalIps?: string[]
  natIps?: string[]
  [key: string]: unknown
}

interface L7Node {
  ip?: string
  [key: string]: unknown
}

interface InfraNode {
  host?: string
  [key: string]: unknown
}

interface GraphDataJson {
  servers: unknown[]
  l7Nodes: unknown[]
  infraNodes: unknown[]
  externalNodes: unknown[]
  dependencies: unknown[]
}

async function migrate() {
  const records = await prisma.graphData.findMany()
  console.log(`총 ${records.length}개 프로젝트 데이터 마이그레이션 시작`)

  let migrated = 0

  for (const record of records) {
    const data = record.data as unknown as GraphDataJson

    const updatedServers = (data.servers as ServerNode[]).map(s => ({
      ...s,
      internalIps: s.internalIps
        ? s.internalIps.map(ip => isEncrypted(ip) ? ip : encrypt(ip))
        : s.internalIps,
      natIps: s.natIps
        ? s.natIps.map(ip => isEncrypted(ip) ? ip : encrypt(ip))
        : s.natIps,
    }))

    const updatedL7Nodes = (data.l7Nodes as L7Node[]).map(n => ({
      ...n,
      ip: n.ip && !isEncrypted(n.ip) ? encrypt(n.ip) : n.ip,
    }))

    const updatedInfraNodes = (data.infraNodes as InfraNode[]).map(n => ({
      ...n,
      host: n.host && !isEncrypted(n.host) ? encrypt(n.host) : n.host,
    }))

    await prisma.graphData.update({
      where: { id: record.id },
      data: {
        data: {
          ...data,
          servers: updatedServers,
          l7Nodes: updatedL7Nodes,
          infraNodes: updatedInfraNodes,
        } as object,
      },
    })

    migrated++
    console.log(`  [${migrated}/${records.length}] 프로젝트 ${record.projectId} 완료`)
  }

  console.log('마이그레이션 완료')
  await prisma.$disconnect()
}

migrate().catch(err => {
  console.error('마이그레이션 실패:', err)
  process.exit(1)
})
