const { createClient } = require('@supabase/supabase-js')

// Replace these with your actual Supabase URL and anon key from the dashboard
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function listTables() {
  const { data, error } = await supabase
    .rpc('list_tables', {
      sql_query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE';
      `
    })
  
  if (error) {
    console.log('Error:', error.message)
    return
  }

  console.log('Tables in public schema:', data)
}

// First create the function to list tables
async function createFunction() {
  const { data, error } = await supabase
    .rpc('create_list_tables_function', {
      sql: `
        CREATE OR REPLACE FUNCTION get_tables_in_public_schema()
        RETURNS TABLE (table_name text, table_type text) 
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            tables.table_name::text,
            tables.table_type::text
          FROM information_schema.tables tables
          WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE';
        END;
        $$;
      `
    })

  if (error) {
    console.log('Error creating function:', error.message)
    return
  }

  console.log('Function created successfully')
  await listTables()
}

createFunction()

listTables() 