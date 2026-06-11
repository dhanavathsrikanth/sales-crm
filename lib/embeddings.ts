// To switch to HuggingFace embeddings (requires Pro subscription):
// 1. Uncomment the @huggingface/inference import below
// 2. Uncomment the `generateEmbedding` function below it
// 3. Delete or comment out the local `generateEmbedding` function

// import { InferenceClient } from "@huggingface/inference";
// const client = new InferenceClient(process.env.HF_TOKEN);
//
// export async function generateEmbedding(text: string): Promise<number[]> {
//   const output = await client.featureExtraction({
//     model: "BAAI/bge-small-en-v1.5",
//     inputs: text,
//     provider: "hf-inference",
//   });
//   const arr = output as number[];
//   return normalize(arr);
// }

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

export function generateEmbedding(text: string): number[] {
  const tokens = tokenize(text);
  const vec = new Array(DIMENSIONS).fill(0);
  for (const token of tokens) {
    vec[hashWord(token, 0)] += 1;
    vec[hashWord(token, 1)] += 0.5;
  }
  return normalize(vec);
}

export function prepareLeadText(lead: Record<string, any>): string {
  const fields = [
    lead.companyName,
    lead.clientCompany,
    lead.builderName,
    lead.projectName,
    lead.contactPerson,
    lead.designation,
    lead.mobile,
    lead.email,
    lead.siteAddress,
    lead.city,
    lead.district,
    lead.state,
    lead.pincode,
    lead.existingVendor,
    lead.competitorNotes,
    lead.remarks,
    lead.lostReason,
    lead.stage,
    lead.projectType,
    lead.projectStatus,
  ];
  return fields.filter(Boolean).join(" ").trim();
}
