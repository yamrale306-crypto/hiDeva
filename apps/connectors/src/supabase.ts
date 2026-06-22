import { z } from 'zod';

export const SupabaseConnectorSettings = z.object({
  url: z.string().url(),
  anonKey: z.string().min(1),
});

export type SupabaseConnectorSettings = z.infer<typeof SupabaseConnectorSettings>;

export async function testSupabaseConnection(settings: SupabaseConnectorSettings) {
  const response = await fetch(`${settings.url}/rest/v1/?schema=public`, {
    headers: {
      apikey: settings.anonKey,
      Authorization: `Bearer ${settings.anonKey}`,
    },
  });
  return response.ok;
}
