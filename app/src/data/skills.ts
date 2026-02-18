
export const ROLE_SKILLS_BY_TRACK: Record<string, Record<string, string[]>> = {
  Engineering: {
    'Software Engineer': ['TypeScript', 'API Design', 'Testing', 'System Design', 'Code Review', 'Performance'],
    'Frontend Engineer': ['React Native', 'UI Architecture', 'State Management', 'Accessibility', 'Design Systems', 'Performance'],
    'Backend Engineer': ['Node.js', 'Databases', 'Scalability', 'Distributed Systems', 'Caching', 'Observability'],
    'Mobile Engineer': ['React Native', 'Performance', 'Offline Sync', 'App Store Delivery', 'Navigation', 'Crash Analytics'],
    'DevOps Engineer': ['CI/CD', 'Kubernetes', 'Observability', 'Cloud Infrastructure', 'Incident Response', 'Security'],
  },
  Design: {
    'Product Designer': ['User Research', 'Interaction Design', 'Prototyping', 'Visual Design', 'Journey Mapping', 'A/B Testing'],
    'UX Designer': ['User Flows', 'Usability Testing', 'Information Architecture', 'Wireframing', 'Personas', 'Journey Mapping'],
    'UI Designer': ['Design Systems', 'Typography', 'Color Systems', 'Responsive Layout', 'Visual Hierarchy', 'Component Specs'],
    'Interaction Designer': ['Microinteractions', 'Motion Design', 'Prototyping', 'Figma', 'Transition Design', 'Feedback Loops'],
    'Design Systems Designer': ['Component Libraries', 'Tokens', 'Accessibility', 'Cross-platform Consistency', 'Governance', 'Documentation'],
  },
  Product: {
    'Product Manager': ['Roadmapping', 'Prioritization', 'Stakeholder Management', 'Experimentation', 'Discovery', 'Analytics'],
    'Senior Product Manager': ['Strategy', 'Metrics', 'Execution', 'Cross-functional Leadership', 'Org Alignment', 'Risk Management'],
    'Growth Product Manager': ['Funnels', 'A/B Testing', 'Activation', 'Retention', 'Lifecycle Marketing', 'Pricing'],
    'Technical Product Manager': ['Technical Depth', 'API Products', 'System Tradeoffs', 'Delivery', 'Architecture', 'Platform Thinking'],
    'Product Lead': ['Vision', 'Team Leadership', 'Portfolio Prioritization', 'Outcome Ownership', 'Coaching', 'Planning'],
  },
  Data: {
    'Data Analyst': ['SQL', 'Dashboarding', 'Data Modeling', 'Insights Communication', 'Excel', 'Storytelling'],
    'Data Scientist': ['Python', 'Statistics', 'Machine Learning', 'Experiment Design', 'Feature Engineering', 'Model Evaluation'],
    'Analytics Engineer': ['dbt', 'Warehouse Modeling', 'Data Quality', 'Semantic Layers', 'ELT Pipelines', 'Documentation'],
    'Machine Learning Engineer': ['Model Deployment', 'Feature Engineering', 'MLOps', 'Inference Optimization', 'Monitoring', 'Containerization'],
    'Business Intelligence Analyst': ['BI Tools', 'KPI Definition', 'Reporting', 'Stakeholder Insights', 'Data Governance', 'Forecasting'],
  },
};
