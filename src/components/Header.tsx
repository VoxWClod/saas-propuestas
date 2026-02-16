import { Search, Bell, Plus, LogIn } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import ProposalForm from './ProposalForm';

interface HeaderProps {
    session: Session | null;
    onOpenAuth: () => void;
}

export default function Header({ session, onOpenAuth }: HeaderProps) {
    const [showForm, setShowForm] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <>
            <div className="bg-white border-b border-gray-200 px-8 py-4">
                <div className="flex items-center justify-between">
                    {/* Search Bar */}
                    <div className="flex-1 max-w-xl">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search proposals, clients, or templates..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4 ml-6">
                        {session ? (
                            <>
                                {/* Notification Bell */}
                                <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                    <Bell className="w-5 h-5" />
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full"></span>
                                </button>

                                {/* User Info / Logout */}
                                <div className="flex items-center gap-3 mr-2">
                                    <div className="text-right hidden md:block">
                                        <p className="text-sm font-medium text-gray-900">{session.user.user_metadata.full_name || session.user.email}</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="text-xs text-gray-500 hover:text-red-500 underline"
                                    >
                                        Salir
                                    </button>
                                </div>

                                {/* Create New Proposal Button */}
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-sm transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                    Create New Proposal
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onOpenAuth}
                                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                            >
                                <LogIn className="w-5 h-5" />
                                Iniciar Sesión / Registrarse
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Proposal Form Modal */}
            {showForm && <ProposalForm onClose={() => setShowForm(false)} />}
        </>
    );
}
