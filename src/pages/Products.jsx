// src/pages/Products.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatRupiah, CATEGORIES, getCategoryStyle } from '../lib/helpers'
import DataTable from '../components/ui/DataTable'
import Modal from '../components/ui/Modal'
import Loading from '../components/ui/Loading'
import toast from 'react-hot-toast'
import {
  IoAddOutline,
  IoTrashOutline,
  IoPencilOutline,
  IoSearchOutline,
  IoInformationCircleOutline,
} from 'react-icons/io5'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [form, setForm] = useState({
    name: '',
    category: 'Minuman',
    buy_price: '',
    sell_price: '',
    unit_name: 'dus',
    unit_qty: '',
  })

  useEffect(() => {
    fetch()
  }, [])

  const fetch = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('category')
      .order('name')
    setProducts(data || [])
    setLoading(false)
  }

  const openAdd = () => {
    setEditItem(null)
    setForm({
      name: '',
      category: 'Minuman',
      buy_price: '',
      sell_price: '',
      unit_name: 'dus',
      unit_qty: '',
    })
    setModalOpen(true)
  }

  const openEdit = (p) => {
    setEditItem(p)
    setForm({
      name: p.name,
      category: p.category,
      buy_price: p.buy_price.toString(),
      sell_price: p.sell_price.toString(),
      unit_name: p.unit_name || 'dus',
      unit_qty: (p.unit_qty || 1).toString(),
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const payload = {
      name: form.name.trim(),
      category: form.category,
      buy_price: parseInt(form.buy_price) || 0,
      sell_price: parseInt(form.sell_price) || 0,
      unit_name: form.unit_name,
      unit_qty: parseInt(form.unit_qty) || 1,
      updated_at: new Date().toISOString(),
    }

    try {
      if (editItem) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editItem.id)
        if (error) throw error
        toast.success('Produk berhasil diupdate! ✅')
      } else {
        const { error } = await supabase.from('products').insert(payload)
        if (error) throw error
        toast.success('Produk baru berhasil ditambahkan! ✅')
      }
      setModalOpen(false)
      fetch()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Yakin ingin menghapus produk "${name}"?`)) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) return toast.error(error.message)
    toast.success('Produk berhasil dihapus!')
    fetch()
  }

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = !filterCat || p.category === filterCat
    return matchSearch && matchCat
  })

  const columns = [
    {
      header: '#',
      render: (_, i) => (
        <span className="text-gray-400 text-xs">{i + 1}</span>
      ),
    },
    {
      header: 'Nama Produk',
      render: (r) => <span className="font-semibold">{r.name}</span>,
    },
    {
      header: 'Kategori',
      render: (r) => {
        const s = getCategoryStyle(r.category)
        return (
          <span
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold ${s.bg}`}
          >
            {s.label}
          </span>
        )
      },
    },
    {
      header: 'Satuan Beli',
      render: (r) => {
        const unitName = r.unit_name || 'pcs'
        const unitQty = r.unit_qty || 1
        if (unitName === 'pcs') {
          return (
            <span className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-gray-100 text-gray-600">
              Satuan (pcs)
            </span>
          )
        }
        return (
          <span className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-indigo-100 text-indigo-700">
            1 {unitName} = {unitQty} pcs
          </span>
        )
      },
    },
    {
      header: 'Harga Beli /pcs',
      render: (r) => (
        <span className="text-red-600 text-xs font-medium">
          {formatRupiah(r.buy_price)}
        </span>
      ),
    },
    {
      header: 'Harga Jual /pcs',
      render: (r) => (
        <span className="text-emerald-600 font-semibold">
          {formatRupiah(r.sell_price)}
        </span>
      ),
    },
    {
      header: 'Margin /pcs',
      render: (r) => {
        const margin = (r.sell_price || 0) - (r.buy_price || 0)
        return (
          <span
            className={`text-xs font-semibold ${
              margin >= 0 ? 'text-blue-600' : 'text-red-600'
            }`}
          >
            {formatRupiah(margin)}
          </span>
        )
      },
    },
    {
      header: 'Aksi',
      render: (r) => (
        <div className="flex gap-1.5">
          <button
            onClick={() => openEdit(r)}
            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            title="Edit"
          >
            <IoPencilOutline size={14} />
          </button>
          <button
            onClick={() => handleDelete(r.id, r.name)}
            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            title="Hapus"
          >
            <IoTrashOutline size={14} />
          </button>
        </div>
      ),
    },
  ]

  if (loading) return <Loading />

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            🏷️ Master Data Produk
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {products.length} produk terdaftar
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-emerald-200 text-sm"
        >
          <IoAddOutline size={18} /> Tambah Produk Baru
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start gap-2">
        <IoInformationCircleOutline
          size={18}
          className="text-yellow-600 flex-shrink-0 mt-0.5"
        />
        <p className="text-xs text-yellow-700">
          <span className="font-bold">Info:</span> Halaman ini khusus untuk
          menambahkan produk <span className="font-bold">baru</span> yang belum
          pernah ada di toko. Untuk produk yang sudah ada, langsung input stok
          di halaman{' '}
          <span className="font-bold">"Input Stok"</span> — tidak perlu tambah
          produk di sini lagi.
        </p>
      </div>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <IoSearchOutline
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
        >
          <option value="">Semua Kategori</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        emptyMessage="Produk tidak ditemukan"
      />

      {/* ====== MODAL TAMBAH / EDIT PRODUK ====== */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditItem(null)
        }}
        title={editItem ? '✏️ Edit Produk' : '🆕 Tambah Produk Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nama Produk */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Nama Produk
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              placeholder="cth: Aqua 1500ml, Teh Pucuk 350ml"
              required
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Kategori
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Satuan Beli */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
            <p className="text-sm font-bold text-indigo-700">
              📦 Satuan Pembelian (Master Data)
            </p>
            <p className="text-[11px] text-indigo-500">
              Tentukan bagaimana produk ini dibeli dari supplier. Nanti saat
              input stok, pegawai bisa pilih input per{' '}
              {form.unit_name === 'pcs' ? 'pcs' : `${form.unit_name} atau pcs`}
              .
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Nama Satuan
                </label>
                <select
                  value={form.unit_name}
                  onChange={(e) =>
                    setForm({ ...form, unit_name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="dus">Dus</option>
                  <option value="pack">Pack</option>
                  <option value="karton">Karton</option>
                  <option value="box">Box</option>
                  <option value="bal">Bal</option>
                  <option value="pcs">Pcs (satuan)</option>
                </select>
              </div>
              {form.unit_name !== 'pcs' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Isi per {form.unit_name}
                  </label>
                  <input
                    type="number"
                    value={form.unit_qty}
                    onChange={(e) =>
                      setForm({ ...form, unit_qty: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    required
                    min="1"
                    placeholder="cth: 12"
                  />
                </div>
              )}
            </div>
            {form.unit_qty && form.unit_name !== 'pcs' && (
              <p className="text-xs text-indigo-600 font-medium">
                💡 1 {form.unit_name} ={' '}
                <span className="font-bold">{form.unit_qty} botol/pcs</span>
              </p>
            )}
          </div>

          {/* Harga Beli & Jual per Pcs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Harga Beli /pcs (Rp)
              </label>
              <input
                type="number"
                value={form.buy_price}
                onChange={(e) =>
                  setForm({ ...form, buy_price: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                required
                min="0"
                placeholder="cth: 4000"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Harga modal per 1 botol/pcs
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Harga Jual /pcs (Rp)
              </label>
              <input
                type="number"
                value={form.sell_price}
                onChange={(e) =>
                  setForm({ ...form, sell_price: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                required
                min="0"
                placeholder="cth: 6000"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Harga jual ke pembeli per 1 botol/pcs
              </p>
            </div>
          </div>

          {/* Preview Margin */}
          {form.buy_price && form.sell_price && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
              <div className="flex justify-between text-sm text-blue-700">
                <span>Margin per pcs:</span>
                <span className="font-bold">
                  {formatRupiah(
                    (parseInt(form.sell_price) || 0) -
                      (parseInt(form.buy_price) || 0)
                  )}
                </span>
              </div>
              {form.unit_name !== 'pcs' && form.unit_qty && (
                <div className="flex justify-between text-xs text-blue-500">
                  <span>
                    Margin per {form.unit_name} (×{form.unit_qty}):
                  </span>
                  <span className="font-semibold">
                    {formatRupiah(
                      ((parseInt(form.sell_price) || 0) -
                        (parseInt(form.buy_price) || 0)) *
                        (parseInt(form.unit_qty) || 1)
                    )}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Preview Contoh Input Stok */}
          {form.unit_name !== 'pcs' && form.unit_qty && form.buy_price && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <p className="text-xs font-bold text-gray-600 mb-2">
                📋 Contoh saat Input Stok nanti:
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>
                  • Pegawai beli{' '}
                  <span className="font-bold text-blue-600">
                    2 {form.unit_name}
                  </span>{' '}
                  → Harga per {form.unit_name}:{' '}
                  <span className="font-bold">
                    {formatRupiah(
                      (parseInt(form.buy_price) || 0) *
                        (parseInt(form.unit_qty) || 1)
                    )}
                  </span>
                </p>
                <p>
                  • Sistem otomatis hitung: 2 × {form.unit_qty} ={' '}
                  <span className="font-bold text-emerald-600">
                    {2 * (parseInt(form.unit_qty) || 1)} pcs
                  </span>
                </p>
                <p>
                  • Harga per pcs: {formatRupiah(parseInt(form.buy_price) || 0)}{' '}
                  <span className="text-gray-400">(dari master data)</span>
                </p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setModalOpen(false)
                setEditItem(null)
              }}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-medium text-sm hover:from-emerald-600 hover:to-green-700"
            >
              {editItem ? '💾 Update Produk' : '✅ Simpan Produk'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}