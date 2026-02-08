declare module "pptx2json" {
  export const pptxToJson: (filePath: string) => Promise<{
    slides?: { texts?: { text?: string }[] }[];
  }>;
}
