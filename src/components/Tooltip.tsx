"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface TooltipProps {
  text: string;
}

interface TooltipPos {
  top: number;
  left: number;
  align: "left" | "center" | "right";
}

export default function Tooltip({ text }: TooltipProps) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState<TooltipPos>({ top: 0, left: 0, align: "center" });
  const btnRef = useRef<HTMLButtonElement>(null);
  const TOOLTIP_WIDTH = 256; // w-64

  const calcPos = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const vw = window.innerWidth;

    const rawLeft = rect.left + rect.width / 2;
    const top = rect.top - 8; // mb-2 위

    // 좌우 뷰포트 이탈 보정
    let left = rawLeft;
    let align: TooltipPos["align"] = "center";

    if (rawLeft - TOOLTIP_WIDTH / 2 < 8) {
      // 왼쪽 이탈 → 왼쪽 정렬
      left = rect.left;
      align = "left";
    } else if (rawLeft + TOOLTIP_WIDTH / 2 > vw - 8) {
      // 오른쪽 이탈 → 오른쪽 정렬
      left = rect.right;
      align = "right";
    }

    setPos({ top, left, align });
  }, []);

  const handleShow = useCallback(() => {
    calcPos();
    setShow(true);
  }, [calcPos]);

  const handleHide = useCallback(() => setShow(false), []);

  // 스크롤/리사이즈 시 위치 재계산
  useEffect(() => {
    if (!show) return;
    window.addEventListener("scroll", calcPos, true);
    window.addEventListener("resize", calcPos);
    return () => {
      window.removeEventListener("scroll", calcPos, true);
      window.removeEventListener("resize", calcPos);
    };
  }, [show, calcPos]);

  const translateX =
    pos.align === "center"
      ? "-50%"
      : pos.align === "left"
      ? "0%"
      : "-100%";

  const arrowLeft =
    pos.align === "center"
      ? "50%"
      : pos.align === "left"
      ? `${(btnRef.current?.getBoundingClientRect().width ?? 16) / 2}px`
      : `calc(100% - ${(btnRef.current?.getBoundingClientRect().width ?? 16) / 2}px)`;

  return (
    <span className="relative inline-block ml-1">
      <button
        ref={btnRef}
        type="button"
        className="text-gray-400 hover:text-blue-500 transition-colors text-sm"
        onMouseEnter={handleShow}
        onMouseLeave={handleHide}
        onFocus={handleShow}
        onBlur={handleHide}
        aria-label="정보"
      >
        ℹ️
      </button>

      {show && (
        <div
          className="fixed z-[9999] mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-normal pointer-events-none"
          style={{
            top: pos.top,
            left: pos.left,
            width: TOOLTIP_WIDTH,
            transform: `translateX(${translateX}) translateY(-100%)`,
          }}
        >
          {text}
          <div
            className="absolute top-full -mt-1 border-4 border-transparent border-t-gray-900"
            style={{ left: arrowLeft, transform: "translateX(-50%)" }}
          />
        </div>
      )}
    </span>
  );
}
