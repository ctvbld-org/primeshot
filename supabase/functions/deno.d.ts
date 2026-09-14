/** Editor types for Supabase Edge Functions (Deno runtime). */
declare namespace Deno {
  namespace env {
    function get(key: string): string | undefined;
    function set(key: string, value: string): void;
    function delete(key: string): void;
    function toObject(): { [key: string]: string };
  }
}
