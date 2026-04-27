export default function Upload({ onPreview }) {
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    await fetch("http://localhost:5000/detect", {
      method: "POST",
      body: formData
    });
  };

  return (
    <div style={{ marginBottom: 10 }}>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files[0];
          if (!file) return;
          onPreview(URL.createObjectURL(file));
          uploadFile(file);
        }}
      />
    </div>
  );
}
