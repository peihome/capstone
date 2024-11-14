FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the frontend_test code
COPY . .

# Install frontend_test dependencies
RUN npm install

# Expose the port
EXPOSE 3000

# Start the frontend_main server
CMD ["npm", "start"]