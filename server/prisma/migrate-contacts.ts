/**
 * 1회성 실행 스크립트: GraphData.data.externalNodes[].contacts를 contacts 컬럼으로 이전
 * 실행: npx ts-node prisma/migrate-contacts.ts
 */
import prisma from '../src/prisma'
import { decrypt, decryptStringArray } from '../src/services/cryptoService'

interface ExternalContact {
  name: string
  phone?: string
  email?: string
}

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

interface ExternalNode {
  id: string
  contacts?: ExternalContact[]
  [key: string]: unknown
}

interface GraphDataJson {
  servers: ServerNode[]
  l7Nodes: L7Node[]
  infraNodes: InfraNode[]
  externalNodes: ExternalNode[]
  dependencies: unknown[]
}

function decryptGraphData(data: GraphDataJson): GraphDataJson {
  return {
    ...data,
    servers: (data.servers ?? []).map(s => ({
      ...s,
      internalIps: s.internalIps ? decryptStringArray(s.internalIps) : s.internalIps,
      natIps: s.natIps ? decryptStringArray(s.natIps) : s.natIps,
    })),
    l7Nodes: (data.l7Nodes ?? []).map(n => ({
      ...n,
      ip: n.ip ? decrypt(n.ip) : n.ip,
    })),
    infraNodes: (data.infraNodes ?? []).map(n => ({
      ...n,
      host: n.host ? decrypt(n.host) : n.host,
    })),
  }
}

async function main() {
  const records = await prisma.graphData.findMany()
  console.log(`Found ${records.length} GraphData records`)

  let migrated = 0
  for (const record of records) {
    const rawData = record.data as unknown as GraphDataJson
    const data = decryptGraphData(rawData)
    const externalNodes = data.externalNodes ?? []

    const contactsMap: Record<string, ExternalContact[]> = {}
    let hasContacts = false

    for (const node of externalNodes) {
      if (node.contacts && node.contacts.length > 0) {
        contactsMap[node.id] = node.contacts
        hasContacts = true
      }
    }

    if (hasContacts) {
      // contacts를 data에서 제거 (암호화된 원본 data에서 직접 제거)
      const originalData = record.data as unknown as GraphDataJson
      const strippedData = {
        ...originalData,
        externalNodes: (originalData.externalNodes ?? []).map(({ contacts: _c, ...rest }: ExternalNode) => rest),
      }

      await prisma.graphData.update({
        where: { id: record.id },
        data: {
          data: strippedData as object,
          contacts: contactsMap as object,
        },
      })
      console.log(`Migrated projectId=${record.projectId}: ${Object.keys(contactsMap).length} nodes`)
      migrated++
    }
  }

  console.log(`Done. Migrated ${migrated} records.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
