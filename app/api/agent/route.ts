// POST /api/agent
// 接收用户消息和可选的当前剧本，调用 Agent 处理并返回回复与更新后的剧本
// Agent 可自主决定是否调用 generate_script 工具

import { NextResponse } from "next/server";
import { runAgent } from "@/lib/agent";
import type { Script } from "@/types";

/** 输入消息最大长度，与 /api/generate 保持一致 */
const MAX_MESSAGE_LENGTH = 50000;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, script } = body as {
      message: string;
      script?: Script | null;
    };

    // 参数校验
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { success: false, error: "缺少消息参数" },
        { status: 400 }
      );
    }

    if (message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "消息不能为空" },
        { status: 400 }
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { success: false, error: `消息过长，请控制在 ${MAX_MESSAGE_LENGTH} 字符以内` },
        { status: 400 }
      );
    }

    // 调用 Agent
    const result = await runAgent(message, script ?? null);

    return NextResponse.json({
      success: true,
      data: {
        message: result.response,
        script: result.script,
      },
    });
  } catch (err) {
    console.error("Agent API 错误:", err);
    const errorMessage =
      err instanceof Error ? err.message : "服务器内部错误";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
