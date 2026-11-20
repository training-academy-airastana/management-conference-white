'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowUp, ArrowUpRight, CalendarDays, Check, ChevronDown, ChevronLeft, Clock3, Globe2, MapPin, Menu, Network, Plane, Radio, ShoppingCart, Sparkles, X } from 'lucide-react';
import { agenda, type Session } from '../data/agenda';
import { event } from '../data/event';
import { siteConfig } from '../data/siteConfig';
import { speakerPhotos } from '../data/speaker-photos';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const asset = (path: string) => `${basePath}${path}`;
type AgendaView = 'columns' | 'list' | 'timeline';
type ModalContent = { type: 'session'; id: string } | { type: 'speaker'; name: string; backTo?: string };
const views: { value: AgendaView; label: string }[] = [{ value: 'columns', label: 'Two columns' }, { value: 'list', label: 'Compact list' }, { value: 'timeline', label: 'Timeline' }];
const navigation = [['Overview', 'top'], ['The conference', 'about'], ['4 key topics', 'topics'], ['Agenda', 'agenda'], ['Questions', 'questions'], ['AI Vernissage', 'vernissage'], ['Participant information', 'information'], ['Venue, lunch & parking', 'venue']];
const navigationGroups = [
  { label: 'The conference', ids: ['top', 'about', 'topics'] },
  { label: 'On the day', ids: ['agenda', 'questions', 'vernissage'] },
  { label: 'Participant information', ids: ['information', 'venue'] },
];
function parsePerson(raw: string) {
  const [name, ...rest] = raw.replace(/^Moderator: /, '').split(', ');
  return { name, role: rest.join(', '), moderator: raw.startsWith('Moderator: ') };
}
const allPeople = agenda.flatMap(session => (session.people ?? []).map(parsePerson));
const title = (s: Session) => s.title.replace(/^#\d+\s*Panel discussion on\s*/i, 'Panel: ');

function Countdown() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const target = new Date(event.date).getTime();
  const diff = Math.max(0, target - (now ?? target));
  const values = [Math.floor(diff / 86400000), Math.floor(diff % 86400000 / 3600000), Math.floor(diff % 3600000 / 60000), Math.floor(diff % 60000 / 1000)];
  return <div className="countdown" aria-label="Time until the conference">{['Days', 'Hours', 'Minutes', 'Seconds'].map((label, i) => <div key={label}><b>{now === null ? '—' : String(values[i]).padStart(2, '0')}</b><span>{label}</span></div>)}</div>;
}

