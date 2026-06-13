import { NavLink, useLocation } from 'react-router-dom';
import { Sparkles, Bookmark, Calendar, FileText, Home, Lightbulb } from 'lucide-react';
import { cn } from '@/utils/helpers';

const navItems = [
  { to: '/', icon: Sparkles, label: '灵感广场', description: '发现好创意' },
  { to: '/collection', icon: Bookmark, label: '采集箱', description: '我的收藏' },
  { to: '/experiments', icon: Calendar, label: '实验计划', description: '试播安排' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 bg-white/80 backdrop-blur-xl border-r border-slate-100">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-glow-indigo">
            <Lightbulb className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">灵感空间站</h1>
            <p className="text-xs text-slate-500">让创意落地开花</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map(({ to, icon: Icon, label, description }) => {
            const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
            return (
              <NavLink key={to} to={to} className="block">
                <div className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group',
                  isActive
                    ? 'bg-gradient-to-r from-brand-primary to-indigo-600 text-white shadow-glow-indigo'
                    : 'text-slate-600 hover:bg-indigo-50 hover:text-brand-primary'
                )}>
                  <Icon className={cn(
                    'w-5 h-5 shrink-0 transition-transform group-hover:scale-110',
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-primary'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-semibold truncate', isActive ? 'text-white' : '')}>{label}</p>
                    <p className={cn('text-xs truncate', isActive ? 'text-indigo-200' : 'text-slate-400')}>{description}</p>
                  </div>
                </div>
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-brand-secondary" />
            <span className="text-sm font-semibold text-slate-700">今日灵感</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            「好的创意来自大量的观察和记录，别让好点子只停留在聊天记录里」
          </p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=current"
            alt="用户头像"
            className="w-9 h-9 rounded-full bg-indigo-100"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-700 truncate">运营小达人</p>
            <p className="text-xs text-slate-500 truncate">内容电商团队</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
