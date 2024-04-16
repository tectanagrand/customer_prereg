FROM node:18

# Install dependencies for nwrfc
COPY nwrfcsdk_linux/nwrfc_lin.zip /
RUN mkdir -p /usr/local/sap/nwrfcsdk && \
    unzip /nwrfc_lin.zip -d /usr/local/sap/nwrfcsdk && \
    rm /nwrfc_lin.zip

RUN mkdir -p /etc/ld.so.conf.d

# Add nwrfc library to ldconfig
RUN echo "/usr/local/sap/nwrfcsdk/nwrfc_lin/lib" > /etc/ld.so.conf.d/nwrfcsdk.conf && ldconfig

# RUN apk add --no-cache g++ make py3-pip libuuid

# Set environment variable for nwrfc
ENV SAPNWRFC_HOME=/usr/local/sap/nwrfcsdk/nwrfc_lin

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install npm dependencies
RUN npm install && \
    npm install -g pm2

# Copy application files
COPY . .

# # Expose port
EXPOSE 5000

# # Start the application using pm2-runtime
CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "development"]