FROM node:20

# Install dependencies for nwrfc
COPY nwrfcsdk_linux/nwrfcsdk.zip /
RUN mkdir -p -m 777 /usr/local/sap/nwrfcsdk && \
    unzip /nwrfcsdk.zip -d /usr/local/sap/nwrfcsdk && \
    rm /nwrfcsdk.zip

RUN mkdir -p /etc/ld.so.conf.d

# Add nwrfc library to ldconfig
RUN echo "/usr/local/sap/nwrfcsdk/lib" > /etc/ld.so.conf.d/nwrfcsdk.conf 
RUN ldconfig -p

# RUN apk add --no-cache g++ make py3-pip libuuid

# Set environment variable for nwrfc
ENV SAPNWRFC_HOME=/usr/local/sap/nwrfcsdk
RUN chmod -R 777 $SAPNWRFC_HOME

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install npm dependencies
RUN npm install 
RUN npm install -g pm2

# Copy application files
COPY . .

# # Expose port
EXPOSE 5000

# # Start the application using pm2-runtime
CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "development"]