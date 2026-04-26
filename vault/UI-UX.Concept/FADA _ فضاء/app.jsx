const { useState, useEffect, useRef, useMemo } = React;

// ——————————————————————————————————————————————————
// Icons (inline SVG — Lucide-style stroke 1.75)
// ——————————————————————————————————————————————————
const Icon = ({ d, size = 18, fill = "none", stroke = "currentColor", strokeWidth = 1.75, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
    {d ? <path d={d} /> : children}
  </svg>
);
const IconHome = (p) => <Icon {...p} d="M3 12l9-9 9 9M5 10v10h14V10" />;
const IconFilm = (p) => <Icon {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 8h18M3 16h18M8 3v18M16 3v18"/></Icon>;
const IconTv = (p) => <Icon {...p}><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M8 3l4 4 4-4"/></Icon>;
const IconStar = (p) => <Icon {...p} d="M12 2l3 7h7l-5.5 4.5 2 7.5L12 16l-6.5 5 2-7.5L2 9h7z" />;
const IconBookmark = (p) => <Icon {...p} d="M5 3h14v18l-7-4-7 4V3z" />;
const IconSearch = (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></Icon>;
const IconSettings = (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 01-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 01-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 012.8-2.8l.1.1a1.7 1.7 0 001.8.3h.1a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 012.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8v.1a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/></Icon>;
const IconChevronLeft = (p) => <Icon {...p} d="M15 18l-6-6 6-6"/>;
const IconChevronRight = (p) => <Icon {...p} d="M9 6l6 6-6 6"/>;
const IconChevronDown = (p) => <Icon {...p} d="M6 9l6 6 6-6"/>;
const IconArrowLeft = (p) => <Icon {...p} d="M19 12H5M12 19l-7-7 7-7"/>;
const IconPlay = (p) => <Icon {...p} fill="currentColor" stroke="none" d="M6 4l14 8-14 8V4z"/>;
const IconPlus = (p) => <Icon {...p} d="M12 5v14M5 12h14"/>;
const IconCheck = (p) => <Icon {...p} d="M20 6L9 17l-5-5"/>;
const IconExternalLink = (p) => <Icon {...p}><path d="M15 3h6v6M10 14L21 3M21 14v7H3V3h7"/></Icon>;
const IconSparkle = (p) => <Icon {...p} d="M12 3v6M12 15v6M3 12h6M15 12h6M7 7l3 3M14 14l3 3M7 17l3-3M14 10l3-3"/>;

// ——————————————————————————————————————————————————
// Mock data
// ——————————————————————————————————————————————————
const TITLES = [
  { id: 1, t: "الرسالة", lat: "The Message", y: 1976, r: 8.2, genre: "دراما · تاريخي", hue: 38 },
  { id: 2, t: "عمارة يعقوبيان", lat: "Yacoubian Building", y: 2006, r: 7.6, genre: "دراما", hue: 24 },
  { id: 3, t: "كابتن ماجد", lat: "Captain Tsubasa", y: 1983, r: 8.4, genre: "أنمي · رياضة", hue: 210 },
  { id: 4, t: "وادي الذئاب", lat: "Valley of the Wolves", y: 2003, r: 7.9, genre: "أكشن · تركي", hue: 350 },
  { id: 5, t: "لعبة الحبار", lat: "Squid Game", y: 2021, r: 8.0, genre: "إثارة · كوري", hue: 150 },
  { id: 6, t: "مسلسل قيامة أرطغرل", lat: "Diriliş: Ertuğrul", y: 2014, r: 8.8, genre: "تاريخي · تركي", hue: 30 },
  { id: 7, t: "لا تلمسوا نسائي", lat: "Don't Touch My Women", y: 2020, r: 7.2, genre: "كوميديا", hue: 300 },
  { id: 8, t: "فيلا ٦٩", lat: "Villa 69", y: 2013, r: 7.5, genre: "دراما", hue: 180 },
  { id: 9, t: "الفيل الأزرق", lat: "The Blue Elephant", y: 2014, r: 8.1, genre: "إثارة نفسية", hue: 220 },
  { id: 10, t: "هجوم العمالقة", lat: "Attack on Titan", y: 2013, r: 9.0, genre: "أنمي · أكشن", hue: 10 },
  { id: 11, t: "حكاية جني", lat: "Jinn Tales", y: 2019, r: 7.0, genre: "رعب · خيال", hue: 270 },
  { id: 12, t: "ليلة رأس السنة", lat: "New Year's Eve", y: 2018, r: 7.3, genre: "رومانسي", hue: 340 },
  { id: 13, t: "بنات الباشا", lat: "Daughters of the Pasha", y: 2011, r: 7.7, genre: "دراما · تاريخي", hue: 45 },
  { id: 14, t: "حارة اليهود", lat: "The Jewish Quarter", y: 2015, r: 7.8, genre: "دراما", hue: 60 },
  { id: 15, t: "بركة يقابل بركة", lat: "Barakah Meets Barakah", y: 2016, r: 7.1, genre: "كوميديا سعودية", hue: 120 },
  { id: 16, t: "الأصليين", lat: "The Originals", y: 2017, r: 7.4, genre: "إثارة · غموض", hue: 280 },
];

const FEATURED_COLLECTIONS = [
  {
    kicker: "مجموعة مختارة · تحريرية",
    title: "أساسيات السينما العربية",
    desc: "خمسة عشر فيلماً شكّلت وجدان السينما في العالم العربي، من الروائع الكلاسيكية إلى الأعمال المعاصرة التي لا تزال تُدرَّس.",
    count: 15,
    badge: "ع",
    nodes: [
      { tx:"الرسالة", y:1976, nx:0.82, ny:0.22, hue:38 },
      { tx:"عمارة يعقوبيان", y:2006, nx:0.68, ny:0.35, hue:24 },
      { tx:"الفيل الأزرق", y:2014, nx:0.55, ny:0.2, hue:220 },
      { tx:"بركة يقابل بركة", y:2016, nx:0.42, ny:0.42, hue:120 },
      { tx:"حارة اليهود", y:2015, nx:0.28, ny:0.28, hue:60 },
      { tx:"فيلا ٦٩", y:2013, nx:0.18, ny:0.52, hue:180 },
      { tx:"الأصليين", y:2017, nx:0.34, ny:0.62, hue:280 },
    ],
    connections: [[0,1],[1,2],[1,3],[3,4],[4,5],[3,6],[6,5]],
  },
  {
    kicker: "مجموعة مختارة · تركي",
    title: "الدراما التركية الذهبية",
    desc: "من أزقة إسطنبول إلى سهول الأناضول، اثنا عشر مسلسلاً تركياً رسمت ملامح موجة درامية اجتاحت العالم العربي والبلقان معاً.",
    count: 12,
    badge: "ت",
    nodes: [
      { tx:"أرطغرل", y:2014, nx:0.78, ny:0.28, hue:18 },
      { tx:"وادي الذئاب", y:2003, nx:0.62, ny:0.18, hue:350 },
      { tx:"عثمان", y:2019, nx:0.48, ny:0.3, hue:35 },
      { tx:"العشق الممنوع", y:2008, nx:0.35, ny:0.18, hue:320 },
      { tx:"فاطمة", y:2010, nx:0.22, ny:0.36, hue:300 },
      { tx:"حب أعمى", y:2013, nx:0.4, ny:0.54, hue:340 },
      { tx:"القرن العظيم", y:2011, nx:0.6, ny:0.5, hue:45 },
    ],
    connections: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,2]],
  },
  {
    kicker: "مجموعة مختارة · أنمي",
    title: "أنمي التسعينيات",
    desc: "الأنمي الذي كبرنا عليه — كابتن ماجد، غريندايزر، ساندي بل. اثنان وعشرون عملاً جمعت جيلاً كاملاً حول شاشة واحدة.",
    count: 22,
    badge: "A",
    nodes: [
      { tx:"كابتن ماجد", y:1983, nx:0.7, ny:0.22, hue:210 },
      { tx:"غريندايزر", y:1975, nx:0.55, ny:0.38, hue:240 },
      { tx:"ساندي بل", y:1981, nx:0.38, ny:0.22, hue:330 },
      { tx:"كونان", y:1978, nx:0.25, ny:0.4, hue:200 },
      { tx:"عدنان ولينا", y:1978, nx:0.82, ny:0.45, hue:180 },
      { tx:"بوكيمون", y:1997, nx:0.45, ny:0.58, hue:260 },
    ],
    connections: [[0,1],[1,2],[2,3],[1,4],[1,5],[3,5]],
  },
  {
    kicker: "مجموعة مختارة · كوري",
    title: "موجة الدراما الكورية الجديدة",
    desc: "ثمانية عشر مسلسلاً كورياً غيّرت قواعد اللعبة — من ميلودراما الأحياء المنسية إلى ألغاز التكنو-ثريلر المعاصرة.",
    count: 18,
    badge: "K",
    nodes: [
      { tx:"لعبة الحبار", y:2021, nx:0.75, ny:0.32, hue:150 },
      { tx:"طفيلي", y:2019, nx:0.6, ny:0.2, hue:140 },
      { tx:"قصر اللعبة", y:2020, nx:0.48, ny:0.4, hue:170 },
      { tx:"القطار إلى بوسان", y:2016, nx:0.3, ny:0.3, hue:10 },
      { tx:"عالم متزوج", y:2020, nx:0.2, ny:0.5, hue:340 },
      { tx:"ما وراء البوابة", y:2019, nx:0.4, ny:0.6, hue:200 },
    ],
    connections: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,2]],
  },
  {
    kicker: "مجموعة مختارة · ليالي",
    title: "ليالي الرعب المختارة",
    desc: "تسعة أفلام رعب تتسلّل تحت الجلد — لمَن يحبّ الظلام بأدب، وبعض الصرخات الموزونة بعناية.",
    count: 9,
    badge: "!",
    nodes: [
      { tx:"حكاية جني", y:2019, nx:0.7, ny:0.26, hue:285 },
      { tx:"الفيل الأزرق", y:2014, nx:0.5, ny:0.18, hue:255 },
      { tx:"الأصليين", y:2017, nx:0.36, ny:0.36, hue:300 },
      { tx:"الشياطين", y:2018, nx:0.55, ny:0.5, hue:320 },
      { tx:"باب الملكوت", y:2016, nx:0.22, ny:0.52, hue:280 },
    ],
    connections: [[0,1],[1,2],[2,3],[2,4],[3,0]],
  },
];

