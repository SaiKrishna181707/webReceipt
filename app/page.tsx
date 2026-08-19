'use client'
import Link from 'next/link'
import {Activity, CheckCircle2, CircleX, Database, ArrowUpRight, ShieldCheck, Sparkles, Zap, Clock3, TrendingUp, AlertTriangle, RefreshCw} from 'lucide-react'
import {AreaChart,Area,ResponsiveContainer,Tooltip,XAxis,YAxis,BarChart,Bar} from 'recharts'
import {heals,rowData,runs} from '@/lib/mock-data'

const badge = (s: string) => `status ${s.toLowerCase()}`
const telemetry = [
  {x:'Mon',ok:280,fail:18},
  {x:'Tue',ok:330,fail:12},
  {x:'Wed',ok:300,fail:24},
  {x:'Thu',ok:360,fail:10},
  {x:'Fri',ok:340,fail:16},
  {x:'Sat',ok:410,fail:9},
  {x:'Sun',ok:390,fail:11}
]

export default function Dashboard() {
  return (
    <div>
      <div className="page-head">
        <div>
          <div className="kicker">WEB / RECEIPT · MARKET OVERVIEW</div>
          <h1 className="page-title">Collector terminal</h1>
          <p className="page-desc">Monitor production web evidence, run health and recovery signals from one trading-style workspace.</p>
        </div>
        <Link className="btn btn-primary" href="/scrapers/new">
          <Sparkles size={14}/> New collector
        </Link>
      </div>

      <div className="grid stats">
        <Stat icon={<Database size={20}/>} label="Total Collectors" value="24" trend="+3 this month"/>
        <Stat icon={<CheckCircle2 size={20}/>} label="Healthy" value="19" trend="79% fleet health"/>
        <Stat icon={<CircleX size={20}/>} label="Broken" value="2" trend="Needs attention" down/>
        <Stat icon={<Activity size={20}/>} label="Rows Collected" value="48.2K" trend="+18.4% this week"/>
      </div>

      <div className="section">
        <div className="section-head">
          <span className="section-title">WEB · RECEIPT / TELEMETRY</span>
          <span className="section-note">Last 7 days · simulated market data</span>
        </div>
        <div className="terminal-grid">
          <div className="card chart-card terminal-chart">
            <div className="chart-toolbar">
              <div>
                <strong>Run performance</strong>
                <span className="sub">2,184 total runs</span>
              </div>
              <div className="chart-tabs">
                <span className="selected">1D</span>
                <span>1W</span>
                <span>1M</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height="82%">
              <BarChart data={telemetry} barGap={2}>
                <XAxis dataKey="x" tick={{fill:'#8b949e',fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis hide/>
                <Tooltip contentStyle={{background:'#161b22',border:'1px solid #30363d',fontSize:11,color:'#e6edf3',borderRadius:'6px'}}/>
                <Bar dataKey="ok" fill="#3fb950" radius={[4,4,0,0]}/>
                <Bar dataKey="fail" fill="#f85149" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card watchlist">
            <div className="watch-head">
              <strong>Collector watchlist</strong>
              <span className="mono">24</span>
            </div>
            {[
              ['Price Monitor','HEALTHY','12.4K'],
              ['Jobs Board','HEALING','4.8K'],
              ['News Index','BROKEN','0'],
              ['Flight Tracker','HEALTHY','8.1K'],
              ['Home Listings','STALE','2.7K']
            ].map((x,i) => (
              <Link href={`/scrapers/${['price','jobs','news','flight','home'][i]}`} className="watch-row" key={x[0]}>
                <span>
                  <b>{x[0]}</b>
                  <small>c_{['prod_8f2a91','jobs_4c81d2','news_91aa30','fly_77bd11','home_22ac81'][i]}</small>
                </span>
                <em className={badge(x[1])}>{x[1]}</em>
                <strong>{x[2]}</strong>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <span className="section-title">ROWS COLLECTED / PERFORMANCE</span>
          <span className="trend">+18.4%</span>
        </div>
        <div className="card chart-card wide-chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rowData}>
              <defs>
                <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#58a6ff" stopOpacity=".3"/>
                  <stop offset="100%" stopColor="#58a6ff" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{fill:'#8b949e',fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis hide/>
              <Tooltip contentStyle={{background:'#161b22',border:'1px solid #30363d',fontSize:11,color:'#e6edf3',borderRadius:'6px'}}/>
              <Area type="monotone" dataKey="rows" stroke="#58a6ff" fill="url(#fill)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <span className="section-title">ORDER FLOW / RECENT ACTIVITY</span>
          <Link href="/scrapers" className="section-note">View all <ArrowUpRight size={12}/></Link>
        </div>
        <div className="grid activity">
          <div className="card list">
            <div className="list-row">
              <span>COLLECTOR</span>
              <span>STATUS</span>
              <span>ROWS</span>
              <span>TIME</span>
            </div>
            {runs.map((r,i) => (
              <div className="list-row" key={i}>
                <span>
                  <strong>{r[0]}</strong>
                  <span className="sub">collector c_{['prod_8f2a91','jobs_4c81d2','news_91aa30','fly_77bd11','home_22ac81'][i]}</span>
                </span>
                <span><em className={badge(r[1])}>{r[1]}</em></span>
                <span className="mono-small">{r[2]}</span>
                <span className="sub">{r[3]}</span>
              </div>
            ))}
          </div>
          <div className="card list">
            <div className="list-row">
              <span>RECOVERY TAPE</span>
              <span>ROWS</span>
            </div>
            {heals.map((h,i) => (
              <div className="list-row" key={i} style={{gridTemplateColumns:'1fr auto'}}>
                <span>
                  <strong>{h[0]}</strong>
                  <span className="sub">{h[1]}</span>
                </span>
                <span style={{textAlign:'right'}}>
                  <span className="trend">{h[2]}</span>
                  <span className="sub">{h[3]}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="card terminal-status">
          <div className="status-left">
            <ShieldCheck size={18} color="#3fb950"/>
            <div>
              <strong>Self-healing verification gate armed</strong>
              <div className="sub">Repairs are simulated locally. No external API or database is connected in this UI build.</div>
            </div>
          </div>
          <div className="status-actions">
            <span><Zap size={13}/> latency 42ms</span>
            <span><Clock3 size={13}/> market open</span>
            <Link href="/demo" className="btn btn-secondary">Open recovery lab <ArrowUpRight size={13}/></Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({icon,label,value,trend,down}:{icon:React.ReactNode;label:string;value:string;trend:string;down?:boolean}) {
  return (
    <div className="card stat">
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <div className="stat-value">{value}</div>
      <span className={`trend ${down?'down':''}`}>{trend}</span>
    </div>
  )
}
