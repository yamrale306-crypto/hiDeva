import { z } from 'zod';

export const NotionConnectorSettings = z.object({
  apiKey: z.string().min(1),
});

export type NotionConnectorSettings = z.infer<typeof NotionConnectorSettings>;

export async function testNotionConnection(settings: NotionConnectorSettings) {
  const response = await fetch('https://api.notion.com/v1/users/me', {
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      'Notion-Version': '2022-06-28',
    },
  });
  return response.ok;
}
