import type { GraphData } from '../types'

export const sampleData: GraphData = {
  servers: [
    { id: 'sample-s1', nodeKind: 'server', name: 'api-server-1', team: 'Backend', internalIps: ['10.0.1.11', '10.0.2.11'], natIps: ['203.0.113.11'], description: 'API 서버 인스턴스 1' },
    { id: 'sample-s2', nodeKind: 'server', name: 'api-server-2', team: 'Backend', internalIps: ['10.0.1.12'], natIps: ['203.0.113.12'], description: 'API 서버 인스턴스 2' },
    { id: 'sample-s3', nodeKind: 'server', name: 'web-server-1', team: 'Frontend', internalIps: ['10.0.2.11'], natIps: ['203.0.113.21', '203.0.113.22'], description: '웹 서버 인스턴스 1' },
    { id: 'sample-s4', nodeKind: 'server', name: 'web-server-2', team: 'Frontend', internalIps: ['10.0.2.12'], natIps: ['203.0.113.22'], description: '웹 서버 인스턴스 2' },
    { id: 'sample-s5', nodeKind: 'server', name: 'auth-server', team: 'Platform', internalIps: ['10.0.3.11'], natIps: ['203.0.113.31'], description: '인증/인가 서버' },
    { id: 'sample-s6', nodeKind: 'server', name: 'batch-server', team: 'Backend', internalIps: ['10.0.1.21'], natIps: [], description: '배치 처리 서버' },
    { id: 'sample-s7', nodeKind: 'server', name: 'notification-server', team: 'Platform', internalIps: ['10.0.3.21'], natIps: ['203.0.113.51'], description: '알림 발송 서버' },
  ],
  l7Nodes: [
    { id: 'sample-l1', nodeKind: 'l7', name: 'api-lb', ip: '10.0.0.10', memberServerIds: ['sample-s1', 'sample-s2'], description: 'API 서버 L7 로드밸런서' },
    { id: 'sample-l2', nodeKind: 'l7', name: 'web-lb', ip: '10.0.0.20', memberServerIds: ['sample-s3', 'sample-s4'], description: '웹 서버 L7 로드밸런서' },
  ],
  infraNodes: [
    { id: 'sample-d1', nodeKind: 'infra', name: 'user-db', infraType: 'PostgreSQL', host: '10.0.10.11', port: '5432', description: '사용자 정보 DB' },
    { id: 'sample-d2', nodeKind: 'infra', name: 'product-db', infraType: 'MySQL', host: '10.0.10.12', port: '3306', description: '상품 정보 DB' },
    { id: 'sample-d3', nodeKind: 'infra', name: 'session-db', infraType: 'Redis', host: '10.0.10.13', port: '6379', description: '세션 캐시' },
    { id: 'sample-d4', nodeKind: 'infra', name: 'analytics-db', infraType: 'MongoDB', host: '10.0.10.14', port: '27017', description: '분석 데이터 DB' },
  ],
  dnsNodes: [
    { id: 'sample-dns1', nodeKind: 'dns' as const, name: 'api.example.com', dnsType: 'A', recordValue: '10.0.0.10', ttl: 300, provider: 'Route53', description: 'API 도메인' },
    { id: 'sample-dns2', nodeKind: 'dns' as const, name: 'www.example.com', dnsType: 'CNAME', recordValue: 'cdn.example.com', ttl: 3600, provider: 'CloudFlare', description: '웹 프론트 도메인' },
  ],
  externalNodes: [
    { id: 'sample-e1', nodeKind: 'external', name: 'Slack', contacts: [{ name: '인프라팀', email: 'infra@company.com' }], description: '팀 알림 채널' },
    { id: 'sample-e2', nodeKind: 'external', name: 'Payment Gateway', hasFirewall: true, contacts: [{ name: '결제팀', email: 'payment@company.com' }], description: 'PG사 결제 연동' },
    { id: 'sample-e3', nodeKind: 'external', name: 'SMS Gateway', contacts: [{ name: '플랫폼팀', email: 'platform@company.com' }], description: 'SMS 발송 서비스' },
  ],
  dependencies: [
    { id: 'sample-dep1',  source: 'sample-s3', target: 'sample-l1', type: 'http',  description: '웹 → API LB' },
    { id: 'sample-dep2',  source: 'sample-s4', target: 'sample-l1', type: 'http',  description: '웹 → API LB' },
    { id: 'sample-dep3',  source: 'sample-s1', target: 'sample-s5', type: 'http',  description: '인증 서비스 호출' },
    { id: 'sample-dep4',  source: 'sample-s2', target: 'sample-s5', type: 'http',  description: '인증 서비스 호출' },
    { id: 'sample-dep5',  source: 'sample-s1', target: 'sample-d1', type: 'tcp',    description: '사용자 정보 조회' },
    { id: 'sample-dep6',  source: 'sample-s2', target: 'sample-d2', type: 'tcp',    description: '상품 정보 조회' },
    { id: 'sample-dep7',  source: 'sample-s1', target: 'sample-d3', type: 'tcp',    description: '세션 캐시' },
    { id: 'sample-dep8',  source: 'sample-s2', target: 'sample-d3', type: 'tcp',    description: '세션 캐시' },
    { id: 'sample-dep9',  source: 'sample-s5', target: 'sample-d1', type: 'tcp',    description: '사용자 인증 정보' },
    { id: 'sample-dep10', source: 'sample-s6', target: 'sample-d4', type: 'tcp',    description: '분석 데이터 적재' },
    { id: 'sample-dep11', source: 'sample-s6', target: 'sample-d2', type: 'tcp',    description: '상품 배치 처리' },
    { id: 'sample-dep12', source: 'sample-s7', target: 'sample-e1', type: 'http',  description: 'Slack 알림' },
    { id: 'sample-dep13', source: 'sample-s7', target: 'sample-e3', type: 'http',  description: 'SMS 발송' },
    { id: 'sample-dep14', source: 'sample-s1', target: 'sample-s7', type: 'http',  description: '알림 서비스 호출' },
    { id: 'sample-dep15', source: 'sample-s1', target: 'sample-e2', type: 'http',  description: '결제 처리' },
    { id: 'sample-dep-dns1', source: 'sample-dns1', target: 'sample-l1', type: 'dns', description: 'API 도메인 -> L7' },
    { id: 'sample-dep-dns2', source: 'sample-dns2', target: 'sample-s3', type: 'dns', description: '웹 도메인 -> 웹서버' },
  ],
}
