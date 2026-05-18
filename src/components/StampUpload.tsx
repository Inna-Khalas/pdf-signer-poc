interface Props {
  image: string | null;
  onUpload: (dataUrl: string) => void;
  onClear: () => void;
}

export function StampUpload({ image, onUpload, onClear }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onUpload(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <section className="panel">
      <h2>Stamp</h2>
      <label className="file-label">
        Choose PNG
        <input type="file" accept="image/png" onChange={handleChange} hidden />
      </label>
      {image && (
        <div className="stamp-preview">
          <img src={image} alt="Stamp" />
          <button type="button" onClick={onClear}>
            Remove
          </button>
        </div>
      )}
    </section>
  );
}
