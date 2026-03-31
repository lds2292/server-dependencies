<template>
  <div class="app-layout" :style="{ gridTemplateColumns: `250px 1fr ${detailPanelOpen ? '270px' : '28px'}` }">
    <aside class="sidebar">
      <ServerPanel
        :servers="store.servers"
        :l7-nodes="store.l7Nodes"
        :infra-nodes="store.infraNodes"
        :external-nodes="store.externalNodes"
        :dns-nodes="store.dnsNodes"
        :selected-id="selectedNode?.id ?? null"
        :read-only="readOnly"
        @select="onSelectNode"
        @add-server="openAddServerModal"
        @add-l7="openAddL7Modal"
        @add-infra="openAddInfraModal"
        @add-external="openAddExternalModal"
        @add-dns="openAddDnsModal"
        @edit="onEditNode"
        @delete="onDeleteNode"
      />
    </aside>

    <main class="main-area">
      <div class="toolbar">
        <div class="title-group">
          <button class="btn-ghost btn-sm" @click="router.replace({ name: 'projects' })">← {{ $t('project.toolbar.backToList') }}</button>
          <span class="app-title">{{ projectStore.currentProject?.name ?? 'Server Dependencies' }}</span>
          <button class="btn-help" @click="showHelp = true" :title="$t('project.toolbar.help')">?</button>
          <div v-if="!readOnly" class="autosave-group">
            <button
              :class="['btn-outline', 'btn-sm', 'btn-save-local', { dirty: store.positionsDirty }]"
              @click="manualSave"
              :data-tooltip="$t('project.toolbar.save')"
              data-shortcut="Cmd+S"
            >{{ $t('project.toolbar.save') }}{{ store.positionsDirty ? ' *' : '' }}</button>
            <button
              class="btn-autosave"
              @click="store.setAutosaveEnabled(!store.autosaveEnabled)"
              :data-tooltip="store.autosaveEnabled ? $t('project.toolbar.autoSaveOn') : $t('project.toolbar.autoSaveOff')"
            >
              <span :class="['autosave-dot', { active: store.autosaveEnabled }]"></span>
              {{ $t('project.toolbar.autoSave') }}
            </button>
            <CustomSelect
              v-if="store.autosaveEnabled"
              class="select-interval"
              :model-value="String(store.autosaveInterval)"
              :options="[
                { value: '30', label: $t('interval.30') },
                { value: '60', label: $t('interval.60') },
                { value: '90', label: $t('interval.90') },
                { value: '120', label: $t('interval.120') },
                { value: '180', label: $t('interval.180') },
              ]"
              @update:model-value="store.setAutosaveInterval(Number($event))"
            />
          </div>
        </div>
        <div class="toolbar-right">
          <button
            :class="['btn-mode-toggle', { active: readOnly }]"
            @click="projectStore.canWrite ? (readOnly = !readOnly) : null"
            :data-tooltip="!projectStore.canWrite ? $t('project.toolbar.readOnlyHint') : readOnly ? $t('project.toolbar.switchToEdit') : $t('project.toolbar.switchToReadOnly')"
            data-shortcut="E"
            :disabled="!projectStore.canWrite"
          >{{ readOnly ? $t('project.toolbar.readOnly') : $t('project.toolbar.editMode') }}</button>

          <div v-if="projectStore.canWrite" class="toolbar-dropdown-wrap" ref="importWrapRef">
            <button class="btn-mode-toggle" @click.stop="showImportDropdown = !showImportDropdown; showSettingsDropdown = false">
              Import <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style="margin-left:2px"><path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <div v-if="showImportDropdown" class="toolbar-dropdown">
              <button @click="showTerraformImport = true; showImportDropdown = false">
                Terraform <span class="menu-beta-badge">Beta</span>
              </button>
            </div>
          </div>

          <div v-if="hasSettingsItems" class="toolbar-dropdown-wrap" ref="settingsWrapRef">
            <button class="btn-toolbar-icon" @click.stop="showSettingsDropdown = !showSettingsDropdown; showImportDropdown = false" :data-tooltip="$t('project.toolbar.settings')">
              <Icon name="settings" :size="16" />
            </button>
            <div v-if="showSettingsDropdown" class="toolbar-dropdown">
              <button v-if="projectStore.canAdmin" @click="router.push({ name: 'projectSettings', params: { id: projectStore.currentProject!.id } }); showSettingsDropdown = false">{{ $t('project.toolbar.projectSettings') }}</button>
              <button v-if="projectStore.canAdmin" @click="router.push({ name: 'auditLogs', params: { id: projectStore.currentProject!.id } }); showSettingsDropdown = false">{{ $t('project.toolbar.auditLogs') }}</button>
              <button v-if="projectStore.canAdmin" @click="onOpenMembersModal(); showSettingsDropdown = false">{{ $t('project.toolbar.memberManagement') }}</button>
              <div v-if="projectStore.canAdmin && projectStore.canWrite && !hasData" class="toolbar-dropdown-divider"></div>
              <button v-if="projectStore.canWrite && !hasData" @click="onSampleClick(); showSettingsDropdown = false">{{ $t('project.toolbar.loadSample') }}</button>
            </div>
          </div>

          <UserProfileDropdown @logout="showLogoutConfirm = true" @toggle="showSettingsDropdown = false; showImportDropdown = false" />
        </div>
      </div>
      <div class="graph-wrap">
        <GraphCanvas
          ref="graphCanvasRef"
          :nodes="allNodes"
          :links="filteredLinks"
          :impacted-nodes="impactedNodeIds"
          :impacted-links="impactedLinkIds"
          :outgoing-links="outgoingLinkIds"
          :selected-id="selectedNode?.id ?? null"
          :read-only="readOnly"
          :path-nodes="pathNodeIds"
          :path-links="pathLinkIds"
          :path-source-name="pathSource?.name ?? ''"
          :path-mode="pathMode"
          :cycle-nodes="cycleNodeIds"
          @node-click="onSelectNode"
          @deselect="selectedNode = null"
          @search-select="selectedNode = $event"
          @edit-node="onEditNode"
          @delete-node="onDeleteNode"
          @delete-nodes="onDeleteNodes"
          @add-dependency="openAddDepModal"
          @quick-connect="onQuickConnect"
          @add-node-at="onAddNodeAt"
          @start-path-from="onStartPathFrom"
          @cancel-path-mode="onCancelPathMode"
          @link-dbl-click="onLinkDblClick"
        />
        <div v-if="!hasData && projectStore.canWrite && !readOnly" class="empty-state-cta">
          <p class="empty-state-title">{{ $t('project.emptyState.title') }}</p>
          <p class="empty-state-desc">{{ $t('project.emptyState.desc') }}</p>
          <div class="empty-state-actions">
            <button class="btn-outline btn-lg" @click="loadSample">{{ $t('project.emptyState.loadSample') }}</button>
            <button class="btn-ghost btn-lg" @click="openAddServerModal">{{ $t('project.emptyState.addNode') }}</button>
          </div>
        </div>
      </div>
    </main>

    <aside :class="['detail-panel', { collapsed: !detailPanelOpen }]">
      <button class="detail-toggle" @click="detailPanelOpen = !detailPanelOpen" :title="detailPanelOpen ? '패널 접기' : '패널 열기'">
        <Icon :name="detailPanelOpen ? 'panel-right' : 'panel-left'" :size="12" />
      </button>
      <div v-if="detailPanelOpen" class="detail-panel-content">
        <ImpactPanel
          :selected-node="selectedNode"
          :all-nodes="allNodes"
          :dependencies="store.dependencies"
          :impacted-ids="impactedNodeIds"
          :read-only="readOnly"
          :current-project-id="projectStore.currentProject?.id ?? ''"
          @remove-dependency="store.removeDependency"
          @edit-dependency="openEditDepModal"
          @add-dependency="openAddDepModal"
          @clear-selection="selectedNode = null"
          @navigate-to="graphCanvasRef?.navigateTo($event)"
        />
      </div>
    </aside>

    <!-- 단축키 오버레이 -->
    <transition name="shortcuts-fade">
      <div v-if="showShortcuts" class="shortcuts-overlay" @click.self="showShortcuts = false">
        <div class="shortcuts-modal">
          <div class="shortcuts-header">
            <span class="shortcuts-title">{{ $t('project.shortcuts.title') }}</span>
            <button class="shortcuts-close" @click="showShortcuts = false">
              <Icon name="close" :size="12" />
            </button>
          </div>
          <div class="shortcuts-section-title">{{ $t('project.shortcuts.global') }}</div>
          <div class="shortcuts-grid">
            <div class="shortcut-row"><kbd>Cmd+Z</kbd><span>{{ $t('project.shortcuts.undo') }}</span></div>
            <div class="shortcut-row"><kbd>Cmd+Shift+Z</kbd><span>{{ $t('project.shortcuts.redo') }}</span></div>
            <div class="shortcut-row"><kbd>E</kbd><span>{{ $t('project.shortcuts.toggleEdit') }}</span></div>
            <div class="shortcut-row"><kbd>F</kbd><span>{{ $t('project.shortcuts.tracking') }}</span></div>
            <div class="shortcut-row"><kbd>Delete</kbd><span>{{ $t('project.shortcuts.deleteNode') }}</span></div>
            <div class="shortcut-row"><kbd>?</kbd><span>{{ $t('project.shortcuts.openHelp') }}</span></div>
            <div class="shortcut-row"><kbd>Esc</kbd><span>{{ $t('project.shortcuts.escape') }}</span></div>
          </div>
          <div class="shortcuts-section-title">{{ $t('project.shortcuts.canvasTitle') }}</div>
          <div class="shortcuts-grid">
            <div class="shortcut-row"><kbd>{{ $t('project.shortcuts.dblClick') }}</kbd><span>{{ $t('project.shortcuts.dblClick') }}</span></div>
            <div class="shortcut-row"><kbd>Ctrl</kbd><span>{{ $t('project.shortcuts.ctrlDrag') }}</span></div>
            <div class="shortcut-row"><kbd>Click</kbd><span>{{ $t('project.shortcuts.clickEmpty') }}</span></div>
            <div class="shortcut-row"><kbd>Right-click</kbd><span>{{ $t('project.shortcuts.rightClick') }}</span></div>
          </div>
          <div class="shortcuts-section-title">{{ $t('project.shortcuts.minimapTitle') }}</div>
          <div class="shortcuts-grid">
            <div class="shortcut-row"><kbd>Click / Drag</kbd><span>{{ $t('project.shortcuts.minimapClick') }}</span></div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 도움말 팝업 -->
    <transition name="shortcuts-fade">
      <div v-if="showHelp" class="shortcuts-overlay" @click.self="showHelp = false">
        <div class="help-modal">
          <div class="shortcuts-header">
            <span class="shortcuts-title">{{ $t('project.help.title') }}</span>
            <button class="shortcuts-close" @click="showHelp = false">
              <Icon name="close" :size="12" />
            </button>
          </div>

          <div class="help-body">
            <div class="help-col">
              <div class="shortcuts-section-title">{{ $t('project.help.nodeTypes') }}</div>
              <div class="help-node-list">
                <div class="help-node-item">
                  <span class="help-node-badge server">SRV</span>
                  <div>
                    <div class="help-node-name">{{ $t('project.help.server') }}</div>
                    <div class="help-node-desc">{{ $t('project.help.serverDesc') }}</div>
                  </div>
                </div>
                <div class="help-node-item">
                  <span class="help-node-badge l7">L7</span>
                  <div>
                    <div class="help-node-name">{{ $t('project.help.l7') }}</div>
                    <div class="help-node-desc">{{ $t('project.help.l7Desc') }}</div>
                  </div>
                </div>
                <div class="help-node-item">
                  <span class="help-node-badge infra">DB</span>
                  <div>
                    <div class="help-node-name">{{ $t('project.help.infra') }}</div>
                    <div class="help-node-desc">{{ $t('project.help.infraDesc') }}</div>
                  </div>
                </div>
                <div class="help-node-item">
                  <span class="help-node-badge ext">EXT</span>
                  <div>
                    <div class="help-node-name">{{ $t('project.help.external') }}</div>
                    <div class="help-node-desc">{{ $t('project.help.externalDesc') }}</div>
                  </div>
                </div>
              </div>

              <div class="shortcuts-section-title">{{ $t('project.help.impactAnalysis') }}</div>
              <div class="help-desc-list">
                <div class="help-desc-item">
                  <span class="help-dot red"></span>
                  {{ $t('impactPanel.incoming') }}
                </div>
                <div class="help-desc-item">
                  <span class="help-dot green"></span>
                  {{ $t('impactPanel.outgoing') }}
                </div>
                <div class="help-desc-item">
                  <span class="help-dot amber"></span>
                  {{ $t('graph.contextMenu.pathFind') }}
                </div>
              </div>
            </div>

            <div class="help-divider"></div>

            <div class="help-col">
              <div class="shortcuts-section-title">{{ $t('project.shortcuts.canvasTitle') }}</div>
              <div class="shortcuts-grid">
                <div class="shortcut-row"><kbd>Drag</kbd><span>Box select</span></div>
                <div class="shortcut-row"><kbd>Space</kbd><span>+ drag to pan</span></div>
                <div class="shortcut-row"><kbd>Ctrl</kbd><span>{{ $t('project.shortcuts.ctrlDrag') }}</span></div>
                <div class="shortcut-row"><kbd>Dbl-click</kbd><span>{{ $t('project.shortcuts.dblClick') }}</span></div>
                <div class="shortcut-row"><kbd>Right-click</kbd><span>{{ $t('project.shortcuts.rightClick') }}</span></div>
                <div class="shortcut-row"><kbd>Wheel</kbd><span>Zoom in / out</span></div>
                <div class="shortcut-row"><kbd>Minimap</kbd><span>{{ $t('project.shortcuts.minimapClick') }}</span></div>
              </div>

              <div class="shortcuts-section-title">{{ $t('project.shortcuts.title') }}</div>
              <div class="shortcuts-grid">
                <div class="shortcut-row"><kbd>Cmd+Z</kbd><span>{{ $t('project.shortcuts.undo') }}</span></div>
                <div class="shortcut-row"><kbd>Cmd+Shift+Z</kbd><span>{{ $t('project.shortcuts.redo') }}</span></div>
                <div class="shortcut-row"><kbd>E</kbd><span>{{ $t('project.shortcuts.toggleEdit') }}</span></div>
                <div class="shortcut-row"><kbd>F</kbd><span>{{ $t('project.shortcuts.tracking') }}</span></div>
                <div class="shortcut-row"><kbd>Delete</kbd><span>{{ $t('project.shortcuts.deleteNode') }}</span></div>
                <div class="shortcut-row"><kbd>?</kbd><span>{{ $t('project.shortcuts.openHelp') }}</span></div>
                <div class="shortcut-row"><kbd>Esc</kbd><span>{{ $t('project.shortcuts.escape') }}</span></div>
              </div>

              <div class="shortcuts-section-title">{{ $t('serverPanel.title') }}</div>
              <div class="shortcuts-grid">
                <div class="shortcut-row"><kbd>+</kbd><span>{{ $t('graph.contextMenu.addNode') }}</span></div>
                <div class="shortcut-row"><kbd>JSON Export</kbd><span>{{ $t('graph.export.submit') }}</span></div>
                <div class="shortcut-row"><kbd>JSON Import</kbd><span>Import</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 모달들 -->
    <ServerModal
      v-if="serverModal.visible"
      :server="serverModal.editing"
      :teams="existingTeams"
      :taken-names="allNodeNames"
      @close="serverModal.visible = false"
      @submit="onServerModalSubmit"
    />
    <L7Modal
      v-if="l7Modal.visible"
      :node="l7Modal.editing"
      :servers="store.servers"
      :taken-names="allNodeNames"
      @close="l7Modal.visible = false"
      @submit="onL7ModalSubmit"
    />
    <InfraModal
      v-if="infraModal.visible"
      :node="infraModal.editing"
      :taken-names="allNodeNames"
      @close="infraModal.visible = false"
      @submit="onInfraModalSubmit"
    />
    <DnsModal
      v-if="dnsModal.visible"
      :node="dnsModal.editing"
      :taken-names="allNodeNames"
      @close="dnsModal.visible = false"
      @submit="onDnsModalSubmit"
    />
    <ExternalServiceModal
      v-if="externalModal.visible"
      :node="externalModal.editing"
      :taken-names="allNodeNames"
      :current-project-id="projectStore.currentProject?.id ?? ''"
      @close="externalModal.visible = false"
      @submit="onExternalModalSubmit"
    />
    <TerraformImportModal
      v-if="showTerraformImport"
      @close="showTerraformImport = false"
      @import="onTerraformImport"
    />
    <!-- Sample 로드 확인 다이얼로그 -->
    <transition name="toast-fade">
      <div v-if="sampleConfirm" class="delete-overlay" @click.self="sampleConfirm = false">
        <div class="delete-dialog">
          <div class="delete-dialog-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="1" stroke="#5b8def" stroke-width="1.5"/>
              <rect x="14" y="3" width="7" height="7" rx="1" stroke="#5b8def" stroke-width="1.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1" stroke="#5b8def" stroke-width="1.5"/>
              <rect x="14" y="14" width="7" height="7" rx="1" stroke="#5b8def" stroke-width="1.5"/>
            </svg>
          </div>
          <div class="delete-dialog-body">
            <div class="delete-dialog-title">{{ $t('project.sampleConfirm.title') }}</div>
            <div class="delete-dialog-desc">
              {{ $t('project.sampleConfirm.desc') }}
            </div>
          </div>
          <div class="delete-dialog-actions">
            <button class="btn-ghost delete-dialog-btn" @click="sampleConfirm = false">{{ $t('common.cancel') }}</button>
            <button class="btn-outline delete-dialog-btn" @click="loadSample">{{ $t('project.sampleConfirm.load') }}</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 다중 노드 삭제 확인 다이얼로그 -->
    <transition name="toast-fade">
      <div v-if="deleteMultiConfirm.visible" class="delete-overlay" @click.self="cancelDeleteMulti">
        <div class="delete-dialog">
          <div class="delete-dialog-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4M12 17h.01" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#ef4444" stroke-width="1.5" fill="none"/>
            </svg>
          </div>
          <div class="delete-dialog-body">
            <div class="delete-dialog-title">{{ $t('project.deleteMulti.title', { count: deleteMultiConfirm.nodeIds.length }) }}</div>
            <div class="delete-dialog-desc">
              {{ $t('project.deleteMulti.desc', { count: deleteMultiConfirm.nodeIds.length }) }}
            </div>
          </div>
          <div class="delete-dialog-actions">
            <button class="btn-ghost delete-dialog-btn" @click="cancelDeleteMulti">{{ $t('common.cancel') }}</button>
            <button class="btn-danger delete-dialog-btn" @click="confirmDeleteMulti">{{ $t('common.delete') }}</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 노드 삭제 확인 다이얼로그 -->
    <transition name="toast-fade">
      <div v-if="deleteConfirm.visible" class="delete-overlay" @click.self="cancelDelete">
        <div class="delete-dialog">
          <div class="delete-dialog-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4M12 17h.01" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#ef4444" stroke-width="1.5" fill="none"/>
            </svg>
          </div>
          <div class="delete-dialog-body">
            <div class="delete-dialog-title">{{ $t('project.deleteNode.title') }}</div>
            <div class="delete-dialog-desc">
              {{ $t('project.deleteNode.desc', { kind: nodeKindLabel(deleteConfirm.node!), name: deleteConfirm.node!.name }) }}
            </div>
          </div>
          <div class="delete-dialog-actions">
            <button class="btn-ghost delete-dialog-btn" @click="cancelDelete">{{ $t('common.cancel') }}</button>
            <button class="btn-danger delete-dialog-btn" @click="confirmDelete">{{ $t('common.delete') }}</button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="toast-fade">
      <div v-if="toastMsg" :class="['app-toast', toastType]">{{ toastMsg }}</div>
    </transition>

    <transition name="loading-fade">
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner"></div>
      </div>
    </transition>
    <!-- 충돌 해결 모달 -->
    <GraphConflictModal
      v-if="store.conflictState"
      :conflicts="store.conflictState.conflicts"
      @resolve="store.resolveConflicts"
      @dismiss="store.dismissConflict"
    />

    <!-- 로그아웃 확인 모달 -->
    <transition name="toast-fade">
      <div v-if="showLogoutConfirm" class="delete-overlay" @click.self="showLogoutConfirm = false">
        <div class="delete-dialog">
          <div class="delete-dialog-body">
            <div class="delete-dialog-title">{{ $t('common.logout') }}</div>
            <div class="delete-dialog-desc">{{ $t('common.logoutConfirm') }}</div>
          </div>
          <div class="delete-dialog-actions">
            <button class="btn-ghost delete-dialog-btn" @click="showLogoutConfirm = false">{{ $t('common.cancel') }}</button>
            <button class="btn-danger delete-dialog-btn" @click="authStore.logout()">{{ $t('common.logout') }}</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 멤버 관리 모달 -->
    <transition name="toast-fade">
      <div v-if="showMembersModal" class="delete-overlay" @mousedown.self="membersOverlayMousedown = true" @mouseup.self="membersOverlayMousedown && (showMembersModal = false); membersOverlayMousedown = false">
        <div class="members-modal">
          <div class="shortcuts-header">
            <span class="shortcuts-title">{{ $t('project.toolbar.memberManagement') }}</span>
            <button class="shortcuts-close" @click="showMembersModal = false">
              <Icon name="close" :size="12" />
            </button>
          </div>

          <!-- 멤버 목록 -->
          <div class="members-list">
            <div
              v-for="member in projectStore.currentProject?.members"
              :key="member.userId"
              class="member-row"
            >
              <div class="member-info">
                <span class="member-name">{{ member.user.username }}</span>
                <span class="member-email">{{ member.user.email }}</span>
              </div>
              <div class="member-actions">
                <span v-if="member.userId === authStore.user?.id" :class="['role-badge', member.role.toLowerCase()]">
                  {{ roleLabel(member.role) }}
                </span>
                <CustomSelect
                  v-else-if="canChangeRole(member.role)"
                  class="role-select"
                  :model-value="member.role"
                  :options="assignableRoles(member.role).map(r => ({ value: r, label: roleLabel(r) }))"
                  @update:model-value="onChangeRole(member.userId, $event)"
                />
                <span v-else :class="['role-badge', member.role.toLowerCase()]">{{ roleLabel(member.role) }}</span>
                <button
                  v-if="canRemoveMember(member.role, member.userId)"
                  class="btn-danger-ghost btn-sm"
                  @click="onRemoveMember(member.userId)"
                  :title="$t('settings.removeMember')"
                >{{ $t('settings.removeMember') }}</button>
              </div>
            </div>
          </div>

          <!-- 초대 전송 -->
          <div v-if="projectStore.canAdmin" class="member-add-form">
            <input
              v-model="addMemberIdentifier"
              class="member-input"
              :placeholder="$t('settings.emailPlaceholder')"
              @keydown.enter="onSendInvitation"
            />
            <CustomSelect
              v-model="addMemberRole"
              class="role-select"
              :options="addableRoles.map(r => ({ value: r, label: roleLabel(r) }))"
            />
            <button class="btn-outline btn-sm" @click="onSendInvitation" :disabled="!addMemberIdentifier.trim()">{{ $t('settings.invite') }}</button>
          </div>
          <div v-if="memberError" class="member-error">{{ memberError }}</div>

          <!-- 대기 중인 초대 -->
          <div v-if="projectStore.canAdmin && projectStore.projectInvitations.length > 0" class="pending-invitations">
            <div class="pending-invitations-title">{{ $t('settings.pendingInvitations') }}</div>
            <div v-for="inv in projectStore.projectInvitations" :key="inv.id" class="pending-inv-row">
              <div class="pending-inv-info">
                <span class="member-name">{{ inv.invitee.email }}</span>
                <span :class="['role-badge', inv.role.toLowerCase()]">{{ roleLabel(inv.role) }}</span>
                <span class="pending-status">{{ $t('settings.pendingStatus') }}</span>
              </div>
              <button class="btn-danger-ghost btn-sm" @click="onCancelInvitation(inv.id)" :title="$t('settings.cancelInvite')">{{ $t('common.cancel') }}</button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <DependencyModal
      v-if="depModal.visible"
      :nodes="allNodes"
      :default-source="depModal.defaultSource"
      :default-target="depModal.defaultTarget"
      :existing-dependencies="store.dependencies"
      :editing-dep="depModal.editingDep"
      @close="depModal.visible = false"
      @submit="onDepModalSubmit"
      @update="onDepModalUpdate"
    />


  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useGraphStore } from '../stores/graph'
