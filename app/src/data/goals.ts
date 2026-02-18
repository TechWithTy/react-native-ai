
export const ROLE_GOALS_BY_TRACK: Record<string, Record<string, string[]>> = {
  Engineering: {
    'Software Engineer': ['Feature Velocity', 'Code Quality', 'Reliability', 'Reduce Defects', 'Improve Delivery Time'],
    'Frontend Engineer': ['UI Performance', 'Accessibility', 'Design Consistency', 'Faster Rendering', 'Reduce UI Bugs'],
    'Backend Engineer': ['API Latency', 'Service Reliability', 'Data Consistency', 'Improve Throughput', 'Reduce Downtime'],
    'Mobile Engineer': ['Crash-Free Sessions', 'Startup Speed', 'Offline Support', 'Increase Retention', 'Smooth Navigation'],
    'DevOps Engineer': ['Deployment Safety', 'Incident Response', 'Infra Automation', 'Lower MTTR', 'Higher Uptime'],
  },
  Design: {
    'Product Designer': ['Task Completion', 'Onboarding Conversion', 'UX Impact', 'Design Quality', 'Faster Validation'],
    'UX Designer': ['Usability', 'Journey Clarity', 'Research Rigor', 'Reduce Friction', 'Improve Learnability'],
    'UI Designer': ['Visual Consistency', 'Interface Clarity', 'Component Reuse', 'Stronger Brand Fit', 'Faster UI Delivery'],
    'Interaction Designer': ['Flow Delight', 'Feedback Quality', 'Error Prevention', 'Reduce Drop-off', 'Smooth Interactions'],
    'Design Systems Designer': ['System Adoption', 'Cross-Platform Consistency', 'Handoff Speed', 'Token Coverage', 'Reduce UI Drift'],
  },
  Product: {
    'Product Manager': ['Feature Adoption', 'Roadmap Focus', 'Business Outcomes', 'Customer Satisfaction', 'Faster Iteration'],
    'Senior Product Manager': ['Cross-Team Execution', 'Delivery Predictability', 'Data Decisions', 'Stakeholder Alignment', 'Risk Reduction'],
    'Growth Product Manager': ['Activation', 'Retention', 'Experiment Velocity', 'Lower CAC', 'Increase LTV'],
    'Technical Product Manager': ['Platform Usability', 'Delivery Confidence', 'Technical Alignment', 'Developer Experience', 'Scalable Architecture'],
    'Product Lead': ['Team Leverage', 'Strategic Planning', 'Quarterly Outcomes', 'Org Enablement', 'Portfolio Impact'],
  },
  Data: {
    'Data Analyst': ['Reporting Accuracy', 'Decision Speed', 'Self-Serve Analytics', 'Faster Insights', 'Metric Trust'],
    'Data Scientist': ['Model Performance', 'Experiment Quality', 'Prediction Impact', 'Model Explainability', 'Faster Experiment Cycles'],
    'Analytics Engineer': ['Data Reliability', 'Dashboard Stability', 'Analytics Foundation', 'Model Coverage', 'Reduce Data Incidents'],
    'Machine Learning Engineer': ['Serving Reliability', 'Inference Latency', 'Deployment Safety', 'Model Monitoring', 'Scale Inference'],
    'Business Intelligence Analyst': ['KPI Clarity', 'Dashboard Adoption', 'Insight Delivery', 'Executive Reporting', 'Forecast Accuracy'],
  },
};
