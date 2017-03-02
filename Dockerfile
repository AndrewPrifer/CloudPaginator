FROM node:7.2.1

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ARG NODE_ENV=production
ARG PORT=80

ENV NODE_ENV $NODE_ENV
ENV PORT $PORT

COPY package.json /usr/src/app/
RUN npm install
COPY . /usr/src/app

EXPOSE $PORT

CMD [ "npm", "start" ]