FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the frontend_main code
COPY . .

# Install frontend_main dependencies
RUN npm install

# Expose the port
EXPOSE 5173

# Start the frontend_main server
CMD ["npm", "start"]