import path from 'path';
import { fileURLToPath } from 'url';

export const getDirname = (importMetaUrl) => {
  const filename = fileURLToPath(importMetaUrl);
  return path.dirname(filename);
};

export default getDirname;
