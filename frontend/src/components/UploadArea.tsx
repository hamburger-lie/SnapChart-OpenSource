/**
 * 文件上传区域组件
 * 支持拖拽上传和点击选择，限制 .xlsx 和 .csv 文件格式
 */

import { useCallback, useRef, useState } from "react";
import { Upload, FileSpreadsheet, X } from "lucide-react";

/** 允许的文件扩展名（含老版本 .xls） */
const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv"];
/** 对应的 MIME 类型（用于 input accept 属性） */
const ACCEPT_TYPES = [
  ".xlsx",
  ".xls",
  ".csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel",                                           // .xls
  "text/csv",
].join(",");

interface UploadAreaProps {
  /** 文件选定后的回调 */
  onFileSelect: (file: File) => void;
  /** 当前是否正在上传（禁用交互） */
  isUploading: boolean;
}

export default function UploadArea({
  onFileSelect,
  isUploading,
}: UploadAreaProps) {
  // 拖拽悬停状态
  const [isDragOver, setIsDragOver] = useState(false);
  // 已选文件（用于展示文件名）
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // 文件校验错误
  const [fileError, setFileError] = useState<string | null>(null);
  // 隐藏的 file input 引用
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** 校验文件格式是否合法 */
  const validateFile = (file: File): boolean => {
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFileError(
        `不支持的文件格式"${ext}"，仅支持 .xlsx、.xls 和 .csv 文件`
      );
      return false;
    }
    setFileError(null);
    return true;
  };

  /** 处理文件选择（拖拽或点击共用） */
  const handleFile = useCallback(
    (file: File) => {
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  /** 清除已选文件 */
  const clearFile = () => {
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ========== 拖拽事件处理 ==========

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isUploading) setIsDragOver(true);
    },
    [isUploading]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (isUploading) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [isUploading, handleFile]
  );

  // ========== 点击选择事件 ==========

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* 拖拽上传区域 */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${
            isUploading
              ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
              : isDragOver
                ? "border-blue-500 bg-blue-50 scale-[1.02]"
                : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/30"
          }
        `}
      >
        {/* 上传图标 */}
        <div
          className={`mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
            isDragOver ? "bg-blue-100" : "bg-gray-100"
          }`}
        >
          <Upload
            className={`w-7 h-7 ${isDragOver ? "text-blue-500" : "text-gray-400"}`}
          />
        </div>

        {/* 提示文案 */}
        <p className="text-lg font-medium text-gray-700 mb-1">
          {isDragOver ? "松开鼠标即可上传" : "拖拽文件到此处，或点击选择"}
        </p>
        <p className="text-sm text-gray-400">
          支持 .xlsx、.xls 和 .csv 格式，最大 20MB
        </p>

        {/* 隐藏的文件输入框 */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_TYPES}
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {/* 文件格式错误提示 */}
      {fileError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm">
          <X className="w-4 h-4 shrink-0" />
          <span>{fileError}</span>
        </div>
      )}

      {/* 已选文件信息展示 */}
      {selectedFile && !fileError && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-700 text-sm">
            <FileSpreadsheet className="w-4 h-4 shrink-0" />
            <span className="font-medium truncate max-w-[300px]">
              {selectedFile.name}
            </span>
            <span className="text-green-500">
              ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          {!isUploading && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="text-green-400 hover:text-green-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
