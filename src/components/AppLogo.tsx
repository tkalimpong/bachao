import { APP_NAME, LOGO_MARK } from '../lib/appBrand';

type Props = {
  size?: number;
  className?: string;
};

export default function AppLogo({ size = 40, className = '' }: Props) {
  return (
    <img
      src={LOGO_MARK}
      alt={APP_NAME}
      width={size}
      height={size}
      className={`rounded-xl object-cover shadow-sm shrink-0 ${className}`}
      draggable={false}
    />
  );
}
