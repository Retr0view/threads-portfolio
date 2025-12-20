const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  // Get the last commit date in ISO format
  const lastCommitDate = execSync('git log -1 --format=%ci', { encoding: 'utf-8' }).trim();
  const date = new Date(lastCommitDate);
  
  // Format as YYYY-MM-DD
  const formattedDate = date.toISOString().split('T')[0];
  
  // Write to a JSON file
  const outputPath = path.join(__dirname, '..', 'lib', 'last-commit-date.json');
  const outputDir = path.dirname(outputPath);
  
  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify({ date: formattedDate }, null, 2));
  console.log(`Last commit date: ${formattedDate}`);
} catch (error) {
  console.error('Error getting last commit date:', error.message);
  // Fallback to current date if git command fails
  const fallbackDate = new Date().toISOString().split('T')[0];
  const outputPath = path.join(__dirname, '..', 'lib', 'last-commit-date.json');
  const outputDir = path.dirname(outputPath);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify({ date: fallbackDate }, null, 2));
}









