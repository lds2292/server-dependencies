<template>
  <div class="tf-modal-backdrop" @mousedown.self="backdropDown = true" @mouseup.self="backdropDown && $emit('close')" @mouseup="backdropDown = false">
    <div class="tf-modal">
      <div class="tf-modal-header">
        <h3 class="tf-modal-title">Terraform Import <span class="tf-beta-badge">Beta</span></h3>
        <button class="tf-modal-close" @click="$emit('close')">
          <Icon name="close" :size="14" />
        </button>
      </div>

      <div class="tf-modal-body">
        <!-- Step 1: 파일 업로드 -->
        <template v-if="step === 'upload'">
          <div
            :class="['tf-dropzone', { 'tf-dropzone-active': dragOver }]"
            @click="fileInputRef?.click()"
            @dragenter.prevent="dragOver = true"
            @dragover.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            @drop.prevent="onDrop"
          >
            <div class="tf-dropzone-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <polyline points="17 8 12 3 7 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="tf-dropzone-text">.tfstate 파일을 드래그하거나 클릭하여 선택</div>
            <div class="tf-dropzone-hint">JSON 형식, 최대 10MB</div>
            <input
              ref="fileInputRef"
              type="file"
              accept=".tfstate,.json"
              class="tf-dropzone-input"
              @change="onFileSelect"
            />
          </div>
          <div class="tf-privacy-notice">
            <div class="tf-privacy-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L2 4v4c0 3.5 2.5 6.5 6 7.5 3.5-1 6-4 6-7.5V4L8 1Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
                <path d="M5.5 8L7 9.5 10.5 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="tf-privacy-content">
              <div class="tf-privacy-title">민감 정보를 수집하지 않습니다</div>
              <div class="tf-privacy-desc">
                업로드된 파일은 브라우저에서만 처리되며 서버로 전송되지 않습니다.
                서버 이름, IP, 연결 관계 등 인프라 구성 정보만 파악하여 시각화에 사용합니다.
                비밀번호, API 키 등 민감 정보는 자동으로 감지하여 경고를 표시하며, 어떠한 데이터도 외부로 전송하거나 저장하지 않습니다.
              </div>
            </div>
          </div>
          <div v-if="error" class="tf-error">{{ error }}</div>
        </template>

        <!-- Step 2: 미리보기 -->
        <template v-else-if="step === 'preview' && parseResult">
          <!-- 요약 -->
          <div class="tf-summary">
            <span>Terraform v{{ parseResult.terraformVersion }}</span>
            <span class="tf-summary-divider"></span>
            <span>리소스 {{ parseResult.totalResourceCount }}개 중 {{ parseResult.nodes.length }}개 매핑</span>
            <span class="tf-summary-divider"></span>
            <span>의존성 {{ parseResult.dependencies.length }}개 추론</span>
          </div>

          <!-- 경고 -->
          <div v-if="parseResult.warnings.length > 0" class="tf-warnings">
            <div class="tf-warnings-header">경고 ({{ parseResult.warnings.length }})</div>
            <div class="tf-warning-list">
              <div
                v-for="(w, i) in parseResult.warnings"
                :key="i"
                :class="['tf-warning-item', w.level]"
              >{{ w.message }}</div>
            </div>
          </div>

          <!-- 노드 목록 -->
          <div class="tf-section">
            <div class="tf-section-header">
              <span class="tf-section-title">
                노드<span class="tf-section-count">({{ selectedNodeCount }}/{{ parseResult.nodes.length }})</span>
              </span>
              <button class="tf-select-all" @click="toggleAllNodes">
                {{ allNodesSelected ? '전체 해제' : '전체 선택' }}
              </button>
            </div>
            <div class="tf-node-list">
              <label
                v-for="node in parseResult.nodes"
                :key="node.tempId"
                class="tf-node-item"
              >
                <input type="checkbox" v-model="node.selected" />
                <span :class="['tf-node-badge', `tf-badge-${node.nodeKind}`]">{{ nodeBadgeLabel(node.nodeKind) }}</span>
                <span class="tf-node-name">{{ node.name }}</span>
                <span class="tf-node-meta">{{ node.tfResourceKey.split('.')[0] }}</span>
                <span v-if="node.internalIps?.length" class="tf-node-ip">{{ node.internalIps[0] }}</span>
              </label>
            </div>
          </div>

          <!-- 의존성 목록 -->
          <div v-if="parseResult.dependencies.length > 0" class="tf-section">
            <div class="tf-section-header">
              <span class="tf-section-title">
                의존성<span class="tf-section-count">({{ selectedDepCount }}/{{ parseResult.dependencies.length }})</span>
              </span>
              <button class="tf-select-all" @click="toggleAllDeps">
                {{ allDepsSelected ? '전체 해제' : '전체 선택' }}
              </button>
            </div>
            <div class="tf-node-list">
              <label
                v-for="dep in parseResult.dependencies"
                :key="dep.tempId"
                class="tf-dep-item"
              >
                <input type="checkbox" v-model="dep.selected" />
                <span class="tf-dep-source">{{ dep.sourceName }}</span>
                <span class="tf-dep-arrow">--></span>
                <span class="tf-dep-target">{{ dep.targetName }}</span>
                <span class="tf-dep-type">{{ dep.type }}</span>
              </label>
            </div>
          </div>

          <!-- 매핑 노드 0개 -->
          <div v-if="parseResult.nodes.length === 0" class="tf-empty">
            매핑 가능한 리소스가 없습니다. 지원하는 AWS 리소스 타입을 확인하세요.
          </div>
        </template>
      </div>

      <div class="tf-modal-footer">
        <button class="btn-ghost" @click="$emit('close')">취소</button>
        <button
          v-if="step === 'preview' && parseResult && parseResult.nodes.length > 0"
          class="btn-primary"
          :disabled="selectedNodeCount === 0"
          @click="onImport"
        >
          가져오기 ({{ selectedNodeCount }}노드, {{ selectedDepCount }}의존성)
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Icon from './Icon.vue'
import { parseTerraformState, nodeBadgeLabel } from '../utils/terraformParser'
import type { TfParseResult } from '../utils/terraformParser'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const emit = defineEmits<{
  close: []
  import: [result: TfParseResult]
}>()