export default function Conference() {
  const [menu, setMenu] = useState(false);
  const [active, setActive] = useState('top');
  const [view, setView] = useState<AgendaView>('columns');
  const [modal, setModal] = useState<ModalContent | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>('The conference');
  const menuButton = useRef<HTMLButtonElement>(null);
  const navigationShell = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get('agenda');
    if (views.some(item => item.value === initial)) setView(initial as AgendaView);
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) setActive(visible[0].target.id);
    }, { rootMargin: '-10% 0px -55% 0px', threshold: [0, .1, .5] });
    navigation.forEach(([, id]) => { const node = document.getElementById(id); if (node) observer.observe(node); });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!menu) return;
    const main = document.querySelector<HTMLElement>('.conference-content');
    const wasInert = main?.inert ?? false;
    const oldOverflow = document.body.style.overflowY;
    if (main) main.inert = true;
    document.body.style.overflowY = 'hidden';
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMenu(false); menuButton.current?.focus(); }
      if (e.key === 'Tab') {
        const controls = [...(navigationShell.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)') ?? [])].filter(node => node.getClientRects().length > 0);
        if (!controls.length) return;
        const index = controls.indexOf(document.activeElement as HTMLElement);
        e.preventDefault();
        controls[(index + (e.shiftKey ? -1 : 1) + controls.length) % controls.length].focus();
      }
    };
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('keydown', close);
      document.body.style.overflowY = oldOverflow;
      if (main) main.inert = wasInert;
    };
  }, [menu]);
  const navigateTo = (id: string) => {
    setMenu(false);
    requestAnimationFrame(() => {
      const section = document.getElementById(id);
      section?.setAttribute('tabindex', '-1');
      section?.focus({ preventScroll: true });
    });
  };
  const changeView = (next: AgendaView) => { setView(next); const url = new URL(window.location.href); url.searchParams.set('agenda', next); window.history.replaceState(null, '', url); };

  return <div className="conference-shell">
    <a className="skip-link" href="#agenda">Skip to agenda</a>
    <div className="site-navigation-shell" ref={navigationShell}>
      <header className="site-masthead"><div className="masthead-inner"><button ref={menuButton} type="button" className="menu-toggle" onClick={() => setMenu(!menu)} aria-controls="conference-navigation" aria-expanded={menu} aria-label={menu ? 'Close navigation' : 'Open navigation'}>{menu ? <X size={22}/> : <Menu size={22}/>}<span>{menu ? 'Close' : 'Menu'}</span></button><a href="#top" onClick={() => navigateTo('top')} aria-label="Air Astana Group home"><Image src={asset('/air-astana-group.png')} alt="Air Astana Group" width={205} height={31} priority/></a><p className="masthead-conference">XVIII Management Conference<span>3 December 2026 / Almaty</span></p></div></header>
      <nav className="quick-navigation" aria-label="Main conference sections"><div>{navigation.filter(([, id]) => ['top', 'agenda', 'questions', 'vernissage'].includes(id)).map(([label, id]) => <a key={id} href={`#${id}`} aria-current={active === id ? 'location' : undefined} onClick={() => navigateTo(id)}>{label}</a>)}<button type="button" aria-expanded={menu} aria-controls="conference-navigation" onClick={() => setMenu(!menu)}>All sections<ChevronDown size={16} aria-hidden="true"/></button></div></nav>
      <div className="navigation-panel" hidden={!menu}>
        <nav id="conference-navigation" aria-label="All conference sections" className="grouped-navigation">{navigationGroups.map(group => <div className={`navigation-group ${expandedGroup === group.label ? 'is-expanded' : ''}`} key={group.label}>
          <h2>{group.label}</h2><button type="button" className="navigation-group-toggle" aria-expanded={expandedGroup === group.label} aria-controls={`navigation-group-${group.ids[0]}`} onClick={() => setExpandedGroup(expandedGroup === group.label ? null : group.label)}>{group.label}<ChevronDown size={18} aria-hidden="true"/></button>
          <div className="navigation-group-links" id={`navigation-group-${group.ids[0]}`}>{navigation.filter(([, id]) => group.ids.includes(id)).map(([label, id]) => <a key={id} href={`#${id}`} aria-current={active === id ? 'location' : undefined} onClick={() => navigateTo(id)}>{label}<ArrowUpRight size={15} aria-hidden="true"/></a>)}</div>
        </div>)}</nav>
      </div>
    </div>
    {menu && <button type="button" className="navigation-scrim" aria-label="Close navigation" onClick={() => { setMenu(false); menuButton.current?.focus(); }}/>}
    <main className="conference-content">
      <section className="conference-hero section" id="top">
        <p className="conference-name">{event.name}</p><h1>Going Global:<br/>From Ambition to Execution</h1>
        <div className="hero-facts">
          <div><CalendarDays size={20}/><p><span>Date</span><strong>{event.dateLabel}</strong></p></div>
          <div><Radio size={20}/><p><span>Format</span><strong>{event.format}</strong></p></div>
          <div><MapPin size={20}/><p><span>Venue</span><strong>{event.venue}</strong><span>{event.address}</span></p></div>
        </div>
        <div className="hero-countdown"><p>The conference starts in</p><Countdown/></div>
      </section>
      <section className="section quote-section" id="about"><h2>From Ambition to Execution</h2><figure><blockquote>{event.ceoQuote}</blockquote><figcaption>Ibrahim Canliel, CEO</figcaption></figure></section>
      <section className="section topics-section" id="topics"><div className="section-heading"><h2>4 key topics</h2><p>The four priorities at the centre of our conference conversations.</p></div><div className="topics-grid">{event.topics.map((topic, i) => { const Icon = [Network, Globe2, ShoppingCart, Plane][i]; return <div className="topic" key={topic}><Icon size={28} strokeWidth={1.5} aria-hidden="true"/><h3>{topic}</h3></div>; })}</div></section>
      <section className="section agenda-section" id="agenda">
        <div className="section-heading agenda-heading"><div><h2>Agenda</h2><p>Thursday, 3 December 2026 / Almaty time (UTC+5)</p></div><span className="agenda-help"><Clock3 size={16}/>Select a time for session details</span></div>
        <div className="agenda-toolbar"><div className="view-switch" role="group" aria-label="Agenda layout">{views.map(item => <button type="button" key={item.value} aria-pressed={view === item.value} onClick={() => changeView(item.value)}>{item.label}</button>)}</div><label className="mobile-view-select">View<select value={view} onChange={e => changeView(e.target.value as AgendaView)}>{views.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><p>Select a speaker’s name to meet them.</p></div>
        <Agenda view={view} open={setModal}/>
        <p className="agenda-note">The 14:00–14:20 quiz and 14:15–15:15 panel overlap in the supplied programme. Times are shown as provided.</p>
      </section>
      <section className="section questions-section" id="questions"><div><h2>Questions</h2><p>Questions for the conference speakers.</p></div>{siteConfig.questionsUrl ? <a className="primary-link" href={siteConfig.questionsUrl} target="_blank" rel="noreferrer">Open the question form<ArrowUpRight size={18}/></a> : <p className="pending-copy">The question form will be available here.</p>}</section>
      <section className="section vernissage-section" id="vernissage"><Sparkles size={28} strokeWidth={1.5} aria-hidden="true"/><div><h2>AI Vernissage</h2><p>{siteConfig.aiVernissageDescription || 'Details will be shared here ahead of the conference.'}</p></div></section>
      <section className="section information-section" id="information"><h2>Important information<br/>for participants</h2><div className="information-grid">
        <article><h3>Timing</h3><p>We kindly ask all participants to follow the conference schedule and arrive on time. Each session is planned according to a set schedule, and your punctuality will help us keep the event running smoothly.</p></article>
        <article><h3>Registration via KC App</h3><p>Registration for the conference will take place through KC App using your electronic business card.</p><p>Please make sure that you have KC App installed and that it is working properly before the event.</p><p>If you do not have the app yet, please download it using the link below:</p>{siteConfig.kcAppUrl ? <a className="text-link" href={siteConfig.kcAppUrl} target="_blank" rel="noreferrer">Download KC App<ArrowUpRight size={16}/></a> : <p className="pending-copy">KC App download link to be added.</p>}</article>
        <article><h3>Attendance changes</h3><p>If your plans change and you are no longer able to attend the conference, please make sure to inform the organisers in advance.</p></article>
        <article><h3>Online participation</h3><p>Please inform your teams that they also have the opportunity to join the conference online.</p>{siteConfig.onlineUrl && <a className="text-link" href={siteConfig.onlineUrl} target="_blank" rel="noreferrer">Join online<ArrowUpRight size={16}/></a>}</article>
      </div></section>
      <section className="section venue-section" id="venue"><h2>Venue, lunch &amp; parking</h2><div className="venue-grid">
        <article><MapPin size={22} aria-hidden="true"/><h3>Venue</h3><p><strong>{event.venue}</strong><br/>{event.address}</p><div className="map-links"><a href={event.directionsUrl} target="_blank" rel="noreferrer">Google Maps<ArrowUpRight size={15}/></a><a href="https://2gis.kz/almaty/search/InterContinental%20Almaty" target="_blank" rel="noreferrer">2GIS<ArrowUpRight size={15}/></a></div></article>
        <article><Clock3 size={22} aria-hidden="true"/><h3>Lunch</h3><p>{siteConfig.lunchDescription || 'Lunch details and arrangements will be shared here.'}</p></article>
        <article><Check size={22} aria-hidden="true"/><h3>Parking</h3><p>Complimentary parking is available at the venue. However, parking spaces are limited, so we recommend using a taxi to get to the conference.</p></article>
      </div></section>
      <footer className="conference-footer"><p>Air Astana Group<br/><span>XVIII Management Conference / 3 December 2026</span></p><a href="#top">Back to top<ArrowUp size={17}/></a></footer>
    </main>
    <DetailDialog content={modal} setContent={setModal}/>
  </div>;
}

