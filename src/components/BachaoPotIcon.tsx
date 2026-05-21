type Props = {
  className?: string;
  state?: 'savings' | 'overspend';
};

const GOLD = '#FBBF24';
const GOLD_MID = '#F59E0B';
const GOLD_LIGHT = '#FDE68A';
const GOLD_GLOW = '#FEF3C7';

const CRACK = '#4C0519';
const CRACK_SOFT = '#881337';

const POT =
  'M14 24.5C8.2 24.5 5.8 20.6 5.8 16.5c0-3 1.4-5.3 3.2-6.2-.5-.7-.7-1.5-.7-2.3 0-1.8 1.9-3 5.7-3s5.7 1.2 5.7 2.3c0 .8-.2 1.6-.7 2.3 1.8.9 3.2 3.2 3.2 6.2 0 4.1-2.4 8-6.2 8Z';

const MOUTH_Y = 8.2;
/** Pivot for tipped pot — rests on the lower-left of the icon */
const TIP_PIVOT = { x: 9.5, y: 21.5 };
const TIP_ANGLE = 68;

function SavingsLight() {
  return (
    <g>
      <defs>
        <radialGradient id="pot-light-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={GOLD_LIGHT} stopOpacity="1" />
          <stop offset="45%" stopColor={GOLD} stopOpacity="0.65" />
          <stop offset="100%" stopColor={GOLD_MID} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="pot-light-halo" cx="50%" cy="55%" r="50%">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.75" />
          <stop offset="60%" stopColor={GOLD_MID} stopOpacity="0.25" />
          <stop offset="100%" stopColor={GOLD_MID} stopOpacity="0" />
        </radialGradient>
      </defs>
      <path
        d="M14 2.5V7M10.5 4.5l1.8 2.2M17.5 4.5l-1.8 2.2M8.5 7l2.4 1.6M19.5 7l-2.4 1.6"
        stroke={GOLD_LIGHT}
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.55"
      />
      <ellipse cx="14" cy="5.5" rx="7.5" ry="5.5" fill="url(#pot-light-halo)" />
      <ellipse cx="14" cy="7.2" rx="4.8" ry="3.2" fill="url(#pot-light-core)" />
      <ellipse cx="14" cy="6" rx="2.2" ry="1.6" fill={GOLD_GLOW} opacity="0.95" />
    </g>
  );
}

/** Organic crack lines drawn in upright pot space, rotated with the pot */
function OverspendCracks() {
  return (
    <g
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      opacity="0.88"
    >
      {/* primary impact fracture */}
      <path
        d="M10.8 21.2c1.2-1.4 2.8-1.8 4.6-1.1 1.4.5 2.4 1.8 2.7 3.4"
        stroke={CRACK}
        strokeWidth="1.05"
      />
      {/* long stress crack along the belly */}
      <path
        d="M11.2 9.5c-.6 3.2-.2 6.8 1.1 10.2 1 2.6 2.6 4.4 4.5 5.6"
        stroke={CRACK}
        strokeWidth="0.95"
      />
      {/* short branch from the belly crack */}
      <path
        d="M12.8 16.2c1.6.3 2.8 1.2 3.6 2.5"
        stroke={CRACK_SOFT}
        strokeWidth="0.75"
        opacity="0.85"
      />
      {/* hairline at the rim */}
      <path
        d="M10.4 8.4c1.8-.2 3.4.1 4.8 1"
        stroke={CRACK_SOFT}
        strokeWidth="0.7"
        opacity="0.75"
      />
    </g>
  );
}

function OverspendFallen() {
  const { x, y } = TIP_PIVOT;
  return (
    <>
      <ellipse cx="12" cy="25.8" rx="9" ry="1.1" fill={CRACK} opacity="0.12" />
      <g transform={`rotate(${TIP_ANGLE}, ${x}, ${y})`}>
        <path d={POT} fill="currentColor" />
        <OverspendCracks />
        {/* impact chip where the pot meets the ground */}
        <path
          d="M7.8 22.6c1.4-.8 2.6-.5 3.4.5-.5.9-1.6 1.2-2.8.6-.7-.3-1.2-.7-.6-1.1Z"
          fill={CRACK}
          opacity="0.45"
        />
      </g>
      {/* shards scattered beside the fallen pot */}
      <path d="M19.5 25.4l1.3-.6.6 1.3-1.5.4-.4-.9Z" fill={CRACK_SOFT} opacity="0.9" />
      <path d="M21.2 26l.9-.5.4.9-1.1.25-.2-.65Z" fill={CRACK_SOFT} opacity="0.7" />
      <path d="M17.8 26.3l1-.55.45 1.05-1.25.35-.2-.85Z" fill={CRACK} opacity="0.65" />
    </>
  );
}

/** Matka — savings: golden glow from the mouth; overspend: fallen, cracked pot */
export default function BachaoPotIcon({ className = '', state = 'savings' }: Props) {
  if (state === 'overspend') {
    return (
      <svg
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden
      >
        <OverspendFallen />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <SavingsLight />
      <path d={POT} fill="currentColor" />
      <ellipse cx="14" cy={MOUTH_Y} rx="2.8" ry="0.55" fill={GOLD_LIGHT} opacity="0.9" />
    </svg>
  );
}
