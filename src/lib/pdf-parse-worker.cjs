const path = require("path");

console.log = (...args) => process.stderr.write(`${args.join(" ")}\n`);
console.warn = (...args) => process.stderr.write(`${args.join(" ")}\n`);
console.error = (...args) => process.stderr.write(`${args.join(" ")}\n`);

async function readStdin() {
  const chunks = [];

  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

async function parsePdf(buffer, version) {
  if (version === "default") {
    const pdf = require("pdf-parse");
    const parsed = await pdf(buffer);

    return parsed.text || "";
  }

  const pdfjsPath = path.join(
    process.cwd(),
    "node_modules",
    "pdf-parse",
    "lib",
    "pdf.js",
    version,
    "build",
    "pdf.js"
  );
  const pdfjs = require(pdfjsPath);

  pdfjs.disableWorker = true;
  const document = await pdfjs.getDocument(buffer);
  const pageTexts = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const textContent = await page.getTextContent({
      normalizeWhitespace: false,
      disableCombineTextItems: false
    });
    let lastY;
    let text = "";

    for (const item of textContent.items) {
      const y = item.transform && item.transform[5];

      if (lastY === undefined || y === lastY) {
        text += item.str || "";
      } else {
        text += `\n${item.str || ""}`;
      }

      lastY = y;
    }

    pageTexts.push(text);
  }

  return pageTexts.join("\n\n");
}

(async () => {
  const version = process.argv[2];
  const filePath = process.argv[3];
  const buffer = filePath ? require("fs").readFileSync(filePath) : await readStdin();

  if (version === "fallback-all") {
    const attempts = [
      { parser: "pdf-parse:default", version: "default" },
      { parser: "pdf.js-bundled:v2.0.550", version: "v2.0.550" },
      { parser: "pdf.js-bundled:v1.10.88", version: "v1.10.88" },
      { parser: "pdf.js-bundled:v1.9.426", version: "v1.9.426" }
    ];
    const errors = [];

    for (const attempt of attempts) {
      try {
        if (attempt.version === "default") {
          clearPdfParseCache();
        } else {
          clearBundledPdfJsCache();
        }
        const text = (await parsePdf(Buffer.from(buffer), attempt.version)).trim();

        if (text.length > 0) {
          process.stdout.write(
            JSON.stringify({
              text,
              parser: attempt.parser,
              warnings: errors.length > 0 ? [`主解析器失败，已使用备用解析器：${attempt.parser}`] : [],
              errors
            })
          );
          return;
        }

        errors.push(`${attempt.parser}: 未提取到文字层`);
      } catch (error) {
        errors.push(`${attempt.parser}: ${formatError(error)}`);
      }
    }

    process.stdout.write(JSON.stringify({ text: "", parser: null, warnings: [], errors }));
    return;
  }

  const text = await parsePdf(Buffer.from(buffer), version);

  process.stdout.write(JSON.stringify({ text }));
})().catch((error) => {
  process.stdout.write(
    JSON.stringify({
      error: {
        name: error && error.name ? error.name : "Error",
        message: error && error.message ? error.message : String(error)
      }
    })
  );
  process.exitCode = 1;
});

function clearPdfParseCache() {
  for (const cacheKey of Object.keys(require.cache)) {
    const normalizedKey = cacheKey.replace(/\\/g, "/");

    if (normalizedKey.includes("/node_modules/pdf-parse/")) {
      delete require.cache[cacheKey];
    }
  }
}

function clearBundledPdfJsCache() {
  for (const cacheKey of Object.keys(require.cache)) {
    const normalizedKey = cacheKey.replace(/\\/g, "/");

    if (normalizedKey.includes("/node_modules/pdf-parse/lib/pdf.js/")) {
      delete require.cache[cacheKey];
    }
  }
}

function formatError(error) {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  return String(error);
}
