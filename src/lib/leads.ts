'use server';

import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';

const SEHEL_CRM_ENDPOINT = 'https://leads.sehel.co.il';

const leadSubmissionSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  email: z.string().trim().email().optional().or(z.literal('')),
  message: z.string().trim().optional(),
  refUrl: z.string().trim().optional(),
});

export type LeadSubmission = z.infer<typeof leadSubmissionSchema>;

async function syncToSehelCrm(lead: LeadSubmission): Promise<{ ok: boolean; leadId?: string }> {
  const projectId = process.env.SEHEL_CRM_PROJECT_ID;
  if (!projectId) return { ok: false };

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
        lead_comment: lead.message || undefined,
        ref_url: lead.refUrl || undefined,
      }),
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

/** Persists the lead in Firestore, then best-effort forwards it to the client's Sehel CRM. */
export async function submitLead(input: LeadSubmission): Promise<void> {
  const lead = leadSubmissionSchema.parse(input);

  const docRef = await adminDb.collection('leads').add({
    ...lead,
    createdAt: new Date().toISOString(),
    crmSynced: false,
  });

  const crmResult = await syncToSehelCrm(lead);
  if (crmResult.ok) {
    await docRef.update({ crmSynced: true, crmLeadId: crmResult.leadId ?? null });
  }
}
