const { exec } = require("child_process");

// run YOLO prediction
const runYOLO = (imagePath) => {
  return new Promise((resolve, reject) => {
    exec(`python3 predict.py ${imagePath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(error);
        return reject("Python execution error");
      }

      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (err) {
        reject({
          message: "Parsing error",
          raw: stdout,
        });
      }
    });
  });
};

module.exports = {
  runYOLO,
};