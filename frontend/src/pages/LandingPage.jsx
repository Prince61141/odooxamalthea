import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Brain, ScanLine, Layers3, BarChart3, ArrowRight, Users2, CheckCircle2,
  ShieldCheck, Zap, CircleDollarSign, Quote, Sun, Moon, Github, ArrowUpRight
} from 'lucide-react';

// Animation helpers
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut', delay },
  viewport: { once: true, amount: 0.35 }
});

const scaleIn = (delay = 0) => ({
  initial: { opacity: 0, scale: .9 },
  whileInView: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: 'easeOut', delay },
  viewport: { once: true, amount: 0.4 }
});

const sectionTitle = (title, subtitle) => (
  <div className="max-w-2xl mx-auto text-center mb-14">
    <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">{title}</h2>
    {subtitle && <p className="mt-4 text-slate-600 dark:text-slate-300 text-lg leading-relaxed">{subtitle}</p>}
  </div>
);

const gradientBorder = 'relative rounded-2xl p-[1px] bg-gradient-to-br from-indigo-500/60 via-violet-500/40 to-fuchsia-500/60';
const cardInner = 'rounded-2xl h-full w-full bg-white/70 dark:bg-slate-900/60 backdrop-blur border border-white/40 dark:border-white/10 shadow-sm p-6 flex flex-col';

