export function uploadFileToAdminApi(
  file: File,
  customName: string,
  onProgress?: (percent: number, text: string) => void
): Promise<string> {
  return uploadSingleFileWithProgress(file, customName, onProgress || (() => {}));
}

export function uploadSingleFileWithProgress(
  file: File,
  customName: string,
  onProgress: (percent: number, text: string) => void
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Gusaba Presigned URL kuri API yacu
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: customName, fileType: file.type }),
      });

      const data = await res.json();
      if (!data.success || !data.uploadUrl) {
        throw new Error(data.error || "Gushaka Presigned URL byanze.");
      }

      const { uploadUrl, publicUrl } = data;

      // 2. Kohereza vidiyo Direct kuri Cloudflare R2 ikoresheje XHR
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type || "video/mp4");

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const loadedMB = (event.loaded / (1024 * 1024)).toFixed(1);
          const totalMB = (event.total / (1024 * 1024)).toFixed(1);
          const percent = Math.round((event.loaded / event.total) * 100);

          onProgress(percent, `${loadedMB} MB / ${totalMB} MB (${percent}%)`);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(publicUrl);
        } else {
          reject(new Error(`R2 direct upload failed with status: ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error during direct upload to R2."));
      });

      xhr.send(file);
    } catch (err: any) {
      reject(err);
    }
  });
}