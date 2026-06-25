'use client'

import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function PendingPage() {
  const supabase = createClient()
  const router = useRouter()

  return (
    <div style={{ minHeight:'100vh', background:'#F0EDE8', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:'DM Sans, system-ui, sans-serif', textAlign:'center', padding:24 }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet" />
      <div style={{ width:56, height:56, border:'1px solid #8B1A1A', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#8B1A1A', fontSize:22, marginBottom:28 }}>✓</div>
      <p style={{ fontSize:10, letterSpacing:'0.2em', color:'#8B1A1A', marginBottom:12, fontWeight:600 }}>STATUS — UNDER REVIEW</p>
      <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:40, fontWeight:400, color:'#1a1a1a', marginBottom:16, letterSpacing:'-0.02em' }}>Application received.</h1>
      <p style={{ fontSize:14, color:'#888', lineHeight:1.7, maxWidth:360, marginBottom:36 }}>We review every creator application personally. You'll hear from us within 3–5 business days.</p>
      <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
        style={{ padding:'11px 28px', background:'none', border:'1px solid #ccc', fontSize:12, color:'#555', cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.06em' }}>
        Back to CurateKin
      </button>
    </div>
  )
}