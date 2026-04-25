import {
  env,
  FeatureExtractionPipeline,
  pipeline,
} from "@huggingface/transformers";

const MODEL = "Xenova/all-MiniLM-L6-v2";

env.cacheDir = "./models";
env.allowLocalModels = true;
env.allowRemoteModels = true;

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", MODEL, {
      dtype: "fp32",
      device: "dml",
    });
  }
  return extractorPromise;
}

export async function embed(text: string): Promise<Float32Array> {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return new Float32Array(output.data as Float32Array);
}
