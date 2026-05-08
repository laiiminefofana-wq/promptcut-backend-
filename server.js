const express = require("express");
const multer = require("multer");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("outputs")) fs.mkdirSync("outputs");

const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  const inputPath = req.file.path;

  const subtitlePath = `outputs/subtitles-${Date.now()}.srt`;
  const outputPath = `outputs/output-${Date.now()}.mp4`;

  // Step 1: Generate subtitles with Whisper
  const whisperCommand = `
  whisper "${inputPath}" --model tiny --output_dir outputs
  `;

  exec(whisperCommand, (whisperError) => {
    if (whisperError) {
      console.error("Whisper error:", whisperError);
      return res.status(500).send("Subtitle generation failed");
    }

    // Find generated subtitle file
    const files = fs.readdirSync("outputs");
    const srtFile = files.find(file => file.endsWith(".srt"));

    if (!srtFile) {
      return res.status(500).send("Subtitle file not found");
    }

    const srtPath = path.join("outputs", srtFile);

    // Step 2: Process video + burn subtitles
    const ffmpegCommand = `
    ffmpeg -y -i "${inputPath}" \
    -vf "subtitles=${srtPath}:force_style='Fontsize=18,PrimaryColour=&Hffffff&,OutlineColour=&H000000&,BorderStyle=3,Outline=2',scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" \
    -af silenceremove=start_periods=1:start_threshold=-40dB:stop_periods=1:stop_threshold=-40dB \
    -c:v libx264 \
    -preset ultrafast \
    -crf 28 \
    -c:a aac \
    "${outputPath}"
    `;

    exec(ffmpegCommand, (ffmpegError, stdout, stderr) => {
      if (ffmpegError) {
        console.error(stderr);
        return res.status(500).send(stderr);
      }

      res.download(outputPath, () => {
        fs.unlinkSync(inputPath);
      });
    });
  });
});

app.get("/", (req, res) => {
  res.send("PromptCut AI Editor Running 🚀");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
