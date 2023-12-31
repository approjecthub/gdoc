# gdoc

google doc clone

## To Run the server

1. locate the server directory `cd server`
2. build the image: `docker build -t gdoc_server:v1 .`
3. create a docker network: `docker network create gdoc_nw`
4. run the docker container:

```
docker run -d \
 -e DB_url=<YOUR_MONGODB_CONNECTION_URL> \
 -e PORT=<BE_PORT> \
 -e NODE_ENV=development \
 -e FE_PORT_LOCAL=3000 \
 -p <HOST_PORT>:3001 \
 --name gdoc_server_instance \
 --network  gdoc_nw \
 <docker_image_name>
```

Example:

```
docker run -d \
 -e DB_url="mongodb://localhost:27017" \
 -e FE_PORT_LOCAL=3000 \
 -p 5657:3001 \
 --name gdoc_server_instance \
 --network  gdoc_nw \
 ghcr.io/approjecthub/gdoc_server:1.0.0
```

## To Run the client

1. locate the server directory `cd client`
2. build the image: `docker build -t gdoc_client:v1 .`
3. run the docker container:

```
docker run -d -e REACT_APP_BE_URL=<BACKEND_APP_URL> -p <HOST_PORT>:3000 --name gdoc_client_instance --network  gdoc_nw gdoc_client:v1
```

Example:

```
docker run -d -e REACT_APP_BE_URL="http://localhost:5657" -p 5656:3000 --name gdoc_client_instance --network  gdoc_nw gdoc_client:v1
```
