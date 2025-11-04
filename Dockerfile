FROM node:24-alpine
RUN apk add bind-tools

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

CMD [ "node", "index.js" ]
