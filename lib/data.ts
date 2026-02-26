export type Company = {
  id: string;
  name: string;
  displayName: string;
  color: string;
  icon: string;
  logoPath?: string;
  description?: string;
  isCustomer?: boolean;
  email?: string;
};

export type PaymentMethod = {
  id: string;
  name: string;
  displayName: string;
  color: string;
  gradient?: string;
  icon: string;
  last4?: string;
  logoPath?: string;
  methodLogoPath?: string;
};

export const companies: Company[] = [
  {
    id: 'greenfield',
    name: 'Greenfield',
    displayName: 'Greenfield',
    color: '#4E9B7C',
    icon: '△',
    logoPath: '/img/logo-24-greenfield.svg',
    description: 'Financial tools built for teams that move fast.',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    displayName: 'Anthropic',
    color: '#A86536',
    icon: 'A\\',
    logoPath: '/img/logo-24-anthropic.svg',
    description: 'AI safety company building reliable, interpretable, and steerable AI systems.',
  },
  {
    id: 'marcus-webb',
    name: 'Marcus Webb',
    displayName: 'Marcus Webb',
    color: '#5E6AD2',
    icon: 'MW',
    isCustomer: true,
    email: 'marcus@webb.co',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    displayName: 'OpenAI',
    color: '#000000',
    icon: '◉',
    logoPath: '/img/logo-24-openai.svg',
    description: 'OpenAI builds safe, powerful AI that helps people and organizations unlock potential.',
  },
  {
    id: 'priya-anand',
    name: 'Priya Anand',
    displayName: 'Priya Anand',
    color: '#2E9E5B',
    icon: 'PA',
    isCustomer: true,
    email: 'priya.anand@gmail.com',
  },
  {
    id: 'daniel-torres',
    name: 'Fournier Systems',
    displayName: 'Fournier Systems',
    color: '#C44B4B',
    icon: 'FS',
    isCustomer: true,
    email: 'dt@fournier.ai',
  },
  {
    id: 'lovable',
    name: 'Lovable',
    displayName: 'Lovable',
    color: '#D658AC',
    icon: '◐',
    logoPath: '/img/logo-24-lovable.svg',
    description: 'Build beautiful software, effortlessly.',
  },
  {
    id: 'cactuspractice',
    name: 'Cactus Practice',
    displayName: 'Cactus Practice',
    color: '#CD7609',
    icon: '🌵',
    logoPath: '/img/logo-24-cactus.svg',
    description: 'A landscape design studio that transforms drab into fab.',
  },
];

export const paymentMethods: PaymentMethod[] = [
  {
    id: 'usdc',
    name: 'USDC',
    displayName: 'USDC',
    color: '#1485FF',
    gradient: 'linear-gradient(to right, #1485FF, #004FA5)',
    icon: '◎',
    last4: '0451',
    logoPath: '/img/logo-24-usdc.svg',
    methodLogoPath: '/img/method-32-usdc.svg',
  },
  {
    id: 'stripe',
    name: 'Stripe balance',
    displayName: 'Stripe balance',
    color: '#7B4EFF',
    gradient: 'linear-gradient(to right, #7B4EFF, #531DF5)',
    icon: 'S',
    logoPath: '/img/logo-24-stripe.svg',
    methodLogoPath: '/img/method-32-stripe.svg',
  },
  {
    id: 'wellsfargo',
    name: 'Wells Fargo',
    displayName: 'Wells Fargo',
    color: '#454E5D',
    gradient: 'linear-gradient(to right, #454E5D, #21252C)',
    icon: 'WF',
    last4: '0451',
    logoPath: '/img/logo-24-wf.svg',
    methodLogoPath: '/img/method-32-wf.svg',
  },
  {
    id: 'unionbank',
    name: 'Union Bank',
    displayName: 'Union Bank',
    color: '#454E5D',
    gradient: 'linear-gradient(to right, #454E5D, #21252C)',
    icon: '🏛',
    last4: '0451',
    logoPath: '/img/logo-24-bank.svg',
    methodLogoPath: '/img/method-32-bank.svg',
  },
];
