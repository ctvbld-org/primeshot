import { render } from "npm:@react-email/render";
import WelcomeEmail, { type WelcomeEmailProps } from "./welcome.tsx";

export type EmailOverrides = {
  subject?: string;
  text?: string;
  html?: string;
  name?: string;
};

export function renderWelcomeEmail(
  params: { name?: string; userId?: string },
  overrides: EmailOverrides = {}
) {
  const finalName = overrides.name ?? params.name;
  const subject = overrides.subject ?? `Welcome to Primeshot, ${finalName ?? "there"}!`;
  const component = WelcomeEmail({ name: finalName, userId: params.userId } as WelcomeEmailProps);
  const html = overrides.html ?? render(component);
  const text = overrides.text ?? render(component, { plainText: true });
  return { subject, html, text };
}


