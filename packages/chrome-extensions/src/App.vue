<script setup lang="ts">
import { useTracePanel } from './hooks/use-trace-panel'
import EventDetails from './views/EventDetails.vue'
import EventTable from './views/EventTable.vue'
import TraceStatusBar from './views/TraceStatusBar.vue'
import TraceTimeline from './views/TraceTimeline.vue'
import TraceToolbar from './views/TraceToolbar.vue'

const {
  events,
  selectedId,
  selectedEvent,
  isPreview,
  connected,
  filtersVisible,
  recording,
  filter,
  agents,
  visibleEvents,
  totalTokens,
  visibleTokens,
  failedCount,
  maxDuration,
  totalDuration,
  timelineHeight,
  detailsWidth,
  workspaceStyle,
  contentStyle,
  toggleRecording,
  selectEvent,
  clearEvents,
  addPreviewEvents,
  startResize,
} = useTracePanel()
</script>

<template>
  <main class="trace-app">
    <TraceToolbar v-model:query="filter.query" v-model:type="filter.type" v-model:status="filter.status" v-model:agent="filter.agent" :agents="agents" :total="events.length" :visible="visibleEvents.length" :preview="isPreview" :recording="recording" :filters-visible="filtersVisible" :only-errors="filter.onlyErrors" @clear="clearEvents" @add="addPreviewEvents" @toggle-recording="toggleRecording" @toggle-filters="filtersVisible = !filtersVisible" @toggle-errors="filter.onlyErrors = !filter.onlyErrors" />
    <div class="trace-workspace" :style="workspaceStyle">
      <TraceTimeline :events="visibleEvents" :selected-id="selectedId" @select="selectEvent" />
      <div class="resize-handle resize-handle-vertical" role="separator" aria-label="Resize timeline height" tabindex="0" @pointerdown="startResize('timeline', $event)" @keydown.down.prevent="timelineHeight = Math.min(360, timelineHeight + 8)" @keydown.up.prevent="timelineHeight = Math.max(80, timelineHeight - 8)" />
      <div class="content-workspace" :style="contentStyle">
        <EventTable :events="visibleEvents" :selected-id="selectedId" @select="selectEvent" />
        <div class="resize-handle resize-handle-horizontal" role="separator" aria-label="Resize details panel width" tabindex="0" @pointerdown="startResize('details', $event)" @keydown.left.prevent="detailsWidth = Math.min(520, detailsWidth + 8)" @keydown.right.prevent="detailsWidth = Math.max(260, detailsWidth - 8)" />
        <EventDetails :event="selectedEvent" :siblings="events" @select="selectEvent" />
      </div>
    </div>
    <TraceStatusBar :connected="connected" :event-count="events.length" :visible-count="visibleEvents.length" :total-tokens="totalTokens" :visible-tokens="visibleTokens" :failed-count="failedCount" :max-duration="maxDuration" :total-duration="totalDuration" />
  </main>
</template>
