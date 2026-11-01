import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./anatomy/kit/iso-kit.mjs";
import { kitScript } from "./anatomy/scripts/inline-kit.mjs";

export { k, kitScript };
const HERE = dirname(fileURLToPath(import.meta.url));
export const OUT = join(HERE, "..", "assets");

// Portfolio palette: ultramarine ink with a signal-orange accent.
const PALETTE = `<style>
html,body{background:transparent!important;margin:0;color-scheme:normal!important}
.iso[data-theme]{
 --anatomy-page:transparent;--anatomy-card:#0a0c2e;--anatomy-paper:#0a0c2e;--anatomy-face:#141858;--anatomy-top:#1b2070;
 --anatomy-text:#eceeff;--anatomy-strong:#ffffff;--anatomy-muted:#c4caff;
 --anatomy-shade-0:#0c1038;--anatomy-shade-1:#10154a;--anatomy-shade-2:#151a5c;--anatomy-shade-3:#1a2070;
 --anatomy-lit-top:#2a2f9a;--anatomy-lit-shade:#1c2278;
 --anatomy-hi:#e6e9ff;--anatomy-mid:#6c76e6;--anatomy-lo:#3b43a8;--anatomy-faint:#232a80;--anatomy-lit:#ff6a2b;
 --anatomy-halo:#02031a;--anatomy-halo-opacity:.9;--anatomy-dot:#ffffff;
 --anatomy-red:#ff6a2b;--anatomy-green:#3df5b0;--anatomy-blue:#8a98ff;
}
</style>
<script>
(function(){function send(){try{parent.postMessage({figHeight:(function(){var m=0;for(var c=document.body.children,i=0;i<c.length;i++){if(c[i].tagName==="SCRIPT")continue;m=Math.max(m,c[i].getBoundingClientRect().bottom+scrollY)}return Math.ceil(m+28)})(),figName:location.pathname},"*")}catch(e){}}
addEventListener("load",function(){send();setTimeout(send,300)});addEventListener("resize",send)})();
</script>`;

export function writePage(name, { title, body, script }) {
  mkdirSync(OUT, { recursive: true });
  let html = k.pageHtml({ title, theme: "dark", body, script: kitScript() + script, width: 640 });
  html = html.replace("</head>", PALETTE + "</head>");
  writeFileSync(join(OUT, name), html);
  console.log("wrote", name, (html.length / 1024).toFixed(0) + "KB");
}
