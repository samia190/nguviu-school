// processors/index.js
// Export all media processors

export * from "./imageProcessor.js";
export * from "./videoProcessor.js";

import imageProcessor from "./imageProcessor.js";
import videoProcessor from "./videoProcessor.js";

export { imageProcessor, videoProcessor };