import { useProjectStore } from '../stores/project'
import { useAuthStore } from '../stores/auth'
import type { ProjectMemberRole } from '../api/projectApi'
import { sampleData } from '../data/sampleData'
import GraphCanvas from '../components/GraphCanvas.vue'
import GraphConflictModal from '../components/GraphConflictModal.vue'
import ServerPanel from '../components/ServerPanel.vue'
import ServerModal from '../components/ServerModal.vue'
import L7Modal from '../components/L7Modal.vue'
import InfraModal from '../components/InfraModal.vue'
import ExternalServiceModal from '../components/ExternalServiceModal.vue'
import DependencyModal from '../components/DependencyModal.vue'
import DnsModal from '../components/DnsModal.vue'
import TerraformImportModal from '../components/TerraformImportModal.vue'
import type { TfParseResult } from '../utils/terraformParser'
import ImpactPanel from '../components/ImpactPanel.vue'
import UserProfileDropdown from '../components/UserProfileDropdown.vue'
import Icon from '../components/Icon.vue'
import CustomSelect from '../components/CustomSelect.vue'
import { graphApi } from '../api/graphApi'
import type { Server, L7Node, InfraNode, ExternalServiceNode, DnsNode, AnyNode, Dependency, D3Link } from '../types'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const authStore = useAuthStore()

