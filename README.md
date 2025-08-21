# ThinkFoody

A beautiful recipe website with animated landing page using HTML, CSS, and Node.js.

## Team details

 - Team name: Drishti Code
 - Team leader name: Yuvraj Kachroo
 - Team member 1: Shanmukha D
 - Team member 2: Pranav Kalkur
 - Team member 3: Teju Karguppi


## Technologies Used

- HTML5
- CSS3 (with animations and transitions)
- Node.js 20+
- Express.js
- Docker - written dockerfile for this application and used the mysql image 


## Project Structure

- `server.js` - Main server file
- `views/` - HTML files
- `styles/` - CSS files

## Making it to run using docker

- Here the two images were used, one is built and the other is pulled from docker hub.
- A bridge network is created to connect both the built container and the pulled container.

- Dockerfile - is present in the repo
- Build the image by using it.

- Using mysql image:
    - Pull the mysql official image from docker hub.
    - Run the mysql image in port 3306 by specifying the environmental variables with tag -e for each of it such as
        - MYSQL_ROOT_PASSWORD=root
        - MYSQL_HOST=mysql
        - MYSQL_PASSWORD=your password or root
        - MYSQL_DATABASE=database name
    - All these fields are necessary to run mysql container as per our application error free.

- Using built image (from the Dockerfile):
    - Run the image by specifying the environmental variables with tag -e for each of it such as
        - MYSQL_HOST=mysql
        - MYSQL_USER=root
        - MYSQL_PASSWORD=your password as in mysql
        - MYSQL_DATABASE=your database as in mysql
    - All these fields are necessary to run without any error.
    - The logs of the container should be
        > foodie-recipe-website@1.0.0 start
        > node server.js

        Server running on http://localhost:3030
        Connected to MySQL database.
        Density data inserted 

 - Now you can access the website at http://localhost:3030

To view the website click : [ThinkFoody](https://think-foody-56ry.vercel.app/)
