'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function SettingsPage() {
  const [form, setForm]     = useState({ display_name:'', city:'', bio:'', upi_id:'', pan_number:'' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [email, setEmail]   = useState('')
  const [status, setStatus] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email ?? '')
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setStatus(data.status ?? '')
        setForm({
          display_name: data.display_name ?? '',
          city:         data.city ?? '',
          bio:          data.bio ?? '',
          upi_id:       data.upi_id ?? '',
          pan_number:   data.pan_number ?? '',
        })
      }
    }
    load()
  }, [])

  const save = async () => {
    setSaving(true); setSaved(false)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update(form).eq('id', user.id)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const Field = ({ label, id, hint='' }: { label:string; id:keyof typeof form; hint?:string }) => (
    <div style={{ marginBottom:20 }}>
      <label style={{ display:'block', fontSize:11, letterSpacing:'0.1em', color:'#8C867E', textTransform:'uppercase', marginBottom:6 }}>{label}</label>
      <input value={form[id]} onChange={e => setForm(p => ({...p,[id]:e.target.value}))}
        style={{ width:'100%', padding:'11px 14px', border:'0.5px solid rgba(20,18,16,0.2)', fontSize:13, outline:'none', fontFamily:'inherit', color:'#141210', background:'#fff', borderRadius:6 }} />
      {hint && <p style={{ fontSize:11, color:'#C4BEB6', marginTop:4 }}>{hint}</p>}
    </div>
  )

  return (
    <>
      <div style={{ marginBottom:32 }}>
        <p style={{ fontSize:11, letterSpacing:'0.14em', color:'#B07D4A', marginBottom:8, textTransform:'uppercase' }}>Settings</p>
        <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:36, fontWeight:300, color:'#141210' }}>Your profile</h1>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <div style={{ background:'#fff', border:'0.5px solid rgba(20,18,16,0.07)', borderRadius:14, padding:'28px' }}>
          <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:20, fontWeight:300, color:'#141210', marginBottom:24 }}>Profile info</h2>
          <Field label="Display name" id="display_name" />
          <Field label="City" id="city" />
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:11, letterSpacing:'0.1em', color:'#8C867E', textTransform:'uppercase', marginBottom:6 }}>Bio</label>
            <textarea value={form.bio} onChange={e => setForm(p => ({...p,bio:e.target.value}))} rows={4} maxLength={300}
              style={{ width:'100%', padding:'11px 14px', border:'0.5px solid rgba(20,18,16,0.2)', fontSize:13, outline:'none', fontFamily:'inherit', color:'#141210', background:'#fff', borderRadius:6, resize:'vertical' }} />
            <p style={{ fontSize:11, color:'#C4BEB6', marginTop:4 }}>{form.bio.length}/300</p>
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ background:'#fff', border:'0.5px solid rgba(20,18,16,0.07)', borderRadius:14, padding:'28px' }}>
            <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:20, fontWeight:300, color:'#141210', marginBottom:24 }}>Payout details</h2>
            <Field label="UPI ID"     id="upi_id"     hint="Your 80% commission is sent here monthly." />
            <Field label="PAN number" id="pan_number" hint="Required for TDS compliance. Never shared with brands." />
          </div>

          <div style={{ background:'#fff', border:'0.5px solid rgba(20,18,16,0.07)', borderRadius:14, padding:'24px' }}>
            <h3 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:18, fontWeight:300, color:'#141210', marginBottom:12 }}>Account</h3>
            <p style={{ fontSize:12, color:'#8C867E', marginBottom:4 }}>Email: <span style={{ color:'#141210' }}>{email}</span></p>
            <p style={{ fontSize:12, color:'#8C867E' }}>Status: <span style={{ color:'#B07D4A', fontWeight:500 }}>{status === 'approved' ? 'Approved creator' : status}</span></p>
          </div>
        </div>
      </div>

      <div style={{ marginTop:24, display:'flex', alignItems:'center', gap:14 }}>
        <button onClick={save} disabled={saving}
          style={{ padding:'12px 32px', background:'#141210', color:'#fff', border:'none', fontSize:13, cursor:'pointer', borderRadius:100, fontFamily:'inherit', opacity:saving?0.6:1 }}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {saved && <span style={{ fontSize:13, color:'#B07D4A' }}>✓ Saved successfully</span>}
      </div>
    </>
  )
}