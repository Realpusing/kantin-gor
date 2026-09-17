export default function StatsCard({ title, value, icon: Icon, color = 'blue', subtitle }) {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-emerald-500 to-emerald-600',
      orange: 'from-orange-500 to-orange-600',
      red: 'from-red-500 to-red-600',
      purple: 'from-purple-500 to-purple-600',
      teal: 'from-teal-500 to-teal-600',
      yellow: 'from-yellow-500 to-yellow-600',
    }
  
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <p className="text-xl font-bold text-gray-800 mt-1 truncate">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          </div>
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center flex-shrink-0 ml-3`}>
            <Icon className="text-white" size={20} />
          </div>
        </div>
      </div>
    )
  }