import { useEffect, useState, type CSSProperties } from 'react';

type Props = {
  active: boolean;
  onDone: () => void;
};

type BurstCoin = {
  id: number;
  delay: number;
  duration: number;
  driftX: number;
  driftY: number;
  spinDeg: number;
  sizePx: number;
};

const BURST_COUNT = 14;
const ORIGIN_VH = 38;

function createBurstCoins(count: number): BurstCoin[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
    const power = 80 + Math.random() * 140;
    return {
      id: i,
      delay: Math.random() * 0.12,
      duration: 0.85 + Math.random() * 0.45,
      driftX: Math.round(Math.cos(angle) * power),
      driftY: Math.round(Math.sin(angle) * power - 40 - Math.random() * 60),
      spinDeg: Math.round(180 + Math.random() * 540),
      sizePx: Math.round(22 + Math.random() * 14),
    };
  });
}

function burstStyle(coin: BurstCoin): CSSProperties {
  return {
    top: `${ORIGIN_VH}vh`,
    width: coin.sizePx,
    height: coin.sizePx,
    marginLeft: -coin.sizePx / 2,
    animationDelay: `${coin.delay}s`,
    animationDuration: `${coin.duration}s`,
    '--burst-x': `${coin.driftX}px`,
    '--burst-y': `${coin.driftY}px`,
    '--burst-spin': `${coin.spinDeg}deg`,
  } as CSSProperties;
}

export default function GullakDestroyAnimation({ active, onDone }: Props) {
  const [visible, setVisible] = useState(false);
  const [coins, setCoins] = useState<BurstCoin[]>([]);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      setCoins([]);
      return;
    }

    const batch = createBurstCoins(BURST_COUNT);
    setCoins(batch);
    setVisible(true);

    const endMs =
      Math.max(...batch.map((c) => (c.delay + c.duration) * 1000)) + 350;
    const t = window.setTimeout(onDone, endMs);
    return () => window.clearTimeout(t);
  }, [active, onDone]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
      aria-hidden
    >
      {coins.map((coin) => (
        <div
          key={coin.id}
          className="gullak-coin-burst absolute left-1/2"
          style={burstStyle(coin)}
        >
          <div className="w-full h-full rounded-full border-2 border-amber-300 bg-gradient-to-br from-amber-100 via-amber-300 to-amber-500 shadow-lg flex items-center justify-center">
            <span
              className="font-black text-amber-900 leading-none"
              style={{ fontSize: Math.max(9, coin.sizePx * 0.38) }}
            >
              ₹
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
