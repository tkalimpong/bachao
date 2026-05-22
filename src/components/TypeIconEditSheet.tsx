import { Check, RotateCcw } from 'lucide-react';
import {
  CATEGORY_COLOR_PRESETS,
  type CategoryIconSectionDef,
} from '../lib/categoryIcons';
import CategoryIconGlyph from './CategoryIconGlyph';

type Props = {
  title: string;
  onClose: () => void;
  nameLabel: string;
  namePlaceholder: string;
  name: string;
  onNameChange: (value: string) => void;
  colorLabel: string;
  iconLabel: string;
  iconSections: CategoryIconSectionDef[];
  sectionTitle: (section: CategoryIconSectionDef) => string;
  color: string;
  onColorChange: (color: string) => void;
  iconId: string;
  onIconIdChange: (iconId: string) => void;
  previewBg: string;
  onSave: () => void;
  onReset: () => void;
  saveLabel: string;
  resetLabel: string;
};

export default function TypeIconEditSheet({
  title,
  onClose,
  nameLabel,
  namePlaceholder,
  name,
  onNameChange,
  colorLabel,
  iconLabel,
  iconSections,
  sectionTitle,
  color,
  onColorChange,
  iconId,
  onIconIdChange,
  previewBg,
  onSave,
  onReset,
  saveLabel,
  resetLabel,
}: Props) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-w-sm mx-auto max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pt-3 pb-4 px-5 overflow-y-auto min-h-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>

          <div className="flex items-end gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: previewBg }}
              aria-hidden
            >
              <CategoryIconGlyph
                iconId={iconId}
                className="w-7 h-7"
                color={color}
                strokeWidth={2.5}
              />
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-xs text-gray-400 font-semibold uppercase ml-1 mb-1 block">
                {nameLabel}
              </label>
              <input
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder={namePlaceholder}
                aria-label={nameLabel}
                className="w-full bg-gray-50 rounded-xl px-4 h-12 text-base outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
          </div>

          <p className="text-xs text-gray-400 font-semibold uppercase ml-1 mb-2">{colorLabel}</p>
          <div className="grid grid-cols-6 gap-2 mb-4">
            {CATEGORY_COLOR_PRESETS.map((preset) => {
              const selected = color === preset.color;
              return (
                <button
                  key={preset.color}
                  type="button"
                  onClick={() => onColorChange(preset.color)}
                  className={`w-full aspect-square rounded-full border-2 transition-all active:scale-95 ${
                    selected ? 'border-gray-900 scale-110' : 'border-transparent'
                  }`}
                  style={{ background: preset.color }}
                  aria-label={preset.color}
                  aria-pressed={selected}
                />
              );
            })}
          </div>

          <p className="text-xs text-gray-400 font-semibold uppercase ml-1 mb-2">{iconLabel}</p>
          {iconSections.map((section) => (
            <div key={section.id} className="mb-3">
              <p className="text-[11px] text-gray-400 font-semibold ml-1 mb-1.5">
                {sectionTitle(section)}
              </p>
              <div className="grid grid-cols-5 gap-2.5">
                {section.icons.map(({ id }) => {
                  const selected = iconId === id;
                  const preset = CATEGORY_COLOR_PRESETS.find((p) => p.color === color);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onIconIdChange(id)}
                      className={`min-h-[3.25rem] rounded-xl flex items-center justify-center p-2 transition-all active:scale-95 ${
                        selected ? 'ring-2 ring-brand-500 ring-offset-1' : 'bg-gray-100'
                      }`}
                      style={selected ? { background: preset?.bg ?? '#f3f4f6' } : undefined}
                      aria-label={id}
                      aria-pressed={selected}
                    >
                      <CategoryIconGlyph
                        iconId={id}
                        className="w-8 h-8"
                        color={selected ? color : '#6b7280'}
                        strokeWidth={2.5}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="h-1 mb-3" />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onReset}
              className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-600 font-bold text-sm flex items-center justify-center gap-1.5 active:scale-95"
            >
              <RotateCcw className="w-5 h-5" />
              {resetLabel}
            </button>
            <button
              type="button"
              onClick={onSave}
              className="flex-[2] h-12 rounded-2xl bg-brand-500 text-white font-bold text-sm flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Check className="w-5 h-5" />
              {saveLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
