FROM node:22-alpine
WORKDIR /srv
# su-exec permite corrigir propriedade do volume (montado como root) e rodar Node sem privilégio.
RUN apk add --no-cache su-exec
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY src ./src
RUN mkdir -p /srv/data && chown -R node:node /srv
EXPOSE 8080
ENV PORT=8080
ENV DATA_DIR=/srv/data
# Volumes do Railway podem ser montados como root, mesmo quando /srv é propriedade de node.
# Efetuamos apenas o chown do diretório de dados, depois reduzimos privilégios.
CMD ["sh","-c","chown -R node:node /srv/data && exec su-exec node node src/server.js"]
