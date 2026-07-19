import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const logDir = 'C:/Users/Manas/.gemini/antigravity-ide/brain/a9928b2a-df80-4ae3-a63f-1cd8d4334acd/.system_generated/tasks';

try {
  const files = readdirSync(logDir);
  console.log(`Found ${files.length} log files.`);

  for (const file of files) {
    if (!file.endsWith('.log')) continue;
    const filePath = join(logDir, file);
    try {
      const content = readFileSync(filePath, 'utf8');
      if (content.includes('CLM114511') || content.includes('calculateBasicIncome')) {
        console.log(`\n=== Found Match in ${file} ===`);
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('CLM114511') || line.includes('INCOME') || line.includes('sessionTeam') || line.includes('Session changed')) {
            console.log(`${idx + 1}: ${line}`);
          }
        });
      }
    } catch(e) {
      // ignore
    }
  }
} catch (err) {
  console.error('Error reading log directory:', err);
}
