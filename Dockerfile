# pull official base image
FROM node:13.12.0-alpine

WORKDIR /usr/src/session-service-ui

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

COPY package*.json ./

# install app dependencies
RUN npm install
RUN npm install --silent
RUN npm install react-scripts@3.4.1 -g --silent

COPY . .

EXPOSE 80

# start app
CMD ["npm", "start"]