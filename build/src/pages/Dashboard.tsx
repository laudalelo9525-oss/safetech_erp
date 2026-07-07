import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Legend
} from 'recharts'
import {
  computeTrailerCycleTimes, dailyThroughput, detectIdleBottlenecks,
  currentFleetStatus, siteCongestionScore, generateAlerts,
  type FleetStatusEvent
} from '../lib/analytics'
import { supabase } from '../lib/supabaseClient'
import CountUpCard from '../components/CountUpCard'
import AlertsPanel from '../components/AlertsPanel'

const KANBAN_COLUMNS = [
  { key: 'empty', label: 'Empty', statuses: ['IN FACTORY EMPTY'], color: '#94a3b8' },
  { key: 'loading', label: 'Loading', statuses: ['UNDER LOADING AT SY'], color: '#f59e0b' },
  { key: 'dispatched', label: 'Dispatched', statuses: ['SHIFTING AT SITE', 'INTERNAL SHIFTING'], color: '#ef4444' },
  { key: 'not_offload', label: 'Not Offloaded', statuses: ['NOT OFFLOAD'], color: '#991b1b' },
  { key: 'returning', label: 'Returning', statuses: ['EMPTY/BACK TO FACTORY'], color: '#10b981' },
]

function columnFor(statusText: string){
  return KANBAN_COLUMNS.find(c => c.statuses.includes(statusText)) ?? KANBAN_COLUMNS[0]
}