const store = useGraphStore()
const selectedNode = ref<AnyNode | null>(null)
const readOnly = ref(false)
const showShortcuts = ref(false)
const showSettingsDropdown = ref(false)
const showTerraformImport = ref(false)
const showImportDropdown = ref(false)
const importWrapRef = ref<HTMLDivElement>()
const settingsWrapRef = ref<HTMLDivElement>()
const showHelp = ref(false)
const detailPanelOpen = ref(true)
const pathSource = ref<AnyNode | null>(null)
const pathMode = ref(false)
const pathNodeIds = ref(new Set<string>())
const pathLinkIds = ref(new Set<string>())
const graphCanvasRef = ref<InstanceType<typeof GraphCanvas> | null>(null)

const allNodes = computed<AnyNode[]>(() => [
  ...store.servers, ...store.l7Nodes, ...store.infraNodes, ...store.externalNodes, ...store.dnsNodes,
])

const d3Links = computed<D3Link[]>(() =>
  store.dependencies.map(d => ({ id: d.id, source: d.source, target: d.target, type: d.type, description: d.description, hasFirewall: d.hasFirewall, firewallUrl: d.firewallUrl }))
)

const filteredLinks = computed<D3Link[]>(() => {
  const ids = new Set(allNodes.value.map(n => n.id))
  return d3Links.value.filter(l => ids.has(l.source as string) && ids.has(l.target as string))
})

