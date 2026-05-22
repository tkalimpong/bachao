import { getCategoryIcon } from '../lib/categoryIcons';

type Props = {
  iconId: string;
  className?: string;
  style?: React.CSSProperties;
  strokeWidth?: number;
  color?: string;
};

export default function CategoryIconGlyph({
  iconId,
  className,
  style,
  strokeWidth = 2.5,
  color,
}: Props) {
  const Icon = getCategoryIcon(iconId);
  return (
    <Icon
      className={className}
      style={color ? { color, ...style } : style}
      strokeWidth={strokeWidth}
      aria-hidden
    />
  );
}
