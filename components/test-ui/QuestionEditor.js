import React, { useEffect, useState } from "react";

import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import {
  CheckCircleBoldDuotone,
  TextBoldCircleBoldDuotone,
  TextItalicCircleBoldDuotone,
  TextUnderlineCircleBoldDuotone,
} from "solar-icons";
import { Button, Tooltip } from "antd";
import { normalizeFileUrls } from "@/utils/fileUrl";

const QuestionEditor = ({
  initialContent,
  onUpdate,
  orderNumber,
  posted,
  question,
  onImageUpload,
}) => {
  const [isFirstClick, setIsFirstClick] = useState(true);
  const defaultText = "Энд дарж асуултын текстийг өөрчилнө үү.";
  const isDefault = initialContent === defaultText || !initialContent;
  const editor = useEditor({
    extensions: [
      Underline,
      StarterKit.configure({
        paragraphGroup: false,
      }),
      Image.configure({
        HTMLAttributes: {
          class: "h-[150px] object-cover rounded-lg select-none",
          draggable: "false",
        },
        allowBase64: true,
      }),
    ],
    content: normalizeFileUrls(initialContent) || "Энд дарж асуултын текстийг өөрчилнө үү.",
    editorProps: {
      attributes: {
        class: "prose max-w-none focus:outline-none min-h-[100px] p-4",
      },
      handleClick: (view, pos, event) => {
        if (isFirstClick && isDefault) {
          setIsFirstClick(false);
          const doc = view.state.doc;
          const transaction = view.state.tr.setSelection(
            view.state.selection.constructor.create(doc, 0, doc.content.size)
          );
          view.dispatch(transaction);
          return;
        }

        const node = view.state.doc.nodeAt(pos);
        if (node && node.isText) {
          const parentOffset = view.posAtDOM(event.target);
          const from = parentOffset;
          const to = parentOffset + node.nodeSize;
          const transaction = view.state.tr.setSelection(
            view.state.selection.constructor.create(view.state.doc, from, to)
          );
          view.dispatch(transaction);
        }
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate({
        question: {
          ...question.question,
          name: editor.getHTML(),
        },
      });
    },
  });

  const insertImage = (imageUrl) => {
    if (editor) {
      // Insert a new paragraph before the image if we're not at the start
      if (!editor.state.selection.empty) {
        editor.commands.createParagraphNear();
      }

      // Insert the image
      editor.commands.setImage({ src: imageUrl });

      // Insert a new paragraph after the image
      editor.commands.createParagraphNear();
    }
  };

  // Make insertImage available via props
  React.useEffect(() => {
    if (onImageUpload && editor) {
      // Check if onImageUpload is a valid ref with current property
      if (onImageUpload.current) {
        onImageUpload.current.setInsertImage = insertImage;
      }
    }
  }, [editor, onImageUpload]);

  const FloatingMenu = () => {
    if (!editor) return null;

    const handleFormat = (e, type) => {
      e.preventDefault();
      e.stopPropagation();

      switch (type) {
        case "bold":
          editor.commands.toggleBold();
          break;
        case "italic":
          editor.commands.toggleItalic();
          break;
        case "underline":
          editor.commands.toggleUnderline();
          break;
      }
    };

    useEffect(() => {
      if (initialContent !== editor?.getHTML()) {
        setIsFirstClick(true);
      }
    }, [initialContent, editor]);

    return (
      <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-lg border text-gray-400">
        <button
          type="button"
          onMouseDown={(e) => handleFormat(e, "bold")}
          className={`p-1 rounded hover:text-gray-600 ${
            editor.isActive("bold") ? "text-main" : ""
          }`}
        >
          <TextBoldCircleBoldDuotone />
        </button>
        <button
          type="button"
          onMouseDown={(e) => handleFormat(e, "italic")}
          className={`p-1 rounded hover:text-gray-600 ${
            editor.isActive("italic") ? "text-main" : ""
          }`}
        >
          <TextItalicCircleBoldDuotone />
        </button>
        <button
          type="button"
          onMouseDown={(e) => handleFormat(e, "underline")}
          className={`p-1 rounded hover:text-gray-600 ${
            editor.isActive("underline") ? "text-main" : ""
          }`}
        >
          <TextUnderlineCircleBoldDuotone />
        </button>
      </div>
    );
  };

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .ProseMirror img {
        transition: all 0.2s ease-in-out;
      }
      .ProseMirror img:hover {
        opacity: 0.8;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div className="flex w-full">
      <div className="flex flex-col items-center pl-5 gap-2">
        <div className="text-gray-500 font-semibold">A{orderNumber}</div>
        {posted && (
          <Tooltip title="Хадгалагдсан">
            <CheckCircleBoldDuotone width={19} className="text-green-600" />
          </Tooltip>
        )}
      </div>
      <div className="border rounded-3xl border-gray-300 overflow-hidden relative ml-6 w-full">
        {editor && (
          <BubbleMenu
            editor={editor}
            tippyOptions={{
              duration: 100,
              placement: "top",
              interactive: true,
            }}
            shouldShow={({ state }) => {
              const { selection } = state;
              return !selection.empty;
            }}
            className="bg-white z-50"
          >
            <FloatingMenu />
          </BubbleMenu>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default QuestionEditor;
