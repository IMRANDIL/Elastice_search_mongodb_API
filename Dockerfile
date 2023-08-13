# Use an official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source code inside the container
COPY . .

# Expose the port that the app will run on
EXPOSE 5000

# Run the app
CMD ["node", "server.js"]
