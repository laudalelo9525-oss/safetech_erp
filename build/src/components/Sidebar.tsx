import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import safetechLogo from '../assets/safetech_logo.png'

type SidebarProps = {
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

type SubItem = {
  name: string
  path: string
  isPlaceholder?: boolean
}

type MenuItem = {
  name: string
  icon: string
  subItems: SubItem[]
}

export default function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const location = useLocation()
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  
  // Track open state of the six main sections
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    Planning: false,
    Production: false,
    Stockyard: false,
    Logistics: true, // Keep logistics open by default
    Reports: true,   // Keep reports open by default
    Master: false
  })

  // Load and apply theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const initialTheme = savedTheme || 'dark'
    setTheme(initialTheme)
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  // Toggle Theme helper
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    localStorage.setItem('theme', nextTheme)
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const toggleSection = (name: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [name]: !prev[name]
    }))
  }

  // ERP Menu structure definition
  const menuStructure: MenuItem[] = [
    {
      name: 'Planning',
      icon: '📅',
      subItems: [
        { name: 'Project Master', path: '/planning?tab=projects' },
        { name: 'Element Planning', path: '/planning?tab=elements' },
        { name: 'Casting Calendar', path: '/planning?tab=calendar' },
        { name: 'Bed Utilization', path: '/planning?tab=beds' }
      ]
    },
    {
      name: 'Production',
      icon: '⚙️',
      subItems: [
        { name: 'Casting Log', path: '/production?tab=casting' },
        { name: 'Reinforcement Tracking', path: '/production?tab=rebar' },
        { name: 'QC Inspection', path: '/production?tab=qc' }
      ]
    },
    {
      name: 'Stockyard',
      icon: '🏗️',
      subItems: [
        { name: 'Element Inventory', path: '/stockyard?tab=inventory' },
        { name: 'Yard Movement', path: '/stockyard?tab=movement' },
        { name: 'Curing Tracker', path: '/stockyard?tab=curing' }
      ]
    },
    {
      name: 'Logistics',
      icon: '🚚',
      subItems: [
        { name: 'Trailer Dispatch Log', path: '/dispatch' },
        { name: 'Fleet Status Board', path: '/fleet' },
        { name: 'Delivery Note Gen', path: '/delivery-note' },
        { name: 'Delivery Plan Builder', path: '/delivery-plan' },
        { name: 'Dispatch Planning', path: '/logistics/planning' },
        { name: 'QR Scanner & Profile', path: '/qr-scanner' }
      ]
    },
    {
      name: 'Reports',
      icon: '📊',
      subItems: [
        { name: 'Daily Operations Log', path: '/reports' }
      ]
    },
    {
      name: 'Master',
      icon: '🗄️',
      subItems: [
        { name: 'Master Data CRUD', path: '/master' }
      ]
    },
    {
      name: 'Maintenance',
      icon: '🔧',
      subItems: [
        { name: 'Equipment Maintenance', path: '/maintenance' }
      ]
    }
  ]

  return (
    <>
      {/* Mobile Drawer Overlay Background */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
        />
      )}

      {/* SIDEBAR WRAPPER */}
      <aside className={`fixed top-0 bottom-0 left-0 w-64 bg-white dark:bg-[#0c0c0f] border-r border-slate-200 dark:border-red-500/10 shadow-2xl z-50 transform md:transform-none transition-transform duration-300 flex flex-col justify-between ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            {/* Round Logo Wrapper */}
            <div className="w-11 h-11 rounded-xl bg-black border border-neutral-800 flex items-center justify-center p-1 shrink-0 shadow-lg shadow-black/25">
              <img src={safetechLogo} alt="Safetech" className="w-full h-full object-contain rounded-lg" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-black text-sm tracking-tight text-neutral-900 dark:text-white leading-none">SAFETECH</span>
              <span className="text-[10px] text-red-500 font-extrabold uppercase mt-0.5 tracking-widest leading-none">OPERATIONS</span>
              <span className="text-[8px] text-slate-400 font-semibold uppercase mt-0.5 tracking-wider truncate">Control Panel</span>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-grow py-4 overflow-y-auto px-3.5 space-y-3.5">
          {menuStructure.map(menu => {
            const isExpanded = expandedMenus[menu.name]
            
            return (
              <div key={menu.name} className="space-y-1">
                {/* Top Level Category Link */}
                <button
                  onClick={() => toggleSection(menu.name)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 text-slate-600 dark:text-slate-400 hover:text-red-500 hover:bg-red-500/5 font-extrabold text-xs uppercase tracking-wider group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm opacity-80 group-hover:scale-115 transition-transform duration-200">{menu.icon}</span>
                    <span>{menu.name}</span>
                  </div>
                  <span className={`text-[10px] font-bold transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                    ▶
                  </span>
                </button>

                {/* Sub Menu Links */}
                {isExpanded && (
                  <div className="pl-6.5 space-y-1 border-l-2 border-slate-100 dark:border-red-500/10 ml-5 py-1.5 transition-all">
                    {menu.subItems.map(sub => {
                      const isActive = location.pathname === sub.path

                      if (sub.isPlaceholder) {
                        return (
                          <div
                            key={sub.name}
                            onClick={() => alert(`${sub.name} ERP module is pre-planned and will be deployed in the next development phase!`)}
                            className="block px-3 py-1.5 rounded-lg text-slate-400 dark:text-slate-500 font-semibold text-[11px] cursor-not-allowed hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                          >
                            🔒 {sub.name}
                          </div>
                        )
                      }

                      return (
                        <Link
                          key={sub.name}
                          to={sub.path}
                          onClick={() => setMobileOpen(false)}
                          className={`block px-3 py-1.5 rounded-lg text-[11.5px] font-bold tracking-wide transition-all ${
                            isActive
                              ? 'bg-red-500/15 text-red-500 border border-red-500/20 shadow-sm shadow-red-500/10'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                          }`}
                        >
                          {sub.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Sidebar Footer with Theme Toggle */}
        <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/10 flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-neutral-800 flex items-center justify-center font-bold text-xs uppercase text-slate-600 dark:text-slate-300">
              AD
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-extrabold text-neutral-800 dark:text-slate-200 truncate">Administrator</span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 truncate leading-none mt-0.5">admin@safetech.ae</span>
            </div>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-red-500/20 text-xs font-bold transition-all shadow-sm group"
          >
            <span className="uppercase tracking-wider">
              {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </span>
            <span className="text-xs group-hover:animate-pulse">
              {theme === 'dark' ? 'Toggle Light' : 'Toggle Dark'}
            </span>
          </button>
        </div>

      </aside>
    </>
  )
}
