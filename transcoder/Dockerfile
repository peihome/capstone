FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the transcoder code
COPY . .

# Install backend dependencies
RUN npm install

# Expose the port
EXPOSE 8001

# Start the backend server
CMD ["npm", "start"]