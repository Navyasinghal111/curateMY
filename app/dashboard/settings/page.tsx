'use client'

import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'

type ProfileForm = {
  display_name: string
  username: string
  city: string
  bio: string
  instagram_handle: string
}

const emptyForm: ProfileForm = {
  display_name: '',
  username: '',
  city: '',
  bio: '',
  instagram_handle: '',
}

function cleanUsername(value: string) {
  return value.trim().toLowerCase().replace(/^@+/, '').replace(/[^a-z0-9_]/g, '')
}

export default function SettingsPage() {
  const [form, setForm] = useState<ProfileForm>(emptyForm)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const storefrontPath = form.username ? `/${form.username}` : ''
  const storefrontUrl = typeof window === 'undefined' ? storefrontPath : `${window.location.origin}${storefrontPath}`

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setEmail(user.email ?? '')
      const { data } = await supabase
        .from('profiles')
        .select('display_name, username, city, bio, instagram_handle, avatar_url, status')
        .eq('id', user.id)
        .single()

      if (!data) return
      setStatus(data.status ?? '')
      setAvatar(data.avatar_url ?? null)
      setForm({
        display_name: data.display_name ?? '',
        username: data.username ?? '',
        city: data.city ?? '',
        bio: data.bio ?? '',
        instagram_handle: data.instagram_handle?.replace(/^@+/, '') ?? '',
      })
    }

    load()
  }, [])

  const updateField = (field: keyof ProfileForm, value: string) => {
    setSaved(false)
    setForm(current => ({ ...current, [field]: value }))
  }

  const handleAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file for your profile photo.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Choose an image smaller than 5 MB.')
      return
    }

    setError('')
    setAvatarFile(file)
    setAvatar(URL.createObjectURL(file))
  }

  const copyStorefrontUrl = async () => {
    if (!storefrontUrl) return
    try {
      await navigator.clipboard.writeText(storefrontUrl)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Could not copy the link. Please copy it from the field instead.')
    }
  }

  const save = async () => {
    setSaving(true)
    setSaved(false)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      setError('Your session has ended. Please sign in again.')
      return
    }

    const displayName = form.display_name.trim()
    const username = cleanUsername(form.username)
    const instagramHandle = form.instagram_handle.trim().replace(/^@+/, '')

    if (!displayName) {
      setSaving(false)
      setError('Add the name shoppers should see on your storefront.')
      return
    }
    if (username.length < 3) {
      setSaving(false)
      setError('Your storefront handle needs at least 3 letters, numbers, or underscores.')
      return
    }

    let avatarUrl = avatar
    if (avatarFile) {
      const extension = avatarFile.name.split('.').pop() || 'jpg'
      const path = `avatars/${user.id}.${extension}`
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(path, avatarFile, { upsert: true })

      if (uploadError) {
        setSaving(false)
        setError('Your profile photo could not be uploaded. Nothing else was changed.')
        return
      }

      avatarUrl = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        username,
        city: form.city.trim() || null,
        bio: form.bio.trim() || null,
        instagram_handle: instagramHandle || null,
        avatar_url: avatarUrl,
      })
      .eq('id', user.id)

    if (updateError) {
      setSaving(false)
      setError(updateError.code === '23505' ? 'That storefront handle is already taken.' : 'Your profile could not be saved. Please try again.')
      return
    }

    setForm(current => ({ ...current, display_name: displayName, username, instagram_handle: instagramHandle }))
    setAvatar(avatarUrl)
    setAvatarFile(null)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const initials = form.display_name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2) || 'CK'

  return (
    <>
      <style>{`
        .profile-grid { display:grid; grid-template-columns:minmax(0, 1.15fr) minmax(300px, 0.85fr); gap:20px; }
        .profile-card { background:#fff; border:0.5px solid rgba(20,18,16,0.07); border-radius:12px; padding:28px; }
        .profile-input { width:100%; padding:11px 14px; border:0.5px solid rgba(20,18,16,0.2); font-size:13px; outline:none; font-family:inherit; color:#141210; background:#fff; border-radius:5px; }
        .profile-input:focus { border-color:#B07D4A; box-shadow:0 0 0 3px rgba(176,125,74,0.12); }
        .profile-label { display:block; font-size:11px; letter-spacing:0.1em; color:#8C867E; text-transform:uppercase; margin-bottom:6px; }
        @media (max-width: 780px) {
          .profile-grid { grid-template-columns:1fr; }
          .profile-card { padding:22px 18px; }
          .profile-url-actions { flex-direction:column; align-items:stretch !important; }
        }
      `}</style>

      <div style={{ maxWidth:1040, margin:'0 auto', padding:'40px 32px 56px' }}>
        <div style={{ marginBottom:32 }}>
          <p style={{ fontSize:11, letterSpacing:'0.14em', color:'#B07D4A', marginBottom:8, textTransform:'uppercase' }}>Storefront settings</p>
          <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:40, fontWeight:300, color:'#141210', lineHeight:1 }}>Your public identity</h1>
          <p style={{ marginTop:10, fontSize:13, color:'#8C867E', lineHeight:1.6 }}>These details appear on the storefront shoppers share and browse.</p>
        </div>

        <div className="profile-grid">
          <section className="profile-card">
            <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:24, fontWeight:300, color:'#141210', marginBottom:24 }}>About you</h2>

            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:26 }}>
              <button type="button" onClick={() => fileRef.current?.click()} aria-label="Change profile photo"
                style={{ width:76, height:76, borderRadius:'50%', padding:0, background:'#D4B896', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', flexShrink:0, border:'none' }}>
                {avatar
                  ? <img src={avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:25, fontStyle:'italic', color:'#fff' }}>{initials}</span>}
              </button>
              <div>
                <p style={{ fontSize:13, fontWeight:500, color:'#141210', marginBottom:4 }}>Profile photo</p>
                <p style={{ fontSize:11, color:'#8C867E', lineHeight:1.5, marginBottom:9 }}>A clear portrait helps shoppers recognise your taste.</p>
                <button type="button" onClick={() => fileRef.current?.click()}
                  style={{ fontSize:11, color:'#B07D4A', background:'none', border:'0.5px solid rgba(176,125,74,0.35)', padding:'6px 12px', borderRadius:3, cursor:'pointer', fontFamily:'inherit' }}>
                  Choose photo
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} style={{ display:'none' }} />
            </div>

            <div style={{ marginBottom:20 }}>
              <label className="profile-label" htmlFor="display-name">Display name</label>
              <input id="display-name" className="profile-input" value={form.display_name} onChange={event => updateField('display_name', event.target.value)} placeholder="Your name" maxLength={80} />
            </div>

            <div style={{ marginBottom:20 }}>
              <label className="profile-label" htmlFor="city">City <span style={{ textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
              <input id="city" className="profile-input" value={form.city} onChange={event => updateField('city', event.target.value)} placeholder="Delhi, Mumbai, Bengaluru..." maxLength={80} />
            </div>

            <div style={{ marginBottom:20 }}>
              <label className="profile-label" htmlFor="instagram">Instagram <span style={{ textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:14, top:11, color:'#8C867E', fontSize:13 }}>@</span>
                <input id="instagram" className="profile-input" value={form.instagram_handle} onChange={event => updateField('instagram_handle', event.target.value.replace(/^@+/, ''))} placeholder="yourhandle" maxLength={30} style={{ paddingLeft:28 }} />
              </div>
            </div>

            <div>
              <label className="profile-label" htmlFor="bio">Your curator note <span style={{ textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
              <textarea id="bio" className="profile-input" value={form.bio} onChange={event => updateField('bio', event.target.value)} placeholder="The kind of pieces you look for, and why people trust your eye." rows={5} maxLength={300} style={{ resize:'vertical', lineHeight:1.55 }} />
              <p style={{ fontSize:11, color:'#AAA49C', marginTop:5, textAlign:'right' }}>{form.bio.length}/300</p>
            </div>
          </section>

          <aside style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <section className="profile-card">
              <p style={{ fontSize:11, letterSpacing:'0.12em', color:'#B07D4A', textTransform:'uppercase', marginBottom:8 }}>Your link</p>
              <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:24, fontWeight:300, color:'#141210', marginBottom:8 }}>Storefront address</h2>
              <p style={{ fontSize:12, color:'#8C867E', lineHeight:1.6, marginBottom:18 }}>Choose a simple handle people can type and remember. It uses lowercase letters, numbers, and underscores only.</p>

              <label className="profile-label" htmlFor="username">Handle</label>
              <div style={{ position:'relative', marginBottom:10 }}>
                <span style={{ position:'absolute', left:14, top:11, color:'#8C867E', fontSize:13 }}>curatekin.com/</span>
                <input id="username" className="profile-input" value={form.username} onChange={event => updateField('username', cleanUsername(event.target.value))} placeholder="yourhandle" minLength={3} maxLength={30} style={{ paddingLeft:108 }} />
              </div>

              {storefrontUrl ? (
                <div className="profile-url-actions" style={{ display:'flex', alignItems:'center', gap:10, marginTop:18 }}>
                  <button type="button" onClick={copyStorefrontUrl} style={{ flex:1, padding:'11px 14px', background:'#141210', color:'#fff', border:'none', fontSize:12, cursor:'pointer', borderRadius:3, fontFamily:'inherit', letterSpacing:'0.05em' }}>Copy link</button>
                  <a href={storefrontPath} target="_blank" rel="noopener noreferrer" style={{ padding:'11px 14px', color:'#141210', border:'0.5px solid rgba(20,18,16,0.25)', fontSize:12, borderRadius:3, textDecoration:'none', textAlign:'center' }}>Preview</a>
                </div>
              ) : null}
            </section>

            <section className="profile-card">
              <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:22, fontWeight:300, color:'#141210', marginBottom:14 }}>Account</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', gap:16, alignItems:'baseline' }}>
                  <span style={{ fontSize:12, color:'#8C867E' }}>Email</span>
                  <span style={{ fontSize:12, color:'#141210', textAlign:'right', overflowWrap:'anywhere' }}>{email}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', gap:16, alignItems:'baseline' }}>
                  <span style={{ fontSize:12, color:'#8C867E' }}>Creator status</span>
                  <span style={{ fontSize:12, color: status === 'approved' ? '#4B7B57' : '#B07D4A', fontWeight:500 }}>{status === 'approved' ? 'Approved' : status || 'Pending'}</span>
                </div>
              </div>
            </section>

            <section style={{ padding:'20px 22px', background:'#F1ECE3', border:'0.5px solid rgba(176,125,74,0.16)', borderRadius:12 }}>
              <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:20, color:'#141210', marginBottom:6 }}>Payouts come later</p>
              <p style={{ fontSize:12, color:'#6F685E', lineHeight:1.65 }}>We will ask for payout details only after affiliate tracking and verified earnings are live.</p>
            </section>
          </aside>
        </div>

        <div style={{ marginTop:24, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
          <button type="button" onClick={save} disabled={saving}
            style={{ padding:'12px 28px', background:'#141210', color:'#fff', border:'none', fontSize:13, cursor:saving ? 'wait' : 'pointer', borderRadius:3, fontFamily:'inherit', opacity:saving ? 0.6 : 1 }}>
            {saving ? 'Saving...' : 'Save storefront profile'}
          </button>
          {saved && <span style={{ fontSize:13, color:'#4B7B57' }}>Saved successfully.</span>}
          {error && <span style={{ fontSize:13, color:'#C0392B' }}>{error}</span>}
        </div>
      </div>
    </>
  )
}
