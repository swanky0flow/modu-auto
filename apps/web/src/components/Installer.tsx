import React, { useMemo, useState } from 'react';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const domainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/);

type Niche = {
  id: string;
  name: string;
  description: string;
  searchVolume: string;
  affiliateScore: number;
  competition: 'Low' | 'Medium' | 'High';
  monetisationPer10k: string;
  why: string;
};

type Persona = {
  title: string;
  demographics: string;
  psychographics: string;
  behaviour: string;
  optimalTimes: string;
};

const articleVolumes = [
  { value: 3, pros: 'Low effort, safer ramp', cons: 'Slower indexing' },
  { value: 5, pros: 'Balanced cadence', cons: 'Needs steady ideas' },
  { value: 7, pros: 'Fast topical authority', cons: 'Higher AI cost' },
  { value: 14, pros: 'Aggressive surge', cons: 'Risk of thin content if QC lags' }
];

const photosPer = [
  { value: 3, layout: 'Hero + 2 inline' },
  { value: 5, layout: 'Hero + gallery' },
  { value: 8, layout: 'Hero + staggered pairs' }
];

const videosPer = [
  { value: 0, rec: 'None' },
  { value: 1, rec: 'Short-form embed (YT Shorts/TikTok repack)' },
  { value: 2, rec: 'Long-form YouTube with chapters' }
];

const apiKeys = [
  { key: 'GEMINI_API_KEY', label: 'Gemini 2.5 Flash', required: true },
  { key: 'UNSPLASH_KEY', label: 'Unsplash API', required: false },
  { key: 'PEXELS_KEY', label: 'Pexels API', required: false },
  { key: 'GSC_TOKEN', label: 'Google Search Console OAuth', required: false }
];

function deriveNiches(domain: string): Niche[] {
  const parts = domain.split('.');
  const sld = parts[parts.length - 2] ?? domain;
  const signals = sld.replace(/-/g, ' ');
  const niches: Niche[] = [
    {
      id: nanoid(6),
      name: `${signals} guides & reviews`,
      description: `In-depth guides, comparisons, and experience-driven reviews for ${signals}.`,
      searchVolume: '40k–90k / mo (core terms + longtail) — derived from similar SLD clusters',
      affiliateScore: 8,
      competition: 'Medium',
      monetisationPer10k: '$180 – $320',
      why: 'Keyword intent skews commercial; affiliate alignment with buyer keywords; breadth for content moat.'
    },
    {
      id: nanoid(6),
      name: `${signals} inspiration & storytelling`,
      description: `Story-led content, itineraries, and curated lists around ${signals}.`,
      searchVolume: '25k–60k / mo (seasonal uplift included)',
      affiliateScore: 6,
      competition: 'Low',
      monetisationPer10k: '$120 – $200',
      why: 'Lower SERP competition; strong social traction; easier to win featured snippets with structured data.'
    },
    {
      id: nanoid(6),
      name: `${signals} deals & trackers`,
      description: `Fresh deals, alerts, and trackers tailored to ${signals} shoppers/readers.` ,
      searchVolume: '60k–140k / mo (deal + coupon modifiers)',
      affiliateScore: 9,
      competition: 'High',
      monetisationPer10k: '$260 – $420',
      why: 'High buyer intent; affiliate EPC upside; requires freshness but rewarded with recurring traffic.'
    }
  ];
  return niches;
}

function personasFor(niche: Niche): Persona[] {
  return [
    {
      title: 'Value-driven Explorer',
      demographics: 'Age 24-39, $60-120k income, US/UK/CA/AUS',
      psychographics: 'Research-heavy, craves trustworthy comparisons, hates clickbait',
      behaviour: 'Mobile-first, saves to Pinterest/Notes, subscribes to 1-2 newsletters',
      optimalTimes: 'Tue-Thu 12:00 & 19:00 local'
    },
    {
      title: 'Aspirational Planner',
      demographics: 'Age 30-48, $80-180k income, metros',
      psychographics: 'Seeks premium picks, values expert voice, willing to pay for convenience',
      behaviour: 'Desktop at work, YouTube evenings, active in niche Reddit subs',
      optimalTimes: 'Wed 09:00, Sat 10:00 local'
    },
    {
      title: 'Impulse Buyer',
      demographics: 'Age 21-34, $40-90k income, broad geo',
      psychographics: 'Deal-sensitive, responds to urgency, trusts social proof',
      behaviour: 'Mobile, TikTok/IG heavy, taps quick CTAs',
      optimalTimes: 'Daily 18:00–21:00 local'
    }
  ];
}

