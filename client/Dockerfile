FROM node:14

RUN mkdir -p /home/app/client

COPY . .
RUN npm i
RUN npm run build
RUN npm i -g serve

ENV REACT_APP_BE_URL=http://localhost:3001

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]