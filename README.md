# 小说转剧本工具

AI 小说转剧本工具 MVP —— 使用 DeepSeek 模型将小说文本转换为结构化剧本格式（YAML）。

## 快速开始

1. 复制环境变量模板并填写密钥：

```bash
cp .env.local.example .env.local
```

2. 编辑 `.env.local`，填入你的 DeepSeek API Key：

```
DEEPSEEK_API_KEY=sk-your-key-here
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat
```

3. 安装依赖并启动：

```bash
npm install
npm run dev
```

4. 打开浏览器访问 `http://localhost:3000`。

## 项目结构

```
app/
  layout.tsx          # 根布局
  page.tsx            # 主页面（输入 + 结果展示）
  api/generate/route.ts  # POST API 接口
  components/
    NovelInput.tsx    # 文本输入组件
    ScriptPreview.tsx # 剧本预览组件（含 SceneCard）
  globals.css         # Tailwind 全局样式
lib/
  prompt.ts           # Prompt 构建
  llm.ts              # DeepSeek LLM 调用
  parseYaml.ts        # YAML 解析工具
types/
  index.ts            # TypeScript 类型定义
```

## 技术栈

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- DeepSeek 模型（OpenAI 兼容接口）
- js-yaml 解析
