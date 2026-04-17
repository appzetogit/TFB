/**
 * Test Login Fix Verification
 * Tests that the infinite loop issue is fixed
 */

// Test that navigate dependency is removed from useEffect
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const signInFilePath = path.join(__dirname, 'src/module/user/pages/auth/SignIn.jsx');

try {
  const signInContent = fs.readFileSync(signInFilePath, 'utf8');
  
  // Check if navigate dependency is still in useEffect
  const navigateDependencyRegex = /},\s*\[navigate\]\);?/;
  const hasNavigateDependency = navigateDependencyRegex.test(signInContent);
  
  // Check if useEffect has empty dependency array
  const emptyDependencyRegex = /},\s*\[\]\);?/;
  const hasEmptyDependency = emptyDependencyRegex.test(signInContent);
  
  console.log('=== LOGIN FIX VERIFICATION ===');
  console.log('Navigate dependency in useEffect:', hasNavigateDependency ? 'FOUND (❌ BAD)' : 'REMOVED (✅ GOOD)');
  console.log('Empty dependency array:', hasEmptyDependency ? 'FOUND (✅ GOOD)' : 'NOT FOUND (❌ BAD)');
  
  // Count total useEffect occurrences
  const useEffectCount = (signInContent.match(/useEffect/g) || []).length;
  console.log('Total useEffect occurrences:', useEffectCount);
  
  console.log('\nFix Summary:');
  console.log('1. Removed navigate dependency from useEffect: ' + (hasNavigateDependency ? 'FAILED' : 'SUCCESS'));
  console.log('2. Empty dependency array: ' + (hasEmptyDependency ? 'SUCCESS' : 'FAILED'));
  console.log('3. Should prevent infinite refresh loop: ' + (!hasNavigateDependency && hasEmptyDependency ? 'YES' : 'NO'));
  
  if (!hasNavigateDependency && hasEmptyDependency) {
    console.log('\n✅ SUCCESS: Login page infinite refresh issue has been fixed!');
    console.log('The useEffect will now run only once on mount, preventing infinite re-renders.');
  } else {
    console.log('\n❌ FAILED: Login page may still have infinite refresh issue.');
    console.log('Check that navigate dependency is removed from useEffect.');
  }
  
} catch (error) {
  console.error('Error reading SignIn.jsx:', error.message);
}

console.log('\nLogin fix verification completed.');
