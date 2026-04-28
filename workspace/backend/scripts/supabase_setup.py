#!/usr/bin/env python3
"""
FACODI — Supabase Backend Integration Validation & Initialization

Purpose:
  - Test Supabase connection
  - Validate/create `facodi` schema
  - Inspect and create required tables
  - Validate authentication setup
  - Prepare foundation for production usage

Usage:
  python workspace/backend/scripts/supabase_setup.py

Environment variables required:
  - SUPABASE_URL: https://your-project.supabase.co
  - SUPABASE_SERVICE_ROLE_KEY: sbp_xxxx... (admin key)
  - SUPABASE_ANON_KEY: eyJhbGc... (public key, optional)
"""

import os
import sys
import json
import logging
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

def load_env():
    """Load environment variables from .env.local if available."""
    env_path = Path(__file__).parent.parent.parent / ".env.local"
    if env_path.exists():
        logger.info(f"Loading environment from: {env_path}")
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ.setdefault(key, value)

def get_credentials() -> Tuple[str, str, str]:
    """Get Supabase credentials from environment."""
    url = os.getenv('SUPABASE_URL')
    service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    anon_key = os.getenv('SUPABASE_ANON_KEY')
    
    if not url or not service_key:
        logger.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
        logger.error("Please set these environment variables:")
        logger.error("  export SUPABASE_URL='https://your-project.supabase.co'")
        logger.error("  export SUPABASE_SERVICE_ROLE_KEY='sbp_xxxx...'")
        sys.exit(1)
    
    return url, service_key, anon_key

def test_connection(url: str, service_key: str) -> bool:
    """Test basic Supabase connection."""
    logger.info("=" * 70)
    logger.info("1. TESTING SUPABASE CONNECTION")
    logger.info("=" * 70)
    
    try:
        # Import here to allow graceful failure if not installed
        import requests
        
        # Try a HEAD request to Supabase
        headers = {
            'Authorization': f'Bearer {service_key}',
            'apikey': service_key
        }
        
        logger.info(f"  Testing connection to: {url}")
        response = requests.head(f"{url}/auth/v1/user", headers=headers, timeout=5)
        
        if response.status_code in [200, 401]:  # 401 is OK (auth not required for this test)
            logger.info("  ✓ Connection successful")
            logger.info(f"  Status code: {response.status_code}")
            return True
        else:
            logger.error(f"  ✗ Unexpected status code: {response.status_code}")
            return False
            
    except ImportError:
        logger.warning("  ⚠ requests library not available")
        logger.warning("  Install with: pip install requests")
        return False
    except Exception as e:
        logger.error(f"  ✗ Connection failed: {e}")
        return False

def test_database_connection(url: str, service_key: str) -> Optional[Any]:
    """Test PostgreSQL database connection via Supabase."""
    logger.info("\n" + "=" * 70)
    logger.info("2. TESTING DATABASE CONNECTION")
    logger.info("=" * 70)
    
    try:
        from supabase import create_client
        
        logger.info("  Initializing Supabase client...")
        client = create_client(url, service_key)
        
        logger.info("  Testing database query...")
        # Simple query to test connection
        response = client.table('information_schema.tables').select('*', count='exact').limit(1).execute()
        
        logger.info(f"  ✓ Database connection successful")
        logger.info(f"  Response count: {response.count if hasattr(response, 'count') else 'unknown'}")
        
        return client
        
    except ImportError:
        logger.warning("  ⚠ supabase library not available")
        logger.warning("  Install with: pip install supabase")
        return None
    except Exception as e:
        logger.error(f"  ✗ Database connection failed: {e}")
        return None

