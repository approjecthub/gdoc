FROM node:14-alpine

WORKDIR /home/app/server

COPY . .
RUN npm i

# Need to replace running the container
ENV DB_url=mongodb://localhost:27017 \
    FE_BASE_url=http://localhost:3000 \
    PORT=3001


EXPOSE ${PORT}

CMD ["node", "server.js"]
