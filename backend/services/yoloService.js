const { execFile } = require("child_process");
const path = require("path");

const PYTHON = path.resolve(
  __dirname,
  "../../ai-model/venv/Scripts/python.exe"
);

const SCRIPT = path.resolve(
  __dirname,
  "../../ai-model/detect.py"
);

exports.runYOLO = (imagePath) => {
  return new Promise((resolve, reject) => {
    execFile(
      PYTHON,
      [SCRIPT, imagePath],
      (error, stdout, stderr) => {
        if (error) {
          console.error(stderr);
          return reject(stderr);
        }
        try {
          resolve(JSON.parse(stdout));
        } catch {
          reject("Invalid JSON from Python");
        }
      }
    );
  });
};
