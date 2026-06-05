// POST /api/generate
// 接收小说文本，调用 DeepSeek 生成剧本 YAML，解析后返回
// 使用默认 Node.js runtime（非 Edge），保证 js-yaml 等库兼容

import { NextResponse } from "next/server";
import { load } from "js-yaml";
import { generateScript } from "@/lib/llm";

/** 输入文本最大长度（50K 字符），防止超出 token 限制 */
const MAX_TEXT_LENGTH = 50000;

export async function POST(request: Request) {
  try {
    // 解析请求体
    const body = await request.json();
    const { text } = body;

    // 参数校验
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { success: false, error: "缺少文本参数" },
        { status: 400 }
      );
    }

    if (text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "文本不能为空" },
        { status: 400 }
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { success: false, error: `文本过长，请控制在 ${MAX_TEXT_LENGTH} 字符以内` },
        { status: 400 }
      );
    }

    // 调用 LLM 生成 YAML
    const yamlStr = await generateScript(text);

    // 尝试解析 YAML
    try {
      const parsed = load(yamlStr);
      return NextResponse.json({
        success: true,
        data: parsed,
        yaml: yamlStr,
      });
    } catch (parseErr) {
      // YAML 解析失败，仍返回原始字符串供前端降级显示
      console.error("YAML 解析失败:", parseErr);
      return NextResponse.json({
        success: true,
        data: null,
        yaml: yamlStr,
        parseError: "YAML 格式解析失败，请手动复制下方的原始内容",
      });
    }
  } catch (err) {
    console.error("API 错误:", err);
    const message =
      err instanceof Error ? err.message : "服务器内部错误";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
