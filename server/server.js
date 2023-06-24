require('dotenv').config()
const gDocument = require('./gDocument')
const mongoose = require('mongoose')
const { createAdapter } = require("@socket.io/cluster-adapter");
const {setupWorker} = require('@socket.io/sticky')

mongoose.connect(process.env.DB_url, {
  useNewUrlParser: true,
  useUnifiedTopology:true,
  useFindAndModify: false,
  useCreateIndex: true
})

const io = require("socket.io")(3001, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  })
io.adapter(createAdapter())
setupWorker(io)

io.on("connection", socket => {
  console.info(`socketId: ${socket}, listning connection event...`)
  socket.on("get-document", async documentId => {
    console.info(`socketId: ${socket}, listning get-document event for docId:${documentId}...`)
    const document = await findOrCreateGDocument(documentId)
    socket.join(documentId)
    socket.emit("load-document", document.data)

    socket.on("send-changes", delta => {
      console.info(`socketId: ${socket}, listning send-changes event...`)
      socket.broadcast.to(documentId).emit("receive-changes", delta)
    })

    socket.on("save-document", async data => {
      console.info(`socketId: ${socket}, listning save-document event...`)
      await gDocument.findByIdAndUpdate(documentId, { data })
    })
  })
})


async function findOrCreateGDocument(id){
  if (id===null) return null

  const document = await gDocument.findById(id)
  if(document) return document

  return await gDocument.create({_id:id, data: ''})
}