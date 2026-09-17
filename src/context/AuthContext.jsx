import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('kantin_user')
    if (saved) {
      try {
        setUser(JSON.parse(saved))
      } catch {
        localStorage.removeItem('kantin_user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .eq('password', password)
      .single()

    if (error || !data) {
      throw new Error('Email atau password salah!')
    }

    const userData = {
      id: data.id,
      email: data.email,
      full_name: data.full_name,
      role: data.role,
    }

    setUser(userData)
    localStorage.setItem('kantin_user', JSON.stringify(userData))
    return userData
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('kantin_user')
  }

  const isAdmin = user?.role === 'admin'
  const isPegawai = user?.role === 'pegawai'

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin, isPegawai }}>
      {children}
    </AuthContext.Provider>
  )
}