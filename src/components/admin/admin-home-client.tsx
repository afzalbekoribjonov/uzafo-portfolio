'use client';
import {AlertTriangle, Check, ExternalLink, FilePenLine, FolderKanban, MessageSquareMore, Newspaper, Plus, Save, ShieldAlert, Trash2, User, Users, X, FileText} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';
import {useLocale} from 'next-intl';
import {Link, useRouter} from '@/i18n/navigation';
import {useDemoSession} from '@/lib/auth';
import {useManagedBlogPosts, useManagedDiscussions, useManagedProfile, useManagedProjects, useManagedResume} from '@/lib/demo-store';
import {createDiscussion as createDiscussionApi, createPost as createPostApi, createProject as createProjectApi, deleteDiscussion as deleteDiscussionApi, deletePostApi, deleteProject as deleteProjectApi, fetchAdminUsers} from '@/lib/api-service';
import {isLiveModeEnabled} from '@/lib/auth';
import type {BlogPost, Discussion, Locale, MockUser, Profile, Project, ResumeData} from '@/lib/types';
import {formatTimestamp, makeId, normalizeProject, resolveText, slugify} from '@/lib/utils';
import {ProfileEditor} from '@/components/admin/profile-editor';
import {ResumeEditor} from '@/components/admin/resume-editor';

type TabId = 'overview'|'posts'|'projects'|'discussions'|'profile'|'resume'|'users';

function Confirm({message, onConfirm, onCancel}: {message:string;onConfirm:()=>void;onCancel:()=>void}) {
  return (
    <div style={{position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.65)',backdropFilter:'blur(6px)',padding:'16px'}}>
      <div style={{width:'100%',maxWidth:'400px',background:'var(--bg-overlay)',border:'1px solid var(--bd-danger)',borderRadius:'22px',padding:'24px'}}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 mt-0.5" style={{color:'var(--danger)',flexShrink:0}}/>
          <div>
            <p className="font-semibold" style={{color:'var(--fg-1)'}}>Tasdiqlang</p>
            <p className="mt-2 text-sm leading-6" style={{color:'var(--fg-3)'}}>{message}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="t-btn-ghost rounded-full px-4 py-2 text-sm">Bekor</button>
          <button type="button" onClick={onConfirm} className="t-btn-danger rounded-full px-4 py-2 text-sm font-semibold flex items-center gap-1.5">
            <Trash2 className="h-3.5 w-3.5"/> O'chirish
          </button>
        </div>
      </div>
    </div>
  );
}

function TabBtn({id, active, onClick, icon:Icon, label, count}: {id:TabId;active:boolean;onClick:()=>void;icon:React.ElementType;label:string;count?:number}) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 sm:gap-[6px] sm:px-4 sm:py-[7px]" style={{
      fontSize:'.82rem', fontWeight: active?600:400, cursor:'pointer',
      color: active ? 'var(--accent-fg)' : 'var(--fg-3)',
      background: active ? 'var(--accent)' : 'var(--bg-surface)',
      border: active ? '1px solid var(--accent)' : '1px solid var(--bd)',
      transition:'all .18s',
    }}>
      <Icon className="h-3.5 w-3.5"/>
      {label}
      {count !== undefined ? (
        <span style={{borderRadius:'999px',padding:'1px 7px',fontSize:'.7rem',fontWeight:700,background:active?'rgba(0,0,0,.2)':'var(--bg-deep)',color:active?'inherit':'var(--fg-3)'}}>{count}</span>
      ) : null}
    </button>
  );
}

