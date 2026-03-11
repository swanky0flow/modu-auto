import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';

export default {
  output: 'hybrid',
  adapter: cloudflare({
    imageService: true,
  }),
  integrations: [react()],
  srcDir: 'src',
  server: {
    host: true
  }
};
