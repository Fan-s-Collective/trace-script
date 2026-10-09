<script setup lang="ts">
import { createTraceSdk } from '@trace-script/sdk'
import { shallowRef } from 'vue'

const sdk = createTraceSdk()
const sentCount = shallowRef(0)
const status = shallowRef('还没有发送数据')

function sendSessionStart() {
  const trace = sdk.startTrace()
  const result = trace.recordRequest({
    type: 'session.start',
    sessionId: trace.traceId,
    name: 'Playground debug session',
  })
  if (!result.success) {
    status.value = `发送失败：${result.reason}`
    return
  }
  const endResult = trace.end()
  if (!endResult.success) {
    status.value = `结束 Trace 失败：${endResult.reason}`
    return
  }
  sentCount.value++
  status.value = `已发送 ${sentCount.value} 条 session.start，请在 Agent Trace 面板查看`
}
</script>

<template>
  <main class="playground">
    <h1>Trace Script Playground</h1>
    <p>打开本页的 DevTools，选择 Agent Trace，然后发送模拟事件。</p>
    <p>session.start 是模拟请求数据，在面板的 model.request.payload 中查看。</p>
    <button type="button" class="send-button" @click="sendSessionStart">
      发送 session.start
    </button>
    <p role="status" aria-live="polite">
      {{ status }}
    </p>
  </main>
</template>

<style scoped>
.playground {
  max-width: 720px;
  margin: 64px auto;
  padding: 0 24px;
  font-family: system-ui, sans-serif;
  line-height: 1.6;
}

.send-button {
  padding: 10px 16px;
  border: 1px solid #2455d6;
  border-radius: 6px;
  background: #2455d6;
  color: white;
  font: inherit;
  cursor: pointer;
}

.send-button:focus-visible {
  outline: 2px solid #2455d6;
  outline-offset: 3px;
}
</style>
