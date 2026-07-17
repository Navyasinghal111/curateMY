'use client'

import Link from 'next/link'
import { useState } from 'react'

type Creator = {
  id: string
  username: string
  display_name: string
  avatar_url: string
  bio: string
  city?: string
  instagram_handle?: string
  productCount: number
}

export default function CreatorsClient({ creators }: { creators: Creator[] }) {
  const [search, setSearch] = useState('')

  const query = search.trim().replace(/^@/, '').toLowerCase()
  const filtered = creators.filter(c =>
    !query ||
    c.display_name?.toLowerCase().includes(query) ||
    c.username?.toLowerCase().includes(query) ||
    c.instagram_handle?.replace(/^@/, '').toLowerCase().includes(query) ||
    c.city?.toLowerCase().includes(query)
  )

  return (
    <div style={{ background:'#F0EDE8', minHeight:'100vh', fontFamily:'DM Sans, system-ui, sans-serif', color:'#141210' }}>
      <link href="https://fonts.googleapis.com/css2?family=Fanwood+Text:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        .nav{display:flex;align-items:center;justify-content:space-between;padding:20px 48px;border-bottom:0.5px solid rgba(20,18,16,0.08)}
        .logo{display:inline-flex;align-items:baseline;font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-style:italic;font-weight:400;line-height:1;color:#141210;text-decoration:none;white-space:nowrap}
        .logo-word{display:inline-block}
        .logo-kin{color:#7A1028}
        .logo-cap{display:inline-block;font-size:1.18em;line-height:.8}
        .search-input{padding:9px 16px;border:1px solid rgba(20,18,16,0.15);background:#fff;font-size:12px;outline:none;color:#141210;font-family:inherit;width:220px}
        .cgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:20px;max-width:1100px}
        .ccard{background:#fff;border:0.5px solid rgba(20,18,16,0.08);padding:24px;text-decoration:none;color:inherit;display:flex;flex-direction:column;align-items:center;text-align:center;transition:box-shadow 0.2s}
        .ccard:hover{box-shadow:0 8px 28px rgba(20,18,16,0.1)}
        .cavatar{position:relative;width:72px;height:72px;border-radius:50%;background:#E8E4DE;display:flex;align-items:center;justify-content:center;overflow:hidden;margin-bottom:14px;border:1px solid rgba(176,125,74,0.3)}
        .cavatar img{position:relative;z-index:1;width:100%;height:100%;object-fit:cover}
        .cname{font-family:'Fanwood Text',serif;font-size:19px;color:#141210;margin-bottom:4px}
        .cmeta{font-size:11px;color:#8C867E;letter-spacing:0.03em}
        @media (max-width:768px){
          .nav{padding:16px 20px}
          .cgrid{grid-template-columns:repeat(2,1fr);gap:12px}
          .ccard{padding:16px}
        }
      `}</style>

      <nav className="nav">
        <a href="/" className="logo"><span className="logo-word"><span className="logo-cap">C</span>urate</span><span className="logo-word logo-kin"><span className="logo-cap">K</span>in</span></a>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search a name or @Instagram…" className="search-input" />
      </nav>

      <div style={{ padding:'56px 48px 24px' }}>
        <p style={{ fontFamily:'Fanwood Text, serif', fontStyle:'italic', fontSize:16, color:'#8C867E', marginBottom:4 }}>Real people, real taste</p>
        <h1 style={{ fontFamily:'Fanwood Text, serif', fontWeight:300, fontSize:'clamp(40px,5vw,64px)', color:'#141210', marginBottom:8 }}>Curators</h1>
        <p style={{ fontSize:13, color:'#8C867E', maxWidth:420 }}>
          Browse every curator on CurateKin — click through to see what they're wearing, using, and recommending.
        </p>
      </div>

      <div style={{ padding:'0 48px 80px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 20px' }}>
            <p style={{ fontFamily:'Fanwood Text, serif', fontSize:26, color:'#141210', marginBottom:8 }}>
              {creators.length === 0 ? 'The first curators are just getting started.' : 'No curators match that search.'}
            </p>
            <p style={{ fontSize:13, color:'#8C867E' }}>
              {creators.length === 0 ? 'Check back soon, or be the first to apply.' : 'Try a name, CurateKin handle, or Instagram handle.'}
            </p>
          </div>
        ) : (
          <div className="cgrid">
            {filtered.map(c => (
              <Link key={c.id} href={`/${c.username}`} className="ccard">
                <div className="cavatar">
                  <span style={{ position:'absolute', fontFamily:'Fanwood Text, serif', fontStyle:'italic', fontSize:26, color:'#B07D4A' }}>{c.display_name?.[0]?.toUpperCase()}</span>
                  {c.avatar_url && (
                    <img src={c.avatar_url} alt={c.display_name}
                      onError={e => { e.currentTarget.style.display = 'none' }} />
                  )}
                </div>
                <div className="cname">{c.display_name}</div>
                {c.instagram_handle && <div className="cmeta" style={{ marginBottom:3 }}>@{c.instagram_handle.replace(/^@/, '')}</div>}
                <div className="cmeta">{[c.city, `${c.productCount} pieces`].filter(Boolean).join(' · ')}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
