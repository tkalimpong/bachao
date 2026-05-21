import { ChevronLeft } from 'lucide-react';

export default function SubScreenHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-5 pt-10 pb-3">
      <button
        onClick={onBack}
        aria-label="Back"
        className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center active:scale-95 transition-transform shrink-0"
      >
        <ChevronLeft className="w-5 h-5 text-gray-600" />
      </button>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
    </div>
  );
}