const impactedNodeIds = computed(() =>
  selectedNode.value ? store.getImpactedNodes(selectedNode.value.id) : new Set<string>()
)

const cycleNodeIds = computed(() => store.getCycleNodes())
const impactedLinkIds = computed(() => {
  if (!selectedNode.value) return new Set<string>()
  const ids = impactedNodeIds.value
  const tid = selectedNode.value.id
  // 선택된 노드 + L7 그룹 확장을 target 집합으로 구성
  const targetSet = new Set<string>([tid])
  // 선택된 노드가 L7이면 멤버도 포함
  const l7 = store.l7Nodes.find(n => n.id === tid)
  if (l7) l7.memberServerIds.forEach(mid => targetSet.add(mid))
  // 선택된 노드가 L7 멤버이면 부모 L7과 다른 멤버도 포함
  for (const l7n of store.l7Nodes) {
    if (l7n.memberServerIds.includes(tid)) {
      targetSet.add(l7n.id)
      l7n.memberServerIds.forEach(mid => targetSet.add(mid))
    }
  }
  // impacted 집합에도 target 집합의 노드를 추가 (양쪽 모두 매칭 가능하게)
  const allRelevant = new Set([...ids, ...targetSet])
  return new Set(store.dependencies.filter(d => allRelevant.has(d.source) && allRelevant.has(d.target)).map(d => d.id))
})

const outgoingLinkIds = computed(() => {
  if (!selectedNode.value) return new Set<string>()
  const sid = selectedNode.value.id
  return new Set(store.dependencies.filter(d => d.source === sid).map(d => d.id))
})

const existingTeams = computed(() => [...new Set(store.servers.map(s => s.team).filter(Boolean))])

const allNodeNames = computed(() => new Set([
  ...store.servers.map(s => s.name),
  ...store.l7Nodes.map(n => n.name),
  ...store.infraNodes.map(n => n.name),
  ...store.externalNodes.map(n => n.name),
  ...store.dnsNodes.map(n => n.name),
]))

function onSelectNode(node: AnyNode) {
  if (pathMode.value) {
    if (node.id === pathSource.value?.id) { onCancelPathMode(); return }
    applyPath(node)
    return
  }
  if (pathNodeIds.value.size > 0) { applyPath(node); return }
  selectedNode.value = selectedNode.value?.id === node.id ? null : node
}

function onStartPathFrom(node: AnyNode) {
  if (node.nodeKind === 'l7') return
  pathSource.value = node
  pathMode.value = true
  pathNodeIds.value = new Set([node.id])
  pathLinkIds.value = new Set()
  selectedNode.value = null
}

function onCancelPathMode() {
  pathSource.value = null
  pathMode.value = false
  pathNodeIds.value = new Set()
  pathLinkIds.value = new Set()
}

function applyPath(targetNode: AnyNode) {
  if (!pathSource.value) return
  if (targetNode.nodeKind === 'l7') { showToast(t('project.toast.l7PathBlocked')); return }
  const path = store.findPath(pathSource.value.id, targetNode.id)
  if (!path || path.length < 2) {
    showToast(t('project.toast.noPath'))
    return
  }
  // 경로에 L7이 포함되면 실제 경로에 관여하는 멤버만 포함
  const pathSet = new Set(path)
  const expandedPath = [...path]
  for (const nodeId of path) {
    const l7 = store.l7Nodes.find(n => n.id === nodeId)
    if (!l7) continue
    for (const memberId of l7.memberServerIds) {
      if (expandedPath.includes(memberId)) continue
      // 이 멤버가 경로 내 다른 노드와 의존성이 있는지 확인
      const isRelevant = store.dependencies.some(d =>
        (d.source === memberId && pathSet.has(d.target)) ||
        (d.target === memberId && pathSet.has(d.source))
      )
      if (isRelevant) expandedPath.push(memberId)
    }
  }
  const pathNodeSet = new Set(expandedPath)
  pathNodeIds.value = pathNodeSet
  // 경로 노드 집합 내의 모든 의존성 링크를 수집
  const linkIds = new Set<string>()
  for (const dep of store.dependencies) {
    if (pathNodeSet.has(dep.source) && pathNodeSet.has(dep.target)) {
      linkIds.add(dep.id)
    }
  }
  pathLinkIds.value = linkIds
  pathMode.value = false
}
function onEditNode(node: AnyNode) {
  if (node.nodeKind === 'l7') openEditL7Modal(node as L7Node)
  else if (node.nodeKind === 'infra') openEditInfraModal(node as InfraNode)
  else if (node.nodeKind === 'external') openEditExternalModal(node as ExternalServiceNode)
  else if (node.nodeKind === 'dns') openEditDnsModal(node as DnsNode)
  else openEditServerModal(node as Server)
}
// ─── 노드 삭제 확인 다이얼로그 ───────────────────────────
const deleteConfirm = ref<{ visible: boolean; node: AnyNode | null }>({ visible: false, node: null })
const deleteMultiConfirm = ref<{ visible: boolean; nodeIds: string[] }>({ visible: false, nodeIds: [] })

function onDeleteNode(node: AnyNode) {
  deleteConfirm.value = { visible: true, node }
}

function confirmDelete() {
  const node = deleteConfirm.value.node
  if (!node) return
  if (node.nodeKind === 'l7') store.deleteL7Node(node.id)
  else if (node.nodeKind === 'infra') store.deleteInfraNode(node.id)
  else if (node.nodeKind === 'external') store.deleteExternalNode(node.id)
  else if (node.nodeKind === 'dns') store.deleteDnsNode(node.id)
  else store.deleteServer(node.id)
  if (selectedNode.value?.id === node.id) selectedNode.value = null
  deleteConfirm.value = { visible: false, node: null }
}

function cancelDelete() {
  deleteConfirm.value = { visible: false, node: null }
}

function onDeleteNodes(nodeIds: string[]) {
  deleteMultiConfirm.value = { visible: true, nodeIds }
}

function confirmDeleteMulti() {
  store.beginBatch()
  for (const id of deleteMultiConfirm.value.nodeIds) {
    const node = allNodes.value.find(n => n.id === id)
    if (!node) continue
    if (node.nodeKind === 'l7') store.deleteL7Node(id)
    else if (node.nodeKind === 'infra') store.deleteInfraNode(id)
    else if (node.nodeKind === 'external') store.deleteExternalNode(id)
    else store.deleteServer(id)
  }
  store.endBatch()
  if (selectedNode.value && deleteMultiConfirm.value.nodeIds.includes(selectedNode.value.id)) {
    selectedNode.value = null
  }
  deleteMultiConfirm.value = { visible: false, nodeIds: [] }
}

function cancelDeleteMulti() {
  deleteMultiConfirm.value = { visible: false, nodeIds: [] }
}

