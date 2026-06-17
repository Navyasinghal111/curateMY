'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

    if (loginError) {
      setError(loginError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#FDFCFA] flex flex-col">

      {/* Nav */}
      <nav className="flex items-center justify-between px-7 h-14 border-b border-[#DDD5C8]">
        <Link href="/" className="font-serif text-[20px] tracking-[0.14em] text-[#1C1814]">
          curatekin<span className="text-[#B89A6E]">.</span>
        </Link>
        <Link href="/signup" className="text-[11px] tracking-[0.08em] text-[#7A736B] hover:text-[#1C1814] transition-colors">
          Create account
        </Link>
      </nav>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <p className="text-[10px] tracking-[0.2em] text-[#B89A6E] mb-3 text-center">WELCOME BACK</p>
          <h1 className="font-serif text-[32px] font-light text-[#1C1814] text-center mb-2">
            Log in
          </h1>
          <p className="text-[12px] text-[#7A736B] text-center mb-8 font-light">
            Good to have you back.
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            {error && (
              <p className="text-[11px] text-red-500 text-center bg-red-50 py-2 px-3 rounded-sm">
                {error}
              </p>
            )}
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-[#DDD5C8] rounded-sm text-[12px] font-light text-[#1C1814] bg-[#FDFCFA] outline-none focus:border-[#B89A6E] transition-colors placeholder:text-[#B0A89E]"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-[#DDD5C8] rounded-sm text-[12px] font-light text-[#1C1814] bg-[#FDFCFA] outline-none focus:border-[#B89A6E] transition-colors placeholder:text-[#B0A89E]"
            />
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-[11px] text-[#7A736B] hover:text-[#1C1814] transition-colors">
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1C1814] text-[#F0EBE2] text-[11px] tracking-[0.1em] rounded-sm hover:bg-[#3D3730] transition-colors mt-1 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <p className="text-[12px] text-[#7A736B] text-center mt-6">
            Don't have an account?{' '}
            <Link href="/signup" className="text-[#1C1814] underline hover:text-[#B89A6E] transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}