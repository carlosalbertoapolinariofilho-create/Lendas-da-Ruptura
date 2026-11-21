FROM node:22-alpine
WORKDIR /srv
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY src ./src
RUN mkdir -p /srv/data && chown -R node:node /srv
USER node
EXPOSE 8080
ENV PORT=8080
ENV DATA_DIR=/srv/data
CMD ["node","src/server.js"]
