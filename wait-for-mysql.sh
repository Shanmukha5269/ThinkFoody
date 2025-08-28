#!/bin/sh

MYSQL_HOST=mysql

echo "Waiting for MySQL to be ready..."

# Wait until we can connect
until nc -z -v -w30 $MYSQL_HOST 3306
do
  echo "Waiting for MySQL at $MYSQL_HOST:3306..."
  sleep 2
done

echo "MySQL is up – waiting a few more seconds to ensure it is fully ready..."
sleep 5

echo "MySQL is up – starting app"

 exec npm start