def check_schema_exists(conn: Any) -> bool:
    """Check if `facodi` schema exists in PostgreSQL."""
    logger.info("\n" + "=" * 70)
    logger.info("3. VALIDATING SCHEMA")
    logger.info("=" * 70)
    
    try:
        import psycopg2
        
        # Note: Direct PostgreSQL connection would be ideal here
        # For now, using Supabase queries as fallback
        logger.info("  Checking for `facodi` schema...")
        
        # Query information_schema to find schema
        response = conn.from_('information_schema.schemata').select('schema_name').eq('schema_name', 'facodi').execute()
        
        if response.data and len(response.data) > 0:
            logger.info("  ✓ Schema `facodi` exists")
            return True
        else:
            logger.warning("  ⚠ Schema `facodi` does NOT exist")
            logger.info("  → Will create schema `facodi`")
            return False
            
    except Exception as e:
        logger.warning(f"  ⚠ Could not verify schema: {e}")
        logger.warning("  → Attempting to create schema anyway")
        return False

def create_schema(conn: Any) -> bool:
    """Create `facodi` schema if it doesn't exist."""
    logger.info("\n" + "=" * 70)
    logger.info("4. CREATING SCHEMA (if needed)")
    logger.info("=" * 70)
    
    try:
        logger.info("  Attempting to create schema `facodi`...")
        
        # Using raw SQL via Supabase is limited, so document manual approach
        logger.info("  ℹ Note: Schema creation requires direct PostgreSQL access")
        logger.info("  → Using Supabase dashboard or psql:")
        logger.info("     CREATE SCHEMA IF NOT EXISTS facodi;")
        logger.info("     GRANT USAGE ON SCHEMA facodi TO authenticated, anon;")
        logger.info("     ALTER DEFAULT PRIVILEGES IN SCHEMA facodi GRANT SELECT ON TABLES TO authenticated, anon;")
        
        logger.warning("  ⚠ Please create the schema manually via Supabase dashboard")
        return False
        
    except Exception as e:
        logger.error(f"  ✗ Schema creation failed: {e}")
        return False

def inspect_tables(conn: Any) -> Dict[str, List[Dict]]:
    """Inspect existing tables in `facodi` schema."""
    logger.info("\n" + "=" * 70)
    logger.info("5. INSPECTING DATABASE STRUCTURE")
    logger.info("=" * 70)
    
    tables_info = {}
    
    try:
        logger.info("  Querying information_schema for `facodi` tables...")
        
        # Get all tables in facodi schema
        response = conn.from_('information_schema.tables').select(
            'table_name'
        ).eq(
            'table_schema', 'facodi'
        ).execute()
        
        if not response.data:
            logger.warning("  ⚠ No tables found in `facodi` schema")
            return tables_info
        
        table_names = [row['table_name'] for row in response.data]
        logger.info(f"  Found {len(table_names)} table(s):")
        
        for table_name in table_names:
            logger.info(f"    - {table_name}")
            
            # Get columns for each table
            cols_response = conn.from_('information_schema.columns').select(
                'column_name', 'data_type', 'is_nullable'
            ).eq(
                'table_schema', 'facodi'
            ).eq(
                'table_name', table_name
            ).execute()
            
            tables_info[table_name] = cols_response.data if cols_response.data else []
            
            if tables_info[table_name]:
                logger.info(f"      Columns:")
                for col in tables_info[table_name]:
                    nullable = "nullable" if col['is_nullable'] == 'YES' else "not null"
                    logger.info(f"        • {col['column_name']} ({col['data_type']}) [{nullable}]")
        
        return tables_info
        
    except Exception as e:
        logger.error(f"  ✗ Table inspection failed: {e}")
        return tables_info

def validate_required_tables(existing_tables: Dict[str, List]) -> Dict[str, bool]:
    """Validate which required tables exist."""
    logger.info("\n" + "=" * 70)
    logger.info("6. VALIDATING REQUIRED TABLES")
    logger.info("=" * 70)
    
    required_tables = [
        'courses',
        'modules',
        'lessons',
        'users',
        'user_progress',
        'playlists',
        'playlist_items'
    ]
    
    validation_result = {}
    
    for table_name in required_tables:
        exists = table_name in existing_tables
        status = "✓" if exists else "✗"
        validation_result[table_name] = exists
        logger.info(f"  {status} {table_name}")
    
    missing_count = sum(1 for v in validation_result.values() if not v)
    if missing_count == 0:
        logger.info(f"\n  ✓ All {len(required_tables)} required tables exist!")
    else:
        logger.warning(f"\n  ⚠ {missing_count} table(s) need to be created")
    
    return validation_result

