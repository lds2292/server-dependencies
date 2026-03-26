/**
 * 데이터 레이어 추상화 composable.
 * 현재는 Pinia store를 직접 사용하며, 차후 백엔드 API로 교체 시
 * 이 파일의 구현만 변경하면 됩니다.
 */
import { useGraphStore } from '../stores/graph'
import type { Server, L7Node, AnyNode, Dependency } from '../types'

export function useApi() {
  const store = useGraphStore()

  return {
    // Servers
    getServers: () => store.servers,
    addServer: (data: Omit<Server, 'id'>) => store.addServer(data),
    updateServer: (id: string, data: Partial<Omit<Server, 'id'>>) => store.updateServer(id, data),
    deleteServer: (id: string) => store.deleteServer(id),

    // L7 Nodes
    getL7Nodes: () => store.l7Nodes,
    addL7Node: (data: Omit<L7Node, 'id'>) => store.addL7Node(data),
    updateL7Node: (id: string, data: Partial<Omit<L7Node, 'id'>>) => store.updateL7Node(id, data),
    deleteL7Node: (id: string) => store.deleteL7Node(id),

    // Dependencies
    getDependencies: () => store.dependencies,
    addDependency: (data: Omit<Dependency, 'id'>) => store.addDependency(data),
    removeDependency: (id: string) => store.removeDependency(id),

    // Analysis
    getImpactedNodes: (id: string) => store.getImpactedNodes(id),
    findNodeById: (id: string): AnyNode | undefined => store.findNodeById(id),

    // I/O
    exportJSON: () => store.exportJSON(),
    importJSON: (file: File) => store.importJSON(file),
  }
}
