import { chromium } from "playwright";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function runMobileAudit() {
  console.log("====================================================");
  console.log("   DETAILPRO SAAS — AUDITORIA DE NAVEGAÇÃO MOBILE   ");
  console.log("   Resolução: 375x812 (iPhone 13 / Viewport Mobile)");
  console.log("====================================================\n");

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
  });

  const page = await context.newPage();

  const routes = [
    "/dashboard",
    "/patio",
    "/boxes",
    "/vistoria",
    "/orcamentos",
    "/os",
    "/os/nova",
    "/clientes",
    "/servicos",
    "/financeiro",
    "/comissoes",
    "/estoque",
    "/crm",
    "/funcionarios",
    "/configuracoes",
  ];

  const results: any[] = [];

  for (const route of routes) {
    const url = `http://localhost:3333${route}`;
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForTimeout(1000);

      const audit = await page.evaluate(() => {
        const winWidth = window.innerWidth;
        const docScrollWidth = document.documentElement.scrollWidth;
        const bodyScrollWidth = document.body.scrollWidth;
        const maxScroll = Math.max(docScrollWidth, bodyScrollWidth);
        const hasHorizontalScroll = maxScroll > winWidth;

        // Identifica elementos que ultrapassam a largura da viewport (outlayers)
        const outlayers: any[] = [];
        const allElements = Array.from(document.querySelectorAll("*"));

        for (const el of allElements) {
          // Se o elemento estiver contido dentro de um container que intencionalmente possui overflow-x-auto, não é um outlayer descontrolado
          if (el.closest('.overflow-x-auto, [data-scroll-container]')) {
            continue;
          }

          const rect = el.getBoundingClientRect();
          // Elemento extrapolando à direita ou à esquerda
          if (rect.right > winWidth + 2 || rect.left < -2) {
            // Ignora scripts, styles, meta
            if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(el.tagName)) continue;
            // Se for display none ou sem dimensões
            if (rect.width === 0 && rect.height === 0) continue;

            outlayers.push({
              tagName: el.tagName.toLowerCase(),
              className: (el.className || "").toString().slice(0, 100),
              right: Math.round(rect.right),
              left: Math.round(rect.left),
              width: Math.round(rect.width),
              textSample: (el.textContent || "").trim().slice(0, 30),
            });
          }
        }

        return {
          winWidth,
          maxScroll,
          hasHorizontalScroll,
          outlayerCount: outlayers.length,
          outlayers: outlayers.slice(0, 10), // Top 10 elementos que vazam
        };
      });

      results.push({ route, ...audit });

      const status = audit.hasHorizontalScroll ? "[FAIL ❌]" : "[PASS ✅]";
      console.log(
        `${status} ${route.padEnd(16)} | ScrollWidth: ${audit.maxScroll}px (Max: ${
          audit.winWidth
        }px) | Outlayers: ${audit.outlayerCount}`
      );

      if (audit.outlayers.length > 0) {
        audit.outlayers.forEach((o, i) => {
          console.log(
            `    └─ [${i + 1}] <${o.tagName}> w:${o.width}px right:${
              o.right
            }px | class: "${o.className}" | txt: "${o.textSample}"`
          );
        });
      }
    } catch (err: any) {
      console.log(`[ERR  ⚠️] ${route} -> ${err.message}`);
    }
  }

  await browser.close();

  const totalFailed = results.filter((r) => r.hasHorizontalScroll || r.outlayerCount > 0).length;
  console.log("\n====================================================");
  console.log(`RESULTADO AUDITORIA MOBILE: ${results.length - totalFailed}/${results.length} TELAS OK`);
  console.log("====================================================");
}

runMobileAudit().catch(console.error);
