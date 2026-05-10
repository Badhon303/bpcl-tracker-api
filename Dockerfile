ARG NODE_VERSION=20-alpine
ARG VERSION=1.0.0
 
##############################################################
## Building project                                         ##
##############################################################
FROM node:${NODE_VERSION} as builder
 
ENV NODE_ENV build
 
RUN apk add --no-cache --update --virtual build-base python3-dev python3 make gcc g++
 
WORKDIR /app
 
COPY package.json package-lock.json ./
RUN npm install -f
 
COPY . ./
RUN npm run build
 
##############################################################
## Install production dependencies.                         ##
##############################################################
FROM node:${NODE_VERSION} as production-deps
 
WORKDIR /app
 
COPY package*.json ./
RUN npm install --omit=dev -f && npm cache clean --force
 
##############################################################
## Production Server                                        ##
##############################################################
FROM node:${NODE_VERSION}
ARG VERSION
 
LABEL maintainer="bmqa"
LABEL app.name="bpcl-api"
LABEL app.version=${VERSION}
 
RUN apk add --update --no-cache tini && \
    rm -rf /var/cache/apk/*
 
ENV APP_HOME=/app
ENV PORT=3300
ENV NODE_ENV=production
 
WORKDIR $APP_HOME
 
# Copy all files
COPY --from=production-deps /app/node_modules $APP_HOME/node_modules
COPY --from=builder /app/dist/ $APP_HOME/dist/
COPY package.json package-lock.json $APP_HOME/
# Copy Fabric certificates
COPY peerOrganizations/ $APP_HOME/peerOrganizations/
COPY orderer.example.com/ $APP_HOME/orderer.example.com/
# Create uploads directory if it doesn't exist
RUN mkdir -p $APP_HOME/uploads
 
VOLUME [ "$APP_HOME/uploads" ]
 
EXPOSE $PORT
 
# Exec app
ENTRYPOINT [ "tini", "--" ]
CMD [ "node", "dist/src/main.js" ]