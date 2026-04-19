// @ts-nocheck
import { useState, useEffect, useRef } from "react"

// ── Supabase ──────────────────────────────────────────────────────────────────
const SB_URL = 'https://ybnafhfijzzcqmakfzy.supabase.co'
const SB_KEY = 'sb_publishable_aGXQOsctLaGUN_bcE5bpNg_F8IoP_kr'
const SB_H = { 'apikey':SB_KEY, 'Authorization':`Bearer ${SB_KEY}`, 'Content-Type':'application/json' }

async function sbLoad() {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/crm_data?id=eq.groupe-opera&select=data`, { headers: SB_H })
    const rows = await res.json()
    return rows?.[0]?.data || null
  } catch(e) { return null }
}

async function sbSave(data) {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/crm_data`, {
      method: 'POST',
      headers: { ...SB_H, 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({ id: 'groupe-opera', data, updated_at: new Date().toISOString() })
    })
    return res.ok
  } catch(e) { return false }
}

const STAGES = ['lead','rdv','r1','recherche','rdv2','r2','closing']
const STAGE_LABEL = { lead:'Lead détecté', rdv:'RDV proposé', r1:'R1 Découverte', recherche:'Recherche', rdv2:'RDV R2 proposé', r2:'R2 Solution', closing:'R2 Lot / Suivi' }
const STAGE_COLOR = { lead:'#888780', rdv:'#378ADD', r1:'#1D9E75', recherche:'#BA7517', rdv2:'#5DCAA5', r2:'#7F77DD', closing:'#639922' }
const NEXT_STAGE  = { lead:'rdv', rdv:'r1', r1:'recherche', recherche:'rdv2', rdv2:'r2', r2:'closing', closing:null }
const NEXT_LABEL  = { lead:'→ Proposer RDV', rdv:'→ R1 Découverte', r1:'→ Recherche', recherche:'→ RDV R2', rdv2:'→ R2 Solution', r2:'→ Closing', closing:null }
const PREV_STAGE  = { lead:null, rdv:'lead', r1:'rdv', recherche:'r1', rdv2:'recherche', r2:'rdv2', closing:'r2' }
const PREV_LABEL  = { rdv:'← Lead', r1:'← RDV', recherche:'← R1', rdv2:'← Recherche', r2:'← RDV R2', closing:'← R2 Solution' }
const ORIGINES = ['Instagram','WhatsApp','Facebook','TikTok','LinkedIn','YouTube','Réseau','Recommandation','Autre']
const AVATAR_PALETTES = [['#B5D4F4','#0C447C'],['#9FE1CB','#085041'],['#FAC775','#633806'],['#AFA9EC','#3C3489'],['#C0DD97','#27500A'],['#F5C4B3','#712B13'],['#F4C0D1','#72243E'],['#D3D1C7','#444441']]
const c = {bg:'#F8F8F6',surface:'#FFFFFF',border:'rgba(0,0,0,0.1)',borderMd:'rgba(0,0,0,0.18)',text:'#1a1a18',textSec:'#6b6b67',textTer:'#999994',overdue:'#E24B4A',overdueLight:'#FCEBEB',overdueText:'#A32D2D',soon:'#EF9F27',soonLight:'#FAEEDA',soonText:'#854F0B',ok:'#1D9E75',okLight:'#EAF5EE',okText:'#085041',amber:'#BA7517',amberLight:'#FAEEDA'}

const todayDate = () => { const d=new Date(); d.setHours(0,0,0,0); return d }
const localISO = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
const isoOffset = n => { const d=todayDate(); d.setDate(d.getDate()+n); return localISO(d) }
const fmtDate = s => { if(!s) return ''; const d=new Date(s+'T12:00:00'); return d.toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'}) }
const diffDays = s => { if(!s) return null; const d=new Date(s+'T12:00:00'); d.setHours(0,0,0,0); return Math.round((d-todayDate())/86400000) }
const initials = n => n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)
const avatarColor = n => AVATAR_PALETTES[Math.abs(n.charCodeAt(0)-65)%AVATAR_PALETTES.length]
const uid = () => Math.random().toString(36).slice(2)
const rdvStatus = (p,warnDays) => { if(!p.relanceDate) return 'ok'; const d=diffDays(p.relanceDate); if(d<0) return 'overdue'; if(d<=warnDays) return 'soon'; return 'ok' }
const pill = s => s==='overdue'?{bg:c.overdueLight,color:c.overdueText}:s==='soon'?{bg:c.soonLight,color:c.soonText}:{bg:c.okLight,color:c.okText}
const tagStyle = s => ({fontSize:9,padding:'2px 6px',borderRadius:6,fontWeight:600,background:s==='overdue'?c.overdueLight:s==='soon'?c.soonLight:'rgba(0,0,0,0.06)',color:s==='overdue'?c.overdueText:s==='soon'?c.soonText:c.textSec})

const SEED = []

function Avatar({ name, size=24, outline=false }) {
  const [bg, fg] = avatarColor(name)
  return <div style={{width:size,height:size,borderRadius:'50%',background:bg,color:fg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.36,fontWeight:600,flexShrink:0,outline:outline?`2px solid ${c.amberLight}`:undefined,outlineOffset:outline?2:undefined}}>{initials(name)}</div>
}

function OrigineTag({ origine }) {
  const colors = {Instagram:{bg:'#FBEAF0',color:'#993556'},WhatsApp:{bg:'#EAF3DE',color:'#3B6D11'},Facebook:{bg:'#E6F1FB',color:'#0C447C'},TikTok:{bg:'#F1EFE8',color:'#2C2C2A'},LinkedIn:{bg:'#E6F1FB',color:'#185FA5'},YouTube:{bg:'#FCEBEB',color:'#A32D2D'},Réseau:{bg:'#EEEDFE',color:'#3C3489'},Recommandation:{bg:'#FAEEDA',color:'#854F0B'},Autre:{bg:'rgba(0,0,0,0.06)',color:'#6b6b67'}}
  const s = colors[origine] || colors['Autre']
  return <span style={{fontSize:9,padding:'2px 6px',borderRadius:6,fontWeight:600,background:s.bg,color:s.color,whiteSpace:'nowrap'}}>{origine||'—'}</span>
}

