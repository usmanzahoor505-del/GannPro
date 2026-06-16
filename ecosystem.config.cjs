module.exports = {
  apps: [
    {
      name: "gannpro9-api",
      cwd: "./",
      // Run tsx directly (not via npm) in fork mode so PM2 captures the
      // app's console output. The previous "npm run start:prod" wrapper in
      // cluster mode swallowed all child-process logs.
      script: "server/index.ts",
      interpreter: "node",
      interpreter_args: "--import tsx",
      exec_mode: "fork",
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
