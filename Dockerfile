FROM node:alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY src /app/src

EXPOSE 3000

CMD ["node", "src/app.js"]

