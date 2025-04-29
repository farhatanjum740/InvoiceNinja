import { createClient } from '@supabase/supabase-js';

// Get environment variables from file
async function loadEnvVars() {
  const { readFile } = await import('fs/promises');
  try {
    const envContent = await readFile('.env', 'utf-8');
    const envVars = envContent.split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .reduce((acc, line) => {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=');
        if (key && value) {
          acc[key.trim()] = value.trim().replace(/^["'](.*)["']$/, '$1');
        }
        return acc;
      }, {} as Record<string, string>);
    return envVars;
  } catch (err) {
    console.error('Failed to load .env file:', err);
    return {};
  }
}

async function main() {
  // Load environment variables from .env file
  const envVars = await loadEnvVars();
  
  // Use environment variables or loaded values
  const supabaseUrl = process.env.SUPABASE_URL || envVars.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || envVars.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('Querying products...');
  const { data, error } = await supabase
    .from('products')
    .select('*');
  
  if (error) {
    console.error('Error querying products:', error);
    process.exit(1);
  }
  
  console.log(`Found ${data.length} products:`);
  console.table(data);
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});