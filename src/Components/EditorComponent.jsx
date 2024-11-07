import React, { useEffect, useState } from "react";
import "./Editor.css";
import {
  convertFromRaw,
  convertToRaw,
  Editor,
  EditorState,
  Modifier,
  RichUtils,
  SelectionState,
} from "draft-js";
import "draft-js/dist/Draft.css";

const EditorComponent = () => {
  const [editorState, setEditorState] = useState(() =>
    EditorState.createWithContent(
      convertFromRaw(
        JSON.parse(localStorage.getItem("EditorData")) || {
          blocks: [],
          entityMap: {},
        }
      )
    )
  );

  const styleMap = {
    UNDERLINE: { textDecoration: "underline", color: "#000000" },
    RED: { color: "#ee1010" },
    BOLD: { fontWeight: "bold", color: "#000000" },
  };

  //To handle change in editor
  const handledOnChange = (newEditorState) => {
    const content = newEditorState.getCurrentContent();
    const selection = newEditorState.getSelection();
    const blockKey = selection.getStartKey();
    const block = content.getBlockForKey(blockKey);
    const text = block.getText();

    if (selection.getHasFocus() && text === "") {
      console.log("Enter new line");
      let resetEditorState = EditorState.setInlineStyleOverride(
        newEditorState,
        new Set()
      );

      const selectionState = SelectionState.createEmpty(blockKey);
      resetEditorState = RichUtils.toggleBlockType(
        EditorState.forceSelection(resetEditorState, selectionState),
        "unstyled"
      );

      setEditorState(resetEditorState);
    } else {
      const currentStyle = editorState.getCurrentInlineStyle();
      console.log("currentStyle", currentStyle);

      let resetEditorState = EditorState.setInlineStyleOverride(
        newEditorState,
        currentStyle
      );

      setEditorState(resetEditorState);
    }
  };

  //To handle input text
  const handleBeforeInput = (char) => {
    const content = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const blockKey = selection.getStartKey();
    const block = content.getBlockForKey(blockKey);
    const text = block.getText();

    if (char === " ") {
      if (text === "#" && selection.getStartOffset() === 1) {
        convertToBlockType("header-one", 1);
        return "handled";
      } else if (text === "*" && selection.getStartOffset() === 1) {
        convertToInlineText("BOLD", 1);
        return "handled";
      } else if (text === "***" && selection.getStartOffset() === 3) {
        convertToInlineText("UNDERLINE", 3);
        return "handled";
      } else if (text === "**" && selection.getStartOffset() === 2) {
        convertToInlineText("RED", 2);
        return "handled";
      }
    }

    if (char === "\n") {
      const newContentState = Modifier.splitBlock(
        content,
        selection,
        "unstyled"
      );
      const newEditorState = EditorState.push(
        editorState,
        newContentState,
        "split-block"
      );
      setEditorState(newEditorState);
      return "handled";
    }

    return "not-handled";
  };

  //To convert header tags
  const convertToBlockType = (blockType, symbolLength = 1) => {
    const contentState = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const startOffset = selection.getStartOffset();

    const targetSelection = selection.merge({
      anchorOffset: 0,
      focusOffset: startOffset + symbolLength,
    });

    const newContentState = Modifier.removeRange(
      contentState,
      targetSelection,
      "backward"
    );

    const newEditorState = EditorState.push(
      editorState,
      newContentState,
      "remove-range"
    );

    setEditorState(RichUtils.toggleBlockType(newEditorState, blockType));
  };

  //To provide styling for text such as "bold","color","underline"
  const convertToInlineText = (style, symbolLength = 1) => {
    const contentState = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const startOffset = selection.getStartOffset();

    const targetSelection = selection.merge({
      anchorOffset: 0,
      focusOffset: startOffset + symbolLength,
    });

    const newContentState = Modifier.removeRange(
      contentState,
      targetSelection,
      "backward"
    );
    const newEditorState = EditorState.push(
      editorState,
      newContentState,
      "remove-range"
    );

    setEditorState(RichUtils.toggleInlineStyle(newEditorState, style));
  };

  //To save the data in localstorage
  const handleSaveEditorData = () => {
    const contentState = editorState.getCurrentContent();
    const rawContentState = convertToRaw(contentState);
    localStorage.setItem("EditorData", JSON.stringify(rawContentState));
  };

  return (
    <div className="editor">
      <div className="header">
        <div className="left">
          <h4>Demo Editor by Abhay Kadam</h4>
        </div>
        <div className="right">
          <button className="button" onClick={handleSaveEditorData}>
            Save
          </button>
        </div>
      </div>
      <div className="demoEditor">
        <Editor
          placeholder="Type here..."
          customStyleMap={styleMap}
          editorState={editorState}
          onChange={handledOnChange}
          handleBeforeInput={handleBeforeInput}
        />
      </div>
    </div>
  );
};

export default EditorComponent;