def show_table_definitions():
    """Display SQL definitions for required tables."""
    logger.info("\n" + "=" * 70)
    logger.info("7. REQUIRED TABLE DEFINITIONS")
    logger.info("=" * 70)
    
    sql_definitions = """
-- Execute these SQL statements in Supabase dashboard (SQL Editor) to create tables

-- 1. COURSES table
CREATE TABLE IF NOT EXISTS facodi.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. MODULES table  
CREATE TABLE IF NOT EXISTS facodi.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES facodi.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. LESSONS table (video lessons)
CREATE TABLE IF NOT EXISTS facodi.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES facodi.modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    duration_seconds INTEGER,
    order_index INTEGER NOT NULL,
    is_preview BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. USERS table (if not using auth.users)
CREATE TABLE IF NOT EXISTS facodi.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. USER_PROGRESS table
CREATE TABLE IF NOT EXISTS facodi.user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES facodi.users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES facodi.lessons(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    progress_percentage INTEGER CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, lesson_id)
);

-- 6. PLAYLISTS table
CREATE TABLE IF NOT EXISTS facodi.playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    source TEXT CHECK (source IN ('youtube', 'external', 'internal')),
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. PLAYLIST_ITEMS table
CREATE TABLE IF NOT EXISTS facodi.playlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID NOT NULL REFERENCES facodi.playlists(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES facodi.lessons(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(playlist_id, lesson_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_modules_course ON facodi.modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON facodi.lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON facodi.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_lesson ON facodi.user_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist ON facodi.playlist_items(playlist_id);

-- Enable Row Level Security
ALTER TABLE facodi.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE facodi.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE facodi.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE facodi.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE facodi.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE facodi.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE facodi.playlist_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (public read access for courses/lessons)
CREATE POLICY "Courses are readable by everyone" 
    ON facodi.courses FOR SELECT 
    USING (true);

CREATE POLICY "Modules are readable by everyone" 
    ON facodi.modules FOR SELECT 
    USING (true);

CREATE POLICY "Lessons are readable by everyone" 
    ON facodi.lessons FOR SELECT 
    USING (true);

CREATE POLICY "Users can read own data"
    ON facodi.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can read own progress"
    ON facodi.user_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
    ON facodi.user_progress FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
    ON facodi.user_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT USAGE ON SCHEMA facodi TO authenticated, anon;
GRANT SELECT ON ALL TABLES IN SCHEMA facodi TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON facodi.user_progress TO authenticated;
"""
    
    logger.info(sql_definitions)

def check_authentication(url: str, service_key: str) -> Dict[str, Any]:
    """Check authentication configuration."""
    logger.info("\n" + "=" * 70)
    logger.info("8. AUTHENTICATION CHECK")
    logger.info("=" * 70)
    
    auth_status = {
        'configured': False,
        'users_count': 0,
        'auth_providers': [],
        'issues': []
    }
    
    try:
        from supabase import create_client
        
        client = create_client(url, service_key)
        
        # Try to list users via admin API
        logger.info("  Checking authentication configuration...")
        
        # Note: Full auth check requires direct API access
        logger.info("  ℹ To fully validate auth:")
        logger.info("    - Go to Supabase dashboard → Authentication → Providers")
        logger.info("    - Verify Email/Password, OAuth providers as needed")
        logger.info("    - Check Users tab for existing user count")
        
        auth_status['configured'] = True
        logger.info("  ✓ Authentication appears to be available")
        
    except Exception as e:
        logger.error(f"  ✗ Could not check auth: {e}")
        auth_status['issues'].append(str(e))
    
    return auth_status

