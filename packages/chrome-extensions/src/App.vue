<script setup lang="ts">
import { useTracePanel } from './hooks/use-trace-panel'
import EventDetails from './views/EventDetails.vue'
import EventTable from './views/EventTable.vue'
import TraceStatusBar from './views/TraceStatusBar.vue'
import TraceTimeline from './views/TraceTimeline.vue'
import TraceToolbar from './views/TraceToolbar.vue'

const {
  traces,
  calls,
  activeId,
  selectedRecord,
  isPreview,
  connected,
  filtersVisible,
  recording,
  filter,
  agents,
  visibleCalls,
  visibleTraces,
  totalUsage,
  visibleUsage,
  failedCount,
  collapsedIds,
  timelineHeight,
  detailsWidth,
  workspaceStyle,
  contentStyle,
  toggleRecording,
  selectEvent,
  toggleTrace,
  clearEvents,
  addPreviewEvents,
  startResize,
} = useTracePanel()
</script>

<template>
  <main class="trace-app">
    <TraceToolbar
      v-model:query="filter.query"
      v-model:type="filter.type"
      v-model:status="filter.status"
      v-model:agent="filter.agent"
      :agents="agents"
      :total="calls.length"
      :visible="visibleCalls.length"
      :preview="isPreview"
      :recording="recording"
      :filters-visible="filtersVisible"
      :only-errors="filter.onlyErrors"
      @clear="clearEvents"
      @add="addPreviewEvents"
      @toggle-recording="toggleRecording"
      @toggle-filters="filtersVisible = !filtersVisible"
      @toggle-errors="filter.onlyErrors = !filter.onlyErrors"
    />
    <div class="trace-workspace" :style="workspaceStyle">
      <TraceTimeline :groups="visibleTraces" :selected-id="activeId" @select="selectEvent" />
      <div
        class="resize-handle resize-handle-vertical"
        role="separator"
        aria-label="Resize timeline height"
        tabindex="0"
        @pointerdown="startResize('timeline', $event)"
        @keydown.down.prevent="timelineHeight = Math.min(360, timelineHeight + 8)"
        @keydown.up.prevent="timelineHeight = Math.max(80, timelineHeight - 8)"
      />
      <div class="content-workspace" :style="contentStyle">
        <EventTable
          :groups="visibleTraces"
          :selected-id="activeId"
          :collapsed-ids="collapsedIds"
          @select="selectEvent"
          @toggle="toggleTrace"
        />
        <div
          class="resize-handle resize-handle-horizontal"
          role="separator"
          aria-label="Resize details panel width"
          tabindex="0"
          @pointerdown="startResize('details', $event)"
          @keydown.left.prevent="detailsWidth = Math.min(520, detailsWidth + 8)"
          @keydown.right.prevent="detailsWidth = Math.max(260, detailsWidth - 8)"
        />
        <EventDetails :record="selectedRecord" :traces="traces" @select="selectEvent" />
      </div>
    </div>
    <TraceStatusBar
      :connected="connected"
      :trace-count="traces.length"
      :call-count="calls.length"
      :visible-count="visibleCalls.length"
      :total-usage="totalUsage"
      :visible-usage="visibleUsage"
      :failed-count="failedCount"
    />
  </main>
</template>

<style scoped>
.trace-app {
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  overflow: hidden;
  background: var(--panel-bg);
}
.trace-workspace {
  display: grid;
  min-height: 0;
  flex: 1;
}
.resize-handle {
  z-index: 2;
  background: var(--divider);
}
.resize-handle:hover,
.resize-handle:focus {
  background: var(--accent);
}
.resize-handle-vertical {
  height: 1px;
  cursor: row-resize;
}
.resize-handle-horizontal {
  width: 1px;
  cursor: col-resize;
}
.content-workspace {
  display: grid;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
</style>
