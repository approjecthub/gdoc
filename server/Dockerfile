FROM node:14-alpine

WORKDIR /home/app/server

COPY . .
RUN npm i
RUN mkdir images

# Need to replace running the container
ENV DB_url=mongodb://localhost:27017 \
    PORT=3001 \
    NODE_ENV=development\
    FE_PORT_LOCAL=3000

EXPOSE ${PORT}

RUN npm run build
RUN mkdir build/images

CMD ["npm", "run", "start"]
