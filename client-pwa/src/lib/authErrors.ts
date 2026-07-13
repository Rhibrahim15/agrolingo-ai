export type SupportedAuthLanguage = 'ha' | 'en' | 'fr';

const messages = {
  en: {
    invalidCredentials: 'Invalid email or password.',
    emailNotConfirmed: 'Please verify your email before signing in.',
    alreadyRegistered: 'An account with this email already exists.',
    weakPassword: 'Use 8 or more characters with uppercase, lowercase, a number, and a symbol.',
    rateLimited: 'Too many attempts. Wait a moment and try again.',
    network: 'Unable to connect. Check your internet connection and try again.',
    generic: 'We could not complete that request. Please try again.',
  },
  ha: {
    invalidCredentials: 'Imel ko kalmar sirri ba daidai ba.',
    emailNotConfirmed: 'Da fatan a tabbatar da imel kafin shiga.',
    alreadyRegistered: 'An riga an buɗe asusu da wannan imel.',
    weakPassword: 'Yi amfani da haruffa 8 ko fiye, da babban harafi, ƙaramin harafi, lamba, da alama.',
    rateLimited: 'An yi ƙoƙari da yawa. Jira kaɗan sannan a sake gwadawa.',
    network: 'Ba a samu haɗin intanet ba. A duba haɗin sannan a sake gwadawa.',
    generic: 'Ba a iya kammala wannan buƙatar ba. Da fatan a sake gwadawa.',
  },
  fr: {
    invalidCredentials: 'Adresse e-mail ou mot de passe incorrect.',
    emailNotConfirmed: 'Veuillez confirmer votre adresse e-mail avant de vous connecter.',
    alreadyRegistered: 'Un compte existe déjà avec cette adresse e-mail.',
    weakPassword: 'Utilisez au moins 8 caractères avec une majuscule, une minuscule, un chiffre et un symbole.',
    rateLimited: 'Trop de tentatives. Patientez un moment puis réessayez.',
    network: 'Connexion impossible. Vérifiez votre accès Internet et réessayez.',
    generic: 'Impossible de terminer cette demande. Veuillez réessayer.',
  },
} as const;

export function friendlyAuthError(rawMessage: unknown, lang: SupportedAuthLanguage = 'en'): string {
  const text = typeof rawMessage === 'string' ? rawMessage.toLowerCase() : '';
  const copy = messages[lang] ?? messages.en;

  if (text.includes('invalid login') || text.includes('invalid credentials') || text.includes('user not found')) {
    return copy.invalidCredentials;
  }
  if (text.includes('email not confirmed')) return copy.emailNotConfirmed;
  if (text.includes('already registered') || text.includes('user already')) return copy.alreadyRegistered;
  if (text.includes('password') || text.includes('weak')) return copy.weakPassword;
  if (text.includes('rate limit') || text.includes('too many')) return copy.rateLimited;
  if (text.includes('network') || text.includes('fetch') || text.includes('connection')) return copy.network;

  // Do not expose provider rules, regexes, internal identifiers, or backend details.
  return copy.generic;
}

export function isStrongPassword(password: string): boolean {
  return password.length >= 8
    && /[A-Z]/.test(password)
    && /[a-z]/.test(password)
    && /[0-9]/.test(password)
    && /[^A-Za-z0-9]/.test(password);
}