const LandingPage = () => {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      try { return localStorage.getItem('landingDark') === 'true'; } catch { return false; }
    }
    return false;
  });
  const toggleDark = () => setDark(d => { const n=!d; try{localStorage.setItem('landingDark', String(n));}catch{} return n; });

  // Currency ticker (bonus)
  const [rates, setRates] = useState([]); // [{pair, rate}]
  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const json = await res.json();
        if (abort || !json?.rates) return;
        const pick = ['EUR','GBP','INR','JPY','AUD','CAD'];
        const list = pick.map(code => ({ pair: `USD/${code}`, rate: json.rates[code] })).filter(r=>r.rate);
        setRates(list);
      } catch { /* ignore */ }
    })();
    return () => { abort = true; };
  }, []);

  // Parallax hero motion
  const { scrollY } = useScroll();
  const yHero = useTransform(scrollY, [0, 600], [0, 120]);

  return (
    <div className={`${dark ? 'dark' : ''}`}>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-900 dark:selection:text-indigo-100">
        {/* Navbar */}
        <header className="w-full sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-slate-900/70 border-b border-slate-200/60 dark:border-slate-700/60">
          <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight text-lg">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center text-white shadow ring-2 ring-white/40 dark:ring-white/10">
                <Brain className="w-4 h-4" />
              </div>
              <span>SmartExpense</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
              <a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Features</a>
              <a href="#how" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">How It Works</a>
              <a href="#pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Pricing</a>
              <a href="#testimonials" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Testimonials</a>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="group inline-flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400">GitHub <ArrowUpRight className="w-3 h-3 opacity-60 group-hover:translate-x-0.5 transition"/></a>
            </nav>
            <div className="flex items-center gap-3">
              <button onClick={toggleDark} aria-label="Toggle theme" className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-700 transition">
                {dark ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}
              </button>
              <Link to="/login" className="px-4 py-2 text-sm font-semibold rounded-full bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 hover:shadow-md hover:-translate-y-0.5 transition">Login</Link>
              <Link to="/signup" className="px-4 py-2 text-sm font-semibold rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow hover:shadow-lg hover:brightness-110 hover:-translate-y-0.5 transition">Get Started</Link>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="relative overflow-hidden">
          <motion.div style={{ y: yHero }} className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-40">
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/10 to-transparent rounded-full blur-3xl" />
          </motion.div>
          <div className="relative max-w-5xl mx-auto px-6 pt-28 pb-32 text-center">
            <motion.h1 {...fadeUp(0)} className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              Automate Expense Approvals. <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">Simplify Reimbursements.</span>
            </motion.h1>
            <motion.p {...fadeUp(0.15)} className="mt-6 text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              AI-powered OCR, multi-level workflows, and real-time currency conversion — built for modern teams.
            </motion.p>
            <motion.div {...fadeUp(0.3)} className="mt-10 flex flex-wrap justify-center gap-4">
              <Link to="/signup" className="group relative inline-flex items-center gap-2 px-7 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:-translate-y-0.5 transition">
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </Link>
              <a href="#features" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-slate-300 dark:border-slate-600 bg-white/70 dark:bg-slate-800/70 backdrop-blur text-slate-700 dark:text-slate-200 font-medium hover:-translate-y-0.5 hover:shadow transition">
                View Demo
              </a>
            </motion.div>
            <motion.div {...fadeUp(0.45)} className="mt-20 grid sm:grid-cols-3 gap-6">
              {[{icon:ScanLine,title:'OCR Receipt Scanner',desc:'Scan receipts, auto-fill details.'},{icon:Layers3,title:'Approval Workflow',desc:'Multi-level rules & approvals.'},{icon:BarChart3,title:'Analytics Dashboard',desc:'Insights by category & currency.'}].map((f,i)=> {
                const Icon = f.icon; return (
                  <motion.div key={f.title} {...scaleIn(i*0.1)} className={`${gradientBorder}`}>
                    <div className={cardInner}>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow mb-4">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold mb-2 tracking-tight">{f.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex-1">{f.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how" className="relative py-28 px-6">
          {sectionTitle('How It Works', 'Fast, accurate and transparent from submission to export.')}
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-10">
            {[{
              step: '1', title: 'Submit with OCR', desc: 'Employee uploads receipt. AI extracts amount, date, currency & merchant automatically.'
            },{
              step: '2', title: 'Manager Review', desc: 'Manager checks policy flags, adjusts or approves in one click.'
            },{
              step: '3', title: 'Admin Oversight', desc: 'Admins monitor spend, run analytics, and export finance-ready reports.'
            }].map((s,i)=> (
              <motion.div key={s.step} {...fadeUp(i*0.1)} className={`${gradientBorder}`}>
                <div className={`${cardInner} items-start`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white flex items-center justify-center font-semibold shadow-inner">{s.step}</span>
                    <h3 className="font-semibold tracking-tight text-lg">{s.title}</h3>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Roles */}
        <section className="py-28 px-6" id="roles">
          {sectionTitle('Built For Every Role', 'Tailored experiences for employees, managers and admins.')}
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            {[{
              icon:Users2, title:'Employee', lines:['Smart auto-fill','Mobile ready uploads','Track approvals']
            },{
              icon:ShieldCheck, title:'Manager', lines:['Bulk approvals','Policy alerts','Team analytics']
            },{
              icon:CheckCircle2, title:'Admin', lines:['Spend governance','Exports & audits','Role-based access']
            }].map((r,i)=> { const Icon=r.icon; return (
              <motion.div key={r.title} {...scaleIn(i*0.12)} className={`${gradientBorder}`}>
                <div className={cardInner}>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow mb-5">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold tracking-tight text-xl mb-3">{r.title}</h3>
                  <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400 mb-4">
                    {r.lines.map(l=> <li key={l} className="flex items-start gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500" /> {l}</li>)}
                  </ul>
                </div>
              </motion.div>
            );})}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-28 px-6 relative">
          {sectionTitle('Pricing', 'Simple and scalable plans.')}
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
            {[{
              name:'Starter', price:'Free', tagline:'Teams under 10 users', features:['10 users','OCR extraction','Basic workflow','Email support'], cta:'Get Started'
            },{
              name:'Pro', price:'₹99', tagline:'Per user / month', features:['Unlimited users','Advanced approvals','Analytics + exports','Priority support'], cta:'Upgrade'
            },{
              name:'Enterprise', price:'Custom', tagline:'Tailored for scale', features:['SAML / SSO','Custom policies','Dedicated success','Security reviews'], cta:'Contact Sales'}].map((p,i)=> (
              <motion.div key={p.name} {...fadeUp(i*0.1)} className={`${gradientBorder} group`}>
                <div className={`${cardInner} relative overflow-hidden`}> 
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-tr from-indigo-500/10 via-fuchsia-500/10 to-transparent" />
                  <div className="mb-5">
                    <h3 className="font-semibold tracking-tight text-xl mb-1">{p.name}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">{p.price}</span>
                      {p.price !== 'Free' && <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{p.tagline}</span>}
                    </div>
                    {p.price === 'Free' && <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">{p.tagline}</p>}
                  </div>
                  <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400 mb-6">
                    {p.features.map(f=> <li key={f} className="flex items-start gap-2"><Zap className="w-3.5 h-3.5 text-indigo-500"/> <span>{f}</span></li>)}
                  </ul>
                  <button className="mt-auto inline-flex items-center justify-center w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white text-sm font-semibold shadow hover:shadow-md hover:-translate-y-0.5 transition active:translate-y-0">{p.cta}</button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-28 px-6 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          {sectionTitle('Teams Love It', 'Early adopters share their wins.')}  
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
            {[{
              quote:'Saved us hours every week!', author:'Finance Lead'
            },{
              quote:'The OCR just works – no more manual entry.', author:'Operations Manager'
            },{
              quote:'Approval flows are insanely smooth.', author:'Team Manager'}].map((t,i)=> (
              <motion.div key={t.author} {...fadeUp(i*0.12)} className="relative rounded-2xl p-[1px] bg-gradient-to-br from-indigo-500/40 via-violet-500/30 to-fuchsia-500/40">
                <div className="rounded-2xl h-full bg-white dark:bg-slate-900 p-6 border border-white/40 dark:border-white/10 flex flex-col">
                  <Quote className="w-7 h-7 text-indigo-500 mb-4" />
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 flex-1">“{t.quote}”</p>
                  <div className="mt-4 text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">— {t.author}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="relative mt-auto py-10 px-6 text-sm border-t border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 backdrop-blur">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Brain className="w-4 h-4" /> <span>© 2025 SmartExpense</span>
            </div>
            <ul className="flex flex-wrap items-center gap-6 text-slate-600 dark:text-slate-400">
              <li><a href="#how" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">About</a></li>
              <li><a href="#pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Docs</a></li>
              <li><a href="mailto:contact@smartexpense.dev" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Contact</a></li>
              <li><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition inline-flex items-center gap-1">GitHub <Github className="w-3.5 h-3.5"/></a></li>
            </ul>
          </div>
        </footer>

        {/* Currency ticker bar */}
        {rates.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 overflow-hidden h-9 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white text-xs tracking-wide flex items-center select-none">
            <div className="animate-[scroll_40s_linear_infinite] flex gap-10 px-8">
              {Array.from({length:2}).map((_,dup)=> rates.map(r=> (
                <div key={r.pair+dup} className="flex items-center gap-2 font-mono">
                  <span className="opacity-80">{r.pair}</span>
                  <span className="font-semibold">{r.rate.toFixed(2)}</span>
                </div>
              )))}
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .dark ::selection { background: rgba(129,140,248,0.35); }
      `}</style>
    </div>
  );
};

export default LandingPage;
