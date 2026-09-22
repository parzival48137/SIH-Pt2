"use client"

import { useMemo, useState } from "react"
import { Activity, AlertTriangle, ArrowUpRight, CheckCircle2, ChevronRight, CloudSnow, Gauge, Info, Layers3, Menu, RotateCcw, Settings2, Thermometer, Wind } from "lucide-react"

const hourlyTemps = [3, 5, 2, -2, -7, -11, -15, -12, -8, -4, 0, 3]

export default function Home() {
  const [ambient, setAmbient] = useState(-15)
  const [wind, setWind] = useState(8)
  const [insulation, setInsulation] = useState(2.86)
  const [activeTab, setActiveTab] = useState("overview")

  const projection = useMemo(() => {
    const interior = Math.round(15 + (ambient + 15) * 0.12 + (wind - 8) * -0.18 + (insulation - 2.86) * 1.6)
    const heatLoss = Math.max(9.4, 16.07 + (wind - 8) * 0.65 - (insulation - 2.86) * 2.1)
    return { interior, heatLoss: heatLoss.toFixed(2) }
  }, [ambient, wind, insulation])

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="icon-button" aria-label="Open navigation"><Menu /></button>
        <div className="brand"><div className="brand-mark"><Thermometer /></div><div><strong>ThermoOpt</strong><span>FIELD ANALYTICS</span></div></div>
        <button className="icon-button" aria-label="Settings"><Settings2 /></button>
      </header>

      <section className="hero-card">
        <div className="hero-copy"><span className="eyebrow"><span className="live-dot" /> Simulation live</span><h1>Polar shelter<br /><em>thermal scan</em></h1><p>ThermoOpt Shelter · 24h transient model</p></div>
        <div className="hero-orbit"><div className="orbit-ring" /><CloudSnow className="snow-icon" /><span className="orbit-label">−15°<small>AMBIENT</small></span></div>
      </section>

      <nav className="tabs" aria-label="Dashboard sections">
        {["overview", "model", "history"].map(tab => <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>{tab}</button>)}
      </nav>

      <section className="section-heading"><div><span className="section-kicker">CURRENT STATE</span><h2>Thermal health</h2></div><span className="status-pill"><CheckCircle2 /> STABLE</span></section>

      <section className="metric-grid">
        <article className="metric-card primary"><div className="metric-top"><span>INTERIOR TEMP</span><Thermometer /></div><strong>{projection.interior}°<sup>C</sup></strong><div className="metric-foot"><span className="positive">+0.8°</span><span>vs target</span></div></article>
        <article className="metric-card"><div className="metric-top"><span>PEAK HEAT LOSS</span><Gauge /></div><strong>{projection.heatLoss}<sup> kW</sup></strong><div className="metric-foot"><span>16.07 kW baseline</span></div></article>
      </section>

      <article className="chart-card"><div className="card-heading"><div><span className="section-kicker">FORECAST</span><h3>Ambient temperature</h3></div><span className="forecast-badge">NEXT 12 HOURS <ArrowUpRight /></span></div><div className="chart"><div className="chart-y"><span>5°</span><span>−5°</span><span>−15°</span></div><div className="chart-area"><div className="grid-lines"><i /><i /><i /></div><svg viewBox="0 0 480 150" preserveAspectRatio="none" aria-label="Ambient temperature forecast chart"><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#55d7ff" stopOpacity=".3" /><stop offset="1" stopColor="#55d7ff" stopOpacity="0" /></linearGradient></defs><path d="M0 26 L44 16 L88 35 L131 57 L175 91 L219 116 L262 137 L306 123 L350 99 L393 72 L437 48 L480 35 L480 150 L0 150 Z" fill="url(#fill)" /><path d="M0 26 L44 16 L88 35 L131 57 L175 91 L219 116 L262 137 L306 123 L350 99 L393 72 L437 48 L480 35" fill="none" stroke="#65dcff" strokeWidth="3" /></svg><div className="chart-x"><span>NOW</span><span>+3H</span><span>+6H</span><span>+9H</span><span>+12H</span></div></div></div></article>

      <section className="section-heading controls-heading"><div><span className="section-kicker">MODEL INPUTS</span><h2>Run a scenario</h2></div><button className="reset-button" onClick={() => { setAmbient(-15); setWind(8); setInsulation(2.86) }}><RotateCcw /> Reset</button></section>
      <article className="controls-card">
        <Control label="Ambient temperature" value={`${ambient}°C`} icon={<CloudSnow />}><input aria-label="Ambient temperature" type="range" min="-35" max="5" value={ambient} onChange={e => setAmbient(Number(e.target.value))} /></Control>
        <Control label="Wind speed" value={`${wind} m/s`} icon={<Wind />}><input aria-label="Wind speed" type="range" min="0" max="20" value={wind} onChange={e => setWind(Number(e.target.value))} /></Control>
        <Control label="Wall conductivity" value={`${insulation.toFixed(2)} W/m·K`} icon={<Layers3 />}><input aria-label="Wall conductivity" type="range" min="1" max="6" step="0.01" value={insulation} onChange={e => setInsulation(Number(e.target.value))} /></Control>
      </article>

      <article className="alert-card"><div className="alert-icon"><AlertTriangle /></div><div><strong>Condensation risk: low</strong><p>0 projected hours below dew point in this run.</p></div><Info /></article>
      <button className="run-button"><Activity /> Run full analysis <ChevronRight /></button>
      <footer><span>THERMOOPT ENGINE v2.4</span><span>MODEL SYNCED 09:42</span></footer>
    </main>
  )
}

function Control({ label, value, icon, children }: { label: string; value: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="control"><div className="control-label"><div className="control-name"><span className="control-icon">{icon}</span><span>{label}</span></div><strong>{value}</strong></div>{children}</div>
}
