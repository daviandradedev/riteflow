const pt = {
  preferences: "Preferências",
  contact: "Contato",
  login: "Entrar",
  signOut: "Sair",
  profile: "Perfil no daviandrade auth",
  opensInNewTab: "Abre em uma nova aba",
  skipToContent: "Ir para o conteúdo principal",
  toLight: "Ativar tema claro",
  toDark: "Ativar tema escuro",
  langPt: "Idioma: Português",
  langEn: "Idioma: Inglês",
  darkTheme: "Tema escuro",
  siteHeader: "Cabeçalho do site",
  footerCredit: "Davi Andrade. Relatórios e reuniões de equipe.",
  footerSocial: "Redes sociais",
  appMark: "RITEFLOW",
  exploreEyebrow: "Modo visitante",
  exploreTitle: "Explore livremente, entre para salvar",
  exploreBody:
    "Você pode enviar sprints, rodar cerimônias e gerar relatórios sem fazer login, mas sem conta os dados não sincronizam na nuvem. Entre com sua conta daviandrade.dev para manter seu workspace salvo.",
  visitorBannerText:
    "Modo visitante: você pode testar tudo agora, mas os dados só ficam sincronizados na conta após fazer login.",
  signInToSave: "Entrar para salvar",
  exploreContinue: "Continuar sem salvar",
  closeNotice: "Fechar aviso",
  quickNav: "Atalhos do Riteflow",
  openMenu: "Abrir menu",
  closeMenu: "Fechar menu",
  navigation: "Navegação",
  quickJump: "Busca rápida",
  commandPlaceholder: "Ir para página ou ação…",
  commandEmpty: "Nenhum resultado encontrado.",
  groupNavigation: "Fluxo da sprint",
  groupActions: "Ações rápidas",
  actionToggleTheme: "Alternar tema claro/escuro",
  actionToggleLanguage: "Trocar idioma (PT/EN)",
  actionPortfolio: "Abrir daviandrade.dev",
  actionContact: "Abrir contato",
};

const en: { [K in keyof typeof pt]: string } = {
  preferences: "Preferences",
  contact: "Contact",
  login: "Sign in",
  signOut: "Sign out",
  profile: "Profile on daviandrade auth",
  opensInNewTab: "Opens in a new tab",
  skipToContent: "Skip to main content",
  toLight: "Switch to light theme",
  toDark: "Switch to dark theme",
  langPt: "Language: Portuguese",
  langEn: "Language: English",
  darkTheme: "Dark theme",
  siteHeader: "Site header",
  footerCredit: "Davi Andrade. Team reports and meetings.",
  footerSocial: "Social links",
  appMark: "RITEFLOW",
  exploreEyebrow: "Visitor mode",
  exploreTitle: "Explore freely, sign in to save",
  exploreBody:
    "You can upload sprints, run ceremonies, and generate reports without signing in, but without an account your data is not synced to the cloud. Sign in with your daviandrade.dev account to keep your workspace saved.",
  visitorBannerText:
    "Visitor mode: you can try everything now, but data is synced to your account only after signing in.",
  signInToSave: "Sign in to save",
  exploreContinue: "Continue without saving",
  closeNotice: "Dismiss notice",
  quickNav: "Riteflow shortcuts",
  openMenu: "Open menu",
  closeMenu: "Close menu",
  navigation: "Navigation",
  quickJump: "Quick jump",
  commandPlaceholder: "Jump to page or action…",
  commandEmpty: "No matching commands.",
  groupNavigation: "Sprint flow",
  groupActions: "Quick actions",
  actionToggleTheme: "Toggle light/dark theme",
  actionToggleLanguage: "Switch language (PT/EN)",
  actionPortfolio: "Open daviandrade.dev",
  actionContact: "Open contact",
};

export type Language = "en" | "pt";
export type CopyKey = keyof typeof pt;

export function translate(
  language: Language,
  key: CopyKey,
  vars?: Record<string, string | number>,
) {
  let text = (language === "pt" ? pt : en)[key];
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replace(`{${name}}`, String(value));
    }
  }
  return text;
}
