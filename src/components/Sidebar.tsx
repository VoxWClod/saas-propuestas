import { LayoutDashboard, FileText, FileStack, Users, TrendingUp, LogIn } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

interface SidebarProps {
    session: Session | null;
    onLoginClick: () => void;
}

export default function Sidebar({ session, onLoginClick }: SidebarProps) {
    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', active: true },
        { icon: FileText, label: 'Proposals', active: false },
        { icon: FileStack, label: 'Templates', active: false },
        { icon: Users, label: 'Clients', active: false },
        { icon: TrendingUp, label: 'Analytics', active: false },
    ];

    const getInitials = () => {
        if (!session?.user) return '';
        const email = session.user.email || '';
        const name = session.user.user_metadata?.full_name || '';
        if (name) {
            return name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
        }
        return email.substring(0, 2).toUpperCase();
    };

    return (
        <div className="w-52 bg-slate-900 text-white h-screen flex flex-col">
            {/* Logo */}
            <div className="p-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-sm">
                    P
                </div>
                <span className="font-semibold text-lg">Propel.ai</span>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 px-3">
                {menuItems.map((item) => (
                    <button
                        key={item.label}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${item.active
                            ? 'bg-slate-800 text-white'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-slate-800">
                {session ? (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium">{getInitials()}</span>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <div className="text-sm font-medium truncate">{session.user.user_metadata?.full_name || 'Usuario'}</div>
                            <div className="text-xs text-slate-400 truncate">{session.user.email}</div>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={onLoginClick}
                        className="w-full flex items-center justify-center gap-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
                    >
                        <LogIn className="w-4 h-4" />
                        Iniciar Sesión
                    </button>
                )}
            </div>
        </div>
    );
}
