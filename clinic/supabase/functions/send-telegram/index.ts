import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    const groupId = Deno.env.get('TELEGRAM_GROUP_ID')

    if (!botToken || !groupId) {
        return new Response(JSON.stringify({ error: 'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_GROUP_ID' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        })
    }

    try {
        const { record } = await req.json()
        const { patientName, date, time, type: treatmentType, doctorId } = record

        // Doctor Badge Mapping
        const doctorNames: Record<string, string> = {
            'dr_abbas': 'د. عباس أنور',
            'dr_ali': 'د. علي رياض',
            'dr_qasim': 'د. قاسم حمودي'
        };
        const doctorDisplay = doctorNames[doctorId] || doctorId || 'غير محدد';

        const escape = (str) => str ? str.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';

        // Message Content (Arabic)
        const isArrived = record.status === 'arrived';
        const title = isArrived ? '🔔 <b>وصول مريض</b>' : '📅 <b>موعد جديد</b>';

        const messageText = `
${title}

👤 <b>المريض:</b> ${escape(patientName)}
🕒 <b>التاريخ:</b> ${escape(date)} - <b>الوقت:</b> ${escape(time)}
👨‍⚕️ <b>الطبيب:</b> ${escape(doctorDisplay)}
🦷 <b>العلاج:</b> ${escape(treatmentType)}
💰 <b>الحالة:</b> ${record.status === 'arrived' ? 'وصل العيادة (بالانتظار)' : 'مؤكد'}
    `.trim()

        // Send to Telegram Group
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: groupId,
                text: messageText,
                parse_mode: 'HTML'
            })
        })

        const result = await res.json()

        return new Response(JSON.stringify({ success: true, result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        })
    }
})
