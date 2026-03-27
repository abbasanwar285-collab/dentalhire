import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { create as createJWT } from "https://deno.land/x/djwt@v2.8/mod.ts";

/**
 * 1. Set secret: FIREBASE_SERVICE_ACCOUNT (The entire JSON content)
 * 2. Set secret: SUPABASE_URL and SUPABASE_ANON_KEY (Standard)
 */

const SERVICE_ACCOUNT = Deno.env.get('FIREBASE_SERVICE_ACCOUNT')
    ? JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT')!)
    : null;

async function getAccessToken({ client_email, private_key }: any) {
    const jwt = await createJWT({ alg: "RS256", typ: "JWT" }, {
        iss: client_email,
        scope: "https://www.googleapis.com/auth/firebase.messaging",
        aud: "https://oauth2.googleapis.com/token",
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
    }, private_key);

    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: jwt,
        }),
    });

    const data = await response.json();
    return data.access_token;
}

serve(async (req) => {
    if (!SERVICE_ACCOUNT) {
        return new Response(JSON.stringify({ error: 'Missing FIREBASE_SERVICE_ACCOUNT secret' }), { status: 500 })
    }

    const { record } = await req.json()

    // 1. Get Access Token
    const accessToken = await getAccessToken(SERVICE_ACCOUNT);
    const projectId = SERVICE_ACCOUNT.project_id;

    // 2. Fetch Tokens
    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { data: tokens } = await supabaseClient
        .from('notification_tokens')
        .select('token')

    if (!tokens || tokens.length === 0) {
        return new Response(JSON.stringify({ message: 'No tokens found' }), { status: 200 })
    }

    // 3. Send Notifications (Batching manually)
    const notificationPayload = {
        message: {
            notification: {
                title: 'New Appointment',
                body: `${record.patient_name} with ${record.doctor_id} at ${record.time}`
            },
            data: {
                appointmentId: record.id
            }
        }
    };

    const promises = tokens.map(t =>
        fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ...notificationPayload, message: { ...notificationPayload.message, token: t.token } })
        })
    );

    const results = await Promise.all(promises);

    return new Response(
        JSON.stringify({ success: true, count: results.length }),
        { headers: { "Content-Type": "application/json" } },
    )
})
