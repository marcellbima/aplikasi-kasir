// src/components/ReceiptModal.jsx
import { useRef } from 'react'
import { formatRupiah, formatDate } from '../utils/format'
import { CheckCircle2, Printer, X, Zap } from 'lucide-react'

export default function ReceiptModal({ transaction: tx, onClose }) {
  const printRef = useRef(null)

  const paymentLabels = { CASH: 'Tunai', QRIS: 'QRIS', DEBIT: 'Debit', CREDIT: 'Kredit' }

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=400,height=700')
    const htmlObj = `
      <html>
      <head>
        <title>Struk - ${tx.invoiceNumber}</title>
        <style>
          @page { margin: 0; size: 58mm auto; }
          body { 
            font-family: 'Courier New', Courier, monospace; 
            font-size: 12px; 
            margin: 0; 
            padding: 10px; 
            width: 58mm; /* Ukuran thermal 58mm */
            color: #000;
            line-height: 1.2;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .flex { display: flex; justify-content: space-between; }
          .flex-col { display: flex; flex-direction: column; }
          .text-sm { font-size: 10px; }
          .title { font-size: 16px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="title">ElektroKasir</div>
          <div class="text-sm">Toko Elektronik</div>
          <div class="text-sm mt-1 mb-1">${formatDate(tx.createdAt)}</div>
        </div>
        
        <div class="divider"></div>
        
        <div class="flex text-sm">
          <span>No:</span>
          <span>${tx.invoiceNumber}</span>
        </div>
        <div class="flex text-sm">
          <span>Kasir:</span>
          <span>${tx.user?.name || 'Admin'}</span>
        </div>

        <div class="divider"></div>

        <div class="flex-col">
          ${tx.items.map(item => `
            <div class="bold" style="margin-bottom: 2px;">${item.productName}</div>
            <div class="flex text-sm" style="margin-bottom: 6px;">
              <span>${item.quantity} x ${formatRupiah(item.unitPrice).replace('Rp', '')}${item.discountPct > 0 ? ` (-${item.discountPct}%)` : ''}</span>
              <span>${formatRupiah(item.subtotal)}</span>
            </div>
          `).join('')}
        </div>

        <div class="divider"></div>

        <div class="flex text-sm mt-1">
          <span>Subtotal</span>
          <span>${formatRupiah(tx.subtotal)}</span>
        </div>
        ${parseFloat(tx.discountAmount) > 0 ? `
        <div class="flex text-sm mt-1">
          <span>Diskon</span>
          <span>- ${formatRupiah(tx.discountAmount)}</span>
        </div>` : ''}
        <div class="flex bold mt-1" style="font-size: 14px;">
          <span>TOTAL</span>
          <span>${formatRupiah(tx.total)}</span>
        </div>

        <div class="divider"></div>

        <div class="flex text-sm mt-1">
          <span>Pembayaran:</span>
          <span>${paymentLabels[tx.paymentMethod] || tx.paymentMethod}</span>
        </div>
        ${tx.paymentMethod === 'CASH' ? `
        <div class="flex text-sm mt-1">
          <span>Tunai:</span>
          <span>${formatRupiah(tx.amountPaid)}</span>
        </div>
        <div class="flex bold text-sm mt-1">
          <span>Kembalian:</span>
          <span>${formatRupiah(tx.changeAmount)}</span>
        </div>` : ''}

        <div class="divider"></div>
        
        <div class="center text-sm" style="margin-top: 15px;">
          Terima kasih telah berbelanja!
        </div>

        <script>
          window.onload = () => {
             window.print();
             setTimeout(() => window.close(), 500);
          }
        </script>
      </body>
      </html>
    `;
    win.document.write(htmlObj);
    win.document.close();
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-sm shadow-2xl animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-display font-bold">Transaksi Berhasil</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt content (printable) */}
        <div ref={printRef} className="px-5 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {/* Store header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-brand-400" />
              <span className="font-display font-bold text-white">ElektroKasir</span>
            </div>
            <p className="text-xs text-slate-500">Toko Elektronik</p>
            <p className="text-xs text-slate-600 mt-0.5">{formatDate(tx.createdAt)}</p>
          </div>

          <div className="border-t border-dashed border-surface-border" />

          {/* Invoice info */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">No. Invoice</span>
              <span className="font-mono text-white">{tx.invoiceNumber}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Kasir</span>
              <span className="text-slate-300">{tx.user?.name}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-surface-border" />

          {/* Items */}
          <div className="space-y-2">
            {tx.items.map((item, i) => (
              <div key={i}>
                <p className="text-sm font-display font-medium text-white">{item.productName}</p>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>
                    {item.quantity} × {formatRupiah(item.unitPrice)}
                    {item.discountPct > 0 && <span className="text-green-400 ml-1">(-{item.discountPct}%)</span>}
                  </span>
                  <span className="text-slate-300">{formatRupiah(item.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-surface-border" />

          {/* Totals */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Subtotal</span>
              <span>{formatRupiah(tx.subtotal)}</span>
            </div>
            {parseFloat(tx.discountAmount) > 0 && (
              <div className="flex justify-between text-sm text-green-400">
                <span>Diskon</span>
                <span>- {formatRupiah(tx.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-display font-bold text-white text-base pt-1 border-t border-surface-border">
              <span>TOTAL</span>
              <span className="text-brand-300">{formatRupiah(tx.total)}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-surface-DEFAULT rounded-xl p-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Pembayaran</span>
              <span className="font-display font-semibold text-white">{paymentLabels[tx.paymentMethod]}</span>
            </div>
            {tx.paymentMethod === 'CASH' && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Dibayar</span>
                  <span className="text-slate-300">{formatRupiah(tx.amountPaid)}</span>
                </div>
                <div className="flex justify-between text-sm font-display font-semibold text-green-400">
                  <span>Kembalian</span>
                  <span>{formatRupiah(tx.changeAmount)}</span>
                </div>
              </>
            )}
          </div>

          <p className="text-center text-xs text-slate-600 pt-2">
            Terima kasih telah berbelanja! ✨
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 py-4 border-t border-surface-border">
          <button onClick={onClose} className="btn-secondary flex-1 py-2.5 text-sm">
            Tutup
          </button>
          <button onClick={handlePrint} className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5 text-sm">
            <Printer className="w-4 h-4" />
            Cetak Struk
          </button>
        </div>
      </div>
    </div>
  )
}
