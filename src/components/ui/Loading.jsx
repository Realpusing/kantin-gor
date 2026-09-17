export default function Loading() {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 mt-3 text-sm">Memuat data...</p>
        </div>
      </div>
    )
  }