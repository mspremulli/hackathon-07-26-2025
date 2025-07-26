import * as fs from 'fs/promises';
import * as path from 'path';

export class FileStorage {
  private outputDir: string;
  private runNumber: number;
  
  constructor(outputDir: string = './output') {
    this.outputDir = outputDir;
    this.runNumber = this.getNextRunNumber();
  }
  
  /**
   * Get the next run number by checking existing directories
   */
  private getNextRunNumber(): number {
    try {
      const fs = require('fs');
      const dirs = fs.readdirSync(this.outputDir).filter((dir: string) => 
        dir.startsWith('run') && fs.statSync(path.join(this.outputDir, dir)).isDirectory()
      );
      
      if (dirs.length === 0) return 1;
      
      const runNumbers = dirs.map((dir: string) => {
        const match = dir.match(/^run(\d+)$/);
        return match ? parseInt(match[1]) : 0;
      });
      
      return Math.max(...runNumbers) + 1;
    } catch (error) {
      // If output directory doesn't exist, start with run1
      return 1;
    }
  }
  
  /**
   * Save data to JSON file with timestamp
   */
  async saveToFile(data: any, prefix: string): Promise<string> {
    try {
      // Ensure directory exists with run number
      const runDir = `run${this.runNumber}`;
      await fs.mkdir(path.join(this.outputDir, runDir, 'scraped-data'), { recursive: true });
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${prefix}_${timestamp}.json`;
      const filepath = path.join(this.outputDir, runDir, 'scraped-data', filename);
      
      // Save data
      await fs.writeFile(filepath, JSON.stringify(data, null, 2));
      
      console.log(`✅ Data saved to: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error('Failed to save file:', error);
      throw error;
    }
  }
  
  /**
   * Save test results
   */
  async saveTestResults(results: any, testName: string): Promise<string> {
    try {
      const runDir = `run${this.runNumber}`;
      await fs.mkdir(path.join(this.outputDir, runDir, 'test-results'), { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `test_${testName}_${timestamp}.json`;
      const filepath = path.join(this.outputDir, runDir, 'test-results', filename);
      
      const testReport = {
        testName,
        timestamp: new Date().toISOString(),
        success: results.success || true,
        summary: results.summary,
        details: results
      };
      
      await fs.writeFile(filepath, JSON.stringify(testReport, null, 2));
      
      console.log(`📊 Test results saved to: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error('Failed to save test results:', error);
      throw error;
    }
  }
  
  /**
   * List files in output directory
   */
  async listFiles(subdir: string = 'scraped-data'): Promise<string[]> {
    try {
      const runDir = `run${this.runNumber}`;
      const dirPath = path.join(this.outputDir, runDir, subdir);
      const files = await fs.readdir(dirPath);
      return files.filter(f => f.endsWith('.json'));
    } catch (error) {
      return [];
    }
  }
  
  /**
   * Read a saved file
   */
  async readFile(filename: string, subdir: string = 'scraped-data'): Promise<any> {
    try {
      const runDir = `run${this.runNumber}`;
      const filepath = path.join(this.outputDir, runDir, subdir, filename);
      const content = await fs.readFile(filepath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to read file:', error);
      throw error;
    }
  }
  
  /**
   * Get current run number
   */
  getCurrentRunNumber(): number {
    return this.runNumber;
  }
}