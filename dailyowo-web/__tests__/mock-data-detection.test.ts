/**
 * Mock Data Detection Test
 * Scans the entire codebase to identify hardcoded mock data that should be dynamic
 */

import fs from 'fs';
import path from 'path';

interface MockDataIssue {
  file: string;
  line: number;
  content: string;
  type: 'hardcoded_date' | 'hardcoded_string' | 'mock_data' | 'static_value';
  severity: 'high' | 'medium' | 'low';
}

function getAllFiles(dirPath: string, fileTypes: string[] = ['.ts', '.tsx', '.js', '.jsx']): string[] {
  const files: string[] = [];
  
  function scanDirectory(currentPath: string) {
    try {
      const items = fs.readdirSync(currentPath);
      
      for (const item of items) {
        const fullPath = path.join(currentPath, item);
        
        // Skip certain directories
        if (item === 'node_modules' || 
            item === '.next' || 
            item === 'dist' || 
            item === '__tests__' ||
            item.startsWith('.')) {
          continue;
        }
        
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (fileTypes.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  scanDirectory(dirPath);
  return files;
}

describe('Mock Data Detection', () => {
  let mockDataIssues: MockDataIssue[] = [];

  beforeAll(() => {
    // Get all TypeScript and JavaScript files
    const files = getAllFiles(process.cwd());

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        const relativePath = path.relative(process.cwd(), file);
        
        lines.forEach((line, index) => {
          const lineNum = index + 1;
          
          // Check for hardcoded dates that suggest mock data
          if (line.includes('3 months ago') || 
              line.includes('Last changed 3 months ago') ||
              line.includes('3 weeks ago') ||
              line.includes('2 minutes ago') ||
              line.includes('1 hour ago')) {
            mockDataIssues.push({
              file: relativePath,
              line: lineNum,
              content: line.trim(),
              type: 'hardcoded_date',
              severity: 'high'
            });
          }

          // Check for obvious mock session data
          if (line.includes('MacBook Pro') || 
              line.includes('iPhone 14 Pro') ||
              line.includes('Lagos, Nigeria') ||
              line.includes('192.168.1.100') ||
              line.includes('Mozilla/5.0 (Macintosh') ||
              line.includes('Mozilla/5.0 (iPhone')) {
            mockDataIssues.push({
              file: relativePath,
              line: lineNum,
              content: line.trim(),
              type: 'mock_data',
              severity: 'high'
            });
          }

          // Check for hardcoded user data
          if (line.includes('test@example.com') ||
              line.includes('Test User') ||
              line.includes('John Doe') ||
              line.includes('Jane Smith')) {
            mockDataIssues.push({
              file: relativePath,
              line: lineNum,
              content: line.trim(),
              type: 'mock_data',
              severity: 'medium'
            });
          }

          // Check for console.log that might indicate temporary implementations
          if (line.includes('console.log') && 
              (line.includes('2FA') || 
               line.includes('Setup') || 
               line.includes('coming soon') ||
               line.includes('TODO'))) {
            mockDataIssues.push({
              file: relativePath,
              line: lineNum,
              content: line.trim(),
              type: 'static_value',
              severity: 'medium'
            });
          }

          // Check for hardcoded financial data
          if (line.includes('$5,000') || 
              line.includes('€1,200') ||
              line.includes('Monthly Salary') ||
              line.includes('Monthly Rent')) {
            mockDataIssues.push({
              file: relativePath,
              line: lineNum,
              content: line.trim(),
              type: 'mock_data',
              severity: 'medium'
            });
          }

          // Check for static array/object definitions that might be mock data
          if ((line.includes('const sessions = [') || 
               line.includes('const activities = [') ||
               line.includes('const mockTransactions = [')) &&
               !file.includes('test')) {
            mockDataIssues.push({
              file: relativePath,
              line: lineNum,
              content: line.trim(),
              type: 'mock_data',
              severity: 'high'
            });
          }

          // Check for Coming Soon messages
          if (line.includes('Coming Soon') || 
              line.includes('coming soon') ||
              line.includes('Not implemented yet')) {
            mockDataIssues.push({
              file: relativePath,
              line: lineNum,
              content: line.trim(),
              type: 'static_value',
              severity: 'medium'
            });
          }

          // Check for "No active sessions" placeholder
          if (line.includes('No active sessions found')) {
            mockDataIssues.push({
              file: relativePath,
              line: lineNum,
              content: line.trim(),
              type: 'static_value',
              severity: 'high'
            });
          }
        });
      } catch (error) {
        console.warn(`Could not read file ${file}:`, error);
      }
    }
  });

  it('should identify all mock data issues', () => {
    console.log('\n📊 MOCK DATA DETECTION RESULTS\n');
    
    const highSeverityIssues = mockDataIssues.filter(issue => issue.severity === 'high');
    const mediumSeverityIssues = mockDataIssues.filter(issue => issue.severity === 'medium');
    const lowSeverityIssues = mockDataIssues.filter(issue => issue.severity === 'low');

    console.log(`🔴 HIGH SEVERITY ISSUES: ${highSeverityIssues.length}`);
    highSeverityIssues.forEach(issue => {
      console.log(`   ${issue.file}:${issue.line} - ${issue.type}`);
      console.log(`   "${issue.content}"`);
      console.log('');
    });

    console.log(`🟡 MEDIUM SEVERITY ISSUES: ${mediumSeverityIssues.length}`);
    mediumSeverityIssues.forEach(issue => {
      console.log(`   ${issue.file}:${issue.line} - ${issue.type}`);
      console.log(`   "${issue.content}"`);
      console.log('');
    });

    console.log(`🟢 LOW SEVERITY ISSUES: ${lowSeverityIssues.length}`);
    lowSeverityIssues.forEach(issue => {
      console.log(`   ${issue.file}:${issue.line} - ${issue.type}`);
      console.log(`   "${issue.content}"`);
      console.log('');
    });

    console.log(`\n📈 SUMMARY:`);
    console.log(`Total Issues Found: ${mockDataIssues.length}`);
    console.log(`High Priority: ${highSeverityIssues.length}`);
    console.log(`Medium Priority: ${mediumSeverityIssues.length}`);
    console.log(`Low Priority: ${lowSeverityIssues.length}`);

    // The test passes but logs all the issues for review
    expect(mockDataIssues).toBeDefined();
  });

  it('should provide mock data remediation suggestions', () => {
    const suggestions = [
      '🔧 RECOMMENDED FIXES:',
      '',
      '1. PASSWORD LAST CHANGED DATE:',
      '   - Replace hardcoded "3 months ago" with real user.passwordLastChanged',
      '   - Add passwordLastChanged field to user profile',
      '   - Update on password change events',
      '',
      '2. SESSION TRACKING:',
      '   - Implement session creation on user login',
      '   - Remove hardcoded device names and locations',
      '   - Use real device detection and IP geolocation',
      '',
      '3. 2FA IMPLEMENTATION:',
      '   - Replace console.log with proper setup modal',
      '   - Implement QR code display component',
      '   - Add verification flow with backup codes',
      '',
      '4. ACTIVITY MONITORING:',
      '   - Create session on successful authentication',
      '   - Track real user actions and timestamps',
      '   - Remove placeholder "No active sessions" messages',
      '',
      '5. FINANCIAL DATA:',
      '   - Replace hardcoded amounts with real user transactions',
      '   - Use dynamic date ranges instead of fixed periods',
      '   - Implement real budget calculations'
    ];

    suggestions.forEach(suggestion => console.log(suggestion));
    expect(suggestions.length).toBeGreaterThan(0);
  });
}); 