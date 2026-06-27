'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'

export default function SettingsPage() {
  const [form, setForm] = useState({
    display_name: '',
    city: '',
    bio: '',
    upi_id: '',
    pan_number: '',
    instagram_handle: '',
  })
  const [avatar, setAvatar]     = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState('')
  const [email, setEmail]       = useState('')
  const [status, setStatus]     = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email ?? '')
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setStatus(data.status ?? '')
        setAvatar(data.avatar_url ?? null)
        setForm({
          display_name:     data.display_name ?? '',
          city:             data.city ?? '',
          bio:              data.bio ?? '',
          upi_id:           data.upi_id ?? '',
          pan_number:       data.pan_number ?? '',
          instagram_handle: data.instagram_handle ?? '',
        })
      }
    }
    load()
  }, [])

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatar(URL.createObjectURL(file))
  }

  const save = async () => {
    setSaving(true); setSaved(false); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let avatarUrl = avatar

    // Upload avatar if changed
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `avatars/${user.id}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('product-images')
        .upload(path, avatarFile, { upsert: true })
      if (!uploadErr) {
        const { data } = supabase.storage.from('product-images').getPublicUrl(path)
        avatarUrl = data.publicUrl
      }
    }

    const { error: err } = await supabase.from('profiles').update({
      ...form,
      avatar_url: avatarUrl,
    }).eq('id', user.id)

    if (err) { setError(err.message); setSaving(false); return }
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const F = ({ label, id, type='text', placeholder='', hint='' }: {
    label: string; id: keyof typeof form; type?: string; placeholder?: string; hint?: string
  }) => (
    <div style={{ marginBottom:20 }}>
      <label style={{ display:'block', fontSize:11, letterSpacing:'0.1em', color:'#8C867E', textTransform:'uppercase', marginBottom:6 }}>{label}</label>
      <input
        type={type}
        value={form[id]}
        onChange={e => setForm(p => ({...p, [id]: e.target.value}))}
        placeholder={placeholder}
        style={{ width:'100%', padding:'11px 14px', border:'0.5px solid rgba(20,18,16,0.2)', fontSize:13, outline:'none', fontFamily:'inherit', color:'#141210', background:'#fff', borderRadius:6 }}
      />
      {hint && <p style={{ fontSize:11, color:'#C4BEB6', marginTop:4 }}>{hint}</p>}
    </div>
  )

  const initials = form.display_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) ?? 'CK'

  return (
    <>
      <div style={{ marginBottom:32 }}>
        <p style={{ fontSize:11, letterSpacing:'0.14em', color:'#B07D4A', marginBottom:8, textTransform:'uppercase' }}>Settings</p>
        <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:36, fontWeight:300, color:'#141210' }}>Your profile</h1>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

        {/* Left — profile */}
        <div style={{ background:'#fff', border:'0.5px solid rgba(20,18,16,0.07)', borderRadius:14, padding:'28px' }}>
          <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:20, fontWeight:300, color:'#141210', marginBottom:24 }}>Profile info</h2>

          {/* Avatar */}
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24 }}>
            <div
              onClick={() => fileRef.current?.click()}
              style={{ width:72, height:72, borderRadius:'50%', background:'#D4B896', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', flexShrink:0, position:'relative' }}>
              {avatar
                ? <img src={avatar} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:24, fontStyle:'italic', color:'#fff' }}>{initials}</span>
              }
              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center', opacity:0, transition:'opacity 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity='1')}
                onMouseLeave={e => (e.currentTarget.style.opacity='0')}>
                <span style={{ fontSize:11, color:'#fff', letterSpacing:'0.06em' }}>EDIT</span>
              </div>
            </div>
            <div>
              <p style={{ fontSize:13, fontWeight:500, color:'#141210', marginBottom:4 }}>Profile photo</p>
              <p style={{ fontSize:11, color:'#C4BEB6', marginBottom:8 }}>Click to upload. Shown on your storefront.</p>
              <button onClick={() => fileRef.current?.click()}
                style={{ fontSize:11, color:'#B07D4A', background:'none', border:'0.5px solid rgba(176,125,74,0.3)', padding:'5px 12px', borderRadius:100, cursor:'pointer', fontFamily:'inherit' }}>
                Change photo
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} style={{ display:'none' }} />
          </div>

          <F label="Display name"      id="display_name"     placeholder="Navya Singhal" />
          <F label="City"              id="city"             placeholder="Delhi, Mumbai, Bangalore…" />
          <F label="Instagram handle"  id="instagram_handle" placeholder="@navyasinghal" />

          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:11, letterSpacing:'0.1em', color:'#8C867E', textTransform:'uppercase', marginBottom:6 }}>Bio</label>
            <textarea
              value={form.bio}
              onChange={e => setForm(p => ({...p, bio:e.target.value}))}
              placeholder="Tell shoppers what you love to curate…"
              rows={4}
              maxLength={300}
              style={{ width:'100%', padding:'11px 14px', border:'0.5px solid rgba(20,18,16,0.2)', fontSize:13, outline:'none', fontFamily:'inherit', color:'#141210', background:'#fff', borderRadius:6, resize:'vertical' }}
            />
            <p style={{ fontSize:11, color:'#C4BEB6', marginTop:4 }}>{form.bio.length}/300</p>
          </div>
        </div>

        {/* Right — payouts + account */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Payouts */}
          <div style={{ background:'#fff', border:'0.5px solid rgba(20,18,16,0.07)', borderRadius:14, padding:'28px' }}>
            <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:20, fontWeight:300, color:'#141210', marginBottom:24 }}>Payout details</h2>
            <F label="UPI ID"     id="upi_id"     placeholder="yourname@upi"  hint="Your 80% commission is sent here monthly." />
            <F label="PAN number" id="pan_number" placeholder="ABCDE1234F"    hint="Required for TDS. Never shared with brands." />
          </div>

          {/* Account info */}
          <div style={{ background:'#fff', border:'0.5px solid rgba(20,18,16,0.07)', borderRadius:14, padding:'24px' }}>
            <h3 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:18, fontWeight:300, color:'#141210', marginBottom:16 }}>Account</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:12, color:'#8C867E' }}>Email</span>
                <span style={{ fontSize:12, color:'#141210' }}>{email}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:12, color:'#8C867E' }}>Status</span>
                <span style={{ fontSize:12, color:'#B07D4A', fontWeight:500 }}>
                  {status === 'approved' ? '✓ Approved creator' : status}
                </span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:12, color:'#8C867E' }}>Storefront</span>
                <a href={`/${form.display_name?.toLowerCase().replace(/\s/g,'') || 'navya'}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontSize:12, color:'#B07D4A', textDecoration:'none' }}>
                  View →
                </a>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div style={{ background:'#fff', border:'0.5px solid rgba(20,18,16,0.07)', borderRadius:14, padding:'24px' }}>
            <h3 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:18, fontWeight:300, color:'#141210', marginBottom:8 }}>Storefront URL</h3>
            <p style={{ fontSize:12, color:'#8C867E', marginBottom:12 }}>Your public link:</p>
            <div style={{ padding:'10px 14px', background:'#F4F2EE', borderRadius:8, fontSize:13, color:'#141210', fontWeight:500 }}>
              curatekin.com/navya
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      <div style={{ marginTop:24, display:'flex', alignItems:'center', gap:14 }}>
        <button onClick={save} disabled={saving}
          style={{ padding:'12px 32px', background:'#141210', color:'#fff', border:'none', fontSize:13, cursor:'pointer', borderRadius:100, fontFamily:'inherit', opacity:saving?0.6:1 }}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {saved && <span style={{ fontSize:13, color:'#B07D4A' }}>✓ Saved successfully</span>}
        {error && <span style={{ fontSize:13, color:'#c0392b' }}>{error}</span>}
      </div>
    </>
  )
}