function RdvCard({ p, selectedId, setSelectedId, settings }) {
  const status = rdvStatus(p, settings.warnDays)
  const days = p.relanceDate ? diffDays(p.relanceDate) : null
  const isSelected = selectedId === p.id
  const pillStyle = pill(status)
  const borderLeft = status==='overdue'?`3px solid ${c.overdue}`:status==='soon'?`3px solid ${c.soon}`:`3px solid ${c.ok}`
  return (
    <div onClick={() => setSelectedId(p.id)} style={{background:status==='overdue'?c.overdueLight:c.surface,border:`0.5px solid ${isSelected?c.text:status==='soon'?c.soon:c.border}`,borderLeft,borderRadius:8,padding:'9px 10px',cursor:'pointer',marginBottom:7}}>
      <div style={{display:'flex',gap:7,alignItems:'flex-start',marginBottom:6}}>
        <Avatar name={p.name} size={22} />
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:11,fontWeight:600,color:c.text,lineHeight:1.2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.name}</div>
          <div style={{marginTop:2}}><OrigineTag origine={p.origine} /></div>
        </div>
      </div>
      {p.relanceDate && <div style={{background:status==='overdue'?'rgba(226,75,74,0.12)':status==='soon'?c.soonLight:'rgba(0,0,0,0.04)',borderRadius:5,padding:'5px 8px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:4,marginBottom:6}}>
        <div>
          <div style={{fontSize:8,fontWeight:600,color:c.textTer,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:1}}>Relance prévue</div>
          <div style={{fontSize:11,fontWeight:600,color:status==='overdue'?c.overdueText:status==='soon'?c.soonText:c.text}}>{fmtDate(p.relanceDate)}</div>
        </div>
        <div style={{fontSize:9,fontWeight:600,padding:'2px 6px',borderRadius:6,...pillStyle}}>{days<0?`Retard ${Math.abs(days)} j`:days===0?"Aujourd'hui !":days>=60?`~${Math.round(days/30)} mois`:`Dans ${days} j`}</div>
      </div>}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:4}}>
        <span style={tagStyle(status)}>{p.tag}</span>
        {p.relanceCustom && <span style={{fontSize:8,color:c.textTer}}>Perso.</span>}
      </div>
    </div>
  )
}

function ProspectCard({ p, selectedId, setSelectedId, isRecherche=false }) {
  const isSelected = selectedId === p.id
  const tagColors = {'Urgent':{bg:c.overdueLight,color:c.overdueText},'Suivi actif':{bg:c.okLight,color:c.okText},'En closing':{bg:c.okLight,color:c.okText},'→ Partenaire':{bg:c.amberLight,color:c.amber}}
  const tc = tagColors[p.tag] || {bg:'rgba(0,0,0,0.06)',color:c.textSec}
  return (
    <div onClick={() => setSelectedId(p.id)} style={{background:c.surface,border:`0.5px solid ${isSelected?c.text:c.border}`,borderLeft:isRecherche?`3px solid ${c.amber}`:p.isPartenaire?`3px solid ${c.amber}`:`3px solid ${STAGE_COLOR[p.stage]||c.border}`,borderRadius:8,padding:'9px 10px',cursor:'pointer',marginBottom:7}}>
      <div style={{display:'flex',gap:7,alignItems:'flex-start',marginBottom:6}}>
        <Avatar name={p.name} size={22} outline={isRecherche} />
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:11,fontWeight:600,color:c.text,lineHeight:1.2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.name}</div>
          <div style={{marginTop:2}}><OrigineTag origine={p.origine} /></div>
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:4}}>
        <span style={{fontSize:9,padding:'2px 6px',borderRadius:6,fontWeight:600,background:tc.bg,color:tc.color,whiteSpace:'nowrap'}}>{p.tag||p.format||'—'}</span>
        <span style={{fontSize:9,color:c.textTer}}>{fmtDate(p.createdAt)?.replace(` ${new Date().getFullYear()}`,'')}</span>
      </div>
    </div>
  )
}

function ColHeader({ stage, count, extra }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:6,position:'relative'}}>
      <span style={{width:7,height:7,borderRadius:'50%',background:STAGE_COLOR[stage],flexShrink:0,display:'inline-block'}} />
      <span style={{fontSize:11,fontWeight:600,color:c.text,flex:1,lineHeight:1.2}}>{STAGE_LABEL[stage]}</span>
      {extra}
      <span style={{fontSize:10,color:c.textSec,background:'rgba(0,0,0,0.06)',borderRadius:8,padding:'1px 5px',flexShrink:0}}>{count}</span>
    </div>
  )
}

