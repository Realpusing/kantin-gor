import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  IoHomeOutline,
  IoFastFoodOutline,
  IoCubeOutline,
  IoCartOutline,
  IoStatsChartOutline,
  IoReceiptOutline,
  IoGitCompareOutline,
  IoLogOutOutline,
  IoPersonOutline,
} from 'react-icons/io5'

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const allMenus = [
    { path: '/', icon: IoHomeOutline, label: 'Dashboard', show: true },
    { path: '/products', icon: IoFastFoodOutline, label: 'Kelola Produk', show: isAdmin },
    { path: '/stock-in', icon: IoCubeOutline, label: 'Input Stok', show: true },
    { path: '/sales', icon: IoCartOutline, label: 'Input Penjualan', show: true },
    { path: '/stock-check', icon: IoStatsChartOutline, label: 'Cek Stok', show: true },
    { path: '/sales-report', icon: IoReceiptOutline, label: 'Laporan Penjualan', show: true },
    { path: '/comparison', icon: IoGitCompareOutline, label: 'Perbandingan', show: isAdmin },
  ]

  const menus = allMenus.filter((m) => m.show)

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[270px] bg-white border-r border-gray-100 
        transform transition-transform duration-300 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto flex flex-col`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-emerald-200">
              ⚽
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-800">Kantin GOR</h1>
              <p className="text-[11px] text-gray-400">Sepakbola Management</p>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="p-3 mx-3 mt-3 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center">
              <IoPersonOutline className="text-white" size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-700 truncate">
                {user?.full_name}
              </p>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isAdmin
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-3">
            Menu
          </p>
          <ul className="space-y-0.5">
            {menus.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
                  }
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-red-600 hover:bg-red-50 transition-all"
          >
            <IoLogOutOutline size={18} />
            Keluar
          </button>
        </div>
      </aside>
    </>
  )
}