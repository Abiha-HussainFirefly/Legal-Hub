type OptimizeProfileImageOptions = {
  maxWidth: number;
  maxHeight: number;
  targetBytes: number;
  maxSourceBytes?: number;
};

const DEFAULT_MAX_SOURCE_BYTES = 4 * 1024 * 1024;
const OUTPUT_TYPE = "image/webp";
const QUALITY_STEPS = [0.82, 0.72, 0.62, 0.52, 0.42];

function estimateDataUrlBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

function fitWithinBounds(width: number, height: number, maxWidth: number, maxHeight: number) {
  const scale = Math.min(1, maxWidth / width, maxHeight / height);

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to process the selected image."));
    };

    image.src = objectUrl;
  });
}

export async function optimizeProfileImage(
  file: File,
  options: OptimizeProfileImageOptions,
) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  if (file.size > (options.maxSourceBytes ?? DEFAULT_MAX_SOURCE_BYTES)) {
    throw new Error("Please choose an image smaller than 4MB.");
  }

  const image = await loadImageFromFile(file);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Image processing is not supported in this browser.");
  }

  let { width, height } = fitWithinBounds(
    image.naturalWidth,
    image.naturalHeight,
    options.maxWidth,
    options.maxHeight,
  );
  let bestResult = "";
  let bestSize = Number.POSITIVE_INFINITY;

  for (let resizeAttempt = 0; resizeAttempt < 6; resizeAttempt += 1) {
    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    for (const quality of QUALITY_STEPS) {
      const result = canvas.toDataURL(OUTPUT_TYPE, quality);
      const size = estimateDataUrlBytes(result);

      if (size < bestSize) {
        bestResult = result;
        bestSize = size;
      }

      if (size <= options.targetBytes) {
        return result;
      }
    }

    width = Math.max(160, Math.round(width * 0.85));
    height = Math.max(160, Math.round(height * 0.85));
  }

  if (bestResult) {
    return bestResult;
  }

  throw new Error("Failed to optimize the selected image.");
}