function ItemRow({title, date, extra, onEdit, onView, onDelete}: {title:string;date?:string;extra?:string;onEdit:()=>void;onView?:()=>void;onDelete:()=>void}) {
  return (
    <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:'10px',borderRadius:'16px',border:'1px solid var(--bd)',background:'var(--bg-surface)',padding:'10px 14px',transition:'background .18s'}}
      onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background='var(--bg-hover)'}
      onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background='var(--bg-surface)'}>
      <div style={{flex:1,minWidth:0}}>
        <p className="text-sm font-medium truncate" style={{color:'var(--fg-1)'}}>{title}</p>
        <div className="flex flex-wrap gap-3">
          {date ? <span style={{fontSize:'.72rem',color:'var(--fg-4)'}}>{date}</span> : null}
          {extra ? <span style={{fontSize:'.72rem',color:'var(--fg-4)'}}>{extra}</span> : null}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {onView ? (
          <button type="button" onClick={onView} style={{display:'inline-flex',alignItems:'center',gap:'4px',borderRadius:'999px',padding:'4px 10px',fontSize:'.72rem',color:'var(--fg-3)',background:'var(--bg-deep)',border:'1px solid var(--bd)',cursor:'pointer'}}>
            <ExternalLink className="h-3 w-3"/> Ko'rish
          </button>
        ) : null}
        <button type="button" onClick={onEdit} style={{display:'inline-flex',alignItems:'center',gap:'4px',borderRadius:'999px',padding:'4px 10px',fontSize:'.72rem',color:'var(--accent)',background:'var(--accent-bg)',border:'1px solid var(--bd-accent)',cursor:'pointer'}}>
          <FilePenLine className="h-3 w-3"/> Tahrir
        </button>
        <button type="button" onClick={onDelete} style={{display:'inline-flex',alignItems:'center',gap:'4px',borderRadius:'999px',padding:'4px 8px',fontSize:'.72rem',color:'var(--danger)',background:'var(--danger-bg)',border:'1px solid var(--bd-danger)',cursor:'pointer'}}>
          <Trash2 className="h-3 w-3"/>
        </button>
      </div>
    </div>
  );
}

