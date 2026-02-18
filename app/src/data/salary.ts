
export const ROLE_SALARY_RANGES_BY_TRACK: Record<string, Record<string, string[]>> = {
  Engineering: {
    'Software Engineer': ['$120k-$150k', '$150k-$180k', '$180k-$220k+'],
    'Frontend Engineer': ['$115k-$145k', '$145k-$175k', '$175k-$210k+'],
    'Backend Engineer': ['$125k-$155k', '$155k-$185k', '$185k-$225k+'],
    'Mobile Engineer': ['$120k-$150k', '$150k-$180k', '$180k-$215k+'],
    'DevOps Engineer': ['$130k-$160k', '$160k-$195k', '$195k-$235k+'],
  },
  Design: {
    'Product Designer': ['$100k-$130k', '$130k-$165k', '$165k-$200k+'],
    'UX Designer': ['$95k-$125k', '$125k-$160k', '$160k-$195k+'],
    'UI Designer': ['$90k-$120k', '$120k-$150k', '$150k-$185k+'],
    'Interaction Designer': ['$95k-$125k', '$125k-$155k', '$155k-$190k+'],
    'Design Systems Designer': ['$110k-$140k', '$140k-$175k', '$175k-$210k+'],
  },
  Product: {
    'Product Manager': ['$120k-$150k', '$150k-$185k', '$185k-$230k+'],
    'Senior Product Manager': ['$145k-$180k', '$180k-$220k', '$220k-$270k+'],
    'Growth Product Manager': ['$130k-$165k', '$165k-$205k', '$205k-$250k+'],
    'Technical Product Manager': ['$140k-$175k', '$175k-$215k', '$215k-$260k+'],
    'Product Lead': ['$170k-$210k', '$210k-$255k', '$255k-$310k+'],
  },
  Data: {
    'Data Analyst': ['$90k-$120k', '$120k-$150k', '$150k-$180k+'],
    'Data Scientist': ['$120k-$150k', '$150k-$190k', '$190k-$235k+'],
    'Analytics Engineer': ['$125k-$155k', '$155k-$190k', '$190k-$230k+'],
    'Machine Learning Engineer': ['$140k-$175k', '$175k-$220k', '$220k-$270k+'],
    'Business Intelligence Analyst': ['$95k-$125k', '$125k-$155k', '$155k-$190k+'],
  },
};
