FROM node:14

# Set the working directory
WORKDIR /home/app/client

# Copy the application files
COPY . .

# Install dependencies
RUN npm install

# Set environment variable
ENV REACT_APP_BE_URL=http://localhost:3001

# Install serve globally
RUN npm install -g serve

# Expose port 3000
EXPOSE 3000

# Create a script to run both commands sequentially
RUN echo '#!/bin/sh\n\
npm run build\n\
serve -s build -l 3000' > start.sh

# Give execute permissions to the script
RUN chmod +x start.sh

# Specify the command to run on container start
CMD ["./start.sh"]
