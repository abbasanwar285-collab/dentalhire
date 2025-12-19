
import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

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
