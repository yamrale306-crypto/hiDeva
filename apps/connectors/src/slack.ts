import { z } from 'zod';

export const SlackConnectorSettings = z.object({
  botToken: z.string().min(1),
});

export type SlackConnectorSettings = z.infer<typeof SlackConnectorSettings>;

export async function testSlackConnection(settings: SlackConnectorSettings) {
  const response = await fetch('https://slack.com/api/auth.test', {
    headers: {
      Authorization: `Bearer ${settings.botToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
  });
  return response.ok;
}
