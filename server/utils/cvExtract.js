
import { pdf } from 'pdf-parse';
import mammoth from 'mammoth';
import axios from 'axios';

export async function extractTextFromCloudinary(url, mimetypeHint = '') {
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    const buf = Buffer.from(res.data);

    // Xử lý PDF
    if (mimetypeHint.includes('pdf') || url.toLowerCase().endsWith('.pdf')) {
      const parsed = await pdf(buf);
      return parsed.text || '';
    }
    
    // Xử lý DOCX
    if (
      mimetypeHint.includes('vnd.openxmlformats-officedocument.wordprocessingml.document') ||
      url.toLowerCase().endsWith('.docx')
    ) {
      const { value } = await mammoth.extractRawText({ buffer: buf });
      return value || '';
    }
    
    // Xử lý DOC (cần chuyển đổi trước)
    if (mimetypeHint.includes('msword') || url.toLowerCase().endsWith('.doc')) {
      throw new Error('DOC format not supported directly. Please convert to PDF or DOCX first.');
    }
    
    throw new Error('Unsupported file type');
  } catch (error) {
    console.error('Error extracting text from CV:', error);
    throw error;
  }
}