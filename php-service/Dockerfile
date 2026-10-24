FROM php:8.2-apache

# Enable Apache mod_rewrite & headers
RUN a2enmod rewrite headers

WORKDIR /var/www/html

# Copy service files
COPY . /var/www/html/

# Ensure uploads folder has correct write permissions
RUN mkdir -p /var/www/html/uploads && \
    chmod -R 777 /var/www/html/uploads

EXPOSE 80
