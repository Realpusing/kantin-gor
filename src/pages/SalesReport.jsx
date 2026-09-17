import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatRupiah, formatDate, getCategoryIcon, CATEGORIES } from '../lib/helpers'
import DataTable from '../components/ui/DataTable'
import StatsCard from '../components/ui/StatsCard'
import Loading from '../components/ui/Loading'
import { IoCashOutline, IoCartOutline, IoReceiptOutline } from 'react-icons/io5'

export default function SalesReport() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterCat, setFilterCat] = useState('')

  useEffect(() => {
    const now = new Date()
    setDateFrom(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0])
    setDateTo(now.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (dateFrom && dateTo) fetchSales()
  }, [dateFrom, dateTo])

  const fetchSales = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('sales')
      .select('*, products(name, category), users:created_by(full_name)')
      .gte('created_at', `${dateFrom}T00:00:00`)
      .lte('created_at', `${dateTo}T23:59:59`)
      .order('created_at', { ascending: false })
    setSales(data || [])
    setLoading(false)
  }

  const filtered = sales.filter(s => !filterCat || s.products?.category === filterCat)

  const totalRevenue = filtered.reduce((sum, s) => sum + s.total_income, 0)
  const totalItems = filtered.reduce((sum, s) => sum + s.quantity, 0)

  const columns = [
    { header: '#', render: (_, i) => <span className="text-gray-400 text-xs">{i + 1}</span> },
    { header: 'Produk', render: r => (
      <div>
        <p className="font-semibold text-sm">{getCategoryIcon(r.products?.category)} {r.products?.name}</p>
        <p className="text-[11px] text-gray-400">{r.products?.category}</p>
      </div>
    )},
    { header: 'Qty', render: r => <span className="font-bold">{r.quantity}</span> },
    { header: 'Harga', render: r => <span className="text-sm">{formatRupiah(r.sell_price)}</span> },
    { header: 'Subtotal', render: r => <span className="font-semibold text-emerald-600">{formatRupiah(r.total_income)}</span> },
    { header: 'Kasir', render: r => <span className="text-xs">{r.users?.full_name || '-'}</span> },
    { header: 'Waktu', render: r => <span className="text-xs text-gray-500">{formatDate(r.created_at)}</span> },
  ]

  if (loading) return <Loading />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">📋 Laporan Penjualan</h1>
        <p className="text-gray-500 text-sm mt-1">Lihat riwayat penjualan berdasarkan periode</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Dari</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Sampai</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm">
            <option value="">Semua Kategori</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatsCard title="Total Pendapatan" value={formatRupiah(totalRevenue)} icon={IoCashOutline} color="green" />
        <StatsCard title="Item Terjual" value={`${totalItems} pcs`} icon={IoCartOutline} color="orange" />
        <StatsCard title="Transaksi" value={filtered.length} icon={IoReceiptOutline} color="blue" />
      </div>

      <DataTable columns={columns} data={filtered} emptyMessage="Tidak ada penjualan di periode ini" />
    </div>
  )
}