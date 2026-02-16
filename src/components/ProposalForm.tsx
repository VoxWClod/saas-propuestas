import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import mammoth from 'mammoth';
import { downloadAsDocx, downloadAsPDF, downloadHtmlAsDocx } from '../lib/downloadUtils';
import { saveProposal, updateProposal, type Proposal } from '../lib/proposalService';
import { supabase } from '../lib/supabase';

const PREVIEW_STYLES = `
    .document-preview h1, .document-preview h2, .document-preview h3, .document-preview h4 {
        font-weight: bold;
        margin-bottom: 12px;
        margin-top: 20px;
        color: #000000;
    }
    .document-preview h1 {
        font-size: 14pt;
        text-align: center;
        line-height: 1.3;
        margin-bottom: 16px;
        margin-top: 0;
    }
    .document-preview h2 {
        font-size: 11pt;
        text-align: left;
        margin-top: 18px;
        margin-bottom: 12px;
    }
    .document-preview h3 {
        font-size: 11pt;
        margin-top: 12px;
        margin-bottom: 8px;
    }

    .document-preview p {
        text-align: justify;
        margin-bottom: 12px;
        line-height: 1.6;
    }
    .document-preview ul {
        margin-left: 40px;
        margin-bottom: 12px;
        margin-top: 8px;
        list-style-type: disc;
    }
    .document-preview ol {
        margin-left: 40px;
        margin-bottom: 12px;
        margin-top: 8px;
    }
    .document-preview li {
        margin-bottom: 6px;
        text-align: justify;
    }
    .document-preview strong, .document-preview b {
        font-weight: bold;
    }
    .document-preview em, .document-preview i {
        font-style: italic;
    }
    .document-preview hr {
        border: none;
        border-top: 1px solid #000000;
        margin: 16px 0;
    }
    .document-preview table {
        width: 100%;
        border-collapse: collapse;
        margin: 12px 0;
    }
    .document-preview td, .document-preview th {
        padding: 8px;
        text-align: left;
        border: 1px solid #000000;
    }
    .document-preview p[style*="text-align: center"],
    .document-preview p[style*="text-align:center"] {
        text-align: center !important;
    }
    .document-preview h3[style*="text-align: center"],
    .document-preview h3[style*="text-align:center"],
    .document-preview h4[style*="text-align: center"],
    .document-preview h4[style*="text-align:center"] {
        text-align: center !important;
    }
`;

interface ProposalFormProps {
    onClose: () => void;
    initialProposal?: Proposal | null;
}

