"use client";

interface NovelInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

/** 小说输入组件 —— 大文本输入框 + 提交按钮 */
export default function NovelInput({ value, onChange, onSubmit }: NovelInputProps) {
  /** Ctrl/Cmd + Enter 快捷提交 */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="w-full">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="请粘贴小说文本（支持多章节）..."
        rows={10}
        className="w-full p-4 border border-gray-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400"
      />
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-400">
          Ctrl + Enter 快速提交 · 已输入 {value.length} 字符
        </span>
        <button
          onClick={onSubmit}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          生成剧本
        </button>
      </div>
    </div>
  );
}
