// @ts-ignore - Deno TS extension import
export { renderWelcomeEmail } from './welcome/template.ts';

// @ts-ignore - Deno TS extension import
import { renderWelcomeEmail } from './welcome/template.ts';

type TemplateKey = 'welcome';

const registry = {
  welcome: renderWelcomeEmail,
} as const;

export function renderEmail<T extends TemplateKey>(
  template: T,
  params: any,
  overrides?: any
) {
  return registry[template](params, overrides);
}


