import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatRupiah, getCategoryIcon } from '../lib/helpers'
import DataTable from '../components/ui/DataTable'
import StatsCard from '../components/ui/StatsCard'
import Modal from '../components/ui/Modal'
import Loading from '../components/ui/Loading'
import {
  IoGitCompareOutline, IoWarningOutline, IoCheckmarkCircleOutline,
  IoCashOutline, IoTrendingUpOutline, IoAlertCircleOutline,
} from 'react-icons/io5'

export default function Comparison() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [actualStocks, setActualStocks] = useState({})
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    supabase.from('stock_comparison').select('*').then(({ data: d }) => {
      setData(d || [])
      const init = {}
      d?.forEach(item => { init[item.product_id] = item.expected_stock })
      setActualStocks(init)
      setLoading(false)
    })
  }, [])

  const setActual = (id, val) => setActualStocks(prev => ({ ...prev, [id]: parseInt(val) || 0 }))

  const totalPurchase = data.reduce((s, c) => s + c.total_purchase_cost, 0)
  const totalRevenue = data.reduce((s, c) => s + c.total_revenue, 0)
  const profit = totalRevenue - totalPurchase

  const discrepancies = data.filter(c => (actualStocks[c.product_id] ?? c.expected_stock) !== c.expected_stock)
  const totalLost = discrepancies.reduce((s, c) => {
    const diff = (actualStocks[c.product_id] ?? c.expected_stock) - c.expected_stock
    return diff < 0 ? s + Math.abs(diff) : s
  }, 0)

  const columns = [
    { header: '#', render: (_, i) => <span className="text-gray-400 text-xs">{i + 1}</span> },
    { header: 'Produk', render: r => (
      <div>
        <p className="font-semibold text-sm">{getCategoryIcon(r.category)} {r.product_name}</p>
        <p className="text-[11px] text-gray-400">{r.category}</p>
      </div>
    )},
    { header: 'Masuk', render: r => <span className="text-blue-600 font-medium">{r.total_stock_in}</span> },
    { header: 'Terjual', render: r => <span className="text-orange-600 font-medium">{r.total_sold}</span> },
    { header: 'Seharusnya', render: r => <span className="font-bold">{r.expected_stock}</span> },
    {
      header: 'Stok Aktual',
      render: r => (
        <input type="number" value={actualStocks[r.product_id] ?? r.expected_stock}
          onChange={e => setActual(r.product_id, e.target.value)}
          className="w-[70px] px-2 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-center font-bold" min="0" />
      )
    },
    {
      header: 'Selisih',
      render: r => {
        const diff = (actualStocks[r.product_id] ?? r.expected_stock) - r.expected_stock
        return (
          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
            diff === 0 ? 'bg-green-100 text-green-700' :
            diff < 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {diff > 0 ? `+${diff}` : diff}
          </span>
        )
      }
    },
    {
      header: 'Status',
      render: r => {
        const diff = (actualStocks[r.product_id] ?? r.expected_stock) - r.expected_stock
        if (diff === 0) return <span className="flex items-center gap-1 text-green-600 text-xs font-semibold"><IoCheckmarkCircleOutline size={14} />Sesuai</span>
        if (diff < 0) return <span className="flex items-center gap-1 text-red-600 text-xs font-semibold"><IoWarningOutline size={14} />Hilang {Math.abs(diff)}</span>
        return <span className="flex items-center gap-1 text-yellow-600 text-xs font-semibold"><IoAlertCircleOutline size={14} />Lebih {diff}</span>
      }
    },
    { header: 'Pembelian', render: r => <span className="text-xs text-red-600">{formatRupiah(r.total_purchase_cost)}</span> },
    { header: 'Penjualan', render: r => <span className="text-xs text-emerald-600">{formatRupiah(r.total_revenue)}</span> },
    {
      header: 'Profit',
      render: r => <span className={`text-xs font-semibold ${r.profit_loss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatRupiah(r.profit_loss)}</span>
    },
  ]

  if (loading) return <Loading />

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🔍 Perbandingan & Analisis</h1>
          <p className="text-gray-500 text-sm mt-1">Bandingkan stok seharusnya vs fisik, deteksi kehilangan</p>
        </div>
        {discrepancies.length > 0 && (
          <button onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium shadow-lg shadow-red-200 text-sm animate-pulse">
            <IoWarningOutline size={18} /> {discrepancies.length} Tidak Sesuai
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="Total Modal" value={formatRupiah(totalPurchase)} icon={IoCashOutline} color="red" />
        <StatsCard title="Total Pendapatan" value={formatRupiah(totalRevenue)} icon={IoCashOutline} color="green" />
        <StatsCard title="Profit" value={formatRupiah(profit)} icon={IoTrendingUpOutline} color={profit >= 0 ? 'purple' : 'red'} subtitle={profit >= 0 ? '✅ Untung' : '❌ Rugi'} />
        <StatsCard title="Barang Hilang" value={`${totalLost} pcs`} icon={IoWarningOutline} color={totalLost > 0 ? 'red' : 'green'} subtitle={totalLost > 0 ? '⚠️ Perlu dicek' : '✅ Aman'} />
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
        <p className="text-sm text-emerald-700">
          <span className="font-bold">⚽ Cara Pakai:</span> Hitung fisik barang di kantin setelah pertandingan / akhir hari. 
          Masukkan jumlah aktual di kolom "Stok Aktual". Sistem otomatis deteksi jika ada selisih (barang hilang/lebih).
        </p>
      </div>

      <DataTable columns={columns} data={data} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="⚠️ Barang Tidak Sesuai" size="lg">
        <div className="space-y-3">
          {discrepancies.length === 0 ? (
            <div className="text-center py-8">
              <IoCheckmarkCircleOutline size={48} className="text-green-500 mx-auto mb-3" />
              <p className="text-green-600 font-semibold">Semua stok sesuai! 🎉</p>
            </div>
          ) : (
            <>
              <div className="p-3 bg-red-50 rounded-xl text-sm text-red-700 font-medium">
                Ditemukan {discrepancies.length} produk tidak sesuai. Total barang hilang: <span className="font-bold">{totalLost} pcs</span>
              </div>
              {discrepancies.map(item => {
                const actual = actualStocks[item.product_id] ?? item.expected_stock
                const diff = actual - item.expected_stock
                return (
                  <div key={item.product_id} className={`p-4 rounded-xl border ${diff < 0 ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-800">{getCategoryIcon(item.category)} {item.product_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          Seharusnya: <span className="font-bold">{item.expected_stock}</span> → Aktual: <span className="font-bold">{actual}</span>
                        </p>
                        <p className={`font-bold text-lg ${diff < 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                          {diff < 0 ? `${Math.abs(diff)} HILANG` : `${diff} LEBIH`}
                        </p>
                        {diff < 0 && (
                          <p className="text-xs text-red-500">Kerugian: {formatRupiah(Math.abs(diff) * item.sell_price)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 mt-4">
                <p className="text-sm font-semibold text-gray-700">Total Estimasi Kerugian dari Kehilangan:</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {formatRupiah(discrepancies.reduce((s, item) => {
                    const diff = (actualStocks[item.product_id] ?? item.expected_stock) - item.expected_stock
                    return diff < 0 ? s + (Math.abs(diff) * item.sell_price) : s
                  }, 0))}
                </p>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}