function Agenda({ view, open }: { view: AgendaView; open: (content: ModalContent) => void }) {
  const groups = view === 'columns' ? [{ label: 'Morning / 09:00–14:00', sessions: agenda.slice(0, 7) }, { label: 'Afternoon / 14:00–17:50', sessions: agenda.slice(7) }] : [{ label: '09:00–17:50', sessions: agenda }];
  return <div className={`agenda-layout agenda-${view}`} data-view={view}>{groups.map(group => <div className="agenda-group" key={group.label}><h3 className="agenda-group-title">{group.label}</h3><div>{group.sessions.map(s => <article className={`agenda-row session-${s.kind}`} key={s.id} data-session-id={s.id}>
    <button type="button" className="session-time" onClick={() => open({ type: 'session', id: s.id })} aria-label={`${s.start} to ${s.end}: ${title(s)}. Open session details`}><b>{s.start}</b><span>{s.end}</span></button>
    <div className="session-main"><button type="button" className="session-title" onClick={() => open({ type: 'session', id: s.id })}>{title(s)}<ArrowUpRight size={14} aria-hidden="true"/></button>{s.people && <div className="session-speakers">{s.people.map(raw => { const p = parsePerson(raw); return <button type="button" className="speaker-name" key={p.name} onClick={() => open({ type: 'speaker', name: p.name })} aria-label={`About ${p.name}${p.moderator ? ', moderator' : ''}`}>{p.name}{p.moderator && <span> (moderator)</span>}</button>; })}</div>}</div>
  </article>)}</div></div>)}</div>;
}

