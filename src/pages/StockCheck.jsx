import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatRupiah, getCategoryStyle, getCategoryIcon, CATEGORIES } from '../lib/helpers'
import DataTable from '../components/ui/DataTable'
import Loading from '../components/ui/Loading'
import { IoSearchOutline } from 'react-icons/io5'

export default function StockCheck() {
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')

  useEffect(() => {
    supabase.from('stock_summary').select('*').then(({ data }) => {
      setStocks(data || [])
      setLoading(false)
    })
  }, [])

  const filtered = stocks.filter(s => {
    const m1 = s.product_name.toLowerCase().includes(search.toLowerCase())
    const m2 = !filterCat || s.category === filterCat
    return m1 && m2
  })

  const totalItems = filtered.reduce((a, b) => a + b.current_stock, 0)
  const totalValue = filtered.reduce((a, b) => a + (b.current_stock * b.sell_price), 0)

  const columns = [
    { header: '#', render: (_, i) => <span className="text-gray-400 text-xs">{i + 1}</span> },
    { header: 'Produk', render: r => <span className="font-semibold">{getCategoryIcon(r.category)} {r.product_name}</span> },
    { header: 'Kategori', render: r => { const s = getCategoryStyle(r.category); return <span className={`px-2 py-1 rounded-lg text-[11px] font-semibold ${s.bg}`}>{r.category}</span> } },
    { header: 'Masuk', render: r => <span className="text-blue-600 font-medium">{r.total_stock_in}</span> },
    { header: 'Terjual', render: r => <span className="text-orange-600 font-medium">{r.total_sold}</span> },
    {
      header: 'Stok Saat Ini',
      render: r => (
        <span className={`px-3 py-1 rounded-lg text-sm font-bold inline-block min-w-[60px] text-center ${
          r.current_stock <= 0 ? 'bg-red-100 text-red-700' :
          r.current_stock <= 5 ? 'bg-yellow-100 text-yellow-700' :
          'bg-green-100 text-green-700'
        }`}>
          {r.current_stock <= 0 ? 'HABIS' : r.current_stock}
        </span>
      )
    },
    { header: 'Harga Jual', render: r => <span className="text-sm">{formatRupiah(r.sell_price)}</span> },
    { header: 'Nilai Stok', render: r => <span className="text-emerald-600 font-medium text-sm">{formatRupiah(r.current_stock * r.sell_price)}</span> },
  ]

  if (loading) return <Loading />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">📊 Cek Stok</h1>
        <p className="text-gray-500 text-sm mt-1">Pantau stok barang kantin saat ini</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500">Total Item Tersedia</p>
          <p className="text-xl font-bold text-gray-800">{totalItems} pcs</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500">Nilai Stok</p>
          <p className="text-xl font-bold text-emerald-600">{formatRupiah(totalValue)}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari produk..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm">
          <option value="">Semua Kategori</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Aman (&gt;5)</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Menipis (1-5)</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Habis (0)</div>
      </div>

      <DataTable columns={columns} data={filtered} emptyMessage="Produk tidak ditemukan" />
    </div>
  )
}