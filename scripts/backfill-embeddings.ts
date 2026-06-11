import { neon } from "@neondatabase/serverless";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const DIMENSIONS = 384;

function hashWord(word: string, seed: number): number {
  let hash = 0;
  for (let i = 0; i < word.length; i++) {
    hash = ((hash << 5) - hash + word.charCodeAt(i)) | 0;
  }
  return ((hash + seed * 2654435761) >>> 0) % DIMENSIONS;
}

function tokenize(text: string): string[] {
  const tokens: string[] = [];
  const lower = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const words = lower.split(/\s+/).filter(Boolean);
  for (const word of words) {
    if (word.length > 1) tokens.push(word);
    for (let n = 2; n <= 4 && n <= word.length; n++) {
      for (let i = 0; i <= word.length - n; i++) {
        tokens.push(word.slice(i, i + n));
      }
    }
  }
  return tokens;
}

function normalize(v: number[]): number[] {
  const mag = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return mag === 0 ? v : v.map((x) => x / mag);
}

function generateEmbedding(text: string): number[] {
  const tokens = tokenize(text);
  const vec = new Array(DIMENSIONS).fill(0);
  for (const token of tokens) {
    vec[hashWord(token, 0)] += 1;
    vec[hashWord(token, 1)] += 0.5;
  }
  return normalize(vec);
}

function prepareLeadText(lead: Record<string, any>): string {
  const fields = [
    lead.company_name,
    lead.client_company,
    lead.builder_name,
    lead.project_name,
    lead.contact_person,
    lead.designation,
    lead.mobile,
    lead.email,
    lead.site_address,
    lead.city,
    lead.district,
    lead.state,
    lead.pincode,
    lead.existing_vendor,
    lead.competitor_notes,
    lead.remarks,
    lead.lost_reason,
    lead.stage,
    lead.project_type,
    lead.project_status,
  ];
  return fields.filter(Boolean).join(" ").trim();
}

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  const leads = await sql`SELECT * FROM leads WHERE embedding IS NULL`;
  console.log(`Found ${leads.length} leads without embeddings`);

  let updated = 0;
  for (const lead of leads) {
    try {
      const text = prepareLeadText(lead);
      if (!text) {
        console.log(`Skipping lead ${lead.id}: no text content`);
        continue;
      }
      const embedding = generateEmbedding(text);
      const embeddingJson = JSON.stringify(embedding);
      await sql`UPDATE leads SET embedding = ${embeddingJson}::vector WHERE id = ${lead.id}`;
      updated++;
      console.log(`Updated lead ${lead.id} (${updated}/${leads.length})`);
    } catch (e) {
      console.error(`Failed to update lead ${lead.id}:`, e);
    }
  }

  console.log(`Done. Updated ${updated} leads.`);
  process.exit(0);
}

main();
