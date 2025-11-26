#!/usr/bin/env python3
"""
Comprehensive Micro-Level Performance Analysis
Analyzes every line of code for performance bottlenecks
"""

import os
import re
from pathlib import Path
from collections import defaultdict

class PerformanceAnalyzer:
    def __init__(self, project_root):
        self.project_root = Path(project_root)
        self.issues = defaultdict(list)
        self.stats = defaultdict(int)
        
    def analyze_backend(self):
        """Analyze backend code for performance issues"""
        print("🔍 Analyzing Backend Code...")
        
        # Analyze routers.ts
        routers_file = self.project_root / "server" / "routers.ts"
        if routers_file.exists():
            content = routers_file.read_text()
            lines = content.split('\n')
            
            for i, line in enumerate(lines, 1):
                # Check for N+1 queries
                if 'await' in line and 'for' in lines[max(0, i-5):i]:
                    self.issues['n_plus_one'].append(f"routers.ts:{i} - Potential N+1 query in loop")
                
                # Check for missing indexes
                if '.where(' in line and 'eq(' in line:
                    self.stats['where_clauses'] += 1
                
                # Check for SELECT *
                if '.select()' in line and '.from(' in line:
                    self.issues['select_star'].append(f"routers.ts:{i} - Using SELECT * (fetch only needed columns)")
                
                # Check for missing pagination
                if '.select(' in line and '.limit(' not in content[max(0, content.find(line)-500):content.find(line)+500]:
                    self.stats['unpaginated_queries'] += 1
                
                # Check for synchronous operations
                if 'JSON.parse' in line or 'JSON.stringify' in line:
                    self.issues['sync_operations'].append(f"routers.ts:{i} - Synchronous JSON operation (consider streaming)")
        
        # Analyze db.ts
        db_file = self.project_root / "server" / "db.ts"
        if db_file.exists():
            content = db_file.read_text()
            lines = content.split('\n')
            
            for i, line in enumerate(lines, 1):
                # Check for missing connection pooling
                if 'drizzle(' in line:
                    self.stats['db_connections'] += 1
                
                # Check for missing error handling
                if 'await db.' in line and 'try' not in '\n'.join(lines[max(0,i-10):i]):
                    self.issues['missing_error_handling'].append(f"db.ts:{i} - Missing try-catch for database operation")
    
    def analyze_frontend(self):
        """Analyze frontend code for performance issues"""
        print("🔍 Analyzing Frontend Code...")
        
        pages_dir = self.project_root / "client" / "src" / "pages"
        if pages_dir.exists():
            for tsx_file in pages_dir.glob("*.tsx"):
                content = tsx_file.read_text()
                lines = content.split('\n')
                
                for i, line in enumerate(lines, 1):
                    # Check for missing memoization
                    if 'map(' in line and 'useMemo' not in '\n'.join(lines[max(0,i-20):i]):
                        self.issues['missing_memo'].append(f"{tsx_file.name}:{i} - Array map without useMemo (causes re-renders)")
                    
                    # Check for inline functions in JSX
                    if '=>' in line and ('<' in line or '/>' in line):
                        self.issues['inline_functions'].append(f"{tsx_file.name}:{i} - Inline function in JSX (creates new function on every render)")
                    
                    # Check for missing query options
                    if 'useQuery()' in line and 'staleTime' not in content:
                        self.issues['missing_cache'].append(f"{tsx_file.name}:{i} - useQuery without caching options")
                    
                    # Check for large state objects
                    if 'useState<' in line and ('{' in line or 'Array' in line):
                        self.issues['large_state'].append(f"{tsx_file.name}:{i} - Complex state object (consider splitting)")
                    
                    # Check for useEffect dependencies
                    if 'useEffect(' in line:
                        # Look for dependency array in next few lines
                        deps_section = '\n'.join(lines[i:min(i+10, len(lines))])
                        if '[]' in deps_section:
                            self.stats['mount_only_effects'] += 1
                        elif '[' not in deps_section:
                            self.issues['missing_deps'].append(f"{tsx_file.name}:{i} - useEffect without dependency array")
    
    def analyze_bundle(self):
        """Analyze bundle size and imports"""
        print("🔍 Analyzing Bundle & Imports...")
        
        # Check for large imports
        for tsx_file in self.project_root.glob("client/src/**/*.tsx"):
            if tsx_file.exists():
                content = tsx_file.read_text()
                lines = content.split('\n')
                
                for i, line in enumerate(lines, 1):
                    # Check for entire library imports
                    if 'import *' in line:
                        self.issues['large_imports'].append(f"{tsx_file.relative_to(self.project_root)}:{i} - Importing entire library")
                    
                    # Check for unused imports (basic check)
                    if 'import {' in line:
                        imports = re.findall(r'import \{([^}]+)\}', line)
                        if imports:
                            for imp in imports[0].split(','):
                                imp_name = imp.strip()
                                if content.count(imp_name) == 1:  # Only appears in import
                                    self.issues['unused_imports'].append(f"{tsx_file.relative_to(self.project_root)}:{i} - Potentially unused import: {imp_name}")
    
    def generate_report(self):
        """Generate comprehensive analysis report"""
        report = []
        report.append("=" * 80)
        report.append("COMPREHENSIVE MICRO-LEVEL PERFORMANCE ANALYSIS")
        report.append("=" * 80)
        report.append("")
        
        # Critical Issues
        report.append("🔴 CRITICAL ISSUES (Fix Immediately)")
        report.append("-" * 80)
        
        if self.issues['n_plus_one']:
            report.append(f"\n❌ N+1 Query Problems ({len(self.issues['n_plus_one'])} found):")
            for issue in self.issues['n_plus_one'][:5]:  # Show first 5
                report.append(f"   {issue}")
        
        if self.issues['select_star']:
            report.append(f"\n❌ SELECT * Problems ({len(self.issues['select_star'])} found):")
            for issue in self.issues['select_star'][:5]:
                report.append(f"   {issue}")
        
        # High Priority Issues
        report.append("\n\n🟠 HIGH PRIORITY ISSUES")
        report.append("-" * 80)
        
        if self.issues['missing_cache']:
            report.append(f"\n⚠️  Missing Cache Configuration ({len(self.issues['missing_cache'])} found):")
            for issue in self.issues['missing_cache'][:5]:
                report.append(f"   {issue}")
        
        if self.issues['inline_functions']:
            report.append(f"\n⚠️  Inline Functions in JSX ({len(self.issues['inline_functions'])} found):")
            report.append("   These create new function instances on every render")
            for issue in self.issues['inline_functions'][:5]:
                report.append(f"   {issue}")
        
        # Medium Priority Issues
        report.append("\n\n🟡 MEDIUM PRIORITY ISSUES")
        report.append("-" * 80)
        
        if self.issues['missing_memo']:
            report.append(f"\n📊 Missing Memoization ({len(self.issues['missing_memo'])} found):")
            for issue in self.issues['missing_memo'][:5]:
                report.append(f"   {issue}")
        
        if self.issues['large_state']:
            report.append(f"\n📦 Large State Objects ({len(self.issues['large_state'])} found):")
            for issue in self.issues['large_state'][:5]:
                report.append(f"   {issue}")
        
        # Statistics
        report.append("\n\n📊 STATISTICS")
        report.append("-" * 80)
        report.append(f"WHERE clauses found: {self.stats['where_clauses']}")
        report.append(f"Unpaginated queries: {self.stats['unpaginated_queries']}")
        report.append(f"Mount-only useEffects: {self.stats['mount_only_effects']}")
        report.append(f"Database connections: {self.stats['db_connections']}")
        
        # Recommendations
        report.append("\n\n💡 TOP RECOMMENDATIONS")
        report.append("-" * 80)
        report.append("1. Add pagination to all list queries (currently unpaginated)")
        report.append("2. Replace inline functions with useCallback")
        report.append("3. Add staleTime to all useQuery calls")
        report.append("4. Memoize expensive computations with useMemo")
        report.append("5. Split large components into smaller ones")
        report.append("6. Add error boundaries for better error handling")
        report.append("7. Implement code splitting for large pages")
        report.append("8. Add loading skeletons instead of spinners")
        
        report.append("\n" + "=" * 80)
        
        return "\n".join(report)

if __name__ == "__main__":
    analyzer = PerformanceAnalyzer("/home/ubuntu/po-manager")
    analyzer.analyze_backend()
    analyzer.analyze_frontend()
    analyzer.analyze_bundle()
    
    report = analyzer.generate_report()
    print(report)
    
    # Save report
    with open("/home/ubuntu/po-manager/MICRO_ANALYSIS_REPORT.md", "w") as f:
        f.write(report)
    
    print("\n✅ Report saved to MICRO_ANALYSIS_REPORT.md")
