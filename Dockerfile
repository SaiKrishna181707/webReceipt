FROM node:22-alpine
WORKDIR /app

COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src
COPY --chown=node:node public ./public
COPY --chown=node:node brightdata ./brightdata
COPY --chown=node:node scripts ./scripts
RUN mkdir -p /app/data && chown -R node:node /app/data

ENV NODE_ENV=production PORT=3000 WEBRECEIPT_STATE_FILE=/app/data/state.json
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD wget -q -O - http://127.0.0.1:3000/api/health >/dev/null || exit 1
CMD ["node", "src/server.js"]
