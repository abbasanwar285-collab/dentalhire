import { TreatmentPlan, Patient, Doctor } from '../types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// ── Invoice Number Generator ──

export function getNextInvoiceNumber(): string {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const counterKey = `clinic_invoice_counter_${yearMonth}`;
  
  const current = parseInt(localStorage.getItem(counterKey) || '0', 10);
  const next = current + 1;
  localStorage.setItem(counterKey, String(next));
  
  return `INV-${yearMonth}-${String(next).padStart(4, '0')}`;
}

// ── Invoice Data Types ──

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  clinicName: string;
  clinicPhone?: string;
  clinicAddress?: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  planName: string;
  treatments: { name: string; tooth: string; notes?: string }[];
  totalCost: number;
  paidAmount: number;
  remaining: number;
  payments: { date: string; amount: number; notes?: string }[];
  isOrtho: boolean;
  orthoDetails?: {
    treatedJaw: string;
    applianceType: string;
    diagnosis: string;
  };
}

// ── Gather Invoice Data ──

export function buildInvoiceData(
  plan: TreatmentPlan,
  patient: Patient,
  doctor: Doctor | undefined,
  clinicSettings: { clinicName: string; clinicPhone?: string; clinicAddress?: string }
): InvoiceData {
  const isOrtho = !!plan.orthoDetails;

  const treatments = isOrtho
    ? [{ name: 'تقويم أسنان (Orthodontics)', tooth: plan.orthoDetails?.treatedJaw === 'Both' ? 'الفكين' : plan.orthoDetails?.treatedJaw === 'Upper' ? 'العلوي' : 'السفلي', notes: plan.orthoDetails?.diagnosis }]
    : (plan.treatments || []).map(t => ({
        name: t.treatmentType,
        tooth: t.toothNumber === 0 ? 'عام' : t.toothNumber === 100 ? 'علوي' : t.toothNumber === 200 ? 'سفلي' : String(t.toothNumber),
        notes: t.notes,
      }));

  const payments = (plan.payments || []).map(p => ({
    date: format(new Date(p.date), 'dd/MM/yyyy'),
    amount: p.amount,
    notes: p.notes,
  }));

  return {
    invoiceNumber: getNextInvoiceNumber(),
    date: format(new Date(), 'dd MMMM yyyy', { locale: ar }),
    clinicName: clinicSettings.clinicName || 'Iris Clinic',
    clinicPhone: clinicSettings.clinicPhone,
    clinicAddress: clinicSettings.clinicAddress,
    patientName: patient.name,
    patientPhone: patient.phone,
    doctorName: doctor?.name ? `د. ${doctor.name.replace('د. ', '').replace('د.', '').trim()}` : 'غير محدد',
    planName: plan.name || plan.treatments?.[0]?.treatmentType || 'خطة علاجية',
    treatments,
    totalCost: plan.totalCost,
    paidAmount: plan.paidAmount,
    remaining: plan.totalCost - plan.paidAmount,
    payments,
    isOrtho,
    orthoDetails: plan.orthoDetails ? {
      treatedJaw: plan.orthoDetails.treatedJaw === 'Both' ? 'الفكين معاً' : plan.orthoDetails.treatedJaw === 'Upper' ? 'العلوي فقط' : 'السفلي فقط',
      applianceType: plan.orthoDetails.applianceType === 'Fixed Metal' ? 'معدني ثابت' : plan.orthoDetails.applianceType === 'Clear' ? 'شفاف' : 'متحرك',
      diagnosis: plan.orthoDetails.diagnosis,
    } : undefined,
  };
}

// ── Build Invoice HTML (used for preview, print, and image generation) ──

