import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatRupiah, formatDate, getCategoryIcon } from '../lib/helpers'
import DataTable from '../components/ui/DataTable'
import Modal from '../components/ui/Modal'
import Loading from '../components/ui/Loading'
import toast from 'react-hot-toast'
import { IoAddOutline, IoTrashOutline } from 'react-icons/io5'

export default function Sales() {
  const { user, isAdmin } = useAuth()
  const [records, setRecords] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ product_id: '', quantity: '', sell_price: '', note: '' })

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const [{ data: recs }, { data: prods }] = await Promise.all([
      supabase.from('sales').select('*, products(name, category, sell_price), users:created_by(full_name)').order('created_at', { ascending: false }),
      supabase.from('products').select('*').order('category').order('name'),
    ])
    setRecords(recs || [])
    setProducts(prods || [])
    setLoading(false)
  }

  const handleProductChange = (id) => {
    const p = products.find(x => x.id === id)
    setForm({ ...form, product_id: id, sell_price: p ? p.sell_price.toString() : '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('sales').insert({
        product_id: form.product_id,
        quantity: parseInt(form.quantity),
        sell_price: parseInt(form.sell_price),
        note: form.note || null,
        created_by: user.id,
      })
      if (error) throw error
      toast.success('Penjualan tercatat! 💰')
      setModalOpen(false)
      setForm({ product_id: '', quantity: '', sell_price: '', note: '' })
      fetchAll()
    } catch (err) { toast.error(err.message) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus data penjualan ini?')) return
    const { error } = await supabase.from('sales').delete().eq('id', id)
    if (error) return toast.error(error.message)
    toast.success('Data penjualan dihapus!')
    fetchAll()
  }

  const columns = [
    { header: '#', render: (_, i) => <span className="text-gray-400 text-xs">{i + 1}</span> },
    { header: 'Produk', render: r => <span className="font-semibold">{getCategoryIcon(r.products?.category)} {r.products?.name}</span> },
    { header: 'Jumlah', render: r => <span className="font-bold text-orange-600">{r.quantity}</span> },
    { header: 'Harga Jual', render: r => formatRupiah(r.sell_price) },
    { header: 'Total', render: r => <span className="font-semibold text-emerald-600">{formatRupiah(r.total_income)}</span> },
    { header: 'Catatan', render: r => <span className="text-gray-400 text-xs">{r.note || '-'}</span> },
    { header: 'Kasir', render: r => <span className="text-xs">{r.users?.full_name || '-'}</span> },
    { header: 'Tanggal', render: r => <span className="text-xs text-gray-500">{formatDate(r.created_at)}</span> },
    ...(isAdmin ? [{
      header: '', render: r => (
        <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
          <IoTrashOutline size={14} />
        </button>
      )
    }] : []),
  ]

  if (loading) return <Loading />

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">💰 Input Penjualan</h1>
          <p className="text-gray-500 text-sm mt-1">Catat penjualan harian kantin</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium shadow-lg shadow-orange-200 text-sm">
          <IoAddOutline size={18} /> Catat Penjualan
        </button>
      </div>

      <DataTable columns={columns} data={records} emptyMessage="Belum ada data penjualan" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="💰 Catat Penjualan">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pilih Produk</label>
            <select value={form.product_id} onChange={e => handleProductChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" required>
              <option value="">-- Pilih Produk --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{getCategoryIcon(p.category)} {p.name} — {formatRupiah(p.sell_price)}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jumlah</label>
              <input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" required min="1" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Harga Jual (Rp)</label>
              <input type="number" value={form.sell_price} onChange={e => setForm({...form, sell_price: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" required min="0" />
            </div>
          </div>
          {form.quantity && form.sell_price && (
            <div className="p-3 bg-emerald-50 rounded-xl text-sm text-emerald-700">
              Total Penjualan: <span className="font-bold">{formatRupiah(parseInt(form.quantity) * parseInt(form.sell_price))}</span>
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Catatan (opsional)</label>
            <input value={form.note} onChange={e => setForm({...form, note: e.target.value})}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" placeholder="cth: Pembeli tim tamu" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-600 text-sm">Batal</button>
            <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium text-sm">Simpan</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}