const COLLECTIONS_EDITORIAL = [
  { kicker: "عربي · تحريرية", title: "أساسيات السينما العربية", count: 15, hueA: 38, hueB: 24 },
  { kicker: "تركي · تحريرية", title: "الدراما التركية الذهبية", count: 12, hueA: 10, hueB: 350 },
  { kicker: "أنمي · تحريرية", title: "أنمي التسعينيات", count: 22, hueA: 210, hueB: 270 },
  { kicker: "كوري · تحريرية", title: "موجة الدراما الكورية الجديدة", count: 18, hueA: 150, hueB: 180 },
  { kicker: "خيال · تحريرية", title: "ليالي الرعب المختارة", count: 9, hueA: 280, hueB: 340 },
  { kicker: "كلاسيكيات", title: "روائع القرن العشرين", count: 20, hueA: 45, hueB: 60 },
];

// ——————————————————————————————————————————————————
// Poster placeholder — colorful, themed per title
// ——————————————————————————————————————————————————
function PosterGraphic({ title, hue = 40 }) {
  return (
    <div className="ph" style={{
      background: `linear-gradient(160deg, oklch(0.28 0.08 ${hue}) 0%, oklch(0.15 0.04 ${hue}) 60%, oklch(0.1 0.02 ${hue}) 100%)`,
    }}>
      <svg viewBox="0 0 120 180" width="100%" height="100%" style={{position:'absolute',inset:0,opacity:0.22}}>
        <defs>
          <pattern id={`p${hue}`} width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="0.4" fill="#fff" />
          </pattern>
        </defs>
        <rect width="120" height="180" fill={`url(#p${hue})`} />
        {/* subtle constellation sketch */}
        <g stroke="#E6B64A" strokeWidth="0.3" opacity="0.5" fill="none">
          <circle cx="40" cy="60" r="1.6" fill="#E6B64A"/>
          <circle cx="75" cy="80" r="1.2" fill="#E6B64A"/>
          <circle cx="55" cy="120" r="1.4" fill="#E6B64A"/>
          <circle cx="90" cy="140" r="1" fill="#E6B64A"/>
          <line x1="40" y1="60" x2="75" y2="80"/>
          <line x1="75" y1="80" x2="55" y2="120"/>
          <line x1="55" y1="120" x2="90" y2="140"/>
        </g>
      </svg>
      <div style={{position:'absolute', bottom:14, insetInlineStart:12, insetInlineEnd:12, zIndex:2}}>
        <div style={{fontFamily:'IBM Plex Sans Arabic', fontSize:13, fontWeight:700, color:'#fff', lineHeight:1.2, textShadow:'0 1px 6px rgba(0,0,0,0.6)'}}>{title}</div>
      </div>
    </div>
  );
}

