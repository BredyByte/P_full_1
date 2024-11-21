FROM node:16

WORKDIR /app

COPY ./package*.json ./

RUN npm install

EXPOSE 5000

CMD ["node", "src/server.js"]
