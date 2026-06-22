import { z } from 'zod';

export const N8NConnectorSettings = z.object({
  endpoint: z.string().url(),
  apiKey: z.string().min(1),
});

export type N8NConnectorSettings = z.infer<typeof N8NConnectorSettings>;

export async function testN8NConnection(settings: N8NConnectorSettings) {
  const response = await fetch(`${settings.endpoint}/rest/workflows`, {
    headers: {
      Authorization: settings.apiKey,
      'Content-Type': 'application/json',
    },
  });
  return response.ok;
}