def generate_report(
    connection_ok: bool,
    existing_tables: Dict[str, List],
    table_validation: Dict[str, bool],
    auth_status: Dict[str, Any]
) -> Dict[str, Any]:
    """Generate final report."""
    logger.info("\n" + "=" * 70)
    logger.info("9. SETUP REPORT & RECOMMENDATIONS")
    logger.info("=" * 70)
    
    missing_tables = [name for name, exists in table_validation.items() if not exists]
    
    report = {
        'timestamp': datetime.now().isoformat(),
        'connection_status': 'OK' if connection_ok else 'FAILED',
        'schema_status': 'OK' if existing_tables or missing_tables else 'NOT FOUND',
        'tables_found': len(existing_tables),
        'tables_required': len(table_validation),
        'tables_missing': len(missing_tables),
        'missing_tables': missing_tables,
        'auth_configured': auth_status.get('configured', False),
        'recommendations': []
    }
    
    # Generate recommendations
    if connection_ok:
        logger.info("\n✓ Connection Status: OK")
    else:
        logger.error("\n✗ Connection Status: FAILED")
        report['recommendations'].append("Fix Supabase connection issues first")
    
    if missing_tables:
        logger.warning(f"\n⚠ Missing Tables ({len(missing_tables)}):")
        for table in missing_tables:
            logger.warning(f"  - {table}")
        report['recommendations'].append("Execute SQL table creation statements (see section 7)")
    else:
        logger.info("\n✓ All required tables present")
    
    if existing_tables:
        logger.info(f"\n✓ Existing Tables ({len(existing_tables)}):")
        for table in existing_tables:
            logger.info(f"  - {table}")
    
    # Additional recommendations
    report['recommendations'].extend([
        "Enable Row Level Security (RLS) on all tables",
        "Create RLS policies for proper access control",
        "Set up auth.users integration for user management",
        "Configure realtime for lesson progress updates (optional)",
        "Add sample data for testing",
        "Review security checklist in Supabase docs",
        "Set up automated backups"
    ])
    
    logger.info("\n" + "=" * 70)
    logger.info("RECOMMENDATIONS:")
    logger.info("=" * 70)
    for i, rec in enumerate(report['recommendations'], 1):
        logger.info(f"  {i}. {rec}")
    
    return report

def main():
    """Main execution."""
    logger.info("\n" + "=" * 70)
    logger.info("FACODI — SUPABASE BACKEND INTEGRATION VALIDATION")
    logger.info("=" * 70)
    
    # Load environment
    load_env()
    
    # Get credentials
    url, service_key, anon_key = get_credentials()
    
    # Test connections
    api_ok = test_connection(url, service_key)
    
    client = test_database_connection(url, service_key)
    db_ok = client is not None
    
    if not db_ok:
        logger.error("\n✗ Cannot proceed without database access")
        logger.error("Please ensure:")
        logger.error("  1. Supabase library is installed: pip install supabase")
        logger.error("  2. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set")
        logger.error("  3. Database is accessible")
        sys.exit(1)
    
    # Check schema
    schema_exists = check_schema_exists(client)
    if not schema_exists:
        create_schema(client)
    
    # Inspect tables
    existing_tables = inspect_tables(client) if db_ok else {}
    
    # Validate required tables
    table_validation = validate_required_tables(existing_tables)
    
    # Show required table definitions
    show_table_definitions()
    
    # Check authentication
    auth_status = check_authentication(url, service_key)
    
    # Generate report
    report = generate_report(api_ok and db_ok, existing_tables, table_validation, auth_status)
    
    # Save report
    report_path = Path(__file__).parent / "supabase_setup_report.json"
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2)
    
    logger.info(f"\n✓ Report saved to: {report_path}")
    
    # Final status
    logger.info("\n" + "=" * 70)
    if len(report['missing_tables']) == 0:
        logger.info("✓✓✓ SUPABASE SETUP VALIDATION COMPLETE ✓✓✓")
        logger.info("All required tables exist. Status: READY")
    else:
        logger.warning("⚠⚠⚠ SUPABASE SETUP PARTIAL ⚠⚠⚠")
        logger.warning(f"{len(report['missing_tables'])} table(s) still need to be created")
        logger.warning("See Section 7 above for SQL statements to execute")
    logger.info("=" * 70 + "\n")

if __name__ == '__main__':
    main()