function nodeKindLabel(node: AnyNode): string {
  if (node.nodeKind === 'l7') return t('nodes.l7')
  if (node.nodeKind === 'infra') return t('nodes.infra')
  if (node.nodeKind === 'external') return t('nodes.external')
  return t('nodes.server')
}

// Server Modal
const serverModal = ref<{ visible: boolean; editing: Server | null }>({ visible: false, editing: null })
function openAddServerModal() { serverModal.value = { visible: true, editing: null } }
function openEditServerModal(s: Server) { serverModal.value = { visible: true, editing: s } }
function onServerModalSubmit(data: Omit<Server, 'id'>) {
  if (serverModal.value.editing) store.updateServer(serverModal.value.editing.id, data)
  else store.addServer(data)
  serverModal.value.visible = false
}

// L7 Modal
const l7Modal = ref<{ visible: boolean; editing: L7Node | null }>({ visible: false, editing: null })
function openAddL7Modal() { l7Modal.value = { visible: true, editing: null } }
function openEditL7Modal(n: L7Node) { l7Modal.value = { visible: true, editing: n } }
function onL7ModalSubmit(data: Omit<L7Node, 'id'>) {
  if (l7Modal.value.editing) store.updateL7Node(l7Modal.value.editing.id, data)
  else store.addL7Node(data)
  l7Modal.value.visible = false
}

// Infra Modal
const infraModal = ref<{ visible: boolean; editing: InfraNode | null }>({ visible: false, editing: null })
function openAddInfraModal() { infraModal.value = { visible: true, editing: null } }
function openEditInfraModal(n: InfraNode) { infraModal.value = { visible: true, editing: n } }
function onInfraModalSubmit(data: Omit<InfraNode, 'id'>) {
  if (infraModal.value.editing) store.updateInfraNode(infraModal.value.editing.id, data)
  else store.addInfraNode(data)
  infraModal.value.visible = false
}

// DNS Modal
const dnsModal = ref<{ visible: boolean; editing: DnsNode | null }>({ visible: false, editing: null })
function openAddDnsModal() { dnsModal.value = { visible: true, editing: null } }
function openEditDnsModal(n: DnsNode) { dnsModal.value = { visible: true, editing: n } }
function onDnsModalSubmit(data: Omit<DnsNode, 'id'>) {
  if (dnsModal.value.editing) store.updateDnsNode(dnsModal.value.editing.id, data)
  else store.addDnsNode(data)
  dnsModal.value.visible = false
}

// External Modal
const externalModal = ref<{ visible: boolean; editing: ExternalServiceNode | null }>({ visible: false, editing: null })
function openAddExternalModal() { externalModal.value = { visible: true, editing: null } }
function openEditExternalModal(n: ExternalServiceNode) { externalModal.value = { visible: true, editing: n } }
async function onExternalModalSubmit(data: Omit<ExternalServiceNode, 'id'>) {
  const { contacts, ...nodeData } = data
  const projectId = projectStore.currentProject?.id ?? ''

  if (externalModal.value.editing) {
    const nodeId = externalModal.value.editing.id
    store.updateExternalNode(nodeId, { ...nodeData, contacts: [] })
    if (projectId) {
      await graphApi.saveNodeContacts(projectId, nodeId, contacts)
      await store.syncExternalNodes()
      if (selectedNode.value?.id === nodeId) {
        selectedNode.value = store.externalNodes.find(n => n.id === nodeId) ?? selectedNode.value
      }
    }
  } else {
    const newNode = store.addExternalNode({ ...nodeData, contacts: [] })
    if (projectId && newNode?.id) {
      await graphApi.saveNodeContacts(projectId, newNode.id, contacts)
      await store.syncExternalNodes()
      if (selectedNode.value?.id === newNode.id) {
        selectedNode.value = store.externalNodes.find(n => n.id === newNode.id) ?? selectedNode.value
      }
    }
  }
  externalModal.value.visible = false
}

// Toast
const toastMsg = ref('')
const toastType = ref<'error' | 'success'>('error')
let toastTimer: ReturnType<typeof setTimeout> | null = null
function showToast(msg: string, type: 'error' | 'success' = 'error') {
  toastMsg.value = msg
  toastType.value = type
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMsg.value = '' }, 2500)
}

// ─── 포지션 자동/수동 저장 ────────────────────────────────
let autosaveTimer: ReturnType<typeof setInterval> | null = null

function resetAutosaveTimer() {
  if (autosaveTimer) { clearInterval(autosaveTimer); autosaveTimer = null }
  if (!readOnly.value && store.autosaveEnabled) {
    autosaveTimer = setInterval(() => { store.saveGraph(); store.flushPositions() }, store.autosaveInterval * 1000)
  }
}

async function manualSave() {
  if (readOnly.value) return
  await Promise.all([store.saveGraph(), store.flushPositions()])
  showToast(t('project.toast.saved'), 'success')
}

watch([() => store.autosaveEnabled, () => store.autosaveInterval], resetAutosaveTimer)
watch(() => store.saveError, (err) => { if (err) showToast(err) })
watch(readOnly, resetAutosaveTimer)
onBeforeUnmount(() => { store.saveGraph(); store.flushPositions() })

// Dependency Modal
const depModal = ref<{ visible: boolean; defaultSource: string; defaultTarget: string; editingDep?: Dependency }>({ visible: false, defaultSource: '', defaultTarget: '' })
function onAddNodeAt(nodeKind: 'server' | 'l7' | 'infra' | 'external' | 'dns') {
  if (nodeKind === 'l7') openAddL7Modal()
  else if (nodeKind === 'infra') openAddInfraModal()
  else if (nodeKind === 'external') openAddExternalModal()
  else if (nodeKind === 'dns') openAddDnsModal()
  else openAddServerModal()
}

function openAddDepModal(node?: AnyNode) {
  if (node && store.isInfraSourceDependency(node.id)) {
    showToast(t('project.toast.infraSourceBlocked'))
    return
  }
  depModal.value = { visible: true, defaultSource: node?.id ?? '', defaultTarget: '' }
}
function openEditDepModal(dep: Dependency) { depModal.value = { visible: true, defaultSource: '', defaultTarget: '', editingDep: dep } }
function onQuickConnect(source: AnyNode, target: AnyNode) {
  if (store.isInfraSourceDependency(source.id)) {
    showToast(t('project.toast.infraSourceBlocked'))
    return
  }
  if (store.isL7MemberDependency(source.id, target.id)) {
    showToast(t('project.toast.l7MemberBlocked'))
    return
  }
  const isDuplicate = store.dependencies.some(d => d.source === source.id && d.target === target.id)
  if (isDuplicate) {
    showToast(t('project.toast.duplicateDep'))
    return
  }
  depModal.value = { visible: true, defaultSource: source.id, defaultTarget: target.id }
}
function onDepModalSubmit(data: Omit<Dependency, 'id'>) {
  const result = store.addDependency(data)
  if (!result) showToast(t('project.toast.duplicateDep'))
  depModal.value.visible = false
}
function onDepModalUpdate(id: string, data: Partial<Omit<Dependency, 'id' | 'source' | 'target'>>) {
  store.updateDependency(id, data)
  depModal.value.visible = false
}
function onLinkDblClick(linkId: string) {
  if (readOnly.value) return
  const dep = store.dependencies.find(d => d.id === linkId)
  if (dep) openEditDepModal(dep)
}

// ─── 샘플 데이터 ─────────────────────────────────────────
const sampleConfirm = ref(false)
const hasData = computed(() =>
  store.servers.length + store.l7Nodes.length + store.infraNodes.length + store.externalNodes.length > 0
)
const hasSettingsItems = computed(() => projectStore.canAdmin || projectStore.canWrite)