const backdropDown = ref(false)
const fileInputRef = ref<HTMLInputElement>()
const step = ref<'upload' | 'preview'>('upload')
const parseResult = ref<TfParseResult | null>(null)
const error = ref<string | null>(null)
const dragOver = ref(false)

const selectedNodeCount = computed(() =>
  parseResult.value?.nodes.filter(n => n.selected).length ?? 0
)
const selectedDepCount = computed(() =>
  parseResult.value?.dependencies.filter(d => d.selected).length ?? 0
)
const allNodesSelected = computed(() =>
  parseResult.value ? parseResult.value.nodes.every(n => n.selected) : false
)
const allDepsSelected = computed(() =>
  parseResult.value ? parseResult.value.dependencies.every(d => d.selected) : false
)

function toggleAllNodes() {
  if (!parseResult.value) return
  const next = !allNodesSelected.value
  for (const node of parseResult.value.nodes) {
    node.selected = next
  }
}

function toggleAllDeps() {
  if (!parseResult.value) return
  const next = !allDepsSelected.value
  for (const dep of parseResult.value.dependencies) {
    dep.selected = next
  }
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  const file = e.dataTransfer?.files[0]
  if (file) processFile(file)
}

function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) processFile(file)
  // 같은 파일 재선택 허용
  input.value = ''
}

function processFile(file: File) {
  error.value = null

  if (file.size > MAX_FILE_SIZE) {
    error.value = '파일 크기가 10MB를 초과합니다'
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    try {
      const json = JSON.parse(reader.result as string)
      const result = parseTerraformState(json)
      parseResult.value = result
      step.value = 'preview'
    } catch (e: unknown) {
      if (e instanceof SyntaxError) {
        error.value = '유효한 Terraform state 파일이 아닙니다 (JSON v4 형식 필요)'
      } else if (e instanceof Error) {
        error.value = `파일 파싱 중 오류가 발생했습니다: ${e.message}`
      } else {
        error.value = '파일 파싱 중 알 수 없는 오류가 발생했습니다'
      }
    }
  }
  reader.onerror = () => {
    error.value = '파일을 읽을 수 없습니다'
  }
  reader.readAsText(file)
}

function onImport() {
  if (!parseResult.value) return
  emit('import', parseResult.value)
}
</script>

