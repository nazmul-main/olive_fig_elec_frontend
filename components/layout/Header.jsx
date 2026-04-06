'use client';

export default function Header({ pageTitle = 'Overview' }) {
  return (
    <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow-sm no-print">
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex items-center">
          <h2 className="text-xl font-semibold text-gray-800">{pageTitle}</h2>
        </div>
      </div>
    </div>
  );
}

