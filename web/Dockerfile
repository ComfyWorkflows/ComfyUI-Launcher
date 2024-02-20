FROM node:19-alpine as builder
WORKDIR /my-space

ENV NEXT_PUBLIC_COMFYUI_LAUNCHER_SERVER_URL="http://host.docker.internal:4000"

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine as runner
WORKDIR /my-space
ENV NEXT_PUBLIC_COMFYUI_LAUNCHER_SERVER_URL="http://host.docker.internal:4000"
COPY --from=builder /my-space/package.json .
COPY --from=builder /my-space/package-lock.json .
COPY --from=builder /my-space/next.config.mjs ./
COPY --from=builder /my-space/public ./public
COPY --from=builder /my-space/.next/standalone ./
COPY --from=builder /my-space/.next/static ./.next/static
EXPOSE 3000
ENTRYPOINT ["npm", "start"]