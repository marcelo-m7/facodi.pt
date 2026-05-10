import type { Locale } from '../data/i18n';

export const LEGAL_VERSION = {
  privacyPolicy: '2026-05-10.1',
  termsOfService: '2026-05-10.1',
  cookiePolicy: '2026-05-10.1',
  cookieConsent: '2026-05-10.1',
} as const;

export type LegalDocumentType = 'privacy-policy' | 'terms-of-service' | 'cookie-policy';

export interface LegalSection {
  heading: string;
  body: string[];
}

export interface LegalDocumentContent {
  title: string;
  intro: string;
  effectiveDate: string;
  sections: LegalSection[];
}

export const LEGAL_CONTACT = {
  controllerName: 'Open2 Technology - FACODI',
  contactEmail: 'contact@open2.tech',
  contactUrl: 'https://open2.tech/contact',
};

const privacyPolicyPt: LegalDocumentContent = {
  title: 'Politica de Privacidade',
  intro: 'Processamos dados pessoais em conformidade com o Regulamento Geral sobre a Protecao de Dados (GDPR/RGPD) e com a legislacao de privacidade aplicavel na Uniao Europeia.',
  effectiveDate: '10 de Maio de 2026',
  sections: [
    {
      heading: '1. Responsavel pelo tratamento',
      body: [
        'Controlador: Open2 Technology - FACODI.',
        'Contacto: contact@open2.tech e pagina oficial de contacto da Open2 Technology.',
      ],
    },
    {
      heading: '2. Dados que recolhemos',
      body: [
        'Dados de conta: email, identificador de utilizador e metadados de autenticacao fornecidos pelo fornecedor de login.',
        'Dados de perfil: nome de exibicao, username, avatar e bio, quando preenchidos pelo utilizador.',
        'Dados de atividade: favoritos, progresso de playlists, historico de interacoes, candidaturas e submissoes realizadas na plataforma.',
      ],
    },
    {
      heading: '3. Finalidades do tratamento',
      body: [
        'Fornecer autenticacao segura, personalizacao da experiencia e funcionalidades academicas da plataforma.',
        'Manter integridade operacional, prevenir abuso e cumprir obrigacoes legais aplicaveis.',
        'Registar consentimentos e evidencias de aceite legal para efeitos de auditoria e conformidade.',
      ],
    },
    {
      heading: '4. Base legal',
      body: [
        'Execucao de contrato: acesso e utilizacao da conta FACODI.',
        'Interesse legitimo: seguranca, prevencao de fraude e melhoria operacional.',
        'Consentimento: cookies nao essenciais, preferencias opcionais e comunicacoes de marketing quando aplicavel.',
      ],
    },
    {
      heading: '5. Conservacao de dados',
      body: [
        'Dados de conta e perfil permanecem ativos enquanto a conta existir.',
        'Registos de consentimento podem ser mantidos para fins de auditoria legal mesmo apos atualizacoes de preferencias.',
        'Dados anonimizados ou agregados podem ser mantidos para analise tecnica e seguranca.',
      ],
    },
    {
      heading: '6. Terceiros e transferencias internacionais',
      body: [
        'Utilizamos prestadores tecnicos (ex.: Supabase) para autenticacao, base de dados e armazenamento operacional.',
        'Quando existir transferencia internacional de dados, aplicamos mecanismos contratuais adequados e medidas de seguranca proporcionais.',
      ],
    },
    {
      heading: '7. Cookies e tecnologias semelhantes',
      body: [
        'Usamos cookies e armazenamento local estritamente necessarios para funcionamento da plataforma.',
        'Cookies opcionais (analitica, marketing e preferencias) sao controlados por painel de consentimento granular.',
        'Pode alterar ou retirar consentimento a qualquer momento no painel de preferencias de cookies.',
      ],
    },
    {
      heading: '8. Direitos do titular (GDPR)',
      body: [
        'Direito de acesso, retificacao, apagamento, portabilidade, limitacao e oposicao.',
        'Pode solicitar correcao, exportacao ou eliminacao de dados pessoais a qualquer momento.',
        'Pedidos podem ser enviados para o contacto oficial indicado nesta politica.',
      ],
    },
    {
      heading: '9. Seguranca',
      body: [
        'Aplicamos controlos de acesso, politicas RLS, segregacao de privilegios e monitorizacao operacional.',
        'Apesar de medidas tecnicas e organizacionais, nenhum sistema e absolutamente isento de risco.',
      ],
    },
  ],
};

