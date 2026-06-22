import { z } from 'zod';

export const GmailConnectorSettings = z.object({
  accessToken: z.string().min(1),
});

export type GmailConnectorSettings = z.infer<typeof GmailConnectorSettings>;

export async function testGmailConnection(settings: GmailConnectorSettings) {
  const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
    headers: {
      Authorization: `Bearer ${settings.accessToken}`,
    },
  });
  return response.ok;
}