function onTerraformImport(result: TfParseResult) {
  const selectedNodes = result.nodes.filter(n => n.selected)
  const selectedDeps = result.dependencies.filter(d => d.selected)

  // tempId -> 실제 store id 매핑
  // tfResourceKey -> tempId 매핑
  const keyToTempId = new Map<string, string>()
  for (const node of selectedNodes) {
    keyToTempId.set(node.tfResourceKey, node.tempId)
  }
  const tempIdToRealId = new Map<string, string>()

  store.beginBatch()

  for (const node of selectedNodes) {
    let created: { id: string } | null = null
    switch (node.nodeKind) {
      case 'server':
        created = store.addServer({
          nodeKind: 'server',
          name: node.name,
          team: node.team ?? '',
          internalIps: node.internalIps ?? [],
          natIps: node.natIps ?? [],
          description: node.description,
        })
        break
      case 'l7':
        created = store.addL7Node({
          nodeKind: 'l7',
          name: node.name,
          memberServerIds: [],
          description: node.description,
        })
        break
      case 'infra':
        created = store.addInfraNode({
          nodeKind: 'infra',
          name: node.name,
          infraType: node.infraType,
          host: node.host,
          port: node.port,
          description: node.description,
        })
        break
      case 'dns':
        created = store.addDnsNode({
          nodeKind: 'dns',
          name: node.name,
          dnsType: node.dnsType ?? 'A',
          recordValue: node.recordValue,
          description: node.description,
        })
        break
      case 'external':
        created = store.addExternalNode({
          nodeKind: 'external',
          name: node.name,
          contacts: [],
          description: node.description,
        })
        break
    }
    if (created) {
      tempIdToRealId.set(node.tempId, created.id)
    }
  }

  for (const dep of selectedDeps) {
    const sourceTempId = keyToTempId.get(dep.sourceKey)
    const targetTempId = keyToTempId.get(dep.targetKey)
    if (!sourceTempId || !targetTempId) continue
    const sourceId = tempIdToRealId.get(sourceTempId)
    const targetId = tempIdToRealId.get(targetTempId)
    if (!sourceId || !targetId) continue
    store.addDependency({
      source: sourceId,
      target: targetId,
      type: dep.type,
      description: dep.description,
    })
  }

  store.endBatch()

  // import된 노드에 계층적 초기 위치 부여 (DNS → L7 → Server → Infra 순으로 상단→하단)
  const layerOrder: Record<string, number> = { dns: 0, l7: 1, server: 2, external: 2, infra: 3 }
  const layerGroups = new Map<number, string[]>()
  for (const node of selectedNodes) {
    const realId = tempIdToRealId.get(node.tempId)
    if (!realId) continue
    const layer = layerOrder[node.nodeKind] ?? 2
    if (!layerGroups.has(layer)) layerGroups.set(layer, [])
    layerGroups.get(layer)!.push(realId)
  }

  // 기존 노드들의 중심점 계산 (빈 그래프면 0,0 기준)
  const existingPositions = store.getPositions()
  const existingCoords = Object.values(existingPositions)
  let centerX = 0, centerY = 0
  if (existingCoords.length > 0) {
    centerX = existingCoords.reduce((s, p) => s + p.x, 0) / existingCoords.length + 400
    centerY = existingCoords.reduce((s, p) => s + p.y, 0) / existingCoords.length
  }

  const positions = { ...existingPositions }
  const layerGap = 180
  const nodeGap = 200
  const sortedLayers = [...layerGroups.entries()].sort((a, b) => a[0] - b[0])

  let currentY = centerY - ((sortedLayers.length - 1) * layerGap) / 2
  for (const [, nodeIds] of sortedLayers) {
    let currentX = centerX - ((nodeIds.length - 1) * nodeGap) / 2
    for (const id of nodeIds) {
      positions[id] = { x: currentX, y: currentY }
      currentX += nodeGap
    }
    currentY += layerGap
  }

  store.savePositions(positions)
  store.saveGraph()
  showTerraformImport.value = false
}

function onSampleClick() {
  if (hasData.value) {
    sampleConfirm.value = true
  } else {
    loadSample()
  }
}

function loadSample() {
  // 타입별 레이어 배치: L7 → Web서버 → API LB → API서버 → 플랫폼/배치 → 인프라 → 외부
  const samplePositions: Record<string, { x: number; y: number }> = {
    // L7 — 각 서버 그룹 앞에 배치
    'sample-l2': { x: -900, y:    0 },  // web-lb
    'sample-l1': { x: -330, y:    0 },  // api-lb
    // 웹 서버 (Frontend)
    'sample-s3': { x: -620, y:  -80 },  // web-server-1
    'sample-s4': { x: -620, y:   80 },  // web-server-2
    // API 서버 (Backend)
    'sample-s1': { x:  -40, y:  -80 },  // api-server-1
    'sample-s2': { x:  -40, y:   80 },  // api-server-2
    // 플랫폼 / 배치 서버
    'sample-s5': { x:  250, y: -160 },  // auth-server
    'sample-s7': { x:  250, y:    0 },  // notification-server
    'sample-s6': { x:  250, y:  160 },  // batch-server
    // 인프라 (DB/Cache)
    'sample-d1': { x:  530, y: -220 },  // user-db
    'sample-d2': { x:  530, y:  -80 },  // product-db
    'sample-d3': { x:  530, y:   70 },  // session-db
    'sample-d4': { x:  530, y:  210 },  // analytics-db
    // 외부 서비스
    'sample-e2': { x:  800, y: -100 },  // Payment Gateway
    'sample-e1': { x:  800, y:   60 },  // Slack
    'sample-e3': { x:  800, y:  220 },  // SMS Gateway
    // DNS
    'sample-dns1': { x: -1180, y:  -80 },  // api.example.com
    'sample-dns2': { x: -1180, y:   80 },  // www.example.com
  }
  store.savePositions(samplePositions)
  store.loadData(sampleData)
  selectedNode.value = null
  sampleConfirm.value = false
}

// ─── 키보드 단축키 ───────────────────────────────────────
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (pathMode.value || pathNodeIds.value.size > 0) { onCancelPathMode(); return }
    showShortcuts.value = false; return
  }
  if (e.key === '?') { showShortcuts.value = !showShortcuts.value; return }
  const tag = (e.target as HTMLElement).tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return
  const meta = e.metaKey || e.ctrlKey
  if (meta && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    if (store.undo()) showToast(t('project.toast.undo'))
    return
  }
  if (meta && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
    e.preventDefault()
    if (store.redo()) showToast(t('project.toast.redo'))
    return
  }
  if (meta && e.key === 's') {
    e.preventDefault()
    manualSave()
    return
  }
  if ((e.key === 'e' || e.key === 'E') && projectStore.canWrite) {
    readOnly.value = !readOnly.value
  }
  if (e.key === 'f' || e.key === 'F') {
    graphCanvasRef.value?.toggleTracking()
  }
  if (e.key === 'Delete' && !readOnly.value) {
    const multiIds = graphCanvasRef.value?.multiSelectedIds
    if (multiIds && multiIds.size > 1) {
      onDeleteNodes(Array.from(multiIds))
    } else if (selectedNode.value) {
      onDeleteNode(selectedNode.value)
    }
  }
}
// ─── 멤버 관리 ───────────────────────────────────────────
const showLogoutConfirm = ref(false)
const showMembersModal = ref(false)


async function onOpenMembersModal() {
  showMembersModal.value = true
  if (projectStore.currentProject) {
    await projectStore.loadProjectInvitations(projectStore.currentProject.id).catch(() => {})
  }
}
const membersOverlayMousedown = ref(false)
const addMemberIdentifier = ref('')
const addMemberRole = ref<ProjectMemberRole>('READONLY')
const memberError = ref('')

function roleLabel(role: string): string {
  const map: Record<string, string> = {
    MASTER: t('roles.master'), ADMIN: t('roles.admin'), WRITER: t('roles.writer'), READONLY: t('roles.readonly'),
  }
  return map[role] ?? role
}

const ALL_ROLES: ProjectMemberRole[] = ['ADMIN', 'WRITER', 'READONLY']

// Master가 부여할 수 있는 역할 (ADMIN 포함), Admin은 WRITER/READONLY만
const addableRoles = computed<ProjectMemberRole[]>(() =>
  projectStore.isMaster ? ALL_ROLES : ['WRITER', 'READONLY']
)

// 해당 멤버 역할을 변경할 수 있는지 (자기 자신 제외, 권한 검사)
function canChangeRole(targetRole: ProjectMemberRole): boolean {
  const my = projectStore.myRole
  if (!my) return false
  if (my === 'MASTER') return targetRole !== 'MASTER'
  if (my === 'ADMIN') return targetRole === 'WRITER' || targetRole === 'READONLY'
  return false
}

// 해당 멤버 역할을 제거할 수 있는지
function canRemoveMember(targetRole: ProjectMemberRole, targetUserId: string): boolean {
  if (targetUserId === authStore.user?.id) return false
  return canChangeRole(targetRole)
}

// 변경 가능한 역할 목록
function assignableRoles(_currentRole: ProjectMemberRole): ProjectMemberRole[] {
  if (projectStore.isMaster) return ALL_ROLES
  return ['WRITER', 'READONLY']
}