const privacyPolicyEn: LegalDocumentContent = {
  title: 'Privacy Policy',
  intro: 'We process personal data in accordance with the General Data Protection Regulation (GDPR) and applicable European Union privacy laws.',
  effectiveDate: 'May 10, 2026',
  sections: [
    {
      heading: '1. Data controller',
      body: [
        'Controller: Open2 Technology - FACODI.',
        'Contact: contact@open2.tech and the official Open2 Technology contact page.',
      ],
    },
    {
      heading: '2. Data we collect',
      body: [
        'Account data: email, user identifier, and authentication metadata provided by the selected login provider.',
        'Profile data: display name, username, avatar, and bio when provided by the user.',
        'Activity data: favorites, playlist progress, interaction history, applications, and submissions made on the platform.',
      ],
    },
    {
      heading: '3. Why we collect data',
      body: [
        'To provide secure authentication, personalized experience, and core academic platform features.',
        'To maintain operational integrity, prevent abuse, and comply with legal obligations.',
        'To store consent evidence and legal acceptance records for audit and compliance purposes.',
      ],
    },
    {
      heading: '4. Legal basis',
      body: [
        'Contract performance: account access and use of FACODI services.',
        'Legitimate interests: security, fraud prevention, and operational improvements.',
        'Consent: non-essential cookies, optional preferences, and marketing communications where applicable.',
      ],
    },
    {
      heading: '5. Retention periods',
      body: [
        'Account and profile data remain active while your account exists.',
        'Consent records may be retained for legal audit purposes even after preference updates.',
        'Anonymized or aggregated records may be retained for technical analytics and security.',
      ],
    },
    {
      heading: '6. Third parties and international transfers',
      body: [
        'We rely on technical providers (for example, Supabase) for authentication, database, and operational storage.',
        'When international transfers occur, we apply appropriate contractual safeguards and proportional security measures.',
      ],
    },
    {
      heading: '7. Cookies and tracking technologies',
      body: [
        'We use strictly necessary cookies and storage technologies required for platform operation.',
        'Optional categories (analytics, marketing, and preference cookies) are controlled by granular consent settings.',
        'You can change or withdraw consent at any time from the cookie preferences panel.',
      ],
    },
    {
      heading: '8. GDPR data subject rights',
      body: [
        'You may request access, rectification, deletion, portability, restriction, or objection.',
        'Users may request access, correction, export, or deletion of their personal data at any time.',
        'Requests can be submitted through the official contact channels listed in this policy.',
      ],
    },
    {
      heading: '9. Security measures',
      body: [
        'We apply access controls, RLS policies, privilege separation, and operational monitoring.',
        'Even with technical and organizational controls, no system can guarantee absolute risk elimination.',
      ],
    },
  ],
};

const termsPt: LegalDocumentContent = {
  title: 'Termos de Servico',
  intro: 'Ao utilizar a FACODI, concorda com estes Termos de Servico e com a Politica de Privacidade.',
  effectiveDate: '10 de Maio de 2026',
  sections: [
    {
      heading: '1. Uso da plataforma',
      body: [
        'A FACODI destina-se a aprendizagem aberta, curadoria academica e colaboracao comunitaria.',
        'O utilizador e responsavel por manter credenciais seguras e por utilizar a conta de forma licita.',
      ],
    },
    {
      heading: '2. Conduta e uso aceitavel',
      body: [
        'Nao e permitido publicar conteudo ilegal, abusivo, discriminatorio, enganoso ou que viole direitos de terceiros.',
        'Tentativas de comprometimento de seguranca, scraping abusivo e automatizacoes maliciosas podem resultar em bloqueio imediato.',
      ],
    },
    {
      heading: '3. Propriedade intelectual',
      body: [
        'Cada utilizador deve respeitar licencas e direitos autorais dos materiais que referencia ou submete.',
        'A FACODI pode remover conteudo quando houver indicios de violacao legal ou risco para a comunidade.',
      ],
    },
    {
      heading: '4. Disponibilidade do servico',
      body: [
        'Empenhamos esforcos razoaveis para manter disponibilidade, mas podem ocorrer interrupcoes planejadas ou incidentes.',
        'Funcionalidades podem ser alteradas para melhoria tecnica, seguranca ou cumprimento legal.',
      ],
    },
    {
      heading: '5. Limitacao de responsabilidade',
      body: [
        'A plataforma e fornecida no estado em que se encontra, dentro dos limites legais aplicaveis.',
        'Nao garantimos adequacao a todos os fins especificos fora do escopo educacional previsto.',
      ],
    },
    {
      heading: '6. Encerramento de conta',
      body: [
        'A conta pode ser suspensa ou encerrada em caso de violacao destes termos ou exigencia legal.',
        'O utilizador pode solicitar eliminacao permanente da conta conforme fluxo de apagamento disponibilizado na area de perfil.',
      ],
    },
    {
      heading: '7. Referencias legais e privacidade',
      body: [
        'O tratamento de dados pessoais segue a Politica de Privacidade e a legislacao aplicavel.',
        'Ao criar conta, o utilizador confirma ter lido e aceite os documentos legais vigentes.',
      ],
    },
  ],
};