<style scoped>
.tf-modal-backdrop {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.tf-modal {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 10px;
  padding: 0;
  width: 580px;
  max-width: 90vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.tf-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
}

.tf-modal-title {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.tf-beta-badge {
  font-size: 10px;
  font-weight: 700;
  color: var(--accent-soft);
  background: var(--accent-bg);
  border: 1px solid var(--accent-primary);
  border-radius: 4px;
  padding: 1px 6px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.tf-modal-close {
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.15s;
}
.tf-modal-close:hover { color: var(--text-secondary); }

.tf-modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.tf-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-subtle);
}

/* -- Dropzone -- */
.tf-dropzone {
  border: 2px dashed var(--border-default);
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s;
  background: var(--bg-base);
}
.tf-dropzone:hover { border-color: var(--border-strong); }
.tf-dropzone-active {
  border-color: var(--accent-focus);
  background: var(--accent-bg-subtle);
}

.tf-dropzone-icon {
  color: var(--text-disabled);
  margin-bottom: 12px;
}
.tf-dropzone-active .tf-dropzone-icon { color: var(--accent-soft); }

.tf-dropzone-text {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin-bottom: 6px;
}
.tf-dropzone-hint {
  font-size: var(--text-xs);
  color: var(--text-disabled);
}
.tf-dropzone-input { display: none; }

/* -- Error -- */
.tf-privacy-notice {
  margin-top: 16px;
  padding: 14px 16px;
  background: color-mix(in srgb, var(--color-success) 5%, var(--bg-base));
  border: 1px solid color-mix(in srgb, var(--color-success) 30%, transparent);
  border-radius: 8px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.tf-privacy-icon {
  color: var(--color-success);
  flex-shrink: 0;
  margin-top: 1px;
}
.tf-privacy-content { flex: 1; }
.tf-privacy-title {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--color-success-light);
  margin-bottom: 4px;
}
.tf-privacy-desc {
  font-size: var(--text-xs);
  color: var(--text-muted);
  line-height: 1.6;
}
.tf-error {
  margin-top: 12px;
  padding: 10px 12px;
  background: var(--color-danger-surface);
  border: 1px solid var(--color-danger-border);
  border-radius: 6px;
  color: var(--color-danger-muted);
  font-size: var(--text-sm);
}

/* -- Summary bar -- */
.tf-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--accent-bg-subtle);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-bottom: 16px;
}
.tf-summary-divider {
  width: 1px;
  height: 12px;
  background: var(--border-default);
}

/* -- Warnings -- */
.tf-warnings { margin-bottom: 16px; }
.tf-warnings-header {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-warning);
  margin-bottom: 6px;
  padding-left: 10px;
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
}
.tf-warnings-header::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 2px;
  border-radius: 1px;
  background: var(--color-warning);
}
.tf-warning-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.tf-warning-item {
  padding: 6px 10px;
  background: var(--bg-base);
  border-radius: 4px;
  font-size: var(--text-xs);
  color: var(--text-muted);
}
.tf-warning-item.warn { color: var(--color-warning-light); }

/* -- Section -- */
.tf-section { margin-bottom: 16px; }
.tf-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.tf-section-title {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--text-primary);
}
.tf-section-count {
  font-weight: 400;
  color: var(--text-tertiary);
  margin-left: 4px;
}
.tf-select-all {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: color 0.15s;
}
.tf-select-all:hover { color: var(--text-secondary); }

/* -- Node list -- */
.tf-node-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 200px;
  overflow-y: auto;
}
.tf-node-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.1s;
  font-size: var(--text-sm);
}
.tf-node-item:hover { background: var(--bg-elevated); }
.tf-node-item input[type="checkbox"],
.tf-dep-item input[type="checkbox"] {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  cursor: pointer;
  accent-color: var(--accent-focus);
}

/* -- Node badge -- */
.tf-node-badge {
  font-size: var(--text-xs);
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 999px;
  flex-shrink: 0;
  letter-spacing: 0.3px;
}
.tf-badge-server { color: var(--node-srv-color); background: var(--node-srv-bg); }
.tf-badge-l7 { color: var(--node-l7-text); background: var(--node-l7-bg); }
.tf-badge-infra { color: var(--node-infra-text); background: var(--node-infra-bg); }
.tf-badge-dns { color: var(--node-dns-text); background: var(--node-dns-bg); }
.tf-badge-external { color: var(--node-ext-text); background: var(--node-ext-bg); }

.tf-node-name {
  color: var(--text-secondary);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
.tf-node-meta {
  color: var(--text-disabled);
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  white-space: nowrap;
}
.tf-node-ip {
  color: var(--color-ip-text);
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  margin-left: auto;
  flex-shrink: 0;
}

/* -- Dependency list item -- */
.tf-dep-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.1s;
  font-size: var(--text-sm);
}
.tf-dep-item:hover { background: var(--bg-elevated); }
.tf-dep-source,
.tf-dep-target {
  color: var(--text-secondary);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tf-dep-arrow {
  color: var(--text-disabled);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  flex-shrink: 0;
}
.tf-dep-type {
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--text-tertiary);
  padding: 1px 6px;
  background: var(--bg-base);
  border-radius: 999px;
  flex-shrink: 0;
}

/* -- Empty state -- */
.tf-empty {
  text-align: center;
  padding: 32px 20px;
  color: var(--text-disabled);
  font-size: var(--text-sm);
}
</style>
