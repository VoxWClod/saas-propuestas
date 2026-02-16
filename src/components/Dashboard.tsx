import { DollarSign, TrendingUp, Send, Sparkles, ArrowRight, MoreVertical, FileText, Edit } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getUserProposals, type Proposal } from '../lib/proposalService';
import { supabase } from '../lib/supabase';
import ProposalForm from './ProposalForm';
import { ErrorBoundary } from './ErrorBoundary';

export default function Dashboard() {
    const metrics = [
        {
            icon: DollarSign,
            label: 'Pipeline Value',
            value: '$124,500',
            change: '+12.5%',
            positive: true,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
        },
        {
            icon: TrendingUp,
            label: 'Conversion Rate',
            value: '42%',
            change: '+4.2%',
            positive: true,
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-600',
        },
        {
            icon: Send,
            label: 'Proposals Sent',
            value: '28',
            subtitle: 'This Month',
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600',
        },
    ];

    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loadingProposals, setLoadingProposals] = useState(true);
    const [showProposalForm, setShowProposalForm] = useState(false);
    const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

    // Cargar propuestas de Supabase
    useEffect(() => {
        async function loadProposals() {
            try {
                const data = await getUserProposals();
                setProposals(data);
            } catch (error) {
                console.error('Error cargando propuestas:', error);
                // Si no está autenticado o hay error, mostrar vacío
            } finally {
                setLoadingProposals(false);
            }
        }

        async function syncPhone() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user && user.user_metadata?.phone && !user.phone) {
                    console.log('🔄 Sincronizando teléfono de metadata a perfil...', user.user_metadata.phone);
                    const { error } = await supabase.auth.updateUser({
                        phone: user.user_metadata.phone
                    });
                    if (error) console.warn('⚠️ Error sincronizando teléfono (posible SMS requerido):', error.message);
                    else console.log('✅ Teléfono sincronizado correctamente');
                }
            } catch (e) {
                console.error('Error en syncPhone:', e);
            }
        }

        loadProposals();
        syncPhone();
    }, []);

    // Formatear fecha
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const activities = [
        {
            id: 1,
            action: 'viewed',
            client: 'Acme Corp',
            proposal: 'Website Redesign',
            time: '2 minutes ago',
            icon: '👁️',
        },
        {
            id: 2,
            action: 'signed',
            client: 'Wayne Ent',
            proposal: 'Security Audit',
            time: '2 hours ago',
            icon: '✓',
        },
        {
            id: 3,
            action: 'sent to',
            client: 'Globex Corp',
            proposal: '',
            time: '5 hours ago',
            icon: '📧',
        },
    ];

    return (
        <div className="flex-1 bg-gray-50 overflow-auto">
            <div className="p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">Overview</h1>
                        <p className="text-gray-600">Here's what's happening with your proposals today.</p>
                    </div>
                    <span className="text-sm text-gray-500">Last updated: Just now</span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {metrics.map((metric, index) => (
                        <div key={index} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`${metric.iconBg} ${metric.iconColor} p-3 rounded-lg`}>
                                    <metric.icon className="w-5 h-5" />
                                </div>
                                {metric.change && (
                                    <span className={`text-xs font-medium ${metric.positive ? 'text-green-600' : 'text-red-600'}`}>
                                        {metric.change}
                                    </span>
                                )}
                            </div>
                            <div className="text-3xl font-bold text-gray-900 mb-1">{metric.value}</div>
                            <div className="text-sm text-gray-600">{metric.subtitle || metric.label}</div>
                        </div>
                    ))}

                    {/* AI Insight Card */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-orange-600" />
                            <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">AI Insight</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-4">
                            Proposals sent on <span className="font-semibold text-orange-600">Tuesday mornings</span> have a 15% higher open rate. You have 3 drafts ready.
                        </p>
                        <button className="flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700">
                            View Drafts
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Proposals Table */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Recent Proposals ({proposals.length})</h2>
                            <button className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Proposal Name</th>
                                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Client</th>
                                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Created</th>
                                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {loadingProposals ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                                Cargando propuestas...
                                            </td>
                                        </tr>
                                    ) : proposals.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                                No hay propuestas guardadas aún.
                                            </td>
                                        </tr>
                                    ) : (
                                        proposals.map((proposal) => (
                                            <tr key={proposal.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                                                            <FileText className="w-4 h-4" />
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-900">{proposal.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {proposal.metadata?.nombreEmpresa || proposal.metadata?.nombreCliente || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{formatDate(proposal.created_at)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedProposal(proposal);
                                                                setShowProposalForm(true);
                                                            }}
                                                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                            title="Editar Propuesta"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-6">
                        {/* Client Activity */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Client Activity</h3>
                                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">Live</span>
                            </div>
                            <div className="p-6">
                                <div className="relative bg-slate-900 rounded-lg overflow-hidden h-48 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/40 to-blue-900/40"></div>
                                    <div className="relative z-10 flex items-center gap-2 text-white">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                        <span className="text-sm font-medium">New view in New York</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Live Feed */}
                        <div className="bg-white rounded-xl border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">Live Feed</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                {activities.map((activity) => (
                                    <div key={activity.id} className="flex items-start gap-3">
                                        <div className="text-lg">{activity.icon}</div>
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-700">
                                                <span className="font-medium text-gray-900">{activity.client}</span>{' '}
                                                {activity.action}{' '}
                                                {activity.proposal && (
                                                    <span className="font-medium text-orange-600">{activity.proposal}</span>
                                                )}
                                            </p>
                                            {activity.time && <p className="text-xs text-gray-500 mt-1">{activity.time}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showProposalForm && (
                <ErrorBoundary>
                    <ProposalForm
                        onClose={() => {
                            setShowProposalForm(false);
                            setSelectedProposal(null);
                            // Recargar propuestas al cerrar por si hubo cambios
                            getUserProposals().then(setProposals).catch(console.error);
                        }}
                        initialProposal={selectedProposal}
                    />
                </ErrorBoundary>
            )}
        </div>
    );
}
