# Production image for the NEF backend.
#   docker build -t nef-backend .
#   docker run --env-file .env -p 3000:3000 nef-backend
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies, using the lockfile.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src
COPY scripts ./scripts
COPY db ./db

# Run as the unprivileged "node" user that the base image provides.
USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT:-3000}/health || exit 1

CMD ["node", "src/server.js"]
