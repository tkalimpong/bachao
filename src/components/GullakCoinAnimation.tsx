import { useEffect, useState, type CSSProperties } from 'react';

type Props = {
  active: boolean;
  onDone: () => void;
};

type CoinSpec = {
  id: number;
  leftPct: number;
  delay: number;
  duration: number;
  landVh: number;
  driftPx: number;
  spinDeg: number;
  sizePx: number;
};

const COIN_COUNT = 9;

function createCoins(count: number): CoinSpec[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    leftPct: 10 + Math.random() * 80,
    delay: i * 0.09 + Math.random() * 0.12,
    duration: 1.3 + Math.random() * 0.5,
    landVh: 36 + Math.random() * 24,
    driftPx: Math.round((Math.random() - 0.5) * 56),
    spinDeg: Math.round(360 + Math.random() * 720),
    sizePx: Math.round(24 + Math.random() * 12),
  }));
}

function coinStyle(coin: CoinSpec): CSSProperties {
  return {
    left: `${coin.leftPct}%`,
    width: coin.sizePx,
    height: coin.sizePx,
    marginLeft: -coin.sizePx / 2,
    animationDelay: `${coin.delay}s`,
    animationDuration: `${coin.duration}s`,
    '--coin-drift': `${coin.driftPx}px`,
    '--coin-land': `${coin.landVh}vh`,
    '--coin-spin': `${coin.spinDeg}deg`,
  } as CSSProperties;
}

function Coin({ coin }: { coin: CoinSpec }) {
  return (
    <div className="gullak-coin-fall absolute top-0" style={coinStyle(coin)}>
      <div className="w-full h-full rounded-full border-2 border-amber-300 bg-gradient-to-br from-amber-100 via-amber-300 to-amber-500 shadow-lg flex items-center justify-center">
        <span
          className="font-black text-amber-900 leading-none"
          style={{ fontSize: Math.max(9, coin.sizePx * 0.38) }}
        >
          ₹
        </span>
      </div>
    </div>
  );
}

export default function GullakCoinAnimation({ active, onDone }: Props) {
  const [visible, setVisible] = useState(false);
  const [coins, setCoins] = useState<CoinSpec[]>([]);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      setCoins([]);
      return;
    }

    const batch = createCoins(COIN_COUNT);
    setCoins(batch);
    setVisible(true);

    const endMs =
      Math.max(...batch.map((c) => (c.delay + c.duration) * 1000)) + 180;
    const t = window.setTimeout(onDone, endMs);
    return () => window.clearTimeout(t);
  }, [active, onDone]);

  if (!visible || coins.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
      aria-hidden
    >
      {coins.map((coin) => (
        <Coin key={coin.id} coin={coin} />
      ))}
    </div>
  );
}