function DetailPanel({ sel, settings, update, moveStage, doAbandon, doPartenaire, sendRelance, deleteProspect }) {
  const [newRelance, setNewRelance] = useState('')
  const [editRelance, setEditRelance] = useState(false)

  useEffect(() => {
    setNewRelance(sel?.relanceDate || '')
    setEditRelance(false)
  }, [sel?.id])

  if (!sel) return (
    <div style={{width:196,background:c.surface,borderLeft:`0.5px solid ${c.border}`,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{fontSize:11,color:c.textTer,textAlign:'center',padding:16}}>Sélectionnez un prospect</div>
    </div>
  )

  const p = sel
  const status = (p.stage==='rdv' || p.stage==='rdv2') ? rdvStatus(p, settings.warnDays) : null
  const days = (p.stage==='rdv' || p.stage==='rdv2') && p.relanceDate ? diffDays(p.relanceDate) : null
  const [bg, fg] = avatarColor(p.name)
  const nextSt = NEXT_STAGE[p.stage]

  const applyRelance = () => {
    if (!newRelance) return
    update(p.id, {relanceDate:newRelance, relanceCustom:true, timeline:[{date:isoOffset(0),text:`Date modifiée → ${fmtDate(newRelance)}`},...p.timeline]})
    setEditRelance(false)
  }

  return (
    <div style={{width:196,background:c.surface,borderLeft:`0.5px solid ${c.border}`,display:'flex',flexDirection:'column',flexShrink:0,overflow:'hidden'}}>
      <div style={{padding:'12px 12px 10px',borderBottom:`0.5px solid ${c.border}`}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
          <div style={{width:34,height:34,borderRadius:'50%',background:bg,color:fg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:600,flexShrink:0}}>{initials(p.name)}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,color:c.text,lineHeight:1.2}}>{p.name}</div>
            <div style={{marginTop:3}}><OrigineTag origine={p.origine} /></div>
          </div>
        </div>
        <div style={{display:'inline-flex',alignItems:'center',gap:4,background:'rgba(0,0,0,0.05)',borderRadius:10,padding:'3px 8px',fontSize:9,color:c.textSec}}>
          <span style={{width:5,height:5,borderRadius:'50%',background:STAGE_COLOR[p.stage],display:'inline-block'}} />
          {STAGE_LABEL[p.stage]}
        </div>
      </div>

      <div style={{flex:1,overflow:'auto',padding:'10px 12px'}}>
        {(p.stage==='rdv' || p.stage==='rdv2') && <div style={{marginBottom:12}}>
          <div style={{fontSize:9,fontWeight:600,color:c.textTer,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:5}}>Relance</div>
          <div style={{background:status==='overdue'?c.overdueLight:status==='soon'?c.soonLight:'rgba(0,0,0,0.04)',borderRadius:6,padding:'7px 8px',marginBottom:5}}>
            <div style={{fontSize:8,color:c.textTer,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:3}}>Date prévue</div>
            <div style={{fontSize:12,fontWeight:600,marginBottom:2,color:status==='overdue'?c.overdueText:status==='soon'?c.soonText:c.text}}>{p.relanceDate?fmtDate(p.relanceDate):'Non définie'}</div>
            {days!==null && <div style={{fontSize:9,color:status==='overdue'?c.overdueText:status==='soon'?c.soonText:c.textSec}}>{days<0?`En retard de ${Math.abs(days)} j`:days===0?"Aujourd'hui !":days>=60?`Dans ~${Math.round(days/30)} mois`:`Dans ${days} j`}</div>}
          </div>
          {!editRelance
            ? <button onClick={()=>setEditRelance(true)} style={{width:'100%',padding:'5px',background:'transparent',border:`0.5px solid ${c.border}`,borderRadius:6,fontSize:10,color:c.textSec,cursor:'pointer',fontFamily:'inherit',marginBottom:4}}>Modifier la date</button>
            : <div>
                <input type="date" value={newRelance} onChange={e=>setNewRelance(e.target.value)} style={{width:'100%',background:'rgba(0,0,0,0.04)',border:`0.5px solid ${c.borderMd}`,borderRadius:6,padding:'4px 6px',fontSize:10,fontFamily:'inherit',color:c.text,marginBottom:4}} />
                <div style={{display:'flex',gap:4}}>
                  <button onClick={()=>setEditRelance(false)} style={{flex:1,padding:'4px',background:'transparent',border:`0.5px solid ${c.border}`,borderRadius:5,fontSize:9,cursor:'pointer',fontFamily:'inherit',color:c.textSec}}>Annuler</button>
                  <button onClick={applyRelance} style={{flex:1,padding:'4px',background:c.text,border:'none',borderRadius:5,fontSize:9,cursor:'pointer',fontFamily:'inherit',color:'#fff',fontWeight:600}}>Confirmer</button>
                </div>
              </div>}
          <button onClick={()=>sendRelance(p)} style={{width:'100%',padding:'5px',background:c.amberLight,border:`0.5px solid rgba(186,117,23,0.3)`,borderRadius:6,fontSize:10,color:c.amber,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>
            Marquer relance envoyée x{(p.relanceCount||0)+1}
          </button>
        </div>}

        <div style={{marginBottom:10}}>
          <div style={{fontSize:9,fontWeight:600,color:c.textTer,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:5}}>Informations</div>
          {p.budget && <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}><span style={{fontSize:10,color:c.textSec}}>Budget</span><span style={{fontSize:10,color:c.text,fontWeight:600}}>{p.budget}</span></div>}
          {p.format && <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}><span style={{fontSize:10,color:c.textSec}}>Format R1</span><span style={{fontSize:10,color:c.text,fontWeight:600}}>{p.format}</span></div>}
          {p.email && <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}><span style={{fontSize:10,color:c.textSec}}>Email</span><span style={{fontSize:10,color:c.text,fontWeight:600}}>{p.email}</span></div>}
          {p.phone && <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}><span style={{fontSize:10,color:c.textSec}}>Tél.</span><span style={{fontSize:10,color:c.text,fontWeight:600}}>{p.phone}</span></div>}
        </div>

        <div style={{marginBottom:10}}>
          <div style={{fontSize:9,fontWeight:600,color:c.textTer,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:5}}>Notes</div>
          <textarea
            value={p.notes||''}
            onChange={e => update(p.id,{notes:e.target.value})}
            placeholder="Ajouter une note…"
            rows={3}
            style={{width:'100%',fontSize:10,color:c.text,lineHeight:1.5,background:'rgba(0,0,0,0.03)',border:`0.5px solid ${c.border}`,borderRadius:5,padding:'5px 7px',resize:'vertical',fontFamily:'inherit',outline:'none'}}
          />
        </div>

        <div>
          <div style={{fontSize:9,fontWeight:600,color:c.textTer,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6}}>Chronologie</div>
          {p.timeline?.slice(0,5).map((t,i) => (
            <div key={i} style={{display:'flex',gap:6,marginBottom:7}}>
              <div style={{width:5,height:5,borderRadius:'50%',flexShrink:0,marginTop:3,background:i===0?STAGE_COLOR[p.stage]:'rgba(0,0,0,0.2)'}} />
              <div>
                <div style={{fontSize:10,color:c.text,lineHeight:1.3}}>{t.text}</div>
                <div style={{fontSize:9,color:c.textTer}}>{fmtDate(t.date)}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{marginTop:10,display:'flex',gap:5,flexWrap:'wrap'}}>
          {!p.isPartenaire && p.stage!=='closing' && <button onClick={()=>doPartenaire(p.id)} style={{flex:1,padding:'4px 6px',background:c.amberLight,border:`0.5px solid rgba(186,117,23,0.3)`,borderRadius:5,fontSize:9,color:c.amber,cursor:'pointer',fontFamily:'inherit',fontWeight:600,whiteSpace:'nowrap'}}>→ Partenaire</button>}
          {p.stage!=='abandon' && <button onClick={()=>doAbandon(p.id)} style={{flex:1,padding:'4px 6px',background:c.overdueLight,border:`0.5px solid rgba(226,75,74,0.3)`,borderRadius:5,fontSize:9,color:c.overdueText,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>Archiver</button>}
          <button onClick={()=>deleteProspect(p.id)} style={{flex:1,padding:'4px 6px',background:'rgba(226,75,74,0.06)',border:`0.5px solid rgba(226,75,74,0.35)`,borderRadius:5,fontSize:9,color:c.overdueText,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>Supprimer</button>
        </div>
      </div>

      <div style={{padding:'9px 12px',borderTop:`0.5px solid ${c.border}`,display:'flex',gap:5,flexShrink:0}}>
        {PREV_STAGE[p.stage]
          ? <button onClick={()=>moveStage(p.id,PREV_STAGE[p.stage])} style={{flex:1,padding:'6px 0',border:`0.5px solid ${c.border}`,borderRadius:6,background:'transparent',fontSize:9,color:c.textSec,cursor:'pointer',fontFamily:'inherit'}}>{PREV_LABEL[p.stage]}</button>
          : <div style={{flex:1}} />}
        {nextSt && <button onClick={()=>moveStage(p.id,nextSt)} style={{flex:1,padding:'6px 0',background:c.text,border:'none',borderRadius:6,fontSize:9,color:'#fff',cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>{NEXT_LABEL[p.stage]}</button>}
      </div>
    </div>
  )
}

function AddModal({ newP, setNewP, onClose, onSubmit, settings }) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.35)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
      <div style={{background:c.surface,borderRadius:12,padding:20,width:320,maxHeight:'80vh',overflow:'auto',border:`0.5px solid ${c.border}`}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:600,color:c.text}}>Nouveau prospect</div>
          <button onClick={onClose} style={{background:'transparent',border:'none',fontSize:16,cursor:'pointer',color:c.textSec}}>x</button>
        </div>
        {[['Nom *','name','text'],['Email','email','email'],['Téléphone','phone','tel'],['Budget estimé','budget','text']].map(([label,key,type]) => (
          <div key={key} style={{marginBottom:10}}>
            <div style={{fontSize:10,color:c.textSec,marginBottom:3}}>{label}</div>
            <input type={type} value={newP[key]} onChange={e => setNewP(prev => ({...prev,[key]:e.target.value}))} style={{width:'100%',background:'rgba(0,0,0,0.04)',border:`0.5px solid ${c.border}`,borderRadius:6,padding:'6px 8px',fontSize:11,fontFamily:'inherit',color:c.text}} />
          </div>
        ))}
        <div style={{marginBottom:10}}>
          <div style={{fontSize:10,color:c.textSec,marginBottom:3}}>Origine du contact</div>
          <select value={newP.origine||''} onChange={e => setNewP(prev => ({...prev,origine:e.target.value}))} style={{width:'100%',background:'rgba(0,0,0,0.04)',border:`0.5px solid ${c.border}`,borderRadius:6,padding:'6px 8px',fontSize:11,fontFamily:'inherit',color:c.text}}>
            <option value="">Sélectionner</option>
            {ORIGINES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:10,color:c.textSec,marginBottom:3}}>Étape du pipeline</div>
          <select value={newP.stage} onChange={e => setNewP(prev => ({...prev,stage:e.target.value}))} style={{width:'100%',background:'rgba(0,0,0,0.04)',border:`0.5px solid ${c.border}`,borderRadius:6,padding:'6px 8px',fontSize:11,fontFamily:'inherit',color:c.text}}>
            {STAGES.map(s => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
          </select>
        </div>
        {newP.stage==='rdv' && <div style={{marginBottom:10}}>
          <div style={{fontSize:10,color:c.textSec,marginBottom:3}}>Date de relance (vide = +{settings.defaultDelay} j)</div>
          <input type="date" value={newP.relanceDate} onChange={e => setNewP(prev => ({...prev,relanceDate:e.target.value}))} style={{width:'100%',background:'rgba(0,0,0,0.04)',border:`0.5px solid ${c.border}`,borderRadius:6,padding:'6px 8px',fontSize:11,fontFamily:'inherit',color:c.text}} />
        </div>}
        {['r1','recherche','r2','closing'].includes(newP.stage) && <div style={{marginBottom:10}}>
          <div style={{fontSize:10,color:c.textSec,marginBottom:3}}>Format rencontre</div>
          <select value={newP.format} onChange={e => setNewP(prev => ({...prev,format:e.target.value}))} style={{width:'100%',background:'rgba(0,0,0,0.04)',border:`0.5px solid ${c.border}`,borderRadius:6,padding:'6px 8px',fontSize:11,fontFamily:'inherit',color:c.text}}>
            <option value="">Sélectionner</option>
            {['Physique','Visio','Call'].map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,color:c.textSec,marginBottom:3}}>Notes</div>
          <textarea value={newP.notes} onChange={e => setNewP(prev => ({...prev,notes:e.target.value}))} rows={2} style={{width:'100%',background:'rgba(0,0,0,0.04)',border:`0.5px solid ${c.border}`,borderRadius:6,padding:'6px 8px',fontSize:11,fontFamily:'inherit',color:c.text,resize:'none'}} />
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={onClose} style={{flex:1,padding:'8px',border:`0.5px solid ${c.border}`,borderRadius:6,background:'transparent',fontSize:11,cursor:'pointer',fontFamily:'inherit',color:c.textSec}}>Annuler</button>
          <button onClick={onSubmit} style={{flex:1,padding:'8px',border:'none',borderRadius:6,background:c.text,fontSize:11,cursor:'pointer',fontFamily:'inherit',color:'#fff',fontWeight:600}}>Ajouter</button>
        </div>
      </div>
    </div>
  )
}

export default function CRM() {
  const [prospects, setProspects] = useState(SEED)
  const [settings, setSettings] = useState({defaultDelay:2, warnDays:3})
  const [selectedId, setSelectedId] = useState('3')
  const [view, setView] = useState('pipeline')
  const [showAdd, setShowAdd] = useState(false)
  const [showSettingsPop, setShowSettingsPop] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [syncStatus, setSyncStatus] = useState('idle')
  const saveTimer = useRef(null)
  const [newP, setNewP] = useState({name:'',origine:'',email:'',phone:'',budget:'',notes:'',stage:'lead',relanceDate:'',format:''})
  const settingsRef = useRef()

  useEffect(() => {
    async function load() {
      const remote = await sbLoad()
      if (remote && remote.prospects) {
        setProspects(remote.prospects)
        if (remote.settings) setSettings(remote.settings)
      } else {
        try {
          const p = localStorage.getItem('crm-prospects')
          const s = localStorage.getItem('crm-settings')
          if (p) setProspects(JSON.parse(p))
          if (s) setSettings(JSON.parse(s))
        } catch(e) {}
      }
      setLoaded(true)
    }
    load()
  }, [])

  useEffect(() => {
    if (!loaded) return
    try { localStorage.setItem('crm-prospects', JSON.stringify(prospects)) } catch(e) {}
    setSyncStatus('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const ok = await sbSave({ prospects, settings })
      setSyncStatus(ok ? 'saved' : 'error')
      setTimeout(() => setSyncStatus('idle'), 3000)
    }, 1000)
  }, [prospects, loaded])

  useEffect(() => {
    if (!loaded) return
    try { localStorage.setItem('crm-settings', JSON.stringify(settings)) } catch(e) {}
  }, [settings, loaded])

  useEffect(() => {
    const fn = e => { if (showSettingsPop && settingsRef.current && !settingsRef.current.contains(e.target)) setShowSettingsPop(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [showSettingsPop])

  const active   = prospects.filter(p => p.stage !== 'abandon')
  const archived = prospects.filter(p => p.stage === 'abandon')

  const byStage = st => {
    let list = active.filter(p => p.stage === st)
    if (st === 'rdv' || st === 'rdv2') list = [...list].sort((a,b) => {
      const da = a.relanceDate ? new Date(a.relanceDate) : new Date('9999')
      const db = b.relanceDate ? new Date(b.relanceDate) : new Date('9999')
      return da - db
    })
    return list
  }

  const overdueCount   = [...byStage('rdv'), ...byStage('rdv2')].filter(p => rdvStatus(p, settings.warnDays) === 'overdue').length
  const rechercheCount = byStage('recherche').length
  const sel            = prospects.find(p => p.id === selectedId) || null

  const update = (id, upd) => setProspects(prev => prev.map(p => p.id === id ? {...p,...upd} : p))

  const moveStage = (id, st) => {
    const p = prospects.find(x => x.id === id); if (!p) return
    const tl = [{date:isoOffset(0), text:`Passage en "${STAGE_LABEL[st]||st}"`}, ...p.timeline]
    const upd = {stage:st, timeline:tl}
    if (st === 'rdv' || st === 'rdv2') upd.relanceDate = isoOffset(settings.defaultDelay)
    update(id, upd)
  }

  const doAbandon = (id) => {
    const p = prospects.find(x => x.id === id); if (!p) return
    update(id, {stage:'abandon', timeline:[{date:isoOffset(0), text:'Archivé'}, ...p.timeline]})
    setSelectedId(null)
  }

  const doPartenaire = (id) => {
    const p = prospects.find(x => x.id === id); if (!p) return
    update(id, {isPartenaire:true, tag:'→ Partenaire', timeline:[{date:isoOffset(0), text:'Redirigé vers partenaire'}, ...p.timeline]})
  }

  const sendRelance = (p) => {
    const cnt = (p.relanceCount || 0) + 1
    update(p.id, {relanceCount:cnt, relanceDate:isoOffset(settings.defaultDelay), relanceCustom:false, tag:`Relance x${cnt}`, timeline:[{date:isoOffset(0), text:`Relance x${cnt} envoyée`}, ...p.timeline]})
  }

  const deleteProspect = (id) => {
    if (!window.confirm('Supprimer définitivement ce prospect ? Cette action est irréversible.')) return
    setProspects(prev => prev.filter(p => p.id !== id))
    setSelectedId(null)
  }

  const exportData = () => {
    const data = { prospects, exportedAt: new Date().toISOString(), version: 7 }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const date = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')
    a.download = `crm-groupe-opera-${date}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importData = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!data.prospects || !Array.isArray(data.prospects)) {
          alert('Fichier invalide. Assurez-vous d\'utiliser un fichier exporté depuis ce CRM.')
          return
        }
        if (!window.confirm(`Importer ${data.prospects.length} prospects ? Cela remplacera toutes les données actuelles.`)) return
        setProspects(data.prospects)
        setSelectedId(null)
        alert('Import réussi !')
      } catch(err) {
        alert('Erreur lors de la lecture du fichier.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const submitAdd = () => {
    if (!newP.name.trim()) return
    const relDate = newP.stage === 'rdv' ? (newP.relanceDate || isoOffset(settings.defaultDelay)) : null
    const p = {...newP, id:uid(), relanceDate:relDate, relanceCustom:!!newP.relanceDate, relanceCount:0,
      timeline:[{date:isoOffset(0), text:'Prospect ajouté'}], createdAt:isoOffset(0), todos:[],
      tag: newP.stage==='lead' ? 'Nouveau' : '', isPartenaire:false}
    setProspects(prev => [...prev, p])
    setNewP({name:'',origine:'',email:'',phone:'',budget:'',notes:'',stage:'lead',relanceDate:'',format:''})
    setShowAdd(false)
    setSelectedId(p.id)
  }

  const restoreArchive = (id) => {
    update(id, {stage:'lead', timeline:[{date:isoOffset(0), text:'Réactivé depuis archives'}, ...(prospects.find(p => p.id === id)?.timeline || [])]})
  }

  return (
    <div style={{display:'flex',height:'100vh',width:'100vw',overflow:'hidden',background:c.bg,fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>

      <div style={{width:152,background:c.surface,borderRight:`0.5px solid ${c.border}`,display:'flex',flexDirection:'column',padding:'12px 0',flexShrink:0}}>
        <div style={{padding:'0 12px 12px',borderBottom:`0.5px solid ${c.border}`,marginBottom:6}}>
          <div style={{fontSize:14,fontWeight:700,color:c.text}}>CRM - Groupe OPERA</div>
          <div style={{fontSize:9,color:c.textSec}}>Pipeline commercial</div>
        </div>
        {[{id:'pipeline',label:'Pipeline',dot:'#378ADD'},{id:'archives',label:'Archives',dot:'#888780'}].map(item => (
          <div key={item.id} onClick={() => setView(item.id)} style={{padding:'7px 12px',fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',gap:7,background:view===item.id?'rgba(0,0,0,0.05)':'transparent',color:c.text,fontWeight:view===item.id?600:400}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:item.dot,display:'inline-block',flexShrink:0}} />
            {item.label}
            {item.id==='archives' && <span style={{marginLeft:'auto',fontSize:9,color:c.textTer}}>{archived.length}</span>}
          </div>
        ))}
        <div style={{height:0.5,background:c.border,margin:'7px 12px'}} />
        <div style={{padding:'7px 12px',fontSize:11,color:c.textSec,display:'flex',alignItems:'center',gap:7}}>
          <span style={{width:6,height:6,borderRadius:'50%',background:'#639922',display:'inline-block',flexShrink:0}} />
          Clients actifs
          <span style={{marginLeft:'auto',fontSize:9,color:c.textTer}}>{byStage('closing').length}</span>
        </div>
        <div onClick={() => setView('partenaires')} style={{padding:'7px 12px',fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',gap:7,background:view==='partenaires'?'rgba(0,0,0,0.05)':'transparent',color:c.text,fontWeight:view==='partenaires'?600:400}}>
          <span style={{width:6,height:6,borderRadius:'50%',background:c.amber,display:'inline-block',flexShrink:0}} />
          Partenaires
          <span style={{marginLeft:'auto',fontSize:9,color:c.textTer}}>{active.filter(p => p.isPartenaire).length}</span>
        </div>
        <div style={{marginTop:'auto',padding:'10px 12px',borderTop:`0.5px solid ${c.border}`,display:'flex',alignItems:'center',gap:7}}>
          <div style={{width:24,height:24,borderRadius:'50%',background:'#9FE1CB',color:'#085041',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,flexShrink:0}}>TA</div>
          <div>
            <div style={{fontSize:11,fontWeight:600,color:c.text}}>Thierry ADINE</div>
            <div style={{fontSize:9,color:c.textSec}}>Gérant</div>
          </div>
        </div>
      </div>

      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:9,padding:'10px 13px',background:c.surface,borderBottom:`0.5px solid ${c.border}`,flexShrink:0}}>
          <div style={{fontSize:13,fontWeight:600,color:c.text,flex:1,display:'flex',alignItems:'center',gap:8}}>
            {view==='archives'?'Archives':view==='partenaires'?'Partenaires':'Pipeline'}
            {syncStatus==='saving' && <span style={{fontSize:9,color:c.textTer,fontWeight:400}}>● Enregistrement…</span>}
            {syncStatus==='saved'  && <span style={{fontSize:9,color:c.ok,fontWeight:400}}>● Synchronisé</span>}
            {syncStatus==='error'  && <span style={{fontSize:9,color:c.overdue,fontWeight:400}}>● Erreur sync</span>}
          </div>
          <input placeholder="Rechercher…" style={{background:'rgba(0,0,0,0.04)',border:`0.5px solid ${c.border}`,borderRadius:6,padding:'5px 8px',fontSize:10,fontFamily:'inherit',color:c.text,width:130}} />
          {view==='pipeline' && <button onClick={() => setShowAdd(true)} style={{background:c.text,color:'#fff',border:'none',borderRadius:6,padding:'6px 11px',fontSize:10,fontWeight:600,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>+ Nouveau lead</button>}
          <button onClick={exportData} title="Exporter les données" style={{background:'transparent',border:`0.5px solid ${c.border}`,borderRadius:6,padding:'6px 9px',fontSize:11,cursor:'pointer',color:c.textSec}} >⬇</button>
          <label title="Importer les données" style={{background:'transparent',border:`0.5px solid ${c.border}`,borderRadius:6,padding:'5px 9px',fontSize:11,cursor:'pointer',color:c.textSec,display:'inline-flex',alignItems:'center'}}>
            ⬆<input type="file" accept=".json" onChange={importData} style={{display:'none'}} />
          </label>
          {view==='partenaires' && <button onClick={() => setView('pipeline')} style={{background:'transparent',color:c.textSec,border:`0.5px solid ${c.border}`,borderRadius:6,padding:'6px 11px',fontSize:10,cursor:'pointer',fontFamily:'inherit'}}>← Pipeline</button>}
        </div>

        {view==='pipeline' && <div style={{display:'flex',gap:8,padding:'8px 13px',background:c.surface,borderBottom:`0.5px solid ${c.border}`,flexShrink:0}}>
          {[{label:'Actifs',val:active.length,warn:false},{label:'Relances échues',val:overdueCount,warn:overdueCount>0},{label:'En recherche',val:rechercheCount,warn:rechercheCount>0},{label:'En closing',val:byStage('closing').length,warn:false}].map(s => (
            <div key={s.label} style={{background:'rgba(0,0,0,0.04)',borderRadius:6,padding:'4px 9px',fontSize:9,color:c.textSec,whiteSpace:'nowrap'}}>
              <div style={{fontSize:14,fontWeight:600,color:s.warn?(s.label==='En recherche'?c.amber:c.overdue):c.text}}>{s.val}</div>
              {s.label}
            </div>
          ))}
        </div>}

        {view==='pipeline' && <div style={{display:'flex',gap:8,padding:10,overflowX:'auto',flex:1,alignItems:'flex-start'}}>
          <div style={{minWidth:136,maxWidth:136,flexShrink:0}}>
            <ColHeader stage="lead" count={byStage('lead').length} />
            {byStage('lead').map(p => <ProspectCard key={p.id} p={p} selectedId={selectedId} setSelectedId={setSelectedId} />)}
          </div>
          <div style={{minWidth:150,maxWidth:150,flexShrink:0}}>
            <ColHeader stage="rdv" count={byStage('rdv').length} extra={
              <div ref={settingsRef} style={{position:'relative'}}>
                <button onClick={() => setShowSettingsPop(v => !v)} style={{width:18,height:18,borderRadius:4,background:'transparent',border:'none',cursor:'pointer',fontSize:11,color:c.textTer,display:'flex',alignItems:'center',justifyContent:'center',padding:0}}>⚙</button>
                {showSettingsPop && <div style={{position:'absolute',top:22,left:-10,background:c.surface,border:`0.5px solid ${c.borderMd}`,borderRadius:8,padding:12,zIndex:50,width:190}}>
                  <div style={{fontSize:11,fontWeight:600,color:c.text,marginBottom:10}}>Relance automatique</div>
                  {[['Délai par défaut','defaultDelay','jours'],['Alerte orange à partir de','warnDays','jours']].map(([lbl,key,unit]) => (
                    <div key={key} style={{marginBottom:8}}>
                      <div style={{fontSize:10,color:c.textSec,marginBottom:3}}>{lbl}</div>
                      <div style={{display:'flex',alignItems:'center',gap:5}}>
                        <input type="number" min="1" max="365" value={settings[key]} onChange={e => setSettings(s => ({...s,[key]:parseInt(e.target.value)||s[key]}))} style={{width:46,background:'rgba(0,0,0,0.05)',border:`0.5px solid ${c.border}`,borderRadius:5,padding:'4px 6px',fontSize:11,fontFamily:'inherit',textAlign:'center',color:c.text}} />
                        <span style={{fontSize:10,color:c.textSec}}>{unit}</span>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setShowSettingsPop(false)} style={{width:'100%',padding:'5px',border:`0.5px solid ${c.border}`,borderRadius:5,background:'transparent',fontSize:10,cursor:'pointer',fontFamily:'inherit',color:c.textSec,marginTop:4}}>Fermer</button>
                </div>}
              </div>} />
            <div style={{fontSize:9,color:c.textTer,marginBottom:5,display:'flex',alignItems:'center',gap:3}}><span>↑</span> Plus proche en premier</div>
            {byStage('rdv').map(p => <RdvCard key={p.id} p={p} selectedId={selectedId} setSelectedId={setSelectedId} settings={settings} />)}
          </div>
          <div style={{minWidth:136,maxWidth:136,flexShrink:0}}>
            <ColHeader stage="r1" count={byStage('r1').length} />
            {byStage('r1').map(p => <ProspectCard key={p.id} p={p} selectedId={selectedId} setSelectedId={setSelectedId} />)}
          </div>
          <div style={{minWidth:136,maxWidth:136,flexShrink:0,background:c.amberLight,border:`0.5px solid rgba(186,117,23,0.25)`,borderRadius:8,padding:7}}>
            <ColHeader stage="recherche" count={byStage('recherche').length} extra={<span style={{fontSize:8,fontWeight:600,padding:'1px 5px',borderRadius:5,background:c.amber,color:'#fff',whiteSpace:'nowrap',flexShrink:0}}>À faire</span>} />
            {byStage('recherche').map(p => <ProspectCard key={p.id} p={p} selectedId={selectedId} setSelectedId={setSelectedId} isRecherche={true} />)}
          </div>
          <div style={{minWidth:150,maxWidth:150,flexShrink:0}}>
            <ColHeader stage="rdv2" count={byStage('rdv2').length} extra={null} />
            <div style={{fontSize:9,color:c.textTer,marginBottom:5,display:'flex',alignItems:'center',gap:3}}><span>↑</span> Plus proche en premier</div>
            {byStage('rdv2').map(p => <RdvCard key={p.id} p={p} selectedId={selectedId} setSelectedId={setSelectedId} settings={settings} />)}
          </div>
          <div style={{minWidth:136,maxWidth:136,flexShrink:0}}>
            <ColHeader stage="r2" count={byStage('r2').length} />
            {byStage('r2').map(p => <ProspectCard key={p.id} p={p} selectedId={selectedId} setSelectedId={setSelectedId} />)}
          </div>
          <div style={{minWidth:136,maxWidth:136,flexShrink:0}}>
            <ColHeader stage="closing" count={byStage('closing').length} />
            {byStage('closing').map(p => <ProspectCard key={p.id} p={p} selectedId={selectedId} setSelectedId={setSelectedId} />)}
          </div>
        </div>}

        {view==='partenaires' && <div style={{flex:1,overflow:'auto',padding:12}}>
          {active.filter(p => p.isPartenaire).length === 0
            ? <div style={{textAlign:'center',color:c.textTer,fontSize:12,padding:40}}>Aucun partenaire enregistré.<br/>Redirige un prospect vers un partenaire depuis sa fiche.</div>
            : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:10}}>
                {active.filter(p => p.isPartenaire).map(p => {
                  const lastContact = p.timeline?.[0]
                  return (
                    <div key={p.id} onClick={() => { setView('pipeline'); setSelectedId(p.id) }}
                      style={{background:c.surface,border:`0.5px solid ${c.border}`,borderLeft:`3px solid ${c.amber}`,borderRadius:8,padding:'12px 13px',cursor:'pointer'}}>
                      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
                        <Avatar name={p.name} size={28} />
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:600,color:c.text,lineHeight:1.2}}>{p.name}</div>
                          <div style={{marginTop:2}}><OrigineTag origine={p.origine} /></div>
                        </div>
                        <span style={{fontSize:8,fontWeight:600,padding:'2px 6px',borderRadius:6,background:c.amberLight,color:c.amber,whiteSpace:'nowrap'}}>Partenaire</span>
                      </div>
                      {p.budget && <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                        <span style={{fontSize:10,color:c.textSec}}>Budget</span>
                        <span style={{fontSize:10,color:c.text,fontWeight:600}}>{p.budget}</span>
                      </div>}
                      <div style={{background:'rgba(0,0,0,0.03)',borderRadius:5,padding:'6px 8px',marginTop:6}}>
                        <div style={{fontSize:8,fontWeight:600,color:c.textTer,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:3}}>Dernier contact</div>
                        {lastContact
                          ? <div>
                              <div style={{fontSize:11,fontWeight:500,color:c.text,lineHeight:1.3}}>{lastContact.text}</div>
                              <div style={{fontSize:9,color:c.textSec,marginTop:2}}>{fmtDate(lastContact.date)}</div>
                            </div>
                          : <div style={{fontSize:10,color:c.textTer}}>Aucun contact enregistré</div>}
                      </div>
                      {p.notes && <div style={{marginTop:6,fontSize:10,color:c.textSec,lineHeight:1.4,borderTop:`0.5px solid ${c.border}`,paddingTop:6}}>{p.notes}</div>}
                    </div>
                  )
                })}
              </div>}
        </div>}

        {view==='archives' && <div style={{flex:1,overflow:'auto',padding:12}}>
          {archived.length === 0
            ? <div style={{textAlign:'center',color:c.textTer,fontSize:12,padding:40}}>Aucun prospect archivé</div>
            : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:8}}>
                {archived.map(p => (
                  <div key={p.id} style={{background:c.surface,border:`0.5px solid ${c.border}`,borderRadius:8,padding:'10px 11px'}}>
                    <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:6}}>
                      <Avatar name={p.name} size={22} />
                      <div><div style={{fontSize:11,fontWeight:600,color:c.text}}>{p.name}</div><div style={{marginTop:2}}><OrigineTag origine={p.origine} /></div></div>
                    </div>
                    <div style={{fontSize:9,color:c.textTer,marginBottom:6}}>Archivé le {fmtDate(p.timeline?.[0]?.date)}</div>
                    <div style={{display:'flex',gap:5}}>
                      <button onClick={() => restoreArchive(p.id)} style={{flex:1,padding:'4px',border:`0.5px solid ${c.border}`,borderRadius:5,background:'transparent',fontSize:9,cursor:'pointer',fontFamily:'inherit',color:c.textSec}}>Réactiver</button>
                      <button onClick={() => deleteProspect(p.id)} style={{padding:'4px 8px',border:`0.5px solid rgba(226,75,74,0.3)`,borderRadius:5,background:'transparent',fontSize:9,cursor:'pointer',fontFamily:'inherit',color:c.overdueText}}>Suppr.</button>
                    </div>
                  </div>
                ))}
              </div>}
        </div>}
      </div>

      <DetailPanel sel={sel} settings={settings} update={update} moveStage={moveStage} doAbandon={doAbandon} doPartenaire={doPartenaire} sendRelance={sendRelance} deleteProspect={deleteProspect} />
      {showAdd && <AddModal newP={newP} setNewP={setNewP} onClose={() => setShowAdd(false)} onSubmit={submitAdd} settings={settings} />}
    </div>
  )
}
