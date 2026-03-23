FROM node:20-alpine AS builder
WORKDIR /app
ARG VITE_WS_URL
ENV VITE_WS_URL=$VITE_WS_URL
COPY client/package.json ./
RUN npm install
COPY client/ .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
