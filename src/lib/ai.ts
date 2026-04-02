const KIMI_API_KEY = 'sk-zgfw04mTqnw3pMS2qcqiuk8CQzyZB0KucyxgK1fsDkiMTW9B';
const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';
const KIMI_MODEL = 'moonshot-v1-8k';

export async function askAI(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 300,
): Promise<string> {
  const res = await fetch(KIMI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${KIMI_API_KEY}`,
    },
    body: JSON.stringify({
      model: KIMI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`AI API error: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content.trim();
}
