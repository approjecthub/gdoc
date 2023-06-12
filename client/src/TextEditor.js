import React, { useEffect, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import {io} from 'socket.io-client'
import {useParams} from 'react-router-dom'

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "blockquote", "code-block"],
  ["clean"],
]

export default function TextEditor() {
  const {id: documentId} = useParams()
  const container = useRef(null);
  const [isQuillEnabled, setIsQuillEnabled] = useState(false)
  const [socket, setSocket] = useState(null)
  const [quill, setQuill] = useState(null)

  useEffect(()=>{
    const s = io("http://localhost:3001/")
    setSocket(s)

    return ()=>{
      s.disconnect()
    }
  }, [])

  useEffect(()=>{
    if(!socket || !quill) return

    const saveHandler = (e)=>{
      if((e.ctrlKey || e.metaKey) && e.keyCode === 'S'.charCodeAt(0)){
        e.preventDefault()
        socket.emit('save-document', quill.getContents())
      }
    }
    document.addEventListener('keydown', saveHandler)

    socket.once("load-document", doc=>{
      quill.setContents(doc)
      quill.enable()
      setIsQuillEnabled(true)
    })
    socket.emit('get-document', documentId)

    return ()=>{
      document.removeEventListener('keydown', saveHandler)
    }
  }, [socket, quill, documentId])

  useEffect(()=>{
    if(!socket || !quill) return
    if(isQuillEnabled){
      const interval = setInterval(()=>{
          socket.emit('save-document', quill.getContents())
        
      }, 10*1000)
  
      return ()=>{
        clearInterval(interval)
      }
    }

  }, [socket, quill, isQuillEnabled])

  useEffect(()=>{
    if(!socket || !quill) return 

    const handler = (delta, oldData, source)=>{
      if(source!== 'user') return 
       socket.emit("send-changes", delta)
    }
    quill.on('text-change', handler)

    return ()=>{
      quill.off('text-change', handler)
    }
  }, [socket, quill])

  useEffect(()=>{
    if(!socket || !quill) return 

    const handler = (delta)=>{
      quill.updateContents(delta)
    }
    socket.on('receive-changes', handler)

    return ()=>{
      socket.off('receive-changes', handler)
    }
  }, [socket, quill])  

  useEffect(() => {
    const div = document.createElement("div");
    const parentNode = container.current
    if (parentNode) {
      parentNode.append(div);
    }

    const q = new Quill(div, {
      theme: "snow",
      modules:{
        toolbar: TOOLBAR_OPTIONS
      }
    });
    q.disable()
    q.setText('Loading...')
    setIsQuillEnabled(false)
    setQuill(q)

    return () => {
        if (parentNode?.innerHTML) {
          parentNode.innerHTML = "";
        }
    };
  }, []);

  return <div className="container" ref={container}></div>;
}
