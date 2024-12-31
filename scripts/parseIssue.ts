import { readFileSync, writeFileSync } from 'fs';
import { load, dump } from 'js-yaml';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ToolData {
  name: string;
  description: string;
  toolingTypes: string[];
  languages: string[];
  maintainers: { name?: string; username: string; platform: string }[];
  license: string;
  source: string;
  homepage?: string;
  supportedDialects: { draft: string[] };
  dependsOnValidators?: string[];
  toolingListingNotes?: string;
  landscape?: { logo: string };
  lastUpdated: string;
}

function parseIssueBody(issueBody: string): ToolData {
  const toolData: Partial<ToolData> = {
    maintainers: [],
  };
  const lines = issueBody.split('\n');

  for (const line of lines) {
    const [key, ...valueParts] = line.split(':');
    const value = valueParts.join(':').trim();

    switch (key.trim()) {
      case 'Tool Name':
        toolData.name = value;
        break;
      case 'Tool Description':
        toolData.description = value;
        break;
      case 'Tooling Types':
        toolData.toolingTypes = value.split(',').map((x) => x.trim());
        break;
      case 'Languages':
        toolData.languages = value.split(',').map((x) => x.trim());
        break;
      case 'Maintainers':
        toolData.maintainers = value.split(',').map((maintainer) => ({
          username: maintainer.trim(),
          platform: 'github',
        }));
        break;
      case 'License':
        toolData.license = value;
        break;
      case 'Source Repository URL':
        toolData.source = value;
        break;
      case 'Homepage URL':
        toolData.homepage = value;
        break;
      case 'Supported Dialects':
        toolData.supportedDialects = {
          draft: value.split(',').map((x) => x.trim()),
        };
        break;
      case 'Dependencies on Validators':
        toolData.dependsOnValidators = value.split(',').map((x) => x.trim());
        break;
      case 'Tooling Listing Notes':
        toolData.toolingListingNotes = value;
        break;
    }
  }

  // Add current date as lastUpdated
  toolData.lastUpdated = new Date().toISOString().split('T')[0];

  return toolData as ToolData;
}

function updateToolingData(toolData: ToolData): void {
  const filePath = join(__dirname, '..', 'data', 'tooling-data.yaml');
  const data = load(readFileSync(filePath, 'utf8')) as any[];
  data.push(toolData);
  writeFileSync(filePath, dump(data, { lineWidth: -1 }));
}

// Get issue body from command line argument
const issueBody = process.argv[2];
if (!issueBody) {
  console.error('Please provide the issue body as an argument');
  process.exit(1);
}

try {
  const toolData = parseIssueBody(issueBody);
  updateToolingData(toolData);
  console.log('Successfully added new tool to tooling-data.yaml');
} catch (error) {
  console.error('Error processing tool data:', error);
  process.exit(1);
}
