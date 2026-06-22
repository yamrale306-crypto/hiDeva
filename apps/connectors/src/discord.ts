import { z } from 'zod';

export const DiscordConnectorSettings = z.object({
  botToken: z.string().min(1),
});

export type DiscordConnectorSettings = z.infer<typeof DiscordConnectorSettings>;

export async function testDiscordConnection(settings: DiscordConnectorSettings) {
  const response = await fetch('https://discord.com/api/users/@me', {
    headers: {
      Authorization: `Bot ${settings.botToken}`,
    },
  });
  return response.ok;
}
