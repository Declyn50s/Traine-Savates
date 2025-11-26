import { Clock } from 'lucide-react';
import { ProgramItem } from '../../types/api';

interface ProgramTimelineProps {
  items: ProgramItem[];
}

export function ProgramTimeline({ items }: ProgramTimelineProps) {
  return (
    <div className="space-y-6">
      {items.map((item, index) => (
        <div key={item.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="bg-orange-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-sm flex-shrink-0">
              <Clock size={20} />
            </div>
            {index < items.length - 1 && (
              <div className="w-0.5 bg-orange-300 flex-1 mt-2 min-h-[40px]"></div>
            )}
          </div>

          <div className="flex-1 pb-4">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <span className="font-bold text-orange-600 text-lg">{item.time}</span>
                <h3 className="font-semibold text-gray-900">{item.label}</h3>
              </div>
              {item.description && (
                <p className="text-gray-600 text-sm mt-2">{item.description}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
