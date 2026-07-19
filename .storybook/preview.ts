import type { Preview } from '@storybook/react';
import { withStoryComments } from '../src/storybook-comment-addon/preview';
import '../src/styles.css';
import '../src/theme.css';

const preview: Preview = {
  decorators: [withStoryComments],
  parameters: {
    layout: 'fullscreen',
    controls: { expanded: true },
    options: {
      storySort: {
        order: ['アプリ', 'コンポーネント', 'ユーザーストーリー'],
      },
    },
  },
};

export default preview;
