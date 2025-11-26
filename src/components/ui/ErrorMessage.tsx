import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message?: string;
}

export function ErrorMessage({ message = 'Une erreur est survenue' }: ErrorMessageProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3 max-w-md">
        <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={20} />
        <div>
          <h3 className="font-semibold text-red-900 mb-1">Erreur</h3>
          <p className="text-red-700 text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
}
