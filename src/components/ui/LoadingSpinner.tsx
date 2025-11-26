export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <div className="flex justify-center items-center py-12">
      <div
        className={`${sizeClasses[size]} border-4 border-gray-200 border-t-orange-600 rounded-full animate-spin`}
      ></div>
    </div>
  );
}
