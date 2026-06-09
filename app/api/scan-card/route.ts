import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { imageUrl } = await req.json();
  if (!imageUrl) return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract contact information from this visiting card image. Return ONLY valid JSON with fields: name (string), mobile (string), email (string), designation (string), company (string), address (string). Use null for missing fields. Do not include any other text.",
            },
            {
              type: "image",
              source: {
                type: "url",
                url: imageUrl,
              },
            },
          ],
        }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `AI API error: ${err}` }, { status: 502 });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return NextResponse.json({
      name: parsed.name || null,
      mobile: parsed.mobile || null,
      email: parsed.email || null,
      designation: parsed.designation || null,
      company: parsed.company || null,
      address: parsed.address || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Scan failed" }, { status: 500 });
  }
}
