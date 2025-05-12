#!/bin/bash

# Configuration
MEMORY_BANK_DIR="memory-bank"
ACTIVE_CONTEXT_FILE="$MEMORY_BANK_DIR/activeContext.md"
CHANGELOG_FILE="CHANGELOG.md"
DATE=$(date '+%Y-%m-%d %H:%M:%S')
AUTHOR=$(git config user.name)
COMMIT_MSG=$(git log -1 --pretty=%B)
CHANGED_FILES=$(git diff-tree --no-commit-id --name-only -r HEAD)

# Function to update a section in a markdown file
update_section() {
    local file=$1
    local section=$2
    local content=$3
    
    # Check if file exists
    if [ ! -f "$file" ]; then
        echo "Error: File $file not found"
        return 1
    fi
    
    # Find the section and add new content below it
    awk -v section="## $section" -v content="$content" '
        $0 ~ section {
            print
            print content
            next
        }
        { print }
    ' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
}

# Update Active Context
COMMIT_ENTRY="- **${DATE}** (${AUTHOR}): ${COMMIT_MSG}"
if [ -n "$CHANGED_FILES" ]; then
    COMMIT_ENTRY="${COMMIT_ENTRY}\n  Changed files:\n$(echo "$CHANGED_FILES" | sed 's/^/    - /')"
fi

update_section "$ACTIVE_CONTEXT_FILE" "Recent Changes" "$COMMIT_ENTRY"

# Update or create CHANGELOG
if [ ! -f "$CHANGELOG_FILE" ]; then
    echo "# Changelog" > "$CHANGELOG_FILE"
    echo "" >> "$CHANGELOG_FILE"
    echo "All notable changes to this project will be documented in this file." >> "$CHANGELOG_FILE"
    echo "" >> "$CHANGELOG_FILE"
    echo "## [Unreleased]" >> "$CHANGELOG_FILE"
    echo "" >> "$CHANGELOG_FILE"
fi

# Add new entry to CHANGELOG
sed -i.bak "5i\\
- **${DATE}** (${AUTHOR}): ${COMMIT_MSG}\\
" "$CHANGELOG_FILE"

# Clean up backup file
rm -f "${CHANGELOG_FILE}.bak"

echo "Memory Bank and Changelog updated successfully!" 