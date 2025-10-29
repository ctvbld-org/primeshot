#!/usr/bin/env python3
"""
Script to clean user data from seed.sql file while keeping configuration data
"""

import re

# Tables to clean (remove all INSERT statements)
TABLES_TO_CLEAN = {
    'characters',
    'credit_pack_purchases', 
    'credit_usage',
    'generated_images',
    'inference_jobs',
    'training_jobs',
    'uploaded_images',
    'user_credits',
    'user_settings',
    'user_subscriptions',
    'users'  # both auth.users and public.users
}

def clean_seed_file(input_file, output_file):
    """Clean the seed file by removing data from specified tables"""
    
    with open(input_file, 'r') as f:
        content = f.read()
    
    lines = content.split('\n')
    cleaned_lines = []
    skip_section = False
    current_table = None
    
    for line in lines:
        # Check if this is a table data section header
        if line.startswith('-- Data for Name:'):
            # Extract table name from the comment
            match = re.search(r'-- Data for Name: (\w+);', line)
            if match:
                current_table = match.group(1)
                # Check if we should skip this table's data
                skip_section = current_table in TABLES_TO_CLEAN
                
        # Check if we're at the end of a data section (next comment or end of file)
        elif line.startswith('--') and not line.startswith('-- Data for Name:'):
            skip_section = False
            current_table = None
            
        # If we're in a section to skip, only keep the header comment
        if skip_section:
            if line.startswith('-- Data for Name:'):
                cleaned_lines.append(line)
                cleaned_lines.append('--')
                cleaned_lines.append('-- (Data removed for clean development environment)')
                cleaned_lines.append('--')
                cleaned_lines.append('')
            # Skip INSERT statements and other content for this table
            elif not line.startswith('INSERT INTO') and not line.strip().startswith('(') and not line.strip() == ';':
                if line.strip() and not line.startswith('\t'):
                    cleaned_lines.append(line)
        else:
            cleaned_lines.append(line)
    
    # Write cleaned content
    with open(output_file, 'w') as f:
        f.write('\n'.join(cleaned_lines))
    
    print(f"Cleaned seed file saved to {output_file}")
    print(f"Removed data from tables: {', '.join(sorted(TABLES_TO_CLEAN))}")

if __name__ == '__main__':
    clean_seed_file('supabase/seed.sql', 'supabase/seed_clean.sql')
