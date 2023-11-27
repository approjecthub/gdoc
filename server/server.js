require('dotenv').config()
const gDocument = require('./gDocument')
const mongoose = require('mongoose')
const express = require('express')
const cors = require('cors')
const app = express();
const multer = require('multer')
const path = require('path')

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST']
}))
app.use(express.static(path.join(__dirname, 'images')))

const MIME_type_mp = {
  'image/png':'png',
  'image/jpeg':'jpg',
  'image/jpg':'jpg'
}

const storage = multer.diskStorage({
  destination: (req,file, cb)=>{
      let isValid = MIME_type_mp[file.mimetype]
      let error = new Error('file mime type not valid')
      if (isValid){
          error = null
      }
      cb(error, path.join(__dirname,'images'))
  },
  filename:(req,file,cb)=>{
      const name= file.originalname.split(' ').join('-')
      const ext = MIME_type_mp[file.mimetype]
      cb(null, name+'-'+Date.now()+'.'+ext)
  }
})

app.post('/media', multer({storage:storage}).single('image'), async(req,res)=>{
  const url = req.protocol+'://'+req.get('host')
  try{     
      res.status(201).send({imagePath:url+'/' +req.file.filename})
  }
  catch(err){
      res.status(400).send(err.message)
  }
})

const http = require('http')
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

mongoose.connect(process.env.DB_url, {
  useNewUrlParser: true,
  useUnifiedTopology:true,
  useFindAndModify: false,
  useCreateIndex: true
})

io.on("connection", socket => {
  socket.on("get-document", async documentId => {
    const document = await findOrCreateGDocument(documentId)
    socket.join(documentId)
    socket.emit("load-document", document.data)

    socket.on("send-changes", delta => {
      console.log('###### delta: ', delta);
      socket.broadcast.to(documentId).emit("receive-changes", delta)
    })

    socket.on("save-document", async data => {
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

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});