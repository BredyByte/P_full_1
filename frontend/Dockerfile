FROM nginx:latest

COPY ./conf/nginx.conf /etc/nginx/nginx.conf

WORKDIR /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]
