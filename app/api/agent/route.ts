import { NextResponse } from "next/server";
import { runAgent } from "@/lib/agent";
import type { Script } from "@/types";

const MAX_MESSAGE_LENGTH = 50000;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, script, history, novelText } = body as {
      message: string;
      script?: Script | null;
      history?: { role: "user" | "assistant"; content: string }[];
      novelText?: string;
    };

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

    const result = await runAgent(
      message,
      script ?? null,
      history ?? [],
      novelText ?? undefined
    );

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
