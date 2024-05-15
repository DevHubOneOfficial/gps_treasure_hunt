FROM node:20 as build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# production stage
FROM node:20

WORKDIR /usr/src/app

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

COPY --from=build /usr/src/app/dist ./dist

COPY package*.json ./

COPY data ./data

RUN npm install --only=production

RUN rm package*.json

EXPOSE 3000

CMD ["node", "dist/main"]

