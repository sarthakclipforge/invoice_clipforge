import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Receipt, Download, FileText, Image as ImageIcon, Sparkles, Plus, X, Save } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
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
    businessName: "Antigravity Studio",
    businessAddress: "14B, Northern Street\nGreater South Avenue\nNew York 10001\nU.S.A",
    businessEmail: "hello@antigravity.co",
    businessPhone: "+1 (212) 555-0100",
    clientName: "Jack Little",
    clientAddress: "3242 Chandler Hollow Road\nPittsburgh\n15222 Pennsylvania",
    shipAddress: "3242 Chandler Hollow Road\nPittsburgh\n15222 Pennsylvania",
    invoiceNumber: "INV-000001",
    invoiceDate: "10 Mar 2026",
    terms: "Due on Receipt",
    notes: "Thanks for your business.",
    termsText: "All payments must be made in full before the commencement of any design work.",
    taxRate: 5,
    currency: "USD",
    logo: null,
    lineItems: INITIAL_ITEMS,
    mode: "edit",
    aiKey: "",
    aiPrompt: "",
    aiLoading: false,
    aiError: "",
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
    const fileRef = useRef();
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
        if (id) loadInvoice(id);
    }, [id]);

    const loadInvoice = async (invoiceId) => {
        const { data } = await supabase.from('invoices').select('invoice_data').eq('id', invoiceId).single();
        if (data?.invoice_data) setS(data.invoice_data);
    };

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

    const generate = async () => {
        if (!s.aiKey || !s.aiPrompt) return;
        setS(p => ({ ...p, aiLoading: true, aiError: "" }));
        try {
            const res = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-api-key": s.aiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
                body: JSON.stringify({
                    model: "claude-sonnet-4-20250514", max_tokens: 800,
                    system: 'You are an invoice assistant. Generate 3–5 professional line items for a project brief. Respond ONLY with a JSON array: [{"name":string,"description":string,"qty":number,"rate":number}]. No markdown.',
                    messages: [{ role: "user", content: s.aiPrompt }],
                }),
            });
            const data = await res.json();
            const text = data.content?.map(b => b.text || "").join("") || "";
            const items = JSON.parse(text.replace(/```json|```/g, "").trim());
            setS(p => ({ ...p, aiLoading: false, lineItems: items.map(it => ({ id: nextId.current++, ...it })) }));
        } catch (err) {
            setS(p => ({ ...p, aiLoading: false, aiError: err.message || "Generation failed." }));
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (id) {
                await supabase.from('invoices').update({
                    invoice_number: s.invoiceNumber,
                    client_name: s.clientName,
                    total_amount: subtotal + taxAmt,
                    currency: s.currency,
                    invoice_data: s,
                    updated_at: new Date()
                }).eq('id', id);
                alert("Invoice updated successfully!");
            } else {
                const { data, error } = await supabase.from('invoices').insert({
                    invoice_number: s.invoiceNumber,
                    client_name: s.clientName,
                    total_amount: subtotal + taxAmt,
                    currency: s.currency,
                    invoice_data: s
                }).select().single();

                if (error) throw error;
                navigate(`/app/${data.id}`, { replace: true });
                alert("Invoice saved to Dashboard!");
            }
        } catch (err) {
            alert("Error saving invoice: " + err.message);
        } finally {
            setIsSaving(false);
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

            <SectionHead title="AI Assistant" />
            <div className="ai-box">
                <div className="ai-desc">Describe your project, and AI will automatically fill in professional line items.</div>
                <Field label="Anthropic Key" value={s.aiKey} onChange={upd("aiKey")} placeholder="sk-ant-api…" type="password" />
                <Field label="Project Brief" value={s.aiPrompt} onChange={upd("aiPrompt")} placeholder="e.g. UX Audit for SaaS app" rows={2} />
                {s.aiError && <div style={{ color: '#dc2626', fontSize: '0.75rem', padding: '0.5rem', background: '#fef2f2', borderRadius: '6px' }}>{s.aiError}</div>}
                <button onClick={generate} disabled={s.aiLoading || !s.aiKey || !s.aiPrompt} className="ai-btn">
                    <Sparkles size={16} />
                    {s.aiLoading ? "Generating..." : "Generate Items"}
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
                <div className="invoice-paper" id="invoice" ref={invoicePaperRef}>
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
        <div className="app-container">
            <div className="app-topbar">
                <Link to="/dashboard" className="topbar-brand">
                    <div className="brand-icon"><Receipt size={18} /></div>
                    InvoiceKit
                </Link>

                <div className="topbar-actions">
                    <Link to="/dashboard" className="mode-btn" style={{ textDecoration: 'none' }}>Dashboard</Link>
                    <div className="mode-toggle">
                        {["edit", "preview"].map(m => (
                            <button
                                key={m}
                                onClick={() => upd("mode")(m)}
                                className={`mode-btn ${s.mode === m ? 'active' : ''}`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                    <button className="export-btn" onClick={handleSave} disabled={isSaving} style={{ background: 'var(--accent-primary)' }}>
                        <Save size={16} /> {isSaving ? "Saving..." : "Save Invoice"}
                    </button>
                    <button className="export-btn" onClick={() => window.print()}>
                        <Download size={16} /> Export PDF
                    </button>
                </div>
            </div>

            <div className="app-main">
                {s.mode === "edit" && Sidebar}
                {InvoiceDoc}
            </div>
        </div>
    );
}
