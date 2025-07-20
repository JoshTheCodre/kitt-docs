
export const getFileIcon = (fileType) => {
  const type = fileType.toLowerCase();
  
  if (type.includes('pdf')) return '📄';
  if (type.includes('doc') || type.includes('docx')) return '📝';
  if (type.includes('ppt') || type.includes('pptx')) return '📊';
  if (type.includes('xls') || type.includes('xlsx')) return '📈';
  if (type.includes('txt')) return '📄';
  if (type.includes('zip') || type.includes('rar')) return '📦';
  if (type.includes('image')) return '🖼️';
  if (type.includes('video')) return '🎥';
  if (type.includes('audio')) return '🎵';
  return '📁';
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

export const isImageFile = (fileType) => {
  return fileType && fileType.toLowerCase().startsWith('image/');
};

export const isPDFFile = (fileType) => {
  return fileType && fileType.toLowerCase().includes('pdf');
};

export const isVideoFile = (fileType) => {
  return fileType && fileType.toLowerCase().startsWith('video/');
};

export const truncateFileName = (filename, maxLength = 30) => {
  if (filename.length <= maxLength) return filename;
  
  const extension = getFileExtension(filename);
  const nameWithoutExt = filename.replace(`.${extension}`, '');
  const truncated = nameWithoutExt.substring(0, maxLength - extension.length - 3);
  
  return `${truncated}...${extension}`;
};
