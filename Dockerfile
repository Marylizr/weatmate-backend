FROM node:16

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if exists)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY src ./src

# Expose the port the app runs on (Heroku uses dynamic ports, so we'll set this later)
EXPOSE 3001

# Command to run the app
CMD ["node", "src/index.js"]
