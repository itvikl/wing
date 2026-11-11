'use server';

import { createHash } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';

const SEHEL_CRM_ENDPOINT = 'https://leads.sehel.co.il';
// Graph API versions live about two years; bump this when Meta retires it.
const META_GRAPH_VERSION = 'v23.0';

const optionalText = (max: number) => z.string().trim().max(max).optional().default('');

const attributionSchema = z
  .object({
    utm_source: z.string().max(300).optional(),
    utm_medium: z.string().max(300).optional(),
    utm_campaign: z.string().max(300).optional(),
    utm_content: z.string().max(300).optional(),
    utm_term: z.string().max(300).optional(),
    fbclid: z.string().max(500).optional(),
    gclid: z.string().max(500).optional(),
    landingUrl: z.string().max(1000).optional(),
    referrer: z.string().max(1000).optional(),
    firstSeen: z.string().max(40).optional(),
  })
  .partial()
  .optional()
  .default({});

const leadSubmissionSchema = z.object({
  name: z.string().trim().min(1).max(200),
  // International format from the form ("+12125550100"): a "+" and 7–15 digits.
  phone: z.string().trim().regex(/^\+?\d{7,15}$/),
  country: optionalText(2),
  email: z.string().trim().email().optional().or(z.literal('')),
  message: optionalText(4000),
  budget: optionalText(200),
  timeline: optionalText(200),
  purpose: optionalText(200),
  callTime: optionalText(200),
  timezone: optionalText(100),
  marketingConsent: z.boolean().optional().default(false),
  locale: optionalText(5),
  refUrl: optionalText(1000),
  eventId: optionalText(100),
  attribution: attributionSchema,
});

export type LeadSubmission = z.input<typeof leadSubmissionSchema>;
type Lead = z.output<typeof leadSubmissionSchema>;

/** The qualifying answers as lines, for the CRM's single comment field. */
function leadDetails(lead: Lead): string {
  const a = lead.attribution;
  const lines = [
    lead.message,
    lead.budget && `Budget: ${lead.budget}`,
    lead.timeline && `Timeline: ${lead.timeline}`,
    lead.purpose && `Purpose: ${lead.purpose}`,
    lead.callTime && `Best time to call: ${lead.callTime}${lead.timezone ? ` (${lead.timezone})` : ''}`,
    !lead.callTime && lead.timezone && `Time zone: ${lead.timezone}`,
    `Marketing consent: ${lead.marketingConsent ? 'yes' : 'no'}`,
    (a.utm_source || a.utm_campaign) &&
      `Campaign: ${[a.utm_source, a.utm_medium, a.utm_campaign, a.utm_content].filter(Boolean).join(' / ')}`,
  ];
  return lines.filter(Boolean).join('\n');
}

async function syncToSehelCrm(lead: Lead): Promise<{ ok: boolean; leadId?: string }> {
  const projectId = process.env.SEHEL_CRM_PROJECT_ID;
  if (!projectId) return { ok: false };

  // The landing URL keeps the ad's ?utm_ tail, which the page the form was
  // sent from (often /contact, or a later visit) no longer has.
  const refUrl = lead.attribution.utm_source || lead.attribution.fbclid ? lead.attribution.landingUrl : lead.refUrl;

  try {
    const response = await fetch(SEHEL_CRM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        media_source: 'אתר',
        lead_name: lead.name,
        lead_phone: lead.phone,
        lead_email: lead.email || undefined,
        lead_comment: leadDetails(lead) || undefined,
        ref_url: refUrl || undefined,
      }),
      signal: AbortSignal.timeout(8000),
    });
    const result = await response.json();
    if (response.ok && result.status === 'ok') {
      return { ok: true, leadId: result.leadId };
    }
    console.error('Sehel CRM lead sync rejected', result);
    return { ok: false };
  } catch (error) {
    console.error('Sehel CRM lead sync failed', error);
    return { ok: false };
  }
}

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

/**
 * The same Lead the browser's pixel reports, sent from the server (Meta
 * Conversions API), so ad blockers and iOS tracking limits don't lose it.
 * The shared event_id makes Meta count the two as one. Contact details are
 * hashed (SHA-256) as Meta requires. Off unless META_PIXEL_ID and
 * META_CAPI_ACCESS_TOKEN are both set.
 */
async function sendMetaLead(lead: Lead): Promise<boolean> {
  const pixelId = process.env.META_PIXEL_ID?.trim();
  const token = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  if (!pixelId || !token || !lead.eventId) return false;

  const headerList = headers();
  const cookieList = cookies();
  const ip = headerList.get('x-forwarded-for')?.split(',')[0]?.trim();
  const userAgent = headerList.get('user-agent') ?? undefined;
  const fbclid = lead.attribution.fbclid;
  const fbc =
    cookieList.get('_fbc')?.value ??
    (fbclid ? `fb.1.${Date.parse(lead.attribution.firstSeen ?? '') || Date.now()}.${fbclid}` : undefined);
  const [first, ...rest] = lead.name.toLowerCase().split(/\s+/).filter(Boolean);

  const userData: Record<string, unknown> = {
    ph: [sha256(lead.phone.replace(/\D/g, ''))],
    client_ip_address: ip,
    client_user_agent: userAgent,
    fbp: cookieList.get('_fbp')?.value,
    fbc,
  };
  if (lead.email) userData.em = [sha256(lead.email.toLowerCase())];
  if (first) userData.fn = [sha256(first)];
  if (rest.length) userData.ln = [sha256(rest.join(' '))];
  if (lead.country) userData.country = [sha256(lead.country.toLowerCase())];

  try {
    const response = await fetch(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [
            {
              event_name: 'Lead',
              event_time: Math.floor(Date.now() / 1000),
              event_id: lead.eventId,
              action_source: 'website',
              event_source_url: lead.refUrl || undefined,
              user_data: userData,
              custom_data: { content_name: 'Lead form', lead_purpose: lead.purpose || undefined },
            },
          ],
          // Set while checking events in Events Manager → Test events; unset in production.
          test_event_code: process.env.META_CAPI_TEST_CODE || undefined,
        }),
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!response.ok) {
      console.error('Meta CAPI rejected the lead', await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error('Meta CAPI request failed', error);
    return false;
  }
}

/**
 * Persists the lead in Firestore, then best-effort forwards it to the
 * client's Sehel CRM and to Meta. Neither of those can fail the submission:
 * the lead is already saved.
 */
export async function submitLead(input: LeadSubmission): Promise<void> {
  const lead = leadSubmissionSchema.parse(input);

  const docRef = await adminDb.collection('leads').add({
    // Firestore refuses `undefined` field values; a JSON round trip drops them.
    ...(JSON.parse(JSON.stringify(lead)) as Lead),
    createdAt: new Date().toISOString(),
    crmSynced: false,
    metaSent: false,
  });

  const [crmResult, metaSent] = await Promise.all([syncToSehelCrm(lead), sendMetaLead(lead)]);
  const update: Record<string, unknown> = {};
  if (crmResult.ok) Object.assign(update, { crmSynced: true, crmLeadId: crmResult.leadId ?? null });
  if (metaSent) update.metaSent = true;
  if (Object.keys(update).length) await docRef.update(update);
}