async function onSendInvitation() {
  if (!addMemberIdentifier.value.trim() || !projectStore.currentProject) return
  memberError.value = ''
  try {
    await projectStore.sendInvitation(projectStore.currentProject.id, addMemberIdentifier.value.trim(), addMemberRole.value)
    await projectStore.loadProjectInvitations(projectStore.currentProject.id)
    addMemberIdentifier.value = ''
    showToast(t('project.toast.inviteSent'), 'success')
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string } } }
    memberError.value = e.response?.data?.error ?? t('project.toast.inviteFailed')
  }
}

async function onCancelInvitation(invId: string) {
  if (!projectStore.currentProject) return
  memberError.value = ''
  try {
    await projectStore.cancelInvitation(projectStore.currentProject.id, invId)
    showToast(t('project.toast.inviteCancelled'), 'success')
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string } } }
    memberError.value = e.response?.data?.error ?? t('project.toast.inviteCancelFailed')
  }
}

async function onRemoveMember(targetUserId: string) {
  if (!projectStore.currentProject) return
  memberError.value = ''
  try {
    await projectStore.removeMember(projectStore.currentProject.id, targetUserId)
    showToast(t('project.toast.memberRemoved'), 'success')
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string } } }
    memberError.value = e.response?.data?.error ?? t('project.toast.memberRemoveFailed')
  }
}

async function onChangeRole(targetUserId: string, newRole: string) {
  if (!projectStore.currentProject) return
  memberError.value = ''
  try {
    await projectStore.updateMemberRole(projectStore.currentProject.id, targetUserId, newRole as ProjectMemberRole)
    showToast(t('project.toast.roleChanged'), 'success')
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string } } }
    memberError.value = e.response?.data?.error ?? t('project.toast.roleChangeFailed')
  }
}

// ReadOnly 역할인 경우 편집 모드 강제 비활성
watch(() => projectStore.myRole, (role) => {
  if (role === 'READONLY') readOnly.value = true
}, { immediate: true })

const isLoading = ref(false)

function closeDropdowns(e: MouseEvent) {
  if (settingsWrapRef.value && !settingsWrapRef.value.contains(e.target as Node)) showSettingsDropdown.value = false
  if (importWrapRef.value && !importWrapRef.value.contains(e.target as Node)) showImportDropdown.value = false
}

onMounted(async () => {
  window.addEventListener('keydown', handleKeyDown)
  document.addEventListener('click', closeDropdowns)
  const projectId = route.params.id as string
  isLoading.value = true
  try {
    if (projectStore.currentProject?.id !== projectId) {
      await projectStore.loadProject(projectId)
    }
    await store.setProject(projectId)
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } }).response?.status
    if (status === 403) router.replace({ name: 'forbidden' })
    else router.replace({ name: 'projects' })
  } finally {
    isLoading.value = false
  }
  resetAutosaveTimer()
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('click', closeDropdowns)
  if (autosaveTimer) { clearInterval(autosaveTimer); autosaveTimer = null }
  store.resetGraph()
})

watch(() => route.params.id, async (newId) => {
  if (newId && typeof newId === 'string') {
    isLoading.value = true
    try {
      await projectStore.loadProject(newId)
      await store.setProject(newId)
      selectedNode.value = null
    } finally {
      isLoading.value = false
    }
  }
})
</script>

<style scoped>
.app-layout { display: grid; grid-template-columns: 250px 1fr 270px; height: 100vh; overflow: hidden; transition: grid-template-columns 0.25s ease; }
.sidebar { height: 100vh; overflow: hidden; }
.detail-panel {
  height: 100vh; overflow: hidden; position: relative;
  border-left: 1px solid var(--bg-surface);
  transition: width 0.25s ease;
}
.detail-panel.collapsed { overflow: visible; }
.detail-panel-content { height: 100%; overflow: hidden; }
.detail-toggle {
  position: absolute; top: 50%; left: -12px; transform: translateY(-50%);
  width: 24px; height: 48px; z-index: 10;
  background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: 6px;
  color: var(--text-disabled); cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: color 0.15s, background 0.15s;
}
.detail-toggle:hover { background: var(--bg-elevated); color: var(--text-tertiary); }
.main-area { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
.toolbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 20px; border-bottom: 1px solid var(--bg-surface); flex-shrink: 0;
}
.app-title { font-size: var(--text-base); font-weight: 700; color: var(--text-primary); letter-spacing: 0.02em; }
.toolbar-right { display: flex; align-items: center; gap: 10px; }
/* -- 모드 토글 버튼 -- */
.btn-mode-toggle {
  font-size: var(--text-xs); font-weight: 700; padding: 0 12px; height: 36px; border-radius: 6px;
  border: 1px solid var(--border-default); background: var(--bg-surface); color: var(--text-tertiary);
  cursor: pointer; transition: all 0.15s; white-space: nowrap; position: relative;
  display: inline-flex; align-items: center;
}
.btn-mode-toggle:hover { border-color: var(--border-strong); color: var(--text-secondary); }
.btn-mode-toggle.active { background: #2d1b69; border-color: var(--node-l7-color); color: #c4b5fd; }
.btn-mode-toggle:disabled { opacity: 0.5; cursor: not-allowed; }

/* -- 툴바 드롭다운 -- */
.toolbar-dropdown-wrap { position: relative; }
.btn-toolbar-icon {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 6px;
  border: 1px solid var(--border-default); background: var(--bg-surface);
  color: var(--text-tertiary); cursor: pointer; transition: all 0.15s;
}
.btn-toolbar-icon:hover { border-color: var(--border-strong); color: var(--text-secondary); }
.toolbar-dropdown {
  position: absolute; top: calc(100% + 4px); right: 0;
  background: var(--bg-surface); border: 1px solid var(--border-default);
  border-radius: 8px; padding: 4px 0; z-index: 200; min-width: 160px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}
.toolbar-dropdown button {
  display: block; width: 100%; padding: 7px 16px; background: none;
  border: none; color: var(--text-secondary); text-align: left;
  cursor: pointer; font-size: var(--text-sm); transition: background 0.1s;
}
.toolbar-dropdown button:hover { background: var(--border-default); }
.toolbar-dropdown-divider { height: 1px; background: var(--border-default); margin: 3px 0; }
.menu-beta-badge {
  font-size: 9px; font-weight: 700; color: var(--accent-soft);
  background: var(--accent-bg); border: 1px solid var(--accent-primary);
  border-radius: 3px; padding: 0 4px; letter-spacing: 0.05em; text-transform: uppercase;
}
.autosave-group { display: flex; align-items: center; gap: 4px; }
.btn-save-local.dirty { border-color: var(--color-warning); color: var(--color-warning-light); background: #1c1200; }
.btn-save-local.dirty:hover { background: #292100; border-color: var(--color-warning-light); }
.btn-autosave {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: var(--text-xs); font-weight: 600; padding: 0 12px; height: 36px; border-radius: 6px;
  border: 1px solid var(--border-default); background: var(--bg-surface); color: var(--text-disabled);
  cursor: pointer; transition: all 0.15s; white-space: nowrap; position: relative;
}
.btn-autosave:hover { border-color: var(--border-strong); color: var(--text-tertiary); }
.autosave-dot {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
  background: var(--border-strong); transition: background 0.2s;
}
.autosave-dot.active { background: var(--color-success); box-shadow: 0 0 4px rgba(34,197,94,0.6); }
.select-interval { width: 100px; }

/* 단축키 툴팁 */
[data-tooltip] { position: relative; }
[data-tooltip]::before {
  content: attr(data-tooltip);
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  color: var(--text-muted);
  font-size: var(--text-xs);
  font-weight: 400;
  padding: 5px 9px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s;
  z-index: 300;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
}
[data-tooltip][data-shortcut]::after {
  content: attr(data-shortcut);
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  margin-top: 22px;
  background: var(--border-default);
  border: 1px solid var(--border-strong);
  border-radius: 4px;
  color: var(--text-tertiary);
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s;
  z-index: 300;
  letter-spacing: 0.05em;
}
[data-tooltip]:hover::before,
[data-tooltip]:hover::after { opacity: 1; }
.graph-wrap { flex: 1; padding: 16px; overflow: hidden; position: relative; }

/* -- 빈 상태 CTA -- */
.empty-state-cta {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12px;
  z-index: 10; pointer-events: none;
}
.empty-state-cta > * { pointer-events: auto; }
.empty-state-title { font-size: var(--text-base); font-weight: 700; color: var(--text-secondary); margin: 0; }
.empty-state-desc { font-size: var(--text-sm); color: var(--text-tertiary); margin: 0; }
.empty-state-actions { display: flex; gap: 10px; margin-top: 4px; }
.app-toast {
  position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
  background: #1c0a0a; border: 1px solid #ef4444; border-radius: 10px;
  padding: 12px 24px; font-size: var(--text-base); color: #fca5a5; font-weight: 600;
  z-index: 500; white-space: nowrap; box-shadow: 0 4px 20px rgba(239,68,68,0.25);
  pointer-events: none;
}
.app-toast.success {
  background: #022c22; border-color: #059669; color: #6ee7b7;
  box-shadow: 0 4px 20px rgba(5,150,105,0.25);
}
.toast-fade-enter-active { transition: opacity 0.2s; }
.toast-fade-leave-active { transition: opacity 0.4s; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; }

.loading-overlay {
  position: fixed; inset: 0;
  background: rgba(15,23,42,0.7);
  display: flex; align-items: center; justify-content: center;
  z-index: 900;
  backdrop-filter: blur(2px);
}
.loading-spinner {
  width: 40px; height: 40px;
  border: 3px solid var(--bg-surface);
  border-top-color: var(--accent-focus);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-fade-enter-active { transition: opacity 0.2s; }
.loading-fade-leave-active { transition: opacity 0.3s; }
.loading-fade-enter-from, .loading-fade-leave-to { opacity: 0; }

.delete-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex; align-items: center; justify-content: center;
  z-index: 600;
  backdrop-filter: blur(2px);
}
.delete-dialog {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  padding: 24px;
  width: 340px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  display: flex; flex-direction: column; gap: 16px;
}
.delete-dialog-icon {
  display: flex; justify-content: center;
}
.delete-dialog-body {
  display: flex; flex-direction: column; gap: 8px; text-align: center;
}
.delete-dialog-title {
  font-size: var(--text-lg); font-weight: 700; color: var(--text-primary);
}
.delete-dialog-desc {
  font-size: var(--text-sm); color: var(--text-tertiary); line-height: 1.6;
}
.delete-node-kind {
  color: var(--text-disabled); font-size: var(--text-xs); font-weight: 600;
  background: var(--bg-base); border: 1px solid var(--border-default);
  border-radius: 4px; padding: 1px 6px; margin-right: 4px;
  vertical-align: middle;
}
.delete-node-name {
  color: var(--text-primary); font-weight: 700;
}
.delete-dialog-actions {
  display: flex; gap: 8px;
}
.delete-dialog-btn { flex: 1; }

/* 단축키 오버레이 */
.shortcuts-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.55); backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center;
}
.shortcuts-modal {
  background: var(--bg-surface); border: 1px solid var(--border-default);
  border-radius: 14px; padding: 24px 28px; min-width: 360px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04);
}
.shortcuts-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 20px;
}
.shortcuts-title { font-size: var(--text-base); font-weight: 700; color: var(--text-primary); }
.shortcuts-close {
  background: none; border: none; cursor: pointer;
  color: var(--text-disabled); padding: 4px; display: flex; align-items: center;
}
.shortcuts-close:hover { color: var(--text-tertiary); }
.shortcuts-section-title {
  font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--border-strong);
  margin: 16px 0 8px; padding-bottom: 5px;
  border-bottom: 1px solid var(--border-default);
}
.shortcuts-section-title:first-of-type { margin-top: 0; }
.shortcuts-grid { display: flex; flex-direction: column; gap: 6px; }
.shortcut-row {
  display: flex; align-items: center; gap: 12px;
  font-size: var(--text-sm); color: var(--text-tertiary);
}
.shortcut-row kbd {
  display: inline-block; background: var(--bg-base); border: 1px solid var(--border-default);
  border-radius: 5px; padding: 2px 7px; font-size: var(--text-xs); font-weight: 600;
  color: var(--text-muted); font-family: inherit; white-space: nowrap; flex-shrink: 0;
  box-shadow: 0 2px 0 var(--bg-surface);
}
.shortcuts-fade-enter-active { transition: opacity 0.15s; }
.shortcuts-fade-leave-active { transition: opacity 0.15s; }
.shortcuts-fade-enter-from, .shortcuts-fade-leave-to { opacity: 0; }

