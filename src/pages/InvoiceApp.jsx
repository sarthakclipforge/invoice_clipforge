import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Receipt, Download, FileText, Image as ImageIcon, Sparkles, Plus, X, Save, ChevronLeft, Eye, Edit2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { saveInvoiceLocally, getInvoiceBySupabaseId, db } from "../lib/db";
import { getActiveApiKey, getActiveProvider, getActiveModel, loadSettings } from '../lib/settings';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import "../styles/invoice.css";

const CURRENCIES = [
    { code: "USD", symbol: "$", locale: "en-US" },
    { code: "EUR", symbol: "€", locale: "de-DE" },
    { code: "GBP", symbol: "£", locale: "en-GB" },
    { code: "INR", symbol: "₹", locale: "en-IN" },
    { code: "JPY", symbol: "¥", locale: "ja-JP" },
    { code: "AED", symbol: "د.إ", locale: "ar-AE" },
    { code: "SGD", symbol: "S$", locale: "en-SG" },
    { code: "AUD", symbol: "A$", locale: "en-AU" },
];

function formatMoney(amount, code) {
    const c = CURRENCIES.find((x) => x.code === code) || CURRENCIES[0];
    return new Intl.NumberFormat(c.locale, { style: "currency", currency: c.code, minimumFractionDigits: 2 }).format(amount || 0);
}

const INITIAL_ITEMS = [
    { id: 1, name: "Brand Identity Design", description: "Logo, color palette, and typography system", qty: 1, rate: 4500 },
    { id: 2, name: "Website Development", description: "Responsive 8-page site with CMS integration", qty: 1, rate: 9800 },
];

const INIT = {
    businessName: '',
    businessAddress: '',
    businessEmail: '',
    businessPhone: '',
    clientName: '',
    clientAddress: '',
    shipAddress: '',
    invoiceNumber: '',
    invoiceDate: '',
    terms: '',
    notes: '',
    termsText: '',
    taxRate: 0,
    currency: 'USD',
    logo: null,
    lineItems: [],
    mode: 'edit',
    aiPrompt: '',
    aiLoading: false,
    aiError: '',
};

function Field({ label, value, onChange, placeholder, rows, type = "text" }) {
    return (
        <div className="field-group">
            {label && <label className="field-label">{label}</label>}
            {rows ? (
                <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="field-textarea" />
            ) : (
                <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="field-input" />
            )}
        </div>
    );
}

function SectionHead({ title }) {
    return (
        <div className="section-head">
            <span className="section-title">{title}</span>
            <div className="section-line" />
        </div>
    );
}