export default function Dashboard(){
  const [kpis, setKpis] = useState({ trips: 0, avgCycleHours: 0, idleCount: 0, volume: 0 })
  const [fleetEvents, setFleetEvents] = useState<FleetStatusEvent[]>([])
  const [dailyTrend, setDailyTrend] = useState<{ date: string, trips: number, volume: number }[]>([])
  const [trailerPlates, setTrailerPlates] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    async function load(){
      const [{ data: fleet }, { data: deliveries }, { data: trailers }] = await Promise.all([
        supabase.from('fleet_status').select('*').limit(1000),
        supabase.from('deliveries').select('*').limit(1000),
        supabase.from('trailers').select('id,plate_no').limit(500),
      ])

      const events = (fleet || []).map((f: any) => ({
        trailer_id: f.trailer_id, status_text: f.status_text,
        status_timestamp: f.status_timestamp, site_location: f.site_location
      })) as FleetStatusEvent[]

      const cycles = computeTrailerCycleTimes(events)
      const all = Object.values(cycles).flat()
      const avgMins = all.length ? all.reduce((a, b) => a + b, 0) / all.length : 0

      const daily = dailyThroughput(deliveries || [])
      const trips = daily.reduce((a, b: any) => a + b.trips, 0)
      const volume = daily.reduce((a, b: any) => a + b.volume, 0)
      const idle = detectIdleBottlenecks(events, 24)

      const plateMap: Record<string, string> = {}
      for (const t of trailers || []) plateMap[t.id] = t.plate_no

      setKpis({ trips, avgCycleHours: Number((avgMins / 60).toFixed(1)), idleCount: idle.length, volume: Number(volume.toFixed(1)) })
      setFleetEvents(events)
      setDailyTrend(daily.map((d: any) => ({ date: d.date.slice(5), trips: d.trips, volume: Number(d.volume.toFixed(1)) })))
      setTrailerPlates(plateMap)
      setLoading(false)
    }
    load()
  }, [])

  const current = useMemo(()=> currentFleetStatus(fleetEvents), [fleetEvents])

  const donutData = useMemo(()=>{
    const counts: Record<string, number> = {}
    for (const e of current){
      const col = columnFor(e.status_text)
      counts[col.label] = (counts[col.label] || 0) + 1
    }
    return KANBAN_COLUMNS.map(c => ({ name: c.label, value: counts[c.label] || 0, color: c.color })).filter(d => d.value > 0)
  }, [current])

  const congestion = useMemo(()=> siteCongestionScore(fleetEvents, 24).slice(0, 6), [fleetEvents])
  const alerts = useMemo(()=> generateAlerts(siteCongestionScore(fleetEvents, 24), 24), [fleetEvents])

  if(loading) return <div className="p-6 text-red-500 font-semibold flex items-center justify-center min-h-[300px] animate-pulse">Loading dashboard telemetry…</div>

  return (
    <div className="space-y-6">
      {/* Page Title Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
            Fleet Telemetry <span className="text-red-500 font-light">Monitor</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">Real-time logistics analytics for precast concrete shipping logs</p>
        </div>
        <div className="text-xs font-bold px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 shadow-md shadow-red-500/5 mt-3 md:mt-0 max-w-fit">
          ● LOGS CONNECTED
        </div>
      </div>

      <AlertsPanel alerts={alerts} />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CountUpCard label="Total Trips" value={kpis.trips} />
        <CountUpCard label="Avg Cycle (Hrs)" value={kpis.avgCycleHours} />
        <CountUpCard label="Idle Trailers (>24h)" value={kpis.idleCount} accent="red" />
        <CountUpCard label="Total Shipped (m³)" value={kpis.volume} />
      </div>

      {/* Row 2: Live Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Status Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="glass-panel rounded-2xl p-5 border border-white/5"
        >
          <div className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-4 pb-2 border-b border-white/5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Current Fleet Status
          </div>
          {donutData.length === 0 ? (
            <div className="text-neutral-500 text-sm py-16 text-center">No active fleet status logged.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                  {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(15, 17, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Legend iconSize={8} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Bottleneck Bar Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }} 
          className="glass-panel rounded-2xl p-5 border border-white/5"
        >
          <div className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-4 pb-2 border-b border-white/5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            Bottleneck Leaderboard (Trailers per Site)
          </div>
          {congestion.every(c => c.count === 0) ? (
            <div className="text-neutral-500 text-sm py-16 text-center">No bottleneck congestion detected.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={congestion} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" allowDecimals={false} fontSize={11} />
                <YAxis type="category" dataKey="site" stroke="#94a3b8" width={90} fontSize={11} />
                <Tooltip contentStyle={{ background: 'rgba(15, 17, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Bar dataKey="count" fill="url(#orangeGradient)" radius={[0, 6, 6, 0]}>
                  {congestion.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#ff5500' : '#ffaa00'} />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="orangeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ffaa00" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#ff5500" stopOpacity={1}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Row 3: Daily Delivery Trend Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.15 }} 
        className="glass-panel rounded-2xl p-5 border border-white/5"
      >
        <div className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-4 pb-2 border-b border-white/5 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Daily Precast Delivery Trends
        </div>
        {dailyTrend.length === 0 ? (
          <div className="text-neutral-500 text-sm py-16 text-center">No deliveries logged in system database.</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ background: 'rgba(15, 17, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
              <Legend iconSize={8} iconType="circle" />
              <Line type="monotone" dataKey="trips" stroke="#ffaa00" strokeWidth={3} dot={{ r: 4, strokeWidth: 1 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="volume" name="Volume (m³)" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 1 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Row 4: Kanban Status Board */}
      <div className="space-y-4">
        <div className="text-xs uppercase tracking-widest font-bold text-slate-400 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Trailer Dispatch & Logistics Board
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {KANBAN_COLUMNS.map(col => {
            const items = current.filter(e => columnFor(e.status_text).key === col.key)
            return (
              <div key={col.key} className="glass-panel border border-white/5 rounded-2xl p-3 min-h-[160px] flex flex-col">
                <div className="text-[11px] uppercase tracking-wider font-extrabold pb-2 border-b border-white/5 flex items-center justify-between mb-3" style={{ color: col.color }}>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: col.color, boxShadow: `0 0 8px ${col.color}` }} />
                    {col.label}
                  </span>
                  <span className="bg-white/5 text-slate-300 px-2 py-0.5 rounded text-[10px]">{items.length}</span>
                </div>
                <div className="space-y-2 flex-grow">
                  {items.map(e => (
                    <motion.div
                      key={e.trailer_id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-xs bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-xl px-3 py-2 flex flex-col gap-1 shadow-md shadow-black/5 dark:shadow-black/30 hover:border-red-500/20 transition-all duration-200"
                    >
                      <span className="font-extrabold text-neutral-800 dark:text-white">{trailerPlates[e.trailer_id] || e.trailer_id.slice(0, 8)}</span>
                      {e.site_location && (
                        <span className="text-[10px] text-slate-400 tracking-wide truncate">📍 {e.site_location}</span>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
