"use client";

import { useCallback, useState } from "react";
import { useAppStore } from "@/lib/store";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
}

export function UploadZone({ onFileSelect }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const { isLoading, error } = useAppStore();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

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

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.type === "application/pdf") {
          onFileSelect(file);
        }
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type === "application/pdf") {
          onFileSelect(file);
        }
      }
    },
    [onFileSelect]
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <label
        htmlFor="file-upload"
        className={`
          relative flex flex-col items-center justify-center
          w-full min-h-[300px] p-8
          border-2 border-dashed rounded-2xl
          cursor-pointer
          transition-all duration-300 ease-out
          ${
            isDragOver
              ? "border-[#d4a574] bg-[#d4a574]/10 scale-[1.02]"
              : "border-[#3d3a38] bg-[#1a1816] hover:border-[#d4a574]/50 hover:bg-[#1a1816]/80"
          }
          ${isLoading ? "pointer-events-none opacity-60" : ""}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Icon */}
        <div
          className={`
          mb-6 p-4 rounded-full
          transition-all duration-300
          ${isDragOver ? "bg-[#d4a574]/20" : "bg-[#242220]"}
        `}
        >
          <svg
            className={`w-12 h-12 transition-colors duration-300 ${
              isDragOver ? "text-[#d4a574]" : "text-[#78716c]"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        {/* Text */}
        <div className="text-center">
          {isLoading ? (
            <>
              <p className="text-lg text-[#a8a29e] mb-2">
                Reading your screenplay...
              </p>
              <div className="w-48 h-1 bg-[#242220] rounded-full overflow-hidden">
                <div className="h-full bg-[#d4a574] animate-pulse rounded-full w-2/3" />
              </div>
            </>
          ) : (
            <>
              <p className="text-xl text-[#f5f5f5] mb-2 font-medium">
                Drop your screenplay here
              </p>
              <p className="text-[#78716c] mb-4">
                or click to browse • PDF only
              </p>
              <p className="text-sm text-[#d4a574] italic">
                Let&apos;s make it undeniable.
              </p>
            </>
          )}
        </div>

        <input
          id="file-upload"
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInput}
          className="sr-only"
          disabled={isLoading}
        />
      </label>

      {/* Error message */}
      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm text-center">{error}</p>
        </div>
      )}
    </div>
  );
}
