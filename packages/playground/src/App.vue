<script setup lang="ts">
import { createTraceSdk } from '@trace-script/sdk'
import { computed, ref } from 'vue'

interface WeatherTool {
  type: 'function'
  name: 'get_weather'
  description: string
  parameters: {
    type: 'object'
    properties: { city: { type: 'string' } }
    required: ['city']
    additionalProperties: false
  }
  strict: true
}

interface UserInput { role: 'user', content: string }
interface FunctionCall { type: 'function_call', call_id: string, name: 'get_weather', arguments: string }
interface FunctionCallOutput { type: 'function_call_output', call_id: string, output: string }
interface MessageOutput { type: 'message', content: [{ type: 'output_text', text: string }] }
interface ModelRequest {
  model: 'gpt-4.1'
  input: (UserInput | FunctionCall | FunctionCallOutput | MessageOutput)[]
  tools: WeatherTool[]
}
interface ModelResponse {
  id: string
  output: (FunctionCall | MessageOutput)[]
  output_text: string
  usage: { input_tokens: number, output_tokens: number, total_tokens: number }
}

const sdk = createTraceSdk()
const city = ref('北京')
const sentCount = ref(0)
const running = ref(false)
const status = ref('还没有运行 Trace')
const answer = ref('')

const buttonLabel = computed(() => running.value ? '运行中…' : '运行天气 Agent')

const weatherTool: WeatherTool = {
  type: 'function',
  name: 'get_weather',
  description: 'Get the current weather for a city',
  parameters: {
    type: 'object',
    properties: { city: { type: 'string' } },
    required: ['city'],
    additionalProperties: false,
  },
  strict: true,
}

function wait(milliseconds: number): Promise<void> {
  return new Promise(resolve => window.setTimeout(resolve, milliseconds))
}

async function responsesCreate(request: ModelRequest): Promise<ModelResponse> {
  await wait(120)
  const toolResult = request.input.find((item): item is FunctionCallOutput => 'type' in item && item.type === 'function_call_output')
  if (!toolResult) {
    const firstInput = request.input[0]
    const requestedCity = firstInput && 'role' in firstInput && firstInput.role === 'user'
      ? firstInput.content.replace('请告诉我', '').replace('的天气', '')
      : '北京'
    return {
      id: `resp_${Date.now().toString(36)}`,
      output: [{ type: 'function_call', call_id: `call_${Date.now().toString(36)}`, name: 'get_weather', arguments: JSON.stringify({ city: requestedCity }) }],
      output_text: '',
      usage: { input_tokens: 24, output_tokens: 12, total_tokens: 36 },
    }
  }

  const weather = JSON.parse(toolResult.output) as { city: string, condition: string, temperature: number }
  const outputText = `${weather.city}今天${weather.condition}，${weather.temperature}°C。`
  return {
    id: `resp_${Date.now().toString(36)}`,
    output: [{ type: 'message', content: [{ type: 'output_text', text: outputText }] }],
    output_text: outputText,
    usage: { input_tokens: 42, output_tokens: 14, total_tokens: 56 },
  }
}

async function getWeather(requestedCity: string): Promise<{ city: string, condition: string, temperature: number }> {
  await wait(80)
  return { city: requestedCity, condition: '晴', temperature: 22 }
}

async function answerWeather(userText: string): Promise<string> {
  const trace = sdk.startTrace()
  try {
    const firstRequest: ModelRequest = {
      model: 'gpt-4.1',
      input: [{ role: 'user', content: userText }],
      tools: [weatherTool],
    }
    const requestResult = trace.recordRequest(firstRequest)
    if (!requestResult.success)
      throw new Error(`记录模型请求失败：${requestResult.reason}`)

    const firstResponse = await responsesCreate(firstRequest)
    const responseResult = trace.recordResponse(firstResponse)
    if (!responseResult.success)
      throw new Error(`记录模型响应失败：${responseResult.reason}`)
    const call = firstResponse.output.find((item): item is FunctionCall => item.type === 'function_call')
    if (!call)
      throw new Error('模型没有请求天气工具')

    const argumentsData = JSON.parse(call.arguments) as { city: string }
    const weather = await getWeather(argumentsData.city)
    const toolOutput = JSON.stringify(weather)
    const toolResult = trace.recordToolResult({ callId: call.call_id, output: toolOutput })
    if (!toolResult.success)
      throw new Error(`记录工具结果失败：${toolResult.reason}`)

    const secondRequest: ModelRequest = {
      model: firstRequest.model,
      input: [...firstRequest.input, ...firstResponse.output, { type: 'function_call_output', call_id: call.call_id, output: toolOutput }],
      tools: firstRequest.tools,
    }
    const secondRequestResult = trace.recordRequest(secondRequest)
    if (!secondRequestResult.success)
      throw new Error(`记录模型请求失败：${secondRequestResult.reason}`)
    const secondResponse = await responsesCreate(secondRequest)
    const secondResponseResult = trace.recordResponse(secondResponse)
    if (!secondResponseResult.success)
      throw new Error(`记录模型响应失败：${secondResponseResult.reason}`)
    const endResult = trace.end()
    if (!endResult.success)
      throw new Error(`结束 Trace 失败：${endResult.reason}`)
    return secondResponse.output_text
  }
  catch (error) {
    trace.fail(error instanceof Error ? error : '天气流程失败')
    throw error
  }
}

async function runWeatherAgent() {
  if (running.value)
    return
  running.value = true
  answer.value = ''
  status.value = '正在记录模型请求、工具调用和模型响应…'
  try {
    answer.value = await answerWeather(`请告诉我${city.value}的天气`)
    sentCount.value++
    status.value = `Trace 已完成（${sentCount.value} 次），请在 Agent Trace 面板查看完整事件流`
  }
  catch (error) {
    status.value = `发送失败：${error instanceof Error ? error.message : '未知错误'}`
  }
  finally {
    running.value = false
  }
}
</script>

<template>
  <main class="playground">
    <h1>Trace Script Playground</h1>
    <p>打开本页的 DevTools，选择 Agent Trace，然后运行一次真实的模型、工具、模型数据流程。</p>
    <form class="agent-form" @submit.prevent="runWeatherAgent">
      <label class="city-field">
        城市
        <input v-model="city" :disabled="running" aria-label="城市">
      </label>
      <button type="submit" class="send-button" :disabled="running" @click="runWeatherAgent">
        {{ buttonLabel }}
      </button>
    </form>
    <p v-if="answer" class="answer" aria-live="polite">
      {{ answer }}
    </p>
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

.city-field {
  display: grid;
  gap: 6px;
  max-width: 280px;
  margin: 24px 0 16px;
}

.agent-form {
  display: grid;
  justify-items: start;
}

.city-field input {
  padding: 9px 10px;
  border: 1px solid #9aa8c2;
  border-radius: 6px;
  font: inherit;
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

.send-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.send-button:focus-visible,
.city-field input:focus-visible {
  outline: 2px solid #2455d6;
  outline-offset: 3px;
}

.answer {
  margin-top: 24px;
  font-size: 1.2rem;
  font-weight: 600;
}
</style>
