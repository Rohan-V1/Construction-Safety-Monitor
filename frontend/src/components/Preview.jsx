import { useState } from "react";

export default function Preview({ onFile }) {
  const [src, setSrc] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSrc(URL.createObjectURL(file));
    onFile(file);
  };

  return (
    <>
      <input type="file" accept="image/*,video/*" onChange={handleFile} />
      {src && <img src={src} width={960} alt="preview" />}
    </>
  );
}
