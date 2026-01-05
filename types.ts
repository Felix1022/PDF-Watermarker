
export interface WatermarkConfig {
  text: string;
  color: string;
  opacity: number;
  rotation: number;
  fontSize: number;
  spacingX: number;
  spacingY: number;
}

export interface PDFFile {
  file: File;
  name: string;
  size: number;
}
