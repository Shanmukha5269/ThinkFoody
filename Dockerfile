FROM node:alpine

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

# COPY wait-for-mysql.sh .

# RUN apk add --no-cache dos2unix 

# RUN dos2unix wait-for-mysql.sh 

#RUN chmod +x wait-for-mysql.sh

EXPOSE 3030

# ENTRYPOINT ["/app/wait-for-mysql.sh"] 

# CMD ["./wait-for-mysql.sh"]

CMD ["npm", "start"] 

 
