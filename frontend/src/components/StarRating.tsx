'use client';

import { useState } from 'react';

type Props = {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export default function StarRating({ value, onChange, disabled }: Props) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue ?? value ?? 0;

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <div
          key={star}
          className="relative w-6 h-6 cursor-pointer"
          onMouseMove={(e) => {
            if (disabled) return;

            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            const v = star - 1 + (percent >= 0.5 ? 1 : 0.5);

            setHoverValue(v);
          }}
          onMouseLeave={() => setHoverValue(null)}
          onClick={() => {
            if (disabled) return;
            if (hoverValue) onChange(hoverValue);
          }}
        >
          <span className="absolute inset-0 text-gray-300 text-2xl">★</span>

          <span
            className="absolute inset-0 text-yellow-400 text-2xl overflow-hidden"
            style={{
              width:
                displayValue >= star
                  ? '100%'
                  : displayValue >= star - 0.5
                  ? '50%'
                  : '0%',
            }}
          >
            ★
          </span>
        </div>
      ))}
    </div>
  );
}