const termsEn: LegalDocumentContent = {
  title: 'Terms of Service',
  intro: 'By using FACODI, you agree to these Terms of Service and to the Privacy Policy.',
  effectiveDate: 'May 10, 2026',
  sections: [
    {
      heading: '1. Platform usage',
      body: [
        'FACODI is intended for open learning, academic curation, and community collaboration.',
        'Users are responsible for credential security and lawful account usage.',
      ],
    },
    {
      heading: '2. Acceptable use',
      body: [
        'Publishing illegal, abusive, discriminatory, deceptive, or rights-infringing content is prohibited.',
        'Security abuse attempts, malicious automation, and harmful scraping may lead to immediate access restriction.',
      ],
    },
    {
      heading: '3. Intellectual property',
      body: [
        'Users must respect copyrights and licenses of referenced or submitted materials.',
        'FACODI may remove content where there is legal infringement risk or community harm.',
      ],
    },
    {
      heading: '4. Service availability',
      body: [
        'We use reasonable efforts to maintain availability; planned maintenance and incidents may occur.',
        'Features may change to improve security, legal compliance, and platform quality.',
      ],
    },
    {
      heading: '5. Limitation of liability',
      body: [
        'The service is provided as available, within applicable legal limits.',
        'We do not guarantee suitability for every specific purpose outside the intended educational scope.',
      ],
    },
    {
      heading: '6. Account suspension and termination',
      body: [
        'Accounts may be suspended or terminated for violations of these terms or legal obligations.',
        'Users may request permanent account deletion through the profile deletion flow.',
      ],
    },
    {
      heading: '7. Privacy references',
      body: [
        'Personal data processing follows the Privacy Policy and applicable law.',
        'By creating an account, users confirm they read and accepted the current legal documents.',
      ],
    },
  ],
};

const cookiePt: LegalDocumentContent = {
  title: 'Politica de Cookies',
  intro: 'Esta politica explica como a FACODI usa cookies e tecnologias semelhantes em conformidade com o GDPR e a Diretiva ePrivacy.',
  effectiveDate: '10 de Maio de 2026',
  sections: [
    {
      heading: '1. O que sao cookies',
      body: [
        'Cookies e tecnologias semelhantes armazenam pequenos dados no navegador para suportar funcionalidades essenciais e preferencias.',
      ],
    },
    {
      heading: '2. Categorias utilizadas',
      body: [
        'Necessarios: essenciais para autenticacao, seguranca e funcionamento basico da plataforma.',
        'Preferencias: guardam idioma, tema e escolhas de interface.',
        'Analitica: medicao agregada de utilizacao quando ativada.',
        'Marketing: comunicacoes promocionais e segmentacao quando ativada.',
      ],
    },
    {
      heading: '3. Retencao',
      body: [
        'Duracoes variam por categoria e finalidade tecnica.',
        'Registos de consentimento podem ser mantidos para demonstrar conformidade legal.',
      ],
    },
    {
      heading: '4. Prestadores terceiros',
      body: [
        'A infraestrutura pode incluir fornecedores tecnicos para autenticacao, base de dados e hospedagem.',
        'Quando terceiros processam dados em nosso nome, aplicamos salvaguardas adequadas.',
      ],
    },
    {
      heading: '5. Gestao de consentimento',
      body: [
        'Pode alterar ou retirar o consentimento a qualquer momento no painel de preferencias de cookies.',
        'A recusa de cookies nao essenciais nao impede o uso das funcionalidades nucleares da plataforma.',
      ],
    },
  ],
};

const cookieEn: LegalDocumentContent = {
  title: 'Cookie Policy',
  intro: 'This policy explains how FACODI uses cookies and similar technologies in accordance with GDPR and the ePrivacy Directive.',
  effectiveDate: 'May 10, 2026',
  sections: [
    {
      heading: '1. What cookies are',
      body: [
        'Cookies and similar technologies store small browser data to support essential functionality and user preferences.',
      ],
    },
    {
      heading: '2. Cookie categories',
      body: [
        'Necessary: required for authentication, security, and core platform operation.',
        'Preference: stores language, theme, and interface choices.',
        'Analytics: aggregated usage measurement when enabled.',
        'Marketing: promotional communications and targeting when enabled.',
      ],
    },
    {
      heading: '3. Retention periods',
      body: [
        'Retention duration varies by category and technical purpose.',
        'Consent records may be retained to demonstrate legal compliance.',
      ],
    },
    {
      heading: '4. Third-party providers',
      body: [
        'Infrastructure may include technical providers for authentication, database, and hosting services.',
        'Where third parties process data on our behalf, appropriate safeguards are applied.',
      ],
    },
    {
      heading: '5. Consent management',
      body: [
        'You can change or withdraw consent at any time through the cookie preferences panel.',
        'Rejecting non-essential cookies does not block core platform functionality.',
      ],
    },
  ],
};

const DOCUMENTS: Record<LegalDocumentType, Record<Locale, LegalDocumentContent>> = {
  'privacy-policy': {
    pt: privacyPolicyPt,
    en: privacyPolicyEn,
  },
  'terms-of-service': {
    pt: termsPt,
    en: termsEn,
  },
  'cookie-policy': {
    pt: cookiePt,
    en: cookieEn,
  },
};

export function getLegalDocument(document: LegalDocumentType, locale: Locale): LegalDocumentContent {
  return DOCUMENTS[document][locale];
}