function DetailDialog({ content, setContent }: { content: ModalContent | null; setContent: (content: ModalContent | null) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const isOpen = content !== null;
  useEffect(() => {
    const node = dialog.current;
    if (!node || !isOpen) return;
    opener.current = document.activeElement as HTMLElement;
    if (!node.open) node.showModal();
    const oldOverflow = document.body.style.overflowY;
    document.body.style.overflowY = 'hidden';
    return () => { document.body.style.overflowY = oldOverflow; if (node.open) node.close(); opener.current?.focus({ preventScroll: true }); };
  }, [isOpen]);
  useEffect(() => {
    if (isOpen) dialog.current?.querySelector<HTMLButtonElement>('.dialog-close')?.focus();
  }, [content, isOpen]);
  const session = content?.type === 'session' ? agenda.find(s => s.id === content.id) : undefined;
  const person = content?.type === 'speaker' ? allPeople.find(p => p.name === content.name) : undefined;
  const photo = person ? speakerPhotos[person.name] : undefined;
  return <dialog ref={dialog} className="detail-dialog" aria-labelledby="dialog-heading" onCancel={() => setContent(null)} onKeyDown={e => {
    if (e.key !== 'Tab') return;
    const controls = [...e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], select, [tabindex="0"]')].filter(node => node.getClientRects().length > 0);
    if (!controls.length) return;
    e.preventDefault();
    const index = controls.indexOf(document.activeElement as HTMLElement);
    controls[(index + (e.shiftKey ? -1 : 1) + controls.length) % controls.length].focus();
  }} onClick={e => { if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) setContent(null); } }}>
    <div className="dialog-toolbar">{content?.type === 'speaker' && content.backTo ? <button type="button" className="dialog-back" onClick={() => setContent({ type: 'session', id: content.backTo! })}><ChevronLeft size={17}/>Back to session</button> : <span>{session ? 'Session details' : 'Meet the speaker'}</span>}<button type="button" className="dialog-close" aria-label="Close details" onClick={() => setContent(null)} autoFocus><X size={22}/></button></div>
    {session && <div className="session-dialog-content"><p className="dialog-time"><CalendarDays size={18}/>3 December 2026 / {session.start}–{session.end}</p><h2 id="dialog-heading">{title(session)}</h2>{session.description && <p className="session-description">{session.description}</p>}{session.people && <div className="dialog-speakers">{session.people.map(raw => { const p = parsePerson(raw); const picture = speakerPhotos[p.name]; return <button type="button" key={p.name} className="dialog-person" onClick={() => setContent({ type: 'speaker', name: p.name, backTo: session.id })}><span className="person-thumb">{picture ? <Image src={asset(picture.src)} alt="" fill sizes="48px" style={{ objectFit: 'cover', objectPosition: picture.position }}/> : <span aria-hidden="true">{p.name.split(' ').map(x => x[0]).slice(0, 2).join('')}</span>}</span><span><strong>{p.name}</strong>{p.moderator && <small>Moderator</small>}<small>{p.role}</small></span><ArrowUpRight size={18}/></button>; })}</div>}{session.organization && <p className="session-organisation">{session.organization}</p>}<p className="dialog-location"><MapPin size={17}/>{event.venue}</p></div>}
    {person && <div className="speaker-dialog-content"><div className="speaker-portrait">{photo ? <Image src={asset(photo.src)} alt={person.name} fill sizes="(max-width: 600px) 80vw, 240px" style={{ objectFit: 'cover', objectPosition: photo.position }}/> : <div className="missing-portrait"><span>{person.name.split(' ').map(x => x[0]).slice(0, 2).join('')}</span><p>Portrait to be provided</p></div>}</div><div><h2 id="dialog-heading">{person.name}</h2><p className="speaker-role">{person.role}</p>{person.moderator && <p className="moderator-label">Conference moderator</p>}<h3>At the conference</h3><div className="speaker-sessions">{agenda.filter(s => s.people?.some(raw => parsePerson(raw).name === person.name)).map(s => <button type="button" key={s.id} onClick={() => setContent({ type: 'session', id: s.id })}><span>{s.start}–{s.end}</span>{title(s)}<ArrowUpRight size={16}/></button>)}</div></div></div>}
  </dialog>;
}
