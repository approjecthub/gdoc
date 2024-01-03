require("dotenv").config();
import gDocument from "./gDocument";
import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import path from "path";
import multer from "multer";
import http from "http";
import { Server } from "socket.io";

const app = express();

app.use(
  cors({
    origin: [
      ...(process.env.NODE_ENV === "development"
        ? [new RegExp(`localhost:${process.env.FE_PORT_LOCAL || 3000}$`)]
        : [/\.onrender.com$/, /\.netlify.app$/]),
    ],
    methods: ["GET", "POST"],
  })
);
app.use(express.static(path.join(__dirname, "images")));

const MIME_type_mp: { [key: string]: string } = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
};

const storage = multer.diskStorage({
  destination: (_, file, cb) => {
    let isValid = MIME_type_mp[file.mimetype];
    let error: Error | null = new Error("file mime type not valid");
    if (isValid) {
      error = null;
    }
    cb(error, path.join(__dirname, "images"));
  },
  filename: (_, file, cb) => {
    const name = file.originalname.split(" ").join("-");
    const ext = MIME_type_mp[file.mimetype];
    cb(null, name + "-" + Date.now() + "." + ext);
  },
});

app.use("/health", async (_, res) => {
  return res.status(200).send({ health: "perfect" });
});

app.post(
  "/media",
  multer({ storage: storage }).single("image"),
  async (req, res) => {
    const url = req.protocol + "://" + req.get("host");
    try {
      res.status(201).send({ imagePath: url + "/" + req.file?.filename });
    } catch (err: any) {
      res.status(400).send(err.message);
    }
  }
);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      ...(process.env.NODE_ENV === "development"
        ? [new RegExp(`localhost:${process.env.FE_PORT_LOCAL || 3000}$`)]
        : [/\.onrender.com$/, /\.netlify.app$/]),
    ],
    methods: ["GET", "POST"],
  },
});

mongoose.connect(process.env.DB_url!, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

io.on("connection", (socket) => {
  socket.on("get-document", async (documentId) => {
    const document = await findOrCreateGDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", document.data);

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data) => {
      await gDocument.findByIdAndUpdate(documentId, { data });
    });
  });
});

async function findOrCreateGDocument(id: string) {
  if (id === null) return null;

  const document = await gDocument.findById(id);
  if (document) return document;

  return await gDocument.create({ _id: id, data: "" });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});
