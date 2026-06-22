import { z } from 'zod';

export const GitHubConnectorSettings = z.object({
  accessToken: z.string().min(1),
});

export type GitHubConnectorSettings = z.infer<typeof GitHubConnectorSettings>;

export async function testGitHubConnection(settings: GitHubConnectorSettings) {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `token ${settings.accessToken}`,
      Accept: 'application/vnd.github+json',
    },
  });
  return response.ok;
}
