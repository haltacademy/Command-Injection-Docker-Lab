FROM node:18-alpine

# Install standard networking utilities for the ping & dns tools
RUN apk add --no-cache \
    iputils-ping \
    bind-tools \
    bash \
    curl \
    net-tools

WORKDIR /app

# Create Flag Files for the CTF challenges
RUN echo "FLAG{c0mm4nd_inj3cti0n_m4st3r_8829}" > /flag.txt && \
    chmod 644 /flag.txt

RUN echo "FLAG{f1lt3r_1d3nt1fy_m4pp3d_6637}" > /opt/.hidden_flag.txt && \
    chmod 644 /opt/.hidden_flag.txt

RUN echo "FLAG{byp4ss_bl4cklist_filt3rs_9912}" > /etc/level3_flag.txt && \
    chmod 644 /etc/level3_flag.txt

RUN mkdir -p /var/backups && \
    echo "FLAG{bl1nd_c0mm4nd_3xecuti0n_7741}" > /var/backups/secret_flag4.txt && \
    chmod 644 /var/backups/secret_flag4.txt

RUN echo "FLAG{ch4r_byp4ss_m4st3r_2291}" > /tmp/.s3cr3t && \
    chmod 644 /tmp/.s3cr3t

RUN echo "FLAG{cmd_bl4cklist_3v4d3d_4418}" > /var/spool/.loot.txt && \
    chmod 644 /var/spool/.loot.txt

# Copy package management files
COPY package*.json ./

# Install application dependencies
RUN npm install --production

# Copy application source
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
