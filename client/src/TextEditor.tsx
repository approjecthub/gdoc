import React, { useEffect, useRef, useState } from "react";
import Quill, { Sources } from "quill";
import Delta from "quill/node_modules/quill-delta";
import "quill/dist/quill.snow.css";
import { io, Socket } from "socket.io-client";
import { useParams } from "react-router-dom";

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "blockquote", "code-block", "link"],
  ["clean"],
];

export default function TextEditor() {
  const { id: documentId } = useParams<{ id: string }>();
  const container = useRef<HTMLDivElement>(null);
  const [isQuillEnabled, setIsQuillEnabled] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [quill, setQuill] = useState<Quill | null>(null);

  useEffect(() => {
    const s = io(process.env.REACT_APP_BE_URL!);
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket || !quill) return;

    const saveHandler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.keyCode === "S".charCodeAt(0)) {
        e.preventDefault();
        socket.emit("save-document", quill.getContents());
      }
    };
    document.addEventListener("keydown", saveHandler);

    socket.once("load-document", (doc) => {
      quill.setContents(doc);
      quill.enable();
      setIsQuillEnabled(true);
    });
    socket.emit("get-document", documentId);

    return () => {
      document.removeEventListener("keydown", saveHandler);
    };
  }, [socket, quill, documentId]);

  useEffect(() => {
    if (!socket || !quill) return;
    if (isQuillEnabled) {
      const interval = setInterval(() => {
        socket.emit("save-document", quill.getContents());
      }, 10 * 1000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [socket, quill, isQuillEnabled]);

  useEffect(() => {
    if (!socket || !quill) return;

    const handler = (delta: Delta, _: Delta, source: Sources) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
    };
    quill.on("text-change", handler);

    return () => {
      quill.off("text-change", handler);
    };
  }, [socket, quill]);

  useEffect(() => {
    if (!socket || !quill) return;

    const handler = (delta: Delta) => {
      quill.updateContents(delta);
    };
    socket.on("receive-changes", handler);

    return () => {
      socket.off("receive-changes", handler);
    };
  }, [socket, quill]);

  useEffect(() => {
    if (!socket) return;
    const div = document.createElement("div");
    const parentNode = container.current;
    if (parentNode) {
      parentNode.append(div);
    }

    const q = new Quill(div, {
      theme: "snow",
      modules: {
        toolbar: TOOLBAR_OPTIONS,
      },
    });

    const imageHandler = () => {
      const input = document.createElement("input");

      input.setAttribute("type", "file");
      input.setAttribute("accept", "image/*");
      input.click();

      input.onchange = async () => {
        var file = input.files?.[0];
        var formData = new FormData();

        formData.append("image", file!, file?.name);

        const requestOptions: RequestInit = {
          method: "POST",
          body: formData,
          redirect: "follow",
        };
        try {
          const uploadResponse = await fetch(
            `${process.env.REACT_APP_BE_URL}/media`,
            requestOptions
          ).then((response) => response.json());
          const delta = q.insertEmbed(
            q.getSelection()!.index,
            "image",
            uploadResponse?.imagePath
          );
          socket.emit("send-changes", delta);
        } catch (err) {
          console.log("***** Error while uploading image : ", err);
        }
      };
    };
    const toolbar = q.getModule("toolbar");
    toolbar.addHandler("image", imageHandler);

    q.disable();
    q.setText("Loading...");
    setIsQuillEnabled(false);
    setQuill(q);

    return () => {
      if (parentNode?.innerHTML) {
        parentNode.innerHTML = "";
      }
    };
  }, [socket]);

  return <div className="container" ref={container}></div>;
}
