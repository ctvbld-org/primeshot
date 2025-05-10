#!/bin/bash

# Make scripts executable
chmod +x memory-bank/scripts/update-memory-bank.sh
chmod +x memory-bank/scripts/detect-changes.js

# Create post-commit hook
HOOK_FILE=".git/hooks/post-commit"
echo "#!/bin/bash" > "$HOOK_FILE"
echo "" >> "$HOOK_FILE"
echo "# Run Memory Bank update script" >> "$HOOK_FILE"
echo "$(pwd)/memory-bank/scripts/update-memory-bank.sh" >> "$HOOK_FILE"
chmod +x "$HOOK_FILE"

# Function to add scripts to package.json
add_scripts_to_package_json() {
    local package_file=$1
    local script_path=$2
    
    if [ -f "$package_file" ]; then
        # Add/update the scripts using node
        node -e "
            const fs = require('fs');
            const package = JSON.parse(fs.readFileSync('$package_file'));
            if (!package.scripts) package.scripts = {};
            package.scripts['detect-changes'] = 'node $script_path/detect-changes.js';
            package.scripts['predev'] = 'node $script_path/detect-changes.js --auto';
            fs.writeFileSync('$package_file', JSON.stringify(package, null, 2) + '\n');
        "
        echo "Updated scripts in $package_file"
    fi
}

# Add scripts to root package.json
add_scripts_to_package_json "package.json" "memory-bank/scripts"

# Add scripts to frontend package.json
add_scripts_to_package_json "frontend/package.json" "../memory-bank/scripts"

echo "Memory Bank automation setup complete!"
echo ""
echo "Usage:"
echo "  - Git commits will automatically update Memory Bank and CHANGELOG"
echo "  - Memory Bank updates will run automatically before 'npm run dev'"
echo "  - Run 'npm run detect-changes' to manually check for significant changes"
echo "" 