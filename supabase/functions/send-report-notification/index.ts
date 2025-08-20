import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReportNotificationRequest {
  reporterName: string;
  accusedName: string;
  reason: string;
  details?: string;
  reportType: 'profile' | 'message' | 'conversation';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reporterName, accusedName, reason, details, reportType }: ReportNotificationRequest = await req.json();

    const typeMap = {
      profile: 'Profile Report',
      message: 'Message Report', 
      conversation: 'Conversation Report'
    };

    const emailResponse = await resend.emails.send({
      from: "Muslim Pros Net <onboarding@resend.dev>",
      to: ["bowandarrowanalytics@outlook.com"],
      subject: `${typeMap[reportType]} - Action Required`,
      html: `
        <h2>New ${typeMap[reportType]} Submitted</h2>
        <p><strong>Reporter:</strong> ${reporterName}</p>
        <p><strong>Reported User:</strong> ${accusedName}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        ${details ? `<p><strong>Additional Details:</strong></p><p>${details.replace(/\n/g, '<br>')}</p>` : ''}
        <hr>
        <p><em>This report was submitted through Muslim Pros Net platform at www.muslimprosnet.com and requires moderation review.</em></p>
      `,
    });

    console.log("Report notification sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-report-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);