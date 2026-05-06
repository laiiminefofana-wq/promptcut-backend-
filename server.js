const express = require("express");
const multer = require("multer");
const { exec } = require("child_process");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "uploads/" });

// create outputs folder
if (!fs.existsSync("outputs")) {
  fs.mkdirSync("outputs");
}

app.post("/upload", upload.single("video"), (req, res) => {
  const inputPath = req.file.path;
  const outputPath = `outputs/output-${Date.now()}.mp4`;

  const command = `
    ffmpeg -i ${inputPath} 
    -vf "scale=1080:1920" 
    -preset fast 
    ${outputPath}
  `;

  exec(command, (error) => {
    if (error) {
      return res.status(500).send("Error processing video");
    }
    res.download(outputPath);
  });
});

app.listen(3000, () => console.log("Server running"));
