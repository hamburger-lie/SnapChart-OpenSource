/**
 * 内联文本编辑器
 * 当编辑模式下点击标题时，在标题位置叠加一个输入框实现现场编辑
 */

import { useState, useRef, useEffect } from "react";

interface InlineTextEditorProps {
  /** 当前文本值 */
  value: string;
  /** 编辑完成的回调 */
  onConfirm: (value: string) => void;
  /** 取消编辑 */
  onCancel: () => void;
}

export default function InlineTextEditor({
  value,
  onConfirm,
  onCancel,
}: InlineTextEditorProps) {
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // 挂载时自动聚焦并全选
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onConfirm(text);
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="absolute inset-x-0 top-3 flex justify-center z-20 pointer-events-none">
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => onConfirm(text)}
        className="pointer-events-auto px-3 py-1.5 text-lg font-semibold text-center bg-white border-2 border-blue-400 rounded-lg shadow-lg outline-none min-w-[200px] max-w-[80%]"
        placeholder="输入图表标题"
      />
    </div>
  );
}
