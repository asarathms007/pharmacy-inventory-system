import re

def update_css():
    with open('client/src/index.css', 'r', encoding='utf-8') as f:
        css = f.read()

    # Replace CSS Variables for a clean Light Mode theme
    css = re.sub(
        r':root\s*\{[\s\S]*?--transition:\s*[^;]+;\n\}',
        ''':root {
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --bg-card: #ffffff;
  --bg-card-hover: #f1f5f9;
  --bg-input: #ffffff;

  --accent-teal: #0f766e;
  --accent-teal-dim: #f0fdfa;
  --accent-teal-glow: rgba(15, 118, 110, 0.15);
  
  --accent-purple: #4f46e5;
  --accent-purple-dim: #eef2ff;
  
  --accent-orange: #ea580c;
  --accent-orange-dim: #fff7ed;
  
  --accent-rose: #e11d48;
  --accent-rose-dim: #fff1f2;
  
  --accent-blue: #2563eb;
  --accent-blue-dim: #eff6ff;

  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #64748b;

  --border: #e2e8f0;
  --border-focus: #3b82f6;

  --sidebar-width: 260px;
  --header-height: 70px;
  --radius: 12px;
  --radius-sm: 8px;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
  --transition: 0.2s ease-in-out;
}''',
        css
    )

    # Specific hardcoded color replacements
    css = css.replace('::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12);', '::-webkit-scrollbar-thumb { background: #cbd5e1;')
    css = css.replace('::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }', '::-webkit-scrollbar-thumb:hover { background: #94a3b8; }')

    css = css.replace('background: rgba(7, 9, 26, 0.85);', 'background: rgba(255, 255, 255, 0.85);')
    css = css.replace('border-color: rgba(255,255,255,0.12);', 'border-color: var(--border-focus);')
    css = css.replace('background: rgba(255, 255, 255, 0.03);', 'background: #f8fafc;')
    css = css.replace('border-bottom: 1px solid rgba(255,255,255,0.04);', 'border-bottom: 1px solid var(--border);')
    css = css.replace('background: rgba(255,255,255,0.03);', 'background: #f1f5f9;')
    css = css.replace('background: rgba(255,255,255,0.06);', 'background: #e2e8f0;')
    css = css.replace("background: linear-gradient(rgba(7, 9, 26, 0.6), rgba(7, 9, 26, 0.85)), url('/bg-tablets.png') center/cover no-repeat;", "background: var(--bg-primary);")
    css = css.replace('stroke: rgba(255,255,255,0.06) !important;', 'stroke: var(--border) !important;')
    css = css.replace('color: #0a1a16;', 'color: #ffffff;')

    # Login specific updates
    css = css.replace('box-shadow: 0 8px 32px var(--accent-teal-glow);', 'box-shadow: var(--shadow);')
    css = css.replace('box-shadow: 0 4px 16px var(--accent-teal-glow);', 'box-shadow: var(--shadow-sm);')
    css = css.replace('box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);', 'box-shadow: 0 24px 64px rgba(0, 0, 0, 0.1);')
    css = css.replace('border-bottom: 1px solid rgba(255,255,255,0.04);', 'border-bottom: 1px solid var(--border);')

    with open('client/src/index.css', 'w', encoding='utf-8') as f:
        f.write(css)

    print("Updated index.css")

if __name__ == '__main__':
    update_css()
