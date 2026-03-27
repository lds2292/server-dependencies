import { ProjectMemberRole } from '@prisma/client'

export type PermissionAction =
  | 'read'
  | 'write_graph'
  | 'write_contacts'
  | 'unmask_contacts'
  | 'update_project'
  | 'delete_project'
  | 'add_member'
  | 'manage_writer_readonly'
  | 'manage_admin'
  | 'transfer_ownership'
  | 'view_audit_logs'

const ROLE_PERMISSIONS: Record<ProjectMemberRole, Set<PermissionAction>> = {
  MASTER: new Set([
    'read',
    'write_graph',
    'write_contacts',
    'unmask_contacts',
    'update_project',
    'delete_project',
    'add_member',
    'manage_writer_readonly',
    'manage_admin',
    'transfer_ownership',
    'view_audit_logs',
  ]),
  ADMIN: new Set([
    'read',
    'write_graph',
    'write_contacts',
    'unmask_contacts',
    'update_project',
    'add_member',
    'manage_writer_readonly',
    'view_audit_logs',
  ]),
  WRITER: new Set([
    'read',
    'write_graph',
    'write_contacts',
    'unmask_contacts',
  ]),
  READONLY: new Set([
    'read',
    'unmask_contacts',
  ]),
}

export function can(role: ProjectMemberRole, action: PermissionAction): boolean {
  return ROLE_PERMISSIONS[role].has(action)
}

// actor가 target 역할의 멤버를 관리(추가/제거/역할변경)할 수 있는지 확인
export function canManageTarget(actorRole: ProjectMemberRole, targetRole: ProjectMemberRole): boolean {
  if (actorRole === 'MASTER') return targetRole !== 'MASTER'
  if (actorRole === 'ADMIN') return targetRole === 'WRITER' || targetRole === 'READONLY'
  return false
}

// actor가 멤버를 추가할 때 해당 role을 부여할 수 있는지 확인
export function canAssignRole(actorRole: ProjectMemberRole, targetRole: ProjectMemberRole): boolean {
  if (actorRole === 'MASTER') return targetRole !== 'MASTER'
  if (actorRole === 'ADMIN') return targetRole === 'WRITER' || targetRole === 'READONLY'
  return false
}
