import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { formatRupiah, formatDate, getCategoryIcon } from '../lib/helpers'
import StatsCard from '../components/ui/StatsCard'
import Loading from '../components/ui/Loading'
import {
  IoFastFoodOutline, IoCubeOutline, IoCartOutline,
  IoCashOutline, IoTrendingUpOutline, IoWarningOutline,
} from 'react-icons/io5'

export default function Dashboard() {
  const { user, isAdmin } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentSales, setRecentSales] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      const [{ count: pCount }, { data: stockData }, { data: recent }] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('stock_summary').select('*'),
        supabase.from('sales').select('*, products(name, category)').order('created_at', { ascending: false }).limit(5),
      ])

      const totalIn = stockData?.reduce((a, b) => a + b.total_stock_in, 0) || 0
      const totalSold = stockData?.reduce((a, b) => a + b.total_sold, 0) || 0
      const totalRevenue = stockData?.reduce((a, b) => a + b.total_revenue, 0) || 0
      const totalPurchase = stockData?.reduce((a, b) => a + b.total_purchase_cost, 0) || 0
      const low = stockData?.filter(s => s.current_stock <= 5 && s.current_stock >= 0) || []

      setStats({ totalProducts: pCount || 0, totalIn, totalSold, totalRevenue, totalPurchase, lowStockCount: low.length })
      setLowStock(low)
      setRecentSales(recent || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Selamat datang, {user?.full_name}! ⚽🏟️</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        <StatsCard title="Total Produk" value={stats.totalProducts} icon={IoFastFoodOutline} color="blue" />
        <StatsCard title="Stok Masuk" value={`${stats.totalIn} pcs`} icon={IoCubeOutline} color="green" />
        <StatsCard title="Terjual" value={`${stats.totalSold} pcs`} icon={IoCartOutline} color="orange" />
        <StatsCard title="Pendapatan" value={formatRupiah(stats.totalRevenue)} icon={IoCashOutline} color="teal" />
        {isAdmin && (
          <StatsCard
            title="Profit"
            value={formatRupiah(stats.totalRevenue - stats.totalPurchase)}
            icon={IoTrendingUpOutline}
            color="purple"
            subtitle={`Modal: ${formatRupiah(stats.totalPurchase)}`}
          />
        )}
        <StatsCard title="Stok Menipis" value={`${stats.lowStockCount} produk`} icon={IoWarningOutline} color="red" subtitle="Stok ≤ 5" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-4">🛒 Penjualan Terbaru</h2>
          {recentSales.length === 0 ? (
            <p className="text-gray-400 text-center py-6 text-sm">Belum ada penjualan</p>
          ) : (
            <div className="space-y-2.5">
              {recentSales.map(sale => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-700 text-sm truncate">
                      {getCategoryIcon(sale.products?.category)} {sale.products?.name}
                    </p>
                    <p className="text-[11px] text-gray-400">{formatDate(sale.created_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="font-semibold text-gray-700 text-sm">{sale.quantity} pcs</p>
                    <p className="text-xs text-emerald-600 font-medium">{formatRupiah(sale.quantity * sale.sell_price)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-4">⚠️ Stok Menipis</h2>
          {lowStock.length === 0 ? (
            <p className="text-gray-400 text-center py-6 text-sm">Semua stok aman 👍</p>
          ) : (
            <div className="space-y-2.5">
              {lowStock.map(item => (
                <div key={item.product_id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                  <p className="font-medium text-gray-700 text-sm">
                    {getCategoryIcon(item.category)} {item.product_name}
                  </p>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    item.current_stock <= 0 ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                  }`}>
                    {item.current_stock <= 0 ? 'HABIS' : `Sisa ${item.current_stock}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}