type Props = {
  size?: number;
  className?: string;
};

export default function AppLogo({ size = 40, className = '' }: Props) {
  return (
    <img
      src="/bachao-mark.png"
      alt="Bachao"
      width={size}
      height={size}
      className={`rounded-xl object-cover shadow-sm shrink-0 ${className}`}
      draggable={false}
    />
  );
}
