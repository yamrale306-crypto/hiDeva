import { z } from 'zod';

export const ZapierConnectorSettings = z.object({
  apiKey: z.string().min(1),
});

export type ZapierConnectorSettings = z.infer<typeof ZapierConnectorSettings>;

export async function testZapierConnection(settings: ZapierConnectorSettings) {
  const response = await fetch('https://platform.zapier.com/v1/integrations', {
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json',
    },
  });
  return response.ok;
}