/* 타이틀 + 도움말 버튼 */
.title-group { display: flex; align-items: center; gap: 8px; }
.title-group .btn-sm { height: 36px; padding: 0 12px; }
.btn-help {
  width: 36px; height: 36px; border-radius: 50%;
  border: 1px solid var(--border-default); background: var(--bg-surface);
  color: var(--text-disabled); font-size: var(--text-xs); font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; flex-shrink: 0; line-height: 1;
}
.btn-help:hover { border-color: var(--accent-soft); color: var(--accent-soft); background: var(--accent-bg-deep); }

/* 도움말 모달 */
.help-modal {
  background: var(--bg-surface); border: 1px solid var(--border-default);
  border-radius: 14px; padding: 24px 28px;
  width: 700px; max-width: calc(100vw - 40px);
  max-height: calc(100vh - 60px); overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}
.help-body { display: flex; gap: 0; }
.help-col { flex: 1; min-width: 0; }
.help-divider {
  width: 1px; background: var(--border-default); margin: 0 24px; flex-shrink: 0;
}
.help-node-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 4px; }
.help-node-item { display: flex; align-items: flex-start; gap: 10px; }
.help-node-badge {
  font-size: 9px; font-weight: 800; letter-spacing: 0.05em;
  padding: 3px 6px; border-radius: 4px; flex-shrink: 0; margin-top: 1px;
}
.help-node-badge.server { background: var(--accent-bg-medium); color: var(--accent-light); border: 1px solid var(--accent-hover); }
.help-node-badge.l7    { background: var(--node-l7-bg-deep); color: var(--node-l7-color); border: 1px solid var(--node-l7-color); }
.help-node-badge.infra { background: var(--node-infra-bg-deep); color: var(--node-infra-text); border: 1px solid var(--node-infra-color); }
.help-node-badge.ext   { background: var(--node-ext-bg-deep); color: var(--color-success-lighter); border: 1px solid var(--node-ext-color); }
.help-node-name { font-size: var(--text-xs); font-weight: 600; color: var(--text-secondary); margin-bottom: 2px; }
.help-node-desc { font-size: var(--text-xs); color: var(--text-disabled); line-height: 1.4; }
.help-desc-list { display: flex; flex-direction: column; gap: 7px; }
.help-desc-item {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: var(--text-xs); color: var(--text-tertiary); line-height: 1.5;
}
.help-dot {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; margin-top: 4px;
}
.help-dot.red   { background: #ef4444; }
.help-dot.green { background: var(--color-success); }
.help-dot.amber { background: #f59e0b; }

/* 멤버 관리 */
.members-modal {
  background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: 12px;
  padding: 20px; min-width: 440px; max-width: 560px; width: 100%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04);
  display: flex; flex-direction: column; gap: 12px;
}
.members-list { display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto; }
.member-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; background: var(--bg-base); border-radius: 8px; border: 1px solid var(--bg-surface);
  gap: 12px;
}
.member-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.member-name { font-size: var(--text-sm); font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.member-email { font-size: var(--text-xs); color: var(--text-disabled); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.member-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.role-badge {
  font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px;
  border: 1px solid transparent;
}
.role-badge.master   { background: var(--role-master-bg); border-color: var(--role-master); color: var(--accent-light); }
.role-badge.admin    { background: var(--role-admin-bg); border-color: var(--role-admin); color: var(--role-admin-text); }
.role-badge.writer   { background: var(--role-writer-bg); border-color: var(--role-writer); color: var(--node-ext-text); }
.role-badge.readonly { background: var(--role-readonly-bg); border-color: var(--role-readonly); color: var(--text-muted); }
.role-select { width: 130px; }
.member-add-form { display: flex; gap: 8px; align-items: center; }
.pending-invitations { margin-top: 16px; border-top: 1px solid var(--border-default); padding-top: 16px; display: flex; flex-direction: column; gap: 8px; }
.pending-invitations-title { font-size: var(--text-xs); font-weight: 600; color: var(--text-disabled); text-transform: uppercase; letter-spacing: 0.06em; }
.pending-inv-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: var(--bg-base); border: 1px solid var(--border-default); border-radius: 8px; }
.pending-inv-info { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.pending-status { font-size: var(--text-xs); font-weight: 600; color: var(--text-disabled); }
.member-input {
  flex: 1; padding: 9px 12px; background: var(--bg-base); border: 1px solid var(--border-default);
  border-radius: 7px; color: var(--text-secondary); font-size: var(--text-sm); outline: none;
  transition: border-color 0.15s; box-sizing: border-box;
}
.member-input::placeholder { color: var(--border-strong); }
.member-input:focus { border-color: var(--accent-focus); }
.member-error { font-size: var(--text-xs); color: #f87171; }
</style>
