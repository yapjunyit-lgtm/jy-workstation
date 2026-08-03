import { db } from './db';
import { generateId } from './utils';
import type { Snippet, ChecklistItem } from './types';

const SEED_SNIPPETS: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Read Parquet + Clean Nulls + GroupBy',
    content: `import pandas as pd\n\n# Read parquet file\ndf = pd.read_parquet('data/production.parquet')\n\n# Forward-fill nulls for sensor data\ndf = df.fillna(method='ffill')\n\n# Group by asset and aggregate\ndf.groupby('asset_id').agg({\n    'pressure': 'mean',\n    'temperature': 'max',\n    'flow_rate': 'sum'\n}).reset_index()`,
    category: 'python-wrangling',
    tags: ['pandas', 'parquet', 'etl', 'oil-gas'],
    isFavorite: false,
  },
  {
    title: 'Scikit-learn Train/Test Split + StandardScaler',
    content: `from sklearn.model_selection import train_test_split\nfrom sklearn.preprocessing import StandardScaler\n\nX_train, X_test, y_train, y_test = train_test_split(\n    X, y, test_size=0.2, random_state=42\n)\n\nscaler = StandardScaler()\nX_train_scaled = scaler.fit_transform(X_train)\nX_test_scaled = scaler.transform(X_test)`,
    category: 'python-wrangling',
    tags: ['sklearn', 'ml', 'preprocessing'],
    isFavorite: false,
  },
  {
    title: 'Efficient DataFrame Filtering with .query()',
    content: `# Use .query() for cleaner, faster filtering\ndf.query('pressure > 100 and status == "active"')\n\n# With variables\nthreshold = 100\nstatus = "active"\ndf.query('pressure > @threshold and status == @status')`,
    category: 'python-wrangling',
    tags: ['pandas', 'performance'],
    isFavorite: false,
  },
  {
    title: 'Recursive CTE for Org Hierarchy',
    content: `WITH RECURSIVE org_hierarchy AS (\n  -- Base case: top-level\n  SELECT id, name, manager_id, 1 AS level\n  FROM employees WHERE manager_id IS NULL\n  \n  UNION ALL\n  \n  -- Recursive case\n  SELECT e.id, e.name, e.manager_id, oh.level + 1\n  FROM employees e\n  JOIN org_hierarchy oh ON e.manager_id = oh.id\n)\nSELECT * FROM org_hierarchy ORDER BY level, name;`,
    category: 'sql-query',
    tags: ['cte', 'recursive', 'hierarchy'],
    isFavorite: false,
  },
  {
    title: 'Window Functions ROW_NUMBER / RANK',
    content: `SELECT\n  employee_name,\n  department,\n  salary,\n  ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rank,\n  RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dense_rank\nFROM employees\nWHERE status = 'active'\nORDER BY department, salary DESC;`,
    category: 'sql-query',
    tags: ['window', 'ranking', 'analytics'],
    isFavorite: false,
  },
  {
    title: 'Common Table Expressions for Readability',
    content: `WITH monthly_summary AS (\n  SELECT\n    asset_id,\n    DATE_TRUNC('month', timestamp) AS month,\n    AVG(pressure) AS avg_pressure,\n    SUM(production_volume) AS total_production\n  FROM sensor_readings\n  GROUP BY asset_id, DATE_TRUNC('month', timestamp)\n)\nSELECT * FROM monthly_summary\nWHERE avg_pressure > 500\nORDER BY month DESC;`,
    category: 'sql-query',
    tags: ['cte', 'readability', 'aggregation'],
    isFavorite: false,
  },
  {
    title: 'Standard Operating Procedure Template',
    content: `# SOP: [Process Name]\n\n## Purpose\nBrief description of why this SOP exists.\n\n## Scope\nWho does this apply to? Which systems/processes?\n\n## Definitions\n- **Term 1**: Definition\n- **Term 2**: Definition\n\n## Procedure\n### Step 1: [Action]\nDetailed steps with screenshots where helpful.\n\n### Step 2: [Action]\n...\n\n## Safety Considerations\n- [Safety point 1]\n- [Safety point 2]\n\n## References\n- [Related SOP or document]`,
    category: 'sop-drafting',
    tags: ['template', 'documentation'],
    isFavorite: false,
  },
  {
    title: 'System Testing Checklist Template',
    content: `# System Testing Checklist\n\n## Pre-Test\n- [ ] Test environment prepared\n- [ ] Test data loaded and validated\n- [ ] Rollback plan documented\n- [ ] Stakeholders notified\n\n## Execution\n- [ ] Unit tests pass\n- [ ] Integration tests pass\n- [ ] Performance benchmarks met\n- [ ] Edge cases tested\n\n## Post-Test\n- [ ] Results documented\n- [ ] Issues logged in tracker\n- [ ] Sign-off obtained`,
    category: 'sop-drafting',
    tags: ['testing', 'checklist', 'qa'],
    isFavorite: false,
  },
  {
    title: 'Vectorize Loops with NumPy',
    content: `# ❌ Slow: Python loop\nresult = []\nfor i in range(len(data)):\n    if data[i] > threshold:\n        result.append(data[i] * 2)\n\n# ✅ Fast: NumPy vectorized\nimport numpy as np\narr = np.array(data)\nresult = np.where(arr > threshold, arr * 2, arr)`,
    category: 'code-optimization',
    tags: ['numpy', 'vectorization', 'performance'],
    isFavorite: false,
  },
  {
    title: 'Python functools.lru_cache',
    content: `from functools import lru_cache\n\n@lru_cache(maxsize=128)\ndef expensive_computation(param1: str, param2: int) -> float:\n    # This result is cached — subsequent calls\n    # with same params return instantly\n    return complex_calculation(param1, param2)`,
    category: 'code-optimization',
    tags: ['caching', 'memoization', 'performance'],
    isFavorite: false,
  },
  {
    title: 'Pandas itertuples() vs iterrows()',
    content: `# ❌ Slow: iterrows() creates a Series per row\nfor idx, row in df.iterrows():\n    process(row['col1'], row['col2'])\n\n# ✅ 100x faster: itertuples() returns named tuples\nfor row in df.itertuples():\n    process(row.col1, row.col2)`,
    category: 'code-optimization',
    tags: ['pandas', 'performance', 'iteration'],
    isFavorite: false,
  },
  {
    title: 'Code Review Assistant System Prompt',
    content: `You are a senior software engineer conducting a code review. Review the following code for:\n\n1. **Correctness**: Does it do what it intends?\n2. **Performance**: Are there bottlenecks?\n3. **Security**: Any vulnerabilities?\n4. **Readability**: Is it clear and well-documented?\n5. **Best Practices**: Does it follow language conventions?\n\nFor each issue found, provide:\n- Severity (Critical / Major / Minor)\n- Location (line number or function)\n- Explanation\n- Suggested fix with code example`,
    category: 'llm-prompts',
    tags: ['code-review', 'system-prompt'],
    isFavorite: false,
  },
  {
    title: 'Data Anonymization Audit Prompt',
    content: `Analyze the following dataset. Your task:\n\n1. **Identify all PII fields** (names, emails, phones, IDs, addresses, GPS coordinates)\n2. **Classify sensitivity** per field (High / Medium / Low)\n3. **Suggest masking strategies**:\n   - Tokenization (replace with random token)\n   - Generalization (e.g., GPS → field/block level)\n   - Aggregation (summarize to avoid individual identification)\n   - Redaction (remove entirely)\n4. **Provide Python/pandas code** for each masking operation\n\nOutput as a structured report.`,
    category: 'llm-prompts',
    tags: ['security', 'pii', 'data-privacy'],
    isFavorite: false,
  },
  {
    title: 'SOP Drafting Assistant Prompt',
    content: `Generate a Standard Operating Procedure for the following process:\n\n[Describe the process here]\n\nInclude these sections:\n- Purpose\n- Scope\n- Prerequisites\n- Step-by-step Procedure (numbered)\n- Safety / Compliance Notes\n- Troubleshooting Common Issues\n- References / Related Documents\n\nUse clear, concise language. Write for an audience with basic technical knowledge. Include placeholders [in brackets] for screenshots or specific values.`,
    category: 'llm-prompts',
    tags: ['sop', 'documentation', 'system-prompt'],
    isFavorite: false,
  },
];

