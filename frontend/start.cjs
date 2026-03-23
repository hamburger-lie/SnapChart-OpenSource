// 启动 Vite 开发服务器的轻量入口（CommonJS）
process.chdir(__dirname);
const { spawn } = require("child_process");
const child = spawn(process.execPath, ["node_modules/vite/bin/vite.js", ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: __dirname,
});
child.on("exit", (code) => process.exit(code));