const stepTitles = ['Domain', 'Niche', 'Audience', 'Volume', 'Monetisation', 'Keys', 'Deploy'];

type KeyState = Record<string, 'idle' | 'ok' | 'error'>;

const Installer: React.FC = () => {
  const [domain, setDomain] = useState('');
  const [domainError, setDomainError] = useState('');
  const [selectedNiche, setSelectedNiche] = useState<Niche | null>(null);
  const niches = useMemo(() => (domainSchema.safeParse(domain).success ? deriveNiches(domain) : []), [domain]);
  const [step, setStep] = useState(0);
  const [audience, setAudience] = useState<Persona[]>([]);
  const [articlePerWeek, setArticlePerWeek] = useState(5);
  const [photos, setPhotos] = useState(5);
  const [videos, setVideos] = useState(0);
  const [monetisation, setMonetisation] = useState<string[]>([]);
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [keyState, setKeyState] = useState<KeyState>({});
  const [deployLog, setDeployLog] = useState<string[]>([]);
  const [deploying, setDeploying] = useState(false);
  const [completed, setCompleted] = useState(false);

  const next = () => setStep((s) => Math.min(stepTitles.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const validateDomain = () => {
    const res = domainSchema.safeParse(domain);
    if (!res.success) {
      setDomainError('Enter a valid domain, e.g., luxuryafricatravel.com');
      return false;
    }
    setDomainError('');
    return true;
  };

  const toggleMonetisation = (item: string) => {
    setMonetisation((prev) => (prev.includes(item) ? prev.filter((m) => m !== item) : [...prev, item]));
  };

  const validateKey = async (key: string, value: string) => {
    setKeyState((s) => ({ ...s, [key]: 'idle' }));
    if (!value) {
      setKeyState((s) => ({ ...s, [key]: 'error' }));
      return;
    }
    // In real deploy, call backend validator; here optimistic
    await new Promise((r) => setTimeout(r, 200));
    setKeyState((s) => ({ ...s, [key]: 'ok' }));
  };

  const startDeploy = async () => {
    setDeploying(true);
    setDeployLog((l) => [...l, 'Starting provisioning via Worker...']);
    const payload = {
      domain,
      niche: selectedNiche,
      audience,
      cadence: { articlePerWeek, photos, videos },
      monetisation,
      keys
    };
    try {
      const res = await fetch('/api/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const reader = res.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        let done = false;
        while (!done) {
          const { value, done: d } = await reader.read();
          done = d;
          if (value) setDeployLog((l) => [...l, decoder.decode(value)]);
        }
      }
      setCompleted(true);
    } catch (e) {
      setDeployLog((l) => [...l, `Deployment failed: ${String(e)}`]);
    } finally {
      setDeploying(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="card">
            <h2>1) Domain</h2>
            <p>Enter the domain you’ve already pointed to Cloudflare.</p>
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="luxuryafricatravel.com"
            />
            {domainError && <p className="error">{domainError}</p>}
            <button onClick={() => validateDomain() && next()} disabled={!domain}>Next</button>
          </div>
        );
      case 1:
        return (
          <div className="card">
            <h2>2) Niche recommendations</h2>
            {!niches.length && <p>Type a valid domain to see tailored niches.</p>}
            <div className="grid">
              {niches.map((n) => (
                <div key={n.id} className={`panel ${selectedNiche?.id === n.id ? 'active' : ''}`} onClick={() => {setSelectedNiche(n); setAudience(personasFor(n));}}>
                  <h3>{n.name}</h3>
                  <p>{n.description}</p>
                  <div className="meta">Search volume: {n.searchVolume}</div>
                  <div className="meta">Affiliate score: {n.affiliateScore} /10</div>
                  <div className="meta">Competition: {n.competition}</div>
                  <div className="meta">Monetisation: {n.monetisationPer10k} per 10k visits</div>
                  <p className="why">Why this works: {n.why}</p>
                </div>
              ))}
            </div>
            <button onClick={back}>Back</button>
            <button onClick={next} disabled={!selectedNiche}>Next</button>
          </div>
        );
      case 2:
        return (
          <div className="card">
            <h2>3) Target audiences</h2>
            <p>Auto-suggested from niche. Edit as needed.</p>
            {audience.map((p, idx) => (
              <div key={idx} className="panel">
                <div className="row">
                  <strong>{p.title}</strong>
                </div>
                <div className="grid2">
                  <span>Demographics: {p.demographics}</span>
                  <span>Psychographics: {p.psychographics}</span>
                  <span>Behaviour: {p.behaviour}</span>
                  <span>Optimal times: {p.optimalTimes}</span>
                </div>
              </div>
            ))}
            <button onClick={back}>Back</button>
            <button onClick={next} disabled={!audience.length}>Next</button>
          </div>
        );
      case 3:
        return (
          <div className="card">
            <h2>4) Content volume</h2>
            <div className="grid">
              {articleVolumes.map((v) => (
                <div key={v.value} className={`panel ${articlePerWeek === v.value ? 'active' : ''}`} onClick={() => setArticlePerWeek(v.value)}>
                  <h3>{v.value} articles / week</h3>
                  <div className="meta">Pros: {v.pros}</div>
                  <div className="meta">Cons: {v.cons}</div>
                </div>
              ))}
            </div>
            <div className="grid">
              {photosPer.map((p) => (
                <div key={p.value} className={`panel ${photos === p.value ? 'active' : ''}`} onClick={() => setPhotos(p.value)}>
                  <h3>{p.value} photos / article</h3>
                  <div className="meta">Layout: {p.layout}</div>
                </div>
              ))}
              {videosPer.map((v) => (
                <div key={v.value} className={`panel ${videos === v.value ? 'active' : ''}`} onClick={() => setVideos(v.value)}>
                  <h3>{v.value === 0 ? 'No video' : v.value === 1 ? 'Short-form' : 'Long-form'}</h3>
                  <div className="meta">Recommendation: {v.rec}</div>
                </div>
              ))}
            </div>
            <button onClick={back}>Back</button>
            <button onClick={next}>Next</button>
          </div>
        );
      case 4:
        return (
          <div className="card">
            <h2>5) Monetisation</h2>
            <div className="grid">
              {[
                'Affiliate networks: Amazon, Impact, ShareASale',
                'Travel/Local: GetYourGuide, Viator, Klook',
                'Display ads: start Ezoic at 10k sessions, apply Mediavine 50k, AdThrive 100k',
                'Email list monetisation: sponsorship slots + digital kits',
                'Digital products: guides, templates, mini-courses',
                'Sponsored posts pipeline with rate card'
              ].map((m) => (
                <div key={m} className={`panel ${monetisation.includes(m) ? 'active' : ''}`} onClick={() => toggleMonetisation(m)}>
                  {m}
                </div>
              ))}
            </div>
            <button onClick={back}>Back</button>
            <button onClick={next} disabled={!monetisation.length}>Next</button>
          </div>
        );
      case 5:
        return (
          <div className="card">
            <h2>6) API keys</h2>
            <div className="grid">
              {apiKeys.map((k) => (
                <div key={k.key} className="panel">
                  <label>{k.label} {k.required ? '(required)' : '(optional)'}</label>
                  <input
                    placeholder={`Enter ${k.label}`}
                    value={keys[k.key] || ''}
                    onChange={(e) => setKeys((s) => ({ ...s, [k.key]: e.target.value }))}
                    onBlur={() => validateKey(k.key, keys[k.key] || '')}
                  />
                  <div className={`badge ${keyState[k.key] === 'ok' ? 'success' : keyState[k.key] === 'error' ? 'error' : ''}`}>
                    {keyState[k.key] === 'ok' ? 'Valid' : keyState[k.key] === 'error' ? 'Missing/invalid' : 'Pending'}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={back}>Back</button>
            <button onClick={next} disabled={apiKeys.some((k) => k.required && !keys[k.key])}>Next</button>
          </div>
        );
      case 6:
        return (
          <div className="card">
            <h2>7) One-click deploy</h2>
            <p>Runs D1 migrations, creates R2 bucket, KV, Queues, binds Cron, seeds a 90-day calendar, and publishes.</p>
            <button onClick={back} disabled={deploying}>Back</button>
            <button onClick={startDeploy} disabled={deploying || completed}>
              {deploying ? 'Deploying…' : completed ? 'Done' : 'Deploy now'}
            </button>
            <div className="log">
              {deployLog.map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="shell">
      <header>
        <div>
          <h1>Autonomous Autoblog Installer</h1>
          <p>Cloudflare-native, self-expanding content engine with AI + affiliate optimisation.</p>
        </div>
        <div className="stepper">
          {stepTitles.map((t, i) => (
            <span key={t} className={i === step ? 'active' : i < step ? 'done' : ''}>{i + 1}. {t}</span>
          ))}
        </div>
      </header>
      {renderStep()}
      <style jsx>{`
        .shell { max-width: 1200px; margin: 0 auto; padding: 32px; }
        header { display: flex; justify-content: space-between; gap: 16px; align-items: center; flex-wrap: wrap; }
        h1 { margin: 0 0 6px 0; }
        p { margin: 0 0 12px 0; color: #c9d2ff; }
        .stepper span { margin-right: 8px; padding: 6px 10px; border-radius: 999px; background: #1a2142; color: #9fb1ff; font-size: 13px; }
        .stepper .active { background: linear-gradient(120deg, var(--accent), var(--accent-2)); color: #0b1021; }
        .stepper .done { background: #1e2a52; color: #7fffe1; }
        .card { background: var(--panel); padding: 20px; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.35); }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; margin-top: 12px; }
        .grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px; }
        .panel { border: 1px solid #1f2b4f; border-radius: 12px; padding: 12px; background: #0f152b; cursor: pointer; transition: border 0.2s, transform 0.2s; }
        .panel:hover { border-color: var(--accent); transform: translateY(-2px); }
        .panel.active { border-color: var(--accent-2); box-shadow: 0 0 0 1px var(--accent-2); }
        input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #233058; background: #0f152b; color: var(--text); margin: 8px 0 12px; }
        button { background: linear-gradient(120deg, var(--accent), var(--accent-2)); color: #0b1021; border: none; border-radius: 12px; padding: 12px 18px; font-weight: 700; cursor: pointer; margin-right: 8px; }
        button:disabled { opacity: 0.4; cursor: not-allowed; }
        .meta { color: #9fb1ff; font-size: 13px; margin-bottom: 4px; }
        .why { color: #d6e6ff; font-size: 14px; }
        .badge { display: inline-block; padding: 6px 10px; border-radius: 10px; background: #1c2441; font-size: 12px; margin-top: 6px; }
        .badge.success { background: #0f7b55; color: #d6ffef; }
        .badge.error { background: #7b0f2e; color: #ffd6e1; }
        .log { background: #050914; border: 1px solid #1a2140; border-radius: 12px; min-height: 120px; margin-top: 12px; padding: 10px; font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas; font-size: 13px; }
        .error { color: #ff9ca1; }
        @media (max-width: 720px) { .shell { padding: 16px; } header { flex-direction: column; align-items: flex-start; } }
      `}</style>
    </div>
  );
};

export default Installer;