// ——————————————————————————————————————————————————
// Logo — ف drawn as 4 star points
// ——————————————————————————————————————————————————
function LogoMark() {
  return (
    <div className="brand-mark">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        {/* connecting lines */}
        <g stroke="#E6B64A" strokeWidth="0.7" opacity="0.45">
          <line x1="10" y1="12" x2="22" y2="10"/>
          <line x1="22" y1="10" x2="30" y2="18"/>
          <line x1="30" y1="18" x2="22" y2="28"/>
          <line x1="22" y1="28" x2="10" y2="12"/>
        </g>
        {/* stars */}
        <g fill="#E6B64A">
          <circle className="star-pt" cx="10" cy="12" r="2"/>
          <circle className="star-pt" cx="22" cy="10" r="1.6"/>
          <circle className="star-pt" cx="30" cy="18" r="2.2"/>
          <circle className="star-pt" cx="22" cy="28" r="1.8"/>
        </g>
      </svg>
    </div>
  );
}

// ——————————————————————————————————————————————————
// Sidebar
// ——————————————————————————————————————————————————
function Sidebar({ route, setRoute, toast }) {
  const items = [
    { key: "home", ar: "الرئيسية", Icon: IconHome },
    { key: "movies", ar: "الأفلام", Icon: IconFilm },
    { key: "shows", ar: "المسلسلات", Icon: IconTv },
    { key: "collections", ar: "المجموعات", Icon: IconStar },
    { key: "watchlist", ar: "قائمتي", Icon: IconBookmark },
    { key: "search", ar: "البحث", Icon: IconSearch },
  ];
  const more = [
    {ar:"IPTV", v:"1.1"},
    {ar:"المانجا", v:"1.2"},
    {ar:"الرياضة المباشرة", v:"1.1"}
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <LogoMark />
      </div>
      <div className="nav">
        {items.map(({key, ar, Icon: Ic}) => (
          <button key={key} className={`nav-item ${route===key?'active':''}`} onClick={()=>setRoute(key)} aria-label={ar}>
            <Ic className="icon" />
            <span className="label">{ar}</span>
          </button>
        ))}
        <div className="nav-divider"/>
        {more.map(it => (
          <button key={it.ar} className="nav-item" onClick={()=>toast(`قريبًا في الإصدار v${it.v} — ${it.ar}`)} aria-label={it.ar}>
            <IconSparkle className="icon" style={{opacity:0.45}}/>
            <span className="badge-dot"/>
            <span className="label">{it.ar} · <span style={{color:'var(--accent-gold)',fontFamily:'IBM Plex Mono',fontSize:10}}>v{it.v}</span></span>
          </button>
        ))}
        <div className="nav-divider"/>
        <button className={`nav-item ${route==='settings'?'active':''}`} onClick={()=>setRoute('settings')} aria-label="الإعدادات">
          <IconSettings className="icon" />
          <span className="label">الإعدادات</span>
        </button>
      </div>
      <div className="sidebar-footer">FADA · v0.1</div>
    </aside>
  );
}

