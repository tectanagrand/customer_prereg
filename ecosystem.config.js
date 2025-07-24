module.exports = {
    apps: [
        {
            name: "prereg",
            script: "index.js",
            // watch: true,
            autorestart: true,
            exp_backoff_restart_delay: 100,
            env: {
                NODE_ENV: "development",
            },
            env_production: {
                NODE_ENV: "production",
            },
        },
    ],
};
