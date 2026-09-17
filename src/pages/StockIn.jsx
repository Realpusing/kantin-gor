import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatRupiah, formatDate, getCategoryIcon, formatStockDisplay, CATEGORIES } from '../lib/helpers'
import DataTable from '../components/ui/DataTable'
import Modal from '../components/ui/Modal'
import Loading from '../components/ui/Loading'
import toast from 'react-hot-toast'
import { IoAddOutline, IoTrashOutline, IoChevronDownOutline, IoChevronUpOutline } from 'react-icons/io5'

export default function StockIn() {
  const { user, isAdmin } = useAuth()
  const [records, setRecords] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal Stok
  const [stockModalOpen, setStockModalOpen] = useState(false)
  const [form, setForm] = useState({
    product_id: '',
    qty_unit: '',
    qty_pcs: '',
    price_unit: '',   // harga per dus/kotak
    price_pcs: '',    // harga per pcs eceran
    note: '',
  })

  // Inline Tambah Produk Baru
  const [showNewProduct, setShowNewProduct] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Minuman',
    unit_name: 'dus',
    unit_qty: '',
    buy_price: '',
    sell_price: '',
  })

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const [{ data: recs }, { data: prods }] = await Promise.all([
      supabase
        .from('stock_in')
        .select('*, products(name, category, unit_name, unit_qty), users:created_by(full_name)')
        .order('created_at', { ascending: false }),
      supabase.from('products').select('*').order('category').order('name'),
    ])
    setRecords(recs || [])
    setProducts(prods || [])
    setLoading(false)
  }

  const selectedProduct = products.find((p) => p.id === form.product_id)

  const handleProductChange = (id) => {
    const p = products.find((x) => x.id === id)
    setForm({
      product_id: id,
      qty_unit: '',
      qty_pcs: '',
      price_unit: '',
      price_pcs: p ? p.buy_price.toString() : '',
      note: '',
    })
  }

  // Hitung harga per pcs dari harga per dus
  const getCalculatedPricePerPcs = () => {
    if (!selectedProduct) return 0
    const unitQty = selectedProduct.unit_qty || 1

    if (selectedProduct.unit_name === 'pcs') {
      return parseInt(form.price_pcs) || 0
    }

    // Jika ada harga per dus, hitung per pcs
    if (form.price_unit) {
      return Math.round((parseInt(form.price_unit) || 0) / unitQty)
    }

    return parseInt(form.price_pcs) || 0
  }

  // Total pcs
  const getTotalPcs = () => {
    const dus = parseInt(form.qty_unit) || 0
    const pcs = parseInt(form.qty_pcs) || 0
    const unitQty = selectedProduct?.unit_qty || 1
    return (dus * unitQty) + pcs
  }

  // Simpan Produk Baru (inline)
  const handleSaveNewProduct = async () => {
    if (!newProduct.name.trim() || !newProduct.unit_qty) {
      return toast.error('Lengkapi nama produk dan isi per satuan!')
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: newProduct.name.trim(),
          category: newProduct.category,
          unit_name: newProduct.unit_name,
          unit_qty: parseInt(newProduct.unit_qty) || 1,
          buy_price: parseInt(newProduct.buy_price) || 0,
          sell_price: parseInt(newProduct.sell_price) || 0,
        })
        .select()
        .single()

      if (error) throw error

      toast.success(`Produk "${data.name}" berhasil ditambahkan! ✅`)

      // Refresh daftar produk
      const { data: allProds } = await supabase
        .from('products')
        .select('*')
        .order('category')
        .order('name')
      setProducts(allProds || [])

      // Auto pilih produk baru
      setForm({
        ...form,
        product_id: data.id,
        price_pcs: data.buy_price.toString(),
      })

      // Reset form produk baru
      setShowNewProduct(false)
      setNewProduct({ name: '', category: 'Minuman', unit_name: 'dus', unit_qty: '', buy_price: '', sell_price: '' })
    } catch (err) {
      toast.error(err.message)
    }
  }

  // Simpan Stok Masuk
  const handleSubmitStock = async (e) => {
    e.preventDefault()
    const totalPcs = getTotalPcs()
    const pricePerPcs = getCalculatedPricePerPcs()

    if (totalPcs <= 0) {
      return toast.error('Masukkan jumlah dus atau pcs minimal 1!')
    }
    if (pricePerPcs <= 0) {
      return toast.error('Masukkan harga beli!')
    }

    try {
      const { error } = await supabase.from('stock_in').insert({
        product_id: form.product_id,
        quantity: totalPcs,
        buy_price: pricePerPcs,
        note: form.note || null,
        created_by: user.id,
      })
      if (error) throw error
      toast.success(`Stok masuk ${totalPcs} pcs berhasil! 📦`)
      setStockModalOpen(false)
      setForm({ product_id: '', qty_unit: '', qty_pcs: '', price_unit: '', price_pcs: '', note: '' })
      fetchAll()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus data stok ini?')) return
    const { error } = await supabase.from('stock_in').delete().eq('id', id)
    if (error) return toast.error(error.message)
    toast.success('Data stok dihapus!')
    fetchAll()
  }

  const columns = [
    { header: '#', render: (_, i) => <span className="text-gray-400 text-xs">{i + 1}</span> },
    {
      header: 'Produk',
      render: (r) => (
        <span className="font-semibold">
          {getCategoryIcon(r.products?.category)} {r.products?.name}
        </span>
      ),
    },
    {
      header: 'Jumlah Masuk',
      render: (r) => {
        const unitName = r.products?.unit_name || 'pcs'
        const unitQty = r.products?.unit_qty || 1
        return (
          <div>
            <span className="font-bold text-blue-600">
              {formatStockDisplay(r.quantity, unitName, unitQty)}
            </span>
            {unitName !== 'pcs' && (
              <span className="text-gray-400 text-xs block">= {r.quantity} pcs</span>
            )}
          </div>
        )
      },
    },
    {
      header: 'Harga Beli/pcs',
      render: (r) => <span className="text-xs">{formatRupiah(r.buy_price)}</span>,
    },
    {
      header: 'Total Biaya',
      render: (r) => (
        <span className="font-semibold text-red-600">{formatRupiah(r.total_cost)}</span>
      ),
    },
    { header: 'Catatan', render: (r) => <span className="text-gray-400 text-xs">{r.note || '-'}</span> },
    { header: 'Oleh', render: (r) => <span className="text-xs">{r.users?.full_name || '-'}</span> },
    { header: 'Tanggal', render: (r) => <span className="text-xs text-gray-500">{formatDate(r.created_at)}</span> },
    ...(isAdmin
      ? [
          {
            header: '',
            render: (r) => (
              <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                <IoTrashOutline size={14} />
              </button>
            ),
          },
        ]
      : []),
  ]

  if (loading) return <Loading />

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📦 Input Stok Masuk</h1>
          <p className="text-gray-500 text-sm mt-1">Catat pembelian barang masuk ke kantin</p>
        </div>
        <button
          onClick={() => {
            setForm({ product_id: '', qty_unit: '', qty_pcs: '', price_unit: '', price_pcs: '', note: '' })
            setShowNewProduct(false)
            setStockModalOpen(true)
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-200 text-sm"
        >
          <IoAddOutline size={18} /> Input Stok
        </button>
      </div>

      <DataTable columns={columns} data={records} emptyMessage="Belum ada data stok masuk" />

      {/* ====== MODAL INPUT STOK ====== */}
      <Modal isOpen={stockModalOpen} onClose={() => setStockModalOpen(false)} title="📦 Input Stok Masuk" size="lg">
        <form onSubmit={handleSubmitStock} className="space-y-4">

          {/* PILIH PRODUK */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pilih Produk</label>
            <select
              value={form.product_id}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            >
              <option value="">-- Pilih Produk --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {getCategoryIcon(p.category)} {p.name}
                  {p.unit_name !== 'pcs' ? ` (1 ${p.unit_name} = ${p.unit_qty} pcs)` : ''}
                </option>
              ))}
            </select>

            {/* TOMBOL TAMBAH PRODUK BARU (INLINE) */}
            <button
              type="button"
              onClick={() => setShowNewProduct(!showNewProduct)}
              className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              {showNewProduct ? <IoChevronUpOutline size={14} /> : <IoAddOutline size={14} />}
              {showNewProduct ? 'Tutup Form Produk Baru' : 'Produk belum ada? Tambah baru'}
            </button>
          </div>

          {/* ====== FORM PRODUK BARU (INLINE) ====== */}
          {showNewProduct && (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-bold text-emerald-800">🆕 Tambah Produk Baru</p>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Produk</label>
                <input
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="cth: Sprite 390ml"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Kategori</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Satuan Beli</label>
                  <select
                    value={newProduct.unit_name}
                    onChange={(e) => setNewProduct({ ...newProduct, unit_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="dus">Dus</option>
                    <option value="pack">Pack</option>
                    <option value="karton">Karton</option>
                    <option value="box">Box</option>
                    <option value="bal">Bal</option>
                    <option value="pcs">Pcs (satuan)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {newProduct.unit_name !== 'pcs' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Isi per {newProduct.unit_name}</label>
                    <input
                      type="number"
                      value={newProduct.unit_qty}
                      onChange={(e) => setNewProduct({ ...newProduct, unit_qty: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      placeholder="12"
                      min="1"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Harga Beli/pcs</label>
                  <input
                    type="number"
                    value={newProduct.buy_price}
                    onChange={(e) => setNewProduct({ ...newProduct, buy_price: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="4000"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Harga Jual/pcs</label>
                  <input
                    type="number"
                    value={newProduct.sell_price}
                    onChange={(e) => setNewProduct({ ...newProduct, sell_price: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="6000"
                    min="0"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveNewProduct}
                className="w-full py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700"
              >
                ✅ Simpan Produk Baru & Pilih Otomatis
              </button>
            </div>
          )}

          {/* ====== INPUT JUMLAH & HARGA ====== */}
          {selectedProduct && (
            <>
              {/* Info Master */}
              {selectedProduct.unit_name !== 'pcs' && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-700">
                  💡 <span className="font-bold">1 {selectedProduct.unit_name} = {selectedProduct.unit_qty} pcs</span>
                  {' | '}Harga jual/pcs: <span className="font-bold">{formatRupiah(selectedProduct.sell_price)}</span>
                </div>
              )}

              {/* INPUT DUS */}
              {selectedProduct.unit_name !== 'pcs' && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                    📦 Input per {selectedProduct.unit_name.toUpperCase()}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Jumlah {selectedProduct.unit_name}
                      </label>
                      <input
                        type="number"
                        value={form.qty_unit}
                        onChange={(e) => setForm({ ...form, qty_unit: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Harga per {selectedProduct.unit_name} (Rp)
                      </label>
                      <input
                        type="number"
                        value={form.price_unit}
                        onChange={(e) => setForm({ ...form, price_unit: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Kalkulasi harga per pcs dari dus */}
                  {form.price_unit && parseInt(form.price_unit) > 0 && (
                    <div className="p-2 bg-white rounded-lg text-xs text-blue-700 flex justify-between">
                      <span>Harga per pcs otomatis:</span>
                      <span className="font-bold">
                        {formatRupiah(parseInt(form.price_unit))} ÷ {selectedProduct.unit_qty} = {formatRupiah(getCalculatedPricePerPcs())}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* INPUT PCS ECERAN */}
              <div className={`border rounded-2xl p-4 space-y-3 ${
                selectedProduct.unit_name !== 'pcs'
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <p className="text-xs font-bold text-orange-700 uppercase tracking-wider">
                  🔢 Input Eceran (per Pcs/Botol)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Jumlah Pcs</label>
                    <input
                      type="number"
                      value={form.qty_pcs}
                      onChange={(e) => setForm({ ...form, qty_pcs: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
                      min="0"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Harga per Pcs (Rp)</label>
                    <input
                      type="number"
                      value={form.price_pcs}
                      onChange={(e) => setForm({ ...form, price_pcs: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
                      min="0"
                      placeholder="0"
                      readOnly={selectedProduct.unit_name !== 'pcs' && !!form.price_unit}
                    />
                    {selectedProduct.unit_name !== 'pcs' && form.price_unit && (
                      <p className="text-[10px] text-gray-400 mt-1">Otomatis dari harga {selectedProduct.unit_name}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* RINGKASAN TOTAL */}
              {getTotalPcs() > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">📋 Ringkasan</p>

                  {form.qty_unit && selectedProduct.unit_name !== 'pcs' && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{form.qty_unit} {selectedProduct.unit_name} × {selectedProduct.unit_qty} pcs</span>
                      <span className="font-medium">= {(parseInt(form.qty_unit) || 0) * (selectedProduct.unit_qty || 1)} pcs</span>
                    </div>
                  )}

                  {form.qty_pcs && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Eceran</span>
                      <span className="font-medium">= {form.qty_pcs} pcs</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm font-bold text-gray-800 border-t border-gray-300 pt-2">
                    <span>Total Masuk:</span>
                    <span className="text-blue-600">{getTotalPcs()} pcs</span>
                  </div>

                  <div className="flex justify-between text-sm font-bold text-gray-800">
                    <span>Harga per pcs:</span>
                    <span className="text-emerald-600">{formatRupiah(getCalculatedPricePerPcs())}</span>
                  </div>

                  <div className="flex justify-between text-base font-bold text-red-700 border-t border-gray-300 pt-2">
                    <span>Total Pengeluaran:</span>
                    <span>{formatRupiah(getTotalPcs() * getCalculatedPricePerPcs())}</span>
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Catatan (opsional)</label>
            <input
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="cth: Beli dari distributor ABC"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setStockModalOpen(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-600 text-sm">
              Batal
            </button>
            <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium text-sm">
              💾 Simpan Stok
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}