export default function InvoiceApp() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [s, setS] = useState(INIT);
    const [isSaving, setIsSaving] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [savedFeedback, setSavedFeedback] = useState(false);
    const fileRef = useRef();
    const invoiceRef = useRef(null);
    const nextId = useRef(3);
    const documentContainerRef = useRef();
    const invoiceWrapperRef = useRef();
    const invoicePaperRef = useRef();
    const [scale, setScale] = useState(1);

    // ResizeObserver for scaling the invoice document
    useEffect(() => {
        const container = documentContainerRef.current;
        if (!container) return;

        const updateScale = () => {
            const containerWidth = container.clientWidth;
            const padding = window.innerWidth <= 480 ? 16 : window.innerWidth <= 768 ? 24 : window.innerWidth <= 1024 ? 32 : 96; // account for .app-document padding
            const availableWidth = containerWidth - padding;
            const invoiceWidth = 800;
            const newScale = availableWidth < invoiceWidth ? availableWidth / invoiceWidth : 1;
            setScale(Math.min(1, Math.max(0.25, newScale)));
        };

        const observer = new ResizeObserver(updateScale);
        observer.observe(container);
        updateScale();

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!id) return; // new invoice — no loading needed

        async function loadInvoice() {
            // Try IndexedDB first (works offline)
            const local = await getInvoiceBySupabaseId(id);
            if (local?.invoice_data) {
                setS(prev => ({ ...prev, ...local.invoice_data, mode: 'edit' }));
            }

            // Refresh from Supabase if online (get latest version)
            if (navigator.onLine) {
                const { data, error } = await supabase
                    .from('invoices')
                    .select('invoice_data')
                    .eq('id', id)
                    .single();

                if (!error && data?.invoice_data) {
                    setS(prev => ({ ...prev, ...data.invoice_data, mode: 'edit' }));
                }
            }
        }

        loadInvoice();
    }, [id]);

    const upd = (k) => (v) => setS(p => ({ ...p, [k]: v }));
    const subtotal = s.lineItems.reduce((a, i) => a + i.qty * i.rate, 0);
    const taxAmt = subtotal * s.taxRate / 100;
    const total = subtotal + taxAmt;
    const initials = s.businessName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    const cur = CURRENCIES.find(x => x.code === s.currency) || CURRENCIES[0];

    const handleLogo = e => {
        const f = e.target.files?.[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = ev => setS(p => ({ ...p, logo: ev.target.result }));
        r.readAsDataURL(f);
    };

    const addItem = () => setS(p => ({ ...p, lineItems: [...p.lineItems, { id: nextId.current++, name: "", description: "", qty: 1, rate: 0 }] }));
    const removeItem = id => setS(p => ({ ...p, lineItems: p.lineItems.filter(i => i.id !== id) }));
    const updateItem = (id, k, v) => setS(p => ({ ...p, lineItems: p.lineItems.map(i => i.id === id ? { ...i, [k]: v } : i) }));

    async function handleAIGenerate() {
        if (!s.aiPrompt) return;

        const apiKey = getActiveApiKey();
        if (!apiKey) {
            setS(p => ({
                ...p,
                aiError: 'No API key found. Add your key in Settings.',
                aiLoading: false,
            }));
            return;
        }

        if (!navigator.onLine) {
            setS(p => ({
                ...p,
                aiError: 'AI generation requires an internet connection.',
                aiLoading: false,
            }));
            return;
        }

        setS(p => ({ ...p, aiLoading: true, aiError: '' }));

        const provider = getActiveProvider();
        const modelId  = getActiveModel();

        const systemPrompt = 'You are an invoice assistant. Given a project brief, generate 3–5 professional line items. Respond ONLY with a valid JSON array: [{"name":string,"description":string,"qty":number,"rate":number}]. No markdown, no preamble, no explanation.';

        try {
            let items = [];

            if (provider.id === 'anthropic') {
                const res = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01',
                        'anthropic-dangerous-direct-browser-access': 'true',
                    },
                    body: JSON.stringify({
                        model: modelId,
                        max_tokens: 800,
                        system: systemPrompt,
                        messages: [{ role: 'user', content: s.aiPrompt }],
                    }),
                });
                const data = await res.json();
                if (data.error) throw new Error(data.error.message);
                const text = data.content?.map(b => b.text || '').join('') || '';
                items = JSON.parse(text.replace(/```json|```/g, '').trim());

            } else if (provider.id === 'openai') {
                const res = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        model: modelId,
                        max_tokens: 800,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: s.aiPrompt },
                        ],
                    }),
                });
                const data = await res.json();
                if (data.error) throw new Error(data.error.message);
                const text = data.choices?.[0]?.message?.content || '';
                items = JSON.parse(text.replace(/```json|```/g, '').trim());

            } else if (provider.id === 'google') {
                const res = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            systemInstruction: { parts: [{ text: systemPrompt }] },
                            contents: [{ parts: [{ text: s.aiPrompt }] }],
                            generationConfig: { maxOutputTokens: 800 },
                        }),
                    }
                );
                const data = await res.json();
                if (data.error) throw new Error(data.error.message);
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                items = JSON.parse(text.replace(/```json|```/g, '').trim());

            } else if (provider.id === 'groq') {
                const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        model: modelId,
                        max_tokens: 800,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: s.aiPrompt },
                        ],
                    }),
                });
                const data = await res.json();
                if (data.error) throw new Error(data.error.message);
                const text = data.choices?.[0]?.message?.content || '';
                items = JSON.parse(text.replace(/```json|```/g, '').trim());
            }

            setS(p => ({
                ...p,
                aiLoading: false,
                lineItems: items.map(it => ({
                    id: nextId.current++,
                    name: it.name,
                    description: it.description,
                    qty: it.qty,
                    rate: it.rate,
                })),
            }));

        } catch (err) {
            setS(p => ({
                ...p,
                aiLoading: false,
                aiError: err.message || 'Generation failed. Check your API key in Settings.',
            }));
        }
    }

    const handleSave = async () => {
        setIsSaving(true);

        const totalAmount = subtotal + taxAmt;
        const now = new Date().toISOString();

        const localPayload = {
            supabaseId: id || null,
            invoiceNumber: s.invoiceNumber,
            clientName: s.clientName,
            totalAmount,
            currency: s.currency,
            invoice_data: { ...s, mode: 'edit', aiKey: '', aiError: '', aiLoading: false },
            updatedAt: now,
            synced: 0,
        };

        try {
            // Always save locally first
            const localId = await saveInvoiceLocally(localPayload);

            // Push to Supabase if online
            if (navigator.onLine) {
                const supabasePayload = {
                    invoice_number: s.invoiceNumber,
                    client_name: s.clientName,
                    total_amount: totalAmount,
                    currency: s.currency,
                    invoice_data: localPayload.invoice_data,
                    updated_at: now,
                };

                if (id) {
                    const { error } = await supabase
                        .from('invoices')
                        .update(supabasePayload)
                        .eq('id', id);

                    if (!error) {
                        await db.invoices.update(localId, { synced: 1 });
                    }
                    alert('Invoice updated successfully!');
                } else {
                    const { data, error } = await supabase
                        .from('invoices')
                        .insert(supabasePayload)
                        .select('id')
                        .single();

                    if (!error && data) {
                        await db.invoices.update(localId, { synced: 1, supabaseId: data.id });
                        navigate(`/app/${data.id}`, { replace: true });
                    }
                    alert('Invoice saved to Dashboard!');
                }
            } else {
                alert('Saved offline. Will sync when back online.');
            }
        } catch (err) {
            alert('Error saving invoice: ' + err.message);
        } finally {
            setIsSaving(false);
            setSavedFeedback(true);
            setTimeout(() => setSavedFeedback(false), 2000);
        }
    };

    const handleDownload = async () => {
        const element = invoiceRef.current;
        if (!element) return;

        setDownloading(true);

        try {
            await document.fonts.ready;

            const wrapper = element.parentElement;
            const prevTransform = wrapper.style.transform;
            const prevPosition  = wrapper.style.position;
            const prevLeft      = wrapper.style.left;
            const prevTop       = wrapper.style.top;

            try {
                wrapper.style.transform = 'none';
                wrapper.style.position  = 'absolute';
                wrapper.style.left      = '-9999px';
                wrapper.style.top       = '0';

                await new Promise(resolve =>
                    requestAnimationFrame(() => requestAnimationFrame(resolve))
                );

                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    width: 800,
                    windowWidth: 800,
                    onclone: (clonedDoc) => {
                        const clonedElement = clonedDoc.getElementById('invoice');
                        if (clonedElement && element) {
                            const applyStyles = (orig, clone) => {
                                const cs = window.getComputedStyle(orig);
                                clone.style.fontFamily    = cs.fontFamily;
                                clone.style.fontSize      = cs.fontSize;
                                clone.style.fontWeight    = cs.fontWeight;
                                clone.style.lineHeight    = cs.lineHeight;
                                clone.style.letterSpacing = cs.letterSpacing;
                            };

                            applyStyles(element, clonedElement);

                            const originalNodes = Array.from(element.querySelectorAll('*'));
                            const clonedNodes = Array.from(clonedElement.querySelectorAll('*'));

                            for (let i = 0; i < originalNodes.length; i++) {
                                if (originalNodes[i] && clonedNodes[i]) {
                                    applyStyles(originalNodes[i], clonedNodes[i]);
                                }
                            }
                        }
                    },
                });

                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4',
                });

                const pdfW = pdf.internal.pageSize.getWidth();
                const pdfH = pdf.internal.pageSize.getHeight();
                const canvasAspect = canvas.height / canvas.width;
                const naturalH = pdfW * canvasAspect;

                let finalW, finalH, xOffset;

                if (naturalH <= pdfH) {
                    finalW  = pdfW;
                    finalH  = naturalH;
                    xOffset = 0;
                } else {
                    finalH  = pdfH;
                    finalW  = pdfH / canvasAspect;
                    xOffset = (pdfW - finalW) / 2;
                }

                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', xOffset, 0, finalW, finalH);

                const clientSlug  = s.clientName.trim().replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
                const invoiceSlug = s.invoiceNumber.trim().replace(/[^a-zA-Z0-9-]/g, '');

                pdf.save(`${clientSlug}_${invoiceSlug}.pdf`);

            } finally {
                wrapper.style.transform = prevTransform;
                wrapper.style.position  = prevPosition;
                wrapper.style.left      = prevLeft;
                wrapper.style.top       = prevTop;
            }

        } catch (err) {
            console.error('PDF generation failed:', err);
            alert('PDF generation failed. Check console for details.');
        } finally {
            setDownloading(false);
        }
    };

    // Sidebar controls
    const Sidebar = (
        <div className="app-sidebar">
            <SectionHead title="Your Brand" />
            <div className="logo-uploader">
                <div onClick={() => fileRef.current.click()} className="logo-circle">
                    {s.logo ? <img src={s.logo} alt="" /> : <span className="logo-initials">{initials}</span>}
                </div>
                <div className="logo-hint">
                    <strong>Upload Logo</strong><br />
                    JPG, PNG, GIF (Max 2MB)
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogo} />
            </div>
            <div>
                <Field label="Business Name" value={s.businessName} onChange={upd("businessName")} />
                <Field label="Address" value={s.businessAddress} onChange={upd("businessAddress")} rows={3} />
                <div className="grid-2">
                    <Field label="Email" value={s.businessEmail} onChange={upd("businessEmail")} type="email" />
                    <Field label="Phone" value={s.businessPhone} onChange={upd("businessPhone")} />
                </div>
            </div>

            <SectionHead title="ClientDetails" />
            <div>
                <Field label="Client Name" value={s.clientName} onChange={upd("clientName")} />
                <Field label="Bill To" value={s.clientAddress} onChange={upd("clientAddress")} rows={3} />
                <Field label="Ship To" value={s.shipAddress} onChange={upd("shipAddress")} rows={3} />
            </div>

            <SectionHead title="Invoice Info" />
            <div>
                <div className="grid-2">
                    <Field label="Invoice #" value={s.invoiceNumber} onChange={upd("invoiceNumber")} />
                    <Field label="Date" value={s.invoiceDate} onChange={upd("invoiceDate")} />
                </div>
                <Field label="Terms" value={s.terms} onChange={upd("terms")} />
                <div className="grid-2">
                    <Field label="Tax %" value={s.taxRate} onChange={v => upd("taxRate")(parseFloat(v) || 0)} type="number" />
                    <div className="field-group">
                        <label className="field-label">Currency</label>
                        <select value={s.currency} onChange={e => upd("currency")(e.target.value)} className="field-select">
                            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} {c.symbol}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <SectionHead title="Line Items" />
            <div>
                {s.lineItems.map((item, idx) => (
                    <div key={item.id} className="line-item-card">
                        <button onClick={() => removeItem(item.id)} className="remove-btn"><X size={14} /></button>
                        <div className="item-badge">Item {idx + 1}</div>
                        <div className="field-group">
                            <input placeholder="Item name" value={item.name} onChange={e => updateItem(item.id, "name", e.target.value)} className="field-input" />
                            <input placeholder="Description" value={item.description} onChange={e => updateItem(item.id, "description", e.target.value)} className="field-input" style={{ fontSize: '0.8rem', color: '#71717a' }} />
                            <div className="grid-2 mt-2">
                                <div>
                                    <label className="field-label" style={{ marginBottom: '4px', display: 'block' }}>Qty</label>
                                    <input type="number" value={item.qty} onChange={e => updateItem(item.id, "qty", parseFloat(e.target.value) || 0)} className="field-input" />
                                </div>
                                <div>
                                    <label className="field-label" style={{ marginBottom: '4px', display: 'block' }}>Rate</label>
                                    <input type="number" value={item.rate} onChange={e => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)} className="field-input" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                <button onClick={addItem} className="add-item-btn">
                    <Plus size={16} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> Add Item
                </button>
            </div>

            <div className="ai-assist-panel">
                <div className="ai-assist-header">
                    <span className="ai-assist-title">AI Assist</span>
                    <span className="ai-assist-provider">{getActiveProvider().name}</span>
                </div>

                {!getActiveApiKey() && (
                    <div className="ai-no-key-warning">
                        No API key configured.{' '}
                        <span
                            className="ai-no-key-link"
                            onClick={() => navigate('/settings')}
                        >
                            Add one in Settings →
                        </span>
                    </div>
                )}

                <textarea
                    className="field-input ai-prompt-input"
                    placeholder="Describe your project, e.g. 'Brand identity and website for a law firm'"
                    value={s.aiPrompt}
                    onChange={e => setS(p => ({ ...p, aiPrompt: e.target.value }))}
                    rows={3}
                />

                {s.aiError && (
                    <p className="ai-error-msg">{s.aiError}</p>
                )}

                <button
                    className="btn-primary ai-generate-btn"
                    onClick={handleAIGenerate}
                    disabled={s.aiLoading || !s.aiPrompt || !getActiveApiKey()}
                >
                    {s.aiLoading ? 'Generating…' : '✦ Generate Line Items'}
                </button>
            </div>

            <SectionHead title="Notes & Terms" />
            <div style={{ paddingBottom: '2rem' }}>
                <Field label="Notes" value={s.notes} onChange={upd("notes")} rows={3} />
                <Field label="Terms & Conditions" value={s.termsText} onChange={upd("termsText")} rows={3} />
            </div>
        </div>
    );

    // Calculate the height offset when scaled
    const getWrapperStyle = () => {
        const style = {
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            width: '800px',
        };
        if (scale < 1 && invoicePaperRef.current) {
            // When scaled, the visual height is smaller but the element still occupies original space
            // So we use a negative margin to collapse the extra space
            const actualHeight = invoicePaperRef.current.offsetHeight;
            const scaledHeight = actualHeight * scale;
            style.marginBottom = `${scaledHeight - actualHeight}px`;
        }
        return style;
    };

    const InvoiceDoc = (
        <div className="app-document" ref={documentContainerRef}>
            <div
                className="invoice-scale-wrapper"
                ref={invoiceWrapperRef}
                style={getWrapperStyle()}
            >
                <div 
                    className="invoice-paper" 
                    id="invoice" 
                    ref={(node) => {
                        invoicePaperRef.current = node;
                        invoiceRef.current = node;
                    }}
                >
                <div className="inv-header">
                    <div className="inv-brand">
                        {s.logo ? (
                            <div className="inv-logo"><img src={s.logo} alt="Logo" /></div>
                        ) : (
                            <div className="inv-logo" style={{ background: 'var(--accent-primary)', color: 'white', fontSize: '2rem', fontWeight: 800 }}>{initials}</div>
                        )}
                        <div>
                            <div className="inv-biz-name">{s.businessName}</div>
                            <div className="inv-biz-address">{s.businessAddress}</div>
                        </div>
                    </div>
                    <div className="inv-title-box">
                        <div className="inv-title">Invoice</div>
                        <div className="inv-number"># {s.invoiceNumber}</div>
                        <div className="inv-balance-label">Balance Due</div>
                        <div className="inv-balance">{formatMoney(total, s.currency)}</div>
                    </div>
                </div>

                <div className="inv-meta-grid">
                    <div className="inv-meta-col">
                        <div className="inv-meta-label">Bill To</div>
                        <div className="inv-client-name">{s.clientName}</div>
                        <div className="inv-client-address">{s.clientAddress}</div>
                    </div>
                    <div className="inv-meta-col">
                        <div className="inv-meta-label">Ship To</div>
                        <div className="inv-client-address" style={{ marginTop: '1.5rem' }}>{s.shipAddress}</div>
                    </div>
                </div>

                <div className="inv-dates">
                    <div className="inv-date-item">
                        <span>Invoice Date</span>
                        <span>{s.invoiceDate}</span>
                    </div>
                    <div className="inv-date-item">
                        <span>Terms</span>
                        <span>{s.terms}</span>
                    </div>
                </div>

                <table className="inv-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px', textAlign: 'left' }}>#</th>
                            <th style={{ textAlign: 'left' }}>Item & Description</th>
                            <th style={{ width: '80px', textAlign: 'center' }}>Qty</th>
                            <th style={{ width: '120px', textAlign: 'right' }}>Rate</th>
                            <th style={{ width: '120px', textAlign: 'right' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {s.lineItems.map((item, idx) => (
                            <tr key={item.id}>
                                <td className="inv-td-num" style={{ textAlign: 'left' }}>{idx + 1}</td>
                                <td>
                                    <div className="inv-item-name">{item.name}</div>
                                    {item.description && <div className="inv-item-desc">{item.description}</div>}
                                </td>
                                <td className="inv-td-num" style={{ textAlign: 'center' }}>{item.qty.toFixed(2)}</td>
                                <td className="inv-td-num">{item.rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="inv-td-num" style={{ fontWeight: 600, color: '#18181b' }}>{(item.qty * item.rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="inv-footer">
                    <div className="inv-notes">
                        <div className="inv-meta-label">Notes</div>
                        <div className="inv-client-address">{s.notes}</div>
                    </div>
                    <div className="inv-summary">
                        <div className="summary-row">
                            <span>Sub Total</span>
                            <span className="inv-td-num">{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="summary-row">
                            <span>Tax Rate ({s.taxRate.toFixed(2)}%)</span>
                            <span className="inv-td-num">{taxAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="summary-row total">
                            <span>Total</span>
                            <span>{formatMoney(total, s.currency)}</span>
                        </div>
                        <div className="summary-due">
                            <span>Balance Due</span>
                            <span>{formatMoney(total, s.currency)}</span>
                        </div>
                    </div>
                </div>

                {s.termsText && (
                    <div className="inv-terms">
                        <div className="inv-terms-title">Terms & Conditions</div>
                        <div className="inv-terms-text">{s.termsText}</div>
                    </div>
                )}
            </div>
            </div>
        </div>
    );

    return (
        <div style={{
            height: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--color-bg)',
            overflow: 'hidden',
            paddingTop: 56,
        }}>
            <header style={{
                position: 'fixed',
                top: 0, left: 0, right: 0,
                height: 56,
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                background: '#111319',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                boxSizing: 'border-box',
                overflow: 'hidden',
                gap: 8,
            }}>

                {/* LEFT */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{
                            width: 30, height: 30, flexShrink: 0,
                            borderRadius: 7,
                            border: '1px solid rgba(255,255,255,0.12)',
                            background: 'transparent',
                            color: '#e2e2eb',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <div style={{
                        width: 24, height: 24, flexShrink: 0,
                        borderRadius: 6,
                        background: 'linear-gradient(145deg, #c0c1ff 0%, #8083ff 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Receipt size={12} color="#0d0096" />
                    </div>
                    <span style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: 15, fontWeight: 700,
                        color: '#ffffff', letterSpacing: '-0.02em',
                        whiteSpace: 'nowrap',
                    }}>InvoiceKit</span>
                </div>

                {/* CENTRE — pill on desktop, eye icon on mobile */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

                  {/* Desktop pill — hidden on mobile via CSS */}
                  <div
                    className="topbar-toggle"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#0c0e14',
                      borderRadius: 999,
                      padding: 3,
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <button
                      onClick={() => upd('mode')('edit')}
                      style={{
                        padding: '4px 14px',
                        borderRadius: 999, border: 'none',
                        background: s.mode === 'edit' ? '#6366F1' : 'transparent',
                        color: s.mode === 'edit' ? '#fff' : '#6B7280',
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: 11, fontWeight: 700,
                        letterSpacing: '0.05em', textTransform: 'uppercase',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4,
                        whiteSpace: 'nowrap',
                        transition: 'all 200ms ease',
                      }}
                    >
                      <Edit2 size={10} /> Edit
                    </button>
                    <button
                      onClick={() => upd('mode')('preview')}
                      style={{
                        padding: '4px 14px',
                        borderRadius: 999, border: 'none',
                        background: s.mode === 'preview' ? '#6366F1' : 'transparent',
                        color: s.mode === 'preview' ? '#fff' : '#6B7280',
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: 11, fontWeight: 700,
                        letterSpacing: '0.05em', textTransform: 'uppercase',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4,
                        whiteSpace: 'nowrap',
                        transition: 'all 200ms ease',
                      }}
                    >
                      <Eye size={10} /> Preview
                    </button>
                  </div>

                  {/* Mobile eye/edit icon — hidden on desktop via CSS */}
                  <button
                    className="topbar-toggle-mobile"
                    onClick={() => upd('mode')(s.mode === 'edit' ? 'preview' : 'edit')}
                    style={{
                      width: 32, height: 32,
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: s.mode === 'preview' ? 'rgba(99,102,241,0.2)' : 'transparent',
                      color: s.mode === 'preview' ? '#c0c1ff' : '#e2e2eb',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 200ms ease',
                      flexShrink: 0,
                    }}
                    title={s.mode === 'edit' ? 'Preview invoice' : 'Back to edit'}
                  >
                    {s.mode === 'edit' ? <Eye size={15} /> : <Edit2 size={15} />}
                  </button>

                </div>

                {/* RIGHT */}
                <div style={{
                    display: 'flex', alignItems: 'center',
                    gap: 6, flexShrink: 0,
                }}>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        style={{
                            height: 32, padding: '0 12px',
                            borderRadius: 8,
                            border: savedFeedback
                                ? '1px solid rgba(16,185,129,0.3)'
                                : '1px solid rgba(255,255,255,0.12)',
                            background: savedFeedback ? 'rgba(16,185,129,0.15)' : 'transparent',
                            color: savedFeedback ? '#10B981' : '#e2e2eb',
                            fontFamily: "'Manrope', sans-serif",
                            fontSize: 11, fontWeight: 600,
                            cursor: isSaving ? 'not-allowed' : 'pointer',
                            opacity: isSaving ? 0.5 : 1,
                            display: 'flex', alignItems: 'center', gap: 5,
                            whiteSpace: 'nowrap',
                            transition: 'all 200ms ease',
                        }}
                    >
                        <Save size={12} />
                        <span className="btn-label">{isSaving ? 'Saving…' : savedFeedback ? 'Saved ✓' : 'Save'}</span>
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        style={{
                            height: 32, padding: '0 12px',
                            borderRadius: 8, border: 'none',
                            background: 'linear-gradient(145deg, #c0c1ff 0%, #8083ff 100%)',
                            color: '#0d0096',
                            fontFamily: "'Manrope', sans-serif",
                            fontSize: 11, fontWeight: 700,
                            letterSpacing: '0.05em', textTransform: 'uppercase',
                            cursor: downloading ? 'not-allowed' : 'pointer',
                            opacity: downloading ? 0.5 : 1,
                            display: 'flex', alignItems: 'center', gap: 5,
                            whiteSpace: 'nowrap',
                            transition: 'opacity 150ms ease',
                        }}
                    >
                        <Download size={12} />
                        <span className="btn-label">{downloading ? '…' : 'PDF'}</span>
                    </button>
                </div>

            </header>

            <div className="app-main" data-mode={s.mode}>
                {Sidebar}
                <main className="app-document-container">
                    {InvoiceDoc}
                </main>
            </div>
        </div>
    );
}
