import React from 'react';

const PATHS = [
  'M0 90 C 240 30 480 150 720 90 C 960 30 1200 150 1440 90 C 1680 30 1920 150 2160 90 C 2400 30 2640 150 2880 90 L2880 180 L0 180 Z',
  'M0 110 C 300 60 420 160 720 110 C 1020 60 1140 160 1440 110 C 1740 60 1860 160 2160 110 C 2460 60 2580 160 2880 110 L2880 180 L0 180 Z',
  'M0 130 C 360 100 360 170 720 130 C 1080 100 1080 170 1440 130 C 1800 100 1800 170 2160 130 C 2520 100 2520 170 2880 130 L2880 180 L0 180 Z',
];

/** Three drifting wave layers along the bottom of a positioned container. */
export default function Waves({ colors = ['#2483a8', '#068b85', '#05171f'], style }) {
  return (
    <div className="tl-waves" style={style} aria-hidden>
      {PATHS.map((d, index) => (
        <div key={d} className={`tl-wave-${index + 1}`} style={{ position: 'absolute', inset: 0 }}>
          <svg viewBox="0 0 2880 180" preserveAspectRatio="none">
            <path fill={colors[index]} d={d} />
          </svg>
        </div>
      ))}
    </div>
  );
}
