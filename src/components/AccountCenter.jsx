import { useEffect, useState } from 'react'
import { Bell, User, CreditCard, Film, X } from 'lucide-react'
import { getProfile, updateProfile, getNotifications, markNotificationRead, getPlans, getMySubscription, getCreatorProfile, updateCreatorProfile, getCreatorSubmissions, createCheckoutSession, subscribeToFreePlan, createFilmSubmission, uploadSubmissionFile, createNotification } from '../lib/platform'

export default function AccountCenter({ user, onClose, initialTab = 'profile' }) {
  const [tab,setTab]=useState(initialTab),[profile,setProfile]=useState(null),[notifications,setNotifications]=useState([]),[plans,setPlans]=useState([]),[subscription,setSubscription]=useState(null),[creator,setCreator]=useState(null),[submissions,setSubmissions]=useState([]),[busy,setBusy]=useState(true),[error,setError]=useState('')
  useEffect(()=>{let live=true;Promise.all([getProfile(user.id),getNotifications(user.id),getPlans(),getMySubscription(user.id),getCreatorProfile(user.id)]).then(([p,n,pl,s,c])=>{if(!live)return;setProfile(p);setNotifications(n);setPlans(pl);setSubscription(s);setCreator(c);if(c)getCreatorSubmissions(c.id).then(setSubmissions)}).catch(e=>live&&setError(e.message)).finally(()=>live&&setBusy(false));return()=>{live=false}},[user.id])
  const save=async e=>{e.preventDefault();try{const f=new FormData(e.currentTarget);setProfile(await updateProfile(user.id,{full_name:f.get('full_name'),avatar_url:f.get('avatar_url')}))}catch(e){setError(e.message)}}
  const becomeCreator=async()=>{try{const c=await updateCreatorProfile(user.id,{display_name:profile?.full_name||user.email?.split('@')[0]||'Creator'});setCreator(c);setTab('creator')}catch(e){setError(e.message)}}
  const [checkoutBusyId,setCheckoutBusyId]=useState(null)
  const [checkoutError,setCheckoutError]=useState('')
  const [submitBusy,setSubmitBusy]=useState(false)
  const [submitError,setSubmitError]=useState('')
  const [showSubmitForm,setShowSubmitForm]=useState(false)
  const submitFilm=async(e)=>{
    e.preventDefault()
    setSubmitError('')
    const f=new FormData(e.currentTarget)
    const file=f.get('file')
    if(!file||!file.size){setSubmitError('Choose a video file to upload');return}
    setSubmitBusy(true)
    try{
      const videoUrl=await uploadSubmissionFile(user.id,file)
      const created=await createFilmSubmission(creator.id,{
        title:f.get('title'),
        description:f.get('description'),
        genre:f.get('genre'),
        video_url:videoUrl,
        status:'pending',
      })
      setSubmissions(subs=>[created,...subs])
      createNotification(user.id,{title:'Submission received',message:`"${created.title}" was uploaded and is pending review.`,type:'success'}).then(n=>setNotifications(ns=>[n,...ns])).catch(()=>{})
      setShowSubmitForm(false)
      e.currentTarget.reset()
    }catch(err){setSubmitError(err.message)}
    setSubmitBusy(false)
  }
  const choosePlan=async(plan)=>{
    setCheckoutError('')
    setCheckoutBusyId(plan.id)
    try{
      if(!plan.price_monthly||Number(plan.price_monthly)===0){
        const sub=await subscribeToFreePlan(user.id,plan.id)
        setSubscription({...sub,subscription_plans:plan})
      }else if(!plan.stripe_price_id){
        setCheckoutError(`${plan.name} isn't connected to Stripe yet — see supabase/functions/BILLING_SETUP.md to finish billing setup.`)
      }else{
        await createCheckoutSession(plan.id)
      }
    }catch(e){setCheckoutError(e.message)}
    setCheckoutBusyId(null)
  }
  return <div className="modal"><div className="dashboard-box"><aside><button className="close" onClick={onClose}><X size={18}/></button><h3 className="studio-logo">RwandaFlix</h3><button className={tab==='profile'?'studio-active':''} onClick={()=>setTab('profile')}><User size={16}/> Profile</button><button className={tab==='notifications'?'studio-active':''} onClick={()=>setTab('notifications')}><Bell size={16}/> Notifications</button><button className={tab==='subscription'?'studio-active':''} onClick={()=>setTab('subscription')}><CreditCard size={16}/> Subscription</button><button className={tab==='creator'?'studio-active':''} onClick={()=>setTab('creator')}><Film size={16}/> Creator Studio</button></aside><section>{busy?<p>Loading your account…</p>:error?<p className="form-error">{error}</p>:tab==='profile'?<><div className="dashboard-top"><div><h2>Your profile</h2><p>Manage your RwandaFlix account.</p></div></div><form onSubmit={save} className="dashboard-card"><input name="full_name" defaultValue={profile?.full_name||''} placeholder="Full name"/><input name="avatar_url" defaultValue={profile?.avatar_url||''} placeholder="Avatar URL"/><button className="btn primary">Save profile</button></form></>:tab==='notifications'?<><div className="dashboard-top"><div><h2>Notifications</h2><p>{notifications.filter(n=>!n.is_read).length} unread</p></div></div>{notifications.length?notifications.map(n=><button key={n.id} className="dashboard-card" style={{display:'block',width:'100%',textAlign:'left',marginBottom:10}} onClick={()=>markNotificationRead(user.id,n.id).then(()=>setNotifications(xs=>xs.map(x=>x.id===n.id?{...x,is_read:true}:x)))}><strong>{n.title}</strong><p>{n.message}</p></button>):<div className="empty-state"><p>No notifications yet.</p></div>}</>:tab==='subscription'?<><div className="dashboard-top"><div><h2>Subscription</h2><p>{subscription?.subscription_plans?.name||'Choose a plan'}</p></div></div>{checkoutError&&<p className="form-error">{checkoutError}</p>}<div className="pricing-grid">{plans.map(p=><div className="price-card" key={p.id}><h3>{p.name}</h3><div className="price">{p.price_monthly}<span>/month</span></div><p>{p.video_quality||'Standard'} quality · {p.max_profiles||1} profiles</p><button className="btn primary" disabled={checkoutBusyId===p.id} onClick={()=>choosePlan(p)}>{checkoutBusyId===p.id?'Redirecting…':subscription?.plan_id===p.id?'Current plan':'Choose plan'}</button></div>)}</div></>:<><div className="dashboard-top"><div><h2>Creator Studio</h2><p>{creator?'Manage your creator profile and submissions.':'Publish your Rwandan stories on RwandaFlix.'}</p></div>{!creator&&<button className="btn primary" onClick={becomeCreator}>Become a creator</button>}{creator&&<button className="btn primary" onClick={()=>setShowSubmitForm(v=>!v)}>{showSubmitForm?'Cancel':'+ Submit a Film'}</button>}</div>{creator?<><div className="dashboard-stats"><div><span>Submissions</span><strong>{submissions.length}</strong></div><div><span>Status</span><strong>{creator.verified?'Verified':'Pending'}</strong></div></div>{showSubmitForm&&<form onSubmit={submitFilm} className="dashboard-card" style={{display:'flex',flexDirection:'column',gap:10}}>{submitError&&<p className="form-error">{submitError}</p>}<input name="title" required placeholder="Film title"/><textarea name="description" placeholder="Description" rows={3}/><input name="genre" placeholder="Genre (e.g. Drama)"/><label style={{fontSize:13,color:'#999'}}>Video file<input name="file" type="file" accept="video/*" required style={{display:'block',marginTop:6}}/></label><button className="btn primary" disabled={submitBusy}>{submitBusy?'Uploading…':'Submit for review'}</button><p style={{fontSize:12,color:'#888'}}>Your file uploads to your own private storage folder and stays there until a RwandaFlix reviewer approves it for publishing.</p></form>}<div className="dashboard-card"><h3>Your submissions</h3>{submissions.length?submissions.map(s=><p key={s.id}><strong>{s.title}</strong> · {s.status}</p>):<p>No film submissions yet.</p>}</div></>:<div className="dashboard-card"><h3>Creator tools</h3><p>Submit movies and series, track review status, and build your creator profile.</p></div>}</>}</section></div></div>
}
