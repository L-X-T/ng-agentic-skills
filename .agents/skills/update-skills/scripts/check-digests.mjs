import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

function listFiles(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      return listFiles(join(directory, entry.name), relativePath);
    }
    return [relativePath];
  });
}

try {
  const root = resolve(process.argv[2] ?? '.');
  const sources = JSON.parse(readFileSync(join(root, 'skill-sources.json'), 'utf8'));
  const results = sources.map(({ skill, localSha256 }) => {
    const directory = join(root, '.agents/skills', skill);
    if (!existsSync(directory)) {
      return { skill, status: 'missing', recordedSha256: localSha256 };
    }
    const digest = createHash('sha256');
    for (const path of listFiles(directory).sort()) {
      digest
        .update(path)
        .update('\0')
        .update(readFileSync(join(directory, path)))
        .update('\0');
    }
    const currentSha256 = digest.digest('hex');
    return {
      skill,
      status: currentSha256 === localSha256 ? 'matches' : 'changed',
      recordedSha256: localSha256,
      currentSha256,
    };
  });
  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
  process.exitCode = results.some(({ status }) => status !== 'matches') ? 1 : 0;
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 2;
}
