/**
 * Junta os 3 vídeos webm gerados pelo Playwright em um MP4 final.
 *
 * - Concatena na ordem: 1-corretor → 2-cliente → 3-corretor revisita
 * - Adiciona fade in/out
 * - Otimiza pra web (faststart) e remove áudio
 * - Output: public/demo.mp4
 */

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname);
const RAW_DIR = join(ROOT, "output", "raw");
const OUT = resolve(ROOT, "..", "public", "demo.mp4");
const TMP = join(ROOT, "output", "tmp");
const LIST_FILE = join(TMP, "list.txt");

function sh(cmd, args) {
  console.log("$", cmd, args.join(" "));
  execFileSync(cmd, args, { stdio: "inherit" });
}

function findVideos() {
  // Coleta todos webm + ordena por mtime (ordem cronológica de gravação).
  // Playwright nomeia por hash, então alphabetical sort não preserva ordem
  // dos testes. Também filtra clips muito curtos (popups do window.open).
  const MIN_SIZE = 250_000; // ~3s @ 1080p webm — descarta popups vazios
  const all = [];
  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".webm")) {
        const stat = statSync(full);
        if (stat.size < MIN_SIZE) {
          console.log(
            `[skip] ${entry.name} (${stat.size} bytes — provavelmente popup)`,
          );
          continue;
        }
        all.push({ path: full, mtime: stat.mtimeMs, size: stat.size });
      }
    }
  };
  walk(RAW_DIR);
  all.sort((a, b) => a.mtime - b.mtime);
  return all.map((v) => v.path);
}

function main() {
  const videos = findVideos();
  if (videos.length === 0) {
    console.error("Nenhum .webm encontrado em", RAW_DIR);
    console.error('Rode "pnpm demo:record" antes.');
    process.exit(1);
  }

  console.log(`Encontrei ${videos.length} clip(s):`);
  videos.forEach((v, i) => console.log(`  [${i + 1}] ${v}`));

  // Cria pasta tmp e arquivo de lista pro concat demuxer
  rmSync(TMP, { recursive: true, force: true });
  execFileSync("mkdir", ["-p", TMP]);

  // Re-encode cada clip pra MP4 antes de concatenar — webm direto não
  // concatena bem entre Chromium runs (timestamps quebram)
  const reencoded = videos.map((src, i) => {
    const dst = join(TMP, `clip-${String(i + 1).padStart(2, "0")}.mp4`);
    sh("ffmpeg", [
      "-y",
      "-i",
      src,
      "-vf",
      "scale=1920:1080:flags=lanczos,fps=30",
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-crf",
      "22",
      "-pix_fmt",
      "yuv420p",
      "-an",
      dst,
    ]);
    return dst;
  });

  // Lista pro concat demuxer
  writeFileSync(
    LIST_FILE,
    reencoded.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join("\n"),
    "utf-8",
  );

  // Concatena
  const concatTmp = join(TMP, "concat.mp4");
  sh("ffmpeg", [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    LIST_FILE,
    "-c",
    "copy",
    concatTmp,
  ]);

  // Pega duração do concat pra calcular fade-out
  const durStr = execFileSync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    concatTmp,
  ])
    .toString()
    .trim();
  const totalDur = parseFloat(durStr);
  const fadeOutStart = Math.max(0, totalDur - 0.6).toFixed(2);

  // Final: fade in 0.5s, fade out 0.6s, faststart
  sh("ffmpeg", [
    "-y",
    "-i",
    concatTmp,
    "-vf",
    `fade=t=in:st=0:d=0.5,fade=t=out:st=${fadeOutStart}:d=0.6`,
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "24",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-an",
    OUT,
  ]);

  console.log("\n✓ Vídeo final:", OUT);

  // Cleanup
  rmSync(TMP, { recursive: true, force: true });
}

main();
