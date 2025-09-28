import fs from "fs";
import path from "path";

export function loadJsonData<T>(
  filePath: string,
  defaultValue: T
): T {
  const fullPath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    return defaultValue;
  }

  try {
    const fileContent = fs.readFileSync(fullPath, "utf-8");
    return JSON.parse(fileContent) as T;
  } catch (error) {
    console.error(`Error loading JSON file ${fullPath}:`, error);
    return defaultValue;
  }
}

export function loadDataFile<T>(
  directory: string,
  filename: string,
  defaultValue: T
): T {
  const filePath = path.join(process.cwd(), directory, filename);
  return loadJsonData(filePath, defaultValue);
}