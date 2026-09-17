// src/lib/helpers.js
export const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num || 0)
  }
  
  export const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  
  export const CATEGORIES = [
    { value: 'Air Mineral', label: '💧 Air Mineral', bg: 'bg-sky-100 text-sky-700' },
    { value: 'Minuman', label: '🥤 Minuman Kemasan', bg: 'bg-purple-100 text-purple-700' },
    { value: 'Energi', label: '⚡ Energi & Isotonik', bg: 'bg-yellow-100 text-yellow-700' },
    { value: 'Snack', label: '🍿 Snack', bg: 'bg-orange-100 text-orange-700' },
    { value: 'Kebutuhan', label: '🧻 Kebutuhan', bg: 'bg-green-100 text-green-700' },
  ]
  
  export const getCategoryStyle = (category) => {
    const found = CATEGORIES.find((c) => c.value === category)
    return found || { value: category, label: category, bg: 'bg-gray-100 text-gray-700' }
  }
  
  export const getCategoryIcon = (category) => {
    const icons = {
      'Air Mineral': '💧',
      'Minuman': '🥤',
      'Energi': '⚡',
      'Snack': '🍿',
      'Kebutuhan': '🧻',
    }
    return icons[category] || '📦'
  }
  
  // Konversi total pcs menjadi format "X dus + Y pcs"
  export const formatStockDisplay = (totalPcs, unitName = 'pcs', unitQty = 1) => {
    const total = parseInt(totalPcs) || 0
    const qtyPerUnit = parseInt(unitQty) || 1
  
    if (qtyPerUnit <= 1 || unitName === 'pcs') {
      return `${total} pcs`
    }
  
    const dus = Math.floor(total / qtyPerUnit)
    const sisaPcs = total % qtyPerUnit
  
    if (dus > 0 && sisaPcs > 0) {
      return `${dus} ${unitName} + ${sisaPcs} pcs`
    } else if (dus > 0) {
      return `${dus} ${unitName}`
    } else {
      return `${sisaPcs} pcs`
    }
  }