import { forwardRef } from "react";
import "../styles/invoice-corporate.css";

const InvoiceCorporate = forwardRef(function InvoiceCorporate(
    { s, subtotal, taxAmt, total, formatMoney, initials },
    ref
) {
    return (
        <div className="invoice-corporate" ref={ref}>
            {/* ── Header: Logo + Business Info ── */}
            <div className="corp-header">
                <div className="corp-logo">
                    {s.logo ? (
                        <img src={s.logo} alt="Logo" />
                    ) : (
                        <span className="corp-logo-initials">{initials}</span>
                    )}
                </div>
                <div className="corp-biz-block">
                    <div className="corp-biz-name">{s.businessName}</div>
                    <div className="corp-biz-detail">{s.businessAddress}</div>
                    {s.businessEmail && <div className="corp-biz-detail">{s.businessEmail}</div>}
                    {s.businessPhone && <div className="corp-biz-detail">{s.businessPhone}</div>}
                </div>
            </div>

            {/* ── INVOICE Title ── */}
            <hr className="corp-divider" />
            <div className="corp-title">Invoice</div>

            {/* ── Bill To + Invoice # ── */}
            <div className="corp-info-grid">
                {(s.clientName || s.clientAddress) && (
                <div className="corp-info-left">
                    <div className="corp-info-label">Bill To</div>
                    {s.clientName && <div className="corp-client-name">{s.clientName}</div>}
                    {s.clientAddress && <div className="corp-client-address">{s.clientAddress}</div>}
                </div>
                )}
                {s.invoiceNumber && (
                <div className="corp-info-right">
                    <div className="corp-info-label">Invoice#</div>
                    <div className="corp-invoice-number">{s.invoiceNumber}</div>
                </div>
                )}
            </div>

            {/* ── Ship To ── */}
            {s.shipAddress && (
                <div className="corp-ship-section">
                    <div className="corp-info-label">Ship To</div>
                    <div className="corp-client-address">{s.shipAddress}</div>
                </div>
            )}

            {/* ── Date Bar ── */}
            {s.invoiceDate && (
            <div className="corp-date-bar">
                <div className="corp-date-cell">
                    <div className="corp-date-label">Invoice Date</div>
                    <div className="corp-date-value">{s.invoiceDate}</div>
                </div>
                <div className="corp-date-cell">
                    <div className="corp-date-label">Due Date</div>
                    <div className="corp-date-value">{s.invoiceDate}</div>
                </div>
            </div>
            )}

            {/* ── Line Items Table ── */}
            <table className="corp-table">
                <thead>
                    <tr>
                        <th style={{ width: '40px', textAlign: 'left' }}>#</th>
                        <th style={{ textAlign: 'left' }}>Item & Description</th>
                        <th style={{ width: '70px', textAlign: 'center' }}>Qty</th>
                        <th style={{ width: '100px', textAlign: 'right' }}>Rate</th>
                        <th style={{ width: '100px', textAlign: 'right' }}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {s.lineItems.map((item, idx) => (
                        <tr key={item.id}>
                            <td style={{ textAlign: 'left' }}>{idx + 1}</td>
                            <td>
                                <div className="corp-item-name">{item.name}</div>
                                {item.description && <div className="corp-item-desc">{item.description}</div>}
                            </td>
                            <td className="corp-td-center">{item.qty.toFixed(2)}</td>
                            <td className="corp-td-num">{item.rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="corp-td-num" style={{ fontWeight: 600 }}>
                                {(item.qty * item.rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* ── Footer: Notes + Summary ── */}
            <div className="corp-footer">
                <div className="corp-notes">
                    {s.notes && (
                        <>
                            <div className="corp-notes-label">Notes</div>
                            <div>{s.notes}</div>
                        </>
                    )}
                </div>
                <div className="corp-summary">
                    <div className="corp-summary-row">
                        <span>Sub Total</span>
                        <span>{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="corp-summary-row">
                        <span>Tax Rate</span>
                        <span>{s.taxRate.toFixed(2)}%</span>
                    </div>
                    <div className="corp-summary-total">
                        <span>Total</span>
                        <span>{formatMoney(total, s.currency)}</span>
                    </div>
                    <div className="corp-summary-due">
                        <span>Balance Due</span>
                        <span>{formatMoney(total, s.currency)}</span>
                    </div>
                </div>
            </div>

            {/* ── Terms & Conditions ── */}
            {s.termsText && (
                <div className="corp-terms">
                    <div className="corp-terms-title">Terms & Conditions</div>
                    <div className="corp-terms-text">{s.termsText}</div>
                </div>
            )}
        </div>
    );
});

export default InvoiceCorporate;
