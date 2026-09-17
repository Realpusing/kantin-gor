export default function DataTable({ columns, data, emptyMessage = 'Tidak ada data' }) {
    if (!data || data.length === 0) {
      return (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-400">{emptyMessage}</p>
        </div>
      )
    }
  
    return (
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {columns.map((col, i) => (
                  <th key={i} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((row, ri) => (
                <tr key={ri} className="hover:bg-gray-50/50 transition-colors">
                  {columns.map((col, ci) => (
                    <td key={ci} className="px-5 py-3.5 text-sm text-gray-700 whitespace-nowrap">
                      {col.render ? col.render(row, ri) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }