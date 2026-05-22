import { ChevronLeft } from 'lucide-react';

export default function SubScreenHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-5 pt-10 pb-4">
      <button
        onClick={onBack}
        aria-label="Back"
        className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center active:scale-95 transition-transform shrink-0"
      >
        <ChevronLeft className="w-6 h-6 text-gray-600" strokeWidth={2.5} />
      </button>
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
    </div>
  );
}
