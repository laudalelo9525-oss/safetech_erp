import React, { useState, useMemo } from 'react'
import { PROJECTS, VILLAS, MASTER_ELEMENTS } from '../data/deliveryPlanData'

type PlanRow = {
  id: string
  date: string
  projectNo: string
  projectName: string
  type: string
  floor: string
  elementId: string
  qty: number
  description: string
  villaNo: string
  bay: string
  rack: string
  volume: number
  weight: number
  remarks: string
}

export default function DeliveryPlanPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [projectCode, setProjectCode] = useState(PROJECTS[0].code)
  const [villaQuery, setVillaQuery] = useState('')
  const [showVillaDropdown, setShowVillaDropdown] = useState(false)
  const [selectedVilla, setSelectedVilla] = useState<{ villaNo: string; typeKey: string; villaType: string } | null>(null)
  const [floor, setFloor] = useState('')
  const [checkedElements, setCheckedElements] = useState<Record<string, boolean>>({})
  const [planItems, setPlanItems] = useState<PlanRow[]>([])

  const project = useMemo(() => PROJECTS.find(p => p.code === projectCode) || PROJECTS[0], [projectCode])

  // Villas belonging to the selected project, filtered by search text
  const villaMatches = useMemo(() => {
    const pool = VILLAS.filter(v => v.project === projectCode)
    if (!villaQuery) return pool.slice(0, 30)
    const q = villaQuery.toLowerCase()
    return pool.filter(v => v.villaNo.toLowerCase().includes(q)).slice(0, 30)
  }, [projectCode, villaQuery])

  // Floors available for the selected project + villa type
  const availableFloors = useMemo(() => {
    if (!selectedVilla) return []
    const set = new Set(
      MASTER_ELEMENTS
        .filter(e => e.project === projectCode && e.typeKey === selectedVilla.typeKey)
        .map(e => e.floor)
    )
    return Array.from(set)
  }, [projectCode, selectedVilla])

  // Element BOM matching project + villa type + floor
  const matchingElements = useMemo(() => {
    if (!selectedVilla || !floor) return []
    return MASTER_ELEMENTS.filter(e => e.project === projectCode && e.typeKey === selectedVilla.typeKey && e.floor === floor)
  }, [projectCode, selectedVilla, floor])

  const resetSelection = () => {
    setSelectedVilla(null)
    setVillaQuery('')
    setFloor('')
    setCheckedElements({})
  }

  const toggleElement = (elementId: string, checked: boolean) => {
    setCheckedElements(prev => ({ ...prev, [elementId]: checked }))
  }

  const toggleAllElements = (checked: boolean) => {
    const next: Record<string, boolean> = {}
    matchingElements.forEach(e => { next[e.elementId] = checked })
    setCheckedElements(next)
  }

  const addCheckedToPlan = () => {
    if (!selectedVilla) return
    const toAdd = matchingElements.filter(e => checkedElements[e.elementId])
    if (toAdd.length === 0) return
    const rows: PlanRow[] = toAdd.map(e => ({
      id: `${Date.now()}-${e.elementId}-${Math.random().toString(36).slice(2, 7)}`,
      date,
      projectNo: `P${project.code}`,
      projectName: project.name,
      type: selectedVilla.villaType,
      floor: e.floor,
      elementId: e.elementId,
      qty: e.qtyPerVilla || 1,
      description: e.product || 'Panel',
      villaNo: selectedVilla.villaNo,
      bay: '',
      rack: '',
      volume: e.volume ?? 0,
      weight: e.weight ?? 0,
      remarks: ''
    }))
    setPlanItems(prev => [...prev, ...rows])
    setCheckedElements({})
  }

  const updatePlanItem = (id: string, field: keyof PlanRow, value: any) => {
    setPlanItems(prev => prev.map(item => {
      if (item.id !== id) return item
      let parsed = value
      if (field === 'qty') parsed = value === '' ? '' : parseInt(value, 10)
      if (field === 'volume' || field === 'weight') parsed = value === '' ? '' : parseFloat(value)
      return { ...item, [field]: parsed }
    }))
  }

  const removePlanItem = (id: string) => {
    setPlanItems(prev => prev.filter(item => item.id !== id))
  }

  const totals = useMemo(() => {
    let qty = 0, volume = 0, weight = 0
    planItems.forEach(i => {
      qty += Number(i.qty) || 0
      volume += Number(i.volume) || 0
      weight += Number(i.weight) || 0
    })
    return { qty, volume: Number(volume.toFixed(2)), weight: Number(weight.toFixed(2)) }
  }, [planItems])

  const formattedDate = useMemo(() => {
    if (!date) return date
    const parts = date.split('-')
    if (parts.length !== 3) return date
    const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']
    return `${parseInt(parts[2], 10)} - ${months[parseInt(parts[1], 10) - 1] || ''} - ${parts[0]}`
  }, [date])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/5 no-print">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white uppercase">
            Delivery Plan <span className="text-red-500 font-light">Builder</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Pick a phase, villa and floor to pull the element BOM automatically, then build a loading/delivery plan
          </p>
        </div>
        <div className="flex gap-2 mt-3 md:mt-0">
          <button
            onClick={() => setPlanItems([])}
            className="text-xs bg-slate-900 border border-white/5 hover:border-red-500/20 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl btn-interactive transition-all"
          >
            Clear Plan
          </button>
          <button
            onClick={() => window.print()}
            className="text-xs bg-gradient-to-br from-red-500 to-red-700 text-white font-extrabold uppercase px-5 py-2.5 rounded-xl btn-interactive shadow-lg shadow-red-500/25 transition-all"
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        {/* LEFT: Lookup form */}
        <div className="xl:col-span-2 space-y-4 no-print">
          <div className="glass-panel rounded-2xl p-5 border border-white/5 shadow-xl space-y-4">
            <div className="text-xs uppercase tracking-widest font-extrabold text-slate-400 pb-2 border-b border-white/5">
              Lookup Element BOM
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[10px] uppercase font-bold text-slate-500">Date</span>
                <input type="date" className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" value={date} onChange={e => setDate(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase font-bold text-slate-500">Phase / Project</span>
                <select
                  className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs"
                  value={projectCode}
                  onChange={e => { setProjectCode(e.target.value); resetSelection() }}
                >
                  {PROJECTS.map(p => <option key={p.code} value={p.code}>{p.name} (P{p.code})</option>)}
                </select>
              </label>
            </div>

            <div className="relative">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Villa No.</span>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-lg glowing-input text-xs"
                placeholder={selectedVilla ? `${selectedVilla.villaNo} - ${selectedVilla.villaType}` : 'Type villa number…'}
                value={villaQuery}
                onFocus={() => setShowVillaDropdown(true)}
                onChange={e => { setVillaQuery(e.target.value); setShowVillaDropdown(true) }}
              />
              {selectedVilla && (
                <button
                  type="button"
                  onClick={resetSelection}
                  className="absolute right-3 top-6 text-xs text-red-500 hover:text-red-400 font-extrabold"
                >
                  Clear
                </button>
              )}
              {showVillaDropdown && (
                <div className="absolute left-0 right-0 mt-1 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-white/5">
                  {villaMatches.length === 0 ? (
                    <div className="p-3 text-xs text-slate-500 text-center">No matching villas</div>
                  ) : (
                    villaMatches.map(v => (
                      <div
                        key={v.villaNo}
                        onClick={() => {
                          setSelectedVilla({ villaNo: v.villaNo, typeKey: v.typeKey, villaType: v.villaType })
                          setVillaQuery(v.villaNo)
                          setFloor('')
                          setCheckedElements({})
                          setShowVillaDropdown(false)
                        }}
                        className="p-2.5 text-xs text-slate-300 hover:bg-red-500/10 hover:text-white cursor-pointer transition-colors duration-150 flex flex-col gap-0.5"
                      >
                        <span className="font-extrabold text-red-400">{v.villaNo}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{v.villaType}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <label className="block">
              <span className="text-[10px] uppercase font-bold text-slate-500">Floor</span>
              <select
                className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs"
                value={floor}
                disabled={!selectedVilla}
                onChange={e => { setFloor(e.target.value); setCheckedElements({}) }}
              >
                <option value="">{selectedVilla ? 'Select floor…' : 'Select a villa first'}</option>
                {availableFloors.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </label>
          </div>

          {selectedVilla && floor && (
            <div className="glass-panel rounded-2xl p-5 border border-white/5 shadow-xl space-y-3">
              <div className="text-xs uppercase tracking-widest font-extrabold text-slate-400 pb-2 border-b border-white/5 flex items-center justify-between">
                <span>Elements Found ({matchingElements.length})</span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => toggleAllElements(true)} className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase">Select All</button>
                  <button type="button" onClick={() => toggleAllElements(false)} className="text-[10px] text-slate-500 hover:text-slate-300 font-bold uppercase">None</button>
                </div>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {matchingElements.map(e => (
                  <label key={e.elementId} className="flex items-center gap-2.5 bg-slate-950/50 p-2 rounded-lg border border-white/5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!checkedElements[e.elementId]}
                      onChange={ev => toggleElement(e.elementId, ev.target.checked)}
                      className="accent-red-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-mono font-bold text-slate-200 truncate">{e.elementId}</div>
                      <div className="text-[10px] text-slate-500">{e.product} · Vol {e.volume ?? '-'} m³ · Wt {e.weight ?? '-'} T</div>
                    </div>
                  </label>
                ))}
              </div>
              <button
                onClick={addCheckedToPlan}
                className="w-full bg-gradient-to-br from-red-500 to-red-700 text-white font-extrabold uppercase py-2.5 rounded-xl tracking-wider text-xs btn-interactive shadow-lg shadow-red-500/25"
              >
                Add Selected to Plan
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: Editable plan + print preview */}
        <div className="xl:col-span-3 space-y-4">
          <div className="glass-panel rounded-2xl p-5 border border-white/5 shadow-xl no-print">
            <div className="text-xs uppercase tracking-widest font-extrabold text-slate-400 pb-2 border-b border-white/5 mb-3">
              Plan Items ({planItems.length}) — edit BAY / Rack / Qty / Remarks inline
            </div>
            {planItems.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-6">No elements added yet. Look up a villa + floor on the left to begin.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-slate-300">
                  <thead>
                    <tr className="text-left text-slate-500 uppercase text-[9px] border-b border-white/10">
                      <th className="p-1.5">Element ID</th>
                      <th className="p-1.5">Villa</th>
                      <th className="p-1.5">Floor</th>
                      <th className="p-1.5 w-16">Qty</th>
                      <th className="p-1.5 w-20">Bay</th>
                      <th className="p-1.5 w-20">Rack</th>
                      <th className="p-1.5">Remarks</th>
                      <th className="p-1.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {planItems.map(item => (
                      <tr key={item.id}>
                        <td className="p-1.5 font-mono">{item.elementId}</td>
                        <td className="p-1.5">{item.villaNo}</td>
                        <td className="p-1.5">{item.floor}</td>
                        <td className="p-1.5">
                          <input type="number" className="w-14 px-1.5 py-1 glowing-input rounded text-[11px]" value={item.qty} onChange={e => updatePlanItem(item.id, 'qty', e.target.value)} />
                        </td>
                        <td className="p-1.5">
                          <input className="w-16 px-1.5 py-1 glowing-input rounded text-[11px]" value={item.bay} onChange={e => updatePlanItem(item.id, 'bay', e.target.value)} />
                        </td>
                        <td className="p-1.5">
                          <input className="w-16 px-1.5 py-1 glowing-input rounded text-[11px]" value={item.rack} onChange={e => updatePlanItem(item.id, 'rack', e.target.value)} />
                        </td>
                        <td className="p-1.5">
                          <input className="w-full px-1.5 py-1 glowing-input rounded text-[11px]" value={item.remarks} onChange={e => updatePlanItem(item.id, 'remarks', e.target.value)} />
                        </td>
                        <td className="p-1.5">
                          <button onClick={() => removePlanItem(item.id)} className="text-red-500 hover:text-red-400 text-[10px] font-bold">Del</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Print sheet - mirrors "sample plan format" loading details layout */}
          <div className="w-[297mm] min-h-[210mm] bg-white text-black p-6 font-sans border border-neutral-300 shadow-2xl text-[10px] leading-normal print-area print:border-none print:shadow-none mx-auto">
            <div className="flex justify-between items-start border-b border-black pb-2 mb-3">
              <div className="flex flex-col leading-tight">
                <span className="font-extrabold text-[13px] tracking-tight">SAFETECH PRECAST BUILDING MANUFACTURING LLC</span>
                <span className="text-[8.5px] text-neutral-600 font-semibold">National Industrial Park, Dubai - UAE | PO Box: 18337 - Jebel Ali</span>
                <span className="text-[8.5px] text-neutral-600 font-semibold">Tel: 04-8813195 Fax: 04-2829929 Email: info@safe-tech.ae</span>
              </div>
              <div className="text-right">
                <div className="font-black text-xs tracking-widest border border-black px-4 py-1 bg-neutral-100">LOADING DETAILS</div>
                <div className="text-[9px] mt-1 font-bold">{formattedDate}</div>
              </div>
            </div>

            <table className="w-full border-collapse border border-black text-[9px]">
              <thead>
                <tr className="bg-neutral-100 border-b border-black text-center font-extrabold">
                  <th className="border-r border-black p-1">Date</th>
                  <th className="border-r border-black p-1">Project No.</th>
                  <th className="border-r border-black p-1">Project Name</th>
                  <th className="border-r border-black p-1">Type</th>
                  <th className="border-r border-black p-1">Floor</th>
                  <th className="border-r border-black p-1">Element ID / Mark No.</th>
                  <th className="border-r border-black p-1">QTY.</th>
                  <th className="border-r border-black p-1">Description</th>
                  <th className="border-r border-black p-1">Villa No.</th>
                  <th className="border-r border-black p-1">BAY</th>
                  <th className="border-r border-black p-1">Rack</th>
                  <th className="border-r border-black p-1">Volume (m3)</th>
                  <th className="border-r border-black p-1">Weight (Tons)</th>
                  <th className="p-1">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {planItems.map((item, idx) => (
                  <tr key={item.id} className="border-b border-black text-center h-[18px]">
                    <td className="border-r border-black p-1">{item.date}</td>
                    <td className="border-r border-black p-1">{item.projectNo}</td>
                    <td className="border-r border-black p-1 text-left">{item.projectName}</td>
                    <td className="border-r border-black p-1">{item.type}</td>
                    <td className="border-r border-black p-1">{item.floor}</td>
                    <td className="border-r border-black p-1 font-mono text-left">{item.elementId}</td>
                    <td className="border-r border-black p-1 font-bold">{item.qty}</td>
                    <td className="border-r border-black p-1 text-left">{item.description}</td>
                    <td className="border-r border-black p-1">{item.villaNo}</td>
                    <td className="border-r border-black p-1">{item.bay}</td>
                    <td className="border-r border-black p-1">{item.rack}</td>
                    <td className="border-r border-black p-1">{item.volume}</td>
                    <td className="border-r border-black p-1">{item.weight}</td>
                    <td className="p-1">{item.remarks}</td>
                  </tr>
                ))}
                <tr className="bg-neutral-50 font-extrabold border-t border-black text-center h-[20px]">
                  <td className="border-r border-black p-1 text-red-600 uppercase" colSpan={6}>GRAND TOTAL:</td>
                  <td className="border-r border-black p-1 text-red-600">{totals.qty}</td>
                  <td className="border-r border-black p-1" colSpan={4}></td>
                  <td className="border-r border-black p-1 text-red-600">{totals.volume}</td>
                  <td className="border-r border-black p-1 text-red-600">{totals.weight}</td>
                  <td className="p-1"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
