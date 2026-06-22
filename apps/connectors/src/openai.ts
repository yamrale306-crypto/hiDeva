import { z } from 'zod';

export const OpenAIConnectorSettings = z.object({
  apiKey: z.string().min(1),
  organization: z.string().optional(),
});

export type OpenAIConnectorSettings = z.infer<typeof OpenAIConnectorSettings>;

export async function testOpenAIConnection(settings: OpenAIConnectorSettings) {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json',
    },
  });
  return response.ok;
}
