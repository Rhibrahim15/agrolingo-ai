export const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 512;
      let width = img.width;
      let height = img.height;
      if (width > height && width > MAX_SIZE) {
        height *= MAX_SIZE / width; width = MAX_SIZE;
      } else if (height > MAX_SIZE) {
        width *= MAX_SIZE / height; height = MAX_SIZE;
      }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => {
        if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        else resolve(file);
      }, 'image/jpeg', 0.65);
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
};