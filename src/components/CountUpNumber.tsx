import { useEffect, useState } from "react";

interface CountUpNumberProps {
  value: number;
  durationMs?: number;
  decimals?: number;
  prefix?: string;
}

export const CountUpNumber = ({
  value,
  durationMs = 700,
  decimals = 0,
  prefix = ""
}: CountUpNumberProps) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      setDisplay(value * progress);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  return <>{prefix}{display.toFixed(decimals)}</>;
};