export function AdminHomeClient({initialProfile,initialProjects,initialBlogPosts,initialResume,initialDiscussions,users}: {
  initialProfile:Profile; initialProjects:Project[]; initialBlogPosts:BlogPost[];
  initialResume:ResumeData; initialDiscussions:Discussion[]; users:MockUser[];
}) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const {hydrated, isAdmin, session} = useDemoSession();

  const [profile, setProfile] = useManagedProfile(initialProfile);
  const [projects, setProjects, , replaceProjects] = useManagedProjects(initialProjects);
  const [posts, setPosts, , replacePosts] = useManagedBlogPosts(initialBlogPosts);
  const [resume, setResume] = useManagedResume(initialResume);
  const [discussions, setDiscussions, , replaceDiscussions] = useManagedDiscussions(initialDiscussions);

  const [tab, setTab] = useState<TabId>('overview');
  const [confirm, setConfirm] = useState<{type:string;slug:string;title:string}|null>(null);
  const [profileDraft, setProfileDraft] = useState<Profile>(profile);
  const [resumeDraft, setResumeDraft] = useState<ResumeData>(resume);
  const [profileSaved, setProfileSaved] = useState(false);
  const [resumeSaved, setResumeSaved] = useState(false);
  const [liveUsers, setLiveUsers] = useState<MockUser[]>(users);

  useEffect(() => {
    if (!isLiveModeEnabled()) return;
    let active = true;
    void fetchAdminUsers().then((res) => {
      if (active) setLiveUsers(res.items);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const online = useMemo(()=>liveUsers.filter(u=>u.status==='online').length,[liveUsers]);
  const orderedPosts = useMemo(()=>[...posts].sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)),[posts]);
  const orderedDisc  = useMemo(()=>[...discussions].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),[discussions]);

  if (!hydrated) {
    return <div style={{borderRadius:'24px',border:'1px solid var(--bd)',background:'var(--bg-surface)',padding:'32px',color:'var(--fg-3)',fontSize:'.875rem'}}>Yuklanmoqda…</div>;
  }

  if (!isAdmin) {
    return (
      <div style={{borderRadius:'24px',border:'1px solid var(--bd-accent)',background:'var(--warn-bg)',padding:'32px'}}>
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 mt-0.5" style={{color:'var(--warn)'}}/>
          <div>
            <h2 className="text-xl font-semibold" style={{color:'var(--fg-1)'}}>Faqat admin uchun</h2>
            <p className="mt-2 text-sm" style={{color:'var(--fg-3)'}}>Bu sahifa faqat admin hisob bilan kirganda ko'rinadi.</p>
            <Link href="/auth/sign-in" className="t-btn-primary rounded-full px-4 py-2 text-sm font-semibold mt-4 inline-flex">Kirish</Link>
          </div>
        </div>
      </div>
    );
  }

  // CRUD actions
  const createPost = async () => {
    const slug = `post-${Date.now()}`;
    const p:BlogPost={slug,title:'Yangi post',excerpt:'Tavsif…',cover:'',publishedAt:new Date().toISOString(),author:{name:profile.name,role:'Developer'},readingTime:1,likes:0,dislikes:0,featured:false,blocks:[{id:makeId('b'),type:'richText',content:'<p>Yozishni boshlang...</p>'}],comments:[]};
    try {
      const created = await createPostApi(p);
      setPosts([created,...posts]); router.push(`/blog/${created.slug}?edit=1`);
      return;
    } catch {}
    setPosts([p,...posts]); router.push(`/blog/${slug}?edit=1`);
  };
  const createProject = async () => {
    const slug=`project-${Date.now()}`;
    const p=normalizeProject({slug,title:'Yangi loyiha',excerpt:'Tavsif.',description:'Loyiha haqida.',year:String(new Date().getUTCFullYear()),status:'Draft',cover:'',tags:['Next.js'],metrics:[{label:'Role',value:'Developer'}],links:[{id:makeId('l'),label:'Demo',href:'#'}],content:[{id:makeId('b'),type:'richText',content:'<p>Loyiha tavsifi</p>'}]});
    try {
      const created = await createProjectApi(p);
      setProjects([created,...projects]); router.push(`/portfolio/${created.slug}?edit=1`);
      return;
    } catch {}
    setProjects([p,...projects]); router.push(`/portfolio/${slug}?edit=1`);
  };
  const createDiscussion = async () => {
    const slug=slugify(`discussion-${Date.now()}`);
    const d:Discussion={slug,title:'Yangi muhokama',category:'General',createdAt:new Date().toISOString(),author:{name:session?.name||profile.name,avatar:'/assets/avatars/uzafo-avatar.svg',title:'Admin'},summary:'Tavsif.',content:'<p>Muhokamani boshlang…</p>',messages:[]};
    try {
      const created = await createDiscussionApi(d);
      setDiscussions([created,...discussions]); router.push(`/discussions/${created.slug}?edit=1`);
      return;
    } catch {}
    setDiscussions([d,...discussions]); router.push(`/discussions/${slug}?edit=1`);
  };
  const doDelete = async () => {
    if (!confirm) return;
    if (isLiveModeEnabled()) {
      try {
        if (confirm.type==='post') {
          await deletePostApi(confirm.slug);
          replacePosts((current) => current.filter((post) => post.slug !== confirm.slug));
        }
        if (confirm.type==='project') {
          await deleteProjectApi(confirm.slug);
          replaceProjects((current) => current.filter((project) => project.slug !== confirm.slug));
        }
        if (confirm.type==='disc') {
          await deleteDiscussionApi(confirm.slug);
          replaceDiscussions((current) => current.filter((discussion) => discussion.slug !== confirm.slug));
        }
      } catch (error) {
        console.error(`Failed to delete ${confirm.type} ${confirm.slug}.`, error);
        return;
      }
    } else {
      if (confirm.type==='post') setPosts(posts.filter(p=>p.slug!==confirm.slug));
      if (confirm.type==='project') setProjects(projects.filter(p=>p.slug!==confirm.slug));
      if (confirm.type==='disc') setDiscussions(discussions.filter(d=>d.slug!==confirm.slug));
    }
    setConfirm(null);
  };

  const saveProfile = () => { setProfile(profileDraft); setProfileSaved(true); setTimeout(()=>setProfileSaved(false), 2200); };
  const saveResume  = () => { setResume(resumeDraft); setResumeSaved(true); setTimeout(()=>setResumeSaved(false), 2200); };

  const stats = [
    {label:'Blog postlar', val:posts.length, icon:Newspaper, tab:'posts' as TabId},
    {label:'Loyihalar', val:projects.length, icon:FolderKanban, tab:'projects' as TabId},
    {label:'Muhokamalar', val:discussions.length, icon:MessageSquareMore, tab:'discussions' as TabId},
    {label:'Onlayn', val:online, icon:Users, tab:'users' as TabId},
  ];

  return (
    <>
      {confirm ? <Confirm message={`"${confirm.title}" o'chirilsinmi? Bu amalni qaytarib bo'lmaydi.`} onConfirm={doDelete} onCancel={()=>setConfirm(null)}/> : null}

      <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {stats.map(({label,val,icon:Icon,tab:t}) => (
            <button key={label} type="button" onClick={()=>setTab(t)} style={{
              display:'flex',alignItems:'center',justifyContent:'space-between',
              borderRadius:'20px',border:'1px solid var(--bd)',background:'var(--bg-surface)',padding:'18px 20px',
              cursor:'pointer',textAlign:'left',transition:'all .18s',
            }} onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='var(--bd-accent)';}} onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='var(--bd)';}}>
              <div>
                <p style={{fontSize:'.8rem',color:'var(--fg-4)'}}>{label}</p>
                <p style={{fontSize:'2rem',fontWeight:700,color:'var(--fg-1)',marginTop:'8px',lineHeight:1}}>{val}</p>
              </div>
              <div style={{width:'40px',height:'40px',borderRadius:'12px',background:'var(--accent-bg)',border:'1px solid var(--bd-accent)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Icon className="h-5 w-5" style={{color:'var(--accent)'}}/>
              </div>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-x-2 gap-y-3 sm:gap-y-2">
          <TabBtn id="overview" active={tab==='overview'} onClick={()=>setTab('overview')} icon={ShieldAlert} label="Umumiy" count={posts.length+projects.length}/>
          <TabBtn id="posts" active={tab==='posts'} onClick={()=>setTab('posts')} icon={Newspaper} label="Blog" count={posts.length}/>
          <TabBtn id="projects" active={tab==='projects'} onClick={()=>setTab('projects')} icon={FolderKanban} label="Portfolio" count={projects.length}/>
          <TabBtn id="discussions" active={tab==='discussions'} onClick={()=>setTab('discussions')} icon={MessageSquareMore} label="Muhokamalar" count={discussions.length}/>
          <TabBtn id="profile" active={tab==='profile'} onClick={()=>setTab('profile')} icon={User} label="Profil"/>
          <TabBtn id="resume" active={tab==='resume'} onClick={()=>setTab('resume')} icon={FileText} label="Rezyume"/>
          <TabBtn id="users" active={tab==='users'} onClick={()=>setTab('users')} icon={Users} label="Foydalanuvchilar" count={liveUsers.length}/>
        </div>

        {/* ── OVERVIEW ── */}
        {tab==='overview' && (
          <div className="grid gap-5 xl:grid-cols-2">
            {/* Posts mini */}
            <div className="t-card rounded-[22px] p-5" style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold" style={{color:'var(--fg-1)'}}><Newspaper className="inline h-4 w-4 mr-1.5" style={{color:'var(--accent)'}}/>So'nggi postlar</p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={createPost} style={{display:'inline-flex',alignItems:'center',gap:'5px',borderRadius:'999px',padding:'5px 12px',fontSize:'.78rem',fontWeight:600,color:'var(--accent-fg)',background:'var(--accent)',border:'none',cursor:'pointer'}}>
                    <Plus className="h-3.5 w-3.5"/> Yangi
                  </button>
                  <button type="button" onClick={()=>setTab('posts')} style={{fontSize:'.75rem',color:'var(--accent)',background:'none',border:'none',cursor:'pointer'}}>Barchasi →</button>
                </div>
              </div>
              {orderedPosts.slice(0,5).map(p=>(
                <ItemRow key={p.slug} title={resolveText(p.title,locale)} date={formatTimestamp(p.publishedAt, locale)} extra={`${p.comments.length} izoh`}
                  onEdit={()=>router.push(`/blog/${p.slug}?edit=1`)} onView={()=>router.push(`/blog/${p.slug}`)}
                  onDelete={()=>setConfirm({type:'post',slug:p.slug,title:resolveText(p.title,locale)})}/>
              ))}
            </div>
            {/* Projects mini */}
            <div className="t-card rounded-[22px] p-5" style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold" style={{color:'var(--fg-1)'}}><FolderKanban className="inline h-4 w-4 mr-1.5" style={{color:'var(--accent)'}}/>Loyihalar</p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={createProject} style={{display:'inline-flex',alignItems:'center',gap:'5px',borderRadius:'999px',padding:'5px 12px',fontSize:'.78rem',fontWeight:600,color:'var(--accent-fg)',background:'var(--accent)',border:'none',cursor:'pointer'}}>
                    <Plus className="h-3.5 w-3.5"/> Yangi
                  </button>
                  <button type="button" onClick={()=>setTab('projects')} style={{fontSize:'.75rem',color:'var(--accent)',background:'none',border:'none',cursor:'pointer'}}>Barchasi →</button>
                </div>
              </div>
              {projects.slice(0,5).map(p=>(
                <ItemRow key={p.slug} title={resolveText(p.title,locale)} date={p.year} extra={resolveText(p.status,locale)}
                  onEdit={()=>router.push(`/portfolio/${p.slug}?edit=1`)} onView={()=>router.push(`/portfolio/${p.slug}`)}
                  onDelete={()=>setConfirm({type:'project',slug:p.slug,title:resolveText(p.title,locale)})}/>
              ))}
            </div>
          </div>
        )}

        {/* ── POSTS ── */}
        {tab==='posts' && (
          <div className="t-card rounded-[22px] p-5" style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-base font-semibold" style={{color:'var(--fg-1)'}}>Blog postlar — barchasi ({posts.length})</p>
              <button type="button" onClick={createPost} style={{display:'inline-flex',alignItems:'center',gap:'6px',borderRadius:'999px',padding:'8px 18px',fontSize:'.83rem',fontWeight:600,color:'var(--accent-fg)',background:'var(--accent)',border:'none',cursor:'pointer'}}>
                <Plus className="h-4 w-4"/> Yangi post
              </button>
            </div>
            {orderedPosts.length===0 ? <p style={{textAlign:'center',padding:'32px',color:'var(--fg-4)',fontSize:'.875rem'}}>Hali post yo'q</p> : null}
            {orderedPosts.map(p=>(
              <ItemRow key={p.slug} title={resolveText(p.title,locale)} date={formatTimestamp(p.publishedAt, locale)} extra={`${p.readingTime}daq · ${p.likes}❤ · ${p.comments.length}izoh · ${p.featured?'⭐':'Oddiy'}`}
                onEdit={()=>router.push(`/blog/${p.slug}?edit=1`)} onView={()=>router.push(`/blog/${p.slug}`)}
                onDelete={()=>setConfirm({type:'post',slug:p.slug,title:resolveText(p.title,locale)})}/>
            ))}
          </div>
        )}

        {/* ── PROJECTS ── */}
        {tab==='projects' && (
          <div className="t-card rounded-[22px] p-5" style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-base font-semibold" style={{color:'var(--fg-1)'}}>Portfolio loyihalar ({projects.length})</p>
              <button type="button" onClick={createProject} style={{display:'inline-flex',alignItems:'center',gap:'6px',borderRadius:'999px',padding:'8px 18px',fontSize:'.83rem',fontWeight:600,color:'var(--accent-fg)',background:'var(--accent)',border:'none',cursor:'pointer'}}>
                <Plus className="h-4 w-4"/> Yangi loyiha
              </button>
            </div>
            {projects.length===0 ? <p style={{textAlign:'center',padding:'32px',color:'var(--fg-4)',fontSize:'.875rem'}}>Hali loyiha yo'q</p> : null}
            {projects.map(p=>(
              <ItemRow key={p.slug} title={resolveText(p.title,locale)} date={p.year} extra={`${resolveText(p.status,locale)} · ${p.tags.slice(0,3).join(', ')}`}
                onEdit={()=>router.push(`/portfolio/${p.slug}?edit=1`)} onView={()=>router.push(`/portfolio/${p.slug}`)}
                onDelete={()=>setConfirm({type:'project',slug:p.slug,title:resolveText(p.title,locale)})}/>
            ))}
          </div>
        )}

        {/* ── DISCUSSIONS ── */}
        {tab==='discussions' && (
          <div className="t-card rounded-[22px] p-5" style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-base font-semibold" style={{color:'var(--fg-1)'}}>Muhokamalar ({discussions.length})</p>
              <button type="button" onClick={createDiscussion} style={{display:'inline-flex',alignItems:'center',gap:'6px',borderRadius:'999px',padding:'8px 18px',fontSize:'.83rem',fontWeight:600,color:'var(--accent-fg)',background:'var(--accent)',border:'none',cursor:'pointer'}}>
                <Plus className="h-4 w-4"/> Yangi muhokama
              </button>
            </div>
            {orderedDisc.length===0 ? <p style={{textAlign:'center',padding:'32px',color:'var(--fg-4)',fontSize:'.875rem'}}>Hali muhokama yo'q</p> : null}
            {orderedDisc.map(d=>(
              <ItemRow key={d.slug} title={resolveText(d.title,locale)} date={formatTimestamp(d.createdAt, locale)} extra={`${resolveText(d.category,locale)} · ${d.messages.length} javob`}
                onEdit={()=>router.push(`/discussions/${d.slug}?edit=1`)} onView={()=>router.push(`/discussions/${d.slug}`)}
                onDelete={()=>setConfirm({type:'disc',slug:d.slug,title:resolveText(d.title,locale)})}/>
            ))}
          </div>
        )}

        {/* ── PROFILE EDITOR ── */}
        {tab==='profile' && (
          <div className="t-card rounded-[22px] p-5 sm:p-6" style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p style={{color:'var(--accent)',fontSize:'.7rem',fontWeight:700,letterSpacing:'.24em',textTransform:'uppercase'}}>PROFIL TAHRIRLASH</p>
                <p className="mt-1 text-lg font-semibold" style={{color:'var(--fg-1)'}}>Ko'nikmalar, stack, timeline va statistika</p>
              </div>
              <button type="button" onClick={saveProfile} style={{
                display:'inline-flex',alignItems:'center',gap:'6px',borderRadius:'999px',padding:'8px 20px',
                fontSize:'.83rem',fontWeight:600,cursor:'pointer',
                color:profileSaved?'var(--success)':'var(--accent-fg)',
                background:profileSaved?'var(--success-bg)':'var(--accent)',
                border:profileSaved?'1px solid var(--bd-success)':'none',
                transition:'all .3s',
              }}>
                {profileSaved?<><Check className="h-4 w-4"/> Saqlandi</>:<><Save className="h-4 w-4"/> Saqlash</>}
              </button>
            </div>
            <ProfileEditor profile={profileDraft} onChange={setProfileDraft}/>
          </div>
        )}

        {/* ── RESUME EDITOR ── */}
        {tab==='resume' && (
          <div className="t-card rounded-[22px] p-5 sm:p-6" style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p style={{color:'var(--accent)',fontSize:'.7rem',fontWeight:700,letterSpacing:'.24em',textTransform:'uppercase'}}>REZYUME TAHRIRLASH</p>
                <p className="mt-1 text-lg font-semibold" style={{color:'var(--fg-1)'}}>Tajriba, ta'lim va yutuqlar</p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/resume?edit=1" style={{display:'inline-flex',alignItems:'center',gap:'6px',borderRadius:'999px',padding:'8px 16px',fontSize:'.8rem',color:'var(--fg-3)',background:'var(--bg-surface)',border:'1px solid var(--bd)'}}>
                  <ExternalLink className="h-3.5 w-3.5"/> Sahifada ko'rish
                </Link>
                <button type="button" onClick={saveResume} style={{
                  display:'inline-flex',alignItems:'center',gap:'6px',borderRadius:'999px',padding:'8px 20px',
                  fontSize:'.83rem',fontWeight:600,cursor:'pointer',
                  color:resumeSaved?'var(--success)':'var(--accent-fg)',
                  background:resumeSaved?'var(--success-bg)':'var(--accent)',
                  border:resumeSaved?'1px solid var(--bd-success)':'none',
                }}>
                  {resumeSaved?<><Check className="h-4 w-4"/> Saqlandi</>:<><Save className="h-4 w-4"/> Saqlash</>}
                </button>
              </div>
            </div>
            <ResumeEditor resume={resumeDraft} onChange={setResumeDraft}/>
          </div>
        )}

        {/* ── USERS ── */}
        {tab==='users' && (
          <div className="t-card rounded-[22px] p-5" style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            <p className="text-sm font-semibold" style={{color:'var(--fg-1)'}}>Foydalanuvchilar</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {liveUsers.map(u => (
                <div key={u.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',borderRadius:'16px',border:'1px solid var(--bd)',background:'var(--bg-deep)',padding:'12px 16px'}}>
                  <div className="flex items-center gap-3">
                    <div style={{width:'8px',height:'8px',borderRadius:'50%',background:u.status==='online'?'var(--success)':u.status==='away'?'var(--warn)':'var(--fg-4)',flexShrink:0}}/>
                    <div>
                      <p className="text-sm font-medium" style={{color:'var(--fg-1)'}}>{u.name}</p>
                      <p style={{fontSize:'.75rem',color:'var(--fg-4)'}}>{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span style={{borderRadius:'999px',padding:'2px 8px',fontSize:'.68rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'.08em',background:'var(--bg-surface)',border:'1px solid var(--bd)',color:'var(--fg-4)'}}>{u.status}</span>
                    <span style={{borderRadius:'999px',padding:'2px 8px',fontSize:'.68rem',textTransform:'uppercase',background:'var(--accent-bg)',border:'1px solid var(--bd-accent)',color:'var(--accent)'}}>{u.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
