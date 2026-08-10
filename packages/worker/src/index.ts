import { APP_NAME } from '@theobase/shared';

export default {
  async fetch(_request: Request): Promise<Response> {
    return new Response(`Hello from ${APP_NAME} Worker!`, {
      headers: { 'Content-Type': 'text/plain' },
    });
  },
} satisfies ExportedHandler;
