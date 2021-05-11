FROM node:alpine AS builder

WORKDIR /app

COPY ./package.json /app/package.json
RUN npm install

COPY . /app
RUN npm run compile

FROM node:alpine

WORKDIR /app
ENTRYPOINT [ "node", "out/main.js" ]

COPY --from=builder /app/package.json /app/package.json
RUN npm install --production

COPY --from=builder /app/out /app/out