// ——————————————————————————————————————————————————
// Floating search pill
// ——————————————————————————————————————————————————
function SearchPill({ setRoute }) {
  const [expanded, setExpanded] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "/" && e.target.tagName !== "INPUT") { e.preventDefault(); setExpanded(true); setTimeout(()=>ref.current?.focus(),10); }
      if (e.key === "Escape") { setExpanded(false); ref.current?.blur(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  return (
    <div className={`search-pill ${expanded?'expanded':''}`} onClick={()=>{setExpanded(true); setTimeout(()=>ref.current?.focus(),10);}}>
      <IconSearch size={16} />
      <input ref={ref} value={q} onChange={e=>setQ(e.target.value)} placeholder="ابحث عن عنوان، ممثل، أو مجموعة…" onBlur={()=>!q && setExpanded(false)} onKeyDown={e=>e.key==='Enter'&&setRoute('search')} />
      <span className="kbd">/</span>
    </div>
  );
}

// ——————————————————————————————————————————————————
// Constellation hero canvas
// ——————————————————————————————————————————————————
function ConstellationHero({ onHoverStar }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const stateRef = useRef({ mouse: {x:0,y:0}, stars: [], nodes: [], connections: [], morph: 1 });
  const [hover, setHover] = useState(null);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState("idle"); // idle | leaving | entering
  const [paused, setPaused] = useState(false);
  const CYCLE = 7000;
  const current = FEATURED_COLLECTIONS[idx];

  // Auto-advance
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => goto((idx + 1) % FEATURED_COLLECTIONS.length), CYCLE);
    return () => clearTimeout(t);
  }, [idx, paused]);

  const goto = (next) => {
    if (next === idx) return;
    setPhase("leaving");
    setTimeout(() => {
      setIdx(next);
      // trigger constellation morph
      stateRef.current.morph = 0;
      stateRef.current.lineProgress = 0;
      stateRef.current.prevNodes = stateRef.current.nodes.map(n=>({...n}));
      setPhase("entering");
      setTimeout(() => setPhase("idle"), 30);
    }, 450);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let w = canvas.offsetWidth, h = canvas.offsetHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const stars = [];
    for (let i=0; i<140; i++) {
      stars.push({
        x: Math.random()*w, y: Math.random()*h,
        r: Math.random()<0.85 ? 0.5 + Math.random()*0.8 : 1 + Math.random()*1.2,
        phase: Math.random()*Math.PI*2,
        speed: 0.4 + Math.random()*0.8,
        base: 0.3 + Math.random()*0.5,
      });
    }

    stateRef.current = {
      stars,
      nodes: FEATURED_COLLECTIONS[0].nodes.map(n=>({...n})),
      connections: FEATURED_COLLECTIONS[0].connections,
      mouse: {x:w/2,y:h/2}, w, h, hoverIdx: -1, lineProgress: 0, morph: 1,
      prevNodes: FEATURED_COLLECTIONS[0].nodes.map(n=>({...n})),
    };

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      stateRef.current.mouse = { x: mx, y: my };
      const s = stateRef.current;
      let hit = -1;
      for (let i=0; i<s.nodes.length; i++) {
        const n = s.nodes[i];
        const nx = n.nx * s.w, ny = n.ny * s.h;
        const dx = mx - nx, dy = my - ny;
        if (Math.sqrt(dx*dx+dy*dy) < 36) { hit = i; break; }
      }
      s.hoverIdx = hit;
      if (hit >= 0) {
        const n = s.nodes[hit];
        setHover({ x: n.nx * s.w, y: n.ny * s.h, title: n.tx, year: n.y });
      } else {
        setHover(null);
      }
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", () => { setHover(null); stateRef.current.hoverIdx = -1; });

    const resize = () => {
      w = canvas.offsetWidth; h = canvas.offsetHeight;
      canvas.width = w*dpr; canvas.height = h*dpr;
      ctx.scale(dpr,dpr);
      stateRef.current.w = w; stateRef.current.h = h;
    };
    window.addEventListener("resize", resize);

    let t0 = performance.now();
    const tick = (now) => {
      const t = (now - t0) / 1000;
      const s = stateRef.current;
      ctx.clearRect(0, 0, s.w, s.h);

      const px = (s.mouse.x - s.w/2) / s.w * 8;
      const py = (s.mouse.y - s.h/2) / s.h * 8;

      for (const st of s.stars) {
        const a = st.base + Math.sin(t*st.speed + st.phase) * 0.3;
        ctx.globalAlpha = Math.max(0.08, a);
        ctx.fillStyle = "#E8ECF5";
        ctx.beginPath();
        ctx.arc(st.x + px*0.3, st.y + py*0.3, st.r, 0, Math.PI*2);
        ctx.fill();
        if (st.r > 1) {
          ctx.globalAlpha = a * 0.15;
          ctx.beginPath();
          ctx.arc(st.x + px*0.3, st.y + py*0.3, st.r*3, 0, Math.PI*2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      s.lineProgress = Math.min(1, s.lineProgress + 0.008);
      s.morph = Math.min(1, s.morph + 0.025);
      const m = s.morph < 1 ? (1 - Math.pow(1 - s.morph, 3)) : 1; // ease-out-cubic

      // interpolated node positions
      const lerp = (a,b,k)=>a+(b-a)*k;
      const getPos = (i) => {
        const cur = s.nodes[i];
        const prev = s.prevNodes[i % s.prevNodes.length] || cur;
        return {
          x: lerp(prev.nx, cur.nx, m) * s.w + px,
          y: lerp(prev.ny, cur.ny, m) * s.h + py,
          hue: cur.hue,
        };
      };

      ctx.lineWidth = 1;
      for (let ci=0; ci<s.connections.length; ci++) {
        const [a,b] = s.connections[ci];
        if (a >= s.nodes.length || b >= s.nodes.length) continue;
        const pa = getPos(a), pb = getPos(b);
        const hovered = s.hoverIdx === a || s.hoverIdx === b;
        const prog = Math.min(1, Math.max(0, (s.lineProgress - ci*0.08) / 0.4));
        const ex = pa.x + (pb.x-pa.x)*prog;
        const ey = pa.y + (pb.y-pa.y)*prog;
        ctx.strokeStyle = hovered ? "rgba(230,182,74,0.75)" : "rgba(230,182,74,0.22)";
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }

      for (let i=0; i<s.nodes.length; i++) {
        const pos = getPos(i);
        const n = s.nodes[i];
        const hovered = s.hoverIdx === i;
        const scale = hovered ? 1.18 : 1;
        const R = 34 * scale * (0.4 + 0.6*m);

        const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, R*2.2);
        grad.addColorStop(0, `oklch(0.7 0.15 ${n.hue} / 0.55)`);
        grad.addColorStop(0.4, `oklch(0.5 0.1 ${n.hue} / 0.25)`);
        grad.addColorStop(1, `oklch(0.3 0.05 ${n.hue} / 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(pos.x, pos.y, R*2.2, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = `oklch(0.22 0.06 ${n.hue})`;
        ctx.beginPath(); ctx.arc(pos.x, pos.y, R, 0, Math.PI*2); ctx.fill();

        const tg = ctx.createRadialGradient(pos.x-R*0.3, pos.y-R*0.3, 0, pos.x, pos.y, R);
        tg.addColorStop(0, `oklch(0.45 0.12 ${n.hue} / 0.5)`);
        tg.addColorStop(1, `oklch(0.18 0.04 ${n.hue} / 0)`);
        ctx.fillStyle = tg;
        ctx.beginPath(); ctx.arc(pos.x, pos.y, R, 0, Math.PI*2); ctx.fill();

        ctx.strokeStyle = hovered ? "rgba(230,182,74,0.9)" : "rgba(230,182,74,0.35)";
        ctx.lineWidth = hovered ? 1.6 : 1;
        ctx.beginPath(); ctx.arc(pos.x, pos.y, R, 0, Math.PI*2); ctx.stroke();

        ctx.fillStyle = "rgba(230,182,74,0.95)";
        ctx.beginPath(); ctx.arc(pos.x, pos.y, 2.4, 0, Math.PI*2); ctx.fill();
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Update constellation state when idx changes
  useEffect(() => {
    const next = FEATURED_COLLECTIONS[idx];
    stateRef.current.nodes = next.nodes.map(n=>({...n}));
    stateRef.current.connections = next.connections;
  }, [idx]);

  return (
    <div className="hero" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}>
      <canvas ref={canvasRef} />
      <div className="hero-stars-count">
        <span className="dot"/>
        <span>CONSTELLATION · {current.nodes.length} NODES · {current.connections.length} LINES</span>
      </div>
      <div className={`hero-content ${phase}`}>
        <div className="fade-layer">
          <div className="hero-kicker">{current.kicker}</div>
          <h1 className="hero-title">{current.title}</h1>
          <p className="hero-desc">{current.desc}</p>
          <div className="hero-actions">
            <button className="btn btn-primary"><IconStar size={16}/>استكشف المجموعة</button>
            <button className="btn btn-ghost"><IconPlus size={16}/>أضف إلى قائمتي</button>
          </div>
        </div>
      </div>
      <div className="hero-pips">
        {FEATURED_COLLECTIONS.map((c, i) => (
          <button
            key={i}
            className={`hero-pip ${i===idx?'active':''}`}
            onClick={()=>goto(i)}
            aria-label={c.title}
          >
            <span className="fill" style={{ animationDuration: i===idx && !paused ? `${CYCLE}ms` : '0ms', animationPlayState: paused?'paused':'running' }}/>
          </button>
        ))}
        <span className="hero-pip-label">{String(idx+1).padStart(2,'0')} / {String(FEATURED_COLLECTIONS.length).padStart(2,'0')}</span>
      </div>
      {hover && (
        <div className="star-tooltip show" style={{left: hover.x, top: hover.y}}>
          <div className="t">{hover.title}</div>
          <div className="m">{hover.year}</div>
        </div>
      )}
    </div>
  );
}

// ——————————————————————————————————————————————————
// Mini-constellation for collection cards
// ——————————————————————————————————————————————————
function MiniConstellation({ hueA, hueB, seed = 1 }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; const ctx = c.getContext("2d");
    const w = c.offsetWidth, h = c.offsetHeight;
    const dpr = window.devicePixelRatio || 1;
    c.width = w*dpr; c.height = h*dpr; ctx.scale(dpr,dpr);

    // gradient bg
    const bg = ctx.createLinearGradient(0,0,w,h);
    bg.addColorStop(0, `oklch(0.22 0.08 ${hueA})`);
    bg.addColorStop(1, `oklch(0.12 0.05 ${hueB})`);
    ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);

    // ambient stars
    const rand = (i)=>{ const x=Math.sin(seed*91.17+i*12.93)*43758.5453; return x-Math.floor(x); };
    for (let i=0;i<60;i++) {
      ctx.fillStyle = `rgba(232,236,245,${0.15+rand(i)*0.5})`;
      ctx.beginPath(); ctx.arc(rand(i+1)*w, rand(i+2)*h, 0.4+rand(i+3)*1.2, 0, Math.PI*2); ctx.fill();
    }

    // 5 nodes
    const nodes = [
      [0.25,0.35],[0.5,0.25],[0.7,0.45],[0.55,0.6],[0.35,0.65]
    ].map(([x,y],i)=>({x:x*w,y:y*h}));
    const conns = [[0,1],[1,2],[2,3],[3,4],[4,0]];

    ctx.strokeStyle = "rgba(230,182,74,0.45)"; ctx.lineWidth = 1;
    for (const [a,b] of conns) { ctx.beginPath(); ctx.moveTo(nodes[a].x,nodes[a].y); ctx.lineTo(nodes[b].x,nodes[b].y); ctx.stroke(); }

    for (const n of nodes) {
      const g = ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,14);
      g.addColorStop(0,"rgba(230,182,74,0.6)"); g.addColorStop(1,"rgba(230,182,74,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.x,n.y,14,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = "#E6B64A"; ctx.beginPath(); ctx.arc(n.x,n.y,3,0,Math.PI*2); ctx.fill();
    }
  }, [hueA,hueB,seed]);
  return <canvas ref={ref} />;
}

// ——————————————————————————————————————————————————
// Poster & rail
// ——————————————————————————————————————————————————
function PosterCard({ data, watched, toggleWatch }) {
  return (
    <div className="poster-card" onClick={()=>{}}>
      <div className="poster-img">
        <PosterGraphic title={data.t} hue={data.hue} />
        <div className="rating"><IconStar size={10} fill="currentColor" stroke="none"/>{data.r.toFixed(1)}</div>
        <button className={`watchlist-btn ${watched?'saved':''}`} onClick={(e)=>{e.stopPropagation(); toggleWatch(data.id);}}>
          {watched ? <IconCheck size={14}/> : <IconPlus size={14}/>}
        </button>
      </div>
      <div className="poster-title">{data.t}</div>
      <div className="poster-meta">{data.y} · {data.genre}</div>
    </div>
  );
}

function Rail({ title, items, watched, toggleWatch }) {
  const railRef = useRef(null);
  const scroll = (dir) => {
    const el = railRef.current;
    // in RTL, inline scroll direction inverts — use native behavior
    el.scrollBy({ left: dir * 600, behavior: 'smooth' });
  };
  return (
    <div>
      <div className="section-title">
        <h2>{title}</h2>
        <a href="#" className="see-all">عرض الكل <IconChevronLeft size={14}/></a>
      </div>
      <div className="rail-wrap">
        <button className="rail-chevron start" onClick={()=>scroll(1)}><IconChevronLeft size={18}/></button>
        <button className="rail-chevron end" onClick={()=>scroll(-1)}><IconChevronRight size={18}/></button>
        <div className="rail" ref={railRef}>
          {items.map(it => <PosterCard key={it.id} data={it} watched={watched.has(it.id)} toggleWatch={toggleWatch} />)}
        </div>
      </div>
    </div>
  );
}

// ——————————————————————————————————————————————————
// Screens
// ——————————————————————————————————————————————————
function HomeScreen({ watched, toggleWatch }) {
  return (
    <div>
      <ConstellationHero />
      <Rail title="رائج عالميًا" items={TITLES.slice(0,12)} watched={watched} toggleWatch={toggleWatch}/>
      <Rail title="أفلام عربية شائعة" items={[TITLES[0],TITLES[1],TITLES[7],TITLES[8],TITLES[12],TITLES[13],TITLES[14],TITLES[15],TITLES[6]]} watched={watched} toggleWatch={toggleWatch}/>
      <Rail title="أنمي رائج" items={[TITLES[2],TITLES[9],TITLES[10],TITLES[4],TITLES[5]]} watched={watched} toggleWatch={toggleWatch}/>
      <Rail title="دراما تركية شائعة" items={[TITLES[3],TITLES[5],TITLES[11],TITLES[15]]} watched={watched} toggleWatch={toggleWatch}/>
      <Rail title="دراما كورية شائعة" items={[TITLES[4],TITLES[9],TITLES[10]]} watched={watched} toggleWatch={toggleWatch}/>
    </div>
  );
}

function BrowseScreen({ kind, watched, toggleWatch }) {
  const [genre, setGenre] = useState("all");
  const [sort, setSort] = useState("popular");
  const genres = [
    {k:"all", ar:"الكل"},{k:"drama", ar:"دراما"},{k:"action", ar:"أكشن"},
    {k:"comedy", ar:"كوميديا"},{k:"thriller", ar:"إثارة"},{k:"historical", ar:"تاريخي"},
    {k:"anime", ar:"أنمي"},{k:"horror", ar:"رعب"}
  ];
  return (
    <div>
      <div className="browse-head">
        <h1>{kind==='movies'?'الأفلام':'المسلسلات'}</h1>
        <div className="sub">{kind==='movies'?'تصفّح أفلام من كل أنحاء العالم':'تصفّح مسلسلات عربية وعالمية'} · <span className="mono">{TITLES.length * 248} عنوان</span></div>
      </div>
      <div className="filter-bar">
        {genres.map(g => (
          <button key={g.k} className={`chip ${genre===g.k?'active':''}`} onClick={()=>setGenre(g.k)}>{g.ar}</button>
        ))}
        <div className="filter-sep"/>
        <button className="select-trig">السنة: <span className="mono">2020–2026</span> <IconChevronDown size={14}/></button>
        <button className="select-trig">اللغة: العربية <IconChevronDown size={14}/></button>
        <div style={{marginInlineStart:'auto'}}>
          <button className="select-trig">ترتيب: {sort==='popular'?'الأكثر شعبية':'الأعلى تقييمًا'} <IconChevronDown size={14}/></button>
        </div>
      </div>
      <div className="grid">
        {[...TITLES, ...TITLES.slice(0,8)].map((t,i) => <PosterCard key={i} data={t} watched={watched.has(t.id)} toggleWatch={toggleWatch}/>)}
      </div>
    </div>
  );
}

function DetailScreen({ watched, toggleWatch, toast }) {
  const [tab, setTab] = useState("overview");
  const [season, setSeason] = useState(1);
  const title = TITLES[5]; // Ertuğrul
  const tabs = [
    {k:"overview", ar:"نظرة عامة"},
    {k:"episodes", ar:"الحلقات"},
    {k:"cast", ar:"طاقم العمل"},
    {k:"reviews", ar:"المراجعات"},
    {k:"info", ar:"معلومات إضافية"}
  ];
  return (
    <div>
      <div className="detail-hero">
        <div className="bg"/>
        <div className="gradient"/>
        <div className="detail-content">
          <div className="detail-info">
            <div className="kicker">مسلسل · تركي</div>
            <h1>{title.t}</h1>
            <div className="detail-meta">
              <span className="mono">{title.y}</span>
              <span className="sep"/>
              <span className="mono">5 مواسم · 179 حلقة</span>
              <span className="sep"/>
              <span className="mono">45 دقيقة</span>
              <span className="sep"/>
              <span className="rating mono"><IconStar size={13} fill="currentColor" stroke="none"/>{title.r}</span>
            </div>
            <div className="detail-genres">
              {["تاريخي","درامي","أكشن","مغامرة"].map(g => <span key={g} className="detail-genre">{g}</span>)}
            </div>
            <p className="detail-desc">
              قصة أرطغرل غازي، مؤسس الإمبراطورية العثمانية. يتنقّل المسلسل بين المعارك الملحمية والتحالفات القبلية في القرن الثالث عشر، ليرسم ملحمة تاريخية عن الشرف والصبر والحلم الكبير الذي وُلد من صحراء الأناضول.
            </p>
            <div className="detail-actions">
              <button className="btn btn-primary" onClick={()=>toast("المشاهدة قادمة في الإصدار v0.2")}><IconPlay size={14}/>شاهد الآن</button>
              <button className="btn btn-ghost" onClick={()=>toggleWatch(title.id)}>
                {watched.has(title.id) ? <><IconCheck size={14}/>في قائمتي</> : <><IconPlus size={14}/>قائمتي</>}
              </button>
              <button className="btn btn-ghost"><IconExternalLink size={14}/>IMDb</button>
            </div>
          </div>
          <div className="detail-poster">
            <PosterGraphic title={title.t} hue={title.hue}/>
          </div>
        </div>
      </div>
      <div className="detail-tabs">
        {tabs.map(t => (
          <button key={t.k} className={`detail-tab ${tab===t.k?'active':''}`} onClick={()=>setTab(t.k)}>{t.ar}</button>
        ))}
      </div>
      <div className="detail-body">
        {tab === "overview" && (
          <>
            <h3 className="detail-section-title">المقطع الدعائي</h3>
            <div style={{aspectRatio:'16/9', maxWidth:760, background:'var(--bg-surface)', borderRadius:12, border:'1px solid var(--stroke)', display:'flex',alignItems:'center',justifyContent:'center', marginBottom:32, position:'relative', overflow:'hidden'}}>
              <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg, oklch(0.22 0.06 30), oklch(0.12 0.03 20))'}}/>
              <div style={{width:64,height:64,borderRadius:'50%',background:'rgba(230,182,74,0.95)',display:'flex',alignItems:'center',justifyContent:'center',color:'#1a1308',position:'relative',zIndex:2}}>
                <IconPlay size={24}/>
              </div>
              <div style={{position:'absolute',bottom:16,insetInlineStart:16, fontFamily:'IBM Plex Mono', fontSize:11, color:'rgba(255,255,255,0.7)', letterSpacing:1, zIndex:2}}>TRAILER · 02:34</div>
            </div>
            <h3 className="detail-section-title">طاقم العمل · أبرز الممثلين</h3>
            <div className="cast-grid">
              {["أنجين ألتان","إسرا بلغيتش","جلال شنغيل","هولييا دارجان","جوزيه إنجو"].map((n,i) => (
                <div key={i} className="cast-item">
                  <div className="cast-avatar" style={{background:`linear-gradient(160deg, oklch(0.28 0.06 ${30+i*40}), oklch(0.14 0.02 ${30+i*40}))`}}/>
                  <div className="cast-name">{n}</div>
                  <div className="cast-char">الشخصية #{i+1}</div>
                </div>
              ))}
            </div>
          </>
        )}
        {tab === "episodes" && (
          <>
            <div className="season-tabs">
              {[1,2,3,4,5].map(s => <button key={s} className={`season-pill ${season===s?'active':''}`} onClick={()=>setSeason(s)}>موسم {s}</button>)}
            </div>
            <div>
              {[1,2,3,4,5].map(ep => (
                <div key={ep} className="episode" onClick={()=>toast("المشاهدة قادمة في الإصدار v0.2")}>
                  <div className="episode-thumb" style={{background:`linear-gradient(135deg, oklch(0.22 0.06 ${ep*60}), oklch(0.12 0.02 ${ep*60}))`}}>
                    <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <div style={{width:36,height:36,borderRadius:'50%',background:'rgba(11,13,20,0.7)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <IconPlay size={14}/>
                      </div>
                    </div>
                  </div>
                  <div className="episode-body">
                    <div className="num">S0{season} · E{String(ep).padStart(2,'0')}</div>
                    <h4>الحلقة {ep}: الفجر الأول</h4>
                    <div className="desc">يشرع أرطغرل في رحلة محفوفة بالمخاطر إلى قلعة هاليوف، بينما تتكشّف مؤامرات داخل القبيلة تهدد بتمزيق ما تبقى من السلام.</div>
                  </div>
                  <div className="episode-meta">
                    <div>{15+ep}.03.2014</div>
                    <div style={{marginTop:6, color:'var(--accent-gold)'}}>★ 8.{ep}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {tab === "cast" && <div style={{color:'var(--fg-muted)'}}>قائمة طاقم العمل الكاملة…</div>}
        {tab === "reviews" && <div style={{color:'var(--fg-muted)'}}>مراجعات المستخدمين من TMDB…</div>}
        {tab === "info" && <div style={{color:'var(--fg-muted)'}}>شركات الإنتاج، المفاتيح، العناوين البديلة…</div>}
      </div>
    </div>
  );
}

function CollectionsScreen() {
  const [tab, setTab] = useState("editorial");
  return (
    <div>
      <div className="browse-head">
        <h1>المجموعات</h1>
        <div className="sub">مجموعات مختارة يدويًا من مجتمع فضاء، ومجموعات TMDB الرسمية</div>
      </div>
      <div className="coll-tabs">
        <button className={`coll-tab ${tab==='editorial'?'active':''}`} onClick={()=>setTab('editorial')}>تحريرية · {COLLECTIONS_EDITORIAL.length}</button>
        <button className={`coll-tab ${tab==='tmdb'?'active':''}`} onClick={()=>setTab('tmdb')}>TMDB · 248</button>
      </div>
      <div className="coll-grid">
        {COLLECTIONS_EDITORIAL.map((c,i) => (
          <div key={i} className="coll-card">
            <MiniConstellation hueA={c.hueA} hueB={c.hueB} seed={i+1}/>
            <div className="grad"/>
            <div className="label">
              <div className="kicker">{c.kicker}</div>
              <h3>{c.title}</h3>
              <div className="meta">{c.count} عنوان</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WatchlistScreen({ watched, toggleWatch, setRoute }) {
  const items = TITLES.filter(t => watched.has(t.id));
  if (items.length === 0) {
    return (
      <div>
        <div className="browse-head">
          <h1>قائمتي</h1>
          <div className="sub">العناوين التي حفظتها للمشاهدة لاحقًا</div>
        </div>
        <div className="wl-empty">
          <svg width="160" height="160" viewBox="0 0 160 160">
            <g stroke="rgba(230,182,74,0.3)" strokeWidth="1" fill="none">
              <line x1="40" y1="50" x2="80" y2="70"/>
              <line x1="80" y1="70" x2="120" y2="55"/>
              <line x1="80" y1="70" x2="90" y2="110"/>
              <line x1="90" y1="110" x2="50" y2="120"/>
            </g>
            <g fill="#E6B64A">
              <circle cx="40" cy="50" r="3"><animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite"/></circle>
              <circle cx="80" cy="70" r="4"><animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" repeatCount="indefinite"/></circle>
              <circle cx="120" cy="55" r="2.5"><animate attributeName="opacity" values="0.3;0.9;0.3" dur="3.2s" repeatCount="indefinite"/></circle>
              <circle cx="90" cy="110" r="3"><animate attributeName="opacity" values="0.4;1;0.4" dur="2.8s" repeatCount="indefinite"/></circle>
              <circle cx="50" cy="120" r="2"><animate attributeName="opacity" values="0.3;0.8;0.3" dur="3.5s" repeatCount="indefinite"/></circle>
            </g>
          </svg>
          <h3>قائمتك فارغة</h3>
          <p>ابدأ بتصفّح الأفلام والمسلسلات، وأضف ما يلفت انتباهك عبر زر <span style={{color:'var(--accent-gold)'}}>+</span> على بطاقة أي عنوان.</p>
          <button className="btn btn-primary" onClick={()=>setRoute('home')}><IconHome size={16}/>ابدأ الاستكشاف</button>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="browse-head">
        <h1>قائمتي</h1>
        <div className="sub"><span className="mono">{items.length}</span> عنوان محفوظ</div>
      </div>
      <div className="filter-bar">
        <button className="chip active">الكل</button>
        <button className="chip">أفلام</button>
        <button className="chip">مسلسلات</button>
        <div style={{marginInlineStart:'auto'}}>
          <button className="select-trig">ترتيب: الأحدث إضافة <IconChevronDown size={14}/></button>
        </div>
      </div>
      <div className="grid">
        {items.map(t => <PosterCard key={t.id} data={t} watched={true} toggleWatch={toggleWatch}/>)}
      </div>
    </div>
  );
}

function SearchScreen({ watched, toggleWatch }) {
  const [q, setQ] = useState("");
  const recent = ["الرسالة","أنمي","دراما كورية","أرطغرل"];
  const results = q ? TITLES.filter(t => t.t.includes(q) || t.lat.toLowerCase().includes(q.toLowerCase())) : TITLES;
  return (
    <div>
      <div className="browse-head">
        <h1>البحث والاستكشاف</h1>
        <div className="sub">ابحث عن عنوان، شخص، أو مجموعة — أو استخدم المرشحات للاستكشاف</div>
      </div>
      <div style={{padding:'0 40px 20px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12, background:'var(--bg-surface)', border:'1px solid var(--stroke-strong)', borderRadius:12, padding:'14px 18px'}}>
          <IconSearch size={18}/>
          <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="اكتب اسم فيلم، مسلسل، ممثل…" style={{flex:1, background:'transparent', border:'none', outline:'none', color:'var(--fg-primary)', fontFamily:'inherit', fontSize:15}}/>
          {q && <button className="chip" onClick={()=>setQ("")}>مسح</button>}
        </div>
        <div style={{marginTop:16, display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
          <span style={{fontSize:12,color:'var(--fg-muted)',marginInlineEnd:4}}>بحثت مؤخرًا:</span>
          {recent.map(r => <button key={r} className="chip" onClick={()=>setQ(r)}>{r}</button>)}
        </div>
      </div>
      <div className="filter-bar">
        <button className="chip active">الكل</button>
        <button className="chip">أفلام</button>
        <button className="chip">مسلسلات</button>
        <button className="chip">أشخاص</button>
        <div className="filter-sep"/>
        <button className="select-trig">النوع: الكل <IconChevronDown size={14}/></button>
        <button className="select-trig">السنة: 2020–2026 <IconChevronDown size={14}/></button>
        <button className="select-trig">المنطقة: MENA <IconChevronDown size={14}/></button>
      </div>
      <div className="grid">
        {results.map(t => <PosterCard key={t.id} data={t} watched={watched.has(t.id)} toggleWatch={toggleWatch}/>)}
      </div>
    </div>
  );
}

function SettingsScreen({ toast }) {
  const [region, setRegion] = useState("MENA");
  const [theme, setTheme] = useState("dark");
  const [density, setDensity] = useState("comfortable");
  const [tokenMode, setTokenMode] = useState("shipped");
  return (
    <div>
      <div className="browse-head">
        <h1>الإعدادات</h1>
        <div className="sub">خصّص تجربتك في فضاء</div>
      </div>
      <div style={{padding:'0 40px 80px', maxWidth: 760}}>
        {/* General */}
        <SettingsSection title="عام" desc="تفضيلات المحتوى والمظهر">
          <SettingsRow label="المنطقة" hint="تؤثر على مجموعات الصفحة الرئيسية">
            <div style={{display:'flex',gap:8}}>
              {[["MENA","الشرق الأوسط"],["global","عالمي"]].map(([k,l]) => (
                <button key={k} className={`chip ${region===k?'active':''}`} onClick={()=>setRegion(k)}>{l}</button>
              ))}
            </div>
          </SettingsRow>
          <SettingsRow label="السمة">
            <div style={{display:'flex',gap:8}}>
              {[["dark","ليلي"],["light","نهاري"],["system","تلقائي"]].map(([k,l]) => (
                <button key={k} className={`chip ${theme===k?'active':''}`} onClick={()=>setTheme(k)}>{l}</button>
              ))}
            </div>
          </SettingsRow>
          <SettingsRow label="كثافة البوسترات">
            <div style={{display:'flex',gap:8}}>
              {[["comfortable","مريحة"],["compact","مضغوطة"]].map(([k,l]) => (
                <button key={k} className={`chip ${density===k?'active':''}`} onClick={()=>setDensity(k)}>{l}</button>
              ))}
            </div>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="بياناتي" desc="تُحفظ بياناتك محليًا على جهازك فقط — لا خوادم، لا حسابات">
          <SettingsRow label="قائمتي" hint="تصدير واستيراد JSON">
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-ghost" onClick={()=>toast("تم تصدير القائمة")}>تصدير</button>
              <button className="btn btn-ghost" onClick={()=>toast("اختر ملف JSON…")}>استيراد</button>
            </div>
          </SettingsRow>
          <SettingsRow label="البيانات المخزّنة مؤقتًا" hint="بيانات TMDB · 1.2MB">
            <button className="btn btn-ghost" onClick={()=>toast("تم مسح الذاكرة المؤقتة")}>مسح</button>
          </SettingsRow>
          <SettingsRow label="إعادة ضبط كامل" hint="يحذف كل شيء — لا يمكن التراجع">
            <button className="btn btn-ghost" style={{borderColor:'rgba(229,72,77,0.3)', color:'var(--danger)'}}>إعادة ضبط</button>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="TMDB" desc="مصدر بيانات الأفلام والمسلسلات">
          <SettingsRow label="المفتاح الحالي" hint={tokenMode==='shipped'?'المفتاح العام الافتراضي':'مفتاح خاص بك'}>
            <div style={{display:'inline-flex',alignItems:'center',gap:8, padding:'6px 12px', background:'rgba(46,132,74,0.1)', color:'var(--success)', borderRadius:999, fontFamily:'IBM Plex Mono', fontSize:11, letterSpacing:1}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:'var(--success)'}}/>
              نشط · {tokenMode==='shipped'?'SHIPPED':'CUSTOM'}
            </div>
          </SettingsRow>
          <SettingsRow label="استخدم مفتاحًا خاصًا" hint="لتجاوز قيود المعدّل · يُحفظ محليًا فقط">
            <input placeholder="Bearer ···" style={{flex:1, minWidth:240, padding:'10px 14px', background:'var(--bg-surface)', border:'1px solid var(--stroke-strong)', borderRadius:8, color:'var(--fg-primary)', fontFamily:'IBM Plex Mono', fontSize:12}}/>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="حول" desc="">
          <SettingsRow label="الإصدار"><span className="mono" style={{color:'var(--fg-muted)'}}>v0.1.0 · P1</span></SettingsRow>
          <SettingsRow label="الرخصة"><span className="mono" style={{color:'var(--fg-muted)'}}>MIT · OPEN SOURCE</span></SettingsRow>
          <SettingsRow label="الكود المصدري"><a href="#" className="mono" style={{color:'var(--accent-gold)'}}>github.com/fada →</a></SettingsRow>
        </SettingsSection>
      </div>
    </div>
  );
}

function SettingsSection({ title, desc, children }) {
  return (
    <div style={{marginBottom:40}}>
      <div style={{display:'flex',alignItems:'baseline',gap:16, marginBottom:4}}>
        <h2 style={{fontSize:18,fontWeight:600,margin:0}}>{title}</h2>
        <div style={{height:1,flex:1, background:'var(--stroke)'}}/>
      </div>
      {desc && <div style={{color:'var(--fg-muted)',fontSize:13, marginBottom:20}}>{desc}</div>}
      <div style={{background:'var(--bg-surface)', border:'1px solid var(--stroke)', borderRadius:12, overflow:'hidden'}}>
        {children}
      </div>
    </div>
  );
}
function SettingsRow({ label, hint, children }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:20, padding:'16px 20px', borderBottom:'1px solid var(--stroke)'}}>
      <div style={{flex:1, minWidth:0}}>
        <div style={{fontSize:14,fontWeight:500}}>{label}</div>
        {hint && <div style={{fontSize:12,color:'var(--fg-muted)',marginTop:2}}>{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

// ——————————————————————————————————————————————————
// Root
// ——————————————————————————————————————————————————
function App() {
  const [route, setRoute] = useState("home");
  const [watched, setWatched] = useState(new Set([6, 10]));
  const [toasts, setToasts] = useState([]);
  const toggleWatch = (id) => {
    setWatched(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toast = (msg) => {
    const id = Math.random();
    setToasts(t => [...t, {id, msg}]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  };

  const screen = {
    home: <HomeScreen watched={watched} toggleWatch={toggleWatch}/>,
    movies: <BrowseScreen kind="movies" watched={watched} toggleWatch={toggleWatch}/>,
    shows: <BrowseScreen kind="shows" watched={watched} toggleWatch={toggleWatch}/>,
    collections: <CollectionsScreen/>,
    detail: <DetailScreen watched={watched} toggleWatch={toggleWatch} toast={toast}/>,
    watchlist: <WatchlistScreen watched={watched} toggleWatch={toggleWatch} setRoute={setRoute}/>,
    search: <SearchScreen watched={watched} toggleWatch={toggleWatch}/>,
    settings: <SettingsScreen toast={toast}/>,
  }[route];

  // Tweaks
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "screen": "home"
  }/*EDITMODE-END*/;
  const [tweaks, setTweaks] = useTweaks ? useTweaks(TWEAK_DEFAULTS) : [TWEAK_DEFAULTS, ()=>{}];
  useEffect(() => {
    if (tweaks.screen && tweaks.screen !== route) setRoute(tweaks.screen);
  }, [tweaks.screen]);

  return (
    <>
      <div className="app" data-screen-label={`FADA · ${route}`}>
        <main className="main">
          <SearchPill setRoute={setRoute}/>
          {screen}
        </main>
        <Sidebar route={route} setRoute={(r)=>{setRoute(r); setTweaks({screen:r});}} toast={toast}/>
      </div>
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast">
            <IconSparkle size={16} className="ico"/>
            <div>{t.msg}</div>
          </div>
        ))}
      </div>
      <TweaksPanel title="Tweaks">
        <TweakSection title="Screen">
          <TweakRadio tweakKey="screen" label="Active screen" options={[
            {value:"home", label:"Home · constellation hero"},
            {value:"movies", label:"Movies browse"},
            {value:"shows", label:"Shows browse"},
            {value:"detail", label:"Show detail · Ertuğrul"},
            {value:"collections", label:"Collections index"},
            {value:"watchlist", label:"Watchlist"},
            {value:"search", label:"Search + Discover"},
            {value:"settings", label:"Settings"},
          ]}/>
        </TweakSection>
        <TweakSection title="Try">
          <div style={{fontSize:12, color:'var(--fg-muted, #8A93AB)', lineHeight:1.6}}>
            • Press <b style={{color:'#E6B64A'}}>/</b> to open search<br/>
            • Hover the stars on the Home hero<br/>
            • Click <b style={{color:'#E6B64A'}}>+</b> on any poster<br/>
            • Click a "قريبًا" item in sidebar
          </div>
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