const SEED_CHECKLIST: Omit<ChecklistItem, 'id'>[] = [
  { label: 'Scan all columns for personal names', category: 'PII Identification', checked: false },
  { label: 'Scan all columns for email addresses', category: 'PII Identification', checked: false },
  { label: 'Scan all columns for phone numbers', category: 'PII Identification', checked: false },
  { label: 'Scan all columns for NRIC / passport numbers', category: 'PII Identification', checked: false },
  { label: 'Scan all columns for physical addresses', category: 'PII Identification', checked: false },
  { label: 'Verify GPS coordinates are aggregated to field/block level', category: 'Geo-Spatial', checked: false },
  { label: 'Confirm no exact drilling coordinates in exported data', category: 'Geo-Spatial', checked: false },
  { label: 'Mask production volume to percentage changes if sharing externally', category: 'Financial', checked: false },
  { label: 'Remove or aggregate cost/revenue columns', category: 'Financial', checked: false },
  { label: 'Confirm exported file is not shared via unsecured channels', category: 'Access Control', checked: false },
  { label: 'Verify data is stored in company-approved location', category: 'Access Control', checked: false },
  { label: 'Document all masking transformations applied', category: 'Documentation', checked: false },
  { label: 'Attach data processing log to output', category: 'Documentation', checked: false },
];

export async function seedData() {
  const snippetCount = await db.snippets.count();
  if (snippetCount > 0) return; // Already seeded

  const now = Date.now();
  for (const s of SEED_SNIPPETS) {
    await db.snippets.add({ ...s, id: generateId(), createdAt: now, updatedAt: now });
  }

  for (const item of SEED_CHECKLIST) {
    await db.checklistItems.add({ ...item, id: generateId() });
  }

  console.log(`Seeded ${SEED_SNIPPETS.length} snippets and ${SEED_CHECKLIST.length} checklist items`);
}
