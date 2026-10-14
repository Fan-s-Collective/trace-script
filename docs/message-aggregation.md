# 消息聚合实现与待验收清单

本期依据 `.idea/PRD-message-aggregation.md` 开发。下表说明当前实现位置和已编写的验收用例，不代表测试已经通过。根据用户指示，不继续执行 dev、typecheck、build、lint、test。自动化检查与界面截图尚未执行；先前开发服务器的启动尝试被环境拒绝，未成功启动。发布前仍需运行检查与真实 Chrome 调试验证。

## SDK 接入与兼容

沿用事件顶层的 `traceId` 归属一次运行。`recordRequest(request)` 每次生成独立 `requestId`，返回 `RecordResult & { requestId: string }`；记录失败也返回调用标识。`recordResponse(requestId, response)` 必须传入对应标识，此签名是破坏性变更。服务端响应 `payload.id` 保持原值，不参与调用关联。

工具结果增加可选 `status`、`message`；`fail(error, { requestId })` 或 `fail(error, { callId })` 可定位终结错误，不能同时传入两个标识。`end('cancelled')` 显式记录取消。原有六类事件和完整 payload 保持；旧模型事件可以省略 `requestId`，仅做唯一未配对请求的保守关联。

流式期间只记录一次 Request，结束后记录组装后的最终 Response。可恢复的模型失败通过带失败状态的最终 Response 记录，重试重新 `recordRequest`。不增加 delta、工具执行开始或其他提供方适配协议。

## 行为与用例对应

| PRD 验收场景 | 实现与用例位置 | 验证状态 |
| --- | --- | --- |
| 单次模型调用、两轮模型加工具、多个工具、历史复用 | core `aggregateEvents`；`aggregate.test.ts` 前四组流程用例；面板七事件 preview | 已编写，未运行 |
| 并发逆序、旧事件唯一配对、旧事件歧义、跨 Trace 隔离 | core 显式分组与 legacyPending；对应关联用例 | 已编写，未运行 |
| 结果先到与稳定选择 | core 稳定标识；面板来源事件锚点；`trace-panel.test.ts` 显式与旧数据补齐用例 | 已编写，未运行 |
| 去重、同 ID 内容冲突、标识复用、多最终输出 | core 去重与 conflicts、associationConflict；原始输出保留与重复调用用例 | 已编写，未运行 |
| 模型与工具失败、Trace 无法定位错误、缺少输出、孤立输出 | core 调用状态与 Trace 状态分别计算；对应失败和完整性用例 | 已编写，未运行 |
| 重试、流式最终响应 | 独立 requestId，最终 usage 单次计数；对应尝试与最终响应用例 | 已编写，未运行 |
| 并行调用与 Trace 区间、时间倒置、工具返回间隔 | core 时间端点计算；并行 1000ms 与 Trace 1200ms 用例；倒置与工具配对用例 | 已编写，未运行 |
| Token 为零、未知、别名、无效值、部分 usage | responseTokens、sumUsage；按指标完整性和无效数值用例 | 已编写，未运行 |
| 筛选、计数、键盘、关系跳转、折叠 | 面板 visibleCalls、visibleTraces、navigableIds；面板状态与渲染用例 | 已编写，未运行 |
| 详情默认输入输出、页签与阅读位置、原始事件、安全文本 | 六个详情组件；详情页签与容器保留用例；模板均使用插值和 pre | 已编写，未运行；真实浏览器阅读位置仍待验证 |
| 生命周期冲突 | core 冲突终结处理；矛盾终结与原始事件保留用例 | 已编写，未运行 |

用例文件：`packages/core/tests/aggregate.test.ts`、`packages/core/tests/parse.test.ts`、`packages/sdk/tests/trace.test.ts`、`packages/chrome-extensions/tests/ui-model.test.ts`、`packages/chrome-extensions/tests/trace-panel.test.ts`。

## 简化与静态消融比较

保留行为：七事件得到一个摘要和三条调用；反序到达仍正确关联；同一调用更新不重置选择、页签和阅读容器；每条并行调用可单独选中。比较限定为源码路径和相同输入的手工推演，没有运行实验或声称测试通过。

1. 移除 `useTracePanel → createTracePanel` 的转发包装。包装前后都直接创建同一套局部响应式状态与生命周期监听，唯一调用方 App 仍取得相同职责的状态和动作；保留直接实现。返回结构由真实代码推导，移除额外维护的镜像接口。
2. 保留详情组件的 `index.ts` 统一具名导出，以及字段配置配合循环渲染的组织方式。源码对照中，直接导入没有可证明的行为收益，逐项模板还重复了字段标记；恢复原有组织方式，聚合字段、状态样式与详情说明仍保留。未运行验证。
3. 移除按原始事件类型合并时间轴轨道以及两个滚动区的同步包装。七事件场景现在由同一 Trace 下三条独立调用行组成；两个并行模型调用也使用两行。保留单个滚动区，不需要滚动同步状态。
4. 保留显式 requestId 分组与 Trace 隔离。手工对照输入 Request A、Request B、Response B、Response A：去掉关联键、使用邻接配对会把 A 的请求配到 B 的响应；跨 Trace 去掉隔离会碰撞复用的调用标识。对应回归用例已编写但未运行。
5. 移除调用状态尚未完成时的临时 Token 汇总，只在冲突处理后调用一次 `sumUsage`。同时移除模型专用 helper 中不可能到达的非模型分支：所有调用点已有事件类型收窄，usage 数据校验仍完整保留。按七事件的两组 usage 手工推演，最终仍分别累计输入 66、输出 26、总量 92，工具与摘要不另计费用。
6. 保留来源事件选择锚点。旧 Response 先到后追加较早序号的 Request 时，配对记录的身份会从输出来源变成请求来源；仅凭旧记录 ID 会丢失选择，按来源事件和记录类型解析才能定位补齐后的模型记录。显式 ID 则直接保持稳定。

## 仍需验收的边界

- 自动化检查与真实浏览器界面验证均未执行，不能声明可发布。
- 面板仍使用现有按被检查标签页隔离的内存事件源；本期不增加持久化、跨页面会话或跨 Trace 调度。
- OpenAI Responses 工具声明支持 `function_call` 的 arguments 与 `custom_tool_call` 的 input；缺少 call_id 的声明保留在完整 Response 并提示无法关联。
- 工具时间只能称为返回间隔；无工具执行开始事件，不推断实际执行耗时。
