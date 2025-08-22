FROM nginx:latest

# RUN rm -rf /usr/share/nginx/html/* 

COPY nginx.conf  /etc/nginx/conf.d/default.conf

COPY Dockerfile /usr/share/nginx/html

COPY views  /usr/share/nginx/html/views

COPY views/*.html /usr/share/nginx/html

COPY styles  /usr/share/nginx/html/styles

COPY scripts /usr/share/nginx/html/scripts

