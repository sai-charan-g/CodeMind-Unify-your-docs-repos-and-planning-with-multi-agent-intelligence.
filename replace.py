import os

replacements = [
    ("CodeMind", "CodeMind"),
    ("CodeMind", "CodeMind"),
    ("codemind", "codemind"),
    ("codemind", "codemind"),
]

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        return
    
    new_content = content
    for old, new in replacements:
        new_content = new_content.replace(old, new)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8', newline='') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('.'):
    # Exclude typical build/vendor directories
    if any(ignore in root.split(os.sep) for ignore in ['.git', 'node_modules', 'venv', '.next', '.github']):
        if '.github' not in root.split(os.sep):
            continue
        # We DO want to process .github/workflows, so don't exclude .github entirely if it's the only one
        if any(ignore in root.split(os.sep) for ignore in ['.git', 'node_modules', 'venv', '.next']):
            continue
    
    for file in files:
        if file.endswith(('.py', '.ts', '.tsx', '.md', '.json', '.yml', '.yaml', '.txt', '.ini', '.example', '.local', 'Dockerfile', '.css', '.mjs')):
            process_file(os.path.join(root, file))
