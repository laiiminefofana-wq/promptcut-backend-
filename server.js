const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(cors());

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

if (!fs.existsSync("outputs")) {
  fs.mkdirSync("outputs");
}

app.use("/outputs", express.static("outputs"));

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

app.get("/", (req, res) => {
  res.send("PromptCut backend running 🚀");
});

app.post("/edit", upload.single("video"), (req, res) => {

  if (!req.file) {
    return res.status(400).json({
      error: "No video uploaded"
    });
  }

  const inputPath = req.file.path;

  const outputName = `edited-${Date.now()}.mp4`;

  const outputPath = path.join("outputs", outputName);

  ffmpeg(inputPath)

    // LIGHTER PROCESSING
    .size("720x1280")

    .videoFilters([
      "crop=720:1280"
    ])

    .outputOptions([
      "-preset ultrafast",
      "-crf 32"
    ])

    .videoCodec("libx264")
    .audioCodec("aac")

    .save(outputPath)

    .on("end", () => {

      res.json({
        success: true,
        video: `/outputs/${outputName}`
      });

    })

    .on("error", (err) => {

      console.log("FFmpeg Error:", err);

      res.status(500).json({
        error: err.message
      });

    });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
