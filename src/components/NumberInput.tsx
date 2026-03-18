"use client";

import { useState, useEffect } from "react";

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  className?: string;
}

export default function NumberInput({
  value,
  onChange,
  step = 1,
  className = "",
}: NumberInputProps) {
  const [localValue, setLocalValue] = useState(String(value ?? ""));

  useEffect(() => {
    setLocalValue(String(value ?? ""));
  }, [value]);

  return (
    <input
      type="number"
      value={localValue}
      step={step}
      onChange={(e) => {
        setLocalValue(e.target.value);
        const num = step % 1 !== 0 ? parseFloat(e.target.value) : parseInt(e.target.value, 10);
        if (!isNaN(num)) onChange(num);
        else if (e.target.value === "" || e.target.value === "-") onChange(0);
      }}
      onBlur={() => {
        if (localValue === "" || localValue === "-" || isNaN(Number(localValue))) {
          setLocalValue("0");
          onChange(0);
        } else {
          const num = Number(localValue);
          if (num < 0) {
            setLocalValue("0");
            onChange(0);
          }
        }
      }}
      className={className}
    />
  );
}
