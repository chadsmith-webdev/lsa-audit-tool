import { NextRequest } from "next/server";

export type AuditInput = {
  businessName: string;
  websiteUrl: string;
  primaryTrade: string;
  serviceCity: string;
  noWebsite: boolean;
};

export async function POST(req: NextRequest) {
  let input: AuditInput;
  try {
    input = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Missing Anthropic API key" },
      { status: 500 },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        tools: [{ name: "web_search_20250305" }],
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Audit this business for local SEO:\nBusiness Name: ${input.businessName}\nWebsite: ${input.websiteUrl}\nPrimary Trade: ${input.primaryTrade}\nService City: ${input.serviceCity}\nNo Website: ${input.noWebsite}`,
              },
            ],
          },
        ],
        max_tokens: 2048,
        temperature: 0.2,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return Response.json(
        { error: "Anthropic API error", details: await response.text() },
        { status: response.status },
      );
    }

    const data = await response.json();
    // Find the first content block with type 'json' or parse from text
    let parsed;
    if (Array.isArray(data.content)) {
      const jsonBlock = data.content.find((b: any) => b.type === "json");
      if (jsonBlock) {
        parsed = jsonBlock.json;
      } else {
        // fallback: try to parse text block as JSON
        const textBlock = data.content.find((b: any) => b.type === "text");
        if (textBlock) {
          try {
            parsed = JSON.parse(textBlock.text);
          } catch {
            parsed = { raw: textBlock.text };
          }
        }
      }
    }
    if (!parsed) parsed = data;
    return Response.json(parsed);
  } catch (err: any) {
    if (err.name === "AbortError") {
      return Response.json({ error: "Request timed out" }, { status: 504 });
    }
    return Response.json(
      { error: "Internal server error", details: err?.message },
      { status: 500 },
    );
  }
}