export function buildInvoiceHTML(data: InvoiceData): string {
  const statusColor = data.remaining <= 0 ? '#059669' : '#d97706';
  const statusBg = data.remaining <= 0 ? '#dcfce7' : '#fef3c7';
  const statusText = data.remaining <= 0 ? '✅ مدفوعة بالكامل' : `⏳ متبقي ${data.remaining.toLocaleString()} د.ع`;

  const treatmentRows = data.treatments.map((t, i) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'};">
      <td style="padding:8px 12px;font-size:13px;color:#1e293b;border-bottom:1px solid #f1f5f9;">${t.name}</td>
      <td style="padding:8px 12px;font-size:13px;color:#0d9488;font-weight:700;text-align:center;border-bottom:1px solid #f1f5f9;">${t.tooth}</td>
      <td style="padding:8px 12px;font-size:11px;color:#94a3b8;text-align:left;border-bottom:1px solid #f1f5f9;">${t.notes || '—'}</td>
    </tr>
  `).join('');

  const paymentRows = data.payments.length > 0 ? `
    <div style="margin-top:16px;">
      <div style="font-size:12px;font-weight:700;color:#64748b;margin-bottom:8px;">سجل المدفوعات (${data.payments.length})</div>
      ${data.payments.map((p, i) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 12px;background:${i % 2 === 0 ? '#f0fdf4' : '#fff'};border-radius:6px;margin-bottom:2px;">
          <span style="font-size:11px;color:#64748b;">${i + 1}. ${p.date}</span>
          <span style="font-size:12px;font-weight:700;color:#059669;">${p.amount.toLocaleString()} د.ع</span>
        </div>
      `).join('')}
    </div>
  ` : '';

  const orthoSection = data.isOrtho && data.orthoDetails ? `
    <div style="background:#f5f3ff;border-radius:10px;padding:12px 16px;margin:0 24px 12px;">
      <div style="font-size:12px;font-weight:700;color:#7c3aed;margin-bottom:4px;">🦷 تفاصيل التقويم</div>
      <div style="font-size:11px;color:#6b7280;">الفك: ${data.orthoDetails.treatedJaw} | النوع: ${data.orthoDetails.applianceType} | التشخيص: ${data.orthoDetails.diagnosis}</div>
    </div>
  ` : '';

  const clinicContact = [
    data.clinicPhone ? `📞 ${data.clinicPhone}` : '',
    data.clinicAddress ? `📍 ${data.clinicAddress}` : '',
  ].filter(Boolean).join('  ·  ');

  return `
    <div style="width:100%;min-width:320px;max-width:600px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;direction:rtl;background:#fff;color:#1e293b;">
      <!-- Top Accent Bar -->
      <div style="height:6px;background:linear-gradient(90deg,#0d9488,#14b8a6);"></div>
      
      <!-- Header -->
      <div style="padding:20px 24px 12px;">
        <div style="font-size:26px;font-weight:800;color:#0d9488;letter-spacing:-0.5px;">${data.clinicName}</div>
        <div style="font-size:12px;color:#94a3b8;margin-top:2px;">عيادة أسنان متخصصة</div>
        ${clinicContact ? `<div style="font-size:11px;color:#94a3b8;margin-top:4px;">${clinicContact}</div>` : ''}
      </div>

      <!-- Divider -->
      <div style="height:2px;background:linear-gradient(90deg,#0d9488,#14b8a6);margin:0 24px;"></div>

      <!-- Invoice Number & Date -->
      <div style="margin:12px 24px;background:#ccfbf1;border-radius:10px;padding:10px 16px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:14px;font-weight:700;color:#0d9488;">فاتورة رقم: ${data.invoiceNumber}</span>
        <span style="font-size:12px;color:#64748b;">${data.date}</span>
      </div>

      <!-- Patient & Doctor Info -->
      <div style="margin:0 24px 12px;background:#f8fafc;border-radius:10px;padding:14px 16px;">
        <div style="display:flex;gap:8px;margin-bottom:8px;">
          <span style="font-size:12px;color:#94a3b8;min-width:50px;">المريض:</span>
          <span style="font-size:14px;font-weight:700;color:#1e293b;">${data.patientName}</span>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px;">
          <span style="font-size:12px;color:#94a3b8;min-width:50px;">الهاتف:</span>
          <span style="font-size:13px;color:#1e293b;direction:ltr;">${data.patientPhone}</span>
        </div>
        <div style="display:flex;gap:8px;">
          <span style="font-size:12px;color:#94a3b8;min-width:50px;">الطبيب:</span>
          <span style="font-size:13px;font-weight:700;color:#0d9488;">${data.doctorName}</span>
        </div>
      </div>

      ${orthoSection}

      <!-- Treatments Table -->
      <div style="margin:0 24px;">
        <div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:8px;">تفاصيل العلاجات</div>
        <table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;">
          <thead>
            <tr style="background:#0d9488;">
              <th style="padding:10px 12px;font-size:11px;color:#fff;font-weight:700;text-align:right;">العلاج</th>
              <th style="padding:10px 12px;font-size:11px;color:#fff;font-weight:700;text-align:center;">السن</th>
              <th style="padding:10px 12px;font-size:11px;color:#fff;font-weight:700;text-align:left;">ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${treatmentRows}
          </tbody>
        </table>
      </div>

      <!-- Financial Summary -->
      <div style="margin:16px 24px 0;">
        <div style="height:1px;background:#e2e8f0;margin-bottom:12px;"></div>
        
        <div style="background:#f8fafc;border-radius:10px;padding:12px 16px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:14px;font-weight:700;color:#1e293b;">الإجمالي:</span>
          <span style="font-size:16px;font-weight:800;color:#1e293b;">${data.totalCost.toLocaleString()} د.ع</span>
        </div>

        <div style="display:flex;justify-content:space-between;padding:6px 16px;">
          <span style="font-size:13px;color:#059669;">المدفوع:</span>
          <span style="font-size:14px;font-weight:700;color:#059669;">${data.paidAmount.toLocaleString()} د.ع</span>
        </div>

        <div style="display:flex;justify-content:space-between;padding:6px 16px;">
          <span style="font-size:13px;color:${data.remaining > 0 ? '#d97706' : '#059669'};">المتبقي:</span>
          <span style="font-size:14px;font-weight:700;color:${data.remaining > 0 ? '#d97706' : '#059669'};">${data.remaining.toLocaleString()} د.ع</span>
        </div>

        <!-- Status Badge -->
        <div style="text-align:center;margin-top:12px;">
          <span style="display:inline-block;padding:8px 24px;border-radius:20px;background:${statusBg};color:${statusColor};font-size:13px;font-weight:700;">${statusText}</span>
        </div>
      </div>

      ${paymentRows ? `<div style="margin:0 24px;">${paymentRows}</div>` : ''}

      <!-- Footer -->
      <div style="padding:20px 24px;text-align:center;">
        <div style="height:1px;background:#0d9488;margin-bottom:14px;opacity:0.3;"></div>
        <div style="font-size:13px;font-weight:700;color:#0d9488;">شكراً لثقتكم بنا 🙏</div>
        <div style="font-size:11px;color:#94a3b8;margin-top:4px;">نتمنى لكم دوام الصحة والعافية</div>
      </div>
    </div>
  `;
}

// ── Print Invoice ──

export function printInvoice(data: InvoiceData): void {
  const html = buildInvoiceHTML(data);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>فاتورة ${data.invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { display: flex; justify-content: center; background: #fff; }
          @media print { body { background: #fff; } }
        </style>
      </head>
      <body>
        <div style="max-width:420px;width:100%;">
          ${html}
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }
}

// ── WhatsApp Share ──

export function shareInvoiceWhatsApp(data: InvoiceData, phoneNumber: string): void {
  const cleanPhone = phoneNumber.replace(/\D/g, '').replace(/^0/, '964');
  const message = encodeURIComponent(
    `🧾 *فاتورة من ${data.clinicName}*\n\n` +
    `📋 رقم الفاتورة: ${data.invoiceNumber}\n` +
    `📅 التاريخ: ${data.date}\n\n` +
    `👤 المريض: ${data.patientName}\n` +
    `🩺 الطبيب: ${data.doctorName}\n` +
    `📝 العلاج: ${data.planName}\n\n` +
    `💰 الإجمالي: ${data.totalCost.toLocaleString()} د.ع\n` +
    `✅ المدفوع: ${data.paidAmount.toLocaleString()} د.ع\n` +
    `⏳ المتبقي: ${data.remaining.toLocaleString()} د.ع\n\n` +
    (data.remaining <= 0 ? '✅ مدفوعة بالكامل' : `⚠️ المبلغ المتبقي: ${data.remaining.toLocaleString()} د.ع`) +
    `\n\nشكراً لثقتكم بنا 🙏`
  );
  
  window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
}
