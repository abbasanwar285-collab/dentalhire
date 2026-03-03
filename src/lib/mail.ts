
import { Resend } from 'resend';

// Initialize Resend with a default value if key is missing to prevent build errors
// The actual email sending checks for the key existence implicitly or fails at runtime
export const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');

export const sendEmail = async ({
    to,
    subject,
    html,
}: {
    to: string;
    subject: string;
    html: string;
}) => {
    try {
        const data = await resend.emails.send({
            from: 'HireMe <onboarding@resend.dev>', // Change this to your verified domain later
            to,
            subject,
            html,
        });

        return { success: true, data };
    } catch (error) {
        return { success: false, error };
    }
};
