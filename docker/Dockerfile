FROM node:24-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN npm install -g pnpm@10.12.0
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @workspace/web run build

EXPOSE 4173

CMD ["pnpm", "--filter", "@workspace/web", "run", "preview"]