export default function ProposalForm({ onClose, initialProposal }: ProposalFormProps) {
    const [formData, setFormData] = useState(initialProposal?.metadata || {
        nombreCliente: '',
        nombreEmpresa: '',
        problemaActual: '',
        objetivoPrincipal: '',
        solucionPropuesta: '',
        fechaInicio: '',
        nombreServicio: '',
        precio: '',
        duracion: '',
        pasos: [''],
        entregables: [''],
        tono: 'Professional',
        idioma: 'Español',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewData, setPreviewData] = useState<{ file64: string; html: string; renderedHtml?: string } | null>(
        initialProposal ? {
            file64: initialProposal.file_docx,
            html: initialProposal.content_html,
            renderedHtml: initialProposal.content_html // Assumes content_html is already rendered/ready
        } : null
    );
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [proposalName, setProposalName] = useState(initialProposal?.name || '');
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [showEditMenu, setShowEditMenu] = useState(false);
    const [editMenuPosition, setEditMenuPosition] = useState({ x: 0, y: 0 });

    // Load draft from localStorage on mount if no initialProposal
    useEffect(() => {
        if (!initialProposal) {
            const savedDraft = localStorage.getItem('proposal_draft');
            if (savedDraft) {
                try {
                    setFormData(JSON.parse(savedDraft));
                } catch (e) {
                    console.error('Error loading draft:', e);
                }
            }
        }
    }, [initialProposal]);

    // Save draft to localStorage on change
    useEffect(() => {
        if (!initialProposal) {
            const timeoutId = setTimeout(() => {
                localStorage.setItem('proposal_draft', JSON.stringify(formData));
            }, 500); // Debounce save
            return () => clearTimeout(timeoutId);
        }
    }, [formData, initialProposal]);

    // Procesar HTML del webhook: alineación correcta según tipo de elemento
    useEffect(() => {
        if (previewData?.html) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(previewData.html, 'text/html');

            // H1: Centrado
            doc.querySelectorAll('h1').forEach((el) => {
                (el as HTMLElement).style.textAlign = 'center';
            });

            // H2, H3, H4, H5, H6: Alineados a la IZQUIERDA
            doc.querySelectorAll('h2, h3, h4, h5, h6').forEach((el) => {
                (el as HTMLElement).style.textAlign = 'left';
            });

            // Párrafos y listas: JUSTIFICADOS
            doc.querySelectorAll('p, li').forEach((el) => {
                (el as HTMLElement).style.textAlign = 'justify';
            });

            // Centrar elementos con "$" Y "USD"
            doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6').forEach((el) => {
                const text = el.textContent || '';
                if (text.includes('$') && text.includes('USD')) {
                    (el as HTMLElement).style.textAlign = 'center';
                }
            });

            // SOLO AGREGAR: Centrar "Implementación Completa"
            doc.querySelectorAll('p, h3, h4, strong').forEach((el) => {
                const text = el.textContent || '';
                if (text.trim() === 'Implementación Completa') {
                    (el as HTMLElement).style.textAlign = 'center';
                }
            });

            // SOLO AGREGAR: Centrar datos de contacto (nombre en adelante)
            // PERO NUNCA centrar "Por parte de..." ni párrafos normales
            doc.querySelectorAll('p').forEach((el) => {
                const text = el.textContent || '';

                // NO centrar si contiene "Por parte de"
                if (text.includes('Por parte de')) {
                    return;
                }


                // Poner en negrita "Alexander Sánchez"
                if (text.includes('Alexander Sánchez')) {
                    const html = (el as HTMLElement).innerHTML;
                    (el as HTMLElement).innerHTML = html.replace(/Alexander Sánchez/g, '<strong>Alexander Sánchez</strong>');
                }

                // Centrar solo los datos de contacto (líneas cortas al final)
                if (text.includes('Alexander Sánchez') ||
                    text.includes('Cofundador') ||
                    text.includes('alexander.sanchez@opptima.ai') ||
                    text.includes('0412-') ||
                    text.includes('linkedin.com')) {
                    (el as HTMLElement).setAttribute('style', 'text-align: center !important; line-height: 1.2 !important; margin: 0.25em 0 !important;');
                }

                // Centrar "Opptima AI Agency" SOLO si es una línea corta (datos de contacto)
                if (text.trim() === 'Opptima AI Agency' || (text.includes('Opptima AI Agency') && text.length < 50)) {
                    (el as HTMLElement).setAttribute('style', 'text-align: center !important; line-height: 1.2 !important; margin: 0.25em 0 !important;');
                }
            });

            // Agregar margen a párrafos con asteriscos O a items anidados específicos
            doc.querySelectorAll('p').forEach((p) => {
                const text = (p.textContent || '').trim();

                // Items que empiezan con asterisco
                if (text.startsWith('*')) {
                    p.setAttribute('style', `margin-left: 40px !important; margin-top: 0.5em !important; margin-bottom: 0.5em !important; text-align: justify !important; text-indent: 0 !important;`);
                }

                // Items anidados específicos (aunque no tengan asterisco en el HTML)
                if (text.startsWith('Información y Accesos:') ||
                    text.startsWith('Disponibilidad y Feedback:') ||
                    text.startsWith('Participación:')) {
                    p.setAttribute('style', `margin-left: 40px !important; margin-top: 0.5em !important; margin-bottom: 0.5em !important; text-align: justify !important; text-indent: 0 !important;`);
                }
            });

            // Aplicar estilos a listas HTML existentes
            doc.querySelectorAll('ul, ol').forEach((list) => {
                const parent = list.parentElement;
                const isNested = parent && parent.tagName === 'LI';

                if (isNested) {
                    list.setAttribute('style', 'margin: 0 !important; padding: 0 0 0 40px !important; list-style-position: outside !important;');
                } else {
                    list.setAttribute('style', 'margin: 0 !important; padding: 0 0 0 40px !important; list-style-position: outside !important;');
                }
            });

            doc.querySelectorAll('li').forEach((item) => {
                item.setAttribute('style', 'margin: 0 !important; padding: 0 !important; text-indent: 0 !important;');
            });

            const processedHtml = doc.body.innerHTML;

            setPreviewData(prev => {
                if (!prev) return null;
                if (prev.renderedHtml !== processedHtml) {
                    return { ...prev, renderedHtml: processedHtml };
                }
                return prev;
            });
        }
    }, [previewData?.html]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleArrayChange = (index: number, value: string, field: 'pasos' | 'entregables') => {
        const newArray = [...formData[field]];
        newArray[index] = value;
        setFormData((prev: any) => ({ ...prev, [field]: newArray }));
    };

    const addArrayItem = (field: 'pasos' | 'entregables') => {
        setFormData((prev: any) => ({ ...prev, [field]: [...prev[field], ''] }));
    };

    const removeArrayItem = (index: number, field: 'pasos' | 'entregables') => {
        if (formData[field].length > 1) {
            const newArray = formData[field].filter((_: string, i: number) => i !== index);
            setFormData((prev: any) => ({ ...prev, [field]: newArray }));
        }
    };

    const handleNewProposal = () => {
        setFormData({
            nombreCliente: '',
            nombreEmpresa: '',
            problemaActual: '',
            objetivoPrincipal: '',
            solucionPropuesta: '',
            fechaInicio: '',
            nombreServicio: '',
            precio: '',
            duracion: '',
            pasos: [''],
            entregables: [''],
            tono: 'Professional',
            idioma: 'Español',
        });
        localStorage.removeItem('proposal_draft'); // Clear draft on reset
        setPreviewData(null);
        setProposalName('');
    };

    // Manejar selección de texto para mostrar menú de edición
    const handleTextSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setEditMenuPosition({
                x: rect.left + rect.width / 2,
                y: rect.top - 10
            });
            setShowEditMenu(true);
        } else {
            setShowEditMenu(false);
        }
    };

    // Aplicar formato al texto seleccionado
    const applyFormat = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        setShowEditMenu(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        console.log('🚀 Iniciando envío de propuesta...');

        try {
            // Usar proxy para evitar CORS
            const webhookUrl = '/api/webhook/07d6fcab-9092-4320-9224-e5370ad51e1c';

            console.log('📍 Webhook URL (proxy):', webhookUrl);

            if (!webhookUrl) {
                console.error('❌ Webhook URL no configurada');
                alert('Error: Webhook URL no configurada');
                setIsSubmitting(false);
                return;
            }

            const payload = {
                nombreCliente: formData.nombreCliente,
                nombreEmpresa: formData.nombreEmpresa,
                problemaActual: formData.problemaActual,
                objetivoPrincipal: formData.objetivoPrincipal,
                solucionPropuesta: formData.solucionPropuesta,
                fechaInicio: formData.fechaInicio,
                nombreServicio: formData.nombreServicio,
                precio: Number(formData.precio),
                duracion: formData.duracion,
                pasos: formData.pasos.filter((p: string) => p.trim() !== ''),
                entregables: formData.entregables.filter((e: string) => e.trim() !== ''),
                tono: formData.tono,
                idioma: formData.idioma,
                // Include User Profile Data from Auth
                userInfo: {
                    name: (await supabase.auth.getUser()).data.user?.user_metadata?.full_name || '',
                    email: (await supabase.auth.getUser()).data.user?.email || '',
                    phone: (await supabase.auth.getUser()).data.user?.user_metadata?.phone || ''
                }
            };

            console.log('📦 Payload a enviar:', JSON.stringify(payload, null, 2));

            console.log('📡 Enviando petición al webhook...');
            console.log('🔍 Detalles de la petición:', {
                url: webhookUrl,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            // Agregar timeout de 2 minutos
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000);

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            console.log('📨 Respuesta recibida:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
            });

            const responseText = await response.text();
            console.log('📄 Contenido de respuesta:', responseText);

            if (response.ok) {
                console.log('✅ Propuesta enviada exitosamente');

                // Parsear respuesta de n8n
                try {
                    const data = JSON.parse(responseText);
                    if (data.file64 && data.html) {
                        console.log('📋 Datos recibidos de n8n:', {
                            hasFile: !!data.file64,
                            hasHtml: !!data.html
                        });
                        setPreviewData(data);
                    } else {
                        alert('Respuesta incompleta del servidor: Faltan campos file64 o html');
                    }
                } catch (parseError) {
                    console.error('Error al parsear respuesta:', parseError);
                    alert('Error al procesar la respuesta del servidor: No es JSON válido');
                }
            } else {
                console.error('❌ Error en la respuesta:', response.status, response.statusText);
                alert(`Error al enviar la propuesta (${response.status}): ${response.statusText}`);
            }
        } catch (error) {
            console.error('❌ Error al enviar:', error);
            if (error instanceof Error && error.name === 'AbortError') {
                alert('La petición tardó demasiado (timeout de 2min). Verifica que el webhook esté activo.');
            } else if (error instanceof TypeError && error.message.includes('fetch')) {
                alert('Error de red: No se pudo conectar con el webhook. Verifica CORS o la URL.');
            } else {
                alert('Error al conectar con el webhook: ' + (error as Error).message);
            }
        } finally {
            setIsSubmitting(false);
            console.log('🏁 Proceso de envío finalizado');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
            <div className={`bg-white rounded-xl ${previewData ? 'w-full max-w-7xl' : 'w-full max-w-4xl'} max-h-[90vh] overflow-hidden flex flex-col`}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Nueva Propuesta</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Area */}
                <div className={`flex-1 flex flex-col min-h-0 ${previewData ? 'grid grid-cols-2 divide-x divide-gray-200' : ''}`}>
                    {/* Form Content */}
                    <form id="proposal-form" onSubmit={handleSubmit} className="overflow-y-auto px-6 py-6">
                        <div className="space-y-6">
                            {/* Información del Cliente */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Cliente</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nombre del Cliente *
                                        </label>
                                        <input
                                            type="text"
                                            name="nombreCliente"
                                            value={formData.nombreCliente}
                                            onChange={handleChange}
                                            required
                                            disabled={isSubmitting}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                            placeholder="José"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nombre de la Empresa *
                                        </label>
                                        <input
                                            type="text"
                                            name="nombreEmpresa"
                                            value={formData.nombreEmpresa}
                                            onChange={handleChange}
                                            required
                                            disabled={isSubmitting}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                            placeholder="SportX"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Problema y Objetivo */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Problema y Objetivo</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Problema Actual *
                                        </label>
                                        <textarea
                                            name="problemaActual"
                                            value={formData.problemaActual}
                                            onChange={handleChange}
                                            required
                                            rows={3}
                                            disabled={isSubmitting}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                            placeholder="Pocas ventas"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Objetivo Principal *
                                        </label>
                                        <textarea
                                            name="objetivoPrincipal"
                                            value={formData.objetivoPrincipal}
                                            onChange={handleChange}
                                            required
                                            rows={3}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Automatizar WhatsApp"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Solución Propuesta *
                                        </label>
                                        <textarea
                                            name="solucionPropuesta"
                                            value={formData.solucionPropuesta}
                                            onChange={handleChange}
                                            required
                                            rows={3}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Agente IA para WhatsApp"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Detalles del Servicio */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalles del Servicio</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nombre del Servicio *
                                        </label>
                                        <input
                                            type="text"
                                            name="nombreServicio"
                                            value={formData.nombreServicio}
                                            onChange={handleChange}
                                            required
                                            disabled={isSubmitting}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                            placeholder="Agente IA"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Precio (USD) *
                                        </label>
                                        <input
                                            type="number"
                                            name="precio"
                                            value={formData.precio}
                                            onChange={handleChange}
                                            required
                                            min="0"
                                            step="0.01"
                                            disabled={isSubmitting}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                            placeholder="1000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Duración *
                                        </label>
                                        <input
                                            type="text"
                                            name="duracion"
                                            value={formData.duracion}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="3 semanas"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Fecha de Inicio *
                                        </label>
                                        <input
                                            type="date"
                                            name="fechaInicio"
                                            value={formData.fechaInicio}
                                            onChange={handleChange}
                                            required
                                            disabled={isSubmitting}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Pasos */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Pasos del Proyecto</h3>
                                    <button
                                        type="button"
                                        onClick={() => addArrayItem('pasos')}
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Agregar Paso
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {formData.pasos.map((paso: string, index: number) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={paso}
                                                onChange={(e) => handleArrayChange(index, e.target.value, 'pasos')}
                                                disabled={isSubmitting}
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                                placeholder={`Paso ${index + 1}`}
                                            />
                                            {formData.pasos.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeArrayItem(index, 'pasos')}
                                                    disabled={isSubmitting}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Entregables */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Entregables</h3>
                                    <button
                                        type="button"
                                        onClick={() => addArrayItem('entregables')}
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Agregar Entregable
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {formData.entregables.map((entregable: string, index: number) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={entregable}
                                                onChange={(e) => handleArrayChange(index, e.target.value, 'entregables')}
                                                disabled={isSubmitting}
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                                placeholder={`Entregable ${index + 1}`}
                                            />
                                            {formData.entregables.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeArrayItem(index, 'entregables')}
                                                    disabled={isSubmitting}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Configuración */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tono *
                                        </label>
                                        <select
                                            name="tono"
                                            value={formData.tono}
                                            onChange={handleChange}
                                            required
                                            disabled={isSubmitting}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                        >
                                            <option value="Professional">Profesional</option>
                                            <option value="Friendly">Amigable</option>
                                            <option value="Formal">Formal</option>
                                            <option value="Casual">Casual</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Idioma *
                                        </label>
                                        <select
                                            name="idioma"
                                            value={formData.idioma}
                                            onChange={handleChange}
                                            required
                                            disabled={isSubmitting}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                        >
                                            <option value="Español">Español</option>
                                            <option value="English">English</option>
                                            <option value="Português">Português</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* Preview Panel */}
                    {previewData && (
                        <div className="overflow-y-auto px-6 py-6 bg-gray-100">
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Vista Previa del Documento</h3>
                                <p className="text-sm text-gray-600">Documento generado desde el formulario</p>
                            </div>
                            {previewData.renderedHtml ? (
                                <div>
                                    <style>{`
                                        /* Listas de primer nivel */
                                        ul, ol {
                                            margin: 0 !important;
                                            padding: 0 0 0 20px !important;
                                            list-style-position: outside !important;
                                        }
                                        /* Listas anidadas MÁS indentadas para diferenciarse */
                                        ul ul, ul ol, ol ul, ol ol {
                                            margin: 0 !important;
                                            padding: 0 0 0 40px !important;
                                        }
                                        /* Items sin padding extra */
                                        li {
                                            margin: 0 !important;
                                            padding: 0 !important;
                                            text-indent: 0 !important;
                                        }
                                        /* Eliminar indentación de párrafos */
                                        p {
                                            margin: 0 0 1em 0 !important;
                                            text-indent: 0 !important;
                                        }
                                    `}</style>
                                    <div
                                        className="bg-white shadow-lg rounded-sm mx-auto"
                                        style={{
                                            maxWidth: '816px',
                                            minHeight: '1056px',
                                            padding: '64px',
                                            fontFamily: 'Arial, sans-serif',
                                            fontSize: '11pt',
                                            lineHeight: '1.6',
                                            color: '#000000',
                                        }}
                                    >
                                        <div
                                            contentEditable={true}
                                            suppressContentEditableWarning={true}
                                            onMouseUp={handleTextSelection}
                                            onKeyUp={handleTextSelection}
                                            onBlur={(e) => {
                                                const html = e.currentTarget.innerHTML;
                                                setPreviewData(prev => prev ? { ...prev, renderedHtml: html } : null);
                                            }}
                                            dangerouslySetInnerHTML={{ __html: previewData.renderedHtml }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-64">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                        <p className="text-gray-600">Convirtiendo documento...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-3">
                    {previewData ? (
                        /* Footer con Preview - Botones de Acciones */
                        <>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleNewProposal}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                                >
                                    Limpiar / Nueva
                                </button>
                                <button
                                    type="submit"
                                    form="proposal-form"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Actualizando...' : 'Actualizar Vista Previa'}
                                </button>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowDownloadMenu(!showDownloadMenu);
                                        }}
                                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                    >
                                        Descargar
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {showDownloadMenu && (
                                        <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-[60]">
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    if (!previewData?.renderedHtml) return;
                                                    try {
                                                        // Obtener el HTML actual del DOM para incluir los estilos inline aplicados por JS (centrado, etc.)
                                                        const previewElement = document.querySelector('.document-preview');
                                                        const htmlContent = previewElement ? previewElement.innerHTML : previewData.renderedHtml;

                                                        const fullHtml = `
                                                            <style>${PREVIEW_STYLES}</style>
                                                            <div class="document-preview">
                                                                ${htmlContent}
                                                            </div>
                                                        `;
                                                        await downloadAsPDF(
                                                            fullHtml,
                                                            proposalName || 'propuesta'
                                                        );
                                                    } catch (error) {
                                                        alert((error as Error).message);
                                                    }
                                                    setShowDownloadMenu(false);
                                                }}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                                            >
                                                Descargar como PDF
                                            </button>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    if (!previewData?.renderedHtml) return;
                                                    try {
                                                        // Usar el HTML procesado que se muestra en la vista previa
                                                        await downloadHtmlAsDocx(
                                                            previewData.renderedHtml,
                                                            proposalName || 'propuesta'
                                                        );
                                                    } catch (error) {
                                                        alert((error as Error).message);
                                                    }
                                                    setShowDownloadMenu(false);
                                                }}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                                            >
                                                Descargar como DOCX
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowSaveModal(true);
                                    }}
                                    className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                                >
                                    {initialProposal ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </>
                    ) : (
                        /* Footer sin Preview - Botón de Generar */
                        <>
                            <div></div>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    form="proposal-form"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Generando propuesta...' : 'Generar Propuesta'}
                                </button>
                            </div>

                        </>
                    )}

                </div>
            </div>

            {/* Save Modal */}
            {
                showSaveModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">{initialProposal ? 'Actualizar Propuesta' : 'Guardar Propuesta'}</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Asigna un nombre a esta propuesta para poder encontrarla fácilmente más tarde.
                            </p>
                            <input
                                type="text"
                                value={proposalName}
                                onChange={(e) => setProposalName(e.target.value)}
                                placeholder="Ej: Propuesta SportX - Agente IA"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
                                autoFocus
                            />
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowSaveModal(false);
                                        setProposalName('');
                                    }}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (!proposalName.trim()) {
                                            alert('Por favor ingresa un nombre para la propuesta');
                                            return;
                                        }
                                        if (!previewData) {
                                            alert('No hay datos de propuesta para guardar');
                                            return;
                                        }
                                        try {
                                            if (initialProposal) {
                                                await updateProposal(initialProposal.id, {
                                                    name: proposalName,
                                                    content_html: previewData.renderedHtml || previewData.html,
                                                    file_docx: previewData.file64,
                                                    metadata: formData
                                                });
                                                alert('✅ Propuesta actualizada exitosamente');
                                            } else {
                                                await saveProposal({
                                                    name: proposalName,
                                                    content_html: previewData.renderedHtml || previewData.html,
                                                    file_docx: previewData.file64,
                                                    metadata: formData
                                                });
                                                alert('✅ Propuesta guardada exitosamente');
                                                localStorage.removeItem('proposal_draft'); // Clear draft on success
                                            }
                                            setShowSaveModal(false);
                                            onClose();
                                        } catch (error) {
                                            console.error('Error guardando:', error);
                                            alert('❌ Error: ' + (error as Error).message);
                                        }
                                    }}
                                    className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                                >
                                    {initialProposal ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Floating Edit Menu */}
            {
                showEditMenu && (
                    <div
                        style={{
                            position: 'fixed',
                            left: `${editMenuPosition.x}px`,
                            top: `${editMenuPosition.y}px`,
                            transform: 'translate(-50%, -100%)',
                            zIndex: 70
                        }}
                        className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex items-center gap-2"
                    >
                        <button
                            type="button"
                            onClick={() => applyFormat('bold')}
                            className="p-2 hover:bg-gray-100 rounded transition-colors"
                            title="Negrita"
                        >
                            <strong>B</strong>
                        </button>
                        <button
                            type="button"
                            onClick={() => applyFormat('italic')}
                            className="p-2 hover:bg-gray-100 rounded transition-colors"
                            title="Cursiva"
                        >
                            <em>I</em>
                        </button>
                        <button
                            type="button"
                            onClick={() => applyFormat('underline')}
                            className="p-2 hover:bg-gray-100 rounded transition-colors"
                            title="Subrayado"
                        >
                            <u>U</u>
                        </button>
                        <div className="w-px h-6 bg-gray-300"></div>
                        <button
                            type="button"
                            onClick={() => applyFormat('fontSize', '3')}
                            className="px-2 py-1 hover:bg-gray-100 rounded transition-colors text-sm"
                            title="Tamaño pequeño"
                        >
                            A-
                        </button>
                        <button
                            type="button"
                            onClick={() => applyFormat('fontSize', '5')}
                            className="px-2 py-1 hover:bg-gray-100 rounded transition-colors"
                            title="Tamaño grande"
                        >
                            A+
                        </button>
                    </div>
                )
            }
        </div >
    );
}
