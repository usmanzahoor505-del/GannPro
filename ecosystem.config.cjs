module.exports = {
  apps: [
    {
      name: "gannpro9-api",
      cwd: "./",
      script: "npm",
      args: ["run", "start:prod"],
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: { NODE_ENV: "production" },
      error_file: "./logs/api-error.log",
      out_file: "./logs/api-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
