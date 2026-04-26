import CryptoJS from "crypto-js";

// ── Helper: extract plain text from tiptap JSON ──
export function extractTextFromJSON(node: any): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  let text = "";
  if (node.text) text += node.text;
  if (node.content) {
    text += node.content.map((child: any) => extractTextFromJSON(child)).join("");
  }
  if (node.items) {
    text += node.items.map((item: any) => item.text || "").join("\n") + "\n";
  }
  // Add newline between block-level nodes for proper word separation
  if (node.type && ["paragraph", "heading", "bulletList", "orderedList", "listItem", "taskList", "taskItem", "blockquote", "codeBlock", "hardBreak"].includes(node.type)) {
    text += "\n";
  }
  return text;
}

export const encryptMemosText = (memos: any, key: string) => {
  const processNode = (node: any): any => {
    if (!node) return node;
    if (typeof node === "string") {
      return CryptoJS.AES.encrypt(node, key).toString();
    }
    if (typeof node !== "object") return node;

    const newNode = { ...node };
    if (newNode.text && typeof newNode.text === "string") {
      newNode.text = CryptoJS.AES.encrypt(newNode.text, key).toString();
    }

    if (Array.isArray(newNode.content)) {
      newNode.content = newNode.content.map(processNode);
    }
    if (Array.isArray(newNode.items)) {
      newNode.items = newNode.items.map(processNode);
    }
    return newNode;
  };

  const result: any = {};
  for (const id in memos) {
    result[id] = processNode(memos[id]);
  }
  return result;
};

export const decryptMemosText = (memos: any, key: string) => {
  const processNode = (node: any): any => {
    if (!node) return node;
    if (typeof node === "string") {
      try {
        const bytes = CryptoJS.AES.decrypt(node, key);
        if (bytes && typeof bytes.toString === "function") {
          const dec = bytes.toString(CryptoJS.enc.Utf8);
          return dec || node;
        }
      } catch (e) {}
      return node;
    }
    if (typeof node !== "object") return node;

    const newNode = { ...node };
    if (newNode.text && typeof newNode.text === "string") {
      try {
        const bytes = CryptoJS.AES.decrypt(newNode.text, key);
        if (bytes && typeof bytes.toString === "function") {
          const dec = bytes.toString(CryptoJS.enc.Utf8);
          if (dec) newNode.text = dec;
        }
      } catch (e) {}
    }

    if (Array.isArray(newNode.content)) {
      newNode.content = newNode.content.map(processNode);
    }
    if (Array.isArray(newNode.items)) {
      newNode.items = newNode.items.map(processNode);
    }
    return newNode;
  };

  const result: any = {};
  for (const id in memos) {
    result[id] = processNode(memos[id]);
  }
  return result;
};
